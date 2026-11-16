// Leitura de quadros do vídeo original com plano B automático.
//
// Ordem de tentativas quando o decodificador falha («Decoder failure», travamento, codec recusado):
//   1. WebCodecs com aceleração de hardware (mais rápido)
//   2. WebCodecs por software (funciona quando o chip de vídeo do celular recusa ou está ocupado)
//   3. Player de vídeo do próprio navegador (mais lento, mas lê praticamente qualquer vídeo que ele toca)
// O processamento continua do quadro onde parou; nada é refeito.

import { AudioBufferSink, CanvasSink, type InputAudioTrack, type InputVideoTrack, type WrappedAudioBuffer } from "mediabunny";
import { StallError, guarded, logError } from "./device";

export type DecodeMode = "hardware" | "software" | "element";

export interface Frame {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  width: number;
  height: number;
  timestamp: number;
}

export interface FrameReadOptions {
  /** Tamanho fixo (esticado) ou só a altura (mantém a proporção). */
  width?: number;
  height?: number;
  fill?: boolean;
  poolSize?: number;
  /** Limite de espera por quadro. */
  timeout?: number;
  what?: string;
  signal?: AbortSignal;
  /** Avisado quando o app troca de método de leitura. */
  onFallback?: (mode: DecodeMode, reason: string) => void;
}

const KEY = "gca:decoder";
let sessionMode: DecodeMode | null = null;

/** Método inicial: o que funcionou da última vez neste aparelho. */
export function preferredDecode(): DecodeMode {
  if (sessionMode) return sessionMode;
  const s = localStorage.getItem(KEY);
  return s === "software" || s === "element" ? s : "hardware";
}

export function resetDecodePreference() {
  sessionMode = null;
  localStorage.removeItem(KEY);
}

function remember(m: DecodeMode) {
  sessionMode = m;
  try {
    localStorage.setItem(KEY, m);
  } catch {
    /* ignora */
  }
}

const NEXT: Record<DecodeMode, DecodeMode | null> = { hardware: "software", software: "element", element: null };

export const MODE_LABEL: Record<DecodeMode, string> = {
  hardware: "decodificação por hardware",
  software: "decodificação por software",
  element: "player do navegador (modo compatível)",
};

function isAbort(e: unknown) {
  return e instanceof DOMException && e.name === "AbortError";
}

function waitVisible(): Promise<void> {
  if (!document.hidden) return Promise.resolve();
  return new Promise((r) => {
    const on = () => {
      if (!document.hidden) {
        document.removeEventListener("visibilitychange", on);
        r();
      }
    };
    document.addEventListener("visibilitychange", on);
  });
}

/** Mensagem compreensível quando nenhum método consegue ler o vídeo. */
export function decodeErrorMessage(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  return `O aparelho não conseguiu ler este vídeo (${m}). Tentei o decodificador de hardware, o de software e o player do navegador. Converta o vídeo para MP4 (H.264, 1080p, 30 ou 60 FPS) e tente de novo; gravações em HEVC/H.265, HDR ou 10 bits costumam causar isso.`;
}

/**
 * Lê um quadro para cada instante pedido (na ordem). Devolve `null` quando não há quadro.
 * Troca de método sozinho se o decodificador falhar, retomando do ponto em que parou.
 */
