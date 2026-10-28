// Estado do estudante e as regras que o atualizam (funções puras, fáceis de testar).
// A persistência fica atrás de StorageAdapter para trocar por um servidor no futuro.

import type { Skill } from "./types";
import { type ItemState, type Mode, type Quality, newItem, review } from "./srs";
import type { Flags } from "./convo";

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "russky:v1";

export interface DayStats {
  xp: number;
  seconds: number;
  answers: number;
  correct: number;
  lessons: number;
  reviews: number;
  convos: number;
  audio: number;
  typed: number;
  newItems: number;
}

export interface LessonRecord {
  best: number;
  runs: number;
  passed: boolean;
  gold: boolean;
  last: number;
}

export interface TestRecord {
  best: number;
  runs: number;
  passed: boolean;
  last: number;
  /** Conceitos com erro na última tentativa (para recomendações). */
  weak: string[];
}

export interface Transcript {
  at: number;
  turns: { who: "npc" | "me"; ru: string; pt?: string; ok?: boolean }[];
}

export interface ConvoRecord {
  runs: number;
  completed: number;
  best: number;
  transcripts: Transcript[];
}

export interface Mistake {
  at: number;
  item: string;
  exercise: string;
  got: string;
  expected: string;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  sound: boolean;
  dailyGoal: number;
  translit: "auto" | "always" | "never";
  motion: "system" | "reduce" | "full";
  voiceURI: string | null;
  rate: number;
  /** Nome do estudante em cirílico (usado nas conversas). */
  nameRu: string;
  name: string;
  frame: string;
  accent: string;
}

export interface StudentState {
  version: number;
  createdAt: number;
  onboarded: boolean;
  items: Record<string, ItemState>;
  lessons: Record<string, LessonRecord>;
  tests: Record<string, TestRecord>;
  xp: number;
  days: Record<string, DayStats>;
  skills: Record<Skill, { right: number; wrong: number }>;
  streak: { count: number; best: number; lastDay: string | null; freezes: number; freezeUsed: string[] };
  settings: Settings;
  flags: Flags;
  chapters: Record<string, { done: boolean; at: number }>;
  convos: Record<string, ConvoRecord>;
  achievements: Record<string, number>;
  mistakes: Mistake[];
  lastLesson: string | null;
  missionsClaimed: Record<string, string[]>;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  sound: true,
  dailyGoal: 30,
  translit: "auto",
  motion: "system",
  voiceURI: null,
  rate: 1,
  nameRu: "",
  name: "",
  frame: "classic",
  accent: "red",
};

export function emptyDay(): DayStats {
  return { xp: 0, seconds: 0, answers: 0, correct: 0, lessons: 0, reviews: 0, convos: 0, audio: 0, typed: 0, newItems: 0 };
}

export function initialState(now = Date.now()): StudentState {
  return {
    version: SCHEMA_VERSION,
    createdAt: now,
    onboarded: false,
    items: {},
    lessons: {},
    tests: {},
    xp: 0,
    days: {},
    skills: { leitura: { right: 0, wrong: 0 }, escrita: { right: 0, wrong: 0 }, audicao: { right: 0, wrong: 0 }, fala: { right: 0, wrong: 0 }, vocabulario: { right: 0, wrong: 0 }, gramatica: { right: 0, wrong: 0 } },
    streak: { count: 0, best: 0, lastDay: null, freezes: 0, freezeUsed: [] },
    settings: { ...DEFAULT_SETTINGS },
    flags: {},
    chapters: {},
    convos: {},
    achievements: {},
    mistakes: [],
    lastLesson: null,
    missionsClaimed: {},
  };
}

/** Converte qualquer versão salva para a atual, preenchendo campos novos sem perder dados. */
export function migrate(raw: unknown, now = Date.now()): StudentState {
  const base = initialState(now);
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<StudentState>;
  return {
    ...base,
    ...s,
    version: SCHEMA_VERSION,
    settings: { ...base.settings, ...(s.settings ?? {}) },
    skills: { ...base.skills, ...(s.skills ?? {}) },
    streak: { ...base.streak, ...(s.streak ?? {}) },
    items: s.items ?? {},
    lessons: s.lessons ?? {},
    tests: s.tests ?? {},
    days: s.days ?? {},
    flags: s.flags ?? {},
    chapters: s.chapters ?? {},
    convos: s.convos ?? {},
    achievements: s.achievements ?? {},
    mistakes: Array.isArray(s.mistakes) ? s.mistakes : [],
    missionsClaimed: s.missionsClaimed ?? {},
  };
}

