// Como cada personalidade recebe cada abordagem.
// A mesma fala pode ganhar interesse e perder confiança; repetir a mesma abordagem rende cada vez menos.

import type { Attrs, Character, Reaction, Tactic } from "./types";

export type Delta = Partial<Attrs>;

export interface TacticContext {
  /** Quantas vezes seguidas a mesma abordagem foi usada antes desta. */
  repeats: number;
  /** O jogador conhece uma necessidade que esta abordagem atende. */
  targetsNeed: boolean;
  /** Bônus de habilidades do jogador (0–1) por abordagem. */
  skill: number;
  /** Credibilidade atual (afeta autoridade, dados e prova social). */
  credibility: number;
  /** Diferença de classe social entre personagem e jogador (positivo = personagem acima). */
  statusGap: number;
}

/**
 * Efeito base de uma abordagem para uma personalidade.
 * Números pensados para que nenhuma abordagem seja sempre a melhor.
 */
export function tacticEffect(c: Character, t: Tactic, ctx: TacticContext): Delta {
  const T = c.traits;
  const intel = c.intelligence / 5;
  const d: Delta = {};
  const add = (k: keyof Attrs, v: number) => (d[k] = (d[k] ?? 0) + v);
  const cred = ctx.credibility / 100;

  switch (t) {
    case "explain":
      add("interest", 4 + 10 * T.analytical);
      add("credibility", 2 + 4 * T.analytical);
      add("patience", -2 - 4 * T.impatience);
      add("mood", -2 * T.impatience);
      break;
    case "evidence":
      add("interest", 3 + 12 * T.analytical);
      add("trust", 2 + 6 * T.analytical * cred);
      add("credibility", 3 + 6 * T.analytical);
      add("patience", -2 - 3 * T.impatience);
      add("affinity", -4 * T.warmth * (1 - T.analytical));
      break;
    case "empathy":
      add("trust", 3 + 10 * T.warmth);
      add("affinity", 3 + 8 * T.warmth);
      add("mood", 2 + 5 * T.warmth);
      add("patience", T.impatience > 0.6 ? -4 : 2);
      add("interest", -2 * T.analytical);
      break;
    case "question":
      add("trust", 2 + 3 * T.warmth);
      add("affinity", 2);
      add("patience", -1 - 2 * T.impatience);
      add("interest", 1);
      break;
    case "rapport":
      add("affinity", 3 + 10 * T.warmth);
      add("mood", 4 + 6 * T.warmth + 4 * T.humor);
      add("patience", 4 * T.warmth - 9 * T.impatience - 4 * T.formality);
      add("trust", 2 * T.warmth);
      add("interest", -2);
      break;
    case "authority":
      add("credibility", 4 + 10 * T.formality * cred);
      add("interest", 3 * T.formality);
      add("affinity", -5 * T.pride - 5 * (ctx.statusGap > 1 ? 1 : 0));
      add("suspicion", 6 * T.skepticism * (1 - cred));
      add("trust", 3 * T.formality * cred);
      break;
    case "socialProof":
      add("interest", 4 + 8 * (1 - T.analytical));
      add("trust", 4 * (1 - T.analytical));
      add("suspicion", 8 * T.analytical * T.skepticism);
      add("credibility", 3 * cred);
      break;
    case "urgency":
      add("interest", 3 + 12 * T.risk);
      add("suspicion", 3 + 14 * T.skepticism);
      add("patience", -3);
      add("trust", -6 * T.skepticism);
      break;
    case "flattery":
      add("affinity", 2 + 9 * T.pride * (1 - intel));
      add("mood", 3 * T.pride);
      add("suspicion", 2 + 10 * intel * T.skepticism);
      add("credibility", -3 * intel);
      break;
    case "humor":
      add("mood", -2 + 14 * T.humor);
      add("affinity", -2 + 9 * T.humor);
      add("patience", 5 * T.humor - 4 * T.formality);
      add("credibility", -6 * T.formality);
      break;
    case "concession":
      add("trust", 6 + 4 * T.frugality);
      add("interest", 5 + 6 * T.frugality);
      add("affinity", 3);
      add("credibility", -2);
      break;
    case "pressure":
      add("interest", 3 * T.risk);
      add("patience", -10 - 6 * T.pride);
      add("affinity", -8 - 6 * T.pride);
      add("suspicion", 6 + 6 * T.skepticism);
      add("trust", -6);
      break;
    case "bluff":
      add("interest", 9 + 5 * T.risk);
      add("credibility", 8);
      add("suspicion", 4 * intel);
      break;
    case "reframe":
      add("interest", 4 + 6 * T.analytical + 4 * T.warmth);
      add("trust", 3);
      add("patience", -2);
      break;
    case "honesty":
      add("trust", 5 + 10 * T.skepticism);
      add("credibility", 4 + 4 * T.skepticism);
      add("suspicion", -6 - 6 * T.skepticism);
      add("interest", -3);
      break;
    case "changeSubject":
      add("patience", 5 - 4 * T.impatience);
      add("mood", 3);
      add("interest", -4);
      break;
    default:
      break;
  }

  // Repetir a mesma abordagem cansa: 100%, 60%, 35%… e a paciência sofre
  const fatigue = Math.pow(0.6, ctx.repeats);
  for (const k of Object.keys(d) as (keyof Attrs)[]) {
    const v = d[k]!;
    if (v > 0 && k !== "suspicion") d[k] = v * fatigue;
  }
  if (ctx.repeats >= 1) {
    add("patience", -3 * ctx.repeats);
    add("mood", -2 * ctx.repeats);
  }

  // Falar exatamente do que a pessoa precisa multiplica o efeito positivo
  if (ctx.targetsNeed) {
    for (const k of Object.keys(d) as (keyof Attrs)[]) if (d[k]! > 0 && k !== "suspicion") d[k] = d[k]! * 1.5;
    add("trust", 3);
  }

  // Habilidades do jogador
  if (ctx.skill > 0) {
    for (const k of Object.keys(d) as (keyof Attrs)[]) {
      const v = d[k]!;
      if (k === "suspicion" || k === "patience") {
        if (v > 0 && k === "suspicion") d[k] = v * (1 - 0.35 * ctx.skill);
        if (v < 0 && k === "patience") d[k] = v * (1 - 0.3 * ctx.skill);
      } else if (v > 0) d[k] = v * (1 + 0.35 * ctx.skill);
    }
  }
  return d;
}

