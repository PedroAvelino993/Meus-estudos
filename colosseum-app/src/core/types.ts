// Tipos centrais do COLOSSEUM INC. O conteúdo (src/content) descreve modalidades, árvore,
// construções, regiões, crises e personagens; a lógica (src/core) só lê esses dados.

export type Specialty = "demonstracao" | "habilidade" | "torneio" | "espetaculo" | "biga" | "naval";

export const SPECIALTY_LABEL: Record<Specialty, string> = {
  demonstracao: "Combate de demonstração",
  habilidade: "Competições de habilidade",
  torneio: "Grandes torneios",
  espetaculo: "Espetáculos e encenação",
  biga: "Corridas de bigas",
  naval: "Batalhas navais e aquáticas",
};

export type Personality = "disciplinado" | "competitivo" | "ambicioso" | "carismatico" | "temperamental" | "leal" | "preguicoso" | "showman";

export const PERSONALITY_LABEL: Record<Personality, string> = {
  disciplinado: "Disciplinado",
  competitivo: "Competitivo",
  ambicioso: "Ambicioso",
  carismatico: "Carismático",
  temperamental: "Temperamental",
  leal: "Leal",
  preguicoso: "Preguiçoso",
  showman: "Showman",
};

export interface Look {
  skin: string;
  hair: string;
  hairStyle: "curto" | "longo" | "careca" | "trancas" | "cacheado" | "rabo";
  beard: "nenhuma" | "curta" | "cheia" | "bigode";
  helmet: "nenhum" | "galea" | "murmillo" | "tracio" | "coroa";
  armor: string;
  scar: boolean;
}

export interface Gladiator {
  id: string;
  name: string;
  age: number;
  origin: string;
  specialty: Specialty;
  personality: Personality;
  /** Atributos de 0 a 100. */
  strength: number;
  technique: number;
  charisma: number;
  stamina: number;
  /** Fama (0–100): vende ingressos. */
  fame: number;
  /** Simpatia do público (0–100). */
  popularity: number;
  xp: number;
  /** Condição física (0–100). */
  condition: number;
  morale: number;
  salary: number;
  bio: string;
  look: Look;
  legend?: boolean;
  wins: number;
  losses: number;
  events: number;
  injuredWeeks: number;
  /** Semanas restantes de contrato (0 = sem prazo). */
  history: string[];
  /** Fama no começo do período (para mercados de previsão). */
  fameMark: number;
  hiredWeek: number;
  /** O que faz nas semanas sem evento. */
  focus?: "forca" | "tecnica" | "carisma" | "resistencia" | "descanso";
}

export interface Relation {
  a: string;
  b: string;
  kind: "rivalidade" | "amizade";
  intensity: number;
  /** Placar do confronto direto (a × b). */
  aWins: number;
  bWins: number;
  story: string;
}

// ---------- Modalidades ----------

export interface Modality {
  id: string;
  name: string;
  description: string;
  /** Atração base (multiplica a demanda). */
  appeal: number;
  /** Custo fixo de produção. */
  cost: number;
  /** Preço de referência relativo (1 = normal). */
  priceMult: number;
  /** Especialidades que brilham aqui. */
  specialties: Specialty[];
  minGladiators: number;
  maxGladiators: number;
  /** Risco de lesão (0–1). */
  danger: number;
  /** Desgaste físico. */
  fatigue: number;
  /** Exige estes nós da árvore/construções. */
  requires: { node?: string; infra?: Record<string, number> };
  /** Recompensas extras de pontos de evolução na primeira vez. */
  firstTimeEp: number;
  /** Ganhos de prestígio. */
  prestige: number;
  /** Funciona como festival (várias atrações). */
  festival?: boolean;
  /** Fictícia/inovadora. */
  original?: boolean;
  night?: boolean;
}

// ---------- Árvore de evolução ----------

export type TreeCategory = "espetaculos" | "infraestrutura" | "gladiadores" | "marketing" | "economia" | "prestigio";

export const CATEGORY_LABEL: Record<TreeCategory, string> = {
  espetaculos: "Espetáculos",
  infraestrutura: "Infraestrutura",
  gladiadores: "Gladiadores",
  marketing: "Marketing",
  economia: "Administração",
  prestigio: "Prestígio",
};

