// Joga a história inteira só com as funções do jogo, como um jogador atento faria:
// viaja, conversa, usa necessidades descobertas, aprende habilidades, resolve casos e dorme.
import { expect, it } from "vitest";
import { MISSIONS, PERKS, character } from "../content";
import { CASES } from "../content/story";
import { optionsFor } from "../core/encounter";
import {
  anyMission,
  answer,
  buy,
  caseAvailable,
  districtUnlocked,
  endDay,
  finishEncounter,
  makeOffer,
  newGame,
  missionAvailable,
  perkAvailable,
  playerCtx,
  say,
  solveCase,
  startMission,
  takeCounter,
  takePerk,
  travel,
  type GameState,
} from "../core/game";

function converse(s0: GameState, id: string): GameState {
  let s = startMission(s0, id);
  if (!s.encounter) return s0;
  for (let i = 0; i < 25 && s.encounter!.status === "active"; i++) {
    const e = s.encounter!;
    const m = anyMission(s, e.missionId);
    if (e.pending) {
      const idx = Math.max(0, e.pending.options.findIndex((o) => o.kind === "honest"));
      s = answer(s, idx);
    } else if (e.counter) {
      const n = m.negotiation;
      if (n && e.counter.price !== undefined && i < 14) {
        const target = n.npcSells ? Math.min(n.clientLimit, Math.round((e.counter.price + n.limit) / 2)) : Math.max(n.clientLimit, Math.round((e.counter.price + n.limit) / 2));
        const before = s.encounter!.log.length;
        s = makeOffer(s, target);
        if (s.encounter!.log.length === before) s = takeCounter(s);
      } else s = takeCounter(s);
      if (s.encounter!.counter && s.encounter!.status === "active") s = takeCounter(s);
    } else {
      const opts = optionsFor(e, m, character(m.npc), playerCtx(s, m.npc));
      const pick =
        opts.find((o) => o.insight && !o.bluff) ??
        (i >= 6 || (e.attrs.patience < 24 && i >= 2) ? opts.find((o) => o.tactic === "close") : undefined) ??
        opts.find((o) => o.id === "u-question") ??
        opts.find((o) => ["explain", "evidence", "empathy", "reframe", "honesty", "concession"].includes(o.tactic) && !o.bluff && !o.contradicts) ??
        opts.find((o) => o.tactic === "close") ??
        opts[0];
      s = say(s, pick.id);
    }
  }
  return s.encounter?.status === "done" ? finishEncounter(s) : s;
}

it("é possível jogar do começo ao fim da história", () => {
  let s: GameState = newGame("Alex", 0, 12345);
  const PERK_ORDER = ["olho-clinico", "argumentacao", "empatia", "calma", "leitura-fria", "oratoria", "bom-papo", "memoria", "fechador", "presenca", "intuicao", "negociador"];
  let days = 0;
  while (!s.ending && days < 90) {
    days++;
    // Habilidades e itens úteis
    for (const p of PERK_ORDER) if (perkAvailable(s, p)) s = takePerk(s, p);
    for (const it of ["caderno", "cartao", "passe", "camisa", "terno"]) if (!s.items.includes(it) && s.money > 400) s = buy(s, it);
    for (const c of CASES) if (caseAvailable(s, c.id) && !s.cases[c.id]?.done) s = solveCase(s, c.id, c.items.filter((i) => i.suspicious).map((i) => i.id), c.question.answer).state;
    // Missões da história e do capítulo, por bairro
    let guard = 0;
    while (s.energy >= 15 && s.minute < 20 * 60 && guard++ < 12) {
      const next = MISSIONS.filter((m) => missionAvailable(s, m) && districtUnlocked(s, m.district)).sort((a, b) => Number(!!b.story) - Number(!!a.story) || (a.chapter ?? 0) - (b.chapter ?? 0))[0];
      if (next) {
        if (s.location !== next.district) s = travel(s, next.district);
        if (s.location !== next.district) break;
        const before = s;
        s = converse(s, next.id);
        if (s === before) break;
      } else {
        const g = s.gigs.find((x) => !x.done && districtUnlocked(s, character(x.char).district));
        if (!g) break;
        if (s.location !== character(g.char).district) s = travel(s, character(g.char).district);
        const before = s;
        s = converse(s, `gig:${g.template}:${g.char}:${s.day}`);
        if (s === before) break;
      }
    }
    s = endDay(s);
  }
  console.log(`Final «${s.ending?.id}» no dia ${s.day}: capítulo ${s.chapter}, ${s.stats.deals} acordos, ₢ ${s.money}, rep ${s.rep}, xp ${s.xp}, perks ${s.perks.length}`);
  expect(s.ending).not.toBeNull();
  expect(s.chapter).toBe(5);
  expect(s.day).toBeLessThan(80);
  void PERKS;
});
