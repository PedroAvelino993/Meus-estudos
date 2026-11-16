// Análise do vídeo inteiro: lê quadros (nos quadros-chave, muito rápido), mede imagem e som,
// pede ao modelo de visão para reconhecer o que acontece e monta a lista de momentos.

import { EncodedPacketSink } from "mediabunny";
import { MODE_LABEL, readAudio, readFrames } from "./frames";
import type { Analysis, Category, Sample } from "../core/types";
import { frameStats, normalizeEnvelope } from "../core/features";
import { buildMoments, buildTimeline, deadSeconds } from "../core/moments";
import { openInput } from "./probe";
import { classifyFrames, loadVision, type ModelProgress } from "./ai";
import { breathe, withTimeout } from "./device";

export interface AnalyzeProgress {
  phase: "preparando" | "modelo" | "imagens" | "som" | "momentos";
  /** 0–1 dentro da fase. */
  value: number;
  detail: string;
}

export interface AnalyzeOptions {
  useVision: boolean;
  learned?: Partial<Record<Category, number>>;
  signal?: AbortSignal;
  onProgress?: (p: AnalyzeProgress) => void;
}

const W = 224;
const H = 126;

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Análise cancelada", "AbortError");
}

/** Escolhe os instantes analisados: quadros-chave (decodificação rápida) ou uma grade de 2 s. */
async function sampleTimes(sink: EncodedPacketSink, duration: number, signal?: AbortSignal): Promise<number[]> {
  const keys: number[] = [];
  let p = await sink.getFirstKeyPacket({ metadataOnly: true });
  let guard = 0;
  while (p && guard++ < 200000) {
    keys.push(p.timestamp);
    if (keys.length % 500 === 0) checkAbort(signal);
    p = await sink.getNextKeyPacket(p, { metadataOnly: true });
  }
  const avg = keys.length > 1 ? duration / keys.length : Infinity;
  // Muito longo para analisar tudo: no máximo ~1 amostra por segundo, e no mínimo 1 a cada 2,5 s
  const minGap = duration > 3600 ? 2 : 1;
  if (avg <= 2.5) {
    const out: number[] = [];
    for (const k of keys.sort((a, b) => a - b)) if (!out.length || k - out[out.length - 1] >= minGap) out.push(k);
    return out;
  }
  const step = duration > 3600 ? 3 : 2;
  const out: number[] = [];
  for (let t = 0; t < duration; t += step) out.push(t);
  return out;
}

export interface AnalyzeResult {
  analysis: Analysis;
  thumbs: { t: number; blob: Blob }[];
  notes: string[];
}

