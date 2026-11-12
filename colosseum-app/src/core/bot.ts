// Jogador automático usado nos testes de progressão (do início à vitória).

import type { GameState } from "./state";
import { weekRng } from "./state";
import { capacity, slots } from "./economy";
import { authority, availableGladiators, estimate, planIssues } from "./events";
import { build, buildIssue, buildMonument, monumentIssue, setStaff, staffIssue, toggleManager, managerIssue } from "./build";
import { hire, setFocus, signingFee, raiseSalary, fairSalary } from "./gladiators";
import { bestPrice, draftPlan, fitGladiators, savePlan, setCustom } from "./plans";
import { unlock, unlockIssue } from "./tree";
import { expand, expandIssue, toggleDelegate, upgradeBranch, upgradeIssue } from "./world";
import { advanceWeek, blockers, continueInfinite } from "./turn";
import { choiceIssue, crisisById, resolveCrisis } from "./crises";
import { acceptOffer, campaignIssue, matchOffer, raiseBid, rivalCampaign, setChampion } from "./rival";
import { betsOpen, createMarket, marketIssue } from "./bets";
import { MODALITIES, REGIONS, modality } from "../content/world";
import { BETS_TREE, TREE } from "../content/tree";
import { power } from "./gladiators";

const NODE_PRIORITY = ["mkt-cartazes", "esp-duelos", "eco-bilheteria", "inf-restaurantes", "inf-iluminacao", "mkt-recompensas", "esp-torneios", "inf-arquibancada", "gla-treino", "gla-olheiros", "mkt-pregoeiros", "eco-precos", "esp-coreografia", "pre-senado", "mkt-comemorativos", "gla-carisma", "gla-rivalidades", "esp-historica", "esp-bestas", "inf-som", "mkt-celebridades", "mkt-patrocinios", "eco-contratos", "inf-camarotes", "esp-equipes", "pre-convites", "pre-titulos", "pre-imperial", "eco-alimentacao", "inf-tuneis", "inf-comercio", "inf-festivais", "esp-festivais", "esp-noturnos", "inf-secundaria", "gla-medicos", "gla-estrelato", "eco-investimento", "inf-aquatica", "esp-aquaticos", "mkt-regioes", "eco-banco", "pre-governantes", "pre-internacional", "pre-aliancas", "gla-provincias", "gla-lendas", "esp-vanguarda", "inf-hospedagem", "inf-treino", "esp-cemportas", "esp-naumaquia", "gla-idolos", "pre-monumentos", "inf-mega", "esp-campeoes", "esp-elementos", "esp-nacoes", "esp-exclusivos", "pre-favor", "pre-historia", "inf-maravilha"];

const BUILD_PRIORITY = ["arquibancada", "restaurantes", "iluminacao", "som", "comercio", "camarotes", "treino", "secundaria", "tuneis", "festival", "aquatica", "hospedagem", "pista"];

export interface BotOptions {
  /** 0 = joga de forma cuidadosa; 1 = mais agressiva. */
  style?: number;
  scripted?: boolean;
}