/** Bom humor amplia o que é positivo; mau humor amplia o que é negativo. */
export function applyMood(d: Delta, mood: number): Delta {
  const up = 0.75 + (mood / 100) * 0.5;
  const down = 1.25 - (mood / 100) * 0.5;
  const out: Delta = {};
  for (const [k, v] of Object.entries(d) as [keyof Attrs, number][]) {
    const good = k === "suspicion" ? v < 0 : v > 0;
    out[k] = v * (good ? up : down);
  }
  return out;
}

/** Classifica a reação a partir do que mudou. */
export function reactionOf(d: Delta, t: Tactic, c: Character): Reaction {
  const g = (k: keyof Attrs) => d[k] ?? 0;
  if (g("affinity") <= -8 || (t === "pressure" && c.traits.pride > 0.5)) return "offended";
  if (g("suspicion") >= 8) return "skeptical";
  if (g("patience") <= -9) return "impatient";
  if (t === "humor" && g("mood") >= 6) return "amused";
  if (g("trust") + g("affinity") >= 12) return "warm";
  if (g("interest") >= 9) return "interested";
  if ((t === "explain" || t === "evidence" || t === "reframe") && g("interest") >= 4) return "considering";
  if (t === "humor" && g("mood") < 0) return "confused";
  if (g("interest") < -2 && g("patience") < 0) return "impatient";
  return "neutral";
}

/** Expressão do retrato a partir dos atributos. */
export function moodFace(a: Attrs, last?: Reaction): import("./types").Mood {
  if (last === "offended") return "angry";
  if (last === "amused") return "happy";
  if (last === "skeptical" || a.suspicion > 65) return "suspicious";
  if (last === "impatient" || a.patience < 25) return "annoyed";
  if (last === "considering" || last === "confused") return "thinking";
  if (last === "warm" || a.mood > 70) return "happy";
  if (a.mood < 30) return "sad";
  return "neutral";
}

/** Sinais de linguagem corporal que o jogador consegue ler (sem números). */
export function tellsOf(a: Attrs): string[] {
  const out: string[] = [];
  if (a.patience < 25) out.push("olha o relógio");
  else if (a.patience > 75) out.push("parece sem pressa");
  if (a.suspicion > 60) out.push("braços cruzados, desconfiado");
  else if (a.suspicion < 20) out.push("postura relaxada");
  if (a.interest > 65) out.push("inclinado para a frente, curioso");
  else if (a.interest < 25) out.push("distraído");
  if (a.trust > 65) out.push("fala com mais abertura");
  if (a.mood < 30) out.push("parece de mau humor");
  else if (a.mood > 75) out.push("de bom humor");
  if (a.affinity > 70) out.push("sorri para você");
  else if (a.affinity < 20) out.push("frio com você");
  return out.slice(0, 3);
}
