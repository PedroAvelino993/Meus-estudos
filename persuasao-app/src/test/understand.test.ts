import { describe, expect, it } from "vitest";
import { character, mission } from "../content";
import { newRelationship, startEncounter, type PlayerCtx } from "../core/encounter";
import { detectTactic, priceIn, saysYes, understand, understandSide } from "../core/understand";
import { newGame, startMission, talk } from "../core/game";

const ctx: PlayerCtx = { name: "Alex", perks: [], skill: {}, items: [], startMods: {}, energy: 100, reputation: 10, socialClass: 2, hour: 8, worldMood: 0, relationship: newRelationship(), worldFlags: [] };

describe("reconhecer a intenção da fala", () => {
  const cases: [string, string][] = [
    ["Como o Davi passa as tardes?", "question"],
    ["Entendo, deve ser muito difícil cuidar de tudo sozinha", "empathy"],
    ["Vou ser sincero: não posso garantir que ele vai gostar", "honesty"],
    ["As vagas estão acabando, tem que ser hoje", "urgency"],
    ["Se não aceitar vai se arrepender", "pressure"],
    ["Uma pesquisa mostrou que 80% dos alunos melhoraram", "evidence"],
    ["Todo mundo da rua já matriculou os filhos", "socialProof"],
    ["haha imagina o Davi montando um robô", "humor"],
    ["Posso abrir mão da taxa para você", "concession"],
    ["Então, fechamos?", "close"],
    ["Me passa o cartão para eu confirmar a inscrição", "close"],
    ["Só falta a sua assinatura aqui", "close"],
    ["Tchau, a gente conversa outra hora", "leave"],
    ["Mudando de assunto, que calor hoje", "changeSubject"],
    ["Bom dia! Tudo bem com a senhora", "rapport"],
    ["O projeto funciona à tarde com reforço escolar", "explain"],
    ["Já pensou nisso como um investimento no futuro dele", "reframe"],
  ];
  for (const [text, tactic] of cases) it(`«${text}» → ${tactic}`, () => expect(detectTactic(text)).toBe(tactic));
});

describe("entender a fala dentro da missão", () => {
  const m = mission("m-helena");
  const c = character("helena");
  const e = startEncounter(m, c, ctx, 3);

  it("paráfrase de uma fala prevista vale como ela", () => {
    expect(understand("Como é que o Davi passa as tardes dele?", e, m, c, ctx).optionId).toBe("davi-rua");
    expect(understand("É tudo gratuito, só tem uma taxinha simbólica de matrícula", e, m, c, ctx).optionId).toBe("sem-custo");
    expect(understand("Funciona das 13h às 17h, tem reforço escolar, esporte e lanche", e, m, c, ctx).optionId).toBe("explicar-projeto");
  });

  it("perguntar o que importa vira a busca por necessidades", () => {
    expect(understand("O que mais te preocupa nisso tudo?", e, m, c, ctx).optionId).toBe("u-question");
  });

  it("cumprimento não é confundido com uma fala prevista só por citar o assunto", () => {
    const ma = mission("m-antonio");
    const ca = character("antonio");
    const ea = startEncounter(ma, ca, ctx, 3);
    expect(understand("Bom dia, Seu Antônio! Que rádio bonito", ea, ma, ca, ctx).optionId.startsWith("u-")).toBe(true);
  });

  it("fala sem relação com o roteiro vira fala livre com a abordagem reconhecida", () => {
    const u = understand("Sinto muito, deve ser cansativo trabalhar de plantão", e, m, c, ctx);
    expect(u.optionId).toBe("u-free:empathy");
  });

  it("respostas a interrupções e perguntas inesperadas", () => {
    const probe = c.probes[0];
    const honest = probe.options.findIndex((o) => o.kind === "honest");
    expect(understandSide("Sinceramente, quem me contratou foi a associação e eu ganho uma comissão", probe.options)).toBe(honest);
    expect(probe.options[understandSide("depois", probe.options)].kind).toBe("evasive");
  });

  it("valores e confirmações", () => {
    expect(priceIn("Te pago ₢ 1.200 pelo rádio")).toBe(1200);
    expect(priceIn("ofereço 350")).toBe(350);
    expect(priceIn("sem número")).toBeNull();
    expect(saysYes("Fechado, aceito")).toBe(true);
    expect(saysYes("Não aceito")).toBe(false);
  });
});

describe("conversa digitada no jogo", () => {
  it("o texto escrito aparece na conversa e muda o estado", () => {
    let s = startMission(newGame("Alex", 0, 4), "m-helena");
    const n = s.encounter!.log.length;
    s = talk(s, "Como o Davi passa as tardes?").state;
    expect(s.encounter!.turn).toBe(1);
    expect(s.encounter!.log[n].text).toBe("Como o Davi passa as tardes?");
    expect(s.encounter!.log[n].who).toBe("me");
  });

  it("na negociação, dizer um valor faz a oferta", () => {
    let s = startMission(newGame("Alex", 0, 4), "m-antonio");
    for (const t of ["Bom dia, Seu Antônio! Que rádio bonito", "Me conta a história desse rádio?", "O que mais importa para o senhor nisso?"]) s = talk(s, t).state;
    while (s.encounter!.pending) s = talk(s, "Claro, sinceramente posso mostrar meus documentos").state;
    s = talk(s, "Te ofereço 300 pelo rádio").state;
    const log = s.encounter!.log.map((l) => l.text).join(" | ");
    expect(log).toContain("Te ofereço 300 pelo rádio");
    expect(s.encounter!.closeAttempts).toBeGreaterThan(0);
  });

  it("texto vazio não faz nada", () => {
    const s = startMission(newGame("Alex", 0, 4), "m-helena");
    expect(talk(s, "   ").state).toBe(s);
  });
});

describe("conversa fiada responde de verdade", () => {
  it("novidade, como vai, família e «como assim?» têm resposta própria, e a conversa volta ao assunto", async () => {
    const { newGame, startMission, talk } = await import("../core/game");
    let s = startMission(newGame("Alex", 0, 9), "m-jorge");
    const said = (t: string) => {
      const n = s.encounter!.log.length;
      s = talk(s, t).state;
      return s.encounter!.log.slice(n + 1).map((l) => l.text).join(" ");
    };
    expect(said("e aí, beleza?")).toMatch(/Ferroviário|luta/);
    expect(said("tem alguma novidade?")).toMatch(/Opala|centroavante/);
    if (s.encounter!.pending) said("pode ir, eu espero");
    const conf = said("ah é o quê?");
    expect(conf).toMatch(/Desculpa/);
    const all = s.encounter!.log.filter((l) => l.who === "npc").map((l) => l.text);
    expect(all.some((t) => /voltando ao assunto|Enfim|me diz uma coisa|sobre o que você veio/.test(t))).toBe(true);
    for (const t of all) expect(t.trim().length).toBeGreaterThan(3);
  });
});
