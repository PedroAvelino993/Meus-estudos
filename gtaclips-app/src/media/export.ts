// Exportação real em MP4: decodifica o vídeo original, desenha cada quadro com o compositor
// (o mesmo da prévia), codifica com o codificador do aparelho (WebCodecs) e monta o arquivo.
//
// Cuidados de memória (celulares fecham a página quando ela passa do limite):
// - o arquivo é montado em blocos de 8 MB que viram Blob (sem buffer que dobra de tamanho);
// - o vídeo original é decodificado só na resolução necessária (nada de 4K para sair 1080p);
// - taxa de bits fixa e adequada ao YouTube;
// - cada etapa tem limite de tempo: se o decodificador/codificador travar, a exportação para com
//   uma mensagem clara em vez de congelar o app.

import { AudioBufferSource, CanvasSource, Mp4OutputFormat, Output, StreamTarget, getFirstEncodableAudioCodec, getFirstEncodableVideoCodec, type StreamTargetChunk } from "mediabunny";
import type { Analysis, Clip, ExportRecord, Segment, SourceInfo } from "../core/types";
import { actionPath, removeSilences, totalDuration } from "../core/timeline";
import { uid } from "../core/format";
import { openInput } from "./probe";
import { drawFrame, ensureFonts, outputSize, type FrameState } from "./compose";
import { breathe, withTimeout } from "./device";
import { db } from "./db";
import { MODE_LABEL, readAudio, readFrames } from "./frames";

export interface ExportProgress {
  value: number;
  detail: string;
}

export interface ExportResult {
  blob: Blob;
  record: ExportRecord;
  /** Avisos sobre o que precisou ser contornado (ex.: decodificador trocado, áudio com falhas). */
  warnings: string[];
}

export interface ExportOptions {
  /** Lado menor do vídeo final: 1080 (padrão) ou 720 (aparelhos com pouca memória). */
  short?: 1080 | 720;
  signal?: AbortSignal;
  onProgress?: (p: ExportProgress) => void;
  source?: SourceInfo;
  /** Versão leve para compartilhar: 720p, 30 FPS e no máximo ~45 MB. */
  light?: boolean;
}

/** O menu de compartilhar do Chrome/Android recusa arquivos acima de 50 MB. */
export const SHARE_BUDGET = 45 * 1024 * 1024;

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Exportação cancelada", "AbortError");
}

/** Trechos efetivos do clipe (com a remoção de silêncios aplicada, se ligada). */
export function effectiveSegments(clip: Clip, analysis: Analysis | undefined): Segment[] {
  return clip.removeSilence && analysis ? removeSilences(clip.segments, analysis.audio, analysis.samples) : clip.segments;
}

/**
 * Monta o arquivo em blocos de 8 MB. Cada bloco completo vai direto para o armazenamento do
 * aparelho (IndexedDB) e sai da memória, então clipes longos não fazem a memória crescer.
 * As poucas escritas "para trás" do formato MP4 (cabeçalhos) são aplicadas no fim.
 */
export class BlobAssembler {
  private parts: Blob[] = [];
  private stored = 0;
  private base = 0;
  private page: Uint8Array;
  private used = 0;
  private patches: { pos: number; data: Uint8Array }[] = [];
  constructor(
    private store?: { put: (idx: number, b: Blob) => Promise<unknown>; getAll: () => Promise<Blob[]> },
    private pageSize = 8 << 20,
  ) {
    this.page = new Uint8Array(pageSize);
  }
  async write(pos: number, data: Uint8Array) {
    let p = pos;
    let d = data;
    if (p < this.base) {
      const n = Math.min(d.length, this.base - p);
      this.patches.push({ pos: p, data: d.slice(0, n) });
      p += n;
      d = d.subarray(n);
    }
    while (d.length) {
      const off = p - this.base;
      if (off >= this.pageSize) {
        await this.flush();
        continue;
      }
      const n = Math.min(d.length, this.pageSize - off);
      this.page.set(d.subarray(0, n), off);
      this.used = Math.max(this.used, off + n);
      p += n;
      d = d.subarray(n);
    }
  }
  private async flush() {
    const blob = new Blob([this.page]);
    this.page = new Uint8Array(this.pageSize);
    this.base += this.pageSize;
    this.used = 0;
    if (this.store) {
      try {
        await this.store.put(this.stored++, blob);
        return;
      } catch {
        // Sem espaço no armazenamento: continua montando na memória
        this.stored--;
      }
    }
    this.parts.push(blob);
  }
  async finish(type: string): Promise<Blob> {
    const tail = new Blob([this.page.slice(0, this.used)]);
    this.page = new Uint8Array(0);
    const fromDisk = this.store && this.stored ? await this.store.getAll() : [];
    let blob = new Blob([...fromDisk, ...this.parts, tail], { type });
    for (const pt of this.patches) blob = new Blob([blob.slice(0, pt.pos), pt.data as BlobPart, blob.slice(pt.pos + pt.data.length)], { type });
    return blob;
  }
}

