// ARENA BETS — mercado de previsões com FICHAS FICTÍCIAS E GRATUITAS.
// Não existe dinheiro real: as fichas não podem ser compradas, vendidas nem convertidas.
// Só competições LIVRES (resultado calculado pelo motor) podem ter mercado.
// Espetáculos roteirizados (Decreto Imperial) nunca recebem mercados.

import type { EventPlan, EventReport, Market, MarketOption, MarketType, Predictor } from "./types";
import type { GameState } from "./state";
import { log, nextId } from "./state";
import { has, mods } from "./economy";
import { authority, expectedDemand, simulate } from "./events";
import { marketValue, power } from "./gladiators";
import { modality } from "../content/world";
import { hash, rngFrom } from "./rng";

export const MARKET_INFO: Record<MarketType, { label: string; flag: string; description: string; period: boolean }> = {
  vencedor: { label: "Vencedor do evento", flag: "mk-vencedor", description: "Quem vence o evento livre planejado.", period: false },
  confronto: { label: "Confronto direto", flag: "mk-confronto", description: "Quem termina mais bem colocado: A ou B.", period: false },
  desempenho: { label: "Desempenho individual", flag: "mk-desempenho", description: "O gladiador vence pelo menos N combates?", period: false },
  recorde: { label: "Recorde de público", flag: "mk-recorde", description: "O evento bate o recorde de público do Coliseu?", period: false },
  frequencia: { label: "Evento mais frequentado", flag: "mk-frequencia", description: "Entre os eventos livres da semana, qual terá mais público.", period: false },
  popular: { label: "Gladiador mais popular", flag: "mk-popular", description: "Quem ganha mais fama nas próximas 4 semanas.", period: true },
  revelacao: { label: "Revelação da temporada", flag: "mk-revelacao", description: "Qual novato (fama abaixo de 30) mais cresce em 4 semanas.", period: true },
  rivalidade: { label: "Duelo de rivais", flag: "mk-rivalidade", description: "Quem vence mais confrontos diretos em 4 semanas.", period: true },
};

export function betsOpen(s: GameState): boolean {
  return authority(s) >= 2;
}

export function typeUnlocked(s: GameState, t: MarketType): boolean {
  return has(s, MARKET_INFO[t].flag);
}

/** Precisão do modelo estatístico (0–0.95). */
export function modelAccuracy(s: GameState): number {
  return Math.min(0.95, 0.45 + mods(s).betsAccuracy);
}

export interface MarketSpec {
  type: MarketType;
  eventId?: string;
  a?: string;
  b?: string;
  gladiator?: string;
  threshold?: number;
  special?: boolean;
}

function freePlan(s: GameState, id?: string): EventPlan | undefined {
  return s.plans.find((p) => p.id === id && p.mode === "livre");
}

