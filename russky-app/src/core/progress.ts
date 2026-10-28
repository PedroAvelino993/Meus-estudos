// Regras de progressão: o que está desbloqueado, qual é a próxima lição e como medir o domínio.
// Uma unidade só libera a próxima depois do teste de domínio (ou do teste para pular).

import { ALL_LESSONS, ALL_UNITS, ALPHABET, CHAPTERS, CONVERSATIONS, LEXICON, PLACES, WORLDS, grammar, letter, lex } from "../content";
import type { Skill } from "./types";
import { SKILLS } from "./types";
import { type ItemState, mastery, strength } from "./srs";
import type { StudentState } from "./state";

export const SKIP_PASS = 0.9;

export function unitIndex(unitId: string): number {
  return ALL_UNITS.findIndex((u) => u.unit.id === unitId);
}

export function lessonPassed(s: StudentState, lessonId: string): boolean {
  const ref = ALL_LESSONS.find((r) => r.lesson.id === lessonId);
  return !!s.lessons[lessonId]?.passed || (!!ref && unitComplete(s, ref.unit.id));
}

/** Todas as lições da unidade aprovadas (ou a unidade foi pulada por teste). */
export function unitLessonsDone(s: StudentState, unitId: string): boolean {
  const u = ALL_UNITS.find((x) => x.unit.id === unitId);
  if (!u) return false;
  return unitComplete(s, unitId) || u.unit.lessons.every((l) => !!s.lessons[l.id]?.passed);
}

/** Unidade concluída de verdade: teste de domínio aprovado. */
export function unitComplete(s: StudentState, unitId: string): boolean {
  return !!s.tests[unitId]?.passed;
}

export function unitUnlocked(s: StudentState, unitId: string): boolean {
  const i = unitIndex(unitId);
  if (i <= 0) return i === 0;
  return unitComplete(s, ALL_UNITS[i - 1].unit.id);
}

export function lessonUnlocked(s: StudentState, lessonId: string): boolean {
  const ref = ALL_LESSONS.find((r) => r.lesson.id === lessonId);
  if (!ref) return false;
  if (!unitUnlocked(s, ref.unit.id)) return false;
  const i = ref.unit.lessons.findIndex((l) => l.id === lessonId);
  return i === 0 || lessonPassed(s, ref.unit.lessons[i - 1].id);
}

export type TestKind = "mastery" | "skip";

/** O teste da unidade está disponível? «mastery» depois das lições; «skip» para quem já sabe. */
export function unitTestKind(s: StudentState, unitId: string): TestKind | null {
  if (!unitUnlocked(s, unitId)) return null;
  return unitLessonsDone(s, unitId) ? "mastery" : "skip";
}

export type NextStep = { kind: "lesson"; lessonId: string } | { kind: "test"; unitId: string } | { kind: "done" };

export function nextStep(s: StudentState): NextStep {
  for (const { unit } of ALL_UNITS) {
    if (unitComplete(s, unit.id)) continue;
    if (!unitUnlocked(s, unit.id)) break;
    const l = unit.lessons.find((x) => !s.lessons[x.id]?.passed);
    if (l) return { kind: "lesson", lessonId: l.id };
    return { kind: "test", unitId: unit.id };
  }
  return { kind: "done" };
}

export function currentWorld(s: StudentState) {
  const n = nextStep(s);
  const id = n.kind === "lesson" ? ALL_LESSONS.find((r) => r.lesson.id === n.lessonId)?.world.id : n.kind === "test" ? ALL_UNITS.find((u) => u.unit.id === n.unitId)?.world.id : null;
  return WORLDS.find((w) => w.id === id) ?? WORLDS.filter((w) => w.units.length).slice(-1)[0];
}

export function currentUnit(s: StudentState) {
  const n = nextStep(s);
  if (n.kind === "lesson") return ALL_LESSONS.find((r) => r.lesson.id === n.lessonId)?.unit;
  if (n.kind === "test") return ALL_UNITS.find((u) => u.unit.id === n.unitId)?.unit;
  return undefined;
}

/** Nível CEFR aproximado pelo conteúdo concluído. */
export function levelLabel(s: StudentState): string {
  const done = ALL_UNITS.filter((u) => unitComplete(s, u.unit.id));
  if (!done.length) return "Iniciante absoluto";
  return done[done.length - 1].world.level;
}

