// Eventos: validação, estimativa, simulação dos combates e relatório.
// A mesma simulação alimenta as probabilidades do Arena Bets (Monte Carlo).

import type { Bout, Decree, Estimate, EventPlan, EventReport, Gladiator, Modality } from "./types";
import type { GameState } from "./state";
import { log } from "./state";
import { buildingValue, capacity, has, mods, refPrice, slots, venuePopularity } from "./economy";
import { power, relationBetween, volatility } from "./gladiators";
import { ATELIER, EXTRAS, MODALITIES, modality, region } from "../content/world";
import { DECREE_STORIES } from "../content/story";
import { rngFrom, hash } from "./rng";

export type BoutKind = "duelo" | "noite" | "torneio" | "equipes" | "corrida" | "atuacao";

export function boutKind(m: Modality): BoutKind {
  if (m.id === "demonstracao") return "duelo";
  if (m.id === "duelos") return "noite";
  if (["torneio", "campeoes", "nacoes"].includes(m.id)) return "torneio";
  if (["equipes", "naumaquia"].includes(m.id)) return "equipes";
  if (["bigas", "cemportas"].includes(m.id)) return "corrida";
  return "atuacao";
}

// ---------- Disponibilidade ----------

export function modalityAvailable(s: GameState, id: string): boolean {
  const m = modality(id);
  if (m.requires.node && !s.nodes.includes(m.requires.node)) return false;
  for (const [b, lvl] of Object.entries(m.requires.infra ?? {})) if ((s.buildings[b] ?? 0) < lvl) return false;
  if (id === "exclusivo" && !s.custom) return false;
  return true;
}

export function modalityLock(s: GameState, id: string): string | null {
  const m = modality(id);
  if (m.requires.node && !s.nodes.includes(m.requires.node)) return "Desbloqueie na árvore de evolução";
  for (const [b, lvl] of Object.entries(m.requires.infra ?? {})) if ((s.buildings[b] ?? 0) < lvl) return `Construa: ${b} nível ${lvl}`;
  if (id === "exclusivo" && !s.custom) return "Crie o espetáculo no Ateliê";
  return null;
}

export function availableGladiators(s: GameState, exceptPlan?: string): Gladiator[] {
  const used = new Set(s.plans.filter((p) => p.id !== exceptPlan).flatMap((p) => p.gladiators));
  return s.gladiators.filter((g) => g.injuredWeeks === 0 && g.condition >= 20 && !used.has(g.id));
}

/** Problemas que impedem o evento (lista vazia = pode). */
export function planIssues(s: GameState, p: EventPlan): string[] {
  const out: string[] = [];
  const m = modality(p.modality);
  if (!modalityAvailable(s, p.modality)) out.push(modalityLock(s, p.modality) ?? "Modalidade bloqueada");
  const used = s.plans.filter((x) => x.id !== p.id && x.venue === p.venue).length;
  if (used >= slots(s, p.venue)) out.push("Este local já tem o máximo de eventos nesta semana");
  if (p.gladiators.length < m.minGladiators) out.push(`Escolha pelo menos ${m.minGladiators} gladiadores`);
  if (p.gladiators.length > m.maxGladiators) out.push(`No máximo ${m.maxGladiators} gladiadores`);
  const avail = new Set(availableGladiators(s, p.id).map((g) => g.id));
  for (const id of p.gladiators) if (!avail.has(id)) out.push(`${s.gladiators.find((g) => g.id === id)?.name ?? id} não está disponível`);
  if (p.capacity < 50 || p.capacity > capacity(s, p.venue)) out.push("Capacidade inválida");
  if (p.price <= 0) out.push("Defina um preço");
  if (p.mode === "roteirizado") {
    if (authority(s) < 2) out.push("Espetáculos roteirizados exigem o nível Magnata dos Espetáculos");
    if (!p.decree || !p.gladiators.includes(p.decree.winner)) out.push("Escolha quem vence no roteiro");
    if (p.decree && p.decree.twist !== "nenhuma" && authority(s) < 3) out.push("Reviravoltas exigem o nível Senhor das Arenas");
  }
  if (s.money - upfrontCost(s, p) < -creditLimit(s)) out.push("Dinheiro insuficiente para produzir o evento (nem com crédito)");
  return out;
}