/** Motivo para não poder criar o mercado (null = pode). */
export function marketIssue(s: GameState, spec: MarketSpec): string | null {
  if (!betsOpen(s)) return "O Arena Bets abre no nível Magnata dos Espetáculos";
  if (!typeUnlocked(s, spec.type)) return "Desbloqueie este tipo de mercado na árvore do Arena Bets";
  const info = MARKET_INFO[spec.type];
  if (!info.period && spec.type !== "frequencia") {
    const p = s.plans.find((x) => x.id === spec.eventId);
    if (!p) return "Escolha um evento planejado";
    if (p.mode === "roteirizado") return "Espetáculos roteirizados não podem ter mercado de previsão: o resultado é definido pela direção.";
    if (s.bets.markets.some((m) => m.eventId === p.id && m.type === spec.type && m.status === "aberto" && (m.ref.a ?? "") === (spec.a ?? "") && (m.ref.g ?? "") === (spec.gladiator ?? ""))) return "Já existe este mercado";
  }
  if (spec.type === "confronto" && (!spec.a || !spec.b || spec.a === spec.b)) return "Escolha dois gladiadores do evento";
  if (spec.type === "desempenho" && (!spec.gladiator || !spec.threshold)) return "Escolha o gladiador e o número de vitórias";
  if (spec.type === "frequencia" && s.plans.filter((p) => p.mode === "livre").length < 2) return "Precisa de pelo menos dois eventos livres na semana";
  if (spec.type === "frequencia" && s.bets.markets.some((m) => m.type === "frequencia" && m.status === "aberto")) return "Já existe um mercado de frequência nesta semana";
  if (spec.type === "revelacao" && s.gladiators.filter((g) => g.fame < 30).length < 2) return "Precisa de pelo menos dois gladiadores com fama abaixo de 30";
  if (spec.type === "rivalidade") {
    if (!spec.a || !spec.b) return "Escolha uma rivalidade";
    if (s.bets.markets.some((m) => m.type === "rivalidade" && m.status === "aberto" && m.ref.a === spec.a && m.ref.b === spec.b)) return "Já existe este mercado";
  }
  if ((spec.type === "popular" || spec.type === "revelacao") && s.bets.markets.some((m) => m.type === spec.type && m.status === "aberto")) return "Já existe um mercado deste tipo aberto";
  if (spec.special && !has(s, "mk-especial")) return "Mercados especiais exigem a melhoria «Mercados especiais»";
  if (spec.special && s.money < 400) return "Um mercado especial custa 400 denários de produção";
  return null;
}

function noisy(probs: number[], s: GameState, seed: number): number[] {
  const r = rngFrom(seed);
  const err = (1 - modelAccuracy(s)) * 0.9;
  const out = probs.map((p) => Math.max(0.005, p * Math.exp((r() - 0.5) * 2 * err)));
  const sum = out.reduce((a, b) => a + b, 0);
  return out.map((p) => p / sum);
}

function opt(id: string, label: string, model: number): MarketOption {
  return { id, label, model, published: model, chips: 0, picks: 0 };
}

