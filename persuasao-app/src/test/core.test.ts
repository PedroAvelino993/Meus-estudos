import { beforeEach, describe, expect, it } from "vitest";
import { CHARACTERS, DISTRICTS, ITEMS, MISSIONS, PERKS, character, mission } from "../content";
import { CHAPTERS, CHALLENGES, EVENTS, GIGS } from "../content/story";
import { ATTRS, type Mission } from "../core/types";
import { acceptablePrice, answerSide, choose, newRelationship, offer, optionsFor, persuasionScore, resultOf, startEncounter, type PlayerCtx } from "../core/encounter";
import { tacticEffect } from "../core/persona";
import {
  arrest,
  buy,
  cashOut,
  heatFactor,
  lootOptions,
  canStart,
  chapterGoal,
  claimChallenge,
  challengesToday,
  districtUnlocked,
  endDay,
  equip,
  finishEncounter,
  levelOf,
  migrate,
  missionAvailable,
  newGame,
  perkAvailable,
  RENT,
  say,
  startMission,
  takePerk,
  travel,
  useConsumable,
  xpForLevel,
  type GameState,
} from "../core/game";
import { ACHIEVEMENTS, checkAchievements } from "../core/achievements";
import { makeGig, makeVisit } from "../core/generated";
import { exportSave, importSave, load, save, slotInfo } from "../store";

const ctx = (over: Partial<PlayerCtx> = {}): PlayerCtx => ({
  name: "Alex",
  perks: [],
  skill: {},
  items: [],
  startMods: {},
  energy: 100,
  reputation: 20,
  socialClass: 2,
  hour: 12,
  worldMood: 0,
  relationship: newRelationship(),
  worldFlags: [],
  ...over,
});

// ---------- Conteúdo ----------

describe("conteúdo", () => {
  it("tem pelo menos 30 personagens, todos com missão própria", () => {
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(30);
    for (const c of CHARACTERS) expect(MISSIONS.some((m) => m.npc === c.id), c.id).toBe(true);
  });

  it("ids são únicos", () => {
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length);
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
  });

  it("personagens são distintos: falas de saudação não se repetem entre eles", () => {
    const greets = CHARACTERS.flatMap((c) => c.voice.greet);
    expect(new Set(greets).size).toBe(greets.length);
    for (const c of CHARACTERS) {
      expect(c.needs.length, c.id).toBeGreaterThanOrEqual(2);
      expect(c.interests.length, c.id).toBeGreaterThanOrEqual(1);
      expect(c.probes.length + c.interruptions.length, c.id).toBeGreaterThanOrEqual(1);
      for (const r of Object.values(c.voice.reactions)) expect(r.length, c.id).toBeGreaterThan(0);
      expect(DISTRICTS.some((d) => d.id === c.district), c.id).toBe(true);
    }
  });

  it("missões só apontam para coisas que existem", () => {
    const allFlags = new Set([...MISSIONS.flatMap((m) => m.flagsOnSuccess ?? [])]);
    for (const m of MISSIONS) {
      const c = character(m.npc);
      expect(m.district, m.id).toBe(c.district);
      for (const r of m.requires.missions ?? []) expect(() => mission(r), m.id).not.toThrow();
      const beatIds = new Set(m.beats.map((b) => b.id));
      for (const b of m.beats) {
        expect(b.npc.length, `${m.id}/${b.id}`).toBeGreaterThan(0);
        for (const o of b.options) {
          if (o.needs) expect(c.needs.some((n) => n.id === o.needs), `${m.id}/${o.id} needs ${o.needs}`).toBe(true);
          if (o.reveals) expect(c.needs.some((n) => n.id === o.reveals), `${m.id}/${o.id} reveals ${o.reveals}`).toBe(true);
          if (o.next) expect(beatIds.has(o.next), `${m.id}/${o.id} next ${o.next}`).toBe(true);
          if (o.requiresItem) expect(ITEMS.some((i) => i.id === o.requiresItem), o.requiresItem).toBe(true);
          if (o.requiresPerk) expect(PERKS.some((p) => p.id === o.requiresPerk), o.requiresPerk).toBe(true);
          if (o.ifWorld) expect(allFlags.has(o.ifWorld), `${m.id}/${o.id} ifWorld ${o.ifWorld}`).toBe(true);
        }
      }
      expect(Object.values(m.endings).every((t) => t.length > 10), m.id).toBe(true);
    }
  });

  it("capítulos, ferramentas e desafios estão consistentes", () => {
    for (const ch of CHAPTERS) {
      for (const id of [...ch.goal.story, ...(ch.goal.anyOf?.missions ?? [])]) expect(() => mission(id), id).not.toThrow();
      for (const it of ch.goal.items ?? []) expect(ITEMS.some((i) => i.id === it), it).toBe(true);
    }
    for (const d of DISTRICTS) for (const it of d.unlock.items ?? []) expect(ITEMS.some((i) => i.id === it), it).toBe(true);
    for (const m of MISSIONS) for (const it of m.requires.items ?? []) expect(ITEMS.some((i) => i.id === it), it).toBe(true);
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(6);
    expect(EVENTS.length).toBeGreaterThanOrEqual(8);
  });

  it("nenhum texto do jogo contém número de cartão real: só cartões mascarados •••• 0000", () => {
    const blob = JSON.stringify({ MISSIONS, CHARACTERS, GIGS: GIGS.map((g) => ({ ...g, negotiation: undefined })) });
    expect(blob).not.toMatch(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/);
    expect(blob).not.toMatch(/senha:\s*\w/i);
  });
});

