// IA gratuita que roda no próprio aparelho (WebGPU), sem chave e sem servidor.
// O modelo é baixado uma vez do Hugging Face e fica guardado no navegador.

import type { MLCEngineInterface, InitProgressReport } from "@mlc-ai/web-llm";

export const LOCAL_MODELS = [
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", name: "Mínimo", size: "≈ 0,5 GB", note: "para celulares fracos: responde, mas bem simples" },
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", name: "Leve", size: "≈ 1 GB", note: "para celulares e computadores simples" },
  { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", name: "Equilibrado", size: "≈ 2 GB", note: "recomendado: escreve melhor" },
  { id: "Qwen2.5-7B-Instruct-q4f16_1-MLC", name: "Caprichado", size: "≈ 5 GB", note: "só para computadores com placa de vídeo boa" },
] as const;

/** Modelo sugerido para este aparelho: celular fica com o Leve; computador, com o Equilibrado. */
export function suggestedLocalModel(): string {
  const mobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const mem = (typeof navigator !== "undefined" && (navigator as { deviceMemory?: number }).deviceMemory) || 8;
  // No celular, o Mínimo: os maiores podem esgotar a memória e o navegador reinicia a página
  if (mobile) return LOCAL_MODELS[0].id;
  if (mem <= 4) return LOCAL_MODELS[1].id;
  return LOCAL_MODELS[2].id;
}

// ---------- Proteção contra travamentos ----------
// Antes de usar a IA, marcamos "em uso". Se a página reabrir com a marca ainda lá, o aparelho
// travou no meio (falta de memória). Aí trocamos para um modelo menor ou desligamos a IA.
const BUSY = "persuasao:ai-busy";
let depth = 0;

export function markBusy(on: boolean) {
  depth = Math.max(0, depth + (on ? 1 : -1));
  try {
    if (depth > 0) localStorage.setItem(BUSY, String(Date.now()));
    else localStorage.removeItem(BUSY);
  } catch {
    /* sem armazenamento */
  }
}

export function crashedLastTime(): boolean {
  try {
    const v = localStorage.getItem(BUSY);
    localStorage.removeItem(BUSY);
    return !!v;
  } catch {
    return false;
  }
}

export interface LocalMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Gancho de teste: um modelo falso pode ser posto em window.__persuasaoFakeLLM. */
interface FakeLLM {
  reply: (messages: LocalMessage[]) => string;
}

let engine: MLCEngineInterface | null = null;
let loaded = "";
let loading: Promise<MLCEngineInterface> | null = null;

export function hasWebGPU(): boolean {
  if ((globalThis as { __persuasaoFakeLLM?: FakeLLM }).__persuasaoFakeLLM) return true;
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export async function isDownloaded(model: string): Promise<boolean> {
  if ((globalThis as { __persuasaoFakeLLM?: FakeLLM }).__persuasaoFakeLLM) return true;
  try {
    const { hasModelInCache } = await import("@mlc-ai/web-llm");
    return await hasModelInCache(model);
  } catch {
    return false;
  }
}

/** Baixa (se preciso) e carrega o modelo. `onProgress` recebe 0–1 e um texto. */
export async function loadLocal(model: string, onProgress?: (p: number, text: string) => void): Promise<MLCEngineInterface | null> {
  if ((globalThis as { __persuasaoFakeLLM?: FakeLLM }).__persuasaoFakeLLM) {
    onProgress?.(1, "pronto");
    return null;
  }
  if (engine && loaded === model) return engine;
  if (loading && loaded === model) return loading;
  const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
  if (engine) {
    await engine.unload();
    engine = null;
  }
  loaded = model;
  markBusy(true);
  // Janela de contexto menor = muito menos memória (celulares fechavam a página por falta de memória)
  loading = CreateWebWorkerMLCEngine(
    new Worker(new URL("./llm-worker.ts", import.meta.url), { type: "module" }),
    model,
    { initProgressCallback: (r: InitProgressReport) => onProgress?.(r.progress, r.text) },
    { context_window_size: 2048 },
  );
  try {
    engine = await loading;
    return engine;
  } catch (e) {
    loaded = "";
    throw e;
  } finally {
    loading = null;
    markBusy(false);
  }
}

export async function removeLocal(model: string) {
  try {
    const { deleteModelAllInfoInCache } = await import("@mlc-ai/web-llm");
    if (engine && loaded === model) {
      await engine.unload();
      engine = null;
      loaded = "";
    }
    await deleteModelAllInfoInCache(model);
  } catch {
    /* nada para apagar */
  }
}

/** Gera a resposta em pedaços (streaming). */
export async function localComplete(model: string, messages: LocalMessage[], onText: (t: string) => void, onStatus?: (t: string) => void): Promise<string> {
  const fake = (globalThis as { __persuasaoFakeLLM?: FakeLLM }).__persuasaoFakeLLM;
  if (fake) {
    const full = fake.reply(messages);
    let acc = "";
    for (const part of full.match(/.{1,10}/g) ?? []) {
      acc += part;
      onText(acc);
      await new Promise((r) => setTimeout(r, 15));
    }
    return full;
  }
  markBusy(true);
  try {
    return await generate(model, messages, onText, onStatus);
  } finally {
    markBusy(false);
  }
}

async function generate(model: string, messages: LocalMessage[], onText: (t: string) => void, onStatus?: (t: string) => void): Promise<string> {
  const eng = await loadLocal(model, (p, t) => onStatus?.(p < 1 ? `Carregando a IA… ${Math.round(p * 100)}%` : t));
  onStatus?.("");
  const stream = await eng!.chat.completions.create({ messages, stream: true, temperature: 0.8, top_p: 0.9, max_tokens: 140 });
  let text = "";
  let last = 0;
  for await (const chunk of stream) {
    text += chunk.choices[0]?.delta?.content ?? "";
    // Atualiza a tela no máximo ~8 vezes por segundo (menos peso no celular)
    const now = Date.now();
    if (now - last > 120) {
      last = now;
      onText(text);
    }
  }
  onText(text);
  return text;
}
