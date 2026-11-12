// Contexto do jogo: estado, ações puras com salvamento automático e avisos.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { GameState } from "../core/state";
import { refresh } from "../core/progression";
import { save } from "../core/store";

export interface Toast {
  id: number;
  text: string;
  bad?: boolean;
}

interface Ctx {
  s: GameState;
  slot: number;
  /** Aplica uma ação pura. Se nada mudar, mostra `fail` (quando houver). */
  act: (fn: (s: GameState) => GameState, ok?: string, fail?: string) => boolean;
  replace: (s: GameState, slot?: number) => void;
  toast: (text: string, bad?: boolean) => void;
  toasts: Toast[];
  tab: string;
  go: (tab: string, focus?: string) => void;
  focus: string | null;
  exit: () => void;
}

const GameCtx = createContext<Ctx | null>(null);

/** Pede ao painel principal para realizar os eventos (avançar a semana). */
export function requestAdvance() {
  window.dispatchEvent(new Event("colosseum:advance"));
}

export function useGame(): Ctx {
  const c = useContext(GameCtx);
  if (!c) throw new Error("useGame fora do provedor");
  return c;
}

export function GameProvider({ initial, slot: slot0, onExit, children }: { initial: GameState; slot: number; onExit: () => void; children: ReactNode }) {
  const [s, setS] = useState(initial);
  const [slot, setSlot] = useState(slot0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tab, setTab] = useState("coliseu");
  const [focus, setFocus] = useState<string | null>(null);
  const ref = useRef(s);
  ref.current = s;
  const tid = useRef(1);

  const toast = useCallback((text: string, bad = false) => {
    const id = tid.current++;
    setToasts((t) => [...t.slice(-3), { id, text, bad }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const act = useCallback(
    (fn: (s: GameState) => GameState, ok?: string, fail?: string) => {
      const before = ref.current;
      const after = fn(before);
      if (after === before) {
        if (fail) toast(fail, true);
        return false;
      }
      const next = refresh(after);
      ref.current = next;
      setS(next);
      if (ok) toast(ok);
      return true;
    },
    [toast],
  );

  const replace = useCallback((n: GameState, sl?: number) => {
    ref.current = n;
    setS(n);
    if (sl) setSlot(sl);
  }, []);

  // Salvamento automático a cada mudança
  useEffect(() => {
    save(slot, s);
  }, [s, slot]);

  const go = useCallback((t: string, f?: string) => {
    setTab(t);
    setFocus(f ?? null);
    window.scrollTo({ top: 0 });
  }, []);

  return <GameCtx.Provider value={{ s, slot, act, replace, toast, toasts, tab, go, focus, exit: onExit }}>{children}</GameCtx.Provider>;
}
