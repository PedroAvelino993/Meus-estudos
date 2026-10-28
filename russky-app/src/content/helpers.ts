// Atalhos para escrever o conteúdo de forma compacta.

import type { LexEntry } from "../core/types";

/** Entrada do dicionário: w(id, russo com acento por apóstrofo, português, pronúncia aproximada, extras). */
export function w(id: string, ru: string, pt: string, tr: string, extra: Partial<LexEntry> = {}): LexEntry {
  return { id, ru, pt, tr, ...extra };
}

const PRON = ["я", "ты", "он/она'", "мы", "вы", "они'"];

/**
 * Formas do presente de um verbo regular da 1ª conjugação em -ать/-ять (чита'ть → чита'ю, чита'ешь…).
 * `stem` leva o acento por apóstrofo: "чита'".
 */
export function conj1(stem: string, pt: string[]): { ru: string; note: string }[] {
  const ends = ["ю", "ешь", "ет", "ем", "ете", "ют"];
  return ends.map((e, i) => ({ ru: stem + e, note: `${PRON[i]} ${stem.replace(/'/g, "")}${e} = ${pt[i]}` }));
}

/** Formas dadas por extenso (verbos irregulares ou da 2ª conjugação). */
export function forms(list: string[], pt: string[]): { ru: string; note: string }[] {
  return list.map((ru, i) => ({ ru, note: `${PRON[i]} ${ru.replace(/'/g, "")} = ${pt[i]}` }));
}