/** Calcula as opções e as probabilidades do modelo. */
function buildOptions(s: GameState, spec: MarketSpec, seed: number): { options: MarketOption[]; name: string; description: string; ref: Record<string, string | number>; closeWeek: number; eventId?: string } {
  const runs = 150 + Math.round(mods(s).betsAccuracy * 600);
  const name = (id: string) => s.gladiators.find((g) => g.id === id)?.name ?? id;
  if (spec.type === "frequencia") {
    const plans = s.plans.filter((p) => p.mode === "livre");
    const r = rngFrom(seed);
    const counts = plans.map(() => 0);
    const exp = plans.map((p) => expectedDemand(s, p));
    for (let k = 0; k < 400; k++) {
      const att = exp.map((e) => Math.min(e.cap, e.total * (0.88 + r() * 0.24)));
      counts[att.indexOf(Math.max(...att))]++;
    }
    const probs = noisy(counts.map((c) => c / 400), s, seed + 1);
    return { options: plans.map((p, i) => opt(p.id, p.name, probs[i])), name: "Evento mais frequentado da semana", description: MARKET_INFO.frequencia.description, ref: {}, closeWeek: s.week };
  }
  if (MARKET_INFO[spec.type].period) {
    const closeWeek = s.week + 4;
    if (spec.type === "rivalidade") {
      const rel = s.relations.find((x) => (x.a === spec.a && x.b === spec.b) || (x.a === spec.b && x.b === spec.a))!;
      const ga = s.gladiators.find((g) => g.id === spec.a)!;
      const gb = s.gladiators.find((g) => g.id === spec.b)!;
      const diff = (ga.strength + ga.technique + ga.stamina - gb.strength - gb.technique - gb.stamina) / 30;
      const pa = 1 / (1 + Math.exp(-diff));
      const tie = 0.3;
      const probs = noisy([pa * (1 - tie), (1 - pa) * (1 - tie), tie], s, seed);
      return {
        options: [opt(spec.a!, ga.name, probs[0]), opt(spec.b!, gb.name, probs[1]), opt("empate", "Empate ou nenhum confronto", probs[2])],
        name: `Rivalidade: ${ga.name} × ${gb.name}`,
        description: MARKET_INFO.rivalidade.description,
        ref: { a: rel.a, b: rel.b, aWins: rel.aWins, bWins: rel.bWins, swap: rel.a === spec.a ? 0 : 1 },
        closeWeek,
      };
    }
    const pool = (spec.type === "revelacao" ? s.gladiators.filter((g) => g.fame < 30) : [...s.gladiators]).sort((a, b) => b.fame - a.fame).slice(0, 6);
    const w = pool.map((g) => (0.6 + g.charisma / 125) * (spec.type === "revelacao" ? 1 + (30 - g.fame) / 30 : 1 + g.fame / 50) * (g.injuredWeeks ? 0.4 : 1));
    const sum = w.reduce((a, b) => a + b, 0);
    const probs = noisy(w.map((x) => x / sum), s, seed);
    const ref: Record<string, string | number> = {};
    for (const g of pool) ref[`f_${g.id}`] = g.fame;
    return { options: pool.map((g, i) => opt(g.id, g.name, probs[i])), name: spec.type === "popular" ? `Mais popular até a semana ${closeWeek}` : `Revelação até a semana ${closeWeek}`, description: MARKET_INFO[spec.type].description, ref, closeWeek };
  }
  // Mercados de um evento livre: Monte Carlo com o mesmo simulador do evento
  const p = freePlan(s, spec.eventId)!;
  const m = modality(p.modality);
  const gs = p.gladiators.map((id) => s.gladiators.find((g) => g.id === id)!).filter(Boolean);
  const r = rngFrom(seed);
  const base = { name: "", description: MARKET_INFO[spec.type].description, closeWeek: s.week, eventId: p.id };
  if (spec.type === "recorde") {
    const e = expectedDemand(s, p);
    const rec = s.records.attendance;
    let pYes = 0;
    if (e.cap > rec) pYes = Math.max(0, Math.min(1, (1.12 - rec / Math.max(1, e.total)) / 0.24));
    const probs = noisy([Math.min(0.98, Math.max(0.02, pYes)), Math.min(0.98, Math.max(0.02, 1 - pYes))], s, seed);
    return { ...base, name: `${p.name}: bate o recorde de ${rec.toLocaleString("pt-BR")} pessoas?`, options: [opt("sim", "Sim", probs[0]), opt("nao", "Não", probs[1])], ref: { record: rec } };
  }
  const win: Record<string, number> = {};
  let aAhead = 0;
  let reach = 0;
  for (let k = 0; k < runs; k++) {
    const sim = simulate(gs, m, r);
    if (sim.winner) win[sim.winner] = (win[sim.winner] ?? 0) + 1;
    if (spec.type === "confronto" && sim.ranking.indexOf(spec.a!) < sim.ranking.indexOf(spec.b!)) aAhead++;
    if (spec.type === "desempenho" && (sim.wins[spec.gladiator!] ?? 0) >= spec.threshold!) reach++;
  }
  if (spec.type === "vencedor") {
    const probs = noisy(gs.map((g) => (win[g.id] ?? 0.3) / runs), s, seed);
    return { ...base, name: `${p.name}: quem vence?`, options: gs.map((g, i) => opt(g.id, g.name, probs[i])), ref: {} };
  }
  if (spec.type === "confronto") {
    const pa = Math.min(0.97, Math.max(0.03, aAhead / runs));
    const probs = noisy([pa, 1 - pa], s, seed);
    return { ...base, name: `${p.name}: ${name(spec.a!)} ou ${name(spec.b!)}?`, options: [opt(spec.a!, name(spec.a!), probs[0]), opt(spec.b!, name(spec.b!), probs[1])], ref: { a: spec.a!, b: spec.b! } };
  }
  const py = Math.min(0.97, Math.max(0.03, reach / runs));
  const probs = noisy([py, 1 - py], s, seed);
  return { ...base, name: `${p.name}: ${name(spec.gladiator!)} vence ${spec.threshold}+ combate(s)?`, options: [opt("sim", "Sim", probs[0]), opt("nao", "Não", probs[1])], ref: { g: spec.gladiator!, n: spec.threshold! } };
}