/** Progresso geral (fração de lições aprovadas). */
export function overallProgress(s: StudentState): number {
  const total = ALL_LESSONS.length;
  return total ? ALL_LESSONS.filter((r) => lessonPassed(s, r.lesson.id)).length / total : 0;
}

// ---------- História e conversas ----------

export function chapterAvailable(s: StudentState, chapterId: string): boolean {
  const ch = CHAPTERS.find((c) => c.id === chapterId);
  if (!ch) return false;
  const i = CHAPTERS.indexOf(ch);
  const prevDone = i === 0 || !!s.chapters[CHAPTERS[i - 1].id]?.done;
  return prevDone && ch.requires.every((u) => unitLessonsDone(s, u));
}

export function convoAvailable(s: StudentState, convoId: string): boolean {
  const c = CONVERSATIONS.find((x) => x.id === convoId);
  return !!c && c.requires.every((u) => unitLessonsDone(s, u));
}

export function placeUnlocked(s: StudentState, placeId: string): boolean {
  const p = PLACES.find((x) => x.id === placeId);
  if (!p) return false;
  if (p.unlockedBy === null) return true;
  if (p.unlockedBy === "future") return false;
  return unitLessonsDone(s, p.unlockedBy);
}

/** Personagens que o estudante já conheceu na história. */
export function metCharacters(s: StudentState): string[] {
  const met = new Set<string>();
  for (const ch of CHAPTERS) {
    if (!s.chapters[ch.id]?.done) continue;
    for (const p of ch.panels) {
      if (p.k === "say") met.add(p.who);
      if (p.k === "mission") {
        const c = CONVERSATIONS.find((x) => x.id === p.convo);
        if (c) met.add(c.character);
      }
    }
  }
  return [...met];
}

// ---------- Domínio ----------

export interface Counts {
  seen: number;
  learning: number;
  practicing: number;
  mastered: number;
  total: number;
}

function countOf(items: (ItemState | undefined)[], total: number): Counts {
  const c: Counts = { seen: 0, learning: 0, practicing: 0, mastered: 0, total };
  for (const it of items) {
    if (!it) continue;
    c.seen++;
    const m = mastery(it);
    if (m === "aprendendo" || m === "novo") c.learning++;
    else if (m === "praticando") c.practicing++;
    else c.mastered++;
  }
  return c;
}

export function alphabetCounts(s: StudentState): Counts {
  return countOf(
    ALPHABET.map((l) => s.items[`L:${l.lower}`]),
    ALPHABET.length,
  );
}

export function vocabCounts(s: StudentState): Counts {
  return countOf(
    LEXICON.filter((e) => e.pos !== "name").map((e) => s.items[`W:${e.id}`]),
    LEXICON.filter((e) => e.pos !== "name").length,
  );
}

/** Competência por habilidade (0–1): taxa de acerto ponderada pela força dos itens. */
export function skillScores(s: StudentState): Record<Skill, { score: number; answers: number }> {
  const out = {} as Record<Skill, { score: number; answers: number }>;
  const items = Object.values(s.items);
  const avgStrength = items.length ? items.reduce((a, b) => a + strength(b), 0) / items.length : 0;
  for (const sk of SKILLS) {
    const r = s.skills[sk];
    const answers = r.right + r.wrong;
    const acc = answers ? r.right / answers : 0;
    // Confiança cresce com o volume: 30 respostas = confiança plena
    const conf = Math.min(1, answers / 30);
    out[sk] = { score: answers ? acc * (0.6 + 0.4 * avgStrength) * (0.5 + 0.5 * conf) : 0, answers };
  }
  return out;
}

export const SKILL_LABEL: Record<Skill, string> = {
  leitura: "Leitura",
  escrita: "Escrita",
  audicao: "Audição",
  fala: "Fala",
  vocabulario: "Vocabulário",
  gramatica: "Gramática",
};

/** Nome legível de um item da revisão. */
export function itemLabel(id: string): { ru: string; pt: string; kind: string } {
  const key = id.slice(2);
  if (id.startsWith("L:")) {
    const l = letter(key);
    return { ru: l ? `${l.upper} ${l.lower}` : key, pt: l ? `letra «${l.sound}»` : "", kind: "Letra" };
  }
  if (id.startsWith("G:")) {
    const g = grammar(key);
    return { ru: "", pt: g?.title ?? key, kind: "Gramática" };
  }
  try {
    const e = lex(key);
    return { ru: e.ru, pt: e.pt, kind: "Palavra" };
  } catch {
    return { ru: key, pt: "", kind: "Palavra" };
  }
}
