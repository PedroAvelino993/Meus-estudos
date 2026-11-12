// IA da Dominus Arena (e da Liga das Arenas Livres): dinheiro, estádio, gladiadores,
// estratégias, eventos, propostas por suas estrelas, contratos, votos imperiais,
// jogos internacionais e expansão pelo mundo.

import type { Gladiator, RivalState } from "./types";
import type { GameState } from "./state";
import { log, nextId } from "./state";
import { has, mods } from "./economy";
import { marketValue, power, signingFee } from "./gladiators";
import { CHARACTERS, fromCharacter, generateGladiator } from "../content/gladiators";
import { MODALITIES, REGIONS, modality } from "../content/world";
import { pickOne } from "./rng";

const STRATEGY_LABEL: Record<RivalState["strategy"], string> = {
  agressiva: "Agressiva — preços baixos e ataques às suas estrelas",
  estrelas: "Estrelas — compra os gladiadores mais famosos",
  marketing: "Marketing — cartazes por toda Roma",
  expansao: "Expansão — abre arenas nas províncias",
  inovacao: "Inovação — copia e melhora suas modalidades",
};

export function strategyLabel(st: RivalState["strategy"]) {
  return STRATEGY_LABEL[st];
}

export function rivalStrength(rv: RivalState): number {
  return rv.gladiators.reduce((a, g) => a + g.fame, 0);
}

function rlog(rv: RivalState, week: number, text: string): RivalState {
  return { ...rv, lastAction: text, log: [`Semana ${week}: ${text}`, ...rv.log].slice(0, 40) };
}

/** A Dominus Arena entra em cena no começo da Era 2. */
export function activateRival(s0: GameState, r: () => number): GameState {
  let s = s0;
  const glads: Gladiator[] = [];
  for (let i = 0; i < 4; i++) {
    const [s2, id] = nextId(s, "rg");
    s = s2;
    const g = generateGladiator(id, r, 0.35, 2);
    g.fame = Math.round(15 + r() * 25);
    glads.push(g);
  }
  const brennus = CHARACTERS.find((c) => c.id === "brennus")!;
  if (!s.gladiators.some((g) => g.id === "brennus") && !s.market.some((g) => g.id === "brennus")) glads.push(fromCharacter(brennus));
  const rival: RivalState = {
    ...s.rival,
    active: true,
    money: 15000,
    fame: Math.round(s.fame * 0.8),
    capacity: 2000,
    tech: 2,
    gladiators: glads,
    regions: { roma: Math.max(12, Math.round(s.popularity * 0.6)) },
    strategy: "estrelas",
    favor: 35,
    betsParticipants: 0,
  };
  s = { ...s, rival: rlog(rival, s.week, "A Dominus Arena abre as portas do outro lado do Tibre."), market: s.market.filter((g) => g.id !== "brennus") };
  return log(s, "Um rival surge: a DOMINUS ARENA, de um comerciante rico que quer tomar o seu público.", "rival");
}

function chooseStrategy(s: GameState, rv: RivalState, r: () => number): RivalState["strategy"] {
  const behindPop = (rv.regions.roma ?? 0) < s.popularity - 10;
  const rich = rv.money > 40000;
  const opts: RivalState["strategy"][] = [];
  if (behindPop) opts.push("agressiva", "marketing");
  if (rich) opts.push("estrelas", "expansao");
  if (s.modalitiesDone.length > 5) opts.push("inovacao");
  if (s.branches.length > rv.gladiators.length / 3) opts.push("expansao");
  if (!opts.length) opts.push("estrelas", "marketing", "agressiva");
  return pickOne(opts, r);
}

