// Modificadores agregados, capacidade, preços de referência e despesas fixas.

import type { Mods, Region } from "./types";
import type { GameState } from "./state";
import { BETS_TREE, TREE } from "../content/tree";
import { BRANCH_LEVELS, BUILDINGS, MANAGERS, STAFF, building, modality, region } from "../content/world";

export const ZERO_MODS: Mods = {
  demand: 0, satisfaction: 0, priceRef: 0, food: 0, commerce: 0, sponsor: 0, popGain: 0, fameGain: 0, epGain: 0, salary: 0, upkeep: 0, training: 0, injury: 0, recovery: 0, marketing: 0, prestigeGain: 0, rivalResist: 0, expansionCost: 0, capacity: 0, gladiatorFame: 0, favor: 0, staffMorale: 0, betsParticipants: 0, betsAccuracy: 0, betsCredibility: 0, betsEngagement: 0, betsChips: 0, scoutQuality: 0, regionDemand: 0,
};

/** Soma os efeitos de toda a árvore, dos efeitos temporários e dos funcionários. */
export function mods(s: GameState): Mods {
  const m: Mods = { ...ZERO_MODS };
  const add = (e?: Partial<Mods>) => {
    for (const [k, v] of Object.entries(e ?? {})) m[k as keyof Mods] += v as number;
  };
  for (const id of s.nodes) add(TREE.find((n) => n.id === id)?.effects);
  for (const id of s.bets.unlocked) add(BETS_TREE.find((n) => n.id === id)?.effects);
  for (const t of s.tempMods) m[t.key] += t.value;
  // Funcionários
  m.upkeep -= Math.min(0.18, (s.staff.administradores ?? 0) * 0.03);
  m.recovery += (s.staff.tratadores ?? 0) * 3;
  m.injury -= Math.min(0.4, (s.staff.tratadores ?? 0) * 0.06);
  m.food += (s.staff.vendedores ?? 0) * 0.05;
  m.commerce += (s.staff.vendedores ?? 0) * 0.05;
  m.scoutQuality += (s.staff.olheiros ?? 0) * 0.08;
  m.capacity += 0;
  return m;
}

export function has(s: GameState, flag: string): boolean {
  return s.flags.includes(flag) || s.nodes.some((id) => TREE.find((n) => n.id === id)?.unlocks?.includes(flag)) || s.bets.unlocked.some((id) => BETS_TREE.find((n) => n.id === id)?.unlocks?.includes(flag));
}

export function buildingValue(s: GameState, id: string): number {
  const b = building(id);
  return b.levels[s.buildings[id] ?? 0]?.value ?? 0;
}

/** Lugares disponíveis num local ("roma" ou id de região com filial). */
export function capacity(s: GameState, venue: string): number {
  if (venue === "roma") return Math.round(buildingValue(s, "arquibancada") * (1 + mods(s).capacity));
  const br = s.branches.find((b) => b.region === venue);
  return br ? BRANCH_LEVELS[br.level - 1].capacity : 0;
}

/** Quantos eventos cada local comporta por semana. */
export function slots(s: GameState, venue: string): number {
  if (venue === "roma") return 1 + buildingValue(s, "secundaria");
  return s.branches.some((b) => b.region === venue) ? 1 : 0;
}

export function venuePopularity(s: GameState, venue: string): number {
  if (venue === "roma") return s.popularity;
  return s.branches.find((b) => b.region === venue)?.popularity ?? 0;
}

/** Preço que o público considera justo para uma modalidade num local. */
export function refPrice(s: GameState, venue: string, modalityId: string): number {
  const reg: Region = region(venue);
  const m = mods(s);
  const vip = venue === "roma" ? buildingValue(s, "camarotes") / 100 : 0;
  const v = 2.5 * reg.wealth * (1 + vip + m.priceRef) * (1 + (0.8 * s.prestige) / (s.prestige + 150)) * modality(modalityId).priceMult;
  return Math.max(0.5, Math.round(v * 2) / 2);
}

export interface Expense {
  label: string;
  amount: number;
}

/** Despesas fixas da semana (sem os eventos). */
export function weeklyExpenses(s: GameState): Expense[] {
  const m = mods(s);
  const out: Expense[] = [];
  const salaries = s.gladiators.reduce((a, g) => a + g.salary, 0) * (1 + m.salary);
  out.push({ label: "Salários dos gladiadores", amount: Math.round(salaries) });
  let staff = 0;
  for (const st of STAFF) staff += (s.staff[st.id] ?? 0) * st.salary;
  out.push({ label: "Funcionários", amount: Math.round(staff) });
  const managers = s.managers.reduce((a, id) => a + (MANAGERS.find((x) => x.id === id)?.salary ?? 0), 0);
  if (managers) out.push({ label: "Gerentes e automação", amount: managers });
  // Manutenção: base por nível + 0,4% do valor investido em cada construção
  let upkeep = 0;
  for (const b of BUILDINGS) {
    const lvl = s.buildings[b.id] ?? 0;
    const invested = b.levels.slice(1, lvl + 1).reduce((a, l) => a + l.cost, 0);
    upkeep += b.upkeep * lvl + invested * 0.004;
  }
  upkeep = upkeep * Math.max(0.4, 1 + m.upkeep);
  out.push({ label: "Manutenção do Coliseu", amount: Math.round(upkeep) });
  const branches = s.branches.reduce((a, b) => a + 250 * b.level, 0) * Math.max(0.5, 1 + m.upkeep);
  if (branches) out.push({ label: "Filiais", amount: Math.round(branches) });
  return out.filter((e) => e.amount > 0);
}

export function weeklyIncome(s: GameState): Expense[] {
  const out: Expense[] = [];
  for (const c of s.contracts) out.push({ label: `Contrato: ${c.name}`, amount: c.weekly });
  if (s.nodes.includes("eco-banco") && s.money > 0) out.push({ label: "Rendimento da casa bancária", amount: Math.min(1500, Math.round(s.money * 0.01)) });
  if (s.flags.includes("monumento")) out.push({ label: "Visitas aos monumentos", amount: 300 * s.flags.filter((f) => f === "monumento").length });
  return out;
}

/** Custo de construção do próximo nível. */
export function buildCost(s: GameState, id: string): number {
  const b = building(id);
  const next = b.levels[(s.buildings[id] ?? 0) + 1];
  if (!next) return Infinity;
  return Math.round(next.cost * (s.nodes.includes("eco-investimento") ? 0.85 : 1));
}

export function expansionCost(s: GameState, regionId: string): number {
  return Math.round(region(regionId).cost * Math.max(0.4, 1 + mods(s).expansionCost) * (1 + s.branches.length * 0.15));
}

export const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