/** Participantes que o Arena Bets atrai nesta semana. */
export function participantsFor(s: GameState): { mine: number; rival: number } {
  const md = mods(s);
  const pool = 40 + s.popularity * 8 + s.fame * 0.6 + (s.rival.active ? s.rival.fame * 0.4 : 0) + s.branches.length * 60 * (s.bets.unlocked.includes("bc-parcerias") ? 1.5 : 1);
  const mine = Math.pow(s.bets.credibility / 55, 1.5) * (1 + md.betsParticipants) * (1 + md.betsEngagement) * (0.5 + s.bets.popularity / 50);
  let theirs = 0;
  if (s.rival.active && !s.rival.defeated) {
    theirs = (0.9 + s.rival.tech * 0.05) * (s.rival.strategy === "marketing" ? 1.3 : 1) * (s.bets.unlocked.includes("bc-padrao") && s.bets.transparency > 70 ? 0.8 : 1);
  }
  const share = mine / (mine + theirs);
  return { mine: Math.round(pool * share), rival: Math.round(pool * (1 - share)) };
}

/** Peso de cada previsor (habilidade fixa por nome). */
function skillOf(p: Predictor): number {
  return 0.25 + (hash(p.name) % 1000) / 1000 * 0.65;
}

function pickIndex(probs: number[], r: () => number): number {
  let x = r();
  for (let i = 0; i < probs.length; i++) {
    x -= probs[i];
    if (x <= 0) return i;
  }
  return probs.length - 1;
}

/** Os participantes fazem suas previsões com fichas gratuitas. */
function placePicks(s: GameState, m: Market, r: () => number): { market: Market; predictors: Predictor[] } {
  const options = m.options.map((o) => ({ ...o }));
  const predictors = s.bets.predictors.map((p) => ({ ...p }));
  // Previsores com nome
  for (const p of predictors) {
    if (r() > 0.7 || p.chips < 5) continue;
    const sk = skillOf(p);
    const probs = options.map((o) => o.model * sk + o.published * (1 - sk));
    const i = pickIndex(probs, r);
    const stake = Math.max(1, Math.min(m.maxChips, Math.round(p.chips * 0.2)));
    p.chips -= stake;
    options[i].chips += stake;
    options[i].picks++;
    (m.ref as Record<string, string | number>)[`p_${p.id}`] = `${options[i].id}|${stake}`;
  }
  // Público geral (anônimo): segue as probabilidades publicadas, com ruído
  const crowd = Math.max(0, m.participants - predictors.length);
  for (let i = 0; i < Math.min(crowd, 400); i++) {
    const k = pickIndex(options.map((o) => o.published), r);
    const stake = Math.max(1, Math.round(m.maxChips * (0.15 + r() * 0.4)));
    const scale = crowd > 400 ? crowd / 400 : 1;
    options[k].chips += Math.round(stake * scale);
    options[k].picks += Math.round(scale);
  }
  return { market: { ...m, options }, predictors };
}