/** Uma semana de decisões de um rival (Dominus ou Liga). */
function rivalWeek(s0: GameState, key: "rival" | "league", r: () => number): GameState {
  let s = s0;
  let rv: RivalState = { ...(s[key] as RivalState) };
  if (!rv.active || rv.defeated) return s;
  const md = mods(s);
  const isLeague = key === "league";
  const name = rv.name;

  // Estratégia muda a cada 6 semanas
  if (s.week % 6 === 0) {
    const st = chooseStrategy(s, rv, r);
    if (st !== rv.strategy) rv = rlog({ ...rv, strategy: st }, s.week, `Muda de estratégia: ${STRATEGY_LABEL[st].split(" — ")[0]}.`);
  }

  // Evento semanal do rival em Roma
  const romaPop = rv.regions.roma ?? 0;
  const star = rv.gladiators.reduce((a, g) => a + Math.pow(g.fame, 1.1), 0) / 220;
  const att = Math.round(Math.min(rv.capacity, (1000000 * 0.0035) * (0.12 + (romaPop / 100) * 0.9) * (1 + star) * (1 + rv.tech * 0.08) * (0.85 + r() * 0.3)));
  const income = att * (2.5 + rv.tech * 0.6) * (rv.strategy === "agressiva" ? 0.7 : 1) + Object.keys(rv.regions).length * 400 * (isLeague ? 3 : 1) + s.era * 1500 * (rv.momentum ?? 1);
  const expenses = rv.gladiators.reduce((a, g) => a + g.salary, 0) + rv.capacity * 0.25 + rv.tech * 80;
  rv.money = Math.round(rv.money + income - expenses + (isLeague ? 3000 : 0));
  const mName = pickOne(MODALITIES.filter((m) => m.prestige <= rv.tech * 2 + 2), r).name;
  if (r() < 0.5) rv = rlog(rv, s.week, `${mName} com ${att.toLocaleString("pt-BR")} pessoas.`);

  // Fama: cresce com eventos e persegue a sua, puxada pelo ímpeto (o rival não fica para trás à toa)
  const mom = rv.momentum ?? 1;
  const target = s.fame * mom * (0.55 + 0.07 * s.era) * (isLeague ? 1.15 : 1);
  rv.fame = Math.max(0, Math.round((rv.fame + (1 + Math.log2(Math.max(1, att / 250))) / (1 + rv.fame / 150) + (target - rv.fame) * 0.05) * 10) / 10);

  // Popularidade em Roma: caminha para a fatia que a fama e o ímpeto justificam
  const boost = rv.strategy === "marketing" ? 1.15 : rv.strategy === "agressiva" ? 1.1 : 1;
  const popTarget = Math.min(95, (100 * rv.fame) / Math.max(1, rv.fame + s.fame) * mom * boost);
  let dPop = (popTarget - romaPop) * 0.1;
  if (dPop > 0) dPop *= 1 - Math.min(0.6, md.rivalResist * 0.6);
  rv.regions = { ...rv.regions, roma: Math.max(0, Math.min(100, Math.round((romaPop + dPop) * 10) / 10)) };

  // Ímpeto: liderança em Roma alimenta; espetáculos excelentes do jogador desgastam
  const recent = s.reports.slice(0, 4);
  const avgSat = recent.length ? recent.reduce((a, x) => a + x.satisfaction, 0) / recent.length : 50;
  let dm = ((rv.regions.roma ?? 0) > s.popularity ? 0.012 : -0.008) + (1 - mom) * 0.012;
  if (rv.strategy === "marketing") dm += 0.004;
  if (avgSat > 80) dm -= 0.008;
  rv.momentum = Math.max(0.2, Math.min(1.6, Math.round((mom + dm) * 1000) / 1000));
  // Reação: quando perde força, a Dominus gasta pesado num grande espetáculo
  if ((rv.momentum ?? 1) < 0.8 && rv.money > 30000 && s.week - (rv.reactionWeek ?? -99) >= 6 && r() < 0.4) {
    const spend = Math.round(rv.money * 0.4);
    rv.money -= spend;
    rv.reactionWeek = s.week;
    rv.momentum = Math.min(1.6, (rv.momentum ?? 1) + 0.06 + Math.min(0.06, spend / 1000000));
    rv.regions = { ...rv.regions, roma: Math.min(100, (rv.regions.roma ?? 0) + 6) };
    rv = rlog(rv, s.week, `${isLeague ? "Jogos da Liga" : "Jogos Dominus"}: gasta ${spend.toLocaleString("pt-BR")} num espetáculo gigante.`);
    s = log(s, `${name} gastou uma fortuna num espetáculo gigante para recuperar o público.`, "rival");
  }

  // Investimentos: estádio e tecnologia
  if (rv.money > rv.capacity * 6 && rv.capacity < 60000 && r() < 0.35) {
    rv.money -= rv.capacity * 4;
    rv.capacity = Math.round(rv.capacity * 1.5);
    rv = rlog(rv, s.week, `Amplia o estádio para ${rv.capacity.toLocaleString("pt-BR")} lugares.`);
  }
  if ((rv.strategy === "inovacao" || r() < 0.08) && rv.money > 8000 * rv.tech && rv.tech < 12) {
    rv.money -= 6000 * rv.tech;
    rv.tech++;
    rv = rlog(rv, s.week, `Investe em novos espetáculos (tecnologia ${rv.tech}).`);
  }

  // Contratações: estrelas do mercado (o jogador vê o interesse e pode se antecipar)
  if (!isLeague) {
    const interest = { ...s.rivalInterest };
    for (const [gid, wk] of Object.entries(interest)) {
      if (wk > s.week) continue;
      const g = s.market.find((x) => x.id === gid);
      delete interest[gid];
      if (g && rv.money > signingFee(g)) {
        rv.money -= signingFee(g);
        rv.gladiators = [...rv.gladiators, g];
        s = { ...s, market: s.market.filter((x) => x.id !== gid) };
        rv = rlog(rv, s.week, `Contrata ${g.name}, que estava no mercado.`);
        if (g.fame >= 40) s = { ...s, flags: [...s.flags, "rival-contratou"] };
      }
    }
    const want = s.market.filter((g) => g.fame >= 30 && !interest[g.id]).sort((a, b) => b.fame - a.fame)[0];
    if (want && (rv.strategy === "estrelas" || r() < 0.3) && rv.money > signingFee(want) * 1.2) {
      interest[want.id] = s.week + 2;
      s = log(s, `${name} está de olho em ${want.name} (mercado). Contrate antes da semana ${s.week + 2} — com o rival interessado, a luva sobe 30%.`, "rival");
    }
    s = { ...s, rivalInterest: interest };
  } else if (r() < 0.25 && rv.money > 20000) {
    const [s2, id] = nextId(s, "lg");
    s = s2;
    const g = generateGladiator(id, r, 0.7, s.era);
    g.fame = Math.round(40 + r() * 40);
    rv.gladiators = [...rv.gladiators, g];
    rv.money -= 12000;
    rv = rlog(rv, s.week, `Recruta ${g.name} para a Liga.`);
  }

  // Propostas pelas suas estrelas
  const resist = Math.min(0.8, md.rivalResist);
  const aggressive = rv.strategy === "agressiva" || rv.strategy === "estrelas" || isLeague;
  const target2 = [...s.gladiators].filter((g) => g.fame >= 35 && !s.offers.some((o) => o.gladiator === g.id)).sort((a, b) => b.fame - a.fame)[0];
  if (target2 && aggressive && r() < 0.12 * (1 - resist) && rv.money > marketValue(target2) * 0.6) {
    const [s2, oid] = nextId(s, "of");
    s = s2;
    const amount = Math.round(marketValue(target2) * 0.5);
    s = { ...s, offers: [...s.offers, { id: oid, gladiator: target2.id, amount, deadline: s.week + 2 }] };
    s = log(s, `${name} ofereceu um contrato milionário a ${target2.name}. Cubra a proposta (${amount.toLocaleString("pt-BR")}) ou ele pode ir embora.`, "rival");
  }

  // Expansão pelo mundo
  if (s.era >= 3 && (rv.strategy === "expansao" || isLeague) && rv.money > 30000) {
    const free = REGIONS.filter((x) => x.id !== "roma" && x.era <= s.era && !(x.id in rv.regions));
    if (free.length) {
      const reg = pickOne(free, r);
      rv.money -= 25000;
      rv.regions = { ...rv.regions, [reg.id]: 15 };
      rv = rlog(rv, s.week, `Abre uma arena em ${reg.name}.`);
      s = log(s, `${name} abriu uma arena em ${reg.name}.`, "rival");
    }
  }
  // Popularidade nas províncias
  for (const [id, pop] of Object.entries(rv.regions)) {
    if (id === "roma") continue;
    const mine = s.branches.find((b) => b.region === id)?.popularity ?? 0;
    rv.regions[id] = Math.max(0, Math.min(100, Math.round((pop + 0.9 - (mine - pop) / 40) * 10) / 10));
  }

  // Treino e fama dos gladiadores do rival
  rv.gladiators = rv.gladiators.map((g) => ({ ...g, fame: Math.min(100, Math.round((g.fame + 0.3 + r() * 0.6) * 10) / 10), technique: Math.min(100, g.technique + (r() < 0.3 ? 1 : 0)) }));
  rv.favor = Math.max(0, Math.min(100, rv.favor + (rv.fame > s.fame ? 0.5 : -0.2)));

  if (rv.money < -20000) {
    rv = rlog({ ...rv, money: 0, capacity: Math.round(rv.capacity * 0.7) }, s.week, "Dívidas: vende parte do estádio.");
  }
  return { ...s, [key]: rv };
}

