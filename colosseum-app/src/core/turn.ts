// Avançar a semana: eventos, mercados, economia, gladiadores, rival, filiais,
// crises, Arena Bets e progressão — nessa ordem.

import type { EventReport } from "./types";
import type { GameState, WeekSummary } from "./state";
import { log, weekRng } from "./state";
import { has, mods, weeklyExpenses, weeklyIncome } from "./economy";
import { planIssues, runEvent } from "./events";
import { refreshMarket, weeklyGladiators } from "./gladiators";
import { bestPrice, draftPlan, freeSlots } from "./plans";
import { autoMarkets, resolveEventMarkets, resolveWeekMarkets, snapshotQuotes, weeklyBets } from "./bets";
import { weeklyRivals } from "./rival";
import { weeklyBranches } from "./world";
import { checkQuests, rollCrisis } from "./crises";
import { weeklyProgression } from "./progression";

/** O que impede de avançar (crises pendentes, fim de jogo). */
export function blockers(s: GameState): string[] {
  const out: string[] = [];
  if (s.pendingCrises.length) out.push("Resolva a crise pendente antes de avançar.");
  if (s.defeat) out.push("A campanha terminou.");
  if (s.victory && !s.infinite) out.push("Você venceu! Escolha continuar no modo infinito.");
  return out;
}

/** Gerentes fazem o que foi delegado — antes dos eventos. */
export function automate(s0: GameState): GameState {
  let s = s0;
  if (s.managers.includes("diretor") && s.automation.diretor !== false && !s.plans.some((p) => p.venue === "roma") && freeSlots(s, "roma") > 0) {
    const [s2, p] = draftPlan(s, "roma");
    const plan = { ...p, auto: true, price: s.managers.includes("tesoureiro") && s.automation.tesoureiro !== false ? bestPrice(s2, p) : p.price };
    if (!planIssues(s2, plan).length) {
      s = { ...s2, plans: [...s2.plans, plan] };
      s = log(s, `Diretor de eventos planejou: ${plan.name}.`, "evento");
    }
  }
  if (s.managers.includes("tesoureiro") && s.automation.tesoureiro !== false) {
    s = { ...s, plans: s.plans.map((p) => (p.auto ? p : { ...p, price: bestPrice(s, p) })) };
  }
  if (s.managers.includes("pregoeiro") && s.automation.pregoeiro !== false) s = autoMarkets(s);
  return s;
}

export function advanceWeek(s0: GameState): GameState {
  if (blockers(s0).length) return s0;
  const r = weekRng(s0, "turn");
  let s = automate(s0);
  const startMoney = s.money;
  const news: string[] = [];

  // 1. Eventos planejados
  const reports: EventReport[] = [];
  const busy = new Set<string>();
  for (const p of s.plans) {
    const issues = planIssues(s, p).filter((x) => !x.startsWith("Este local já tem"));
    if (issues.length) {
      news.push(`${p.name} foi cancelado: ${issues[0]}`);
      s = log(s, `${p.name} foi cancelado: ${issues[0]}`, "evento");
      continue;
    }
    p.gladiators.forEach((g) => busy.add(g));
    const out = runEvent(s, p);
    s = resolveEventMarkets(out.state, out.report);
    reports.push(out.report);
  }
  s = { ...s, plans: [] };
  s = resolveWeekMarkets(s, reports);

  // 2. Economia fixa
  const md = mods(s);
  const expenses = weeklyExpenses(s);
  const income = weeklyIncome(s);
  const exp = expenses.reduce((a, e) => a + e.amount, 0);
  const inc = income.reduce((a, e) => a + e.amount, 0);
  s = { ...s, money: s.money + inc - exp, contracts: s.contracts.map((c) => ({ ...c, weeksLeft: c.weeksLeft - 1 })).filter((c) => c.weeksLeft > 0) };

  // 3. Gladiadores e mercado de talentos
  s = weeklyGladiators(s, busy, r);
  if (s.week % 2 === 0) s = refreshMarket(s, r);

  // 4. Rival(is)
  if (s.rival.active || s.league) s = weeklyRivals(s, r);

  // 5. Filiais
  const br = weeklyBranches(s, r);
  s = br.state;
  for (const b of br.results) news.push(`Filial ${b.region}: ${b.attendance.toLocaleString("pt-BR")} pessoas, ${b.profit >= 0 ? "lucro" : "prejuízo"} de ${Math.abs(b.profit).toLocaleString("pt-BR")}.`);

  // 6. Crises e missões
  s = checkQuests(s, reports);
  s = rollCrisis(s, r);

  // 7. Arena Bets
  s = weeklyBets(s);

  // 8. Derivas: sem evento a popularidade esfria; favor e moral voltam ao normal
  const romaEvent = reports.some((x) => x.venue === "roma");
  s = {
    ...s,
    popularity: Math.max(0, Math.round((s.popularity - (romaEvent ? 0.5 : 1.5)) * 10) / 10),
    favor: Math.max(0, Math.min(100, Math.round((s.favor + (s.favor < 40 + md.favor ? 0.4 : -0.3) - (s.nodes.includes("pre-povo") ? 0.2 : 0)) * 10) / 10)),
    staffMorale: Math.max(0, Math.min(100, Math.round(s.staffMorale + (s.staffMorale < 65 + md.staffMorale ? 1 : -0.5)))),
    tempMods: s.tempMods.map((t) => ({ ...t, weeks: t.weeks - 1 })).filter((t) => t.weeks > 0),
    arc: s.arc && s.arc.until <= s.week ? null : s.arc,
  };
  if (s.week % 4 === 0 && s.money < 0) s = { ...s, staffMorale: Math.max(0, s.staffMorale - 8) };

  // 9. Registro financeiro
  const totalAttendance = reports.reduce((a, x) => a + x.attendance, 0);
  s = {
    ...s,
    ledger: [...s.ledger, { week: s.week, income: Math.round(s.money - startMoney + exp), expenses: exp, balance: Math.round(s.money), attendance: totalAttendance, popularity: s.popularity, fame: Math.round(s.fame), rivalFame: Math.round(s.rival.fame) }].slice(-104),
  };

  // 10. Progressão e nova semana
  s = weeklyProgression(s, r);
  s = snapshotQuotes(s);
  const summary: WeekSummary = {
    week: s.week,
    reports,
    income: inc,
    expenses: exp,
    breakdown: [...income.map((i) => ({ label: i.label, amount: i.amount })), ...expenses.map((e) => ({ label: e.label, amount: -e.amount }))],
    news: [...news, ...freshLog(s0, s).filter((l) => ["rival", "crise", "era", "mundo", "conquista", "gladiador"].includes(l.kind)).map((l) => l.text)].slice(0, 14),
    markets: s.bets.markets.filter((m) => m.status !== "aberto" && m.result && (m.closeWeek === s.week || m.openWeek === s.week)).map((m) => `${m.name} → ${m.result}`),
  };
  s = { ...s, week: s.week + 1, lastSummary: summary };
  if (has(s, "juros") && s.money < 0) s = { ...s, money: Math.round(s.money * 1.01) };
  return s;
}

/** Entradas do registro criadas durante esta semana. */
function freshLog(before: GameState, after: GameState) {
  const first = before.log[0];
  const idx = first ? after.log.indexOf(first) : -1;
  return (idx >= 0 ? after.log.slice(0, idx) : after.log.slice(0, 20)).reverse();
}

export function continueInfinite(s: GameState): GameState {
  return log({ ...s, infinite: true }, "Modo infinito: o império dos espetáculos continua.", "era");
}
