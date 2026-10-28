// Personagens fictícios de Светлоре́ченск, a cidade da história.

export type Mood = "neutral" | "happy" | "thinking" | "surprised" | "sad";

export interface PortraitLook {
  skin: string;
  hair: string;
  /** Estilo do cabelo (desenhado em components/Portrait.tsx). */
  hairStyle: "bob" | "long" | "short" | "bun" | "curly" | "buzz";
  eyes: string;
  shirt: string;
  accent: string;
  accessory?: "glasses" | "headphones" | "scarf" | "apron" | "beret" | "earrings";
  beard?: boolean;
}

export interface Character {
  id: string;
  ru: string;
  name: string;
  age: number;
  role: string;
  bio: string;
  personality: string;
  speech: string;
  look: PortraitLook;
  /** Ajuste da voz sintetizada (tom e velocidade relativa). */
  voice: { pitch: number; rate: number; female: boolean };
  color: string;
}

export const CHARACTERS: Character[] = [
  {
    id: "anya",
    ru: "А'ня",
    name: "Anya",
    age: 20,
    role: "Estudante de jornalismo",
    bio: "Nasceu em Moscou e se mudou para Светлоре́ченск para estudar. Mora com a mãe e o gato Ба́рсик, trabalha meio período na rádio da universidade e quer conhecer o Brasil.",
    personality: "Simpática, curiosa e falante. Faz muitas perguntas e adora apresentar pessoas.",
    speech: "Informal (ты), frases curtas, muitas exclamações: Здо́рово! Кла́сс!",
    look: { skin: "#F2D3BD", hair: "#C9853F", hairStyle: "bob", eyes: "#5B7A3A", shirt: "#E05A47", accent: "#FFD166", accessory: "earrings" },
    voice: { pitch: 1.15, rate: 1, female: true },
    color: "#E05A47",
  },
  {
    id: "maksim",
    ru: "Макси'м",
    name: "Maksim",
    age: 23,
    role: "Programador e gamer",
    bio: "Desenvolve jogos numa pequena empresa do centro. Passa os fins de semana entre futebol, games e séries. Divide o apartamento com o irmão mais novo.",
    personality: "Descontraído e engraçado. Fala de tecnologia, jogos e cultura pop.",
    speech: "Bem informal, usa gírias leves: Кла́сс! Кру́то! Дава́й!",
    look: { skin: "#E8C2A0", hair: "#2F2A28", hairStyle: "short", eyes: "#3B4A63", shirt: "#2E8B83", accent: "#9CE0D8", accessory: "headphones" },
    voice: { pitch: 0.9, rate: 1.05, female: false },
    color: "#2E8B83",
  },
  {
    id: "irina",
    ru: "Ири'на Петро'вна",
    name: "Irina Petrovna",
    age: 47,
    role: "Professora de russo para estrangeiros",
    bio: "Ensina russo na universidade há vinte anos. Já morou um ano em Lisboa e entende um pouco de português, mas prefere que os alunos falem russo.",
    personality: "Paciente, exigente e calorosa. Corrige com gentileza e sempre dá um exemplo.",
    speech: "Formal (вы), clara e pausada. Os alunos a chamam pelo nome e patronímico.",
    look: { skin: "#EFD0B8", hair: "#6B4A3A", hairStyle: "bun", eyes: "#4A5A70", shirt: "#3D4B8C", accent: "#C9D3FF", accessory: "glasses" },
    voice: { pitch: 1.0, rate: 0.9, female: true },
    color: "#3D4B8C",
  },
  {
    id: "dmitry",
    ru: "Дми'трий",
    name: "Dmitri",
    age: 31,
    role: "Barista do café «Самова́р»",
    bio: "Dono de um bigode famoso e de uma coleção de samovares antigos. Conhece todos os clientes pelo nome e sabe o pedido de cada um.",
    personality: "Educado, atencioso e um pouco brincalhão quando já conhece o cliente.",
    speech: "Formal com clientes (вы), frases de atendimento: Что вы бу́дете? Прия́тного аппети́та!",
    look: { skin: "#E6BC98", hair: "#4A3326", hairStyle: "buzz", eyes: "#3A3A3A", shirt: "#F4EDE1", accent: "#8C5A3C", accessory: "apron", beard: true },
    voice: { pitch: 0.8, rate: 0.95, female: false },
    color: "#8C5A3C",
  },
  {
    id: "sofiya",
    ru: "Софи'я",
    name: "Sofia",
    age: 28,
    role: "Engenheira e viajante",
    bio: "Engenheira de São Petersburgo que morou dois anos em São Paulo. Viaja sempre que pode e coleciona histórias de comida de cada cidade.",
    personality: "Aventureira, otimista e direta. Adora comparar culturas.",
    speech: "Começa formal com desconhecidos e passa rápido para o ты. Mistura uma palavra em português de vez em quando.",
    look: { skin: "#D9A57E", hair: "#1F1A1A", hairStyle: "curly", eyes: "#3A2A20", shirt: "#F2A541", accent: "#7B4BC4", accessory: "beret" },
    voice: { pitch: 1.05, rate: 1.05, female: true },
    color: "#F2A541",
  },
];

export function characterOf(id: string): Character {
  const c = CHARACTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Personagem desconhecido: ${id}`);
  return c;
}