export async function* readFrames(track: InputVideoTrack, file: Blob, times: number[], opts: FrameReadOptions = {}): AsyncGenerator<Frame | null> {
  let mode = preferredDecode();
  let idx = 0;
  let hiddenRetries = 0;
  const timeout = opts.timeout ?? 60_000;
  const what = opts.what ?? "O decodificador de vídeo";
  while (idx < times.length) {
    try {
      const rest = times.slice(idx);
      const src = mode === "element" ? elementFrames(file, rest, opts) : sinkFrames(track, rest, mode, opts);
      for await (const f of guarded(src, mode === "element" ? Math.max(timeout, 90_000) : timeout, what)) {
        idx++;
        yield f;
      }
      return;
    } catch (e) {
      if (isAbort(e) || opts.signal?.aborted) throw e;
      // App em segundo plano: o navegador toma o decodificador de volta. Espera voltar e tenta igual.
      if (document.hidden && hiddenRetries < 5) {
        hiddenRetries++;
        logError(`leitura de vídeo (${mode}, segundo plano)`, e);
        await waitVisible();
        continue;
      }
      const next = NEXT[mode];
      logError(`leitura de vídeo (${mode})`, e);
      if (!next) throw new Error(decodeErrorMessage(e));
      mode = next;
      remember(next);
      opts.onFallback?.(next, e instanceof Error ? e.message : String(e));
    }
  }
}

async function* sinkFrames(track: InputVideoTrack, times: number[], mode: DecodeMode, opts: FrameReadOptions): AsyncGenerator<Frame | null> {
  const sink = new CanvasSink(track, {
    ...(opts.width ? { width: opts.width } : {}),
    ...(opts.height ? { height: opts.height } : {}),
    ...(opts.fill ? { fit: "fill" as const } : {}),
    poolSize: opts.poolSize ?? 2,
    ...(mode === "software" ? { decoderOptions: { hardwareAcceleration: "prefer-software" as const } } : {}),
  });
  for await (const w of sink.canvasesAtTimestamps(times)) {
    yield w ? { canvas: w.canvas, width: w.canvas.width, height: w.canvas.height, timestamp: w.timestamp } : null;
  }
}

// ---------- Plano C: o player de vídeo do navegador ----------

function once(v: HTMLVideoElement, ev: string, ms: number, what: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = (err?: Error) => {
      clearTimeout(timer);
      v.removeEventListener(ev, ok);
      v.removeEventListener("error", bad);
      if (err) reject(err);
      else resolve();
    };
    const ok = () => done();
    const bad = () => done(new Error(v.error?.message || `erro ${v.error?.code ?? "?"} do player`));
    const timer = setTimeout(() => done(new StallError(what)), ms);
    v.addEventListener(ev, ok);
    v.addEventListener("error", bad);
  });
}

async function seek(v: HTMLVideoElement, t: number) {
  const target = Math.max(0, Math.min(t, (v.duration || t) - 0.001));
  if (Math.abs(v.currentTime - target) < 0.0005 && v.readyState >= 2) return;
  const p = once(v, "seeked", 20_000, "A busca no vídeo");
  v.currentTime = target;
  await p;
}

type RVFC = (cb: (now: number, meta: { mediaTime: number }) => void) => number;

/** Toca até chegar (pelo menos) ao instante pedido e pausa; devolve o instante do quadro exibido. */
function advance(v: HTMLVideoElement, target: number): Promise<number> {
  return new Promise((resolve, reject) => {
    let finished = false;
    const finish = (err: Error | null, t = v.currentTime) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      v.removeEventListener("ended", onEnd);
      v.removeEventListener("error", onErr);
      v.pause();
      if (err) reject(err);
      else resolve(t);
    };
    const onEnd = () => finish(null);
    const onErr = () => finish(new Error(v.error?.message || "erro do player"));
    const timer = setTimeout(() => finish(new StallError("O player de vídeo")), 20_000);
    const rvfc = (v as HTMLVideoElement & { requestVideoFrameCallback: RVFC }).requestVideoFrameCallback.bind(v);
    const cb = (_: number, meta: { mediaTime: number }) => {
      if (finished) return;
      if (meta.mediaTime >= target - 0.001) finish(null, meta.mediaTime);
      else rvfc(cb);
    };
    v.addEventListener("ended", onEnd);
    v.addEventListener("error", onErr);
    rvfc(cb);
    v.play().catch((e) => finish(e instanceof Error ? e : new Error(String(e))));
  });
}

