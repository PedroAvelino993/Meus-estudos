// Leitura de quadros do vídeo original com plano B automático.
//
// Ordem de tentativas quando o decodificador falha («Decoder failure», travamento, codec recusado):
//   1. WebCodecs com aceleração de hardware (mais rápido)
//   2. WebCodecs por software (funciona quando o chip de vídeo do celular recusa ou está ocupado)
//   3. Player de vídeo do próprio navegador (mais lento, mas lê praticamente qualquer vídeo que ele toca)
// O processamento continua do quadro onde parou; nada é refeito.

import { AudioBufferSink, CanvasSink, type InputAudioTrack, type InputVideoTrack, type WrappedAudioBuffer } from "mediabunny";
import { StallError, guarded, logError } from "./device";
import type { SourceInfo } from "../core/types";
import { describeSource, heavyForPhone, openInput } from "./probe";

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
  /** Método para começar (padrão: o último que funcionou neste aparelho). */
  startMode?: DecodeMode;
  /** Informações do vídeo, para uma mensagem de erro útil. */
  source?: SourceInfo;
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
export function decodeErrorMessage(e: unknown, source?: SourceInfo): string {
  const m = e instanceof Error ? e.message : String(e);
  const what = source ? ` (${describeSource(source)})` : "";
  const heavy = source ? heavyForPhone(source) : [];
  const why = heavy.length ? ` O motivo mais provável: ${heavy.join(", ")} — formato pesado demais para o decodificador deste aparelho.` : "";
  return `Este aparelho não conseguiu ler o vídeo${what}: ${m}. Tentei o decodificador de hardware, o de software e o player do navegador.${why} ${CONVERT_TIP}`;
}

export const CONVERT_TIP =
  "Como resolver: grave ou converta em MP4 H.264, 1080p, sem HDR (no PS5: Configurações → Capturas e transmissões → Capturas → formato MP4 e resolução 1080p; no Xbox: Preferências → Captura e compartilhamento → resolução do clipe 1080p SDR). Outra opção é fazer a análise num computador com Chrome ou Edge.";

/**
 * Lê um quadro para cada instante pedido (na ordem). Devolve `null` quando não há quadro.
 * Troca de método sozinho se o decodificador falhar, retomando do ponto em que parou.
 */
