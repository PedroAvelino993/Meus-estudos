// Medidas extraídas de cada quadro (pixels RGBA reduzidos) e do áudio.
// Funções puras: rodam no navegador durante a análise e nos testes.

import type { AudioEnvelope, Category, Sample } from "./types";

export interface FrameStats {
  motion: number;
  brightness: number;
  saturation: number;
  fire: number;
  siren: number;
  detail: number;
  variance: number;
  cut: boolean;
  cx: number;
  /** Histograma de luminosidade (16 faixas) para detectar cortes de cena. */
  hist: number[];
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Calcula as medidas de um quadro pequeno (ex.: 96×54) comparando com o anterior. */
export function frameStats(px: Uint8ClampedArray, w: number, h: number, prev: Uint8ClampedArray | null, prevHist: number[] | null): FrameStats {
  const n = w * h;
  let sumL = 0;
  let sumL2 = 0;
  let sumSat = 0;
  let fire = 0;
  let siren = 0;
  let grad = 0;
  let diff = 0;
  const colDiff = new Float64Array(w);
  const hist = new Array(16).fill(0);
  const luma = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    luma[i] = l;
    sumL += l;
    sumL2 += l * l;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    sumSat += mx === 0 ? 0 : (mx - mn) / mx;
    if (r > 200 && g > 100 && b < 130 && r > g && g > b) fire++;
    if ((r > 170 && g < 70 && b < 80) || (b > 170 && r < 70 && g < 120)) siren++;
    hist[Math.min(15, Math.floor(l / 16))]++;
    if (prev) {
      const pl = 0.299 * prev[i * 4] + 0.587 * prev[i * 4 + 1] + 0.114 * prev[i * 4 + 2];
      const d = Math.abs(l - pl);
      diff += d;
      colDiff[i % w] += d;
    }
  }
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i = y * w + x;
      grad += Math.abs(luma[i] - luma[i + 1]) + Math.abs(luma[i] - luma[i + w]);
    }
  }
  const mean = sumL / n;
  const variance = Math.sqrt(Math.max(0, sumL2 / n - mean * mean)) / 128;
  for (let k = 0; k < 16; k++) hist[k] /= n;
  let cut = false;
  if (prevHist) {
    let dist = 0;
    for (let k = 0; k < 16; k++) dist += Math.abs(hist[k] - prevHist[k]);
    cut = dist > 0.9 && diff / n / 255 > 0.18;
  }
  // Centro horizontal da mudança (ação), com peso para o centro: em jogos de terceira
  // pessoa o personagem costuma ficar no meio da tela.
  let cx = 0.5;
  if (prev) {
    let tot = 0;
    let acc = 0;
    for (let x = 0; x < w; x++) {
      tot += colDiff[x];
      acc += colDiff[x] * ((x + 0.5) / w);
    }
    if (tot > 0) cx = acc / tot;
  }
  return {
    motion: prev ? clamp01((diff / n / 255) * 3.2) : 0,
    brightness: mean / 255,
    saturation: sumSat / n,
    fire: fire / n,
    siren: siren / n,
    detail: clamp01((grad / (n * 2) / 255) * 6),
    variance: clamp01(variance),
    cut,
    cx,
    hist,
  };
}

/** Volume RMS de uma janela de amostras de áudio (mono). */
export function rms(data: Float32Array, from = 0, to = data.length): number {
  let s = 0;
  const end = Math.min(to, data.length);
  for (let i = from; i < end; i++) s += data[i] * data[i];
  return end > from ? Math.sqrt(s / (end - from)) : 0;
}

/** Normaliza o envelope de áudio pelo percentil 95 (vídeos baixos ou altos ficam comparáveis). */
export function normalizeEnvelope(values: number[]): number[] {
  if (!values.length) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1e-6;
  return values.map((v) => clamp01(v / Math.max(p95, 1e-4)));
}

/** Uma linha por segundo do vídeo, combinando imagem, som e classificação. */
export interface SecondRow {
  t: number;
  motion: number;
  audio: number;
  audioPeak: number;
  fire: number;
  siren: number;
  brightness: number;
  detail: number;
  variance: number;
  cut: boolean;
  cx: number;
  probs: Record<Category, number>;
  /** Confiança da classificação (0–1). */
  confidence: number;
}

/** Interpola as amostras (irregulares, nos quadros-chave) para uma grade de 1 segundo. */
export function toSeconds(samples: Sample[], audio: AudioEnvelope | null, duration: number, classify: (s: Sample, audio: number) => { probs: Record<Category, number>; confidence: number }): SecondRow[] {
  const n = Math.max(1, Math.ceil(duration));
  const rows: SecondRow[] = [];
  let j = 0;
  for (let t = 0; t < n; t++) {
    while (j + 1 < samples.length && Math.abs(samples[j + 1].t - (t + 0.5)) <= Math.abs(samples[j].t - (t + 0.5))) j++;
    const s = samples[j] ?? { t, motion: 0, brightness: 0, saturation: 0, fire: 0, siren: 0, detail: 0, variance: 0, cut: false, cx: 0.5 };
    let a = 0;
    let peak = 0;
    if (audio && audio.rms.length) {
      const from = Math.floor(t * audio.rate);
      const to = Math.min(audio.rms.length, Math.floor((t + 1) * audio.rate));
      for (let k = from; k < to; k++) {
        a += audio.rms[k];
        peak = Math.max(peak, audio.rms[k]);
      }
      a = to > from ? a / (to - from) : 0;
    }
    const c = classify(s, a);
    rows.push({ t, motion: s.motion, audio: a, audioPeak: peak, fire: s.fire, siren: s.siren, brightness: s.brightness, detail: s.detail, variance: s.variance, cut: s.cut && Math.abs(s.t - (t + 0.5)) < 1, cx: s.cx, probs: c.probs, confidence: c.confidence });
  }
  return rows;
}
