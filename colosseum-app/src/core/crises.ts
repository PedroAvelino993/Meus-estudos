// Crises e ameaças: sorteio (com crises condicionais), escolhas e missões com prazo.

import type { Crisis, CrisisChoice, CrisisStat } from "./types";
import type { GameState } from "./state";
import { log, nextId } from "./state";
import { refPrice } from "./economy";
import { createLeague } from "./rival";
import { CRISES, REBELLION } from "../content/story";

export function crisisById(id: string): Crisis {
  if (id === REBELLION.id) return REBELLION;
  const c = CRISES.find((x) => x.id === id);
  if (!c) throw new Error(`Crise desconhecida: ${id}`);
  return c;
}

/** Peso de cada crise nesta semana (condicionais dependem do estado). */
function weightOf(s: GameState, c: Crisis): number {
  if (c.minEra > s.era) return 0;
  switch (c.id) {
    case "revolta-precos": {
      const last = s.reports.slice(0, 3);
      const overpriced = last.some((r) => {
        const plan = r.revenue.tickets / Math.max(1, r.attendance);
        return plan > refPrice(s, r.venue, r.modality) * 1.35;
      });
      return overpriced ? 6 : 0;
    }
    case "funcionarios":
      return s.staffMorale < 40 ? 6 : 0;
    case "rival-estrela":
      return s.flags.includes("rival-contratou") ? 5 : 0;
    case "boato":
      return s.bets.markets.length > 3 && s.authenticity < 75 ? 4 : s.bets.markets.length > 6 ? 1 : 0;
    case "nova-arena":
      return s.rival.active ? c.weight : 0;
    default:
      return c.weight;
  }
}

/** Sorteia (ou não) uma crise para a semana. */
export function rollCrisis(s0: GameState, r: () => number): GameState {
  let s = s0;
  // Remendo mal feito pode cobrar o preço
  if (s.flags.includes("remendo") && r() < 0.12) {
    s = { ...s, flags: s.flags.filter((f) => f !== "remendo"), popularity: Math.max(0, s.popularity - 10), prestige: Math.max(0, s.prestige - 3) };
    s = log(s, "O remendo na arquibancada cedeu durante a saída do público. Ninguém se feriu, mas Roma inteira comentou.", "crise");
  }
  if (s.week < 4 || s.pendingCrises.length) return s;
  const chance = 0.12 + s.era * 0.025;
  if (r() > chance) return s;
  const recent = new Set(s.log.filter((l) => l.kind === "crise" && l.week > s.week - 10).map((l) => l.text));
  const pool = CRISES.map((c) => ({ c, w: weightOf(s, c) })).filter((x) => x.w > 0 && ![...recent].some((t) => t.startsWith(x.c.title)));
  const total = pool.reduce((a, x) => a + x.w, 0);
  if (!total) return s;
  let x = r() * total;
  const picked = pool.find((p) => (x -= p.w) <= 0)?.c ?? pool[0].c;
  s = { ...s, pendingCrises: [...s.pendingCrises, picked.id], flags: picked.id === "rival-estrela" ? s.flags.filter((f) => f !== "rival-contratou") : s.flags };
  return s;
}

export function choiceIssue(s: GameState, c: CrisisChoice): string | null {
  if (c.needsMoney && s.money < c.needsMoney) return `Precisa de ${c.needsMoney.toLocaleString("pt-BR")} denários`;
  return null;
}

