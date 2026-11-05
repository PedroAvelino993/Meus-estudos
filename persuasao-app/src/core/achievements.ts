// Conquistas: verificadas depois de cada ação. Guardamos o dia em que cada uma foi obtida.

import type { GameState } from "./game";
import { levelOf, missionDone } from "./game";
import { CHARACTERS, DISTRICTS } from "../content";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  test: (s: GameState) => boolean;
  /** Escondida até ser conquistada. */
  secret?: boolean;
}

const done = (s: GameState) => Object.keys(s.missions).filter((id) => missionDone(s, id)).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: "primeiro-acordo", title: "Primeira vítima", description: "Aplique o seu primeiro golpe.", icon: "handshake", test: (s) => s.stats.deals >= 1 },
  { id: "dez-acordos", title: "Mão leve", description: "Aplique 10 golpes.", icon: "handshake", test: (s) => s.stats.deals >= 10 },
  { id: "trinta-acordos", title: "Lenda do submundo", description: "Aplique 30 golpes.", icon: "crown", test: (s) => s.stats.deals >= 30 },
  { id: "perfeito", title: "Golpe perfeito", description: "Aplique um golpe perfeito.", icon: "star", test: (s) => s.stats.great >= 1 },
  { id: "cinco-perfeitos", title: "Artista do golpe", description: "Aplique 5 golpes perfeitos.", icon: "star", test: (s) => s.stats.great >= 5 },
  { id: "ouvinte", title: "Ouvido atento", description: "Descubra 5 pontos fracos.", icon: "ear", test: (s) => s.stats.needsFound >= 5 },
  { id: "detetive-alma", title: "Leitor de vítimas", description: "Descubra 20 pontos fracos.", icon: "eye", test: (s) => s.stats.needsFound >= 20 },
  { id: "vinte-pessoas", title: "Lista de alvos", description: "Conheça 20 moradores.", icon: "users", test: (s) => s.met.length >= 20 },
  { id: "todos", title: "Ninguém escapa", description: `Conheça todos os ${CHARACTERS.length} personagens principais.`, icon: "users", test: (s) => CHARACTERS.every((c) => s.met.includes(c.id)) },
  { id: "amizade", title: "Amigo da vítima", description: "Chegue a 60 de afinidade com alguém.", icon: "heart", test: (s) => Object.values(s.relationships).some((r) => r.affinity >= 60) },
  { id: "honesto", title: "Cara de pau", description: "Aplique 10 golpes sem nunca ter uma mentira descoberta.", icon: "shield", test: (s) => s.stats.deals >= 10 && s.stats.liesCaught === 0 },
  { id: "pego", title: "Pego no pulo", description: "Tenha uma contradição descoberta.", icon: "alert", test: (s) => s.stats.liesCaught >= 1, secret: true },
  { id: "mil", title: "Primeiro milhar", description: "Junte ₢ 1.000.", icon: "coins", test: (s) => s.money >= 1000 },
  { id: "cinco-mil", title: "Vida confortável", description: "Junte ₢ 5.000.", icon: "coins", test: (s) => s.money >= 5000 },
  { id: "nivel-5", title: "Ganhando experiência", description: "Chegue ao nível 5.", icon: "trending", test: (s) => levelOf(s.xp).level >= 5 },
  { id: "nivel-10", title: "Veterano", description: "Chegue ao nível 10.", icon: "trending", test: (s) => levelOf(s.xp).level >= 10 },
  { id: "bairros", title: "A cidade é sua", description: "Visite todos os bairros.", icon: "map", test: (s) => DISTRICTS.every((d) => s.flags.includes(`visitou:${d.id}`)) },
  { id: "semana", title: "Uma semana na cidade", description: "Sobreviva 7 dias.", icon: "calendar", test: (s) => s.day >= 7 },
  { id: "investigador", title: "Receptação", description: "Venda ou use 5 itens do butim.", icon: "search", test: (s) => s.transactions.filter((t) => t.category === "butim").length >= 5 },
  { id: "todos-casos", title: "Ficha suja", description: "Seja preso e volte ao jogo.", icon: "alert", test: (s) => s.arrests >= 1, secret: true },
  { id: "sangue-frio", title: "Sangue-frio", description: "Termine um dia com o calor acima de 80 sem ser preso.", icon: "shield", test: (s) => s.heat >= 80 },
  { id: "zenite", title: "Dono do pedaço", description: "Derrube o Diego e assuma a rota do Zênite.", icon: "crown", test: (s) => s.flags.includes("diego-derrubado") },
  { id: "habilidades", title: "Especialista", description: "Aprenda 6 habilidades.", icon: "sparkles", test: (s) => s.perks.length >= 6 },
  { id: "metade", title: "Meio caminho", description: "Aplique 15 golpes de história em personagens.", icon: "flag", test: (s) => done(s) >= 15 },
  { id: "todas", title: "Ninguém ficou de fora", description: "Aplique os 30 golpes de personagens.", icon: "trophy", test: (s) => done(s) >= 30 },
  { id: "final", title: "Fim da história", description: "Chegue a um dos finais.", icon: "book", test: (s) => !!s.ending },
  { id: "final-arquiteto", title: "Fantasma", description: "Alcance o final do fantasma de Vila Áurea.", icon: "crown", test: (s) => s.ending?.id === "fantasma", secret: true },
];

/** Marca as conquistas novas; devolve o estado e a lista do que foi desbloqueado agora. */
export function checkAchievements(s: GameState): { state: GameState; unlocked: Achievement[] } {
  const unlocked = ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && a.test(s));
  if (!unlocked.length) return { state: s, unlocked };
  const achievements = { ...s.achievements };
  for (const a of unlocked) achievements[a.id] = s.day;
  return { state: { ...s, achievements }, unlocked };
}