export async function analyzeVideo(file: Blob, duration: number, opts: AnalyzeOptions): Promise<AnalyzeResult> {
  const started = performance.now();
  const report = (p: AnalyzeProgress) => opts.onProgress?.(p);
  let vision = opts.useVision;
  const notes: string[] = [];
  if (vision) {
    report({ phase: "modelo", value: 0, detail: "Baixando o modelo de visão (uma vez só)…" });
    const files = new Map<string, ModelProgress>();
    // Se o download/carregamento ficar 2 minutos sem nenhum progresso, desiste e segue sem a IA de visão
    let lastProgress = Date.now();
    let watch: ReturnType<typeof setInterval> | undefined;
    const stalled = new Promise<never>((_, reject) => {
      watch = setInterval(() => {
        if (Date.now() - lastProgress > 120_000) reject(new Error("o modelo parou de carregar"));
      }, 5000);
    });
    try {
      await Promise.race([
        loadVision((p) => {
          lastProgress = Date.now();
          if (p.file) files.set(p.file, p);
          const tot = [...files.values()].reduce((a, f) => a + (f.total || 0), 0);
          const got = [...files.values()].reduce((a, f) => a + (f.loaded || 0), 0);
          report({ phase: "modelo", value: tot ? got / tot : 0, detail: `Modelo de visão: ${tot ? Math.round((got / 1e6) * 10) / 10 : 0} de ${Math.round((tot / 1e6) * 10) / 10} MB` });
        }),
        stalled,
      ]);
    } catch (e) {
      vision = false;
      notes.push(`A IA de visão não carregou neste aparelho (${e instanceof Error ? e.message : e}); a análise usou só imagem e som.`);
      report({ phase: "modelo", value: 1, detail: "Seguindo com a análise básica (imagem e som)." });
    } finally {
      clearInterval(watch);
    }
  }
  checkAbort(opts.signal);

  const input = openInput(file);
  try {
    const vt = await input.getPrimaryVideoTrack();
    if (!vt) throw new Error("Sem faixa de vídeo");
    report({ phase: "preparando", value: 0, detail: "Lendo o índice do vídeo…" });
    const times = await sampleTimes(new EncodedPacketSink(vt), duration, opts.signal);
    const small = new OffscreenCanvas(W, H);
    const sctx = small.getContext("2d", { willReadFrequently: true })!;
    const thumbCanvas = new OffscreenCanvas(160, 90);
    const tctx = thumbCanvas.getContext("2d")!;
    const samples: Sample[] = [];
    const thumbs: { t: number; blob: Blob }[] = [];
    let prev: Uint8ClampedArray | null = null;
    let prevHist: number[] | null = null;
    let batch: { idx: number; image: ImageData }[] = [];
    const inflight: Promise<void>[] = [];
    let visionFailed: string | null = null;
    const flush = () => {
      if (!batch.length || visionFailed) return;
      const b = batch;
      batch = [];
      inflight.push(
        withTimeout(classifyFrames(b.map((x) => x.image)), 120_000, "A IA de visão")
          .then((res) => {
            res.forEach((labels, k) => (samples[b[k].idx].labels = labels));
          })
          .catch((e) => {
            // Falhou ou ficou lenta demais: segue sem ela (sem travar a análise)
            visionFailed = e instanceof Error ? e.message : String(e);
          }),
      );
    };
    let lastThumb = -Infinity;
    let i = 0;
    let fallbackNote: string | null = null;
    const frames = readFrames(vt, file, times, {
      width: W,
      height: H,
      fill: true,
      poolSize: 3,
      signal: opts.signal,
      onFallback: (mode) => {
        fallbackNote = `O decodificador de vídeo do aparelho falhou; a leitura continuou com ${MODE_LABEL[mode]}.`;
        report({ phase: "imagens", value: i / times.length, detail: `Decodificador falhou, continuando com ${MODE_LABEL[mode]}…` });
      },
    });
    for await (const wrapped of frames) {
      checkAbort(opts.signal);
      const t = times[i++];
      if (!wrapped) continue;
      sctx.drawImage(wrapped.canvas, 0, 0, W, H);
      const img = sctx.getImageData(0, 0, W, H);
      const st = frameStats(img.data, W, H, prev, prevHist);
      prev = img.data;
      prevHist = st.hist;
      const idx = samples.length;
      samples.push({ t: wrapped.timestamp ?? t, motion: st.motion, brightness: st.brightness, saturation: st.saturation, fire: st.fire, siren: st.siren, detail: st.detail, variance: st.variance, cut: st.cut, cx: st.cx });
      if (t - lastThumb >= 2.9) {
        tctx.drawImage(wrapped.canvas, 0, 0, 160, 90);
        thumbs.push({ t, blob: await thumbCanvas.convertToBlob({ type: "image/jpeg", quality: 0.62 }) });
        lastThumb = t;
      }
      if (i % 4 === 0) await breathe();
      if (vision && !visionFailed) {
        batch.push({ idx, image: new ImageData(new Uint8ClampedArray(img.data), W, H) });
        if (batch.length >= 8) flush();
        // No máximo 2 lotes esperando o modelo (memória sob controle)
        while (inflight.length > 2) await inflight.shift();
      }
      if (i % 10 === 0) report({ phase: "imagens", value: i / times.length, detail: vision ? `IA de visão analisando os acontecimentos: ${i} de ${times.length} quadros` : `Analisando imagens: ${i} de ${times.length} quadros` });
    }
    flush();
    for (const p of inflight) await p;
    if (fallbackNote) notes.push(fallbackNote);
    if (visionFailed) {
      // Mistura de quadros com e sem IA daria notas incoerentes: usa a análise básica em tudo
      for (const smp of samples) delete smp.labels;
      vision = false;
      notes.push(`A IA de visão foi desligada no meio da análise (${visionFailed}); o resultado usa só imagem e som.`);
    }
    report({ phase: "imagens", value: 1, detail: `${samples.length} quadros analisados` });

    // ---------- Som ----------
    let audio: Analysis["audio"] = null;
    const at = await input.getPrimaryAudioTrack();
    if (at && (await at.canDecode())) try {
      const rate = 4;
      const values: number[] = [];
      let acc = 0;
      let count = 0;
      let windowSize = 0;
      let lastReport = 0;
      let nb = 0;
      for await (const { buffer, timestamp } of readAudio(at, 0, duration, { signal: opts.signal })) {
        if (++nb % 20 === 0) await breathe();
        checkAbort(opts.signal);
        if (!windowSize) windowSize = Math.round(buffer.sampleRate / rate);
        const chans = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
        for (let k = 0; k < buffer.length; k++) {
          let v = 0;
          for (const ch of chans) v += ch[k];
          v /= chans.length;
          acc += v * v;
          if (++count >= windowSize) {
            values.push(Math.sqrt(acc / count));
            acc = 0;
            count = 0;
          }
        }
        if (timestamp - lastReport > 20) {
          lastReport = timestamp;
          report({ phase: "som", value: timestamp / duration, detail: `Ouvindo o áudio: ${Math.round((timestamp / duration) * 100)}%` });
        }
      }
      audio = { rate, rms: normalizeEnvelope(values) };
    } catch (e) {
      if (opts.signal?.aborted) throw e;
      // Sem o som a análise continua (só com a imagem), em vez de falhar inteira
      audio = null;
      notes.push(`${e instanceof Error ? e.message : e} A análise usou só a imagem.`);
    }
    report({ phase: "momentos", value: 0.5, detail: "Identificando momentos e montando histórias…" });
    const tl = buildTimeline(samples, audio, duration);
    const moments = buildMoments(tl, opts.learned);
    const analysis: Analysis = { version: 1, mode: vision ? "ia" : "basica", samples, audio, moments, deadSeconds: deadSeconds(moments), createdAt: Date.now(), elapsedMs: Math.round(performance.now() - started) };
    report({ phase: "momentos", value: 1, detail: `${moments.filter((m) => !m.dead).length} momentos encontrados` });
    return { analysis, thumbs, notes };
  } finally {
    input.dispose();
  }
}

/** Intensidade por segundo (para o modo história contínua e o reenquadramento). */
export function intensityOf(analysis: Analysis, duration: number): number[] {
  return buildTimeline(analysis.samples, analysis.audio, duration).intensity;
}
