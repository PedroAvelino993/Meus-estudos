// Cliente do worker de IA: pedidos com promessa e progresso de download dos modelos.

import type { AiRequest, AiResponse } from "./ai-worker";
import { CATEGORIES } from "../core/categories";
import type { Category } from "../core/types";
import { capabilities } from "./probe";

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void; onProgress?: (p: ModelProgress) => void };

export interface ModelProgress {
  file: string;
  loaded: number;
  total: number;
  status: string;
}

let worker: Worker | null = null;
let seq = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./ai-worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent<AiResponse>) => {
    const msg = e.data;
    const p = pending.get(msg.id);
    if (!p) return;
    if (msg.kind === "progress") p.onProgress?.({ file: msg.file, loaded: msg.loaded, total: msg.total, status: msg.status });
    else if (msg.kind === "done") {
      pending.delete(msg.id);
      p.resolve(msg.result);
    } else {
      pending.delete(msg.id);
      p.reject(new Error(msg.message));
    }
  };
  worker.onerror = (e) => {
    for (const [, p] of pending) p.reject(new Error(e.message || "Falha no worker de IA"));
    pending.clear();
  };
  return worker;
}

type Req = AiRequest extends infer R ? (R extends { id: number } ? Omit<R, "id"> : never) : never;

function call<T>(req: Req, onProgress?: (p: ModelProgress) => void, transfer: Transferable[] = []): Promise<T> {
  const id = seq++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress });
    getWorker().postMessage({ ...req, id }, transfer);
  });
}

export async function aiDevice(): Promise<"webgpu" | "wasm"> {
  const pref = localStorage.getItem("gca:device");
  if (pref === "wasm") return "wasm";
  return (await capabilities()).webgpu ? "webgpu" : "wasm";
}

let clipReady: Promise<boolean> | null = null;

export function loadVision(onProgress?: (p: ModelProgress) => void): Promise<boolean> {
  if (clipReady) return clipReady;
  clipReady = (async () => {
    const device = await aiDevice();
    const prompts = CATEGORIES.flatMap((c) => c.prompts.map((text) => ({ category: c.id, text })));
    return call<boolean>({ kind: "clip-load", device, prompts }, onProgress);
  })();
  clipReady.catch(() => (clipReady = null));
  return clipReady;
}

export function classifyFrames(images: ImageData[]): Promise<Partial<Record<Category, number>>[]> {
  const payload = images.map((im) => ({ data: im.data, width: im.width, height: im.height }));
  return call({ kind: "clip-classify", images: payload }, undefined, payload.map((p) => p.data.buffer));
}

export const WHISPER_MODELS = [
  { id: "onnx-community/whisper-tiny", name: "Rápido (tiny, ~40 MB)" },
  { id: "onnx-community/whisper-base", name: "Equilibrado (base, ~80 MB)" },
  { id: "onnx-community/whisper-small", name: "Preciso (small, ~250 MB)" },
];

export async function transcribe(audio16k: Float32Array, opts: { model: string; language?: string; task?: "transcribe" | "translate" }, onProgress?: (p: ModelProgress) => void): Promise<{ text: string; detected: string | null; chunks: { text: string; start: number; end: number }[] }> {
  const device = await aiDevice();
  return call({ kind: "asr", device, model: opts.model, audio: audio16k, language: opts.language, task: opts.task ?? "transcribe" }, onProgress, [audio16k.buffer]);
}

export function translateLocal(texts: string[], src: string, tgt: string, onProgress?: (p: ModelProgress) => void): Promise<string[]> {
  return call({ kind: "translate", texts, src, tgt }, onProgress);
}

/** Nomes que o Whisper usa para o parâmetro de idioma. */
export const WHISPER_LANG: Record<string, string> = { pt: "portuguese", en: "english", es: "spanish", fr: "french", de: "german", it: "italian", ru: "russian", ja: "japanese", ko: "korean", zh: "chinese", ar: "arabic", hi: "hindi" };