/** Modificadores somados de toda a organização. */
export interface Mods {
  demand: number;
  satisfaction: number;
  priceRef: number;
  food: number;
  commerce: number;
  sponsor: number;
  popGain: number;
  fameGain: number;
  epGain: number;
  salary: number;
  upkeep: number;
  training: number;
  injury: number;
  recovery: number;
  marketing: number;
  prestigeGain: number;
  rivalResist: number;
  expansionCost: number;
  capacity: number;
  gladiatorFame: number;
  favor: number;
  staffMorale: number;
  betsParticipants: number;
  betsAccuracy: number;
  betsCredibility: number;
  betsEngagement: number;
  betsChips: number;
  scoutQuality: number;
  regionDemand: number;
}

export type ModKey = keyof Mods;

export interface TreeNode {
  id: string;
  name: string;
  category: TreeCategory | BetsBranch;
  /** Ramo dentro da categoria (linha da árvore). */
  branch: string;
  tier: number;
  cost: number;
  description: string;
  requires: string[];
  /** Não pode coexistir com estes. */
  excludes?: string[];
  effects?: Partial<Mods>;
  /** Desbloqueios de funcionalidades. */
  unlocks?: string[];
  era?: number;
}

export type BetsBranch = "mercados" | "estatisticas" | "entretenimento" | "bets-gladiadores" | "competicao";

// ---------- Construções ----------

export interface Building {
  id: string;
  name: string;
  description: string;
  levels: { cost: number; label: string; value: number; era?: number; node?: string }[];
  /** O que o "value" significa. */
  unit: string;
  upkeep: number;
}

// ---------- Mundo ----------

export interface Region {
  id: string;
  name: string;
  description: string;
  population: number;
  interest: number;
  wealth: number;
  competition: number;
  cost: number;
  /** Fama e prestígio mínimos para abrir uma filial. */
  minFame: number;
  minPrestige: number;
  era: number;
  /** Modalidades preferidas (multiplicador). */
  likes: Record<string, number>;
  culture: string;
  /** Posição no mapa (viewBox 1000×560). */
  path: string;
  label: [number, number];
}

export interface Branch {
  region: string;
  /** Nível da arena da filial (capacidade). */
  level: number;
  popularity: number;
  openedWeek: number;
  delegated: boolean;
  lastEventWeek: number;
}

// ---------- Eventos ----------

export type EventMode = "livre" | "roteirizado";

export interface DecreeStory {
  id: string;
  name: string;
  description: string;
  needs: "rivalidade" | "desconhecido" | "campeao" | "amizade" | "nenhum";
  bonus: number;
}

export interface Decree {
  winner: string;
  surprise?: string;
  twist: "nenhuma" | "inicio" | "meio" | "final";
  story: string;
  /** Fama extra planejada para cada participante. */
  fame: Record<string, number>;
}

export interface EventPlan {
  id: string;
  name: string;
  modality: string;
  venue: string;
  gladiators: string[];
  capacity: number;
  price: number;
  decoration: number;
  marketing: number;
  days: number;
  extras: string[];
  mode: EventMode;
  decree?: Decree;
  plannedWeek: number;
  auto?: boolean;
}

export interface Bout {
  a: string;
  b: string;
  winner: string;
  close: boolean;
  note: string;
}

export interface EventReport {
  id: string;
  week: number;
  name: string;
  modality: string;
  venue: string;
  mode: EventMode;
  attendance: number;
  capacity: number;
  satisfaction: number;
  revenue: { tickets: number; food: number; commerce: number; sponsor: number };
  costs: { production: number; decoration: number; marketing: number; extras: number; medical: number };
  profit: number;
  popularity: number;
  fame: number;
  prestige: number;
  ep: number;
  bouts: Bout[];
  winner: string | null;
  /** Classificação final e vitórias de cada um (resultado do motor). */
  ranking: string[];
  wins: Record<string, number>;
  injuries: string[];
  highlights: string[];
  record: boolean;
}

// ---------- Estimativa ----------

export interface Estimate {
  attendance: number;
  satisfaction: number;
  revenue: number;
  cost: number;
  profit: number;
  popularity: number;
  ep: number;
  notes: string[];
}

// ---------- Arena Bets ----------

export type MarketType = "vencedor" | "popular" | "desempenho" | "frequencia" | "confronto" | "recorde" | "revelacao" | "rivalidade";

