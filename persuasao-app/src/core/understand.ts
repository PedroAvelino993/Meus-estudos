// Entendimento da fala digitada pelo jogador. Sem IA: normaliza o texto, reconhece a intenção
// (a abordagem) por expressões típicas do português e compara com as falas que a missão prevê
// naquele momento. Se a fala se parece com uma delas, vale aquela (com todas as consequências);
// se não, vira uma fala livre com a abordagem reconhecida.

import type { Character, Mission, SideOption, Tactic } from "./types";
import type { EncounterState, PlayerCtx, ShownOption } from "./encounter";
import { optionsFor } from "./encounter";

export function normalize(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9?%$₢\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(
  "a o as os um uma uns umas de da do das dos em no na nos nas por pra para com sem que e ou se eu voce voces ele ela eles elas me te lhe nos isso isto esse essa este esta aquele aquela meu minha seu sua seus suas teu tua muito mais menos ja nao sim tambem so ate como mas entao ai la aqui ser estar ter foi era sao esta estou tem tenho vai vou ao aos pelo pela pelos pelas num numa qual quais quando onde quem porque por que dele dela sobre tudo todo toda bem dia hoje bom boa dizer diga falar fale contar conte perguntar pergunte mostrar mostre explicar explique oferecer ofereca sugerir sugira lembrar lembre garantir prometer avisar comentar reconhecer insistir pedir propor".split(
    " ",
  ),
);

/** Radical simples: corta terminações para "matricular", "matrícula" e "matriculou" se encontrarem. */
function stem(w: string): string {
  if (w.length <= 4) return w;
  return w.replace(/(mente|coes|cao|oes|ados|adas|ado|ada|ando|endo|indo|aram|eram|iram|ar|er|ir|ou|ei|as|es|os|a|e|o|s)$/, "").slice(0, 7);
}

export function stems(t: string): string[] {
  return [
    ...new Set(
      normalize(t)
        .replace(/\?/g, " ")
        .split(" ")
        .filter((w) => w && !STOP.has(w) && (w.length > 2 || /\d/.test(w)))
        .map(stem),
    ),
  ];
}

/** Semelhança entre a fala e uma opção prevista (0 a 1). */
export function similarity(typed: string, candidate: string, topic: Set<string> = new Set()): number {
  const a = stems(typed);
  const b = stems(candidate);
  if (!a.length || !b.length) return 0;
  // Palavras do assunto geral da missão (ex.: "rádio") valem menos: aparecem em quase toda fala
  const w = (x: string) => (topic.has(x) ? 0.35 : 1);
  let hit = 0;
  let hits = 0;
  for (const x of b)
    if (a.some((y) => y === x || (x.length >= 5 && y.length >= 5 && (x.startsWith(y) || y.startsWith(x))))) {
      hit += w(x);
      if (!topic.has(x)) hits++;
    }
  if (hits === 0 || (hits < 2 && b.length > 2)) return Math.min(0.3, hit / Math.max(3, b.length));
  const total = b.reduce((acc, x) => acc + w(x), 0);
  // Quanto da opção prevista apareceu na fala (com um piso para opções longas)
  return hit / Math.min(total, Math.max(2.5, total * 0.6));
}

const has = (t: string, re: RegExp) => re.test(t);

/** Reconhece a abordagem pela forma da fala. */
export function detectTactic(raw: string): Tactic | "close" | "leave" {
  const t = ` ${normalize(raw)} `;
  if (has(t, / (tchau|ate logo|ate mais|adeus|preciso ir|tenho que ir|vou embora|deixa pra la|esquece|encerrar|outra hora a gente)/)) return "leave";
  if (has(t, / (fechado\?|fechamos|vamos fechar|topa\b|topa\?|aceita\?|aceita a proposta|minha proposta|proponho|o que (me )?diz|negocio fechado\?|combinado\?|podemos fechar|vamos combinar|faco (a|uma) proposta|quanto voce (quer|pede|paga|cobra)|falar de (valor|preco)|qual (o|e o) (seu )?preco|pode assinar|assina aqui|so assinar|so falta (a sua )?assinatura|(me )?(passa|passe|informa|informe|confirma|confirme|dita|dite) (o|a|os|as|seu|sua|seus|suas) (numero do )?(cartao|senha|dados|codigo|login|documentos)|qual (e )?(a|o) (sua |seu )?(senha|numero do cartao|login|codigo))/)) return "close";
  if (has(t, / (mudando de assunto|falando nisso|outra coisa|deixa eu (te )?contar|por falar em|aliviar|esquece isso)/)) return "changeSubject";
  if (has(t, / (haha|kkk|rsrs| rs |hehe|piada|brincadeira|to brincando|estou brincando|engracad)/)) return "humor";
  if (has(t, / (vai se arrepender|ultima chance|agora ou nunca|tem que aceitar|e obrigad|senao|se nao aceitar|multa|processo|vou denunciar|nao tem escolha|e pegar ou largar|ou aceita)/)) return "pressure";
  if (has(t, / (sinceramente|honestamente|vou ser (honesto|sincero|franco)|francamente|a verdade e|nao vou mentir|nao posso garantir|nao prometo|sendo sincero|para ser honesto)/)) return "honesty";
  if (has(t, / (urgente|hoje mesmo|so hoje|ate (amanha|sexta|hoje)|acabando|ultimas vagas|rapido|nao da pra esperar|corre|antes que acabe|vai acabar)/)) return "urgency";
  if (has(t, / (voce e (muito|tao) |o senhor e (muito|tao) |a senhora e (muito|tao) |admiro|que elegan|que lind|que inteligente|parabens|talentos|voce e incrivel|que bonit| (e|eh) (o|a) (mais|melhor) )/)) return "flattery";
  if (has(t, / (entendo|imagino|compreendo|deve ser (dificil|duro|complicado|pesado|cansativo)|sinto muito|que (dificil|chato|triste)|faz sentido (voce|o senhor|a senhora)|eu te ouco|estou ouvindo|com certeza voce|nao deve ser facil|sei como e)/)) return "empathy";
  if (has(t, / (posso (abrir mao|baixar|reduzir|oferecer|fazer)|abro mao|desconto|a gente pode|podemos (fazer|ajustar|dividir|mudar)|sem custo|de graca|gratis|sem compromisso|eu cedo|flexivel|que tal se)/)) return "concession";
  if (has(t, / (todo mundo|todos (ja|os)|varios|varias|muita gente|outras (familias|pessoas)|outros (clientes|vizinhos|moradores)|metade do|a maioria|ja (aderiram|assinaram|matricularam|compraram))/)) return "socialProof";
  if (has(t, /\d|%| (dados|numeros|pesquisa|estudo|comprov|document|relatorio|grafico|planilha|estatistic|fotos|prova|nota fiscal|orcamento|contrato)/)) return "evidence";
  if (has(t, / (especialista|como profissional|minha experiencia|anos de (experiencia|trabalho|profissao)|sou formad|certificad|autoridade|eu conheco bem|trabalho com isso)/)) return "authority";
  if (has(t, / (pense|pensa|olhe por outro lado|por outro lado|na verdade|em vez de|imagina se|ja pensou|e se |veja assim|outro jeito|nao e (um )?gasto|e um investimento)/)) return "reframe";
  if (has(t, /\?/) || has(t, /^ (que|o que|como|por que|porque|qual|quais|quando|onde|quem|quanto|sera que|voce (ja|acha|gosta|tem|pode|sabe)|posso perguntar|me conta|me fala)/)) return "question";
  if (has(t, / (bom dia|boa tarde|boa noite|tudo bem|oi |ola|prazer|como vai|que calor|que chuva|futebol|seu time|familia|filhos|netos|lembra|saudade)/)) return "rapport";
  return "explain";
}

const NEED_WORDS = / (preocupa|importa|pesa|precisa|medo|receio|incomoda|o que (te|lhe)? ?(faria|ajudaria)|o que voce (acha|pensa|quer|sente)|o que (o senhor|a senhora) (acha|pensa|quer)|qual (e )?(a|o) (sua )?(maior )?(duvida|problema|dificuldade|prioridade)|o que falta|como posso ajudar|por que (nao|voce)|o que (te )?impede|o que mais)/;

export interface Understood {
  /** Id da opção (prevista, universal ou "u-free:<abordagem>"). */
  optionId: string;
  tactic: Tactic | "close" | "leave";
  /** A fala foi reconhecida como uma das previstas pela missão. */
  matched?: ShownOption;
  score: number;
}

/** Decide o que a fala digitada significa na conversa atual. */
export function understand(typed: string, s: EncounterState, m: Mission, c: Character, p: PlayerCtx): Understood {
  const opts = optionsFor(s, m, c, p);
  const tactic = detectTactic(typed);
  const t = ` ${normalize(typed)} `;

  if (tactic === "leave") return { optionId: "u-leave", tactic, score: 1 };

  const topic = new Set(stems(`${m.title} ${m.objective} ${m.negotiation?.item ?? ""} ${c.name} ${c.nick ?? ""}`));
  // Falas previstas pela missão e assuntos de interesse do personagem
  let best: ShownOption | undefined;
  let bestScore = 0;
  for (const o of opts) {
    if (o.universal && !o.id.startsWith("u-interest-")) continue;
    let cand = o.text;
    if (o.id.startsWith("u-interest-")) cand = `${o.text} ${c.interests[Number(o.id.split("-")[2])].topic}`;
    let sc = similarity(typed, cand, topic);
    if (o.tactic === tactic) sc += 0.12;
    if (sc > bestScore) {
      bestScore = sc;
      best = o;
    }
  }
  if (best && bestScore >= 0.45) return { optionId: best.id, tactic: best.tactic, matched: best, score: bestScore };

  if (tactic === "close") {
    const close = opts.find((o) => o.id === "u-close");
    if (close) return { optionId: "u-close", tactic, score: 1 };
    return { optionId: "u-free:urgency", tactic: "urgency", score: 0 };
  }
  if (tactic === "question" || NEED_WORDS.test(t)) {
    if (NEED_WORDS.test(t) && opts.some((o) => o.id === "u-question")) return { optionId: "u-question", tactic: "question", score: 0.5 };
  }
  if (tactic === "honesty" && opts.some((o) => o.id === "u-honest")) return { optionId: "u-honest", tactic, score: 0.5 };
  if (tactic === "changeSubject" && opts.some((o) => o.id === "u-change")) return { optionId: "u-change", tactic, score: 0.5 };
  return { optionId: `u-free:${tactic}`, tactic, score: 0 };
}

/** Escolhe a resposta a uma interrupção ou pergunta inesperada a partir do texto. */
export function understandSide(typed: string, options: SideOption[]): number {
  const t = ` ${normalize(typed)} `;
  let best = -1;
  let bestScore = 0;
  options.forEach((o, i) => {
    let sc = similarity(typed, o.text);
    if (o.kind === "honest" && /(sinceramente|verdade|honest|franco|na real|vou ser claro|confesso)/.test(t)) sc += 0.3;
    if (o.kind === "evasive" && /(depois|nao importa|tanto faz|deixa isso|outra hora|nao vem ao caso|isso nao)/.test(t)) sc += 0.3;
    if (sc > bestScore) {
      bestScore = sc;
      best = i;
    }
  });
  if (best >= 0 && bestScore >= 0.3) return best;
  // Resposta curta ou vaga: soa como desconversar, se houver essa opção; senão, a mais neutra
  const words = normalize(typed).split(" ").filter(Boolean).length;
  const evasive = options.findIndex((o) => o.kind === "evasive");
  if (words <= 3 && evasive >= 0) return evasive;
  const honest = options.findIndex((o) => o.kind === "honest");
  if (honest >= 0) return honest;
  // Interrupções sem tipo: a mais calma (a que menos tira paciência)
  let calm = 0;
  options.forEach((o, i) => {
    if ((o.effect.patience ?? 0) + (o.effect.affinity ?? 0) > (options[calm].effect.patience ?? 0) + (options[calm].effect.affinity ?? 0)) calm = i;
  });
  return calm;
}

/** Valor de dinheiro citado na fala ("ofereço 300", "₢ 1.200", "350 reais"). */
export function priceIn(typed: string): number | null {
  const m = typed.replace(/(\d)\.(\d{3})/g, "$1$2").match(/(\d{1,6})(?:[.,]\d+)?/);
  return m ? Number(m[1]) : null;
}

export function saysYes(typed: string): boolean {
  return /\b(sim|aceito|fechado|fechamos|combinado|topo|pode ser|ok|beleza|negocio fechado|feito|ta bom|esta bem|vamos nessa|aceita)\b/.test(normalize(typed)) && !/\b(nao|ainda nao)\b/.test(normalize(typed));
}

export function saysNo(typed: string): boolean {
  return /\b(nao|ainda nao|recuso|nem pensar|de jeito nenhum|melhor nao)\b/.test(normalize(typed));
}
