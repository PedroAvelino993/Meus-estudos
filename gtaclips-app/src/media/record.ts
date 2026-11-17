// Gravação direta do clipe (iPhone/iPad/Safari).
//
// No Safari o processamento de vídeo do navegador (WebCodecs) falha em muitos aparelhos e gera
// arquivos que o próprio iPhone não abre. Aqui o clipe é tocado por dentro (com cortes, enquadramento
// e legendas desenhados num canvas) e gravado pelo gravador nativo do aparelho (MediaRecorder).
// O resultado é um MP4 feito pelo próprio iPhone — o mesmo tipo de arquivo de uma gravação de tela.
// Leva o tempo do clipe (tempo real).

import type { Analysis, Clip, ExportRecord, Segment } from "../core/types";
import { actionPath, totalDuration } from "../core/timeline";
import { uid } from "../core/format";
import { drawFrame, ensureFonts, outputSize, type FrameState } from "./compose";
import { effectiveSegments, type ExportResult } from "./export";
import { StallError } from "./device";

/** Elemento de vídeo e áudio «destravados» por um toque do usuário (exigência do iPhone). */
export interface RecorderKit {
  video: HTMLVideoElement;
  ctx: AudioContext;
  gain: GainNode;
  dest: MediaStreamAudioDestinationNode;
  url: string | null;
  /** Termina quando o «destravamento» do toque acabou (tocou e pausou, ou falhou). */
  unlocked: Promise<void>;
  dispose: () => void;
}

const MIMES = ["video/mp4;codecs=avc1.640028,mp4a.40.2", "video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4;codecs=avc1,mp4a.40.2", "video/mp4"];

export function recorderMime(): string | null {
  if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement === "undefined" || !("captureStream" in HTMLCanvasElement.prototype)) return null;
  for (const m of MIMES) if (MediaRecorder.isTypeSupported?.(m)) return m;
  return null;
}

export function recorderSupported(): boolean {
  return !!recorderMime();
}

/**
 * PRECISA ser chamado direto no toque do botão (sem esperar nada antes): o iPhone só deixa
 * tocar vídeo com som e ligar o áudio se começar num toque.
 */
export function prepareRecorder(file?: Blob | null): RecorderKit {
  const video = document.createElement("video");
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  // Precisa estar na página para o iPhone decodificar
  Object.assign(video.style, { position: "fixed", left: "0", bottom: "0", width: "4px", height: "4px", opacity: "0.02", pointerEvents: "none", zIndex: "2147483647" });
  document.body.appendChild(video);
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  const src = ctx.createMediaElementSource(video);
  const gain = ctx.createGain();
  const dest = ctx.createMediaStreamDestination();
  // O som vai só para a gravação (não sai no alto-falante)
  src.connect(gain).connect(dest);
  void ctx.resume().catch(() => undefined);
  const url = file ? URL.createObjectURL(file) : null;
  if (url) video.src = url;
  // «Destrava» o vídeo para tocar com som depois (o iPhone guarda a permissão do toque)
  const p = video.play();
  const unlocked = (p ?? Promise.resolve()).then(() => video.pause()).catch(() => undefined);
  const kit: RecorderKit = {
    unlocked,
    video,
    ctx,
    gain,
    dest,
    url,
    dispose: () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
      if (kit.url) URL.revokeObjectURL(kit.url);
      void ctx.close().catch(() => undefined);
    },
  };
  return kit;
}

function waitEvent(v: HTMLVideoElement, ev: string, ms: number, what: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = (e?: Error) => {
      clearTimeout(t);
      v.removeEventListener(ev, ok);
      v.removeEventListener("error", bad);
      if (e) reject(e);
      else resolve();
    };
    const ok = () => done();
    const bad = () => done(new Error(`o player do iPhone não abriu o vídeo original (${v.error?.message || v.error?.code || "erro"})`));
    const t = setTimeout(() => done(new StallError(what)), ms);
    v.addEventListener(ev, ok);
    v.addEventListener("error", bad);
  });
}

async function seekTo(v: HTMLVideoElement, t: number) {
  const target = Math.max(0, Math.min(t, (v.duration || t) - 0.05));
  if (Math.abs(v.currentTime - target) < 0.02 && v.readyState >= 2) return;
  const p = waitEvent(v, "seeked", 20_000, "A busca no vídeo");
  v.currentTime = target;
  await p;
}

type RVFC = (cb: () => void) => number;
/** Próximo quadro do vídeo; nunca espera para sempre (no fim do vídeo não chega quadro novo). */
const nextFrame = (v: HTMLVideoElement) =>
  new Promise<void>((r) => {
    const t = setTimeout(r, 150);
    const done = () => {
      clearTimeout(t);
      r();
    };
    if ("requestVideoFrameCallback" in v) (v as HTMLVideoElement & { requestVideoFrameCallback: RVFC }).requestVideoFrameCallback(done);
    else requestAnimationFrame(done);
  });

export interface RecordOptions {
  short?: 1080 | 720;
  signal?: AbortSignal;
  onProgress?: (p: { value: number; detail: string }) => void;
}

