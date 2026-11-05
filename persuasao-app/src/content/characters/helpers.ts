import type { Traits } from "../../core/types";

/** Traços na ordem: analítico, acolhedor, orgulho, ceticismo, impaciência, humor, frugalidade, risco, formalidade. */
export function tr(analytical: number, warmth: number, pride: number, skepticism: number, impatience: number, humor: number, frugality: number, risk: number, formality: number): Traits {
  return { analytical, warmth, pride, skepticism, impatience, humor, frugality, risk, formality };
}