// ---------- Motor de conversa ----------

describe("motor de conversa", () => {
  const m = mission("m-helena");
  const c = character("helena");

  it("começa com atributos válidos e uma saudação", () => {
    const e = startEncounter(m, c, ctx(), 1);
    for (const k of ATTRS) expect(e.attrs[k]).toBeGreaterThanOrEqual(0);
    expect(e.log[0].who).toBe("npc");
    expect(e.status).toBe("active");
  });

  it("repetir a mesma abordagem rende cada vez menos (cansaço)", () => {
    const base = tacticEffect(c, "explain", { repeats: 0, targetsNeed: false, skill: 0, credibility: 40, statusGap: 0 });
    const tired = tacticEffect(c, "explain", { repeats: 2, targetsNeed: false, skill: 0, credibility: 40, statusGap: 0 });
    expect(tired.interest ?? 0).toBeLessThan(base.interest ?? 0);
  });

  it("conhecer uma necessidade fortalece a abordagem ligada a ela", () => {
    const plain = tacticEffect(c, "empathy", { repeats: 0, targetsNeed: false, skill: 0, credibility: 40, statusGap: 0 });
    const aimed = tacticEffect(c, "empathy", { repeats: 0, targetsNeed: true, skill: 0, credibility: 40, statusGap: 0 });
    expect((aimed.trust ?? 0) + (aimed.affinity ?? 0)).toBeGreaterThan((plain.trust ?? 0) + (plain.affinity ?? 0));
  });

  it("o mesmo estado e a mesma escolha dão o mesmo resultado (determinístico)", () => {
    const e = startEncounter(m, c, ctx(), 42);
    const id = optionsFor(e, m, c, ctx())[0].id;
    expect(choose(e, id, m, c, ctx())).toEqual(choose(e, id, m, c, ctx()));
  });

  it("encerrar a conversa termina com o desfecho «left»", () => {
    const e = choose(startEncounter(m, c, ctx(), 3), "u-leave", m, c, ctx());
    expect(e.status).toBe("done");
    expect(e.outcome).toBe("left");
    expect(resultOf(e, m, c).money).toBe(0);
  });

  it("afirmar duas coisas diferentes sobre o mesmo assunto pode ser percebido", () => {
    // Helena: a pergunta inesperada sobre pagamento grava uma afirmação de blefe
    const probe = c.probes.find((p) => p.id === "quem-paga")!;
    let caught = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let e = startEncounter(m, c, ctx(), seed);
      e = { ...e, claims: { pagamento: { value: "comissao", label: "você ganha comissão", truthful: true, turn: 0 } }, pending: { kind: "probe", id: probe.id, text: probe.question, options: probe.options } };
      const idx = probe.options.findIndex((o) => o.kind === "bluff");
      const after = answerSide(e, idx, m, c, ctx());
      if (after.liesCaught > 0) caught++;
    }
    expect(caught).toBeGreaterThan(10);
  });

  it("o caderno avisa quando uma fala contradiz algo já dito", () => {
    const withClaim = MISSIONS.flatMap((mm) => mm.beats.flatMap((b) => b.options.filter((o) => o.claim).map((o) => ({ mm, b, o }))));
    expect(withClaim.length).toBeGreaterThan(0);
    const { mm, b, o } = withClaim[0];
    const cc = character(mm.npc);
    let e = startEncounter(mm, cc, ctx({ items: ["caderno"] }), 5);
    e = { ...e, beat: b.id, claims: { [o.claim!.key]: { value: "outra-coisa", label: "algo diferente", truthful: true, turn: 0 } } };
    const shown = optionsFor(e, mm, cc, ctx({ items: ["caderno"] })).find((x) => x.id === o.id);
    expect(shown?.contradicts).toBe("algo diferente");
  });

  it("pontuação de convencimento cresce com confiança e cai com desconfiança", () => {
    const a = { trust: 50, interest: 50, patience: 50, suspicion: 20, mood: 50, credibility: 50, affinity: 50 };
    expect(persuasionScore({ ...a, trust: 80 })).toBeGreaterThan(persuasionScore(a));
    expect(persuasionScore({ ...a, suspicion: 70 })).toBeLessThan(persuasionScore(a));
  });

  it("negociação: o preço aceito melhora com o clima e respeita o limite do cliente", () => {
    const neg = MISSIONS.find((x) => x.negotiation)!;
    const n = neg.negotiation!;
    const bad = { trust: 10, interest: 10, patience: 60, suspicion: 70, mood: 30, credibility: 10, affinity: 10 };
    const good = { trust: 90, interest: 90, patience: 60, suspicion: 0, mood: 80, credibility: 80, affinity: 90 };
    const pBad = acceptablePrice(neg, bad);
    const pGood = acceptablePrice(neg, good);
    if (n.npcSells) expect(pGood).toBeLessThan(pBad);
    else expect(pGood).toBeGreaterThan(pBad);
    // oferta fora do limite do cliente não fecha
    const cc = character(neg.npc);
    let e = startEncounter(neg, cc, ctx(), 9);
    e = { ...e, attrs: good, counter: { price: n.anchor, text: "Faça sua oferta" } };
    const beyond = n.npcSells ? n.clientLimit + 50 : n.clientLimit - 50;
    const after = offer(e, beyond, neg, cc, ctx());
    expect(after.status).toBe("active");
  });
});