export function weeklyRivals(s0: GameState, r: () => number): GameState {
  let s = rivalWeek(s0, "rival", r);
  if (s.league) s = rivalWeek(s, "league", r);
  s = expireOffers(s, r);
  s = contestWeek(s, r);
  s = dominanceCheck(s);
  return s;
}

// ---------- Propostas ----------

export function matchOffer(s0: GameState, offerId: string): GameState {
  const o = s0.offers.find((x) => x.id === offerId);
  if (!o || s0.money < o.amount) return s0;
  const g = s0.gladiators.find((x) => x.id === o.gladiator);
  const s = {
    ...s0,
    money: s0.money - o.amount,
    offers: s0.offers.filter((x) => x.id !== offerId),
    gladiators: s0.gladiators.map((x) => (x.id === o.gladiator ? { ...x, morale: Math.min(100, x.morale + 25), salary: Math.round(x.salary * 1.15) } : x)),
  };
  return log(s, `Você cobriu a proposta: ${g?.name} fica no Coliseu, mais motivado.`, "gladiador");
}

/** Deixa o gladiador ir — recebe metade do valor como multa de transferência. */
export function acceptOffer(s0: GameState, offerId: string): GameState {
  const o = s0.offers.find((x) => x.id === offerId);
  if (!o) return s0;
  const g = s0.gladiators.find((x) => x.id === o.gladiator);
  if (!g || s0.gladiators.length <= 2) return { ...s0, offers: s0.offers.filter((x) => x.id !== offerId) };
  return transfer({ ...s0, money: s0.money + Math.round(o.amount * 0.5), offers: s0.offers.filter((x) => x.id !== offerId) }, g, true);
}

