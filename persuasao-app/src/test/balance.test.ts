import { expect, it } from "vitest";
import { MISSIONS, character } from "../content";
import { choose, newRelationship, optionsFor, startEncounter, persuasionScore, resultOf, type PlayerCtx } from "../core/encounter";

const ALL_FLAGS = ["caderno-valdir", "sentinela", "estudo-mariana", "conceicao-salva", "diego-testemunha", "contrato-celina", "otavio-colabora"];
const ctxFor = (ch: number): PlayerCtx => {
  const skill: PlayerCtx["skill"] = ch >= 3 ? { explain: 0.5, evidence: 0.5, reframe: 0.5, empathy: 0.5, question: 0.3 } : ch >= 2 ? { explain: 0.5, evidence: 0.5, reframe: 0.5 } : {};
  if (ch >= 4) Object.assign(skill, { authority: 0.6, socialProof: 0.6, honesty: 0.6 });
  return { name: "Alex", perks: [], skill, items: [], startMods: ch >= 3 ? { credibility: 9 } : ch >= 2 ? { credibility: 5 } : {}, energy: 80, reputation: [5, 20, 45, 75, 110][ch - 1], socialClass: 2, hour: 12, worldMood: 0, relationship: newRelationship(), worldFlags: ALL_FLAGS.slice(0, ch + 1) };
};

type Strat = (opts: ReturnType<typeof optionsFor>, turn: number, r: () => number, st?: { patience: number }) => string;
const strategies: Record<string, Strat> = {
  aleatorio: (o, _t, r) => o.filter((x) => x.tactic !== "leave")[Math.floor(r() * (o.length - 1))].id,
  pressao: (o) => (o.find((x) => ["pressure", "urgency", "bluff"].includes(x.tactic)) ?? o.find((x) => x.tactic === "close") ?? o[0]).id,
  primeira: (o) => o[0].id,
  esperto: (o, t, _r, st) => {
    if (t >= 6 || (st && st.patience < 22 && t >= 2)) return (o.find((x) => x.tactic === "close") ?? o[0]).id;
    const pref = ["question", "explain", "empathy", "evidence", "reframe", "concession", "honesty", "rapport"];
    const ins = o.find((x) => x.insight);
    if (ins) return ins.id;
    for (const p of pref) { const f = o.find((x) => x.tactic === p && !x.bluff); if (f) return f.id; }
    return o[0].id;
  },
};

function run(m: (typeof MISSIONS)[number], strat: Strat, seeds = 40) {
  const c = character(m.npc);
  const outs: Record<string, number> = {};
  for (let seed = 1; seed <= seeds; seed++) {
    const ctx = () => ctxFor(m.chapter ?? 1);
    let s = startEncounter(m, c, ctx(), seed);
    let r = seed * 7;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let t = 0; t < 14 && s.status === "active"; t++) {
      if (s.pending) { s = { ...s, pending: null }; continue; }
      if (s.counter) { s = { ...s, counter: null, status: "done", outcome: "partial" }; break; }
      s = choose(s, strat(optionsFor(s, m, c, ctx()), t, rnd, s.attrs), m, c, ctx());
    }
    const o = s.status === "active" ? "timeout" : s.outcome!;
    outs[o] = (outs[o] ?? 0) + 1;
  }
  return outs;
}
const ok = (o: Record<string, number>) => (o.great ?? 0) + (o.good ?? 0) + (o.partial ?? 0);
const win = (o: Record<string, number>) => (o.great ?? 0) + (o.good ?? 0);

it("jogar com atenção funciona em todas as missões", () => {
  for (const m of MISSIONS) {
    const o = run(m, strategies.esperto);
    expect(ok(o), `${m.id} ${JSON.stringify(o)}`).toBeGreaterThanOrEqual(28);
  }
});

it("pressão e blefe não são uma estratégia vencedora", () => {
  let wins = 0, total = 0;
  for (const m of MISSIONS) { const o = run(m, strategies.pressao, 20); wins += win(o); total += 20; }
  expect(wins / total).toBeLessThan(0.15);
});

it("escolher sempre a mesma opção não vence", () => {
  let wins = 0, total = 0;
  for (const m of MISSIONS) { const o = run(m, strategies.primeira, 20); wins += win(o); total += 20; }
  expect(wins / total).toBeLessThan(0.5);
});

it("jogar com atenção vence mais que pressionar", () => {
  let a = 0, b = 0;
  for (const m of MISSIONS) { a += win(run(m, strategies.esperto, 20)); b += win(run(m, strategies.pressao, 20)); }
  expect(a).toBeGreaterThan(b * 3);
});

void persuasionScore; void resultOf;
