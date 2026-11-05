// Conquistas: verificadas depois de cada ação. Guardamos o dia em que cada uma foi obtida.

import type { GameState } from "./game";
import { levelOf, missionDone } from "./game";
import { CHARACTERS, DISTRICTS } from "../content";
import { CASES } from "../content/story";

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
  { id: "primeiro-acordo", title: "Primeiro aperto de mão", description: "Feche seu primeiro acordo.", icon: "handshake", test: (s) => s.stats.deals >= 1 },
  { id: "dez-acordos", title: "Mão firme", description: "Feche 10 acordos.", icon: "handshake", test: (s) => s.stats.deals >= 10 },
  { id: "trinta-acordos", title: "Conhecido na cidade inteira", description: "Feche 30 acordos.", icon: "crown", test: (s) => s.stats.deals >= 30 },
  { id: "perfeito", title: "Sem deixar dúvida", description: "Consiga um sucesso total.", icon: "star", test: (s) => s.stats.great >= 1 },
  { id: "cinco-perfeitos", title: "Mestre da conversa", description: "Consiga 5 sucessos totais.", icon: "star", test: (s) => s.stats.great >= 5 },
  { id: "ouvinte", title: "Bom ouvinte", description: "Descubra 5 necessidades escondidas.", icon: "ear", test: (s) => s.stats.needsFound >= 5 },
  { id: "detetive-alma", title: "Leitor de pessoas", description: "Descubra 20 necessidades escondidas.", icon: "eye", test: (s) => s.stats.needsFound >= 20 },
  { id: "vinte-pessoas", title: "Rede de contatos", description: "Conheça 20 moradores.", icon: "users", test: (s) => s.met.length >= 20 },
  { id: "todos", title: "Todo mundo sabe seu nome", description: `Conheça todos os ${CHARACTERS.length} personagens principais.`, icon: "users", test: (s) => CHARACTERS.every((c) => s.met.includes(c.id)) },
  { id: "amizade", title: "Amizade de verdade", description: "Chegue a 60 de afinidade com alguém.", icon: "heart", test: (s) => Object.values(s.relationships).some((r) => r.affinity >= 60) },
  { id: "honesto", title: "Palavra de honra", description: "Feche 10 acordos sem nunca ter uma mentira descoberta.", icon: "shield", test: (s) => s.stats.deals >= 10 && s.stats.liesCaught === 0 },
  { id: "pego", title: "Pego no pulo", description: "Tenha uma contradição descoberta.", icon: "alert", test: (s) => s.stats.liesCaught >= 1, secret: true },
  { id: "mil", title: "Primeiro milhar", description: "Junte ₢ 1.000.", icon: "coins", test: (s) => s.money >= 1000 },
  { id: "cinco-mil", title: "Vida confortável", description: "Junte ₢ 5.000.", icon: "coins", test: (s) => s.money >= 5000 },
  { id: "nivel-5", title: "Ganhando experiência", description: "Chegue ao nível 5.", icon: "trending", test: (s) => levelOf(s.xp).level >= 5 },
  { id: "nivel-10", title: "Veterano", description: "Chegue ao nível 10.", icon: "trending", test: (s) => levelOf(s.xp).level >= 10 },
  { id: "bairros", title: "Cidadão de Vila Áurea", description: "Visite todos os bairros.", icon: "map", test: (s) => DISTRICTS.every((d) => s.flags.includes(`visitou:${d.id}`)) },
  { id: "semana", title: "Uma semana na cidade", description: "Sobreviva 7 dias.", icon: "calendar", test: (s) => s.day >= 7 },
  { id: "investigador", title: "Investigador", description: "Resolva um caso na Central de Investigação.", icon: "search", test: (s) => Object.values(s.cases).some((c) => c.done) },
  { id: "todos-casos", title: "O Zênite caiu", description: "Resolva todos os casos.", icon: "search", test: (s) => CASES.every((c) => s.cases[c.id]?.done) },
  { id: "habilidades", title: "Especialista", description: "Aprenda 6 habilidades.", icon: "sparkles", test: (s) => s.perks.length >= 6 },
  { id: "metade", title: "Meio caminho", description: "Conclua 15 missões de personagens.", icon: "flag", test: (s) => done(s) >= 15 },
  { id: "todas", title: "Ninguém ficou sem resposta", description: "Conclua as 30 missões de personagens.", icon: "trophy", test: (s) => done(s) >= 30 },
  { id: "final", title: "Fim da história", description: "Chegue a um dos finais.", icon: "book", test: (s) => !!s.ending },
  { id: "final-arquiteto", title: "Arquiteto", description: "Alcance o melhor final.", icon: "crown", test: (s) => s.ending?.id === "arquiteto", secret: true },
];

/** Marca as conquistas novas; devolve o estado e a lista do que foi desbloqueado agora. */
export function checkAchievements(s: GameState): { state: GameState; unlocked: Achievement[] } {
  const unlocked = ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && a.test(s));
  if (!unlocked.length) return { state: s, unlocked };
  const achievements = { ...s.achievements };
  for (const a of unlocked) achievements[a.id] = s.day;
  return { state: { ...s, achievements }, unlocked };
}
