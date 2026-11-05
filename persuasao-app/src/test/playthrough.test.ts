// Joga a história inteira só com as funções do jogo, como um jogador atento faria:
// viaja, conversa, usa necessidades descobertas, aprende habilidades, resolve casos e dorme.
import { expect, it } from "vitest";
import { MISSIONS, PERKS, character } from "../content";
import { optionsFor } from "../core/encounter";
import {
  anyMission,
  answer,
  buy,
  cashOut,
  lootOptions,
  useConsumable,
  districtUnlocked,
  endDay,
  finishEncounter,
  makeOffer,
  newGame,
  missionAvailable,
  perkAvailable,
  playerCtx,
  say,
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
  while (!s.ending && days < 100) {
    days++;
    // Habilidades e ferramentas: primeiro o que o capítulo e os bairros pedem
    for (const p of PERK_ORDER) if (perkAvailable(s, p)) s = takePerk(s, p);
    for (const l of [...s.loot]) {
      const o = lootOptions(s, l);
      s = o.use?.ok && s.heat < 60 ? cashOut(s, l.id, "usar") : cashOut(s, l.id, "vender");
    }
    for (const it of ["chip", "caderno", "leitor", "cracha", "kit-clone", "notebook", "identidade", "convite", "laranjas", "advogado", "site", "cartao", "camisa", "terno"]) if (!s.items.includes(it) && s.money > (it === "laranjas" ? 4300 : 600)) s = buy(s, it);
    if (s.heat > 60 && s.money > 300) s = useConsumable(buy(s, "sumico"), "sumico");
    if (s.heat > 70) {
      s = endDay(s);
      continue;
    }
    // Missões da história e do capítulo, por bairro
    let guard = 0;
    while (s.energy >= 15 && s.minute < 20 * 60 && s.heat < 75 && guard++ < 12) {
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
  console.log(`Final «${s.ending?.id}» no dia ${s.day}: capítulo ${s.chapter}, ${s.stats.deals} golpes, ₢ ${s.money}, calor ${s.heat}, prisões ${s.arrests}, xp ${s.xp}, ferramentas ${s.items.join(",")}`);
  expect(s.ending).not.toBeNull();
  expect(s.chapter).toBe(5);
  expect(s.day).toBeLessThan(85);
  expect(s.ending?.id).not.toBe("preso");
  void PERKS;
});
