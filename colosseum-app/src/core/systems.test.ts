import { describe, expect, it } from "vitest";
import type { GameState } from "./state";
import { migrate, newGame } from "./state";
import { estimate, planIssues, runEvent, simulate } from "./events";
import { draftPlan, fitGladiators, removePlan, savePlan } from "./plans";
import { unlock, unlockIssue } from "./tree";
import { build, buildIssue } from "./build";
import { advanceWeek, blockers } from "./turn";
import { createMarket, marketIssue, publishOdds } from "./bets";
import { expandIssue } from "./world";
import { resolveCrisis } from "./crises";
import { hire } from "./gladiators";
import { playWeeks } from "./bot";
import { modality } from "../content/world";
import { rngFrom } from "./rng";

const fresh = () => newGame("Teste", 42);

function withPlan(s0: GameState, mode: "livre" | "roteirizado" = "livre"): GameState {
  const [s1, p0] = draftPlan(s0, "roma", "demonstracao");
  const p = fitGladiators(s1, p0);
  const plan = mode === "roteirizado" ? { ...p, mode, decree: { winner: p.gladiators[1], twist: "nenhuma" as const, story: "gloria", fame: {} } } : p;
  return savePlan(s1, plan);
}

/** Estado com autoridade alta (Magnata) para testar Decreto e Arena Bets. */
function magnate(): GameState {
  return { ...fresh(), fame: 200, prestige: 20, era: 2 };
}

describe("começo da campanha", () => {
  it("arena de 500 lugares, 3 gladiadores desconhecidos, dinheiro inicial", () => {
    const s = fresh();
    expect(s.gladiators).toHaveLength(3);
    expect(s.gladiators.every((g) => g.fame <= 18)).toBe(true);
    expect(s.money).toBe(4000);
    expect(s.buildings.arquibancada).toBe(0);
  });
});

describe("eventos", () => {
  it("estimativa e resultado ficam próximos", () => {
    const s = withPlan(fresh());
    const p = s.plans[0];
    const e = estimate(s, p);
    const { report } = runEvent(s, p);
    expect(Math.abs(report.attendance - e.attendance)).toBeLessThanOrEqual(e.attendance * 0.2);
    expect(report.winner).toBeTruthy();
  });

  it("preço abusivo derruba a satisfação", () => {
    const s = withPlan(fresh());
    const p = s.plans[0];
    expect(estimate(s, { ...p, price: p.price * 4 }).satisfaction).toBeLessThan(estimate(s, p).satisfaction);
  });

  it("roteirizado exige autoridade e respeita o vencedor escolhido", () => {
    const s0 = fresh();
    const [s1, p] = draftPlan(s0, "roma", "demonstracao");
    const scripted = { ...p, mode: "roteirizado" as const, decree: { winner: p.gladiators[1], twist: "nenhuma" as const, story: "gloria", fame: {} } };
    expect(planIssues(s1, scripted).some((x) => x.includes("Magnata"))).toBe(true);
    const m = magnate();
    const s2 = withPlan(m, "roteirizado");
    const plan = s2.plans[0];
    for (let i = 0; i < 5; i++) {
      const { report } = runEvent({ ...s2, week: s2.week + i }, plan);
      expect(report.winner).toBe(plan.decree!.winner);
      expect(report.mode).toBe("roteirizado");
    }
  });

  it("simulação livre não é determinística para gladiadores parecidos", () => {
    const s = fresh();
    const m = modality("demonstracao");
    const r = rngFrom(7);
    const winners = new Set<string>();
    for (let i = 0; i < 60; i++) winners.add(simulate([s.gladiators[0], s.gladiators[1]], m, r).winner!);
    expect(winners.size).toBe(2);
  });
});

