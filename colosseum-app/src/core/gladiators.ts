// Gladiadores: força por modalidade, treino, contratação, mercado, valor e relações.

import type { Gladiator, Modality, Relation, Specialty } from "./types";
import type { GameState } from "./state";
import { log } from "./state";
import { buildingValue, has, mods } from "./economy";
import { CHARACTERS, STARTING_RELATIONS, fromCharacter, generateGladiator } from "../content/gladiators";
import { pickOne } from "./rng";

const WEIGHTS: Record<Specialty, { s: number; t: number; c: number; r: number }> = {
  demonstracao: { s: 0.35, t: 0.45, c: 0, r: 0.2 },
  habilidade: { s: 0.2, t: 0.55, c: 0, r: 0.25 },
  torneio: { s: 0.35, t: 0.35, c: 0, r: 0.3 },
  espetaculo: { s: 0, t: 0.3, c: 0.5, r: 0.2 },
  biga: { s: 0, t: 0.5, c: 0.2, r: 0.3 },
  naval: { s: 0.35, t: 0.25, c: 0, r: 0.4 },
};

export function skill(g: Gladiator): number {
  return Math.round((g.strength + g.technique + g.stamina + g.charisma * 0.5) / 3.5);
}

/** Força esperada do gladiador numa modalidade (0–120). */
export function power(g: Gladiator, m: Modality): number {
  const w = WEIGHTS[m.specialties[0]];
  let p = g.strength * w.s + g.technique * w.t + g.charisma * w.c + g.stamina * w.r;
  if (m.specialties.includes(g.specialty)) p += 12;
  p += Math.min(15, g.xp / 40);
  if (g.personality === "competitivo" && (m.id === "torneio" || m.id === "campeoes")) p += 4;
  if (g.personality === "showman" && m.specialties.includes("espetaculo")) p += 5;
  p *= 0.55 + g.condition / 220;
  p *= 0.9 + g.morale / 1000;
  return Math.round(p);
}

/** Variação de desempenho: temperamentais oscilam mais, disciplinados menos. */
export function volatility(g: Gladiator): number {
  return g.personality === "temperamental" ? 22 : g.personality === "disciplinado" ? 9 : g.personality === "preguicoso" ? 16 : 13;
}

export function marketValue(g: Gladiator): number {
  return Math.round(200 + g.fame * g.fame * 6 + skill(g) * 20 + g.wins * 10);
}

export function fairSalary(g: Gladiator): number {
  return Math.round(15 + skill(g) * 0.6 + g.fame * 3 + (g.fame * g.fame) / 10 + (g.legend ? 150 : 0));
}

export function signingFee(g: Gladiator): number {
  return Math.round(g.salary * 6 + g.fame * g.fame * 2 + Math.pow(g.fame, 3) / 25);
}

export function isLegend(g: Gladiator): boolean {
  return g.fame >= 90;
}

/** Contratar do mercado. */
export function hire(s0: GameState, id: string): GameState {
  const g = s0.market.find((x) => x.id === id);
  if (!g) return s0;
  const fee = signingFee(g) * (s0.rivalInterest[id] ? 1.3 : 1);
  if (s0.money < fee) return s0;
  const rookies = g.fame < 10 ? [...s0.rookies, g.id] : s0.rookies;
  let s: GameState = {
    ...s0,
    money: s0.money - Math.round(fee),
    market: s0.market.filter((x) => x.id !== id),
    gladiators: [...s0.gladiators, { ...g, hiredWeek: s0.week, fameMark: g.fame, focus: "tecnica" }],
    rivalInterest: Object.fromEntries(Object.entries(s0.rivalInterest).filter(([k]) => k !== id)),
    stats: { ...s0.stats, hires: s0.stats.hires + 1 },
    ep: s0.ep + (g.fame >= 50 ? 3 : g.fame >= 25 ? 1 : 0),
    rookies,
  };
  s = log(s, `Contratado: ${g.name} (${g.origin}), por ${Math.round(fee)} de luvas.`, "gladiador");
  return addStartingRelations(s);
}

export function release(s0: GameState, id: string): GameState {
  const g = s0.gladiators.find((x) => x.id === id);
  if (!g || s0.gladiators.length <= 2) return s0;
  const s = { ...s0, gladiators: s0.gladiators.filter((x) => x.id !== id), market: [...s0.market, { ...g, morale: 50 }], plans: s0.plans.map((p) => ({ ...p, gladiators: p.gladiators.filter((x) => x !== id) })) };
  return log(s, `${g.name} deixou o Coliseu e voltou ao mercado.`, "gladiador");
}

export function setFocus(s: GameState, id: string, focus: Gladiator["focus"]): GameState {
  return { ...s, gladiators: s.gladiators.map((g) => (g.id === id ? { ...g, focus } : g)) };
}

/** Aumento de salário (renovação): moral sobe. */
export function raiseSalary(s: GameState, id: string): GameState {
  return {
    ...s,
    gladiators: s.gladiators.map((g) => (g.id === id ? { ...g, salary: Math.max(g.salary, fairSalary(g)), morale: Math.min(100, g.morale + 20) } : g)),
  };
}

