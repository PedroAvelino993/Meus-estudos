// Junta todo o conteúdo, aplica a convenção do acento (ма'ма → ма́ма) e monta os índices.
// A interface e a lógica só acessam o conteúdo por aqui.

import type { LexEntry, Lesson, ReadingText, Unit, World } from "../core/types";
import { normalize, stripStress } from "../core/text";
import * as w1 from "./worlds/w1";
import * as w2 from "./worlds/w2";
import * as w3 from "./worlds/w3";
import * as w4 from "./worlds/w4";
import * as w5 from "./worlds/w5";
import { PLANNED } from "./worlds/planned";
import { ALPHABET as RAW_ALPHABET } from "./alphabet";
import { GRAMMAR as RAW_GRAMMAR } from "./grammar";
import { CONVERSATIONS as RAW_CONVOS } from "./conversations";
import { CHAPTERS as RAW_CHAPTERS, PLACES as RAW_PLACES, CITY as RAW_CITY } from "./story";
import { CHARACTERS as RAW_CHARS } from "./characters";

const VOWEL_STRESS = /([аеиоуыэюяАЕИОУЫЭЮЯ])'/g;

/** ма'ма → ма́ма (apóstrofo depois de vogal cirílica vira acento tônico). */
export function stressed(s: string): string {
  return s.replace(VOWEL_STRESS, "$1́");
}

/** Aplica a convenção em todas as strings de um objeto (cópia profunda). */
function deep<T>(value: T): T {
  if (typeof value === "string") return stressed(value) as T;
  if (Array.isArray(value)) return value.map(deep) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = deep(v);
    return out as T;
  }
  return value;
}

const RAW_WORLDS = [w1, w2, w3, w4, w5];

export const WORLDS: World[] = deep([...RAW_WORLDS.map((m) => m.world), ...PLANNED]);
export const LEXICON: LexEntry[] = deep(RAW_WORLDS.flatMap((m) => m.lexicon));
export const TEXTS: ReadingText[] = deep(RAW_WORLDS.flatMap((m) => ("texts" in m ? (m.texts as ReadingText[]) : [])));
export const ALPHABET = deep(RAW_ALPHABET);
export const GRAMMAR = deep(RAW_GRAMMAR);
export const CONVERSATIONS = deep(RAW_CONVOS);
export const CHAPTERS = deep(RAW_CHAPTERS);
export const PLACES = deep(RAW_PLACES);
export const CITY = deep(RAW_CITY);
export const CHARACTERS = deep(RAW_CHARS);

export const LEX = new Map(LEXICON.map((e) => [e.id, e]));

export function lex(id: string): LexEntry {
  const e = LEX.get(id);
  if (!e) throw new Error(`Palavra desconhecida no conteúdo: ${id}`);
  return e;
}

export function letter(ch: string) {
  return ALPHABET.find((l) => l.upper === ch || l.lower === ch);
}

export function grammar(id: string) {
  return GRAMMAR.find((g) => g.id === id);
}

export function text(id: string) {
  return TEXTS.find((t) => t.id === id);
}

export function character(id: string) {
  const c = CHARACTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Personagem desconhecido: ${id}`);
  return c;
}

export function conversation(id: string) {
  return CONVERSATIONS.find((c) => c.id === id);
}

export function place(id: string) {
  return PLACES.find((p) => p.id === id);
}

// ---------- Ordem do curso ----------

export interface LessonRef {
  lesson: Lesson;
  unit: Unit;
  world: World;
  /** Posição global (0, 1, 2…). */
  index: number;
}

export const ALL_UNITS: { unit: Unit; world: World }[] = WORLDS.flatMap((world) => world.units.map((unit) => ({ unit, world })));

export const ALL_LESSONS: LessonRef[] = ALL_UNITS.flatMap(({ unit, world }) => unit.lessons.map((lesson) => ({ lesson, unit, world, index: 0 }))).map(
  (r, index) => ({ ...r, index }),
);

const LESSON_BY_ID = new Map(ALL_LESSONS.map((r) => [r.lesson.id, r]));

export function lessonRef(id: string): LessonRef | undefined {
  return LESSON_BY_ID.get(id);
}

export function unitRef(id: string) {
  return ALL_UNITS.find((u) => u.unit.id === id);
}

/** Letras ensinadas até a lição (inclusive), na ordem do curso. */
export function lettersUntil(lessonId: string): Set<string> {
  const out = new Set<string>();
  for (const r of ALL_LESSONS) {
    for (const L of r.lesson.letters ?? []) out.add(L.toLowerCase());
    if (r.lesson.id === lessonId) break;
  }
  return out;
}

/** Palavras ensinadas até a lição (inclusive). */
export function wordsUntil(lessonId: string): string[] {
  const out: string[] = [];
  for (const r of ALL_LESSONS) {
    out.push(...(r.lesson.words ?? []));
    if (r.lesson.id === lessonId) break;
  }
  return out;
}

// ---------- Índice de formas (tocar numa palavra para traduzir) ----------

export interface FormHit {
  entry: LexEntry;
  /** Explicação da forma, quando não é a forma de dicionário. */
  note?: string;
}

const FORMS = new Map<string, FormHit[]>();

function addForm(key: string, hit: FormHit) {
  const k = normalize(key);
  if (!k) return;
  const list = FORMS.get(k) ?? [];
  if (!list.some((h) => h.entry.id === hit.entry.id)) list.push(hit);
  FORMS.set(k, list);
}

for (const e of LEXICON) {
  addForm(e.ru, { entry: e });
  for (const f of e.forms ?? []) {
    addForm(f.ru, { entry: e, note: f.note });
    // «в Москве́» também responde por «Москве́»
    const parts = stripStress(f.ru).split(/\s+/);
    if (parts.length > 1) addForm(parts[parts.length - 1], { entry: e, note: f.note });
  }
}

/** Procura uma palavra (em qualquer forma) no dicionário do app. Prefere palavras simples a expressões. */
export function lookup(word: string): FormHit[] {
  const hits = FORMS.get(normalize(word)) ?? [];
  return [...hits].sort((a, b) => Number(a.entry.pos === "phrase") - Number(b.entry.pos === "phrase"));
}

/** Ids do dicionário que aparecem numa frase (para creditar a revisão espaçada). */
export function wordIdsIn(sentence: string): string[] {
  const ids = new Set<string>();
  const n = normalize(sentence);
  // expressões inteiras primeiro
  for (const e of LEXICON) {
    if (e.pos !== "phrase") continue;
    const k = normalize(e.ru.replace(/…/g, ""));
    if (k && (` ${n} `).includes(` ${k} `)) ids.add(e.id);
  }
  for (const w of n.split(" ")) {
    const hits = FORMS.get(w);
    if (hits?.length) ids.add(hits.filter((h) => h.entry.pos !== "phrase")[0]?.entry.id ?? hits[0].entry.id);
  }
  return [...ids];
}