// ---------- Persistência ----------

export interface StorageAdapter {
  load(): unknown;
  save(state: StudentState): void;
}

export const localStorageAdapter: StorageAdapter = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // armazenamento cheio ou bloqueado: o app continua funcionando nesta sessão
    }
  },
};

// ---------- Datas ----------

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n).getTime());
}

function today(s: StudentState, now: number): [StudentState, DayStats] {
  const k = dayKey(now);
  const day = { ...emptyDay(), ...(s.days[k] ?? {}) };
  return [s, day];
}

function withDay(s: StudentState, now: number, f: (d: DayStats) => void): StudentState {
  const k = dayKey(now);
  const [, day] = today(s, now);
  f(day);
  return { ...s, days: { ...s.days, [k]: day } };
}

// ---------- Sequência de dias (sem punir demais quem falta) ----------

/**
 * Atualiza a sequência ao estudar. Cada 7 dias seguidos dão uma «proteção» (até 2):
 * um dia perdido gasta a proteção e a sequência continua.
 */
export function touchStreak(s: StudentState, now: number): StudentState {
  const k = dayKey(now);
  const st = { ...s.streak, freezeUsed: [...s.streak.freezeUsed] };
  if (st.lastDay === k) return s;
  if (st.lastDay === null) {
    st.count = 1;
  } else {
    let gap = 0;
    let cur = st.lastDay;
    while (cur < k && gap < 400) {
      cur = addDays(cur, 1);
      gap++;
    }
    const missed = gap - 1;
    if (missed <= 0) st.count += 1;
    else if (missed <= st.freezes) {
      st.freezes -= missed;
      for (let i = 1; i <= missed; i++) st.freezeUsed.push(addDays(st.lastDay, i));
      st.count += 1;
    } else st.count = 1;
  }
  if (st.count > 0 && st.count % 7 === 0) st.freezes = Math.min(2, st.freezes + 1);
  st.best = Math.max(st.best, st.count);
  st.lastDay = k;
  return { ...s, streak: st };
}

/** Sequência mostrada hoje (zera se já passou um dia sem estudo e sem proteção suficiente). */
export function currentStreak(s: StudentState, now: number): number {
  const st = s.streak;
  if (!st.lastDay) return 0;
  const k = dayKey(now);
  if (st.lastDay === k || addDays(st.lastDay, 1) === k) return st.count;
  let missed = 0;
  let cur = st.lastDay;
  while (cur < k && missed < 400) {
    cur = addDays(cur, 1);
    missed++;
  }
  return missed - 1 <= st.freezes ? st.count : 0;
}

// ---------- XP ----------

export const XP = {
  firstTry: 10,
  hinted: 5,
  corrected: 2,
  review: 6,
  lessonBonus: 10,
  goldBonus: 10,
  testPass: 30,
  convoTurn: 8,
  chapter: 0,
};

export function levelOf(xp: number): { level: number; into: number; need: number } {
  // nível n exige 100·n·(n+1)/2 XP acumulados
  let level = 1;
  while (xp >= (100 * level * (level + 1)) / 2) level++;
  const prev = (100 * (level - 1) * level) / 2;
  const next = (100 * level * (level + 1)) / 2;
  return { level, into: xp - prev, need: next - prev };
}

export function addXp(s: StudentState, amount: number, now: number): StudentState {
  if (amount <= 0) return s;
  const s2 = withDay(touchStreak(s, now), now, (d) => {
    d.xp += amount;
  });
  return { ...s2, xp: s.xp + amount };
}

// ---------- Respostas ----------