// ---------- Estado do jogo ----------

function play(s0: GameState, missionId: string, strat: "smart" | "leave" = "smart"): GameState {
  let s = startMission(s0, missionId);
  expect(s.encounter, missionId).toBeTruthy();
  for (let i = 0; i < 20 && s.encounter && s.encounter.status === "active"; i++) {
    const e = s.encounter;
    if (e.pending) s = { ...s, encounter: { ...e, pending: null } };
    else if (e.counter) s = { ...s, encounter: { ...e, counter: null, status: "done", outcome: "partial" } };
    else {
      const m = MISSIONS.find((x) => x.id === e.missionId) ?? makeVisit(character(e.charId));
      const opts = optionsFor(e, m, character(e.charId), { ...ctx(), worldFlags: s.flags });
      const id = strat === "leave" ? "u-leave" : (opts.find((o) => o.insight) ?? (i >= 5 ? opts.find((o) => o.tactic === "close") : undefined) ?? opts.find((o) => ["question", "explain", "empathy", "evidence"].includes(o.tactic)) ?? opts[0]).id;
      s = say(s, id);
    }
  }
  return finishEncounter(s);
}

describe("jogo", () => {
  it("novo jogo começa com economia fictícia, pensão e capítulo 1", () => {
    const s = newGame("Alex", 0, 1);
    expect(s.money).toBe(50);
    expect(s.heat).toBe(0);
    expect(s.chapter).toBe(1);
    expect(s.location).toBe("jardim");
    expect(s.transactions[0].label).toMatch(/Economias/);
    expect(s.messages.length).toBeGreaterThan(0);
  });

  it("níveis seguem a curva de XP", () => {
    expect(levelOf(0).level).toBe(1);
    expect(levelOf(xpForLevel(2)).level).toBe(2);
    expect(levelOf(xpForLevel(5) - 1).level).toBe(4);
  });

  it("bairros bloqueados não podem ser visitados", () => {
    const s = newGame("Alex", 0, 1);
    expect(districtUnlocked(s, "torres")).toBe(false);
    expect(travel(s, "torres")).toBe(s);
  });

  it("dormir cobra o aluguel, renova a energia e sorteia o novo dia", () => {
    let s = newGame("Alex", 0, 7);
    s = { ...s, energy: 20 };
    const n = endDay(s);
    expect(n.day).toBe(2);
    expect(n.energy).toBe(100);
    expect(n.money).toBe(s.money - RENT);
    expect(n.gigs.length).toBeGreaterThan(0);
  });

  it("missão: conversa completa altera dinheiro, XP, relação e histórico", () => {
    const s0 = newGame("Alex", 0, 11);
    const s = play(s0, "m-cida");
    expect(s.encounter).toBeNull();
    expect(s.xp).toBeGreaterThan(0);
    expect(s.relationships.cida.met).toBe(1);
    expect(s.missions["m-cida"].attempts).toBe(1);
    expect(s.history.some((h) => h.text.includes("Aparecida") || h.text.includes("Cida"))).toBe(true);
    expect(s.minute).toBeGreaterThan(s0.minute);
    expect(s.energy).toBeLessThan(s0.energy);
  });

  it("depois de um fracasso, a missão só volta no dia seguinte", () => {
    const s = play(newGame("Alex", 0, 3), "m-jorge", "leave");
    expect(missionAvailable(s, mission("m-jorge"))).toBe(false);
    expect(missionAvailable(endDay(s), mission("m-jorge"))).toBe(true);
  });

  it("sem energia não se começa conversa", () => {
    const s = { ...newGame("Alex", 0, 3), energy: 5 };
    expect(canStart(s, mission("m-cida"))).toBe("energia");
  });

  it("capítulo 1 pode ser concluído jogando bem", () => {
    let s = newGame("Alex", 0, 21);
    for (const id of ["m-helena", "m-cida", "m-antonio", "m-jorge", "m-bia", "m-helena", "m-jorge", "m-antonio"]) {
      if (s.chapter > 1) break;
      if (!missionAvailable(s, mission(id))) s = endDay(s);
      if (missionAvailable(s, mission(id))) s = play(s, id);
      if (s.energy < 20) s = endDay(s);
    }
    // Algumas tentativas podem falhar; dando mais dias, o capítulo fecha
    for (let d = 0; d < 8 && s.chapter === 1; d++) {
      for (const l of [...s.loot]) s = cashOut(s, l.id, "vender");
      s = endDay(s);
      for (const m of MISSIONS.filter((x) => x.chapter === 1 && missionAvailable(s, x))) if (s.energy > 20 && s.chapter === 1) s = play(s, m.id);
      for (const g of s.gigs.filter((x) => !x.done && character(x.char).district === "jardim")) if (s.energy > 20 && s.chapter === 1) s = play(s, `gig:${g.template}:${g.char}:${s.day}`);
    }
    expect(chapterGoal({ ...s, chapter: 1 }).storyDone).toBe(1);
    expect(s.chapter).toBe(2);
    expect(s.transactions.some((t) => t.label.includes("Bônus de capítulo"))).toBe(true);
  });

  it("bicos e visitas são gerados e jogáveis", () => {
    const s0 = newGame("Alex", 0, 5);
    const g = s0.gigs[0];
    const gig = makeGig(g.template, character(g.char), s0.day);
    expect(gig.beats.length).toBeGreaterThan(0);
    expect(JSON.stringify(gig)).not.toContain("{name}");
    const s = play(s0, `visit:${s0.gigs[0].char}`);
    expect(s.visitsToday).toContain(s0.gigs[0].char);
    expect(startMission(s, `visit:${s0.gigs[0].char}`).encounter).toBeNull();
  });

  it("loja: comprar, vestir e usar consumíveis", () => {
    let s = { ...newGame("Alex", 0, 5), money: 1000 };
    s = buy(s, "camisa");
    expect(s.items).toContain("camisa");
    expect(s.money).toBe(1000 - 180);
    s = equip(s, "camisa");
    expect(s.outfit).toBe("camisa");
    expect(buy(s, "camisa")).toBe(s);
    expect(buy(s, "terno")).toBe(s); // exige nível 4
    s = buy(s, "cafe");
    s = { ...s, energy: 40 };
    s = useConsumable(s, "cafe");
    expect(s.energy).toBe(70);
    expect(buy({ ...s, money: 0 }, "dossie").money).toBe(0);
  });

  it("habilidades exigem pontos, nível e a habilidade anterior", () => {
    let s = newGame("Alex", 0, 5);
    expect(perkAvailable(s, "olho-clinico")).toBe(false);
    s = { ...s, xp: xpForLevel(5) };
    expect(perkAvailable(s, "leitura-fria")).toBe(false);
    s = takePerk(s, "olho-clinico");
    expect(s.perks).toEqual(["olho-clinico"]);
    expect(perkAvailable(s, "leitura-fria")).toBe(true);
  });

  it("desafios do dia pagam uma vez só quando cumpridos", () => {
    let s = newGame("Alex", 0, 5);
    const c = challengesToday(s)[0];
    expect(claimChallenge(s, c.id)).toBe(s);
    s = { ...s, dayStats: { talks: 9, deals: 9, dealsNoBluff: 9, needsFound: 9, earned: 999, humorHits: 9, walkouts: 0, highAffinity: 9, newPeople: 9 } };
    const after = claimChallenge(s, c.id);
    expect(after.money).toBe(s.money + c.reward.money);
    expect(claimChallenge(after, c.id)).toBe(after);
  });

  it("golpe que dá certo gera butim e calor; o butim pode ser vendido ou usado", () => {
    let s = play(newGame("Alex", 0, 11), "m-cida");
    const rec = s.missions["m-cida"].best!;
    if (["great", "good", "partial"].includes(rec)) {
      expect(s.loot.length).toBeGreaterThan(0);
      expect(s.heat).toBeGreaterThan(0);
      const l = s.loot[0];
      const money = s.money;
      s = cashOut(s, l.id, "vender");
      expect(s.money).toBeGreaterThan(money);
      expect(s.loot.find((x) => x.id === l.id)).toBeUndefined();
    }
  });

  it("usar um cartão exige o kit de clonagem e rende mais que vender", () => {
    let s = newGame("Alex", 0, 5);
    s = { ...s, loot: [{ id: 999, kind: "cartao", label: "cartão de teste", owner: "cida", value: 1000, last4: "1234", day: 1 }] };
    expect(lootOptions(s, s.loot[0]).use?.ok).toBe(false);
    expect(cashOut(s, 999, "usar")).toBe(s);
    s = { ...s, items: [...s.items, "kit-clone"] };
    const o = lootOptions(s, s.loot[0]);
    expect(o.use!.value).toBeGreaterThan(o.sell);
    const after = cashOut(s, 999, "usar");
    expect(after.money).toBe(s.money + o.use!.value);
    expect(after.heat).toBeGreaterThan(s.heat);
  });

  it("ferramentas cortam o calor; à noite ele esfria", () => {
    const s = newGame("Alex", 0, 5);
    const base = heatFactor({ ...s, event: "sol" });
    expect(heatFactor({ ...s, event: "sol", items: [...s.items, "chip", "laranjas"] })).toBeLessThan(base);
    expect(endDay({ ...s, heat: 50 }).heat).toBe(38);
  });

  it("calor em 100 leva à prisão; na terceira, fim de jogo", () => {
    let s = { ...newGame("Alex", 0, 5), money: 1000, items: ["roupa-comum", "tema-onix", "kit-clone"] };
    s = arrest(s);
    expect(s.arrests).toBe(1);
    expect(s.money).toBe(400);
    expect(s.items).not.toContain("kit-clone");
    expect(s.heat).toBe(35);
    expect(s.loot).toEqual([]);
    const lawyer = arrest({ ...s, money: 1000, items: [...s.items, "advogado", "chip"] });
    expect(lawyer.money).toBe(750);
    expect(lawyer.items).toContain("chip");
    const end = arrest(lawyer);
    expect(end.ending?.id).toBe("preso");
  });

  it("bairros caros pedem ferramentas", () => {
    const s = { ...newGame("Alex", 0, 5), chapter: 4, xp: xpForLevel(10) };
    expect(districtUnlocked(s, "torres")).toBe(false);
    expect(districtUnlocked({ ...s, items: [...s.items, "identidade"] }, "torres")).toBe(true);
  });

  it("conquistas são marcadas uma vez", () => {
    let s = newGame("Alex", 0, 5);
    s = { ...s, stats: { ...s.stats, deals: 1 } };
    const r = checkAchievements(s);
    expect(r.unlocked.map((a) => a.id)).toContain("primeiro-acordo");
    expect(checkAchievements(r.state).unlocked.length).toBe(0);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
  });
});

