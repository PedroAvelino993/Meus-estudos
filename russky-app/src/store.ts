// Estado global do app: um objeto imutável salvo no aparelho.
// Componentes leem com useStudent() e alteram com update(fn).

import { useSyncExternalStore } from "react";
import { type StudentState, type StorageAdapter, initialState, localStorageAdapter, migrate } from "./core/state";
import { checkAchievements, type Achievement } from "./core/achievements";

let adapter: StorageAdapter = localStorageAdapter;
let state: StudentState = migrate(adapter.load());
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

type AchievementListener = (list: Achievement[]) => void;
const achievementListeners = new Set<AchievementListener>();

export function getState(): StudentState {
  return state;
}

/** Aplica uma mudança, verifica conquistas e agenda o salvamento. */
export function update(fn: (s: StudentState) => StudentState): void {
  const next = fn(state);
  if (next === state) return;
  const { state: withAch, unlocked } = checkAchievements(next, Date.now());
  state = withAch;
  listeners.forEach((l) => l());
  if (unlocked.length) achievementListeners.forEach((l) => l(unlocked));
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 250);
}

export function flush(): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  adapter.save(state);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function onAchievements(l: AchievementListener): () => void {
  achievementListeners.add(l);
  return () => achievementListeners.delete(l);
}

export function useStudent(): StudentState {
  return useSyncExternalStore(subscribe, getState, getState);
}

/** Troca o armazenamento (testes ou, no futuro, sincronização). */
export function setAdapter(a: StorageAdapter): void {
  adapter = a;
  state = migrate(a.load());
  listeners.forEach((l) => l());
}

/** Apaga todo o progresso (Configurações). */
export function resetAll(): void {
  state = initialState();
  flush();
  listeners.forEach((l) => l());
}

/** Exporta o progresso como JSON (backup manual). */
export function exportJson(): string {
  return JSON.stringify(state, null, 2);
}

export function importJson(text: string): boolean {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || !("items" in parsed)) return false;
    state = migrate(parsed);
    flush();
    listeners.forEach((l) => l());
    return true;
  } catch {
    return false;
  }
}