/** Exportações cujos blocos temporários ainda devem ser apagados (depois de salvar o arquivo final). */
const pendingChunkJobs = new Set<string>();

export async function cleanupChunks() {
  for (const j of [...pendingChunkJobs]) {
    await db.deleteChunks(j).catch(() => undefined);
    pendingChunkJobs.delete(j);
  }
}

/** Taxa de bits recomendada para o YouTube (SDR). */
function videoBitrate(W: number, H: number, fps: number): number {
  const px = W * H;
  const base = px >= 1920 * 1080 * 0.9 ? 8_000_000 : px >= 1280 * 720 * 0.9 ? 5_000_000 : 3_000_000;
  return fps >= 50 ? Math.round(base * 1.5) : base;
}

/** Reamostragem linear simples (ex.: 44,1 kHz → 48 kHz para o Opus). */
function resample(src: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return src;
  const out = new Float32Array(Math.round((src.length * to) / from));
  const k = from / to;
  for (let i = 0; i < out.length; i++) {
    const x = i * k;
    const j = Math.floor(x);
    const f = x - j;
    out[i] = (src[j] ?? 0) * (1 - f) + (src[j + 1] ?? src[j] ?? 0) * f;
  }
  return out;
}

const FRAME_TIMEOUT = 60_000;

export async function exportClip(file: Blob, clip: Clip, analysis: Analysis | undefined, projectId: string, sourceFps: number, opts: ExportOptions = {}): Promise<ExportResult> {
  const report = (value: number, detail: string) => opts.onProgress?.({ value, detail });
  await ensureFonts();
  const light = !!opts.light;
  const { width: W, height: H } = outputSize(clip.format, light ? 720 : opts.short ?? 1080);
  const fps = (light ? 30 : Math.min(clip.fps, sourceFps >= 50 ? 60 : 30)) as 30 | 60;
  const segments = effectiveSegments(clip, analysis);
  const total = totalDuration(segments);
  if (total <= 0) throw new Error("O clipe está vazio.");
  // Sempre que a qualidade permitir, o arquivo cabe no compartilhamento do celular (< 45 MB)
  const fitRate = Math.floor(((SHARE_BUDGET * 8) / total) * 0.94) - 170_000;
  const floor = light ? 600_000 : W * H >= 1920 * 1080 * 0.9 ? 4_000_000 : 2_500_000;
  const bitrate = Math.max(floor, Math.min(videoBitrate(W, H, fps), fitRate));
  const videoCodec = await getFirstEncodableVideoCodec(["avc", "vp9", "av1"], { width: W, height: H, bitrate });
  if (!videoCodec) throw new Error("Este navegador não consegue codificar vídeo nesse tamanho (WebCodecs). Tente a qualidade 720p em Configurações, ou use o Chrome/Edge/Safari atualizados.");
  const input = openInput(file);
  const warnings: string[] = [];
  const job = uid("exp");
  try {
    const vt = await input.getPrimaryVideoTrack();
    if (!vt) throw new Error("Sem faixa de vídeo");
    const at = await input.getPrimaryAudioTrack();
    const canDecodeAudio = !!at && (await at.canDecode());
    let audioCodec: "aac" | "opus" | null = null;
    let outRate = 48000;
    if (canDecodeAudio && typeof AudioEncoder !== "undefined") {
      const srcRate = at!.sampleRate;
      if ((srcRate === 44100 || srcRate === 48000) && (await getFirstEncodableAudioCodec(["aac"], { numberOfChannels: 2, sampleRate: srcRate }))) {
        audioCodec = "aac";
        outRate = srcRate;
      } else if (await getFirstEncodableAudioCodec(["aac"], { numberOfChannels: 2, sampleRate: 48000 })) audioCodec = "aac";
      else if (await getFirstEncodableAudioCodec(["opus"], { numberOfChannels: 2, sampleRate: 48000 })) audioCodec = "opus";
    }

    if (audioCodec === "opus") warnings.push("Este navegador não tem o codificador de áudio AAC, então o MP4 saiu com áudio Opus: WhatsApp e Telegram aceitam, mas o Instagram pode recusar. No Chrome do Android isso normalmente não acontece.");
    const canvas: OffscreenCanvas | HTMLCanvasElement = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(W, H) : Object.assign(document.createElement("canvas"), { width: W, height: H });
    const ctx = canvas.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
    const asm = new BlobAssembler(typeof indexedDB !== "undefined" ? { put: (i, b) => db.putChunk(job, i, b), getAll: () => db.getChunks(job) } : undefined);
    const writable = new WritableStream<StreamTargetChunk>({ write: (chunk) => asm.write(chunk.position, chunk.data) });
    // «Fast start»: o índice do vídeo fica no começo do arquivo. Instagram, WhatsApp e Telegram
    // recusam ou não pré-visualizam MP4 com o índice no fim. O espaço é reservado de antemão
    // (sem guardar o vídeo na memória).
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: "reserve" }), target: new StreamTarget(writable) });
    const frameBudget = segments.reduce((a, s) => a + Math.max(1, Math.round((s.end - s.start) * fps)), 0);
    const videoSource = new CanvasSource(canvas, { codec: videoCodec, bitrate, keyFrameInterval: 2 });
    output.addVideoTrack(videoSource, { frameRate: fps, maximumPacketCount: Math.ceil(frameBudget * 1.1) + 60 });
    let audioSource: AudioBufferSource | null = null;
    if (audioCodec) {
      audioSource = new AudioBufferSource({ codec: audioCodec, bitrate: 160_000 });
      output.addAudioTrack(audioSource, { maximumPacketCount: Math.ceil(((total + 2) * outRate) / 512 * 1.33) + 200 });
    }
    await output.start();

    const totalFrames = Math.max(1, Math.round(total * fps));
    // ---------- Áudio (primeiro) ----------
    // O MP4 intercala áudio e vídeo: se o áudio viesse depois, o vídeo inteiro ficaria preso na
    // memória esperando por ele. Com o áudio pronto antes, só os pacotes de áudio (pequenos) esperam.
    if (audioSource && at) {
      report(0, "Processando o áudio…");
      const rate = at.sampleRate;
      const buffers = (s: Segment) => readAudio(at, s.start, s.end, { timeout: FRAME_TIMEOUT, signal: opts.signal });
      // 1ª passada: volume médio, para normalizar
      let gain = clip.volume;
      if (clip.normalize) {
        let acc = 0;
        let cnt = 0;
        for (const s of segments) {
          try {
          for await (const { buffer, timestamp } of buffers(s)) {
            checkAbort(opts.signal);
            const from = Math.max(0, Math.floor((s.start - timestamp) * buffer.sampleRate));
            const to = Math.min(buffer.length, Math.ceil((s.end - timestamp) * buffer.sampleRate));
            const ch = buffer.getChannelData(0);
            for (let i = from; i < to; i += 4) {
              acc += ch[i] * ch[i] * s.volume * s.volume;
              cnt++;
            }
          }
          } catch (e) {
            if (opts.signal?.aborted) throw e;
            // Só a medição de volume: segue com o que conseguiu medir
          }
          await breathe();
        }
        const rms = Math.sqrt(acc / Math.max(1, cnt));
        // Alvo aproximado de −20 dBFS RMS (ouve bem no celular), com limite de ganho
        if (rms > 1e-4) gain *= Math.max(0.5, Math.min(4, 0.1 / rms));
      }
      let outFrames = 0;
      let audioGaps = 0;
      // Processa o áudio em janelas de 10 s (memória baixa mesmo em clipes longos)
      const WIN = 10;
      for (let si = 0; si < segments.length; si++) {
        const s = segments[si];
        const n = Math.max(1, Math.round((s.end - s.start) * fps));
        const len = Math.round((n / fps) * rate);
        const fade = Math.round((clip.transition === "fade" ? 0.18 : 0.012) * rate);
        const g = gain * s.volume;
        const winLen = WIN * rate;
        for (let w0 = 0; w0 < len; w0 += winLen) {
          const w1 = Math.min(len, w0 + winLen);
          const a = s.start + w0 / rate;
          const b = s.start + w1 / rate;
          let L = new Float32Array(w1 - w0);
          let R = new Float32Array(w1 - w0);
          let filled = 0;
          try {
          for await (const { buffer, timestamp } of readAudio(at, a, b, { timeout: FRAME_TIMEOUT, signal: opts.signal })) {
            checkAbort(opts.signal);
            const offset = Math.round((timestamp - a) * rate);
            const c0 = buffer.getChannelData(0);
            const c1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : c0;
            for (let i = 0; i < buffer.length; i++) {
              const j = offset + i;
              if (j < 0 || j >= L.length) continue;
              L[j] = c0[i];
              R[j] = c1[i];
              filled++;
            }
          }
          } catch (e) {
            if (opts.signal?.aborted) throw e;
            // Trecho de áudio ilegível: fica em silêncio, o vídeo continua
            audioGaps += Math.max(0, w1 - w0 - filled) / rate;
          }
          // Volume, fades nas emendas e limitador suave
          for (let j = 0; j < L.length; j++) {
            const pos = w0 + j;
            let f = 1;
            if (si > 0 && pos < fade) f = pos / fade;
            if (si < segments.length - 1 && len - pos < fade) f = Math.min(f, (len - pos) / fade);
            L[j] = soft(L[j] * g * f);
            R[j] = soft(R[j] * g * f);
          }
          // Comprimento exato na taxa de saída (as janelas somam a duração certa do trecho)
          const o0 = Math.round((w0 * outRate) / rate);
          const o1 = Math.round((w1 * outRate) / rate);
          if (outRate !== rate) {
            L = resample(L, rate, outRate);
            R = resample(R, rate, outRate);
          }
          const outLen = o1 - o0;
          if (outLen <= 0) continue;
          const ab = new AudioBuffer({ length: outLen, numberOfChannels: 2, sampleRate: outRate });
          ab.copyToChannel(fit(L, outLen), 0);
          ab.copyToChannel(fit(R, outLen), 1);
          await withTimeout(audioSource.add(ab), FRAME_TIMEOUT, "O codificador de áudio");
          await breathe();
        }
        outFrames += n;
        report((outFrames / totalFrames) * 0.1, "Processando o áudio…");
      }
      audioSource.close();
      if (audioGaps > 0.5) warnings.push(`O aparelho não conseguiu ler ${Math.round(audioGaps)} s do áudio original; esses trechos ficaram em silêncio.`);
    }
    // ---------- Vídeo ----------
    // Decodifica só o necessário: a altura de saída (com folga para o zoom), nunca acima de 2160
    const maxZoom = Math.max(1, clip.zoom || 1) * Math.max(1, ...segments.map((s) => s.zoom || 1));
    const portrait = vt.displayHeight > vt.displayWidth;
    const need = portrait ? Math.max(H, W) : Math.round(Math.max(H, W * (vt.displayHeight / vt.displayWidth)) * Math.min(maxZoom, 1.6));
    const sinkHeight = Math.min(vt.displayHeight, need, 2160);
    const onFallback = (mode: keyof typeof MODE_LABEL) => {
      const msg = `O decodificador de vídeo do aparelho falhou; a exportação continuou com ${MODE_LABEL[mode]}${mode === "element" ? " (mais lento)" : ""}.`;
      if (!warnings.includes(msg)) warnings.push(msg);
      report(0.1 + (frame / totalFrames) * 0.86, `Decodificador falhou, continuando com ${MODE_LABEL[mode]}…`);
    };
    const path = analysis ? actionPath(analysis.samples) : [];
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
      for await (const wrapped of readFrames(vt, file, times, { height: sinkHeight, poolSize: 2, timeout: FRAME_TIMEOUT, signal: opts.signal, onFallback, source: opts.source })) {
        checkAbort(opts.signal);
        if (k >= n) break;
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
        await withTimeout(videoSource.add(frame / fps, 1 / fps), FRAME_TIMEOUT, "O codificador de vídeo");
        frame++;
        k++;
        if (frame % 8 === 0) await breathe();
        if (frame % 15 === 0) report(0.1 + (frame / totalFrames) * 0.86, `Montando o vídeo: ${Math.round((frame / totalFrames) * 100)}% (${frame} de ${totalFrames} quadros)`);
      }
      // Garante a duração exata do trecho mesmo se faltar quadro no final do original
      while (k < n) {
        await withTimeout(videoSource.add(frame / fps, 1 / fps), FRAME_TIMEOUT, "O codificador de vídeo");
        frame++;
        k++;
      }
      outT += n / fps;
    }
    videoSource.close();

    report(0.97, "Finalizando o arquivo MP4…");
    await withTimeout(output.finalize(), 120_000, "A finalização do arquivo");
    const blob = await asm.finish("video/mp4");
    // Os blocos temporários só são apagados depois que o arquivo final for salvo
    pendingChunkJobs.add(job);
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
      ...(light ? { light: true } : {}),
    };
    report(1, "Exportação concluída");
    return { blob, record, warnings };
  } finally {
    input.dispose();
    // Exportação cancelada ou com erro: apaga os blocos temporários
    if (!pendingChunkJobs.has(job) && typeof indexedDB !== "undefined") db.deleteChunks(job).catch(() => undefined);
  }
}

/** Ajusta o tamanho do bloco (preenche com silêncio ou corta o excesso de arredondamento). */
function fit(a: Float32Array, n: number): Float32Array {
  if (a.length === n) return a;
  const out = new Float32Array(n);
  out.set(a.subarray(0, Math.min(n, a.length)));
  return out;
}

/** Limitador suave: evita estouro sem distorção audível em volumes normais. */
function soft(x: number): number {
  const a = Math.abs(x);
  if (a <= 0.9) return x;
  return Math.sign(x) * (0.9 + 0.1 * Math.tanh((a - 0.9) / 0.1));
}
