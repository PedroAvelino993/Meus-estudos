// Planejamento de eventos da semana, Ateliê de espetáculos e arcos de temporada do Decreto.

import type { EventPlan } from "./types";
import type { GameState } from "./state";
import { log, nextId } from "./state";
import { capacity, refPrice, slots } from "./economy";
import { authority, availableGladiators, estimate, modalityAvailable, planIssues, suggestName } from "./events";
import { power } from "./gladiators";
import { ATELIER, MODALITIES, modality } from "../content/world";

/** Rascunho de evento com valores sensatos. */
export function draftPlan(s0: GameState, venue = "roma", modalityId?: string): [GameState, EventPlan] {
  const [s, id] = nextId(s0, "ev");
  const mId = modalityId && modalityAvailable(s, modalityId) ? modalityId : bestModality(s);
  const m = modality(mId);
  const pool = availableGladiators(s).sort((a, b) => power(b, m) + b.fame - (power(a, m) + a.fame));
  const n = Math.min(m.maxGladiators, Math.max(m.minGladiators, Math.min(pool.length, m.minGladiators + 2)));
  const plan: EventPlan = {
    id,
    name: suggestName(s, mId, venue),
    modality: mId,
    venue,
    gladiators: pool.slice(0, n).map((g) => g.id),
    capacity: capacity(s, venue),
    price: s.priceHint[`${venue}:${mId}`] ?? refPrice(s, venue, mId),
    decoration: Math.round(m.cost * 0.4),
    marketing: Math.round(m.cost * 0.5),
    days: 1,
    extras: [],
    mode: "livre",
    plannedWeek: s.week,
  };
  return [s, plan];
}

function bestModality(s: GameState): string {
  const ok = MODALITIES.filter((m) => modalityAvailable(s, m.id) && availableGladiators(s).length >= m.minGladiators);
  if (!ok.length) return "demonstracao";
  return ok.sort((a, b) => b.appeal - a.appeal)[0].id;
}

/** Ajusta a lista de gladiadores quando a modalidade muda. */
export function fitGladiators(s: GameState, p: EventPlan): EventPlan {
  const m = modality(p.modality);
  let ids = p.gladiators.slice(0, m.maxGladiators);
  if (ids.length < m.minGladiators) {
    const pool = availableGladiators(s, p.id).filter((g) => !ids.includes(g.id)).sort((a, b) => power(b, m) - power(a, m));
    ids = [...ids, ...pool.slice(0, m.minGladiators - ids.length).map((g) => g.id)];
  }
  if (m.minGladiators % 2 === 0 && boutsNeedPairs(p.modality) && ids.length % 2 === 1) ids = ids.slice(0, ids.length - 1);
  return { ...p, gladiators: ids, capacity: Math.min(p.capacity, capacity(s, p.venue)) || capacity(s, p.venue) };
}

function boutsNeedPairs(id: string) {
  return ["demonstracao", "duelos", "equipes", "naumaquia"].includes(id);
}

export function savePlan(s0: GameState, p0: EventPlan): GameState {
  if (planIssues(s0, p0).length) return s0;
  const exists = s0.plans.some((x) => x.id === p0.id);
  // Evento novo recebe um identificador único
  const [s1, id] = exists ? [s0, p0.id] : nextId(s0, "ev");
  const p = { ...p0, id };
  let s: GameState = { ...s1, plans: exists ? s0.plans.map((x) => (x.id === p.id ? p : x)) : [...s0.plans, p], priceHint: { ...s0.priceHint, [`${p.venue}:${p.modality}`]: p.price } };
  // Espetáculo roteirizado não pode ter mercado de previsão: devolve as fichas
  if (p.mode === "roteirizado") s = cancelMarketsFor(s, p.id, "o evento virou espetáculo roteirizado");
  if (!exists) s = log(s, `Planejado: ${p.name}${p.mode === "roteirizado" ? " [ROTEIRIZADO]" : ""}.`, "evento");
  return s;
}

export function removePlan(s0: GameState, id: string): GameState {
  const s = cancelMarketsFor(s0, id, "o evento foi cancelado");
  return { ...s, plans: s.plans.filter((p) => p.id !== id) };
}

export function cancelMarketsFor(s: GameState, eventId: string, why: string): GameState {
  const affected = s.bets.markets.filter((m) => m.eventId === eventId && m.status === "aberto");
  if (!affected.length) return s;
  const markets = s.bets.markets.map((m) => (m.eventId === eventId && m.status === "aberto" ? { ...m, status: "cancelado" as const, result: `Cancelado: ${why}. Fichas devolvidas.` } : m));
  return log({ ...s, bets: { ...s.bets, markets } }, `Arena Bets: ${affected.length} mercado(s) cancelado(s) porque ${why}. Todas as fichas foram devolvidas.`, "bets");
}

