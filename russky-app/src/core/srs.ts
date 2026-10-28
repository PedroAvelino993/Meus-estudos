// Revisão espaçada. Cada letra, palavra ou tópico de gramática tem um estado de domínio.
// Acertos sem ajuda aumentam o intervalo; erros encurtam; acertos com dica quase não contam.
// Um item só fica "dominado" depois de vários acertos espaçados no tempo, incluindo produção.

export type Mode = "recognize" | "produce" | "listen" | "read" | "speak" | "convo";

export interface ItemState {
  id: string;
  seen: number;
  right: number;
  wrong: number;
  hinted: number;
  streak: number;
  ease: number;
  /** Intervalo atual em dias. */
  interval: number;
  due: number;
  last: number;
  /** Última vez em que o agendamento mudou (vários acertos seguidos na mesma sessão contam uma vez). */
  scheduled: number;
  lapses: number;
  modes: Partial<Record<Mode, number>>;
}

export type Quality = "wrong" | "hinted" | "right";

export const DAY = 24 * 60 * 60 * 1000;
const SAME_SESSION = 6 * 60 * 60 * 1000;
const RELEARN = 10 * 60 * 1000;

export function newItem(id: string, now: number): ItemState {
  return { id, seen: 0, right: 0, wrong: 0, hinted: 0, streak: 0, ease: 2.3, interval: 0, due: now, last: 0, scheduled: 0, lapses: 0, modes: {} };
}

/** Registra uma resposta e devolve o novo estado (não altera o original). */
export function review(prev: ItemState, q: Quality, mode: Mode, now: number): ItemState {
  const s: ItemState = { ...prev, modes: { ...prev.modes }, seen: prev.seen + 1, last: now };
  if (q === "wrong") {
    s.wrong++;
    if (prev.streak > 0 || prev.interval > 0) s.lapses++;
    s.streak = 0;
    s.ease = Math.max(1.3, s.ease - 0.2);
    s.interval = 0;
    s.due = now + RELEARN;
    s.scheduled = now;
    return s;
  }
  if (q === "hinted") {
    s.hinted++;
    s.ease = Math.max(1.3, s.ease - 0.05);
    // Com ajuda não avança o intervalo: volta logo para confirmar sem dica
    s.due = Math.min(prev.due > now ? prev.due : now + DAY, now + DAY);
    return s;
  }
  s.right++;
  s.modes[mode] = (s.modes[mode] ?? 0) + 1;
  // Vários acertos na mesma sessão não "fingem" que o tempo passou
  if (prev.scheduled && now - prev.scheduled < SAME_SESSION && prev.interval > 0) return s;
  s.streak++;
  if (s.interval === 0) s.interval = 1;
  else if (s.interval === 1) s.interval = 3;
  else s.interval = Math.round(s.interval * s.ease);
  s.interval = Math.min(s.interval, 180);
  s.ease = Math.min(3.0, s.ease + 0.05);
  s.due = now + s.interval * DAY;
  s.scheduled = now;
  return s;
}

export type Mastery = "novo" | "aprendendo" | "praticando" | "dominado";

export const MASTERY_LABEL: Record<Mastery, string> = {
  novo: "Novo",
  aprendendo: "Aprendendo",
  praticando: "Praticando",
  dominado: "Dominado",
};

/** Nível de domínio. Palavras precisam ter sido produzidas (escritas/montadas) para ficarem dominadas. */
export function mastery(s: ItemState | undefined): Mastery {
  if (!s || s.seen === 0) return "novo";
  if (s.right < 2 || s.interval < 3) return "aprendendo";
  const needsProduction = s.id.startsWith("W:");
  const produced = (s.modes.produce ?? 0) + (s.modes.convo ?? 0) > 0;
  if (s.interval >= 21 && s.right >= 4 && (!needsProduction || produced)) return "dominado";
  return "praticando";
}

/** 0–1: força do item, usada nos gráficos de competência. */
export function strength(s: ItemState | undefined): number {
  if (!s || s.seen === 0) return 0;
  const m = mastery(s);
  const base = { novo: 0, aprendendo: 0.25, praticando: 0.6, dominado: 0.9 }[m];
  const acc = s.right / Math.max(1, s.right + s.wrong);
  return Math.min(1, base + 0.1 * acc);
}

export function isDue(s: ItemState, now: number): boolean {
  return s.seen > 0 && s.due <= now;
}

/** Prioridade para a revisão: atrasados e difíceis primeiro. */
export function reviewPriority(s: ItemState, now: number): number {
  const overdue = Math.max(0, now - s.due) / DAY;
  const difficulty = s.wrong / Math.max(1, s.right + s.wrong);
  return overdue * 2 + difficulty * 5 + s.lapses + (s.interval === 0 ? 3 : 0);
}

/** Itens que devem ser revisados agora, em ordem de prioridade. */
export function dueItems(items: Record<string, ItemState>, now: number, limit = 20): ItemState[] {
  return Object.values(items)
    .filter((s) => isDue(s, now))
    .sort((a, b) => reviewPriority(b, now) - reviewPriority(a, now))
    .slice(0, limit);
}

/** Itens com mais erros (para "pontos fracos"). */
export function weakItems(items: Record<string, ItemState>, limit = 10): ItemState[] {
  return Object.values(items)
    .filter((s) => s.wrong > 0)
    .sort((a, b) => b.wrong / Math.max(1, b.right) - a.wrong / Math.max(1, a.right) || b.wrong - a.wrong)
    .slice(0, limit);
}
