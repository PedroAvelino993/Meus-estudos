// Identificação e pontuação dos momentos.
// Combina o que o modelo de visão reconheceu em cada quadro (quando disponível) com
// medidas de imagem e som, segmenta o vídeo em momentos e dá uma nota de 0 a 100.

import type { Analysis, Category, Moment, Sample, ScoreFactors } from "./types";
import { CATEGORIES, CATEGORY_IDS, category, linked } from "./categories";
import { toSeconds, type SecondRow } from "./features";
import { fmtTime } from "./format";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function emptyProbs(): Record<Category, number> {
  return Object.fromEntries(CATEGORY_IDS.map((c) => [c, 0])) as Record<Category, number>;
}

/**
 * Evidência a partir das medidas de imagem e som (sem modelo de visão).
 * É grosseira por natureza: separa telas paradas, escuras e lisas de ação, fogo e sirenes.
 */
export function heuristicProbs(s: Pick<Sample, "motion" | "brightness" | "fire" | "siren" | "detail" | "variance" | "saturation">, audio: number): Record<Category, number> {
  const p = emptyProbs();
  const still = s.motion < 0.03;
  if (s.brightness < 0.07 || (s.variance < 0.06 && s.detail < 0.05)) p.carregamento += 1.2;
  if (still && s.detail > 0.12 && s.saturation < 0.25 && audio < 0.25) p.menu += 0.8;
  if (still && audio < 0.15) p.parado += 0.7;
  if (s.fire > 0.05) p.explosao += 0.6 + s.fire * 4 + audio * 0.6;
  if (s.siren > 0.006) p.policia += 0.4 + s.siren * 30;
  if (s.motion > 0.25 && audio > 0.45) p.perseguicao += 0.5 + (s.siren > 0.004 ? 0.5 : 0);
  if (s.motion > 0.35 && audio > 0.7) p.acidente += 0.45;
  if (audio > 0.85 && s.motion > 0.15) p.tiroteio += 0.3;
  if (s.motion >= 0.1 && s.motion <= 0.3 && audio < 0.6) p.conducao += 0.55;
  if (s.motion >= 0.03 && s.motion < 0.1 && audio < 0.4) p.andando += 0.55;
  if (s.motion < 0.08 && s.brightness > 0.35 && s.saturation > 0.35 && s.detail > 0.15) p.cinematico += 0.3;
  const sum = Object.values(p).reduce((a, b) => a + b, 0);
  if (sum === 0) p.conducao = 0.2;
  return p;
}

/** Junta as probabilidades do CLIP (quando houver) com a evidência das medidas. */
export function classifySample(s: Sample, audio: number): { probs: Record<Category, number>; confidence: number } {
  const h = heuristicProbs(s, audio);
  const hs = Object.values(h).reduce((a, b) => a + b, 0) || 1;
  const probs = emptyProbs();
  if (s.labels) {
    for (const c of CATEGORY_IDS) probs[c] = 0.75 * (s.labels[c] ?? 0) + 0.25 * (h[c] / hs);
    const sorted = Object.values(probs).sort((a, b) => b - a);
    return { probs, confidence: clamp01(0.35 + (sorted[0] - sorted[1]) * 2.2) };
  }
  for (const c of CATEGORY_IDS) probs[c] = h[c] / hs;
  const sorted = Object.values(probs).sort((a, b) => b - a);
  return { probs, confidence: clamp01(0.2 + (sorted[0] - sorted[1]) * 1.2) * 0.7 };
}

function top(probs: Record<Category, number>): Category {
  let best: Category = "conducao";
  let v = -1;
  for (const c of CATEGORY_IDS) if (probs[c] > v) ((v = probs[c]), (best = c));
  return best;
}

/** Linhas por segundo prontas para segmentar (intensidade e novidade calculadas). */
export interface Timeline {
  rows: SecondRow[];
  cats: Category[];
  intensity: number[];
  novelty: number[];
}

export function buildTimeline(samples: Sample[], audio: Analysis["audio"], duration: number): Timeline {
  const rows = toSeconds(samples, audio, duration, classifySample);
  const raw = rows.map((r) => top(r.probs));
  // Suaviza a categoria com uma janela de 5 s (voto ponderado pela confiança)
  const cats = raw.map((_, i) => {
    const votes = new Map<Category, number>();
    for (let k = Math.max(0, i - 2); k <= Math.min(rows.length - 1, i + 2); k++) votes.set(raw[k], (votes.get(raw[k]) ?? 0) + 0.5 + rows[k].confidence + (k === i ? 0.4 : 0));
    return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
  });
  const intensity = rows.map((r, i) => {
    const info = category(cats[i]);
    const base = 0.42 * r.motion + 0.38 * r.audio + 0.1 * r.audioPeak + Math.min(0.2, r.fire * 2) + Math.min(0.15, r.siren * 8);
    return clamp01(base * (info.dead ? 0.35 : 0.75 + info.interest * 0.35));
  });
  // Novidade: quanto o momento foge do que vinha acontecendo nos 30 s anteriores
  const novelty = intensity.map((v, i) => {
    const from = Math.max(0, i - 30);
    const prev = intensity.slice(from, i);
    if (prev.length < 5) return 0;
    const mean = prev.reduce((a, b) => a + b, 0) / prev.length;
    const sd = Math.sqrt(prev.reduce((a, b) => a + (b - mean) ** 2, 0) / prev.length) || 0.05;
    return Math.max(0, (v - mean) / sd);
  });
  return { rows, cats, intensity, novelty };
}