/** Nível de autoridade calculado pela fama e pelo prestígio. */
export function authority(s: GameState): number {
  const score = s.fame + s.prestige * 3;
  return score >= 1000 ? 5 : score >= 600 ? 4 : score >= 300 ? 3 : score >= 120 ? 2 : 1;
}

/** Os banqueiros do Fórum adiantam a produção de eventos até este valor. */
export function creditLimit(s: GameState): number {
  return Math.round(2500 + s.fame * 15 + s.prestige * 40);
}

export function upfrontCost(s: GameState, p: EventPlan): number {
  const m = modality(p.modality);
  const prod = productionCost(s, m, p);
  const extras = p.extras.reduce((a, id) => a + (EXTRAS.find((e) => e.id === id)?.cost ?? 0), 0);
  return Math.round(prod + p.decoration + p.marketing + extras);
}

function productionCost(s: GameState, m: Modality, p: EventPlan): number {
  // Arenas maiores custam mais para encher de cenário, guardas e artistas
  let c = m.cost * p.days * Math.max(0.5, 1 + mods(s).upkeep * 0.5) * (1 + p.capacity / 4000);
  if (m.id === "exclusivo" && s.custom) {
    c += ATELIER.cenarios.find((x) => x.id === s.custom!.cenario)?.cost ?? 0;
    c += ATELIER.efeitos.find((x) => x.id === s.custom!.efeito)?.cost ?? 0;
  }
  if (p.venue !== "roma") c *= 1.2;
  return c;
}

// ---------- Demanda e satisfação ----------

function appeal(s: GameState, m: Modality, venue: string): number {
  const reg = region(venue);
  let a = m.appeal * (reg.likes[m.id] ?? reg.likes[m.specialties[0]] ?? 1);
  if (m.id === "exclusivo" && s.custom) {
    a += ATELIER.temas.find((x) => x.id === s.custom!.tema)?.appeal ?? 0;
    a += ATELIER.cenarios.find((x) => x.id === s.custom!.cenario)?.appeal ?? 0;
    a += ATELIER.efeitos.find((x) => x.id === s.custom!.efeito)?.appeal ?? 0;
  }
  if (m.original && s.nodes.includes("esp-vanguarda")) a *= 1.2;
  if (m.original && s.nodes.includes("esp-classico")) a *= 0.9;
  // Repetir a mesma modalidade cansa; estrear empolga
  const recent = s.reports.filter((r) => r.venue === venue).slice(0, 4).filter((r) => r.modality === m.id).length;
  a *= Math.max(0.68, 1 - recent * 0.08);
  if (!s.modalitiesDone.includes(m.id)) a *= 1.15;
  return a;
}

/** Atração das estrelas: média dos três mais famosos do evento. */
export function starPower(gs: Gladiator[]): number {
  const top = gs.map((g) => g.fame).sort((a, b) => b - a).slice(0, 3);
  const avg = top.reduce((a, b) => a + b, 0) / Math.max(1, top.length);
  return 1 + avg / 60 + gs.length * 0.03;
}

function rivalryPair(s: GameState, ids: string[]): boolean {
  if (!has(s, "rivalidades")) return false;
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (relationBetween(s, ids[i], ids[j])?.kind === "rivalidade") return true;
  return false;
}

/** Parte do público que fica com você quando o rival está na mesma região. */
export function playerShare(s: GameState, venue: string): number {
  const pop = venuePopularity(s, venue);
  let factor = 1;
  for (const rv of [s.rival, s.league]) {
    if (!rv || !rv.active || rv.defeated) continue;
    const rp = rv.regions[venue] ?? 0;
    if (rp <= 0) continue;
    const a = Math.pow(Math.max(1, pop), 1.4);
    const b = Math.pow(rp, 1.4);
    factor *= Math.min(1, 0.4 + 0.8 * (a / (a + b)));
  }
  return factor;
}

