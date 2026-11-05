// Tipos centrais do jogo. O conteúdo (src/content) descreve personagens e missões com eles;
// a lógica (src/core) só lê esses dados, para que novas pessoas e missões entrem sem mexer no motor.

/** Atributos de uma conversa, de 0 a 100. */
export type Attr = "trust" | "interest" | "patience" | "suspicion" | "mood" | "credibility" | "affinity";
export type Attrs = Record<Attr, number>;

export const ATTRS: Attr[] = ["trust", "interest", "patience", "suspicion", "mood", "credibility", "affinity"];

export const ATTR_LABEL: Record<Attr, string> = {
  trust: "Confiança",
  interest: "Interesse",
  patience: "Paciência",
  suspicion: "Desconfiança",
  mood: "Humor",
  credibility: "Credibilidade",
  affinity: "Afinidade",
};

/** Abordagens que o jogador pode usar. Cada personagem reage de um jeito a cada uma. */
export type Tactic =
  | "explain"
  | "evidence"
  | "empathy"
  | "question"
  | "rapport"
  | "authority"
  | "socialProof"
  | "urgency"
  | "flattery"
  | "humor"
  | "concession"
  | "pressure"
  | "bluff"
  | "reframe"
  | "honesty"
  | "changeSubject"
  | "close"
  | "leave";

export const TACTIC_LABEL: Record<Tactic, string> = {
  explain: "Explicar",
  evidence: "Mostrar dados",
  empathy: "Ouvir e acolher",
  question: "Perguntar",
  rapport: "Criar conexão",
  authority: "Autoridade",
  socialProof: "Prova social",
  urgency: "Urgência",
  flattery: "Elogio",
  humor: "Humor",
  concession: "Ceder",
  pressure: "Pressionar",
  bluff: "Blefe",
  reframe: "Reenquadrar",
  honesty: "Franqueza",
  changeSubject: "Mudar de assunto",
  close: "Fazer a proposta",
  leave: "Encerrar",
};

/** Traços de personalidade, de 0 a 1. */
export interface Traits {
  /** Gosta de lógica e números; desconfia de apelos emocionais. */
  analytical: number;
  /** Valoriza acolhimento, histórias e conversa. */
  warmth: number;
  /** Sensível a status: gosta de respeito, odeia ser ensinado. */
  pride: number;
  /** Pune pressão, exagero e blefe. */
  skepticism: number;
  /** Perde a paciência rápido; gosta de objetividade. */
  impatience: number;
  /** Responde bem ao humor. */
  humor: number;
  /** Preocupado com dinheiro. */
  frugality: number;
  /** Gosta de risco e de oportunidades. */
  risk: number;
  /** Espera tratamento formal. */
  formality: number;
}

export type Mood = "neutral" | "happy" | "annoyed" | "suspicious" | "thinking" | "surprised" | "sad" | "angry";

/** Como o personagem recebeu a última fala do jogador. */
export type Reaction = "warm" | "interested" | "considering" | "amused" | "skeptical" | "impatient" | "offended" | "confused" | "neutral";

export interface Voice {
  greet: string[];
  greetAgain: string[];
  reactions: Record<Reaction, string[]>;
  farewellGood: string[];
  farewellBad: string[];
  walkout: string[];
  /** Quando percebe uma contradição. {before} = o que o jogador disse antes. */
  caughtLie: string[];
  /** Respostas a perguntas sobre necessidades antes de confiar no jogador. */
  deflect: string[];
}

/** Algo que o personagem precisa ou teme, escondido até ser descoberto. */
export interface Need {
  id: string;
  /** O que o jogador fica sabendo. */
  label: string;
  /** Fala do personagem ao revelar. */
  reveal: string;
  /** Abordagens que ficam mais fortes quando o jogador sabe disso. */
  boosts: Tactic[];
}

export interface SideOption {
  text: string;
  effect: Partial<Attrs>;
  reply: string;
  /** Resposta honesta, evasiva ou um blefe (pode virar contradição). */
  kind?: "honest" | "evasive" | "bluff";
  claim?: Claim;
}

/** Algo que acontece no meio da conversa (telefone toca, alguém chega). */
export interface Interruption {
  id: string;
  text: string;
  options: SideOption[];
}

/** Pergunta inesperada que o personagem faz para testar o jogador. */
export interface Probe {
  id: string;
  question: string;
  options: SideOption[];
}

export interface Claim {
  /** Assunto da afirmação (ex.: "prazo"). Duas afirmações com o mesmo assunto e valores diferentes são contradição. */
  key: string;
  value: string;
  /** Como a afirmação é lembrada ("o prazo é de duas semanas"). */
  label: string;
}