interface Run {
  start: number;
  end: number;
  cat: Category;
}

/** Divide o vídeo em trechos contínuos (momentos) de mesma natureza. */
export function segment(tl: Timeline): Run[] {
  const runs: Run[] = [];
  for (let i = 0; i < tl.cats.length; i++) {
    const last = runs[runs.length - 1];
    if (last && last.cat === tl.cats[i] && !tl.rows[i].cut) last.end = i + 1;
    else runs.push({ start: i, end: i + 1, cat: tl.cats[i] });
  }
  // Junta trechos muito curtos ao vizinho mais parecido (evita picotar)
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      if (r.end - r.start >= 3 || runs.length === 1) continue;
      const peak = Math.max(...tl.intensity.slice(r.start, r.end));
      if (peak > 0.75 && !category(r.cat).dead) continue;
      const prev = runs[i - 1];
      const next = runs[i + 1];
      const target = !prev ? next : !next ? prev : linked(prev.cat, r.cat) || (next && prev.end - prev.start >= next.end - next.start) ? prev : next;
      if (target === prev) prev.end = r.end;
      else if (next) next.start = r.start;
      runs.splice(i, 1);
      i--;
    }
    // Funde vizinhos que ficaram com a mesma categoria
    for (let i = 1; i < runs.length; i++) {
      if (runs[i].cat === runs[i - 1].cat) {
        runs[i - 1].end = runs[i].end;
        runs.splice(i, 1);
        i--;
      }
    }
  }
  // Divide trechos longos nos vales de intensidade (máx. ~25 s)
  const out: Run[] = [];
  for (const r of runs) {
    let s = r.start;
    while (r.end - s > 28) {
      let cut = s + 20;
      let low = Infinity;
      for (let k = s + 12; k < Math.min(r.end - 6, s + 28); k++) {
        if (tl.intensity[k] < low) {
          low = tl.intensity[k];
          cut = k;
        }
      }
      out.push({ start: s, end: cut, cat: r.cat });
      s = cut;
    }
    out.push({ start: s, end: r.end, cat: r.cat });
  }
  return out;
}

const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const sd = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
};

export const FACTOR_LABEL: Record<keyof ScoreFactors, string> = {
  intensidade: "Intensidade",
  surpresa: "Surpresa",
  humor: "Humor",
  historia: "Importância na história",
  visual: "Qualidade visual",
  ritmo: "Ritmo",
  retencao: "Potencial de retenção (estimado)",
  clareza: "Clareza",
};

const WEIGHTS: ScoreFactors = { intensidade: 0.22, surpresa: 0.16, humor: 0.1, historia: 0.12, visual: 0.08, ritmo: 0.08, retencao: 0.14, clareza: 0.1 };