export function createMarket(s0: GameState, spec: MarketSpec): GameState {
  if (marketIssue(s0, spec)) return s0;
  const [s1, id] = nextId(s0, "mk");
  const seed = hash(`${s1.seed}:${id}`);
  const built = buildOptions(s1, spec, seed);
  const typeInterest = spec.type === "vencedor" ? 1 : spec.type === "popular" || spec.type === "rivalidade" ? 0.9 : 0.6;
  const plan = s1.plans.find((p) => p.id === built.eventId);
  const eventFactor = plan ? Math.min(1.6, 0.6 + plan.gladiators.reduce((a, g) => a + (s1.gladiators.find((x) => x.id === g)?.fame ?? 0), 0) / 150) : 1;
  const participants = Math.round(s1.bets.participants * typeInterest * eventFactor * (spec.special ? 2 : 1) * 0.6);
  let market: Market = {
    id,
    type: spec.type,
    name: built.name,
    description: built.description,
    eventId: built.eventId,
    ref: built.ref,
    options: built.options,
    openWeek: s1.week,
    closeWeek: built.closeWeek,
    status: "aberto",
    participants,
    maxChips: s1.bets.maxChipsPerPick,
    rules: rulesText(spec.type, built.closeWeek),
    custom: false,
    special: !!spec.special,
  };
  const r = rngFrom(seed + 7);
  const placed = placePicks(s1, market, r);
  market = placed.market;
  let s: GameState = {
    ...s1,
    money: s1.money - (spec.special ? 400 : 0),
    bets: { ...s1.bets, markets: [market, ...s1.bets.markets].slice(0, 80), predictors: placed.predictors, totalPredictions: s1.bets.totalPredictions + market.options.reduce((a, o) => a + o.picks, 0) },
  };
  s = log(s, `Arena Bets: mercado aberto — ${market.name} (${participants} participantes).`, "bets");
  return s;
}

function rulesText(t: MarketType, close: number): string {
  const base = "Fichas fictícias e gratuitas, sem valor em dinheiro. Resultado calculado pelo motor do jogo numa competição livre, sem roteiro.";
  if (t === "frequencia" || t === "recorde") return `${base} Conta o público pago registrado na bilheteria.`;
  if (MARKET_INFO[t].period) return `${base} Fecha ao fim da semana ${close}.`;
  return `${base} Fecha quando o evento termina. Se o evento for cancelado ou virar roteirizado, todas as fichas são devolvidas.`;
}

/** O administrador publica as próprias probabilidades (distintas do modelo). */
export function publishOdds(s: GameState, marketId: string, published: number[]): GameState {
  const m = s.bets.markets.find((x) => x.id === marketId);
  if (!m || m.status !== "aberto" || published.length !== m.options.length) return s;
  const clean = published.map((p) => Math.max(0.01, p));
  const sum = clean.reduce((a, b) => a + b, 0);
  const options = m.options.map((o, i) => ({ ...o, published: clean[i] / sum }));
  const deviation = options.reduce((a, o) => a + Math.abs(o.published - o.model), 0);
  const custom = deviation > 0.02;
  const markets = s.bets.markets.map((x) => (x.id === marketId ? { ...x, options, custom } : x));
  return { ...s, bets: { ...s.bets, markets } };
}

export function resetOdds(s: GameState, marketId: string): GameState {
  const m = s.bets.markets.find((x) => x.id === marketId);
  if (!m) return s;
  return publishOdds(s, marketId, m.options.map((o) => o.model));
}