function demand(s: GameState, p: EventPlan, gs: Gladiator[]): number {
  const m = modality(p.modality);
  const reg = region(p.venue);
  const md = mods(s);
  const pop = venuePopularity(s, p.venue);
  let d = reg.population * 0.0035 * reg.interest * (0.12 + (pop / 100) * 0.9);
  d *= appeal(s, m, p.venue);
  d *= starPower(gs);
  if (rivalryPair(s, p.gladiators)) d *= 1.25;
  d *= 1 + 0.6 * (1 - Math.exp(-p.marketing / 1500)) * (1 + md.marketing);
  const ref = refPrice(s, p.venue, p.modality);
  d *= Math.min(2.2, Math.max(0.08, Math.pow(ref / p.price, 1.7)));
  d *= 1 + md.demand + (p.venue === "roma" ? buildingValue(s, "hospedagem") / 100 : md.regionDemand);
  d *= 1 + p.extras.reduce((a, id) => a + (EXTRAS.find((e) => e.id === id)?.demand ?? 0), 0);
  if (s.bets.markets.some((mk) => mk.eventId === p.id && mk.status === "aberto")) d *= 1 + (s.bets.popularity / 100) * 0.15;
  d *= playerShare(s, p.venue);
  return d;
}

function baseSatisfaction(s: GameState, p: EventPlan, gs: Gladiator[]): number {
  const m = modality(p.modality);
  const md = mods(s);
  let sat = 52;
  const avg = gs.reduce((a, g) => a + power(g, m), 0) / Math.max(1, gs.length);
  sat += (avg - 50) * 0.25;
  sat += Math.min(10, gs.reduce((a, g) => a + g.fame, 0) / 30);
  sat += 12 * (1 - Math.exp(-p.decoration / Math.max(200, m.cost * 1.5)));
  if (p.venue === "roma") sat += buildingValue(s, "iluminacao") + buildingValue(s, "som") + buildingValue(s, "tuneis");
  else sat += (s.branches.find((b) => b.region === p.venue)?.level ?? 1) * 2;
  sat += Math.min(10, (s.staff.organizadores ?? 0) * 1.5) * (0.5 + s.staffMorale / 200);
  sat += p.extras.reduce((a, id) => a + (EXTRAS.find((e) => e.id === id)?.satisfaction ?? 0), 0);
  sat += md.satisfaction;
  const ref = refPrice(s, p.venue, p.modality);
  if (p.price > ref * 1.2) sat -= (p.price / ref - 1.2) * 25;
  const recent = s.reports.filter((r) => r.venue === p.venue).slice(0, 3).filter((r) => r.modality === p.modality).length;
  sat -= recent * 4;
  const cond = gs.reduce((a, g) => a + g.condition, 0) / Math.max(1, gs.length);
  if (cond < 50) sat -= (50 - cond) * 0.2;
  if (s.bets.markets.some((mk) => mk.eventId === p.id) && s.bets.unlocked.includes("bn-telao")) sat += 4;
  if (s.nodes.includes("mkt-programas") && !s.modalitiesDone.includes(p.modality)) sat += 6;
  return sat;
}

// ---------- Combates ----------

interface SimResult {
  bouts: Bout[];
  winner: string | null;
  wins: Record<string, number>;
  ranking: string[];
}

function duel(a: Gladiator, b: Gladiator, m: Modality, r: () => number, forced?: string): Bout {
  const pa = power(a, m) + (r() - 0.5) * 2 * volatility(a);
  const pb = power(b, m) + (r() - 0.5) * 2 * volatility(b);
  let winner = pa >= pb ? a.id : b.id;
  if (forced === a.id || forced === b.id) winner = forced;
  const close = Math.abs(pa - pb) < 8;
  return { a: a.id, b: b.id, winner, close, note: close ? "Duelo apertado até o fim" : "Vitória clara" };
}