export function botTurn(s0: GameState, opt: BotOptions = {}): GameState {
  let s = s0;
  const r = weekRng(s, "bot");
  if (s.victory && !s.infinite) return continueInfinite(s);
  // Crises: a melhor escolha que dá para pagar (heurística simples)
  for (const id of s.pendingCrises) {
    const c = crisisById(id);
    let best = -1;
    let bestScore = -Infinity;
    c.choices.forEach((ch, i) => {
      if (choiceIssue(s, ch)) return;
      const e = ch.effect;
      const score = (e.popularity ?? 0) * 3 + (e.prestige ?? 0) * 4 + (e.favor ?? 0) * 1.5 + (e.fame ?? 0) + (e.satisfaction ?? 0) * 2 + (e.money ?? 0) / 300 - (ch.cost ?? 0) / (s.money > 20000 ? 1500 : 400) + (e.staffMorale ?? 0) / 3 + (e.rivalPop ?? 0) * -1.5 + (c.quest && i === 0 ? 8 : 0) + (ch.flag === "rebeliao-guerra" ? 5 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    s = resolveCrisis(s, id, Math.max(0, best), r);
  }
  // Propostas do rival
  for (const o of s.offers) s = s.money > o.amount * 2 ? matchOffer(s, o.id) : acceptOffer(s, o.id);
  if (!campaignIssue(s) && s.money > 25000) s = rivalCampaign(s);
  if (!campaignIssue(s, "league") && s.money > 25000) s = rivalCampaign(s, "league");
  for (const b of s.bids) if (s.money > 20000 && b.player === 0) s = raiseBid(s, b.id, Math.round(b.weekly * 3));
  if (s.international && !s.international.champion) {
    const m = modality(s.international.modality);
    const best = [...s.gladiators].sort((a, b) => power(b, m) - power(a, m))[0];
    if (best) s = setChampion(s, best.id);
  }
  // Evolução
  for (let k = 0; k < 4; k++) {
    const id = NODE_PRIORITY.find((n) => !unlockIssue(s, n)) ?? TREE.find((n) => !unlockIssue(s, n.id) && !n.excludes)?.id;
    if (!id) break;
    s = unlock(s, id);
  }
  for (const n of BETS_TREE) if (!unlockIssue(s, n.id)) s = unlock(s, n.id);
  if (s.nodes.includes("esp-exclusivos") && !s.custom) s = setCustom(s, "Sonho de Roma", "mitologia", "templo", "fogos");
  // Gerentes
  for (const id of ["diretor", "tesoureiro", "governador", "pregoeiro"]) if (!s.managers.includes(id) && !managerIssue(s, id) && s.money > 15000) s = toggleManager(s, id);
  // Funcionários
  for (const [id, max] of [["organizadores", 6], ["vendedores", 8], ["tratadores", 4], ["administradores", 4], ["olheiros", 2], ["segurancas", 3]] as const) {
    if ((s.staff[id] ?? 0) < Math.min(max, 1 + s.era) && !staffIssue(s, id, 1) && s.money > 3000) s = setStaff(s, id, 1);
  }
  // Construção: amplia quando a procura passa da capacidade
  const reserve = 1500 + s.era * 2500;
  const crowded = s.reports.slice(0, 3).some((x) => x.venue === "roma" && x.attendance >= x.capacity * 0.95);
  for (const id of BUILD_PRIORITY) {
    if (id === "arquibancada" && !crowded && s.era < 3) continue;
    if (!buildIssue(s, id) && s.money - (s.buildings[id] !== undefined ? 0 : 0) > reserve + 0) {
      const before = s.money;
      s = build(s, id);
      if (s.money !== before) break;
    }
  }
  if (!monumentIssue(s) && s.money > 60000) s = buildMonument(s);
  // Expansão
  for (const reg of REGIONS) if (!expandIssue(s, reg.id) && s.money > reserve * 2) s = expand(s, reg.id);
  for (const b of s.branches) if (!upgradeIssue(s, b.region) && s.money > reserve * 3) s = upgradeBranch(s, b.region);
  for (const b of s.branches) if (!b.delegated && s.managers.includes("governador")) s = toggleDelegate(s, b.region);
  // Contratações
  const roster = s.gladiators.length;
  const target = 4 + s.era * 2;
  if (roster < target) {
    const cand = [...s.market].filter((g) => signingFee(g) < s.money * 0.4).sort((a, b) => b.fame + b.strength + b.technique - (a.fame + a.strength + a.technique))[0];
    if (cand) s = hire(s, cand.id);
  }
  for (const g of s.gladiators) {
    if (g.salary < fairSalary(g) * 0.75 && s.money > 5000) s = raiseSalary(s, g.id);
    if (g.condition < 45 && g.focus !== "descanso") s = setFocus(s, g.id, "descanso");
    else if (g.condition > 80 && g.focus === "descanso") s = setFocus(s, g.id, g.specialty === "espetaculo" ? "carisma" : "tecnica");
  }
  // Eventos
  const venues = ["roma", ...s.branches.filter((b) => !b.delegated).map((b) => b.region)];
  for (const v of venues) {
    for (let k = 0; k < slots(s, v); k++) {
      if (s.plans.filter((p) => p.venue === v).length >= slots(s, v)) break;
      if (availableGladiators(s).length < 2) break;
      let best: ReturnType<typeof draftPlan>[1] | null = null;
      let bestProfit = -Infinity;
      for (const m of MODALITIES) {
        const [s2, p0] = draftPlan(s, v, m.id);
        if (p0.modality !== m.id) continue;
        let p = fitGladiators(s2, p0);
        p = { ...p, capacity: capacity(s2, v), price: bestPrice(s2, p) };
        if (planIssues(s2, p).length) continue;
        const e = estimate(s2, p);
        const score = e.profit + e.ep * 250 + e.satisfaction * 10;
        if (score > bestProfit) {
          bestProfit = score;
          best = p;
        }
      }
      if (best && (bestProfit > -500 || s.money > 10000)) {
        if (opt.scripted && authority(s) >= 2 && r() < 0.15 && best.gladiators.length >= 2) {
          best = { ...best, mode: "roteirizado", decree: { winner: best.gladiators[best.gladiators.length - 1], twist: "nenhuma", story: "gloria", fame: {} } };
          if (planIssues(s, best).length) best = { ...best, mode: "livre", decree: undefined };
        }
        s = savePlan(s, best);
      }
    }
  }
  // Arena Bets
  if (betsOpen(s)) {
    for (const p of s.plans.filter((x) => x.mode === "livre")) {
      if (!marketIssue(s, { type: "vencedor", eventId: p.id })) s = createMarket(s, { type: "vencedor", eventId: p.id });
    }
    if (!marketIssue(s, { type: "popular" })) s = createMarket(s, { type: "popular" });
  }
  return s;
}

export function playWeeks(s0: GameState, weeks: number, opt: BotOptions = {}, onWeek?: (s: GameState) => void): GameState {
  let s = s0;
  for (let i = 0; i < weeks; i++) {
    s = botTurn(s, opt);
    if (blockers(s).length) {
      if (s.defeat) return s;
      if (s.pendingCrises.length) continue;
    }
    s = advanceWeek(s);
    onWeek?.(s);
    if (s.defeat || (s.victory && !s.infinite)) return s;
  }
  return s;
}