/** Aplica um efeito de crise/missão ao estado. */
export function applyEffect(s0: GameState, effect: Partial<Record<CrisisStat, number>>): GameState {
  let s = { ...s0 };
  const guards = Math.min(0.5, (s.staff.segurancas ?? 0) * 0.06);
  for (const [k, v0] of Object.entries(effect) as [CrisisStat, number][]) {
    let v = v0;
    if (v < 0 && (k === "popularity" || k === "satisfaction")) v *= 1 - guards;
    switch (k) {
      case "money": s.money += v; break;
      case "popularity": s.popularity = clamp(s.popularity + v); break;
      case "fame": s.fame = Math.max(0, s.fame + v); break;
      case "prestige": s.prestige = Math.max(0, s.prestige + v); break;
      case "favor": s.favor = clamp(s.favor + v); break;
      case "staffMorale": s.staffMorale = clamp(s.staffMorale + v); break;
      case "ep": s.ep = Math.max(0, s.ep + v); break;
      case "authenticity": s.authenticity = clamp(s.authenticity + v); break;
      case "condition": s.gladiators = s.gladiators.map((g) => ({ ...g, condition: clamp(g.condition + v), morale: clamp(g.morale + v / 2) })); break;
      case "satisfaction": s.tempMods = [...s.tempMods, { key: "satisfaction", value: v, weeks: 3, label: "Efeito de crise" }]; break;
      case "rivalPop": s.rival = { ...s.rival, regions: { ...s.rival.regions, roma: clamp((s.rival.regions.roma ?? 0) + v) } }; break;
      case "credibility": s.bets = { ...s.bets, credibility: clamp(s.bets.credibility + v) }; break;
    }
  }
  return s;
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v * 10) / 10));

export function resolveCrisis(s0: GameState, crisisId: string, choice: number, r: () => number): GameState {
  if (!s0.pendingCrises.includes(crisisId)) return s0;
  const c = crisisById(crisisId);
  const ch = c.choices[choice];
  if (!ch || choiceIssue(s0, ch)) return s0;
  let s: GameState = { ...s0, pendingCrises: s0.pendingCrises.filter((x) => x !== crisisId), money: s0.money - (ch.cost ?? 0), stats: { ...s0.stats, crises: s0.stats.crises + 1 } };
  s = applyEffect(s, ch.effect);
  if (ch.flag) s = { ...s, flags: [...s.flags, ch.flag] };
  // Missão do governante
  if (c.quest && choice === 0) {
    const [s2, id] = nextId(s, "q");
    s = { ...s2, quests: [...s2.quests, { id, title: c.title, description: `Realize um evento com ${c.quest.minSatisfaction}% de satisfação ou mais até a semana ${s.week + c.quest.weeks}.`, modality: c.quest.modality, minSatisfaction: c.quest.minSatisfaction, deadline: s.week + c.quest.weeks, reward: c.quest.reward, penalty: c.quest.penalty }] };
  }
  // Rebelião das Arenas
  if (c.id === REBELLION.id) {
    if (ch.flag === "rebeliao-guerra") s = createLeague(s, r);
    if (ch.flag === "rebeliao-alianca") s = { ...s, contracts: [...s.contracts, { id: "liga", name: "Aliança com a Liga (repasse)", weekly: -800, weeksLeft: 30 }], achievements: { ...s.achievements, liga: s.week } };
    if (ch.flag === "rebeliao-compra") s = { ...s, achievements: { ...s.achievements, liga: s.week } };
  }
  s = log(s, `${c.title}: ${ch.label}.`, "crise");
  return s;
}

/** Missões: cumpridas por eventos da semana, ou falham no prazo. */
export function checkQuests(s0: GameState, weekReports: { satisfaction: number; modality: string }[]): GameState {
  let s = s0;
  for (const q of s0.quests) {
    const done = weekReports.some((r) => r.satisfaction >= q.minSatisfaction && (!q.modality || r.modality === q.modality));
    if (done) {
      s = applyEffect({ ...s, quests: s.quests.filter((x) => x.id !== q.id) }, q.reward);
      s = log(s, `Missão cumprida: ${q.title}. Recompensa recebida.`, "crise");
    } else if (q.deadline <= s.week) {
      s = applyEffect({ ...s, quests: s.quests.filter((x) => x.id !== q.id) }, q.penalty);
      s = log(s, `Missão fracassada: ${q.title}.`, "crise");
    }
  }
  return s;
}

export function triggerRebellion(s: GameState): GameState {
  if (s.flags.includes("rebeliao") || s.pendingCrises.includes(REBELLION.id)) return s;
  return log({ ...s, flags: [...s.flags, "rebeliao"], pendingCrises: [...s.pendingCrises, REBELLION.id] }, "As arenas menores se uniram: começa a REBELIÃO DAS ARENAS.", "crise");
}
