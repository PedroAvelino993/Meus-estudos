// Legendas: estilos, montagem a partir da transcrição, limpeza, idioma e exportação SRT.

import type { AspectFormat, Caption, CaptionStyle, CaptionStyleId, Segment, Word } from "./types";
import { sourceToOut } from "./timeline";
import { uid } from "./format";

export const CAPTION_STYLES: { id: CaptionStyleId; name: string; description: string }[] = [
  { id: "tradicional", name: "Tradicional", description: "Texto branco com contorno, frase inteira." },
  { id: "dinamica", name: "Dinâmica", description: "Frases curtas que entram com um pequeno salto." },
  { id: "destaque", name: "Palavra destacada", description: "A palavra falada no momento fica colorida." },
  { id: "viral", name: "Estilo viral", description: "Letras grandes, maiúsculas, poucas palavras por vez." },
  { id: "minimalista", name: "Minimalista", description: "Texto pequeno sobre faixa escura discreta." },
];

export const FONTS = ["Anton", "Inter", "Arial Black", "Impact", "Georgia"];

export function defaultStyle(id: CaptionStyleId, format: AspectFormat): CaptionStyle {
  const vertical = format === "9:16";
  const base: CaptionStyle = { id, font: "Inter", size: vertical ? 3.6 : 5.2, color: "#ffffff", highlight: "#ef4444", position: vertical ? 0.72 : 0.86, animation: "nenhuma", uppercase: false, outline: true, background: false };
  switch (id) {
    case "dinamica":
      return { ...base, font: "Inter", animation: "pop", size: base.size * 1.1 };
    case "destaque":
      return { ...base, font: "Anton", animation: "palavra", uppercase: true, size: base.size * 1.2, highlight: "#facc15" };
    case "viral":
      return { ...base, font: "Anton", animation: "pop", uppercase: true, size: base.size * 1.55, highlight: "#ef4444", position: vertical ? 0.6 : 0.8 };
    case "minimalista":
      return { ...base, font: "Inter", size: base.size * 0.8, outline: false, background: true, position: vertical ? 0.84 : 0.9 };
    default:
      return base;
  }
}

/** Idiomas de legenda oferecidos (código NLLB para a tradução local). */
export const LANGUAGES: { code: string; name: string; nllb: string }[] = [
  { code: "pt", name: "Português (Brasil)", nllb: "por_Latn" },
  { code: "en", name: "Inglês", nllb: "eng_Latn" },
  { code: "es", name: "Espanhol", nllb: "spa_Latn" },
  { code: "fr", name: "Francês", nllb: "fra_Latn" },
  { code: "de", name: "Alemão", nllb: "deu_Latn" },
  { code: "it", name: "Italiano", nllb: "ita_Latn" },
  { code: "ru", name: "Russo", nllb: "rus_Cyrl" },
  { code: "ja", name: "Japonês", nllb: "jpn_Jpan" },
  { code: "ko", name: "Coreano", nllb: "kor_Hang" },
  { code: "zh", name: "Chinês", nllb: "zho_Hans" },
  { code: "ar", name: "Árabe", nllb: "arb_Arab" },
  { code: "hi", name: "Hindi", nllb: "hin_Deva" },
];

export function languageName(code: string): string {
  if (code === "orig") return "Idioma original";
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}

const STOP: Record<string, string[]> = {
  pt: ["que", "não", "você", "uma", "com", "para", "está", "isso", "mano", "aqui", "vai", "então", "muito", "agora", "ele", "também", "tá", "né", "cara", "meu"],
  en: ["the", "you", "and", "that", "what", "this", "with", "for", "are", "just", "get", "your", "don't", "it's", "go", "man", "oh", "yeah", "come", "here"],
  es: ["que", "no", "el", "los", "las", "una", "con", "para", "está", "esto", "aquí", "vamos", "muy", "pero", "qué", "tío", "ahora", "eso", "hay", "yo"],
  fr: ["que", "les", "des", "est", "une", "pas", "vous", "avec", "pour", "c'est", "je", "il", "elle", "mais", "ici", "allez", "oui", "non", "très", "ça"],
  de: ["und", "die", "der", "das", "ist", "nicht", "ich", "du", "mit", "ein", "eine", "auf", "was", "hier", "jetzt", "ja", "nein", "aber", "noch", "mal"],
  it: ["che", "non", "il", "una", "con", "per", "sono", "questo", "qui", "andiamo", "molto", "ma", "cosa", "adesso", "io", "lui", "lei", "anche", "come", "ciao"],
};

