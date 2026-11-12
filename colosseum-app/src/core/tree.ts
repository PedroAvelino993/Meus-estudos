// Árvore de evolução (pontos de evolução) e árvore do Arena Bets (pontos do mercado).

import type { TreeNode } from "./types";
import type { GameState } from "./state";
import { log } from "./state";
import { BETS_TREE, TREE, node } from "../content/tree";

export type NodeStatus = "comprado" | "disponivel" | "bloqueado" | "excluido" | "era";

function owned(s: GameState, id: string): boolean {
  return s.nodes.includes(id) || s.bets.unlocked.includes(id);
}

export function nodeStatus(s: GameState, n: TreeNode): NodeStatus {
  if (owned(s, n.id)) return "comprado";
  if (n.excludes?.some((x) => owned(s, x))) return "excluido";
  if (!n.requires.every((r) => owned(s, r))) return "bloqueado";
  if ((n.era ?? 1) > s.era) return "era";
  return "disponivel";
}

/** Motivo para não poder comprar (null = pode). */
export function unlockIssue(s: GameState, id: string): string | null {
  const n = node(id);
  const st = nodeStatus(s, n);
  if (st === "comprado") return "Já desbloqueado";
  if (st === "excluido") return `Caminho fechado: você escolheu ${n.excludes!.filter((x) => owned(s, x)).map((x) => node(x).name).join(", ")}`;
  if (st === "bloqueado") return `Exige: ${n.requires.filter((r) => !owned(s, r)).map((r) => node(r).name).join(", ")}`;
  if (st === "era") return `Disponível a partir da Era ${n.era}`;
  const isBets = BETS_TREE.some((b) => b.id === id);
  if (isBets && s.bets.points < n.cost) return `Faltam ${n.cost - s.bets.points} pontos do mercado`;
  if (!isBets && s.ep < n.cost) return `Faltam ${n.cost - s.ep} pontos de evolução`;
  return null;
}

export function unlock(s0: GameState, id: string): GameState {
  if (unlockIssue(s0, id)) return s0;
  const n = node(id);
  const isBets = BETS_TREE.some((b) => b.id === id);
  let s: GameState = isBets
    ? { ...s0, bets: { ...s0.bets, points: s0.bets.points - n.cost, unlocked: [...s0.bets.unlocked, id], credibility: Math.min(100, s0.bets.credibility + (n.effects?.betsCredibility ?? 0)) } }
    : { ...s0, ep: s0.ep - n.cost, nodes: [...s0.nodes, id] };
  // Efeitos de uma vez só (favor e moral são estados, não multiplicadores)
  if (n.effects?.favor) s.favor = Math.max(0, Math.min(100, s.favor + n.effects.favor));
  if (n.effects?.staffMorale) s.staffMorale = Math.min(100, s.staffMorale + n.effects.staffMorale);
  s = log(s, `Evolução: ${n.name}.`, "evolucao");
  return s;
}

/** Nós de uma categoria agrupados por ramo e nível, para desenhar o grafo. */
export function layout(category: string) {
  const list = [...TREE, ...BETS_TREE].filter((n) => n.category === category);
  const branches = [...new Set(list.map((n) => n.branch))];
  const tiers = Math.max(...list.map((n) => n.tier));
  return { list, branches, tiers };
}