export interface Look {
  skin: string;
  hair: string;
  hairStyle: "short" | "bob" | "long" | "bun" | "curly" | "bald" | "buzz" | "wavy" | "ponytail" | "afro" | "slick" | "gray";
  eyes?: string;
  outfit: "suit" | "shirt" | "blouse" | "tee" | "apron" | "cardigan" | "uniform" | "hoodie" | "dress" | "jacket";
  outfitColor: string;
  accent: string;
  glasses?: boolean;
  beard?: "full" | "mustache" | "stubble" | "goatee";
  extra?: "earrings" | "pearls" | "tie" | "headscarf" | "cap" | "bowtie" | "necklace" | "beret" | "headphones";
  age: number;
}

export interface Character {
  id: string;
  name: string;
  nick?: string;
  age: number;
  role: string;
  district: string;
  /** 1 (baixa renda) a 5 (elite). */
  socialClass: number;
  bio: string;
  family: string;
  finances: string;
  /** 1 a 5: percebe contradições e exageros. */
  intelligence: number;
  /** 1 a 5: desconfiança de partida. */
  suspicion: number;
  /** Humor médio (0–100). */
  baseMood: number;
  traits: Traits;
  likes: string[];
  dislikes: string[];
  /** Limites: assuntos ou atitudes que encerram a conversa. */
  limits: string[];
  /** Assuntos para criar conexão. */
  interests: { topic: string; line: string; reply: string }[];
  needs: Need[];
  voice: Voice;
  interruptions: Interruption[];
  probes: Probe[];
  /** Informações públicas (app Contatos). */
  publicInfo: string[];
  /** Revelado pelo Dossiê. */
  secret: string;
  /** Horário em que costuma estar disponível (horas do dia). */
  hours: [number, number];
  look: Look;
}

// ---------- Missões ----------

export interface MissionOption {
  id: string;
  text: string;
  tactic: Tactic;
  /** Só aparece se o jogador conhece esta necessidade. */
  needs?: string;
  requiresItem?: string;
  requiresPerk?: string;
  /** Afirmação feita pelo jogador. */
  claim?: Claim;
  /** false = blefe (afirmação falsa que pode ser descoberta). */
  truthful?: boolean;
  /** Necessidade revelada se a fala funcionar. */
  reveals?: string;
  /** Ajuste extra além do efeito da abordagem. */
  mod?: Partial<Attrs>;
  /** Resposta roteirizada (se a reação for boa ou ruim). */
  reply?: string | { good: string; bad: string };
  next?: string;
  /** Marca na missão (para condições). */
  flag?: string;
  ifFlag?: string;
  notFlag?: string;
  /** Só aparece se este marco da história já aconteceu (ex.: "caderno-valdir"). */
  ifWorld?: string;
  /** Gasto do jogador (ex.: pagar um café). */
  cost?: number;
}

export interface Beat {
  id: string;
  /** Falas do personagem ao chegar nesta etapa (uma é sorteada). */
  npc: string[];
  options: MissionOption[];
  /** A proposta pode ser feita a partir desta etapa. */
  canClose?: boolean;
}

export interface Negotiation {
  item: string;
  /** O personagem vende (true) ou compra (false)? */
  npcSells: boolean;
  /** Primeiro preço que o personagem fala. */
  anchor: number;
  /** Preço justo de mercado. */
  fair: number;
  /** Até onde o personagem aceitaria, no melhor clima possível. */
  limit: number;
  /** Teto (se o jogador compra) ou piso (se vende) definido pelo cliente. */
  clientLimit: number;
}

export type MissionType = "pitch" | "negotiation" | "mediation" | "investigation" | "favor" | "contract" | "duel";

export interface Mission {
  id: string;
  title: string;
  npc: string;
  district: string;
  type: MissionType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  chapter?: number;
  story?: boolean;
  requires: { level?: number; rep?: number; missions?: string[]; chapter?: number; flags?: string[]; item?: string };
  /** Quem contratou o jogador. */
  client: string;
  brief: string;
  objective: string;
  start?: Partial<Attrs>;
  /** Pontuação mínima para a proposta ser aceita. */
  threshold: number;
  beats: Beat[];
  negotiation?: Negotiation;
  rewards: { money: number; xp: number; rep: number };
  endings: { great: string; good: string; partial: string; fail: string; walkout: string };
  /** Mensagens que o personagem manda depois. */
  followUp?: { great?: string; good?: string; fail?: string };
  flagsOnSuccess?: string[];
  /** Duração estimada (minutos de jogo). */
  minutes: number;
}

export type Outcome = "great" | "good" | "partial" | "fail" | "walkout" | "left";

export const OUTCOME_LABEL: Record<Outcome, string> = {
  great: "Sucesso total",
  good: "Acordo fechado",
  partial: "Meio-termo",
  fail: "Recusado",
  walkout: "Foi embora",
  left: "Você encerrou",
};