/** Simula os combates/provas de um evento. `forced` = vencedor roteirizado. */
export function simulate(gs: Gladiator[], m: Modality, r: () => number, forced?: string): SimResult {
  const bouts: Bout[] = [];
  const wins: Record<string, number> = {};
  const win = (id: string) => (wins[id] = (wins[id] ?? 0) + 1);
  const kind = boutKind(m);
  let winner: string | null = null;
  let ranking: string[] = [];
  const byId = new Map(gs.map((g) => [g.id, g]));
  if (kind === "duelo" || kind === "noite") {
    for (let i = 0; i + 1 < gs.length; i += 2) {
      const b = duel(gs[i], gs[i + 1], m, r, forced);
      bouts.push(b);
      win(b.winner);
    }
    ranking = [...gs].sort((x, y) => (wins[y.id] ?? 0) - (wins[x.id] ?? 0) || power(y, m) - power(x, m)).map((g) => g.id);
    winner = forced ?? ranking[0];
  } else if (kind === "torneio") {
    let round = [...gs];
    const out: string[] = [];
    while (round.length > 1) {
      const next: Gladiator[] = [];
      if (round.length % 2 === 1) next.push(round.shift()!);
      for (let i = 0; i < round.length; i += 2) {
        const b = duel(round[i], round[i + 1], m, r, forced);
        bouts.push(b);
        win(b.winner);
        next.push(byId.get(b.winner)!);
        out.unshift(b.winner === round[i].id ? round[i + 1].id : round[i].id);
      }
      round = next;
    }
    winner = round[0].id;
    ranking = [winner, ...out];
  } else if (kind === "equipes") {
    const half = Math.floor(gs.length / 2);
    const A = gs.slice(0, half);
    const B = gs.slice(half);
    let aw = 0;
    for (let i = 0; i < Math.min(A.length, B.length); i++) {
      const b = duel(A[i], B[i], m, r, forced);
      bouts.push(b);
      win(b.winner);
      if (b.winner === A[i].id) aw++;
    }
    const team = forced ? (A.some((g) => g.id === forced) ? A : B) : aw * 2 >= bouts.length ? A : B;
    ranking = [...team].sort((x, y) => (wins[y.id] ?? 0) - (wins[x.id] ?? 0)).map((g) => g.id);
    ranking.push(...gs.filter((g) => !team.includes(g)).map((g) => g.id));
    winner = forced ?? ranking[0];
  } else {
    // Corrida ou atuação: cada um faz sua prova; ganha a maior nota
    const scores = gs.map((g) => ({ id: g.id, v: power(g, m) + (r() - 0.5) * 2 * volatility(g) }));
    if (forced) scores.find((x) => x.id === forced)!.v += 1000;
    scores.sort((x, y) => y.v - x.v);
    ranking = scores.map((x) => x.id);
    winner = ranking[0];
    win(winner);
    for (let i = 0; i + 1 < scores.length && i < 3; i++) bouts.push({ a: scores[i].id, b: scores[i + 1].id, winner: scores[i].id, close: Math.abs(scores[i].v - scores[i + 1].v) < 6 && !forced, note: kind === "corrida" ? "Chegada" : "Aplausos" });
  }
  return { bouts, winner, wins, ranking };
}

/** Probabilidades por Monte Carlo (para o Arena Bets). */
export function monteCarlo(gs: Gladiator[], m: Modality, runs: number, seed: number) {
  const r = rngFrom(seed);
  const winners: Record<string, number> = {};
  const winCounts: Record<string, number[]> = {};
  const pairWins: Record<string, number> = {};
  for (let k = 0; k < runs; k++) {
    const sim = simulate(gs, m, r);
    if (sim.winner) winners[sim.winner] = (winners[sim.winner] ?? 0) + 1;
    for (const g of gs) (winCounts[g.id] ??= []).push(sim.wins[g.id] ?? 0);
    for (const b of sim.bouts) pairWins[`${b.a}|${b.b}|${b.winner}`] = (pairWins[`${b.a}|${b.b}|${b.winner}`] ?? 0) + 1;
  }
  return { winners, winCounts, pairWins, runs };
}

// ---------- Estimativa ----------

/** Procura esperada sem o teto da capacidade (usada pelos mercados de público). */
export function expectedDemand(s: GameState, p: EventPlan): { total: number; cap: number } {
  const gs = p.gladiators.map((id) => s.gladiators.find((g) => g.id === id)).filter(Boolean) as Gladiator[];
  const decay = p.days > 1 ? 1 - 0.15 * (p.days - 1) : 1;
  return { total: demand(s, p, gs) * p.days * decay, cap: p.capacity * p.days };
}