export interface AnswerEvent {
  items: string[];
  quality: Quality;
  mode: Mode;
  skill: Skill;
  /** Primeira tentativa neste exercício? Repetições de correção dão pouco XP. */
  firstTry: boolean;
  audio?: boolean;
  typed?: boolean;
  /** Em revisão (vale um pouco menos XP que exercício novo, mas também conta). */
  inReview?: boolean;
  /** Repetindo uma lição já dominada: metade do XP. */
  replay?: boolean;
  exercise?: string;
  got?: string;
  expected?: string;
}

export function recordAnswer(s: StudentState, ev: AnswerEvent, now: number): { state: StudentState; xp: number } {
  const items = { ...s.items };
  let fresh = 0;
  for (const id of ev.items) {
    const prev = items[id] ?? newItem(id, now);
    if (prev.seen === 0) fresh++;
    items[id] = review(prev, ev.quality, ev.mode, now);
  }
  const ok = ev.quality !== "wrong";
  const skills = { ...s.skills, [ev.skill]: { right: s.skills[ev.skill].right + (ok ? 1 : 0), wrong: s.skills[ev.skill].wrong + (ok ? 0 : 1) } };
  let xp = 0;
  if (ok) {
    if (!ev.firstTry) xp = XP.corrected;
    else if (ev.quality === "hinted") xp = XP.hinted;
    else xp = ev.inReview ? XP.review : XP.firstTry;
    if (ev.replay) xp = Math.ceil(xp / 2);
  }
  let state: StudentState = { ...s, items, skills };
  state = withDay(state, now, (d) => {
    d.answers++;
    if (ok) d.correct++;
    if (ev.inReview) d.reviews++;
    if (ev.audio && ok) d.audio++;
    if (ev.typed && ok) d.typed++;
    d.newItems += fresh;
  });
  if (!ok && ev.exercise) {
    const m: Mistake = { at: now, item: ev.items[0] ?? "", exercise: ev.exercise, got: ev.got ?? "", expected: ev.expected ?? "" };
    state = { ...state, mistakes: [m, ...state.mistakes].slice(0, 200) };
  }
  state = addXp(state, xp, now);
  return { state, xp };
}

/** Marca um item como visto (cartões de ensino), sem contar como acerto. */
export function markSeen(s: StudentState, ids: string[], now: number): StudentState {
  const items = { ...s.items };
  let fresh = 0;
  for (const id of ids) {
    if (!items[id]) {
      items[id] = { ...newItem(id, now), seen: 0, due: now };
      fresh++;
    }
  }
  return fresh ? { ...s, items } : s;
}

// ---------- Lições e testes ----------

export const PASS = 0.7;
export const GOLD = 0.9;
export const TEST_PASS = 0.8;

export function finishLesson(s: StudentState, lessonId: string, accuracy: number, now: number): { state: StudentState; xp: number; passed: boolean } {
  const prev = s.lessons[lessonId];
  const passed = accuracy >= PASS;
  const rec: LessonRecord = {
    best: Math.max(prev?.best ?? 0, accuracy),
    runs: (prev?.runs ?? 0) + 1,
    passed: (prev?.passed ?? false) || passed,
    gold: (prev?.gold ?? false) || accuracy >= GOLD,
    last: now,
  };
  let xp = passed ? XP.lessonBonus + (accuracy >= GOLD ? XP.goldBonus : 0) : 0;
  if (prev?.gold) xp = Math.ceil(xp / 2);
  let state: StudentState = { ...s, lessons: { ...s.lessons, [lessonId]: rec }, lastLesson: lessonId };
  state = withDay(state, now, (d) => {
    if (passed) d.lessons++;
  });
  state = addXp(state, xp, now);
  return { state, xp, passed };
}

export function finishTest(s: StudentState, testId: string, accuracy: number, weak: string[], now: number, threshold = TEST_PASS): { state: StudentState; xp: number; passed: boolean } {
  const prev = s.tests[testId];
  const passed = accuracy >= threshold;
  const rec: TestRecord = { best: Math.max(prev?.best ?? 0, accuracy), runs: (prev?.runs ?? 0) + 1, passed: (prev?.passed ?? false) || passed, last: now, weak };
  const xp = passed && !prev?.passed ? XP.testPass : 0;
  const state = addXp({ ...s, tests: { ...s.tests, [testId]: rec } }, xp, now);
  return { state, xp, passed };
}

