// Construções do Coliseu, funcionários, gerentes (automação) e monumentos.

import type { GameState } from "./state";
import { log } from "./state";
import { buildCost, has } from "./economy";
import { authority } from "./events";
import { MANAGERS, STAFF, building } from "../content/world";
import { node } from "../content/tree";

export function buildIssue(s: GameState, id: string): string | null {
  const b = building(id);
  const lvl = s.buildings[id] ?? 0;
  const next = b.levels[lvl + 1];
  if (!next) return "Nível máximo";
  if ((next.era ?? 1) > s.era) return `Disponível na Era ${next.era}`;
  if (next.node && !s.nodes.includes(next.node)) return `Exige a evolução «${node(next.node).name}»`;
  const c = buildCost(s, id);
  if (s.money < c) return `Faltam ${Math.round(c - s.money).toLocaleString("pt-BR")} denários`;
  return null;
}

export function build(s0: GameState, id: string): GameState {
  if (buildIssue(s0, id)) return s0;
  const b = building(id);
  const cost = buildCost(s0, id);
  const lvl = (s0.buildings[id] ?? 0) + 1;
  let s: GameState = {
    ...s0,
    money: s0.money - cost,
    buildings: { ...s0.buildings, [id]: lvl },
    stats: { ...s0.stats, builds: s0.stats.builds + 1 },
    ep: s0.ep + (lvl >= 3 ? 2 : 1),
  };
  s = log(s, `Construção concluída: ${b.levels[lvl].label} (${b.name}).`, "construcao");
  return s;
}

export function staffIssue(s: GameState, id: string, delta: number): string | null {
  const st = STAFF.find((x) => x.id === id);
  if (!st) return "Função desconhecida";
  const cur = s.staff[id] ?? 0;
  if (delta > 0 && cur >= st.max) return "Limite desta função";
  if (delta < 0 && cur <= 0) return "Ninguém para dispensar";
  if (delta > 0 && s.money < st.salary * 4) return "Dinheiro insuficiente (4 semanas de salário)";
  return null;
}

export function setStaff(s0: GameState, id: string, delta: number): GameState {
  if (staffIssue(s0, id, delta)) return s0;
  const st = STAFF.find((x) => x.id === id)!;
  const s = { ...s0, staff: { ...s0.staff, [id]: (s0.staff[id] ?? 0) + delta }, staffMorale: delta < 0 ? Math.max(0, s0.staffMorale - 6) : s0.staffMorale };
  return log(s, delta > 0 ? `Contratado: mais um(a) ${st.name.toLowerCase()}.` : `Dispensado: um(a) ${st.name.toLowerCase()}.`, "economia");
}

export function managerIssue(s: GameState, id: string): string | null {
  const m = MANAGERS.find((x) => x.id === id);
  if (!m) return "Cargo desconhecido";
  if (s.managers.includes(id)) return null;
  if (authority(s) < m.authority) return `Exige autoridade nível ${m.authority}`;
  if (id === "governador" && !s.branches.length) return "Abra uma filial primeiro";
  return null;
}

/** Contrata ou dispensa um gerente. A automação liga junto; o jogador pode desligar. */
export function toggleManager(s0: GameState, id: string): GameState {
  if (s0.managers.includes(id)) {
    const s = { ...s0, managers: s0.managers.filter((x) => x !== id), automation: { ...s0.automation, [id]: false } };
    return log(s, `${MANAGERS.find((x) => x.id === id)!.name} dispensado.`, "economia");
  }
  if (managerIssue(s0, id)) return s0;
  const s = { ...s0, managers: [...s0.managers, id], automation: { ...s0.automation, [id]: true } };
  return log(s, `${MANAGERS.find((x) => x.id === id)!.name} contratado.`, "economia");
}

export function setAutomation(s: GameState, id: string, on: boolean): GameState {
  if (!s.managers.includes(id)) return s;
  return { ...s, automation: { ...s.automation, [id]: on } };
}

// ---------- Monumentos (legado) ----------

export function monumentCount(s: GameState): number {
  return s.flags.filter((f) => f === "monumento").length;
}

export function monumentCost(s: GameState): number {
  return 80000 * (monumentCount(s) + 1);
}

export const MONUMENT_NAMES = ["Arco do Triunfo dos Jogos", "Estátua do Fundador", "Coluna dos Campeões", "Fonte das Nações", "Obelisco do Legado", "Templo da Glória"];

export function monumentIssue(s: GameState): string | null {
  if (!has(s, "monumentos")) return "Desbloqueie «Monumentos» na árvore de Prestígio";
  if (monumentCount(s) >= MONUMENT_NAMES.length) return "Todos os monumentos foram erguidos";
  if (s.money < monumentCost(s)) return "Dinheiro insuficiente";
  return null;
}

export function buildMonument(s0: GameState): GameState {
  if (monumentIssue(s0)) return s0;
  const name = MONUMENT_NAMES[monumentCount(s0)];
  const s = { ...s0, money: s0.money - monumentCost(s0), flags: [...s0.flags, "monumento"], prestige: s0.prestige + 4, ep: s0.ep + 3 };
  return log(s, `Monumento erguido: ${name}. Roma inteira vem ver.`, "construcao");
}