async function* elementFrames(file: Blob, times: number[], opts: FrameReadOptions): AsyncGenerator<Frame | null> {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  // Precisa estar na página (o Android não decodifica vídeo escondido com display:none)
  Object.assign(v.style, { position: "fixed", left: "0", top: "0", width: "2px", height: "2px", opacity: "0.01", pointerEvents: "none", zIndex: "-1" });
  document.body.appendChild(v);
  try {
    const loaded = once(v, "loadeddata", 30_000, "O player de vídeo");
    v.src = url;
    await loaded;
    const vw = v.videoWidth || 1280;
    const vh = v.videoHeight || 720;
    let w: number;
    let h: number;
    if (opts.width && opts.height) {
      w = opts.width;
      h = opts.height;
    } else {
      h = Math.min(vh, opts.height ?? vh);
      w = Math.round((vw * h) / vh);
    }
    const pool = Array.from({ length: Math.max(2, opts.poolSize ?? 2) + 1 }, () => Object.assign(document.createElement("canvas"), { width: w, height: h }));
    let pi = 0;
    let cur: Frame | null = null;
    const grab = (t: number): Frame => {
      const c = pool[pi++ % pool.length];
      c.getContext("2d")!.drawImage(v, 0, 0, w, h);
      return { canvas: c, width: w, height: h, timestamp: t };
    };
    const canPlay = "requestVideoFrameCallback" in v;
    const half = 0.5 / 60;
    let frameT = -Infinity;
    for (const t of times) {
      if (opts.signal?.aborted) throw new DOMException("Cancelado", "AbortError");
      // Dentro do quadro atual, ou o vídeo já acabou: repete o último quadro
      if (cur && ((t >= frameT - half && t <= frameT + half) || (v.ended && t > frameT))) {
        yield cur;
        continue;
      }
      // Instantes próximos e em sequência: toca o vídeo (muito mais rápido que buscar quadro a quadro)
      if (canPlay && cur && t > frameT && t - frameT < 1.5) {
        frameT = await advance(v, t - half);
      } else {
        await seek(v, t);
        frameT = v.currentTime;
      }
      cur = grab(frameT);
      yield cur;
    }
  } finally {
    v.pause();
    v.removeAttribute("src");
    v.load();
    v.remove();
    URL.revokeObjectURL(url);
  }
}

/** Pede para a tela de edição soltar o vídeo da prévia (libera o decodificador do aparelho). */
export function freeDecoders() {
  window.dispatchEvent(new Event("gca:free-decoders"));
}

// ---------- Áudio ----------

export class AudioDecodeError extends Error {
  constructor(cause: unknown) {
    super(`O aparelho não conseguiu decodificar o áudio deste vídeo (${cause instanceof Error ? cause.message : String(cause)}).`);
    this.name = "AudioDecodeError";
  }
}

/** Lê o áudio de um intervalo; se o decodificador falhar, recria e continua de onde parou (até 2 vezes). */
export async function* readAudio(track: InputAudioTrack, start: number, end: number, opts: { timeout?: number; what?: string; signal?: AbortSignal } = {}): AsyncGenerator<WrappedAudioBuffer> {
  let from = start;
  let tries = 0;
  let hidden = 0;
  for (;;) {
    const before = from;
    try {
      const sink = new AudioBufferSink(track);
      for await (const b of guarded(sink.buffers(from, end), opts.timeout ?? 60_000, opts.what ?? "O decodificador de áudio")) {
        from = Math.max(from, b.timestamp + b.duration);
        yield b;
      }
      return;
    } catch (e) {
      if (isAbort(e) || opts.signal?.aborted) throw e;
      logError("leitura de áudio", e);
      if (document.hidden && hidden < 5) {
        hidden++;
        await waitVisible();
        continue;
      }
      // Avançou desde a última falha: o decodificador funciona, só caiu; recomeça a contagem
      if (from > before) tries = 0;
      if (++tries > 2) throw new AudioDecodeError(e);
    }
  }
}
