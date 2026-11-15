/// <reference lib="webworker" />
// IA no próprio aparelho (Transformers.js): visão (CLIP), fala (Whisper) e tradução (NLLB).
// Roda num worker para não travar a interface. Os modelos são baixados uma vez e ficam no cache.

import { AutoProcessor, AutoTokenizer, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage, Tensor, env, pipeline } from "@huggingface/transformers";

env.allowLocalModels = false;

type Device = "webgpu" | "wasm";

export type AiRequest =
  | { kind: "clip-load"; id: number; device: Device; prompts: { category: string; text: string }[] }
  | { kind: "clip-classify"; id: number; images: { data: Uint8ClampedArray; width: number; height: number }[] }
  | { kind: "asr"; id: number; device: Device; model: string; audio: Float32Array; language?: string; task: "transcribe" | "translate" }
  | { kind: "translate"; id: number; texts: string[]; src: string; tgt: string };

export type AiResponse =
  | { kind: "done"; id: number; result: unknown }
  | { kind: "error"; id: number; message: string }
  | { kind: "progress"; id: number; file: string; loaded: number; total: number; status: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function progressFor(id: number) {
  return (p: { status: string; file?: string; loaded?: number; total?: number }) => {
    ctx.postMessage({ kind: "progress", id, file: p.file ?? "", loaded: p.loaded ?? 0, total: p.total ?? 0, status: p.status } satisfies AiResponse);
  };
}

// ---------- Visão (CLIP) ----------

const CLIP_ID = "Xenova/clip-vit-base-patch32";
let clip: {
  processor: Awaited<ReturnType<typeof AutoProcessor.from_pretrained>>;
  vision: Awaited<ReturnType<typeof CLIPVisionModelWithProjection.from_pretrained>>;
  textEmb: Float32Array[];
  categories: string[];
} | null = null;

function normalize(v: Float32Array): Float32Array {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}

async function clipLoad(id: number, device: Device, prompts: { category: string; text: string }[]) {
  if (clip) return true;
  const dtype = device === "webgpu" ? "fp32" : "q8";
  const progress_callback = progressFor(id);
  const processor = await AutoProcessor.from_pretrained(CLIP_ID, { progress_callback });
  const tokenizer = await AutoTokenizer.from_pretrained(CLIP_ID, { progress_callback });
  const textModel = await CLIPTextModelWithProjection.from_pretrained(CLIP_ID, { device, dtype, progress_callback });
  const vision = await CLIPVisionModelWithProjection.from_pretrained(CLIP_ID, { device, dtype, progress_callback });
  const inputs = tokenizer(
    prompts.map((p) => p.text),
    { padding: true, truncation: true },
  );
  const { text_embeds } = await textModel(inputs);
  const dim = text_embeds.dims[1];
  const data = text_embeds.data as Float32Array;
  const textEmb = prompts.map((_, i) => normalize(data.slice(i * dim, (i + 1) * dim)));
  await textModel.dispose();
  clip = { processor, vision, textEmb, categories: prompts.map((p) => p.category) };
  return true;
}

async function clipClassify(images: { data: Uint8ClampedArray; width: number; height: number }[]) {
  if (!clip) throw new Error("Modelo de visão não carregado");
  const raws = images.map((im) => new RawImage(im.data, im.width, im.height, 4));
  const inputs = await clip.processor(raws);
  const { image_embeds } = await clip.vision(inputs);
  const dim = image_embeds.dims[1];
  const data = image_embeds.data as Float32Array;
  const results: Record<string, number>[] = [];
  for (let i = 0; i < images.length; i++) {
    const img = normalize(data.slice(i * dim, (i + 1) * dim));
    // Similaridade × 100 (escala do CLIP) → softmax entre todas as frases
    const logits = clip.textEmb.map((t) => {
      let s = 0;
      for (let k = 0; k < dim; k++) s += img[k] * t[k];
      return s * 100;
    });
    const max = Math.max(...logits);
    const exps = logits.map((l) => Math.exp(l - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    const out: Record<string, number> = {};
    exps.forEach((e, k) => {
      const c = clip!.categories[k];
      out[c] = (out[c] ?? 0) + e / sum;
    });
    results.push(out);
  }
  return results;
}

// ---------- Fala (Whisper) ----------

interface AsrPipeline {
  (audio: Float32Array, opts: Record<string, unknown>): Promise<unknown>;
  model: (inputs: Record<string, unknown>) => Promise<{ logits: { data: Float32Array; dims: number[] } }>;
  processor: (audio: Float32Array) => Promise<{ input_features: unknown }>;
  tokenizer: { model: { tokens_to_ids: Map<string, number> } };
}

let asr: { model: string; device: Device; run: AsrPipeline } | null = null;

/** Códigos que o app oferece e o nome que o Whisper usa para cada um. */
const LANGS: Record<string, string> = { pt: "portuguese", en: "english", es: "spanish", fr: "french", de: "german", it: "italian", ru: "russian", ja: "japanese", ko: "korean", zh: "chinese", ar: "arabic", hi: "hindi" };

/**
 * Detecta o idioma falado como o Whisper original faz: um passo do decodificador depois de
 * <|startoftranscript|> e a maior probabilidade entre os símbolos de idioma.
 * (A biblioteca assume inglês quando o idioma não é informado.)
 */
async function detectLanguage(p: AsrPipeline, audio: Float32Array): Promise<string> {
  const slice = audio.subarray(0, Math.min(audio.length, 16000 * 30));
  const { input_features } = await p.processor(slice);
  const ids = p.tokenizer.model.tokens_to_ids;
  const sot = ids.get("<|startoftranscript|>");
  if (sot === undefined) return "en";
  const decoder_input_ids = new Tensor("int64", BigInt64Array.from([BigInt(sot)]), [1, 1]);
  const out = await p.model({ input_features, decoder_input_ids });
  const vocab = out.logits.dims[out.logits.dims.length - 1];
  const data = out.logits.data;
  const base = data.length - vocab;
  let best = "en";
  let bestV = -Infinity;
  for (const code of Object.keys(LANGS)) {
    const id = ids.get(`<|${code}|>`);
    if (id === undefined) continue;
    const v = data[base + id];
    if (v > bestV) ((bestV = v), (best = code));
  }
  return best;
}

async function transcribe(id: number, device: Device, model: string, audio: Float32Array, language: string | undefined, task: "transcribe" | "translate") {
  if (!asr || asr.model !== model || asr.device !== device) {
    const dtype = device === "webgpu" ? { encoder_model: "fp32", decoder_model_merged: "q4" } : "q8";
    const p = await pipeline("automatic-speech-recognition", model, { device, dtype: dtype as never, progress_callback: progressFor(id) });
    asr = { model, device, run: p as unknown as AsrPipeline };
  }
  let lang = language;
  let detected: string | null = null;
  if (!lang) {
    try {
      detected = await detectLanguage(asr.run, audio);
      lang = LANGS[detected];
    } catch {
      lang = undefined;
    }
  }
  const out = (await asr.run(audio, { chunk_length_s: 30, stride_length_s: 5, return_timestamps: true, task, ...(lang ? { language: lang } : {}) })) as { text: string; chunks?: { text: string; timestamp: [number, number | null] }[] };
  return { text: out.text, detected, chunks: (out.chunks ?? []).map((c) => ({ text: c.text, start: c.timestamp[0] ?? 0, end: c.timestamp[1] ?? (c.timestamp[0] ?? 0) + 2 })) };
}

// ---------- Tradução (NLLB) ----------

let translator: ((texts: string[], opts: Record<string, unknown>) => Promise<unknown>) | null = null;

async function translate(id: number, texts: string[], src: string, tgt: string) {
  if (!translator) {
    const p = await pipeline("translation", "Xenova/nllb-200-distilled-600M", { dtype: "q8", device: "wasm", progress_callback: progressFor(id) });
    translator = p as unknown as (t: string[], o: Record<string, unknown>) => Promise<unknown>;
  }
  const out: string[] = [];
  // Lotes pequenos: menos memória e progresso visível
  for (let i = 0; i < texts.length; i += 8) {
    const batch = texts.slice(i, i + 8);
    const res = (await translator(batch, { src_lang: src, tgt_lang: tgt })) as { translation_text: string }[];
    out.push(...res.map((r) => r.translation_text));
    ctx.postMessage({ kind: "progress", id, file: "tradução", loaded: Math.min(texts.length, i + 8), total: texts.length, status: "translating" } satisfies AiResponse);
  }
  return out;
}

ctx.onmessage = async (e: MessageEvent<AiRequest>) => {
  const req = e.data;
  try {
    let result: unknown;
    if (req.kind === "clip-load") result = await clipLoad(req.id, req.device, req.prompts);
    else if (req.kind === "clip-classify") result = await clipClassify(req.images);
    else if (req.kind === "asr") result = await transcribe(req.id, req.device, req.model, req.audio, req.language, req.task);
    else if (req.kind === "translate") result = await translate(req.id, req.texts, req.src, req.tgt);
    ctx.postMessage({ kind: "done", id: req.id, result } satisfies AiResponse);
  } catch (err) {
    ctx.postMessage({ kind: "error", id: req.id, message: err instanceof Error ? err.message : String(err) } satisfies AiResponse);
  }
};