describe("Arena Bets (fichas fictícias)", () => {
  it("espetáculo roteirizado nunca recebe mercado", () => {
    const s = withPlan(magnate(), "roteirizado");
    const issue = marketIssue(s, { type: "vencedor", eventId: s.plans[0].id });
    expect(issue).toMatch(/roteirizados não podem/);
    expect(createMarket(s, { type: "vencedor", eventId: s.plans[0].id })).toBe(s);
  });

  it("mercado livre: probabilidades somam 1 e o resultado vem do evento", () => {
    let s = withPlan(magnate());
    s = createMarket(s, { type: "vencedor", eventId: s.plans[0].id });
    const m = s.bets.markets[0];
    expect(m.options.reduce((a, o) => a + o.model, 0)).toBeCloseTo(1, 5);
    expect(m.options.reduce((a, o) => a + o.chips, 0)).toBeGreaterThan(0);
    s = advanceWeek(s);
    const done = s.bets.markets.find((x) => x.id === m.id)!;
    expect(done.status).toBe("resolvido");
    const report = s.reports[0];
    expect(done.result).toContain(s.gladiators.find((g) => g.id === report.winner)!.name);
  });

  it("probabilidades publicadas são normalizadas e marcadas como próprias", () => {
    let s = withPlan(magnate());
    s = createMarket(s, { type: "vencedor", eventId: s.plans[0].id });
    const id = s.bets.markets[0].id;
    s = publishOdds(s, id, [0.9, 0.3]);
    const m = s.bets.markets[0];
    expect(m.custom).toBe(true);
    expect(m.options.reduce((a, o) => a + o.published, 0)).toBeCloseTo(1, 5);
  });

  it("virar roteirizado cancela o mercado e devolve as fichas", () => {
    let s = withPlan(magnate());
    s = createMarket(s, { type: "vencedor", eventId: s.plans[0].id });
    const p = s.plans[0];
    s = savePlan(s, { ...p, mode: "roteirizado", decree: { winner: p.gladiators[0], twist: "nenhuma", story: "gloria", fame: {} } });
    expect(s.bets.markets[0].status).toBe("cancelado");
    s = removePlan(s, p.id);
    expect(s.plans).toHaveLength(0);
  });

  it("não existe dinheiro real: o estado do mercado só tem fichas", () => {
    const keys = Object.keys(magnate().bets);
    expect(keys.some((k) => /deposit|saque|withdraw|pagamento|cash/i.test(k))).toBe(false);
  });
});

describe("árvore e construção", () => {
  it("pré-requisitos, custo e caminhos exclusivos", () => {
    let s = { ...fresh(), ep: 100, era: 3 };
    expect(unlockIssue(s, "esp-torneios")).toMatch(/Exige/);
    s = unlock(s, "esp-duelos");
    s = unlock(s, "esp-torneios");
    expect(s.nodes).toContain("esp-torneios");
    s = unlock(unlock(unlock(s, "gla-treino"), "gla-medicos"), "gla-disciplina");
    expect(unlockIssue(s, "gla-estrelato")).toMatch(/Caminho fechado/);
  });

  it("construção cobra e exige era", () => {
    let s = { ...fresh(), money: 100000 };
    s = build(s, "arquibancada");
    expect(s.buildings.arquibancada).toBe(1);
    expect(buildIssue(s, "arquibancada")).toMatch(/Era 2/);
  });

  it("expansão fica bloqueada no começo", () => {
    expect(expandIssue(fresh(), "grecia")).toMatch(/Era/);
  });
});

describe("crises, rival e derrota", () => {
  it("crise bloqueia o avanço até ser resolvida", () => {
    let s = { ...fresh(), pendingCrises: ["tempestade"] };
    expect(blockers(s).length).toBeGreaterThan(0);
    expect(advanceWeek(s)).toBe(s);
    s = resolveCrisis(s, "tempestade", 1, rngFrom(1));
    expect(s.pendingCrises).toHaveLength(0);
  });

  it("quem não faz nada perde a campanha", () => {
    let s = fresh();
    for (let i = 0; i < 40 && !s.defeat; i++) {
      s = { ...s, pendingCrises: [] };
      s = advanceWeek(s);
    }
    expect(s.defeat).not.toBeNull();
  });

  it("a Dominus Arena surge na Era 2 e disputa o público", () => {
    const s = playWeeks(fresh(), 30);
    expect(s.era).toBeGreaterThanOrEqual(2);
    expect(s.rival.active || s.rival.defeated).toBe(true);
    expect(s.rival.gladiators.length).toBeGreaterThan(0);
  });
});

describe("salvamento", () => {
  it("migrate preenche campos novos de saves antigos", () => {
    const s = fresh();
    const old = JSON.parse(JSON.stringify(s));
    delete old.bids;
    delete old.bets.history;
    delete old.stats.superiorWeeks;
    const m = migrate(old)!;
    expect(m.bids).toEqual([]);
    expect(m.bets.history).toEqual([]);
    expect(m.stats.superiorWeeks).toBe(0);
    expect(m.week).toBe(s.week);
  });

  it("contratar exige dinheiro", () => {
    const s = { ...fresh(), money: 0 };
    expect(hire(s, s.market[0].id)).toBe(s);
  });
});