export interface MarketOption {
  id: string;
  label: string;
  /** Probabilidade calculada pelo modelo estatístico. */
  model: number;
  /** Probabilidade publicada pelo administrador. */
  published: number;
  /** Fichas fictícias colocadas nesta opção. */
  chips: number;
  picks: number;
}

export interface Market {
  id: string;
  type: MarketType;
  name: string;
  description: string;
  eventId?: string;
  /** Referências para resolver (ids de gladiadores, limiar…). */
  ref: Record<string, string | number>;
  options: MarketOption[];
  openWeek: number;
  closeWeek: number;
  status: "aberto" | "resolvido" | "cancelado";
  result?: string;
  participants: number;
  /** Limite de fichas por previsão. */
  maxChips: number;
  rules: string;
  /** O administrador publicou probabilidades próprias. */
  custom: boolean;
  brier?: number;
  special?: boolean;
}

export interface Predictor {
  id: string;
  name: string;
  city: string;
  chips: number;
  correct: number;
  total: number;
  streak: number;
  bestStreak: number;
  title?: string;
  weekGain: number;
}

export interface BetsState {
  unlocked: string[];
  markets: Market[];
  credibility: number;
  popularity: number;
  participants: number;
  totalPredictions: number;
  chipsDistributed: number;
  weeklyChips: number;
  maxChipsPerPick: number;
  transparency: number;
  ruleClarity: number;
  predictors: Predictor[];
  accuracyHistory: number[];
  points: number;
  /** Série semanal para o Painel do Mercado. */
  history: { week: number; participants: number; rival: number; credibility: number; chips: number }[];
  /** Valor de mercado de cada gladiador na semana anterior (cotação). */
  quotes: Record<string, number>;
}

// ---------- Rival ----------

export interface RivalState {
  active: boolean;
  name: string;
  money: number;
  fame: number;
  capacity: number;
  tech: number;
  gladiators: Gladiator[];
  regions: Record<string, number>;
  strategy: "agressiva" | "estrelas" | "marketing" | "expansao" | "inovacao";
  lastAction: string;
  log: string[];
  betsParticipants: number;
  favor: number;
  coalition?: boolean;
  defeated?: boolean;
  weeksDominant: number;
  /** Ímpeto (0,2–1,6): sobe quando o rival ganha disputas, cai quando perde. */
  momentum?: number;
  /** Semana da última campanha do jogador contra este rival. */
  campaignWeek?: number;
  /** Semana do último grande espetáculo de reação. */
  reactionWeek?: number;
}

/** Disputa por um contrato de patrocínio (competição por contratos). */
export interface Bid {
  id: string;
  name: string;
  weekly: number;
  weeks: number;
  deadline: number;
  player: number;
  rival: number;
}

/** Jogos internacionais: cada organização manda um campeão. */
export interface International {
  week: number;
  modality: string;
  city: string;
  champion: string | null;
}

// ---------- Crises ----------

export interface CrisisChoice {
  label: string;
  detail: string;
  /** Efeito aplicado (ver core/crises.ts). */
  effect: Partial<Record<CrisisStat, number>>;
  cost?: number;
  flag?: string;
  /** Exige dinheiro mínimo. */
  needsMoney?: number;
}

export type CrisisStat = "money" | "popularity" | "fame" | "prestige" | "favor" | "staffMorale" | "condition" | "satisfaction" | "ep" | "rivalPop" | "credibility" | "authenticity";

export interface Crisis {
  id: string;
  title: string;
  text: string;
  minEra: number;
  weight: number;
  choices: CrisisChoice[];
  /** Missão com prazo (ex.: governante exige espetáculo). */
  quest?: { modality?: string; minSatisfaction: number; weeks: number; reward: Partial<Record<CrisisStat, number>>; penalty: Partial<Record<CrisisStat, number>> };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  modality?: string;
  minSatisfaction: number;
  deadline: number;
  reward: Partial<Record<CrisisStat, number>>;
  penalty: Partial<Record<CrisisStat, number>>;
}

// ---------- Registro ----------

export interface LogEntry {
  week: number;
  text: string;
  kind: "evento" | "crise" | "rival" | "gladiador" | "construcao" | "evolucao" | "mundo" | "era" | "bets" | "economia" | "conquista";
}

export interface Ledger {
  week: number;
  income: number;
  expenses: number;
  balance: number;
  attendance: number;
  popularity: number;
  fame: number;
  rivalFame: number;
}