// ---------- Salvamento ----------

describe("salvamento", () => {
  beforeEach(() => {
    const mem = new Map<string, string>();
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: () => null,
      length: 0,
    };
  });

  it("salva e carrega, inclusive com conversa em andamento", () => {
    let s = newGame("Bia", 2, 9);
    s = startMission(s, "m-cida");
    expect(save(1, s)).toBe(true);
    const back = load(1)!;
    expect(back.player.name).toBe("Bia");
    expect(back.encounter?.missionId).toBe("m-cida");
    expect(slotInfo(1)?.day).toBe(1);
    expect(slotInfo(2)).toBeNull();
  });

  it("exporta e importa; rejeita texto qualquer", () => {
    const s = newGame("Caio", 1, 9);
    const back = importSave(exportSave(s))!;
    expect(back.player.name).toBe("Caio");
    expect(importSave("{}")).toBeNull();
    expect(importSave("não é json")).toBeNull();
  });

  it("migração preenche campos novos de salvamentos antigos", () => {
    const s = newGame("Dani", 0, 9) as Partial<GameState>;
    const old = { ...s, stats: { deals: 3 } } as unknown;
    const m = migrate(old)!;
    expect(m.stats.deals).toBe(3);
    expect(m.stats.tactics).toEqual({});
  });
});

void ({} as Mission);
