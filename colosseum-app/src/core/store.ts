// Salvamento automático em 3 espaços (localStorage) + exportar/importar.

import type { GameState } from "./state";
import { migrate } from "./state";

const KEY = (slot: number) => `colosseum-inc:slot${slot}`;
const LAST = "colosseum-inc:last";

export interface SlotInfo {
  slot: number;
  name: string;
  week: number;
  era: number;
  money: number;
  savedAt: number;
}

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function save(slot: number, s: GameState): boolean {
  const st = storage();
  if (!st) return false;
  try {
    st.setItem(KEY(slot), JSON.stringify({ savedAt: Date.now(), state: s }));
    st.setItem(LAST, String(slot));
    return true;
  } catch {
    return false;
  }
}

export function load(slot: number): GameState | null {
  const st = storage();
  if (!st) return null;
  try {
    const raw = st.getItem(KEY(slot));
    if (!raw) return null;
    return migrate(JSON.parse(raw).state);
  } catch {
    return null;
  }
}

export function lastSlot(): number | null {
  const v = storage()?.getItem(LAST);
  return v ? Number(v) : null;
}

export function slots(): (SlotInfo | null)[] {
  const st = storage();
  return [1, 2, 3].map((slot) => {
    try {
      const raw = st?.getItem(KEY(slot));
      if (!raw) return null;
      const { savedAt, state } = JSON.parse(raw);
      return { slot, name: state.name, week: state.week, era: state.era, money: state.money, savedAt };
    } catch {
      return null;
    }
  });
}

export function erase(slot: number) {
  storage()?.removeItem(KEY(slot));
}

export function exportSave(s: GameState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
}

export function importSave(code: string): GameState | null {
  try {
    return migrate(JSON.parse(decodeURIComponent(escape(atob(code.trim())))));
  } catch {
    return null;
  }
}