export async function* readFrames(track: InputVideoTrack, file: Blob, times: number[], opts: FrameReadOptions = {}): AsyncGenerator<Frame | null> {
  let mode = opts.startMode ?? preferredDecode();
  let idx = 0;
  let hiddenRetries = 0;
  const timeout = opts.timeout ?? 60_000;
  const what = opts.what ?? "O decodificador de vídeo";
  while (idx < times.length) {
    try {
      const rest = times.slice(idx);
      const src = mode === "element" ? elementFrames(file, rest, opts) : sinkFrames(track, rest, mode, opts);
      // No modo compatível o tempo inclui abrir o arquivo e até 3 quadros pulados
      const limit = mode === "element" ? 30_000 + elementOpTimeout(timeout) * 5 : timeout;
      for await (const f of guarded(src, limit, what)) {
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
      if (!next) throw new Error(decodeErrorMessage(e, opts.source));
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
    const bad = () => done(new Error(playerError(v)));
    const timer = setTimeout(() => done(new StallError(what)), ms);
    v.addEventListener(ev, ok);
    v.addEventListener("error", bad);
  });
}

function playerError(v: HTMLVideoElement) {
  const code = v.error?.code;
  if (code === 4) return "o player do navegador não suporta o formato deste vídeo";
  if (code === 3) return "o player do navegador não conseguiu decodificar o vídeo";
  return v.error?.message || `erro ${code ?? "?"} do player`;
}

type RVFC = (cb: (now: number, meta: { mediaTime: number }) => void) => number;

/** Espera um quadro de verdade aparecer (alguns celulares avisam «seeked» antes de ter a imagem). */
function frameReady(v: HTMLVideoElement, ms: number): Promise<void> {
  if (v.readyState >= 2 && !("requestVideoFrameCallback" in v)) return Promise.resolve();
  if (v.readyState >= 2) {
    // Com imagem disponível, não espera mais que um instante
    return new Promise((r) => {
      const t = setTimeout(r, 250);
      (v as HTMLVideoElement & { requestVideoFrameCallback: RVFC }).requestVideoFrameCallback(() => {
        clearTimeout(t);
        r();
      });
    });
  }
  return once(v, "loadeddata", ms, "O player de vídeo").catch((e) => {
    if (v.readyState >= 2) return;
    throw e;
  });
}

async function seek(v: HTMLVideoElement, t: number, ms: number) {
  const target = Math.max(0, Math.min(t, (v.duration || t) - 0.001));
  if (Math.abs(v.currentTime - target) < 0.0005 && v.readyState >= 2) return;
  const p = once(v, "seeked", ms, "A busca no vídeo");
  v.currentTime = target;
  await p;
  await frameReady(v, ms);
}

/** Toca até chegar (pelo menos) ao instante pedido e pausa; devolve o instante do quadro exibido. */
function advance(v: HTMLVideoElement, target: number, ms: number): Promise<number> {
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
    const onErr = () => finish(new Error(playerError(v)));
    const timer = setTimeout(() => finish(new StallError("O player de vídeo")), ms);
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
  const opT = elementOpTimeout(opts.timeout);
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.setAttribute("playsinline", "");
  v.setAttribute("muted", "");
  v.preload = "auto";
  // Precisa estar visível na página: o Android não decodifica vídeo escondido (display:none)
  // e pausa vídeos mudos fora da tela.
  Object.assign(v.style, { position: "fixed", left: "0", bottom: "0", width: "4px", height: "4px", opacity: "0.02", pointerEvents: "none", zIndex: "2147483647" });
  document.body.appendChild(v);
  try {
    // Só os metadados: o iPhone não carrega imagem antes de uma busca ou de tocar
    const meta = once(v, "loadedmetadata", 30_000, "O player de vídeo (abrindo o arquivo)");
    v.src = url;
    v.load();
    await meta;
    if (!v.videoWidth || !v.videoHeight) throw new Error("o player do navegador abriu o arquivo, mas não consegue mostrar a imagem deste formato");
    const vw = v.videoWidth;
    const vh = v.videoHeight;
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
    const grab = (t: number): Frame => {
      const c = pool[pi++ % pool.length];
      c.getContext("2d")!.drawImage(v, 0, 0, w, h);
      return { canvas: c, width: w, height: h, timestamp: t };
    };
    let cur: Frame | null = null;
    let canPlay = "requestVideoFrameCallback" in v;
    const half = 0.5 / 60;
    let frameT = -Infinity;
    let stalls = 0;
    for (const t of times) {
      if (opts.signal?.aborted) throw new DOMException("Cancelado", "AbortError");
      // Dentro do quadro atual, ou o vídeo já acabou: repete o último quadro
      if (cur && ((t >= frameT - half && t <= frameT + half) || (v.ended && t > frameT))) {
        yield cur;
        continue;
      }
      try {
        // Quadros seguidos (exportação): tocar é muito mais rápido que buscar um por um
        if (canPlay && cur && t > frameT && t - frameT < 0.25) {
          try {
            frameT = await advance(v, t - half, opT);
          } catch (e) {
            // Tocar não funcionou neste aparelho: segue só com buscas
            logError("player do navegador (reprodução)", e);
            canPlay = false;
            await seek(v, t, opT);
            frameT = v.currentTime;
          }
        } else {
          await seek(v, t, opT);
          frameT = v.currentTime;
        }
        cur = grab(frameT);
        stalls = 0;
        yield cur;
      } catch (e) {
        if (isAbort(e)) throw e;
        // Um quadro problemático não derruba tudo: pula e continua (desiste após 3 seguidos)
        if (++stalls >= 3) throw e;
        logError("player do navegador (quadro pulado)", e);
        yield cur;
      }
    }
  } finally {
    v.pause();
    v.removeAttribute("src");
    v.load();
    v.remove();
    URL.revokeObjectURL(url);
  }
}

function elementOpTimeout(timeout?: number) {
  return Math.min(20_000, Math.max(6_000, (timeout ?? 60_000) / 3));
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

// ---------- Teste rápido ao escolher o arquivo ----------

export interface DecodeCheck {
  ok: boolean;
  mode: DecodeMode;
  ms: number;
  error?: string;
}

/** Lê 3 quadros (começo, meio, fim) para saber em segundos se este aparelho consegue ler o vídeo. */
export async function decodeCheck(file: Blob, info: SourceInfo, onFallback?: (m: DecodeMode) => void): Promise<DecodeCheck> {
  const t0 = performance.now();
  const input = openInput(file);
  // O teste sempre recomeça pelo mais rápido: uma falha antiga não condena o aparelho ao modo lento
  let mode: DecodeMode = "hardware";
  try {
    const vt = await input.getPrimaryVideoTrack();
    if (!vt) throw new Error("sem faixa de vídeo");
    const d = info.duration;
    const times = [Math.min(0.5, d / 4), d / 2, Math.max(0, d - 1.5)];
    let got = 0;
    for await (const f of readFrames(vt, file, times, { height: 180, timeout: 20_000, source: info, startMode: "hardware", onFallback: (m) => { mode = m; onFallback?.(m); } })) {
      if (f) got++;
    }
    if (!got) throw new Error("nenhuma imagem foi lida");
    remember(mode);
    return { ok: true, mode, ms: performance.now() - t0 };
  } catch (e) {
    return { ok: false, mode, ms: performance.now() - t0, error: e instanceof Error ? e.message : String(e) };
  } finally {
    input.dispose();
  }
}
