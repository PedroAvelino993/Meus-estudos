// Missões geradas a partir dos personagens: golpes rápidos do dia (repetíveis) e visitas para sondar alvos.

import type { Character, Mission } from "./types";
import { GIGS } from "../content/story";
import { district } from "../content/world";

const fillName = (s: string, c: Character) => s.replace(/\{name\}/g, c.nick ?? c.name.split(" ")[0]);

function deepFill<T>(v: T, c: Character): T {
  if (typeof v === "string") return fillName(v, c) as T;
  if (Array.isArray(v)) return v.map((x) => deepFill(x, c)) as T;
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) out[k] = typeof x === "function" ? x : deepFill(x, c);
    return out as T;
  }
  return v;
}

/** Bico do dia: um modelo aplicado a um morador do bairro. */
export function makeGig(templateId: string, c: Character, day: number): Mission {
  const t = GIGS.find((g) => g.id === templateId)!;
  const tier = district(c.district).tier;
  const base = deepFill({ title: t.title, client: t.client, brief: t.brief, objective: t.objective, beats: t.beats, endings: t.endings }, c);
  return {
    id: `gig:${t.id}:${c.id}:${day}`,
    title: base.title,
    npc: c.id,
    district: c.district,
    type: t.type,
    difficulty: Math.min(5, Math.max(1, tier)) as Mission["difficulty"],
    requires: {},
    client: base.client,
    brief: base.brief,
    objective: base.objective,
    threshold: 26 + tier * 4,
    beats: base.beats,
    negotiation: t.negotiation?.(tier),
    rewards: { money: t.negotiation ? 15 * tier : 25 * tier + 15, xp: 20 * tier + 10, rep: 1 },
    loot: (t.loot ?? []).map((l) => ({ ...l, label: fillName(l.label, c), value: l.value * tier })),
    heat: 5 + tier * 2,
    endings: base.endings,
    minutes: 30,
  };
}

/** Visita: sem golpe nenhum. Serve para ganhar confiança e descobrir pontos fracos antes do bote. */
export function makeVisit(c: Character): Mission {
  const first = c.nick ?? c.name.split(" ")[0];
  return {
    id: `visit:${c.id}`,
    title: `Um café com ${first}`,
    npc: c.id,
    district: c.district,
    type: "favor",
    difficulty: 1,
    requires: {},
    client: "Sondagem",
    brief: `Passar um tempo com ${first}, sem pedir nada. Quem confia em você hoje cai mais fácil amanhã.`,
    objective: `Ganhar a confiança de ${first} e descobrir os pontos fracos dessa pessoa.`,
    threshold: 30,
    beats: [
      {
        id: "visita",
        canClose: true,
        npc: ["Ué, sem negócio hoje? Só visita? Hum. Senta.", "Visita? Que coisa rara. Pode ficar um pouco."],
        options: [
          { id: "sobre-voce", text: "Contar uma história comovente sobre por que você veio para Vila Áurea", tactic: "honesty", reply: { good: "Hum. Então você também começou do zero. Respeito isso.", bad: "Hum. Tá." } },
          { id: "dia", text: `Perguntar como ${first} está de verdade`, tactic: "empathy", reply: { good: "…Ninguém pergunta isso de verdade. Obrigado.", bad: "Estou bem. Por quê?" } },
          { id: "piada", text: "Contar uma história engraçada do seu dia", tactic: "humor" },
          { id: "conselho", text: `Pedir um conselho a ${first} sobre a cidade`, tactic: "question", reply: { good: "Conselho? Bom… desconfie de quem promete demais e escute quem fala pouco.", bad: "Conselho? Não sou guru de ninguém." } },
        ],
      },
    ],
    rewards: { money: 0, xp: 15, rep: 0 },
    endings: {
      great: `${first} se despede com um abraço e um "volta sempre". Algo mudou entre vocês.`,
      good: `Uma boa conversa. ${first} parece mais à vontade com você.`,
      partial: "Uma conversa simpática, sem grandes novidades.",
      fail: "A conversa não engrenou. Fica para a próxima.",
      walkout: `${first} tinha outras coisas para fazer.`,
    },
    minutes: 30,
  };
}