function transfer(s0: GameState, g: Gladiator, paid: boolean): GameState {
  let s: GameState = {
    ...s0,
    gladiators: s0.gladiators.filter((x) => x.id !== g.id),
    plans: s0.plans.map((p) => ({ ...p, gladiators: p.gladiators.filter((x) => x !== g.id) })),
    rival: { ...bump(s0.rival, 0.05), gladiators: [...s0.rival.gladiators, g], regions: { ...s0.rival.regions, roma: Math.min(100, (s0.rival.regions.roma ?? 0) + g.fame / 10) } },
    flags: [...s0.flags, "rival-contratou"],
  };
  s = log(s, paid ? `${g.name} foi para a ${s.rival.name}. Você recebeu a multa de transferência.` : `${g.name} aceitou a proposta e foi para a ${s.rival.name}!`, "rival");
  return s;
}

function expireOffers(s0: GameState, r: () => number): GameState {
  let s = s0;
  for (const o of s0.offers) {
    if (o.deadline > s.week) continue;
    s = { ...s, offers: s.offers.filter((x) => x.id !== o.id) };
    const g = s.gladiators.find((x) => x.id === o.gladiator);
    if (!g) continue;
    const stay = g.personality === "leal" ? 0.85 : g.personality === "ambicioso" ? 0.2 : 0.45 + g.morale / 250;
    if (r() > stay && s.gladiators.length > 2) s = transfer(s, g, false);
    else s = log(s, `${g.name} recusou a proposta do rival e ficou.`, "gladiador");
  }
  return s;
}