function addStartingRelations(s: GameState): GameState {
  const ids = new Set(s.gladiators.map((g) => g.id));
  const rel = [...s.relations];
  for (const r of STARTING_RELATIONS) {
    if (ids.has(r.a) && ids.has(r.b) && !rel.some((x) => (x.a === r.a && x.b === r.b) || (x.a === r.b && x.b === r.a))) rel.push({ ...r, intensity: 60, aWins: 0, bWins: 0 });
  }
  return { ...s, relations: rel };
}

export function relationBetween(s: GameState, a: string, b: string): Relation | undefined {
  return s.relations.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));
}

/** Atualização semanal: recuperação, treino, moral, idade e lesões. */
export function weeklyGladiators(s0: GameState, busy: Set<string>, r: () => number): GameState {
  const m = mods(s0);
  const gym = buildingValue(s0, "treino") / 100;
  let s = s0;
  const news: string[] = [];
  const gladiators = s0.gladiators.map((g0) => {
    const g = { ...g0 };
    if (g.injuredWeeks > 0) g.injuredWeeks--;
    const rest = g.focus === "descanso" ? 14 : 0;
    if (!busy.has(g.id)) g.condition = Math.min(100, g.condition + 14 + m.recovery + rest + gym * 10);
    else g.condition = Math.min(100, g.condition + 4 + m.recovery / 2);
    // Treino nas semanas sem evento
    if (!busy.has(g.id) && g.focus && g.focus !== "descanso" && g.injuredWeeks === 0) {
      const pers = g.personality === "disciplinado" ? 1.35 : g.personality === "preguicoso" ? 0.55 : 1;
      const age = g.age < 26 ? 1.25 : g.age > 32 ? 0.6 : 1;
      const gain = (0.5 + r() * 0.9) * (1 + m.training + gym) * pers * age;
      const key = { forca: "strength", tecnica: "technique", carisma: "charisma", resistencia: "stamina" }[g.focus] as "strength" | "technique" | "charisma" | "stamina";
      g[key] = Math.min(100, Math.round((g[key] + gain) * 10) / 10);
      g.condition = Math.max(0, g.condition - 6);
    }
    // Moral: salário justo e uso
    const fair = fairSalary(g);
    if (g.salary < fair * 0.75) g.morale = Math.max(0, g.morale - 3);
    else g.morale = Math.min(100, g.morale + 1);
    if (g.personality === "ambicioso" && g.fame > 40 && g.salary < fair) g.morale = Math.max(0, g.morale - 2);
    // A fama esfria sem eventos
    if (!busy.has(g.id) && g.fame > 20) g.fame = Math.max(0, Math.round((g.fame - 0.3) * 10) / 10);
    // Idade (um ano a cada 52 semanas)
    if ((s0.week - g.hiredWeek) % 52 === 51) {
      g.age++;
      if (g.age > 33) {
        g.strength = Math.max(20, g.strength - 2);
        g.stamina = Math.max(20, g.stamina - 2);
      }
    }
    if (g.morale < 25 && r() < 0.15) news.push(`${g.name} reclama do salário e treina de má vontade.`);
    return g;
  });
  s = { ...s, gladiators };
  for (const n of news) s = log(s, n, "gladiador");
  return s;
}

/** Renova o mercado de gladiadores livres. */
export function refreshMarket(s0: GameState, r: () => number): GameState {
  const m = mods(s0);
  let s = s0;
  const keep = s0.market.filter((g) => r() < 0.6 || s0.rivalInterest[g.id]);
  const target = 4 + (s0.staff.olheiros ?? 0) + (s0.era >= 3 ? 1 : 0);
  const quality = Math.min(1, 0.12 + m.scoutQuality + (s0.era - 1) * 0.1);
  const specs: Specialty[] = ["demonstracao", "habilidade", "torneio", "espetaculo"];
  if (s0.nodes.includes("gla-provincias") || s0.era >= 2) specs.push("biga", "naval");
  const market = [...keep];
  while (market.length < target) {
    const id = `g${s.counter}`;
    s = { ...s, counter: s.counter + 1 };
    market.push(generateGladiator(id, r, quality * (0.6 + r() * 0.6), s0.era, specs));
  }
  // Personagens únicos aparecem conforme a era e a fama
  const taken = new Set([...s.gladiators.map((g) => g.id), ...market.map((g) => g.id), ...s.rival.gladiators.map((g) => g.id), ...(s.league?.gladiators ?? []).map((g) => g.id)]);
  const eligible = CHARACTERS.filter((c) => !taken.has(c.id) && c.minEra <= s0.era && (!c.legend || has(s0, "lendas")) && c.fame <= s0.fame + 30);
  if (eligible.length && r() < 0.35) market.push(fromCharacter(pickOne(eligible, r)));
  return { ...s, market: market.slice(0, target + 2) };
}
