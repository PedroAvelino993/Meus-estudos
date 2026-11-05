import type { MissionOption, Tactic } from "../../core/types";

/** Atalho para escrever opções de diálogo: o(id, texto, abordagem, extras). */
export function o(id: string, text: string, tactic: Tactic, extra: Partial<MissionOption> = {}): MissionOption {
  return { id, text, tactic, ...extra };
}

/** Resposta que muda conforme a fala funcionou ou não. */
export function gb(good: string, bad: string) {
  return { good, bad };
}