/** Liquida um mercado: paga fichas fictícias, atualiza previsores e credibilidade. */
function settle(s0: GameState, marketId: string, winner: string, label: string): GameState {
  const m = s0.bets.markets.find((x) => x.id === marketId);
  if (!m || m.status !== "aberto") return s0;
  const md = mods(s0);
  const pool = m.options.reduce((a, o) => a + o.chips, 0);
  const win = m.options.find((o) => o.id === winner);
  const ratio = win && win.chips > 0 ? pool / win.chips : 0;
  const brier = m.options.reduce((a, o) => a + Math.pow(o.published - (o.id === winner ? 1 : 0), 2), 0);
  const brierModel = m.options.reduce((a, o) => a + Math.pow(o.model - (o.id === winner ? 1 : 0), 2), 0);
  const predictors = s0.bets.predictors.map((p) => {
    const pick = m.ref[`p_${p.id}`];
    if (typeof pick !== "string") return p;
    const [opt, stakeS] = pick.split("|");
    const stake = Number(stakeS);
    const ok = opt === winner;
    const q = { ...p, total: p.total + 1 };
    if (ok) {
      const gain = Math.round(stake * ratio);
      q.chips += gain;
      q.weekGain += gain - stake;
      q.correct++;
      q.streak++;
      q.bestStreak = Math.max(q.bestStreak, q.streak);
      if (s0.bets.unlocked.includes("bn-sequencias") && q.streak >= 3) q.chips += 20;
    } else {
      q.streak = 0;
      q.weekGain -= stake;
    }
    if (s0.bets.unlocked.includes("bn-titulos")) q.title = q.correct >= 20 ? "Oráculo" : q.correct >= 10 ? "Sibila" : q.correct >= 5 ? "Áugure" : q.title;
    return q;
  });
  // Credibilidade: probabilidades bem calibradas e regras claras sobem; erros grandes derrubam.
  const audit = s0.bets.unlocked.includes("be-auditoria") ? 0.6 : 1;
  let dc = (0.45 - brier) * 6;
  if (dc < 0) dc *= audit;
  if (m.custom && brier > brierModel + 0.05) dc -= 1.5; // publicar algo pior que o modelo pega mal
  dc += (s0.bets.transparency - 60) / 100 + (s0.bets.ruleClarity - 60) / 120;
  const credibility = Math.max(0, Math.min(100, Math.round((s0.bets.credibility + dc) * 10) / 10));
  const markets = s0.bets.markets.map((x) => (x.id === marketId ? { ...x, status: "resolvido" as const, result: label, brier: Math.round(brier * 1000) / 1000 } : x));
  const points = 1 + Math.floor(m.participants / 150) + (m.special ? 1 : 0);
  let s: GameState = {
    ...s0,
    ep: s0.ep + (m.participants >= 150 ? 1 : 0),
    bets: {
      ...s0.bets,
      markets,
      predictors,
      credibility,
      points: s0.bets.points + points,
      popularity: Math.min(100, Math.round((s0.bets.popularity + m.participants / 120 + (1 + md.betsEngagement) * 0.5) * 10) / 10),
      accuracyHistory: [...s0.bets.accuracyHistory, Math.round((1 - brier / 2) * 100)].slice(-30),
    },
  };
  s = log(s, `Arena Bets: ${m.name} → ${label}. ${win ? `${win.picks} acertaram.` : ""}`, "bets");
  return s;
}

/** Depois do evento: resolve os mercados ligados a ele. */
export function resolveEventMarkets(s0: GameState, report: EventReport): GameState {
  let s = s0;
  for (const m of s0.bets.markets.filter((x) => x.eventId === report.id && x.status === "aberto")) {
    if (report.mode === "roteirizado") {
      // Proteção: nunca liquidar mercado de espetáculo roteirizado
      s = { ...s, bets: { ...s.bets, markets: s.bets.markets.map((x) => (x.id === m.id ? { ...x, status: "cancelado" as const, result: "Cancelado: espetáculo roteirizado. Fichas devolvidas." } : x)) } };
      continue;
    }
    const name = (id: string | null) => s.gladiators.find((g) => g.id === id)?.name ?? "—";
    if (m.type === "vencedor" && report.winner) s = settle(s, m.id, report.winner, `Venceu ${name(report.winner)}`);
    if (m.type === "recorde") {
      const yes = report.attendance > Number(m.ref.record);
      s = settle(s, m.id, yes ? "sim" : "nao", yes ? `Recorde: ${report.attendance.toLocaleString("pt-BR")} pessoas` : `Sem recorde (${report.attendance.toLocaleString("pt-BR")})`);
    }
    if (m.type === "confronto") {
      const ranking = report.ranking;
      const a = String(m.ref.a);
      const b = String(m.ref.b);
      const w = ranking.indexOf(a) <= ranking.indexOf(b) ? a : b;
      s = settle(s, m.id, w, `${name(w)} terminou à frente`);
    }
    if (m.type === "desempenho") {
      const g = String(m.ref.g);
      const wins = report.wins[g] ?? 0;
      const yes = wins >= Number(m.ref.n);
      s = settle(s, m.id, yes ? "sim" : "nao", `${name(g)}: ${wins} vitória(s)`);
    }
  }
  return s;
}