export function estimate(s: GameState, p: EventPlan): Estimate {
  const gs = p.gladiators.map((id) => s.gladiators.find((g) => g.id === id)).filter(Boolean) as Gladiator[];
  const m = modality(p.modality);
  const md = mods(s);
  const notes: string[] = [];
  const perDay = demand(s, p, gs);
  const decay = p.days > 1 ? 1 - 0.15 * (p.days - 1) : 1;
  const attendance = Math.round(Math.min(p.capacity * p.days, perDay * p.days * decay));
  let sat = baseSatisfaction(s, p, gs);
  if (p.mode === "roteirizado" && p.decree) sat += storyFit(s, p, p.decree);
  sat = Math.max(5, Math.min(100, sat));
  const tickets = attendance * p.price;
  const food = attendance * buildingFood(s, p.venue) * (1 + md.food);
  const commerce = attendance * buildingCommerce(s, p.venue) * (1 + md.commerce);
  const revenue = tickets + food + commerce + sponsorFor(s, attendance);
  const cost = upfrontCost(s, p) + Math.round(attendance * operationPerHead(s));
  if (perDay * decay > p.capacity) notes.push(`Procura maior que a capacidade: cerca de ${Math.round(perDay * decay - p.capacity)} pessoas por dia ficariam de fora. Suba o preço ou amplie a arquibancada.`);
  if (perDay * decay < p.capacity * 0.6) notes.push("Muitos lugares vazios: baixe o preço, invista em divulgação ou escolha gladiadores mais famosos.");
  const ref = refPrice(s, p.venue, p.modality);
  if (p.price > ref * 1.2) notes.push(`Preço acima do que o público acha justo (≈ ${ref}): satisfação cai.`);
  if (rivalryPair(s, p.gladiators)) notes.push("Confronto entre rivais: +25% de público.");
  if (!s.modalitiesDone.includes(p.modality)) notes.push(`Estreia da modalidade: público curioso e +${m.firstTimeEp} pontos de evolução.`);
  if (playerShare(s, p.venue) < 0.95) notes.push(`A concorrência leva parte do público aqui (${Math.round((1 - playerShare(s, p.venue)) * 100)}%).`);
  if (p.mode === "roteirizado") notes.push("Espetáculo roteirizado: resultado definido por você e anunciado como encenação. Não pode ter mercado de previsão.");
  return {
    attendance,
    satisfaction: Math.round(sat),
    revenue: Math.round(revenue),
    cost,
    profit: Math.round(revenue - cost),
    popularity: Math.round(popDelta(s, sat, p.venue) * 10) / 10,
    ep: Math.round(epFor(s, m, sat, attendance, false)),
    notes,
  };
}

/** Custo de operação por espectador (limpeza, guardas, água, porteiros). */
export function operationPerHead(s: GameState): number {
  return 0.5 + s.era * 0.35;
}

function buildingFood(s: GameState, venue: string): number {
  return venue === "roma" ? buildingValue(s, "restaurantes") : 0.4;
}
function buildingCommerce(s: GameState, venue: string): number {
  return venue === "roma" ? buildingValue(s, "comercio") + 0.05 : 0.2;
}
function sponsorFor(s: GameState, attendance: number): number {
  if (!has(s, "patrocinios")) return 0;
  return Math.round((attendance * 0.15 + s.prestige * 6) * (1 + mods(s).sponsor));
}

function popDelta(s: GameState, sat: number, venue: string): number {
  const pop = venuePopularity(s, venue);
  const md = mods(s);
  const raw = (sat - 50) / 5;
  return raw > 0 ? raw * (1 + md.popGain) * Math.max(0.1, 1 - pop / 100) : raw;
}

function epFor(s: GameState, m: Modality, sat: number, attendance: number, record: boolean): number {
  const md = mods(s);
  let ep = 1 + Math.max(0, sat - 50) / 15 + Math.sqrt(attendance) / 40 + (record ? 2 : 0);
  if (!s.modalitiesDone.includes(m.id)) ep += m.firstTimeEp + (s.nodes.includes("esp-vanguarda") && m.original ? 5 : 0);
  return ep * (1 + md.epGain);
}