export function freeSlots(s: GameState, venue: string): number {
  return slots(s, venue) - s.plans.filter((p) => p.venue === venue).length;
}

export function planEstimate(s: GameState, p: EventPlan) {
  return estimate(s, p);
}

/** Preço que maximiza o lucro estimado (usado pelo tesoureiro e pelo botão "preço ideal"). */
export function bestPrice(s: GameState, p: EventPlan): number {
  const ref = refPrice(s, p.venue, p.modality);
  let best = p.price;
  let bestScore = -Infinity;
  for (let k = 0.5; k <= 2.2; k += 0.1) {
    const price = Math.max(0.5, Math.round(ref * k * 2) / 2);
    const e = estimate(s, { ...p, price });
    // O tesoureiro não sacrifica a satisfação: penaliza preços que irritam
    const score = e.profit + (e.satisfaction - 60) * 15 + e.attendance * 0.2;
    if (score > bestScore) {
      bestScore = score;
      best = price;
    }
  }
  return best;
}

// ---------- Ateliê ----------

export function atelierIssue(s: GameState): string | null {
  if (!s.nodes.includes("esp-exclusivos")) return "Desbloqueie o Ateliê na árvore de Espetáculos";
  return null;
}

export function setCustom(s0: GameState, name: string, tema: string, cenario: string, efeito: string): GameState {
  if (atelierIssue(s0)) return s0;
  if (!ATELIER.temas.some((t) => t.id === tema) || !ATELIER.cenarios.some((c) => c.id === cenario) || !ATELIER.efeitos.some((e) => e.id === efeito)) return s0;
  const first = !s0.custom;
  let s: GameState = { ...s0, custom: { name: name.trim() || "Espetáculo exclusivo", tema, cenario, efeito } };
  if (first) s = { ...s, achievements: { ...s.achievements, exclusivo: s.achievements.exclusivo ?? s.week } };
  return log(s, `Ateliê: criado «${s.custom!.name}».`, "evolucao");
}

// ---------- Arco de temporada (Decreto) ----------

export function arcIssue(s: GameState, hero: string, villain: string): string | null {
  if (authority(s) < 3) return "Arcos de temporada exigem o nível Senhor das Arenas Romanas";
  if (hero === villain) return "Escolha dois gladiadores diferentes";
  if (!s.gladiators.some((g) => g.id === hero) || !s.gladiators.some((g) => g.id === villain)) return "Gladiador inválido";
  if (s.money < 1500) return "Custa 1.500 denários de produção";
  return null;
}

export function setArc(s0: GameState, hero: string, villain: string): GameState {
  if (arcIssue(s0, hero, villain)) return s0;
  const h = s0.gladiators.find((g) => g.id === hero)!;
  const v = s0.gladiators.find((g) => g.id === villain)!;
  const s = { ...s0, money: s0.money - 1500, arc: { hero, villain, until: s0.week + 8 } };
  return log(s, `Decreto: arco de temporada roteirizado — ${h.name} (herói) contra ${v.name} (vilão) por 8 semanas.`, "evento");
}

/** Direção dramática: o Coliseu anuncia uma rivalidade (ou amizade) entre dois gladiadores. */
export function promoteRelation(s0: GameState, a: string, b: string, kind: "rivalidade" | "amizade"): GameState {
  if (a === b || s0.money < 800 || authority(s0) < 2) return s0;
  const ga = s0.gladiators.find((g) => g.id === a);
  const gb = s0.gladiators.find((g) => g.id === b);
  if (!ga || !gb) return s0;
  const rest = s0.relations.filter((r) => !((r.a === a && r.b === b) || (r.a === b && r.b === a)));
  const s = {
    ...s0,
    money: s0.money - 800,
    relations: [...rest, { a, b, kind, intensity: 55, aWins: 0, bWins: 0, story: kind === "rivalidade" ? `Rivalidade anunciada pela direção do Coliseu: ${ga.name} × ${gb.name}.` : `${ga.name} e ${gb.name} apresentados como irmãos de armas.` }],
  };
  return log(s, kind === "rivalidade" ? `Direção dramática: a rivalidade ${ga.name} × ${gb.name} vira assunto em Roma.` : `Direção dramática: ${ga.name} e ${gb.name} agora são uma dupla querida.`, "gladiador");
}