/** Fim da semana: mercados de frequência e de período. */
export function resolveWeekMarkets(s0: GameState, reports: EventReport[]): GameState {
  let s = s0;
  for (const m of s0.bets.markets.filter((x) => x.status === "aberto")) {
    if (m.type === "frequencia" && m.closeWeek <= s.week) {
      const rs = reports.filter((r) => m.options.some((o) => o.id === r.id) && r.mode === "livre");
      if (!rs.length) {
        s = { ...s, bets: { ...s.bets, markets: s.bets.markets.map((x) => (x.id === m.id ? { ...x, status: "cancelado" as const, result: "Cancelado: eventos não realizados. Fichas devolvidas." } : x)) } };
        continue;
      }
      const top = rs.sort((a, b) => b.attendance - a.attendance)[0];
      s = settle(s, m.id, top.id, `${top.name}: ${top.attendance.toLocaleString("pt-BR")} pessoas`);
    }
    if ((m.type === "popular" || m.type === "revelacao") && m.closeWeek <= s.week) {
      let best = m.options[0].id;
      let bestGain = -Infinity;
      for (const o of m.options) {
        const g = s.gladiators.find((x) => x.id === o.id);
        const gain = (g?.fame ?? 0) - Number(m.ref[`f_${o.id}`] ?? 0);
        if (gain > bestGain) {
          bestGain = gain;
          best = o.id;
        }
      }
      s = settle(s, m.id, best, `${m.options.find((o) => o.id === best)!.label} (+${Math.round(bestGain * 10) / 10} de fama)`);
    }
    if (m.type === "rivalidade" && m.closeWeek <= s.week) {
      const rel = s.relations.find((x) => x.a === m.ref.a && x.b === m.ref.b);
      const da = (rel?.aWins ?? 0) - Number(m.ref.aWins);
      const db = (rel?.bWins ?? 0) - Number(m.ref.bWins);
      const w = da === db ? "empate" : da > db ? String(m.ref.a) : String(m.ref.b);
      s = settle(s, m.id, w, da === db ? `Empate (${da} × ${db})` : `${m.options.find((o) => o.id === w)?.label} (${Math.max(da, db)} × ${Math.min(da, db)})`);
    }
  }
  return s;
}

/** Semana do Arena Bets: participantes, fichas gratuitas, concorrência, painel. */
export function weeklyBets(s0: GameState): GameState {
  if (!betsOpen(s0)) return s0;
  const md = mods(s0);
  const { mine, rival } = participantsFor(s0);
  const chips = Math.round(s0.bets.weeklyChips * (1 + md.betsChips));
  const perPredictor = Math.round(chips / 60);
  let predictors = s0.bets.predictors.map((p) => ({ ...p, chips: p.chips + perPredictor }));
  let s: GameState = { ...s0 };
  // Campeonato mensal de previsões
  if (s0.bets.unlocked.includes("bn-campeonato") && s0.week % 4 === 0) {
    const champ = [...predictors].sort((a, b) => b.weekGain - a.weekGain)[0];
    if (champ && champ.weekGain > 0) {
      s = log(s, `Campeonato de previsões: ${champ.name} (${champ.city}) foi o melhor previsor do mês.`, "bets");
      s = { ...s, prestige: s.prestige + 1 };
    }
    predictors = predictors.map((p) => ({ ...p, weekGain: 0 }));
  }
  const open = s0.bets.markets.filter((m) => m.status === "aberto").length;
  const popularity = Math.max(0, Math.min(100, Math.round((s0.bets.popularity + (open ? 0.5 : -1)) * 10) / 10));
  const quotes: Record<string, number> = {};
  for (const g of s0.gladiators) quotes[g.id] = marketValue(g);
  s = {
    ...s,
    money: s.money - (open ? 40 + open * 20 : 0),
    rival: s.rival.active ? { ...s.rival, betsParticipants: rival } : s.rival,
    bets: {
      ...s.bets,
      participants: mine,
      predictors,
      popularity,
      chipsDistributed: s.bets.chipsDistributed + chips,
      transparency: Math.max(0, Math.min(100, s.bets.transparency + (s.bets.unlocked.includes("be-publicacao") ? 0.5 : 0) - 0.1)),
      history: [...s.bets.history, { week: s0.week, participants: mine, rival, credibility: s.bets.credibility, chips: predictors.reduce((a, p) => a + p.chips, 0) }].slice(-52),
      quotes: Object.keys(s.bets.quotes).length ? s.bets.quotes : quotes,
    },
  };
  return s;
}