/** Bônus de satisfação da história do Decreto (depende de rivalidades, novatos, campeões…). */
export function storyFit(s: GameState, p: EventPlan, d: Decree): number {
  const st = DECREE_STORIES.find((x) => x.id === d.story);
  if (!st) return 0;
  const gs = p.gladiators.map((id) => s.gladiators.find((g) => g.id === id)!).filter(Boolean);
  const winner = gs.find((g) => g.id === d.winner);
  let ok = true;
  if (st.needs === "rivalidade") ok = gs.some((g) => g.id !== d.winner && relationBetween(s, g.id, d.winner)?.kind === "rivalidade");
  if (st.needs === "amizade") ok = gs.some((g) => g.id !== d.winner && relationBetween(s, g.id, d.winner)?.kind === "amizade");
  if (st.needs === "desconhecido") ok = !!winner && winner.fame < 25 && gs.some((g) => g.fame > winner.fame + 20);
  if (st.needs === "campeao") ok = !!winner && gs.some((g) => g.id !== winner.id && g.fame > winner.fame + 15);
  let bonus = ok ? st.bonus : -4;
  bonus += d.twist === "final" ? 6 : d.twist === "meio" ? 4 : d.twist === "inicio" ? 2 : 0;
  if (s.arc && (d.winner === s.arc.hero || p.gladiators.includes(s.arc.villain))) bonus += 4;
  // O público gosta de encenação, mas cansa se tudo for roteiro
  const scriptedShare = s.stats.events ? s.stats.scripted / s.stats.events : 0;
  bonus -= Math.max(0, scriptedShare - 0.4) * 20;
  return bonus;
}

// ---------- Execução ----------