/** Grava o clipe em tempo real com o gravador do aparelho. */
export async function recordClip(kit: RecorderKit, file: Blob, clip: Clip, analysis: Analysis | undefined, projectId: string, opts: RecordOptions = {}): Promise<ExportResult> {
  const mime = recorderMime();
  if (!mime) throw new Error("Este navegador não tem o gravador de vídeo (MediaRecorder). Atualize o iOS.");
  await ensureFonts();
  const v = kit.video;
  // Espera o «destravamento» terminar (senão a pausa dele cairia no meio da gravação)
  await Promise.race([kit.unlocked, new Promise((r) => setTimeout(r, 4000))]);
  v.pause();
  if (!kit.url) {
    kit.url = URL.createObjectURL(file);
    v.src = kit.url;
  }
  if (v.readyState < 1) await waitEvent(v, "loadedmetadata", 30_000, "O player de vídeo (abrindo o arquivo)");
  const short = opts.short ?? 1080;
  const { width: W, height: H } = outputSize(clip.format, short);
  const canvas = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const c2d = canvas.getContext("2d", { alpha: false })!;
  const segments: Segment[] = effectiveSegments(clip, analysis);
  const total = totalDuration(segments);
  if (total <= 0) throw new Error("O clipe está vazio.");
  const path = analysis ? actionPath(analysis.samples) : [];
  const fps = 30;
  const stream = canvas.captureStream(fps);
  for (const t of kit.dest.stream.getAudioTracks()) stream.addTrack(t);
  const bitrate = short >= 1080 ? 8_000_000 : 5_000_000;
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate, audioBitsPerSecond: 128_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
  const warnings: string[] = [];
  const report = (value: number, detail: string) => opts.onProgress?.({ value, detail });
  let outBase = 0;
  const draw = (si: number, s: Segment) => {
    const st: FrameState = { outT: outBase + Math.max(0, v.currentTime - s.start), srcT: v.currentTime, seg: s, segOut: outBase, segDur: s.end - s.start, isFirst: si === 0, isLast: si === segments.length - 1 };
    if (v.videoWidth) drawFrame(c2d, W, H, v, v.videoWidth, v.videoHeight, { clip, path, fast: true }, st);
  };
  try {
    for (let si = 0; si < segments.length; si++) {
      const s = segments[si];
      if (opts.signal?.aborted) throw new DOMException("Exportação cancelada", "AbortError");
      await seekTo(v, s.start);
      draw(si, s);
      const g = Math.max(0, Math.min(4, clip.volume * s.volume));
      kit.gain.gain.cancelScheduledValues(kit.ctx.currentTime);
      kit.gain.gain.setValueAtTime(si > 0 ? 0 : g, kit.ctx.currentTime);
      kit.gain.gain.linearRampToValueAtTime(g, kit.ctx.currentTime + 0.04);
      if (rec.state === "inactive") rec.start(1000);
      else if (rec.state === "paused") rec.resume();
      try {
        await v.play();
      } catch (e) {
        // Sem permissão para tocar com som (o toque «expirou»): grava sem som em vez de falhar
        if (e instanceof DOMException && e.name === "NotAllowedError" && !v.muted) {
          v.muted = true;
          await v.play();
          if (!warnings.length) warnings.push("O iPhone não deixou tocar o som durante a gravação; o vídeo saiu sem áudio. Toque em «Exportar» de novo e mantenha o app aberto.");
        } else throw e;
      }
      let last = performance.now();
      let lastT = v.currentTime;
      for (;;) {
        await nextFrame(v);
        if (opts.signal?.aborted) throw new DOMException("Exportação cancelada", "AbortError");
        draw(si, s);
        const t = v.currentTime;
        if (t !== lastT) {
          lastT = t;
          last = performance.now();
        } else if (performance.now() - last > 10_000) throw new StallError("O player de vídeo");
        report(Math.min(0.99, (outBase + Math.max(0, t - s.start)) / total), `Gravando o clipe (tempo real): ${Math.round(((outBase + Math.max(0, t - s.start)) / total) * 100)}% — mantenha o app aberto e a tela ligada`);
        if (t >= s.end - 0.02 || v.ended) break;
        // Perto do fim do trecho: abaixa o volume para a emenda não estalar
        if (si < segments.length - 1 && s.end - t < 0.06) kit.gain.gain.linearRampToValueAtTime(0, kit.ctx.currentTime + 0.04);
      }
      v.pause();
      if (rec.state === "recording") {
        try {
          rec.pause();
        } catch {
          /* sem pausa: a emenda fica com um quadro parado */
        }
      }
      outBase += s.end - s.start;
    }
    rec.stop();
    await stopped;
  } catch (e) {
    if (rec.state !== "inactive") rec.stop();
    throw e;
  }
  const type = (rec.mimeType || mime).split(";")[0] || "video/mp4";
  const blob = new Blob(chunks, { type });
  if (!blob.size) throw new Error("A gravação saiu vazia. Mantenha o app aberto e a tela ligada durante a gravação e tente de novo.");
  const record: ExportRecord = {
    id: uid("x"),
    projectId,
    clipId: clip.id,
    title: clip.title,
    createdAt: Date.now(),
    size: blob.size,
    duration: Math.round(total * 100) / 100,
    width: W,
    height: H,
    fps,
    videoCodec: "avc (gravação do aparelho)",
    audioCodec: v.muted ? null : "aac",
    mime: type === "video/quicktime" ? "video/quicktime" : "video/mp4",
    recorded: true,
  };
  report(1, "Gravação concluída");
  return { blob, record, warnings };
}