/** Guarda as cotações da semana (chamado no fim do turno). */
export function snapshotQuotes(s: GameState): GameState {
  const quotes: Record<string, number> = {};
  for (const g of s.gladiators) quotes[g.id] = marketValue(g);
  return { ...s, bets: { ...s.bets, quotes } };
}

/** Controles do mercado na Central Imperial. */
export function setBetsControls(s: GameState, c: { weeklyChips?: number; maxChipsPerPick?: number }): GameState {
  const weeklyChips = Math.max(500, Math.min(20000, Math.round(c.weeklyChips ?? s.bets.weeklyChips)));
  const maxChipsPerPick = Math.max(10, Math.min(500, Math.round(c.maxChipsPerPick ?? s.bets.maxChipsPerPick)));
  return { ...s, bets: { ...s.bets, weeklyChips, maxChipsPerPick } };
}

/** Investir em regras mais claras (redação, juízes, painel de regras). */
export function improveRules(s: GameState): GameState {
  if (s.money < 600 || s.bets.ruleClarity >= 100) return s;
  return log({ ...s, money: s.money - 600, bets: { ...s.bets, ruleClarity: Math.min(100, s.bets.ruleClarity + 8) } }, "Arena Bets: regras reescritas e afixadas no Fórum.", "bets");
}

/** Publicar o relatório do modelo e dos resultados (transparência). */
export function publishReport(s: GameState): GameState {
  if (s.money < 400 || s.bets.transparency >= 100) return s;
  return log({ ...s, money: s.money - 400, bets: { ...s.bets, transparency: Math.min(100, s.bets.transparency + 6), credibility: Math.min(100, s.bets.credibility + 1) } }, "Arena Bets: relatório público do modelo e dos resultados publicado.", "bets");
}

/** Pregoeiro: abre mercados de vencedor para os eventos livres sem mercado. */
export function autoMarkets(s0: GameState): GameState {
  let s = s0;
  for (const p of s0.plans.filter((x) => x.mode === "livre")) {
    if (s.bets.markets.some((m) => m.eventId === p.id && m.type === "vencedor")) continue;
    if (!marketIssue(s, { type: "vencedor", eventId: p.id })) s = createMarket(s, { type: "vencedor", eventId: p.id });
  }
  return s;
}

/** Ranking dos gladiadores por valor de mercado (com variação semanal). */
export function gladiatorQuotes(s: GameState) {
  return [...s.gladiators]
    .map((g) => ({ g, value: marketValue(g), prev: s.bets.quotes[g.id] ?? marketValue(g) }))
    .sort((a, b) => b.value - a.value);
}

export function bestPowerIn(s: GameState, ids: string[], modalityId: string): string | undefined {
  const m = modality(modalityId);
  return ids.map((id) => s.gladiators.find((g) => g.id === id)!).filter(Boolean).sort((a, b) => power(b, m) - power(a, m))[0]?.id;
}