export function runEvent(s0: GameState, p: EventPlan): { state: GameState; report: EventReport } {
  const r = rngFrom(hash(`${s0.seed}:ev:${p.id}:${s0.week}`));
  const m = modality(p.modality);
  const md = mods(s0);
  const gs = p.gladiators.map((id) => s0.gladiators.find((g) => g.id === id)).filter(Boolean) as Gladiator[];
  const scripted = p.mode === "roteirizado" && !!p.decree;
  const sim = simulate(gs, m, r, scripted ? p.decree!.winner : undefined);

  // Público
  const perDay = demand(s0, p, gs) * (0.88 + r() * 0.24);
  const decay = p.days > 1 ? 1 - 0.15 * (p.days - 1) : 1;
  const attendance = Math.round(Math.min(p.capacity * p.days, perDay * p.days * decay));

  // Satisfação
  let sat = baseSatisfaction(s0, p, gs);
  const highlights: string[] = [];
  const injuries: string[] = [];
  if (scripted) {
    sat += storyFit(s0, p, p.decree!);
    const st = DECREE_STORIES.find((x) => x.id === p.decree!.story);
    highlights.push(`Roteiro: «${st?.name ?? "história própria"}» — vitória de ${gs.find((g) => g.id === p.decree!.winner)?.name}.`);
    if (p.decree!.twist !== "nenhuma") highlights.push(`Reviravolta ${p.decree!.twist === "final" ? "no último instante" : p.decree!.twist === "meio" ? "no meio do espetáculo" : "logo no começo"}.`);
    if (p.decree!.surprise) highlights.push(`Atuação surpreendente de ${gs.find((g) => g.id === p.decree!.surprise)?.name}.`);
  } else {
    const closes = sim.bouts.filter((b) => b.close).length;
    sat += Math.min(10, closes * 2.5);
    for (const b of sim.bouts) {
      const ga = gs.find((g) => g.id === b.a)!;
      const gb = gs.find((g) => g.id === b.b)!;
      const loser = b.winner === ga.id ? gb : ga;
      const won = b.winner === ga.id ? ga : gb;
      if (power(loser, m) > power(won, m) + 10) {
        sat += 3;
        highlights.push(`Zebra! ${won.name} venceu ${loser.name}.`);
      }
      if (has(s0, "rivalidades") && relationBetween(s0, ga.id, gb.id)?.kind === "rivalidade") {
        sat += 6;
        highlights.push(`O duelo de rivais ${ga.name} × ${gb.name} incendiou a arquibancada.`);
      }
    }
  }
  sat += (r() - 0.5) * 8;
  sat = Math.max(5, Math.min(100, sat));

  // Lesões e desgaste (sem descrições gráficas)
  const updated = new Map<string, Gladiator>();
  const baseFame = (1 + Math.log2(Math.max(1, attendance / 250))) * 1.2 * (sat / 70) * (1 + md.gladiatorFame);
  for (const g0 of gs) {
    const g = { ...g0, history: [...g0.history] };
    const won = sim.winner === g.id;
    g.condition = Math.max(0, Math.round(g.condition - m.fatigue * (1.2 - g.stamina / 250) * p.days));
    const injury = m.danger * Math.max(0.2, 1 + md.injury) * (1.5 - g.condition / 100);
    if (r() < injury) {
      g.injuredWeeks = 1 + Math.floor(r() * 3);
      injuries.push(g.name);
    }
    let fameGain = baseFame * (won ? 1.6 : 0.6) * (0.6 + g.charisma / 125) * Math.max(0.08, 1 - g.fame / 110);
    if (scripted) fameGain = Math.max(0, (p.decree!.fame[g.id] ?? 0) + baseFame * 0.4);
    if (s0.bets.markets.some((mk) => mk.eventId === p.id) && s0.bets.unlocked.includes("bg-fas")) fameGain *= 1.1;
    if (s0.bets.unlocked.includes("bg-revelacoes") && g.fame < 30 && s0.bets.markets.some((mk) => mk.eventId === p.id)) fameGain *= 2;
    g.fame = Math.min(100, Math.round((g.fame + fameGain) * 10) / 10);
    g.popularity = Math.min(100, Math.round(g.popularity + fameGain * 0.8 + (sat - 60) / 15));
    g.xp += 10 + (sim.wins[g.id] ?? 0) * 5;
    g.events++;
    g.wins += sim.wins[g.id] ?? 0;
    g.losses += sim.bouts.filter((b) => (b.a === g.id || b.b === g.id) && b.winner !== g.id).length;
    g.morale = Math.max(0, Math.min(100, g.morale + (won ? 6 : -2)));
    if (won) g.history = [`Semana ${s0.week}: venceu ${p.name}${scripted ? " (roteirizado)" : ""}.`, ...g.history].slice(0, 20);
    updated.set(g.id, g);
  }

  // Relações: confrontos diretos e rivalidades que nascem na arena
  let relations = [...s0.relations];
  for (const b of sim.bouts) {
    const rel = relations.find((x) => (x.a === b.a && x.b === b.b) || (x.a === b.b && x.b === b.a));
    if (rel) {
      const idx = relations.indexOf(rel);
      relations[idx] = { ...rel, aWins: rel.aWins + (b.winner === rel.a ? 1 : 0), bWins: rel.bWins + (b.winner === rel.b ? 1 : 0), intensity: Math.min(100, rel.intensity + 5) };
    } else if (!scripted && b.close && r() < 0.25) {
      const ga = updated.get(b.a)!;
      const gb = updated.get(b.b)!;
      const kind = ga.personality === "leal" || gb.personality === "leal" ? "amizade" : "rivalidade";
      relations.push({ a: b.a, b: b.b, kind, intensity: 40, aWins: b.winner === b.a ? 1 : 0, bWins: b.winner === b.b ? 1 : 0, story: kind === "rivalidade" ? `${ga.name} e ${gb.name} saíram da arena trocando provocações.` : `${ga.name} e ${gb.name} se respeitaram tanto que viraram amigos.` });
      highlights.push(kind === "rivalidade" ? `Nasce uma rivalidade: ${ga.name} × ${gb.name}.` : `Nasce uma amizade: ${ga.name} e ${gb.name}.`);
    }
  }

  // Dinheiro
  const tickets = attendance * p.price;
  const food = attendance * buildingFood(s0, p.venue) * (1 + md.food);
  const commerce = attendance * buildingCommerce(s0, p.venue) * (1 + md.commerce);
  const sponsor = sponsorFor(s0, attendance);
  const extrasCost = p.extras.reduce((a, id) => a + (EXTRAS.find((e) => e.id === id)?.cost ?? 0), 0);
  const production = productionCost(s0, m, p);
  const medical = injuries.length * 150;
  const revenue = { tickets: Math.round(tickets), food: Math.round(food), commerce: Math.round(commerce), sponsor };
  const costs = { production: Math.round(production + attendance * operationPerHead(s0)), decoration: p.decoration, marketing: p.marketing, extras: extrasCost, medical };
  const profit = Object.values(revenue).reduce((a, b) => a + b, 0) - Object.values(costs).reduce((a, b) => a + b, 0);

  // Reputação
  const record = attendance > s0.records.attendance;
  const popGain = popDelta(s0, sat, p.venue);
  const regionFactor = p.venue === "roma" ? 1 : 1.2;
  const fameGain = ((3 + 1.5 * Math.log2(Math.max(1, attendance / 250))) * (sat / 70) * (1 + md.fameGain) * regionFactor + m.prestige * 0.3) / (1 + s0.fame / 110);
  const authFactor = scripted ? 0.6 : 0.6 + s0.authenticity / 250;
  const prestigeGain = Math.max(0, (m.prestige * 0.3 * (sat / 80) * (1 + md.prestigeGain) * authFactor + (p.venue === "roma" ? buildingValue(s0, "camarotes") / 100 : 0)) / (1 + s0.prestige / 60));
  const ep = epFor(s0, m, sat, attendance, record);

  let s: GameState = {
    ...s0,
    gladiators: s0.gladiators.map((g) => updated.get(g.id) ?? g),
    relations,
    money: s0.money + profit,
    fame: Math.round((s0.fame + fameGain) * 10) / 10,
    prestige: Math.round((s0.prestige + prestigeGain) * 10) / 10,
    ep: s0.ep + Math.round(ep),
    satisfaction: Math.round(s0.satisfaction * 0.7 + sat * 0.3),
    authenticity: scripted ? Math.max(0, s0.authenticity - 3) : Math.min(100, s0.authenticity + 1),
    modalitiesDone: s0.modalitiesDone.includes(m.id) ? s0.modalitiesDone : [...s0.modalitiesDone, m.id],
    records: { attendance: Math.max(s0.records.attendance, attendance), revenue: Math.max(s0.records.revenue, profit), satisfaction: Math.max(s0.records.satisfaction, Math.round(sat)) },
    stats: { ...s0.stats, events: s0.stats.events + 1, scripted: s0.stats.scripted + (scripted ? 1 : 0), free: s0.stats.free + (scripted ? 0 : 1), spectators: s0.stats.spectators + attendance, revenue: s0.stats.revenue + Object.values(revenue).reduce((a, b) => a + b, 0), totalEp: s0.stats.totalEp + Math.round(ep) },
  };
  if (p.venue === "roma") s.popularity = Math.max(0, Math.min(100, Math.round((s.popularity + popGain) * 10) / 10));
  else s.branches = s.branches.map((b) => (b.region === p.venue ? { ...b, popularity: Math.max(0, Math.min(100, Math.round((b.popularity + popGain) * 10) / 10)), lastEventWeek: s0.week } : b));

  const report: EventReport = {
    id: p.id,
    week: s0.week,
    name: p.name,
    modality: m.id,
    venue: p.venue,
    mode: scripted ? "roteirizado" : "livre",
    attendance,
    capacity: p.capacity * p.days,
    satisfaction: Math.round(sat),
    revenue,
    costs,
    profit: Math.round(profit),
    popularity: Math.round(popGain * 10) / 10,
    fame: Math.round(fameGain * 10) / 10,
    prestige: Math.round(prestigeGain * 10) / 10,
    ep: Math.round(ep),
    bouts: sim.bouts,
    winner: sim.winner,
    ranking: sim.ranking,
    wins: sim.wins,
    injuries,
    highlights: highlights.slice(0, 6),
    record,
  };
  s = { ...s, reports: [report, ...s.reports].slice(0, 60) };
  const wn = gs.find((g) => g.id === sim.winner)?.name;
  s = log(s, `${p.name}${scripted ? " [ROTEIRIZADO]" : ""}: ${attendance.toLocaleString("pt-BR")} pessoas, ${Math.round(sat)}% de satisfação, lucro de ${Math.round(profit).toLocaleString("pt-BR")}.${wn ? ` Destaque: ${wn}.` : ""}`, "evento");
  return { state: s, report };
}

/** Nome sugerido para um evento. */
export function suggestName(s: GameState, modalityId: string, venue: string): string {
  const m = modality(modalityId);
  const place = venue === "roma" ? "de Roma" : `da ${region(venue).name}`;
  const n = s.reports.filter((r) => r.modality === modalityId).length + 1;
  return `${m.name} ${place}${n > 1 ? ` nº ${n}` : ""}`;
}

export function allModalities() {
  return MODALITIES;
}
