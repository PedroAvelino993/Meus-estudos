// Conquistas: calculadas a partir do estado, nunca por clique.

import { ALPHABET, CONVERSATIONS } from "../content";
import { mastery } from "./srs";
import type { StudentState } from "./state";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  test: (s: StudentState) => boolean;
}

const total = (s: StudentState, k: "reviews" | "typed" | "audio") => Object.values(s.days).reduce((a, d) => a + (d[k] ?? 0), 0);
const words = (s: StudentState) => Object.values(s.items).filter((i) => i.id.startsWith("W:"));

export const ACHIEVEMENTS: Achievement[] = [
  { id: "primeira-letra", title: "Primeira letra", description: "Aprendeu a sua primeira letra cirílica.", icon: "type", test: (s) => Object.values(s.items).some((i) => i.id.startsWith("L:") && i.right > 0) },
  { id: "primeira-licao", title: "Primeiro passo", description: "Concluiu a primeira lição.", icon: "footprints", test: (s) => Object.values(s.lessons).some((l) => l.passed) },
  { id: "alfabeto", title: "33 de 33", description: "Acertou exercícios com todas as letras do alfabeto.", icon: "languages", test: (s) => ALPHABET.every((l) => (s.items[`L:${l.lower}`]?.right ?? 0) > 0) },
  { id: "leitor", title: "Leitor de placas", description: "Passou na prova do alfabeto.", icon: "book-open", test: (s) => !!s.tests["u1-6"]?.passed },
  { id: "perfeita", title: "Lição perfeita", description: "Terminou uma lição com 90% ou mais de acerto.", icon: "star", test: (s) => Object.values(s.lessons).some((l) => l.gold) },
  { id: "dez-licoes", title: "Dez lições", description: "Concluiu dez lições.", icon: "layers", test: (s) => Object.values(s.lessons).filter((l) => l.passed).length >= 10 },
  { id: "primeira-conversa", title: "Primeira conversa", description: "Terminou uma conversa em russo.", icon: "messages-square", test: (s) => Object.values(s.convos).some((c) => c.completed > 0) },
  { id: "todas-conversas", title: "Bom de papo", description: "Terminou todas as conversas disponíveis.", icon: "users", test: (s) => CONVERSATIONS.every((c) => (s.convos[c.id]?.completed ?? 0) > 0) },
  { id: "historia", title: "Morador da cidade", description: "Viveu quatro capítulos da história.", icon: "map", test: (s) => Object.values(s.chapters).filter((c) => c.done).length >= 4 },
  { id: "vocab-50", title: "50 palavras", description: "Viu 50 palavras e expressões.", icon: "library", test: (s) => words(s).filter((i) => i.seen > 0).length >= 50 },
  { id: "dominio-10", title: "Memória de ferro", description: "Dominou 10 palavras de verdade (revisadas ao longo de semanas).", icon: "brain", test: (s) => words(s).filter((i) => mastery(i) === "dominado").length >= 10 },
  { id: "revisor", title: "Revisor", description: "Fez 100 revisões.", icon: "rotate-ccw", test: (s) => total(s, "reviews") >= 100 },
  { id: "escriba", title: "Escriba", description: "Escreveu 50 respostas certas em cirílico.", icon: "keyboard", test: (s) => total(s, "typed") >= 50 },
  { id: "ouvinte", title: "Bom ouvinte", description: "Acertou 50 exercícios de áudio.", icon: "headphones", test: (s) => total(s, "audio") >= 50 },
  { id: "sequencia-3", title: "Três dias", description: "Estudou três dias seguidos.", icon: "flame", test: (s) => s.streak.best >= 3 },
  { id: "sequencia-7", title: "Uma semana", description: "Estudou sete dias seguidos.", icon: "flame", test: (s) => s.streak.best >= 7 },
  { id: "sequencia-30", title: "Um mês", description: "Estudou trinta dias seguidos.", icon: "crown", test: (s) => s.streak.best >= 30 },
];

export function checkAchievements(s: StudentState, now: number): { state: StudentState; unlocked: Achievement[] } {
  const unlocked = ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && a.test(s));
  if (!unlocked.length) return { state: s, unlocked };
  const achievements = { ...s.achievements };
  for (const a of unlocked) achievements[a.id] = now;
  return { state: { ...s, achievements }, unlocked };
}