// ---------- Contratos, voto imperial e jogos internacionais ----------

const SPONSORS = ["Azeites Bética", "Vinhos do Vesúvio", "Tecidos de Tiro", "Garum Pompeiano", "Mármores de Carrara", "Especiarias de Alexandria", "Cavalos da Numídia", "Vidros de Sídon"];

function contestWeek(s0: GameState, r: () => number): GameState {
  let s = s0;
  if (!s.rival.active) return s;
  // Novas disputas de contrato a cada 5 semanas
  if (s.week % 5 === 0 && s.bids.length < 2) {
    const [s2, id] = nextId(s, "bid");
    s = s2;
    const weekly = Math.round((200 + s.fame * 3) * (0.8 + r() * 0.5) / 10) * 10;
    const bid = { id, name: `${pickOne(SPONSORS, r)} (fictícia)`, weekly, weeks: 12, deadline: s.week + 2, player: 0, rival: Math.round(weekly * (2 + r() * 3)) };
    s = { ...s, bids: [...s.bids, bid] };
    s = log(s, `Disputa de patrocínio: ${bid.name} oferece ${weekly}/semana por 12 semanas. A ${s.rival.name} também quer.`, "rival");
  }
  // Resolve disputas vencidas
  for (const b of s.bids.filter((x) => x.deadline <= s.week)) {
    const mine = s.popularity * 40 + s.prestige * 30 + b.player;
    const theirs = (s.rival.regions.roma ?? 0) * 40 + s.rival.fame * 8 + b.rival;
    s = { ...s, bids: s.bids.filter((x) => x.id !== b.id) };
    if (mine >= theirs) {
      s = { ...s, contracts: [...s.contracts, { id: b.id, name: b.name, weekly: b.weekly, weeksLeft: b.weeks }], rival: bump(s.rival, -0.05) };
      s = log(s, `Contrato conquistado: ${b.name} (${b.weekly}/semana).`, "economia");
    } else {
      s = { ...s, rival: bump({ ...s.rival, money: s.rival.money + b.weekly * 6 }, 0.04) };
      s = log(s, `A ${s.rival.name} ficou com o contrato de ${b.name}.`, "rival");
    }
  }
  // Voto imperial a cada 8 semanas
  if (s.week % 8 === 0) {
    const last = s.reports.slice(0, 4);
    const avgSat = last.length ? last.reduce((a, x) => a + x.satisfaction, 0) / last.length : 40;
    const mine = s.favor + s.prestige * 0.4 + avgSat * 0.3 + r() * 10;
    const theirs = s.rival.favor + s.rival.fame * 0.08 + 18 + r() * 10;
    if (mine >= theirs) {
      s = { ...s, favor: Math.min(100, s.favor + 6), prestige: s.prestige + 3, ep: s.ep + 2, rival: bump(s.rival, -0.08) };
      s = log(s, "Reconhecimento imperial: o imperador declarou o seu Coliseu o melhor espetáculo da temporada.", "rival");
    } else {
      s = { ...s, favor: Math.max(0, s.favor - 4), rival: bump({ ...s.rival, favor: Math.min(100, s.rival.favor + 6), fame: s.rival.fame + 10 }, 0.08) };
      s = log(s, `Reconhecimento imperial: o imperador preferiu a ${s.rival.name} nesta temporada.`, "rival");
    }
  }
  // Jogos internacionais
  if (has(s, "internacional")) {
    if (!s.international && s.week % 10 === 5) {
      const mods = ["torneio", "duelos", "demonstracao", "bigas", "historica"].filter((m) => m !== "bigas" || s.nodes.includes("esp-bigas"));
      const cities = ["Atenas", "Alexandria", "Cartago", "Antioquia", "Corinto", "Pérgamo"];
      s = { ...s, international: { week: s.week + 3, modality: pickOne(mods, r), city: pickOne(cities, r), champion: null } };
      s = log(s, `Jogos internacionais em ${s.international!.city} na semana ${s.week + 3}. Escolha seu campeão na Central Imperial.`, "mundo");
    } else if (s.international && s.international.week <= s.week) s = resolveInternational(s, r);
  }
  return s;
}

