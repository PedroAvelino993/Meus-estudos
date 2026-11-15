// Linha do tempo de um clipe: trechos do vídeo original em sequência.
// Operações do editor manual e mapeamento entre o tempo do clipe e o do vídeo original.

import type { AudioEnvelope, Sample, Segment } from "./types";
import { uid } from "./format";

export const MIN_SEG = 0.3;

export function seg(start: number, end: number, volume = 1): Segment {
  return { id: uid("s"), start: round(start), end: round(end), volume };
}

const round = (v: number) => Math.round(v * 1000) / 1000;

export function totalDuration(segments: Segment[]): number {
  return segments.reduce((a, s) => a + Math.max(0, s.end - s.start), 0);
}

/** Converte um instante do clipe no trecho e no tempo do vídeo original. */
export function outToSource(segments: Segment[], tOut: number): { index: number; src: number } | null {
  let acc = 0;
  for (let i = 0; i < segments.length; i++) {
    const d = segments[i].end - segments[i].start;
    if (tOut < acc + d || i === segments.length - 1) return { index: i, src: Math.min(segments[i].end, segments[i].start + Math.max(0, tOut - acc)) };
    acc += d;
  }
  return null;
}

/** Converte um instante do vídeo original no tempo do clipe (ou null se foi cortado). */
export function sourceToOut(segments: Segment[], src: number): number | null {
  let acc = 0;
  for (const s of segments) {
    if (src >= s.start && src < s.end) return acc + (src - s.start);
    acc += s.end - s.start;
  }
  return null;
}

/** Início de cada trecho no tempo do clipe. */
export function segmentOffsets(segments: Segment[]): number[] {
  const out: number[] = [];
  let acc = 0;
  for (const s of segments) {
    out.push(acc);
    acc += s.end - s.start;
  }
  return out;
}

// ---------- Edição ----------

export function splitAt(segments: Segment[], tOut: number): Segment[] {
  const pos = outToSource(segments, tOut);
  if (!pos) return segments;
  const s = segments[pos.index];
  if (pos.src - s.start < MIN_SEG || s.end - pos.src < MIN_SEG) return segments;
  const a = { ...s, end: round(pos.src) };
  const b = { ...s, id: uid("s"), start: round(pos.src) };
  return [...segments.slice(0, pos.index), a, b, ...segments.slice(pos.index + 1)];
}

export function removeSegment(segments: Segment[], id: string): Segment[] {
  return segments.length > 1 ? segments.filter((s) => s.id !== id) : segments;
}

export function moveSegment(segments: Segment[], id: string, dir: -1 | 1): Segment[] {
  const i = segments.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= segments.length) return segments;
  const out = [...segments];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

/** Ajusta o início/fim de um trecho (no tempo original), respeitando os limites do vídeo. */
export function trimSegment(segments: Segment[], id: string, start: number, end: number, duration: number): Segment[] {
  return segments.map((s) => {
    if (s.id !== id) return s;
    const a = Math.max(0, Math.min(start, duration - MIN_SEG));
    const b = Math.min(duration, Math.max(end, a + MIN_SEG));
    return { ...s, start: round(a), end: round(b) };
  });
}

export function updateSegment(segments: Segment[], id: string, patch: Partial<Segment>): Segment[] {
  return segments.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

/** Insere um trecho do vídeo original depois do trecho `afterId` (ou no fim). */
export function insertSegment(segments: Segment[], start: number, end: number, afterId?: string): Segment[] {
  const s = seg(start, end);
  if (!afterId) return [...segments, s];
  const i = segments.findIndex((x) => x.id === afterId);
  return [...segments.slice(0, i + 1), s, ...segments.slice(i + 1)];
}

/** Junta trechos consecutivos e contíguos no original (deixa a linha do tempo limpa). */
export function mergeContiguous(segments: Segment[], gap = 0.25): Segment[] {
  const out: Segment[] = [];
  for (const s of segments) {
    const last = out[out.length - 1];
    if (last && s.start >= last.end - 0.01 && s.start - last.end <= gap && last.volume === s.volume && last.cropX === s.cropX && last.zoom === s.zoom) last.end = Math.max(last.end, s.end);
    else out.push({ ...s });
  }
  return out;
}

/**
 * Remove silêncios longos dentro dos trechos: janelas com som baixo e imagem parada por
 * pelo menos `minGap` segundos viram cortes.
 */
export function removeSilences(segments: Segment[], audio: AudioEnvelope | null, samples: Sample[], minGap = 1.2, threshold = 0.08): Segment[] {
  if (!audio || !audio.rms.length) return segments;
  const out: Segment[] = [];
  for (const s of segments) {
    let cur = s.start;
    let silentFrom: number | null = null;
    const step = 1 / audio.rate;
    for (let t = s.start; t < s.end; t += step) {
      const v = audio.rms[Math.min(audio.rms.length - 1, Math.floor(t * audio.rate))] ?? 0;
      const still = motionAt(samples, t) < 0.05;
      if (v < threshold && still) {
        if (silentFrom === null) silentFrom = t;
      } else {
        if (silentFrom !== null && t - silentFrom >= minGap) {
          const keepEnd = silentFrom + 0.25;
          if (keepEnd - cur >= MIN_SEG) out.push({ ...s, id: uid("s"), start: round(cur), end: round(keepEnd) });
          cur = t - 0.15;
        }
        silentFrom = null;
      }
    }
    if (s.end - cur >= MIN_SEG) out.push({ ...s, id: uid("s"), start: round(cur), end: s.end });
  }
  return out.length ? out : segments;
}

function motionAt(samples: Sample[], t: number): number {
  if (!samples.length) return 1;
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (samples[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  return samples[lo].motion;
}

// ---------- Reenquadramento ----------

/**
 * Caminho suavizado do centro da ação (0–1) ao longo do vídeo. Em jogos em terceira pessoa
 * o personagem fica quase sempre no centro, então o caminho só se afasta do meio quando a
 * ação fica de um lado por vários segundos seguidos.
 */
export function actionPath(samples: Sample[]): { t: number; x: number }[] {
  const out: { t: number; x: number }[] = [];
  let x = 0.5;
  for (const s of samples) {
    const strength = Math.min(1, s.motion * 3);
    const target = 0.5 + (s.cx - 0.5) * (0.35 + 0.45 * strength);
    if (s.cut) x = 0.5;
    x += (target - x) * 0.35;
    out.push({ t: s.t, x: Math.max(0.2, Math.min(0.8, x)) });
  }
  return out;
}

export function pathAt(path: { t: number; x: number }[], t: number): number {
  if (!path.length) return 0.5;
  if (t <= path[0].t) return path[0].x;
  if (t >= path[path.length - 1].t) return path[path.length - 1].x;
  let lo = 0;
  let hi = path.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (path[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = path[lo];
  const b = path[hi];
  const k = (t - a.t) / Math.max(1e-6, b.t - a.t);
  // Suaviza a transição (sem trancos de câmera)
  const e = k * k * (3 - 2 * k);
  return a.x + (b.x - a.x) * e;
}
