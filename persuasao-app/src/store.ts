// Salvamento automático no navegador (localStorage), com 3 espaços, exportação e importação.
// Só guardamos o estado do jogo: nenhuma informação pessoal ou financeira real.

import { type GameState, migrate } from "./core/game";

export const SLOTS = 3;
const KEY = (slot: number) => `persuasao:v1:slot${slot}`;
const CURRENT = "persuasao:v1:current";
const PREFS = "persuasao:v1:prefs";

export interface SlotInfo {
  slot: number;
  name: string;
  day: number;
  money: number;
  chapter: number;
  savedAt: number;
}

export interface Prefs {
  sound: boolean;
  reducedMotion: boolean;
  textSpeed: "normal" | "rapido";
}

function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function safeSet(k: string, v: string): boolean {
  try {
    localStorage.setItem(k, v);
    return true;
  } catch {
    return false;
  }
}

export function save(slot: number, s: GameState): boolean {
  return safeSet(KEY(slot), JSON.stringify({ savedAt: Date.now(), state: s })) && safeSet(CURRENT, String(slot));
}

export function load(slot: number): GameState | null {
  const raw = safeGet(KEY(slot));
  if (!raw) return null;
  try {
    return migrate(JSON.parse(raw).state);
  } catch {
    return null;
  }
}

export function slotInfo(slot: number): SlotInfo | null {
  const raw = safeGet(KEY(slot));
  if (!raw) return null;
  try {
    const { savedAt, state } = JSON.parse(raw);
    return { slot, name: state.player.name, day: state.day, money: state.money, chapter: state.chapter, savedAt };
  } catch {
    return null;
  }
}

export function currentSlot(): number | null {
  const v = Number(safeGet(CURRENT));
  return Number.isInteger(v) && v >= 1 && v <= SLOTS && slotInfo(v) ? v : null;
}

export function removeSlot(slot: number) {
  try {
    localStorage.removeItem(KEY(slot));
    if (safeGet(CURRENT) === String(slot)) localStorage.removeItem(CURRENT);
  } catch {
    /* sem armazenamento */
  }
}

export function exportSave(s: GameState): string {
  return JSON.stringify({ game: "the-art-of-persuasion", version: s.version, state: s }, null, 0);
}

export function importSave(text: string): GameState | null {
  try {
    const data = JSON.parse(text);
    if (data?.game !== "the-art-of-persuasion") return null;
    return migrate(data.state);
  } catch {
    return null;
  }
}

export function loadPrefs(): Prefs {
  const base: Prefs = { sound: true, reducedMotion: false, textSpeed: "normal" };
  try {
    return { ...base, ...JSON.parse(safeGet(PREFS) ?? "{}") };
  } catch {
    return base;
  }
}

export function savePrefs(p: Prefs) {
  safeSet(PREFS, JSON.stringify(p));
}