export function setChampion(s: GameState, id: string): GameState {
  if (!s.international || !s.gladiators.some((g) => g.id === id)) return s;
  return { ...s, international: { ...s.international, champion: id } };
}

function resolveInternational(s0: GameState, r: () => number): GameState {
  const it = s0.international!;
  const m = modality(it.modality);
  let s: GameState = { ...s0, international: null, stats: { ...s0.stats, internationals: s0.stats.internationals + 1 } };
  const champ = s.gladiators.find((g) => g.id === it.champion) ?? [...s.gladiators].filter((g) => g.injuredWeeks === 0).sort((a, b) => power(b, m) - power(a, m))[0];
  if (!champ) return s;
  const foreign = 45 + s.era * 8;
  const rivalBest = [...s.rival.gladiators].sort((a, b) => power(b, m) - power(a, m))[0];
  const me = power(champ, m) + (r() - 0.5) * 30;
  const them = Math.max(foreign + (r() - 0.5) * 30, rivalBest ? power(rivalBest, m) + (r() - 0.5) * 30 : 0);
  if (me >= them) {
    s = {
      ...s,
      fame: s.fame + 15,
      prestige: s.prestige + 4,
      ep: s.ep + 4,
      stats: { ...s.stats, internationalWins: s.stats.internationalWins + 1 },
      gladiators: s.gladiators.map((g) => (g.id === champ.id ? { ...g, fame: Math.min(100, g.fame + 10), history: [`Semana ${s0.week}: campeão dos jogos de ${it.city}.`, ...g.history].slice(0, 20) } : g)),
      rival: bump({ ...s.rival, fame: Math.max(0, s.rival.fame - 8) }, -0.06),
    };
    return log(s, `${champ.name} venceu os jogos internacionais de ${it.city}! Fama mundial em alta.`, "mundo");
  }
  s = { ...s, fame: s.fame + 6, rival: { ...s.rival, fame: s.rival.fame + (rivalBest && them > foreign ? 15 : 0) } };
  return log(s, `${champ.name} lutou bem em ${it.city}, mas não venceu.${rivalBest && them > foreign ? ` O campeão foi ${rivalBest.name}, da ${s.rival.name}.` : ""}`, "mundo");
}

export function raiseBid(s0: GameState, bidId: string, amount: number): GameState {
  if (amount <= 0 || s0.money < amount) return s0;
  if (!s0.bids.some((b) => b.id === bidId)) return s0;
  return { ...s0, money: s0.money - amount, bids: s0.bids.map((b) => (b.id === bidId ? { ...b, player: b.player + amount } : b)) };
}

export function bidChance(s: GameState, bidId: string): number {
  const b = s.bids.find((x) => x.id === bidId);
  if (!b) return 0;
  const mine = s.popularity * 40 + s.prestige * 30 + b.player;
  const theirs = (s.rival.regions.roma ?? 0) * 40 + s.rival.fame * 8 + b.rival;
  return Math.max(0, Math.min(1, 0.5 + (mine - theirs) / Math.max(800, theirs)));
}

function bump(rv: RivalState, d: number): RivalState {
  return { ...rv, momentum: Math.max(0.2, Math.min(1.6, Math.round(((rv.momentum ?? 1) + d) * 1000) / 1000)) };
}

export type Opponent = "rival" | "league";

export function campaignCost(s: GameState, who: Opponent = "rival"): number {
  const rv = s[who];
  return Math.round(3000 + s.fame * 12 + (rv?.fame ?? 0) * 25);
}

