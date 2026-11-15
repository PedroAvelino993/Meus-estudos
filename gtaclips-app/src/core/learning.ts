// Aprendizado com os dados reais do canal (YouTube Analytics conectado pelo usuário):
// descobre que tipos de clipe funcionam melhor e ajusta a pontuação dos próximos.

import type { Category } from "./types";
import { CATEGORIES } from "./categories";

export interface VideoStats {
  id: string;
  title: string;
  description: string;
  tags: string[];
  publishedAt: string;
  durationSec: number;
  views: number;
  likes: number;
  comments: number;
  /** Porcentagem média assistida (YouTube Analytics), quando disponível. */
  avgViewPct: number | null;
  minutesWatched: number | null;
  subscribersGained: number | null;
}

const KEYWORDS: Partial<Record<Category, string[]>> = {
  perseguicao: ["perseguição", "perseguicao", "fuga", "chase", "pursuit", "escape", "fugindo"],
  policia: ["polícia", "policia", "police", "cops", "procurado", "wanted", "estrelas"],
  explosao: ["explosão", "explosao", "explodiu", "explosion", "explode", "boom", "bomba"],
  acidente: ["batida", "acidente", "crash", "bateu", "capotou", "wreck"],
  tiroteio: ["tiroteio", "tiro", "shootout", "gun", "tiros", "guerra"],
  briga: ["briga", "porrada", "fight", "soco", "brawl"],
  engracado: ["engraçado", "engracado", "funny", "kkk", "lol", "bizarro", "absurdo", "fail", "zoeira"],
  queda: ["queda", "caiu", "fall", "pulo", "jump", "ragdoll"],
  aereo: ["avião", "aviao", "helicóptero", "helicoptero", "plane", "heli", "voo"],
  aquatico: ["barco", "lancha", "jet ski", "boat", "água", "agua"],
  cinematico: ["cinematic", "cinematográfico", "paisagem", "pôr do sol", "gráficos", "graficos"],
};

/** Classifica um vídeo do canal pelo título, descrição e tags. */
export function guessCategory(v: Pick<VideoStats, "title" | "description" | "tags">): Category | null {
  const text = `${v.title} ${v.tags.join(" ")} ${v.description.slice(0, 300)}`.toLowerCase();
  let best: Category | null = null;
  let bestN = 0;
  for (const [cat, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    const n = words.filter((w) => text.includes(w)).length;
    if (n > bestN) ((bestN = n), (best = cat));
  }
  return best;
}

export interface CategoryPerformance {
  category: Category;
  videos: number;
  medianViews: number;
  avgViewPct: number | null;
  /** Desempenho relativo à mediana do canal (1 = igual). */
  relative: number;
  /** Peso aplicado na pontuação (só com amostra suficiente). */
  weight: number;
}

const median = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/**
 * Compara as categorias pelo número de visualizações e pela porcentagem assistida.
 * Só ajusta o peso de uma categoria com pelo menos 3 vídeos, e no máximo ±20%.
 */
export function analyzePerformance(videos: VideoStats[]): CategoryPerformance[] {
  const channelMedian = median(videos.map((v) => v.views)) || 1;
  const withPct = videos.filter((v) => v.avgViewPct !== null);
  const channelPct = withPct.length ? withPct.reduce((a, v) => a + v.avgViewPct!, 0) / withPct.length : null;
  const groups = new Map<Category, VideoStats[]>();
  for (const v of videos) {
    const c = guessCategory(v);
    if (!c) continue;
    groups.set(c, [...(groups.get(c) ?? []), v]);
  }
  const out: CategoryPerformance[] = [];
  for (const [category, vs] of groups) {
    const mv = median(vs.map((v) => v.views));
    const pcts = vs.filter((v) => v.avgViewPct !== null).map((v) => v.avgViewPct!);
    const avgPct = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;
    let relative = mv / channelMedian;
    if (avgPct !== null && channelPct) relative = relative * 0.6 + (avgPct / channelPct) * 0.4;
    const weight = vs.length >= 3 ? Math.max(0.8, Math.min(1.2, 1 + (Math.log2(Math.max(0.05, relative)) * 0.12))) : 1;
    out.push({ category, videos: vs.length, medianViews: mv, avgViewPct: avgPct, relative, weight: Math.round(weight * 100) / 100 });
  }
  return out.sort((a, b) => b.relative - a.relative);
}

export function weightsFrom(perf: CategoryPerformance[]): Partial<Record<Category, number>> {
  const w: Partial<Record<Category, number>> = {};
  for (const p of perf) if (p.weight !== 1 && CATEGORIES.some((c) => c.id === p.category)) w[p.category] = p.weight;
  return w;
}

/** Duração ISO 8601 do YouTube (PT1M30S) em segundos. */
export function isoDuration(iso: string): number {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 86400 + Number(m[2] ?? 0) * 3600 + Number(m[3] ?? 0) * 60 + Number(m[4] ?? 0);
}