/** Cria a lista de momentos com pontuação e descrição. `learned` vem do desempenho real do canal. */
export function buildMoments(tl: Timeline, learned: Partial<Record<Category, number>> = {}): Moment[] {
  const runs = segment(tl);
  return runs.map((r, idx) => {
    const info = category(r.cat);
    const rows = tl.rows.slice(r.start, r.end);
    const int = tl.intensity.slice(r.start, r.end);
    const nov = tl.novelty.slice(r.start, r.end);
    const peakIdx = int.indexOf(Math.max(...int));
    const prev = runs[idx - 1];
    const next = runs[idx + 1];
    const conf = mean(rows.map((x) => x.confidence));
    const stability = mean(rows.map((x) => (x.probs[r.cat] ?? 0) > 0.2 ? 1 : 0.5));
    const bright = mean(rows.map((x) => x.brightness));
    const detail = mean(rows.map((x) => x.detail));
    const cuts = rows.filter((x) => x.cut).length / Math.max(1, rows.length);
    const intensidade = 100 * clamp01(0.55 * mean(int) + 0.45 * Math.max(...int)) * (info.action ? 1 : 0.85);
    const surpresa = 100 * clamp01(Math.max(...nov) / 3 + (prev && !linked(prev.cat, r.cat) && info.action ? 0.15 : 0));
    const humor = 100 * clamp01(info.humor * (0.6 + 0.4 * Math.max(...int)));
    const historia = 100 * clamp01((prev && linked(prev.cat, r.cat) ? 0.3 : 0.1) + (next && linked(r.cat, next.cat) ? 0.3 : 0.1) + (info.action ? 0.3 : 0.1) + Math.min(0.2, (r.end - r.start) / 60));
    const visual = 100 * clamp01((bright > 0.12 && bright < 0.85 ? 0.7 : 0.35) + detail * 0.5 - cuts * 0.3);
    const ritmo = 100 * clamp01(1 - Math.abs(sd(int) - 0.15) * 3) * (mean(int) > 0.1 ? 1 : 0.5);
    const retencao = clamp01((0.35 * intensidade + 0.3 * surpresa + 0.2 * info.interest * 100 + 0.15 * humor) / 100) * 100;
    const clareza = 100 * clamp01(conf * 0.7 + stability * 0.3);
    const factors: ScoreFactors = { intensidade, surpresa, humor, historia, visual, ritmo, retencao, clareza };
    let score = (Object.keys(WEIGHTS) as (keyof ScoreFactors)[]).reduce((a, k) => a + factors[k] * WEIGHTS[k], 0);
    score *= 0.55 + 0.45 * info.interest;
    score *= learned[r.cat] ?? 1;
    // Notas de ação acima de ~55 já são fortes; esticamos a escala para usar 0–100 de verdade
    score = 100 * (1 - Math.exp(-(score * 1.25) / 60)) * 1.12;
    score = Math.min(100, score);
    if (info.dead) score = Math.min(score, 12);
    const rounded = (f: ScoreFactors) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, Math.round(v)])) as unknown as ScoreFactors;
    const m: Moment = {
      id: `m${r.start}`,
      start: r.start,
      end: Math.min(r.end, Math.max(r.start + 1, tl.rows.length)),
      category: r.cat,
      score: Math.round(score),
      factors: rounded(factors),
      description: "",
      thumbT: r.start + peakIdx + 0.5,
      dead: info.dead,
      peakT: r.start + peakIdx,
    };
    m.description = describe(m, rows, prev?.cat, next?.cat);
    return m;
  });
}

/** Descrição curta em português, baseada no que foi medido (sem inventar fatos). */
export function describe(m: Moment, rows: SecondRow[], prev?: Category, next?: Category): string {
  const info = category(m.category);
  const dur = m.end - m.start;
  const loud = rows.some((r) => r.audioPeak > 0.85);
  const fast = mean(rows.map((r) => r.motion)) > 0.25;
  const sirens = rows.some((r) => r.siren > 0.008);
  const fire = rows.some((r) => r.fire > 0.05);
  const parts: string[] = [];
  switch (m.category) {
    case "perseguicao":
      parts.push(`Perseguição${sirens ? " com sirenes" : ""}${fast ? " em alta velocidade" : ""}`);
      break;
    case "policia":
      parts.push("Polícia em cena");
      break;
    case "explosao":
      parts.push(fire ? "Explosão com fogo visível" : "Possível explosão");
      break;
    case "acidente":
      parts.push("Batida ou acidente");
      break;
    case "tiroteio":
      parts.push("Troca de tiros");
      break;
    case "briga":
      parts.push("Confronto corpo a corpo");
      break;
    case "engracado":
      parts.push("Situação inusitada");
      break;
    case "queda":
      parts.push("Queda");
      break;
    case "menu":
      parts.push("Menu do jogo (tempo morto)");
      break;
    case "carregamento":
      parts.push("Tela de carregamento ou tela preta (tempo morto)");
      break;
    case "mapa":
      parts.push("Tela de mapa (tempo morto)");
      break;
    case "parado":
      parts.push("Espera, nada acontecendo (tempo morto)");
      break;
    case "andando":
      parts.push("Personagem andando sem acontecimentos");
      break;
    default:
      parts.push(info.name);
  }
  if (loud && !info.dead) parts.push(`pico de som aos ${fmtTime(m.peakT)}`);
  if (prev && linked(prev, m.category) && prev !== m.category && !info.dead) parts.push(`continua o trecho de ${category(prev).name.toLowerCase()}`);
  if (next && linked(m.category, next) && next !== m.category && !info.dead) parts.push(`leva a ${category(next).name.toLowerCase()}`);
  return `${parts.join(" · ")} (${dur}s).`;
}

export function deadSeconds(moments: Moment[]): number {
  return moments.filter((m) => m.dead).reduce((a, m) => a + (m.end - m.start), 0);
}

export function categoryName(c: Category): string {
  return CATEGORIES.find((x) => x.id === c)?.name ?? c;
}
