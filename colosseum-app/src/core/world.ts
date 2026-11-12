// Expansão mundial: filiais, melhorias, delegação e eventos automáticos das filiais.

import type { Branch } from "./types";
import type { GameState } from "./state";
import { log } from "./state";
import { expansionCost, mods, refPrice } from "./economy";
import { playerShare } from "./events";
import { BRANCH_LEVELS, MODALITIES, REGIONS, region } from "../content/world";

export function expandIssue(s: GameState, id: string): string | null {
  const reg = region(id);
  if (id === "roma") return "Roma é a sua sede";
  if (s.branches.some((b) => b.region === id)) return "Você já tem uma filial aqui";
  if (reg.era > s.era) return `Disponível na Era ${reg.era}`;
  if (s.fame < reg.minFame) return `Exige ${reg.minFame} de fama (você tem ${Math.floor(s.fame)})`;
  if (s.prestige < reg.minPrestige) return `Exige ${reg.minPrestige} de prestígio (você tem ${Math.floor(s.prestige)})`;
  if (s.money < expansionCost(s, id)) return `Custa ${expansionCost(s, id).toLocaleString("pt-BR")} denários`;
  return null;
}

export function expand(s0: GameState, id: string): GameState {
  if (expandIssue(s0, id)) return s0;
  const reg = region(id);
  const cost = expansionCost(s0, id);
  const b: Branch = { region: id, level: 1, popularity: Math.round(10 + s0.fame / 25), openedWeek: s0.week, delegated: false, lastEventWeek: 0 };
  let s: GameState = { ...s0, money: s0.money - cost, branches: [...s0.branches, b], ep: s0.ep + 6, fame: s0.fame + 5, prestige: s0.prestige + 2 };
  s = log(s, `Nova filial: ${reg.name}. ${reg.culture}.`, "mundo");
  return s;
}

export function upgradeIssue(s: GameState, id: string): string | null {
  const b = s.branches.find((x) => x.region === id);
  if (!b) return "Sem filial";
  const next = BRANCH_LEVELS[b.level];
  if (!next) return "Nível máximo";
  if (b.level + 1 > s.era - 1) return `Nível ${b.level + 1} exige a Era ${b.level + 2}`;
  if (s.money < next.cost) return `Custa ${next.cost.toLocaleString("pt-BR")} denários`;
  return null;
}

export function upgradeBranch(s0: GameState, id: string): GameState {
  if (upgradeIssue(s0, id)) return s0;
  const next = BRANCH_LEVELS[s0.branches.find((x) => x.region === id)!.level];
  const s = { ...s0, money: s0.money - next.cost, branches: s0.branches.map((b) => (b.region === id ? { ...b, level: b.level + 1 } : b)), ep: s0.ep + 2 };
  return log(s, `Filial de ${region(id).name}: ${next.label} (${next.capacity.toLocaleString("pt-BR")} lugares).`, "mundo");
}

export function toggleDelegate(s: GameState, id: string): GameState {
  return { ...s, branches: s.branches.map((b) => (b.region === id ? { ...b, delegated: !b.delegated } : b)) };
}

/** A modalidade que a região mais gosta entre as que você já domina. */
export function favoriteModality(s: GameState, regionId: string): string {
  const reg = region(regionId);
  const known = MODALITIES.filter((m) => s.modalitiesDone.includes(m.id) && m.id !== "exclusivo");
  if (!known.length) return "demonstracao";
  return known.sort((a, b) => b.appeal * (reg.likes[b.id] ?? 1) - a.appeal * (reg.likes[a.id] ?? 1))[0].id;
}

export interface BranchResult {
  region: string;
  attendance: number;
  profit: number;
  modality: string;
}

/** Semana das filiais: as delegadas (com governador) fazem eventos com a trupe local. */
export function weeklyBranches(s0: GameState, r: () => number): { state: GameState; results: BranchResult[] } {
  const md = mods(s0);
  const results: BranchResult[] = [];
  let s = s0;
  let money = 0;
  let fame = 0;
  let prestige = 0;
  const branches = s0.branches.map((b0) => {
    const b = { ...b0 };
    const reg = region(b.region);
    const ranEvent = b.lastEventWeek === s0.week;
    const auto = b.delegated && s0.managers.includes("governador") && s0.automation.governador !== false && !ranEvent;
    if (auto) {
      const mId = favoriteModality(s0, b.region);
      const m = MODALITIES.find((x) => x.id === mId)!;
      const cap = BRANCH_LEVELS[b.level - 1].capacity;
      const fill = Math.min(1, (0.25 + (b.popularity / 100) * 0.85) * (reg.likes[mId] ?? 1) * (1 + md.regionDemand) * (0.9 + r() * 0.2));
      const att = Math.round(cap * fill * playerShare(s0, b.region));
      const price = refPrice(s0, b.region, mId);
      const profit = Math.round(att * (price + 0.5) * (s0.nodes.includes("eco-rotas") ? 1.1 : 1) - m.cost * 0.8 - 300 * b.level);
      money += profit;
      fame += ((1 + Math.log2(Math.max(1, att / 250))) * 0.5) / (1 + s0.fame / 150);
      prestige += (m.prestige * 0.04) / (1 + s0.prestige / 60);
      b.popularity = Math.min(100, Math.round((b.popularity + 1.2 + (reg.likes[mId] ?? 1) - (b.popularity / 60)) * 10) / 10);
      b.lastEventWeek = s0.week;
      results.push({ region: b.region, attendance: att, profit, modality: mId });
    } else if (!ranEvent) {
      // Sem eventos, o interesse esfria
      b.popularity = Math.max(0, Math.round((b.popularity - 0.8) * 10) / 10);
    }
    return b;
  });
  s = { ...s, branches, money: s.money + money, fame: Math.round((s.fame + fame) * 10) / 10, prestige: Math.round((s.prestige + prestige) * 10) / 10 };
  if (results.length) s = { ...s, stats: { ...s.stats, spectators: s.stats.spectators + results.reduce((a, x) => a + x.attendance, 0) } };
  return { state: s, results };
}

export function regionsOpen(s: GameState) {
  return REGIONS.filter((r) => r.id !== "roma").map((r) => ({ region: r, issue: expandIssue(s, r.id), branch: s.branches.find((b) => b.region === r.id) }));
}