export function finishConvo(s: StudentState, convoId: string, transcript: Transcript, understood: number, turns: number, flags: Flags, now: number): { state: StudentState; xp: number } {
  const prev = s.convos[convoId] ?? { runs: 0, completed: 0, best: 0, transcripts: [] };
  const score = turns ? understood / turns : 0;
  const rec: ConvoRecord = {
    runs: prev.runs + 1,
    completed: prev.completed + 1,
    best: Math.max(prev.best, score),
    transcripts: [transcript, ...prev.transcripts].slice(0, 5),
  };
  // XP por fala entendida; repetir a mesma conversa rende metade
  let xp = understood * XP.convoTurn;
  if (prev.completed > 0) xp = Math.ceil(xp / 2);
  let state: StudentState = { ...s, convos: { ...s.convos, [convoId]: rec }, flags: { ...s.flags, ...flags } };
  state = withDay(state, now, (d) => {
    d.convos++;
  });
  state = addXp(state, xp, now);
  return { state, xp };
}

export function finishChapter(s: StudentState, chapterId: string, flags: Flags, xpReward: number, now: number): { state: StudentState; xp: number } {
  const first = !s.chapters[chapterId]?.done;
  let state: StudentState = { ...s, chapters: { ...s.chapters, [chapterId]: { done: true, at: now } }, flags: { ...s.flags, ...flags } };
  const xp = first ? xpReward : 0;
  state = addXp(state, xp, now);
  return { state, xp };
}

export function addStudyTime(s: StudentState, seconds: number, now: number): StudentState {
  if (seconds <= 0) return s;
  return withDay(s, now, (d) => {
    d.seconds += seconds;
  });
}

// ---------- Missões diárias ----------

export interface Mission {
  id: string;
  title: string;
  target: number;
  progress: (d: DayStats) => number;
  xp: number;
}

const MISSION_POOL: Mission[] = [
  { id: "xp", title: "Ganhe 40 XP", target: 40, progress: (d) => d.xp, xp: 10 },
  { id: "lesson", title: "Conclua 1 lição", target: 1, progress: (d) => d.lessons, xp: 10 },
  { id: "lessons2", title: "Conclua 2 lições", target: 2, progress: (d) => d.lessons, xp: 15 },
  { id: "review", title: "Revise 10 itens", target: 10, progress: (d) => d.reviews, xp: 15 },
  { id: "convo", title: "Termine uma conversa", target: 1, progress: (d) => d.convos, xp: 15 },
  { id: "audio", title: "Acerte 5 exercícios de áudio", target: 5, progress: (d) => d.audio, xp: 10 },
  { id: "typed", title: "Escreva 5 respostas em cirílico", target: 5, progress: (d) => d.typed, xp: 10 },
  { id: "correct", title: "Acerte 20 exercícios", target: 20, progress: (d) => d.correct, xp: 10 },
];

/** Três missões do dia, sempre as mesmas para a mesma data. */
export function missionsFor(day: string): Mission[] {
  let h = 0;
  for (const ch of day) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = [...MISSION_POOL];
  const out: Mission[] = [];
  while (out.length < 3 && pool.length) {
    h = (h * 1103515245 + 12345) >>> 0;
    const m = pool.splice(h % pool.length, 1)[0];
    if (out.some((x) => x.id.startsWith("lesson") && m.id.startsWith("lesson"))) continue;
    out.push(m);
  }
  return out;
}

export function claimMission(s: StudentState, missionId: string, now: number): { state: StudentState; xp: number } {
  const k = dayKey(now);
  const m = missionsFor(k).find((x) => x.id === missionId);
  const claimed = s.missionsClaimed[k] ?? [];
  const day = s.days[k] ?? emptyDay();
  if (!m || claimed.includes(missionId) || m.progress(day) < m.target) return { state: s, xp: 0 };
  const state = addXp({ ...s, missionsClaimed: { ...s.missionsClaimed, [k]: [...claimed, missionId] } }, m.xp, now);
  return { state, xp: m.xp };
}

export function weekXp(s: StudentState, now: number): number {
  let total = 0;
  for (let i = 0; i < 7; i++) total += s.days[dayKey(now - i * 86400000)]?.xp ?? 0;
  return total;
}