/** Detecta o idioma predominante de um texto (pelas palavras mais comuns). */
export function detectLanguage(text: string): string | null {
  const words = text.toLowerCase().normalize("NFC").split(/[^\p{L}']+/u).filter(Boolean);
  if (words.length < 3) return null;
  if (/[぀-ヿ]/.test(text)) return "ja";
  if (/[가-힯]/.test(text)) return "ko";
  if (/[一-鿿]/.test(text)) return "zh";
  if (/[Ѐ-ӿ]/.test(text)) return "ru";
  if (/[؀-ۿ]/.test(text)) return "ar";
  let best: string | null = null;
  let bestN = 0;
  for (const [lang, list] of Object.entries(STOP)) {
    const set = new Set(list);
    const n = words.filter((w) => set.has(w)).length;
    if (n > bestN) ((bestN = n), (best = lang));
  }
  // Português e espanhol dividem palavras: acentos e letras próprias desempatam
  if ((best === "es" || best === "pt") && /[ãõç]|ção|ões|nh/.test(text)) best = "pt";
  else if (best === "pt" && /[ñ¿¡]/.test(text)) best = "es";
  return bestN >= 1 ? best : null;
}

/** Frases que o reconhecimento de fala costuma "inventar" em silêncio ou música. */
const HALLUCINATIONS = [/^\s*(thank you|thanks) for watching[.!]*\s*$/i, /^\s*obrigad[oa] por assistir[.!]*\s*$/i, /^\s*legendas? (pela|por) .*$/i, /^\s*subtitles? by .*$/i, /^\s*\[?(m[úu]sica|music|aplausos|applause|risos|laughter|silêncio|silence)\]?\s*$/i, /^\s*[.♪…\s-]+\s*$/, /^\s*you\s*$/i];

export interface RawChunk {
  text: string;
  start: number;
  end: number;
}

/** Limpa a transcrição: remove alucinações conhecidas, repetições e pedaços vazios. */
export function cleanChunks(chunks: RawChunk[], energyAt?: (t: number) => number): RawChunk[] {
  const out: RawChunk[] = [];
  for (const c of chunks) {
    const text = c.text.replace(/\s+/g, " ").trim();
    if (!text || HALLUCINATIONS.some((r) => r.test(text))) continue;
    if (!(c.end > c.start)) continue;
    // Texto "falado" num trecho praticamente mudo é quase sempre invenção do modelo
    if (energyAt && energyAt((c.start + c.end) / 2) < 0.015 && energyAt(c.start) < 0.015) continue;
    const prev = out[out.length - 1];
    if (prev && prev.text.toLowerCase() === text.toLowerCase()) {
      prev.end = Math.max(prev.end, c.end);
      continue;
    }
    // Repetição da mesma palavra várias vezes ("no no no no no no…")
    const ws = text.split(" ");
    if (ws.length >= 6 && new Set(ws.map((w) => w.toLowerCase())).size <= 2) continue;
    out.push({ text, start: c.start, end: c.end });
  }
  return out;
}

/** Distribui o tempo de cada palavra proporcionalmente ao tamanho dela. */
export function distributeWords(text: string, start: number, end: number): Word[] {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map((w) => 1 + w.replace(/[^\p{L}\p{N}]/gu, "").length);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const out: Word[] = [];
  let t = start;
  for (let i = 0; i < words.length; i++) {
    const d = ((end - start) * weights[i]) / total;
    out.push({ w: words[i], s: round(t), e: round(t + d) });
    t += d;
  }
  return out;
}

const round = (v: number) => Math.round(v * 1000) / 1000;

/** Quebra a transcrição em legendas curtas e legíveis (até ~7 palavras / 3,5 s). */
export function chunksToCaptions(chunks: RawChunk[], maxWords = 7, maxDur = 3.5): Caption[] {
  const out: Caption[] = [];
  for (const c of chunks) {
    const words = distributeWords(c.text, c.start, c.end);
    let group: Word[] = [];
    const flush = () => {
      if (!group.length) return;
      out.push({ id: uid("cap"), start: group[0].s, end: group[group.length - 1].e, text: group.map((w) => w.w).join(" "), words: group, translations: {} });
      group = [];
    };
    for (const w of words) {
      if (group.length && (group.length >= maxWords || w.e - group[0].s > maxDur)) flush();
      group.push(w);
      if (/[.!?…]$/.test(w.w) && group.length >= 3) flush();
    }
    flush();
  }
  return out;
}

/** Texto da legenda no idioma escolhido ("orig" = como foi falado). */
export function captionText(c: Caption, lang: string): string {
  if (lang === "orig") return c.text;
  return c.translations[lang] ?? c.text;
}

/** Palavras com tempo no idioma escolhido (traduções recebem tempos proporcionais). */
export function captionWords(c: Caption, lang: string): Word[] {
  if (lang === "orig" || !c.translations[lang]) return c.words.length ? c.words : distributeWords(c.text, c.start, c.end);
  return distributeWords(c.translations[lang], c.start, c.end);
}

export function captionAt(captions: Caption[], src: number): Caption | null {
  for (const c of captions) if (src >= c.start && src < c.end) return c;
  return null;
}

const srtTime = (t: number) => {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
};

/** Gera um arquivo .srt no tempo do clipe (legendas de trechos cortados ficam de fora). */
export function toSrt(captions: Caption[], segments: Segment[], lang: string): string {
  const lines: string[] = [];
  let n = 1;
  for (const c of captions) {
    const a = sourceToOut(segments, c.start);
    const b = sourceToOut(segments, Math.max(c.start, c.end - 0.01));
    if (a === null || b === null || b <= a) continue;
    lines.push(String(n++), `${srtTime(a)} --> ${srtTime(b + 0.01)}`, captionText(c, lang), "");
  }
  return lines.join("\n");
}

/** Separa falantes por tom de voz (estimativa): agrupa as legendas pela altura média da voz. */
export function assignSpeakers(captions: Caption[], pitchOf: (c: Caption) => number | null): Caption[] {
  const pitches = captions.map(pitchOf);
  const valid = pitches.filter((p): p is number => p !== null);
  if (valid.length < 4) return captions;
  const sorted = [...valid].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.2)];
  const hi = sorted[Math.floor(sorted.length * 0.8)];
  // Só separa quando há duas faixas de voz bem distintas (> 35% de diferença)
  if (hi / lo < 1.35) return captions.map((c) => ({ ...c, speaker: 1 }));
  let c1 = lo;
  let c2 = hi;
  for (let it = 0; it < 10; it++) {
    const g1 = valid.filter((p) => Math.abs(p - c1) <= Math.abs(p - c2));
    const g2 = valid.filter((p) => Math.abs(p - c1) > Math.abs(p - c2));
    if (g1.length) c1 = g1.reduce((a, b) => a + b, 0) / g1.length;
    if (g2.length) c2 = g2.reduce((a, b) => a + b, 0) / g2.length;
  }
  return captions.map((c, i) => {
    const p = pitches[i];
    return { ...c, speaker: p === null ? undefined : Math.abs(p - c1) <= Math.abs(p - c2) ? 1 : 2 };
  });
}

/** Estima a altura da voz (Hz) por autocorrelação num trecho de áudio a 16 kHz. */
export function estimatePitch(pcm: Float32Array, rate = 16000): number | null {
  const frame = 1024;
  const pitches: number[] = [];
  for (let off = 0; off + frame < pcm.length; off += frame) {
    let energy = 0;
    for (let i = 0; i < frame; i++) energy += pcm[off + i] ** 2;
    if (energy / frame < 1e-4) continue;
    let best = 0;
    let bestLag = 0;
    for (let lag = Math.floor(rate / 400); lag <= Math.floor(rate / 70); lag++) {
      let sum = 0;
      for (let i = 0; i < frame - lag; i++) sum += pcm[off + i] * pcm[off + i + lag];
      if (sum > best) ((best = sum), (bestLag = lag));
    }
    if (bestLag && best / energy > 0.3) pitches.push(rate / bestLag);
  }
  if (pitches.length < 3) return null;
  pitches.sort((a, b) => a - b);
  return pitches[Math.floor(pitches.length / 2)];
}