export function campaignIssue(s: GameState, who: Opponent = "rival"): string | null {
  const rv = s[who];
  if (!rv || !rv.active || rv.defeated) return "Não há rival ativo";
  if (rv.campaignWeek && s.week - rv.campaignWeek < 4) return `Nova campanha na semana ${rv.campaignWeek + 4}`;
  if (s.money < campaignCost(s, who)) return "Dinheiro insuficiente";
  return null;
}

/** Campanha publicitária contra um rival: tira público e ímpeto dele. */
export function rivalCampaign(s0: GameState, who: Opponent = "rival"): GameState {
  if (campaignIssue(s0, who)) return s0;
  const rv = bump(s0[who]!, -0.05);
  const s = { ...s0, money: s0.money - campaignCost(s0, who), popularity: Math.min(100, s0.popularity + 2), [who]: { ...rv, campaignWeek: s0.week, regions: { ...rv.regions, roma: Math.max(0, (rv.regions.roma ?? 0) - 4) } } };
  return log(s, `Campanha por toda Roma: "O verdadeiro espetáculo está no ${s0.name}". A ${rv.name} sente o golpe.`, "rival");
}

// ---------- Domínio ----------

function dominanceCheck(s0: GameState): GameState {
  let s = s0;
  for (const who of ["rival", "league"] as Opponent[]) {
    const rv = s[who];
    if (!rv || !rv.active || rv.defeated) continue;
    const roma = rv.regions.roma ?? 0;
    const crushed = (rv.momentum ?? 1) < 0.4 && roma < 10;
    const dominant = roma > s.popularity + 25 || rv.fame > s.fame * 1.5;
    const superior = s.fame >= rv.fame * 1.5 && s.popularity >= roma + 30;
    const weeksDominant = dominant ? rv.weeksDominant + 1 : Math.max(0, rv.weeksDominant - 1);
    const crushedKey = who === "rival" ? "rivalDominance" : "leagueCrushed";
    const crushedWeeks = crushed ? s.stats[crushedKey] + 1 : 0;
    const supKey = who === "rival" ? "superiorWeeks" : "leagueSuperior";
    const sup = superior ? s.stats[supKey] + 1 : s.stats[supKey];
    s = { ...s, [who]: { ...rv, weeksDominant }, stats: { ...s.stats, [crushedKey]: crushedWeeks, [supKey]: sup } };
    if (who === "rival" && crushedWeeks >= 8) {
      s = { ...s, rival: { ...s.rival, defeated: true, active: false, regions: {} }, prestige: s.prestige + 10, ep: s.ep + 10, achievements: { ...s.achievements, "rival-vencido": s.week } };
      s = log(s, "A DOMINUS ARENA fechou as portas! Os gladiadores dela estão no mercado.", "rival");
      s = { ...s, market: [...s.market, ...rv.gladiators.slice(0, 3)] };
    }
    if (who === "league" && (crushedWeeks >= 8 || sup >= 20)) {
      s = { ...s, league: { ...s.league!, defeated: true, active: false, regions: {} }, prestige: s.prestige + 15, ep: s.ep + 10, achievements: { ...s.achievements, liga: s.week } };
      s = log(s, "A Liga das Arenas Livres se desfez. Você é a maior organização de espetáculos do mundo.", "rival");
    }
  }
  return s;
}

/** Cria a Liga quando o jogador escolhe enfrentar a rebelião. */
export function createLeague(s: GameState, r: () => number): GameState {
  const glads: Gladiator[] = [];
  let st = s;
  for (let i = 0; i < 6; i++) {
    const [s2, id] = nextId(st, "lg");
    st = s2;
    const g = generateGladiator(id, r, 0.8, s.era);
    g.fame = Math.round(45 + r() * 40);
    glads.push(g);
  }
  const regions: Record<string, number> = { roma: 30 };
  for (const b of s.branches) regions[b.region] = 35;
  const league: RivalState = { active: true, name: "Liga das Arenas Livres", money: 150000, fame: Math.round(s.fame * 0.9), capacity: 12000, tech: 6, gladiators: glads, regions, strategy: "agressiva", lastAction: "A Liga declara guerra de espetáculos.", log: [], betsParticipants: 0, favor: 50, coalition: true, weeksDominant: 0 };
  return { ...st, league };
}
