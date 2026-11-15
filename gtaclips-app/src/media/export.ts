// Exportação real em MP4: decodifica o vídeo original, desenha cada quadro com o compositor
// (o mesmo da prévia), codifica com o codificador do aparelho (WebCodecs) e monta o arquivo.

import { AudioBufferSink, AudioBufferSource, BufferTarget, CanvasSink, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH, getFirstEncodableAudioCodec, getFirstEncodableVideoCodec } from "mediabunny";
import type { Analysis, Clip, ExportRecord, Segment } from "../core/types";
import { actionPath, removeSilences, totalDuration } from "../core/timeline";
import { uid } from "../core/format";
import { openInput } from "./probe";
import { drawFrame, ensureFonts, outputSize, type FrameState } from "./compose";

export interface ExportProgress {
  value: number;
  detail: string;
}

export interface ExportResult {
  blob: Blob;
  record: ExportRecord;
}

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Exportação cancelada", "AbortError");
}

/** Trechos efetivos do clipe (com a remoção de silêncios aplicada, se ligada). */
export function effectiveSegments(clip: Clip, analysis: Analysis | undefined): Segment[] {
  return clip.removeSilence && analysis ? removeSilences(clip.segments, analysis.audio, analysis.samples) : clip.segments;
}

export async function exportClip(file: Blob, clip: Clip, analysis: Analysis | undefined, projectId: string, sourceFps: number, opts: { short?: number; signal?: AbortSignal; onProgress?: (p: ExportProgress) => void } = {}): Promise<ExportResult> {
  const report = (value: number, detail: string) => opts.onProgress?.({ value, detail });
  await ensureFonts();
  const { width: W, height: H } = outputSize(clip.format, opts.short ?? 1080);
  const fps = Math.min(clip.fps, sourceFps >= 50 ? 60 : 30) as 30 | 60;
  const segments = effectiveSegments(clip, analysis);
  const total = totalDuration(segments);
  if (total <= 0) throw new Error("O clipe está vazio.");
  const videoCodec = await getFirstEncodableVideoCodec(["avc", "vp9", "av1"], { width: W, height: H });
  if (!videoCodec) throw new Error("Este navegador não consegue codificar vídeo (WebCodecs). Use o Chrome, Edge ou Safari atualizados.");
  const input = openInput(file);
  try {
    const vt = await input.getPrimaryVideoTrack();
    if (!vt) throw new Error("Sem faixa de vídeo");
    const at = await input.getPrimaryAudioTrack();
    const canDecodeAudio = !!at && (await at.canDecode());
    const audioCodec = canDecodeAudio && typeof AudioEncoder !== "undefined" ? await getFirstEncodableAudioCodec(["aac", "opus"], { numberOfChannels: 2, sampleRate: at!.sampleRate === 44100 ? 44100 : 48000 }) : null;

    const canvas: OffscreenCanvas | HTMLCanvasElement = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H) : Object.assign(document.createElement("canvas"), { width: W, height: H });
    const ctx = canvas.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
    const videoSource = new CanvasSource(canvas, { codec: videoCodec, quality: QUALITY_HIGH, keyFrameInterval: 2 });
    output.addVideoTrack(videoSource, { frameRate: fps });
    let audioSource: AudioBufferSource | null = null;
    if (audioCodec) {
      audioSource = new AudioBufferSource({ codec: audioCodec, quality: QUALITY_HIGH });
      output.addAudioTrack(audioSource);
    }
    await output.start();

    // ---------- Vídeo ----------
    const maxH = Math.min(vt.displayHeight, 2160);
    const sink = new CanvasSink(vt, { height: maxH, poolSize: 2 });
    const path = analysis ? actionPath(analysis.samples) : [];
    const totalFrames = Math.max(1, Math.round(total * fps));
    let frame = 0;
    let outT = 0;
    for (let si = 0; si < segments.length; si++) {
      const s = segments[si];
      const segDur = s.end - s.start;
      const n = Math.max(1, Math.round(segDur * fps));
      const times = Array.from({ length: n }, (_, k) => s.start + k / fps);
      let k = 0;
      let last: CanvasImageSource | null = null;
      let lw = 0;
      let lh = 0;
      for await (const wrapped of sink.canvasesAtTimestamps(times)) {
        checkAbort(opts.signal);
        const t = outT + k / fps;
        if (wrapped) {
          last = wrapped.canvas;
          lw = wrapped.canvas.width;
          lh = wrapped.canvas.height;
        }
        if (last) {
          const st: FrameState = { outT: t, srcT: times[k], seg: s, segOut: outT, segDur, isFirst: si === 0, isLast: si === segments.length - 1 };
          drawFrame(ctx, W, H, last, lw, lh, { clip, path }, st);
        }
        await videoSource.add(frame / fps, 1 / fps);
        frame++;
        k++;
        if (frame % 15 === 0) report((frame / totalFrames) * 0.85, `Montando o vídeo: ${Math.round((frame / totalFrames) * 100)}% (${frame} de ${totalFrames} quadros)`);
      }
      // Garante a duração exata do trecho mesmo se faltar quadro no final do original
      while (k < n) {
        await videoSource.add(frame / fps, 1 / fps);
        frame++;
        k++;
      }
      outT += n / fps;
    }
    videoSource.close();

    // ---------- Áudio ----------
    if (audioSource && at) {
      report(0.86, "Processando o áudio…");
      const asink = new AudioBufferSink(at);
      const rate = at.sampleRate;
      // 1ª passada: volume médio, para normalizar
      let gain = clip.volume;
      if (clip.normalize) {
        let acc = 0;
        let cnt = 0;
        for (const s of segments) {
          for await (const { buffer, timestamp } of asink.buffers(s.start, s.end)) {
            checkAbort(opts.signal);
            const from = Math.max(0, Math.floor((s.start - timestamp) * buffer.sampleRate));
            const to = Math.min(buffer.length, Math.ceil((s.end - timestamp) * buffer.sampleRate));
            const ch = buffer.getChannelData(0);
            for (let i = from; i < to; i += 4) {
              acc += ch[i] * ch[i] * s.volume * s.volume;
              cnt++;
            }
          }
        }
        const rms = Math.sqrt(acc / Math.max(1, cnt));
        // Alvo aproximado de −20 dBFS RMS (ouve bem no celular), com limite de ganho
        if (rms > 1e-4) gain *= Math.max(0.5, Math.min(4, 0.1 / rms));
      }
      let outFrames = 0;
      for (let si = 0; si < segments.length; si++) {
        const s = segments[si];
        const n = Math.max(1, Math.round((s.end - s.start) * fps));
        const len = Math.round((n / fps) * rate);
        const L = new Float32Array(len);
        const R = new Float32Array(len);
        for await (const { buffer, timestamp } of asink.buffers(s.start, s.end)) {
          checkAbort(opts.signal);
          const offset = Math.round((timestamp - s.start) * rate);
          const c0 = buffer.getChannelData(0);
          const c1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : c0;
          for (let i = 0; i < buffer.length; i++) {
            const j = offset + i;
            if (j < 0 || j >= len) continue;
            L[j] = c0[i];
            R[j] = c1[i];
          }
        }
        // Volume, fades nas emendas e limitador suave
        const fade = Math.round((clip.transition === "fade" ? 0.18 : 0.012) * rate);
        const g = gain * s.volume;
        for (let j = 0; j < len; j++) {
          let f = 1;
          if (si > 0 && j < fade) f = j / fade;
          if (si < segments.length - 1 && len - j < fade) f = Math.min(f, (len - j) / fade);
          L[j] = soft(L[j] * g * f);
          R[j] = soft(R[j] * g * f);
        }
        const ab = new AudioBuffer({ length: len, numberOfChannels: 2, sampleRate: rate });
        ab.copyToChannel(L, 0);
        ab.copyToChannel(R, 1);
        await audioSource.add(ab);
        outFrames += n;
        report(0.86 + (outFrames / totalFrames) * 0.1, "Processando o áudio…");
      }
      audioSource.close();
    }
    report(0.97, "Finalizando o arquivo MP4…");
    await output.finalize();
    const buf = (output.target as BufferTarget).buffer!;
    const blob = new Blob([buf], { type: "video/mp4" });
    const record: ExportRecord = {
      id: uid("x"),
      projectId,
      clipId: clip.id,
      title: clip.title,
      createdAt: Date.now(),
      size: blob.size,
      duration: Math.round((frame / fps) * 100) / 100,
      width: W,
      height: H,
      fps,
      videoCodec,
      audioCodec,
      mime: "video/mp4",
    };
    report(1, "Exportação concluída");
    return { blob, record };
  } finally {
    input.dispose();
  }
}

/** Limitador suave: evita estouro sem distorção audível em volumes normais. */
function soft(x: number): number {
  const a = Math.abs(x);
  if (a <= 0.9) return x;
  return Math.sign(x) * (0.9 + 0.1 * Math.tanh((a - 0.9) / 0.1));
}
