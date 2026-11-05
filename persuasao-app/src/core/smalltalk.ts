// Respostas a perguntas do dia a dia e "como assim?", para a conversa não virar "Sei." / "Uhum.".
// Também puxa a conversa de volta para o assunto quando o jogador se perde.

import type { Character, Mission } from "./types";
import type { EncounterState } from "./encounter";
import { TALK } from "../content/talk";
import { normalize } from "./understand";

const pick = <T,>(arr: T[], seed: number) => arr[Math.abs(seed) % arr.length];

const ASK = /\?|^ (e |mas )?(o que|como|qual|quais|quando|onde|quem|quanto|voce|vc|o senhor|a senhora|tem|ta|esta|sera)\b/;

/** Resposta direta a uma pergunta comum, se for o caso. */
export function smallTalkAnswer(raw: string, c: Character, e: EncounterState): string | null {
  const t = ` ${normalize(raw).replace(/\?/g, " ").replace(/\s+/g, " ")} `;
  const talk = TALK[c.id];
  if (!talk) return null;
  const asks = ASK.test(t) || raw.includes("?");

  if (/ (ah e o que|e o que|como assim|nao entendi|nao entendo|o que (voce|vc|o senhor|a senhora) quer dizer|explica (melhor|isso)|hein|repete) /.test(t) || /^\s*(que|hein|ha|oi|ue|como)\s*\?*\s*$/.test(normalize(raw))) {
    const last = [...e.log].reverse().find((l) => l.who === "npc" && l.text.length > 25);
    if (!last) return "Desculpa, me perdi. Do que você estava falando mesmo?";
    // Tira a parte de enfeite ("Resume, por favor.") e repete o que importa
    const parts = last.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [last.text];
    // Fica com o fim da fala (é onde está o conteúdo; o começo costuma ser a reação)
    const keep: string[] = [];
    for (let i = parts.length - 1; i >= 0 && keep.join("").trim().length < 45; i--) keep.unshift(parts[i]);
    const core = keep.join("").trim();
    return `Desculpa, falei de um jeito confuso. O que eu quis dizer foi: ${core.charAt(0).toLowerCase()}${core.slice(1)}`;
  }
  if (/ (seu nome|como (voce|vc|o senhor|a senhora) se chama|quem e (voce|vc)) /.test(t)) return `Sou ${c.name}${c.nick ? `, mas todo mundo me chama de ${c.nick}` : ""}.`;
  if (/ quantos anos /.test(t)) return `Tenho ${c.age} anos.${c.age >= 60 ? " Bem vividos." : ""}`;
  if (/ (novidade|novidades|o que ha de novo|quais as novas|alguma noticia|o que (tem|ta|esta) acontecendo|que (que )?ta rolando) /.test(t)) return pick(talk.novidade, e.turn + raw.length);
  if (/ (tudo bem|tudo bom|tudo certo|como vai|como (voce|vc|o senhor|a senhora) (esta|ta|vai)|como esta|beleza|td bem|como anda|como (foi|ta) (o|seu) dia) /.test(t)) return pick(talk.comoVai, e.turn + raw.length);
  if (!asks) return null;
  if (/ (trabalha|trabalho|profiss|o que (voce|vc|o senhor|a senhora) faz|emprego|servico|ganha a vida) /.test(t)) return talk.trabalho;
  if (/ (filho|filhos|filha|familia|marido|esposa|mulher|neto|neta|casad|seus pais|sua mae|seu pai|mora com quem) /.test(t)) return talk.familia;
  if (/ (dinheiro|salario|grana|financ|as contas|aperto|ganha bem|ta dificil) /.test(t)) return e.attrs.trust < 30 ? "Isso é assunto meu. Não abro a minha vida para quem acabei de conhecer." : talk.dinheiro;
  if (/ (onde (voce|vc|o senhor|a senhora) mora|mora (onde|aqui|perto)|seu bairro|sua casa) /.test(t)) return talk.casa;
  if (/ (do que (voce|vc|o senhor|a senhora) gosta|gosta de|hobby|se diverte|faz (pra|para) relaxar|faz no tempo livre) /.test(t)) return talk.gosta;
  return null;
}

/** Uma frase para trazer a conversa de volta ao assunto da missão. */
export function steerLine(m: Mission, e: EncounterState): string {
  const beat = m.beats.find((b) => b.id === e.beat) ?? m.beats[0];
  const q = beat.npc.find((l) => l.includes("?")) ?? beat.npc[0];
  return q;
}

/** Fala genérica demais ("Sei.", "Uhum."): vale completar com algo que leve a conversa adiante. */
export function isBland(text: string): boolean {
  return text.replace(/[^\p{L}]/gu, "").length < 22;
}

export function offTopic(c: Character): string | null {
  return TALK[c.id]?.foraDoAssunto ?? null;
}
