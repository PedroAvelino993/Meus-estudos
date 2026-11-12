// Estado completo da partida e criação de uma nova campanha.

import type { BetsState, Bid, Branch, International, EventPlan, EventReport, Gladiator, Ledger, LogEntry, Mods, Quest, Relation, RivalState } from "./types";
import { CHARACTERS, PREDICTOR_NAMES, fromCharacter, generateGladiator } from "../content/gladiators";
import { BUILDINGS } from "../content/world";
import { hash, rngFrom } from "./rng";

export const SAVE_VERSION = 1;

export interface TempMod {
  key: keyof Mods;
  value: number;
  weeks: number;
  label: string;
}

export interface PendingOffer {
  id: string;
  gladiator: string;
  amount: number;
  deadline: number;
}

export interface Contract {
  id: string;
  name: string;
  weekly: number;
  weeksLeft: number;
}

export interface Custom {
  name: string;
  tema: string;
  cenario: string;
  efeito: string;
}

export interface WeekSummary {
  week: number;
  reports: EventReport[];
  income: number;
  expenses: number;
  breakdown: { label: string; amount: number }[];
  news: string[];
  markets: string[];
}

export interface GameState {
  version: number;
  seed: number;
  counter: number;
  week: number;
  era: number;
  name: string;
  money: number;
  ep: number;
  popularity: number;
  fame: number;
  prestige: number;
  favor: number;
  staffMorale: number;
  authenticity: number;
  satisfaction: number;
  buildings: Record<string, number>;
  nodes: string[];
  gladiators: Gladiator[];
  market: Gladiator[];
  /** Interesse do rival em gladiadores do mercado (id → semana em que ele contrata). */
  rivalInterest: Record<string, number>;
  relations: Relation[];
  staff: Record<string, number>;
  managers: string[];
  automation: Record<string, boolean>;
  branches: Branch[];
  plans: EventPlan[];
  reports: EventReport[];
  records: { attendance: number; revenue: number; satisfaction: number };
  modalitiesDone: string[];
  custom: Custom | null;
  bets: BetsState;
  rival: RivalState;
  league: RivalState | null;
  pendingCrises: string[];
  quests: Quest[];
  offers: PendingOffer[];
  contracts: Contract[];
  bids: Bid[];
  international: International | null;
  tempMods: TempMod[];
  flags: string[];
  log: LogEntry[];
  ledger: Ledger[];
  stats: {
    events: number;
    scripted: number;
    free: number;
    spectators: number;
    revenue: number;
    hires: number;
    builds: number;
    crises: number;
    weeksRed: number;
    totalEp: number;
    redStreak: number;
    popZero: number;
    favorZero: number;
    rivalDominance: number;
    internationals: number;
    internationalWins: number;
    leagueCrushed: number;
    /** Semanas com clara superioridade sobre a Dominus. */
    superiorWeeks: number;
    leagueSuperior: number;
  };
  achievements: Record<string, number>;
  tutorialDone: string[];
  tutorialOff: boolean;
  victory: { week: number } | null;
  defeat: { week: number; reason: string } | null;
  infinite: boolean;
  /** Arco de temporada do Decreto Imperial. */
  arc: { hero: string; villain: string; until: number } | null;
  lastSummary: WeekSummary | null;
  /** Gladiadores que começaram com pouca fama (para conquistas). */
  rookies: string[];
  priceHint: Record<string, number>;
}

export function newBets(): BetsState {
  return {
    unlocked: ["bm-vencedor"],
    markets: [],
    credibility: 55,
    popularity: 10,
    participants: 0,
    totalPredictions: 0,
    chipsDistributed: 0,
    weeklyChips: 2000,
    maxChipsPerPick: 50,
    transparency: 60,
    ruleClarity: 60,
    predictors: PREDICTOR_NAMES.map(([name, city], i) => ({ id: `p${i}`, name, city, chips: 100, correct: 0, total: 0, streak: 0, bestStreak: 0, weekGain: 0 })),
    accuracyHistory: [],
    points: 0,
    history: [],
    quotes: {},
  };
}

export function newRival(): RivalState {
  return { active: false, name: "Dominus Arena", money: 8000, fame: 0, capacity: 1500, tech: 1, gladiators: [], regions: {}, strategy: "estrelas", lastAction: "", log: [], betsParticipants: 0, favor: 30, weeksDominant: 0 };
}

export function newGame(name: string, seed = Date.now()): GameState {
  const r = rngFrom(seed >>> 0);
  const buildings: Record<string, number> = {};
  for (const b of BUILDINGS) buildings[b.id] = 0;
  // Três gladiadores desconhecidos
  const start = ["maximus", "kaeso", "aurelio"].map((id) => fromCharacter(CHARACTERS.find((c) => c.id === id)!));
  for (const g of start) {
    g.fame = Math.min(g.fame, 18);
    g.wins = 0;
    g.losses = 0;
    g.events = 0;
    g.xp = 0;
  }
  let s: GameState = {
    version: SAVE_VERSION,
    seed: seed >>> 0,
    counter: 1,
    week: 1,
    era: 1,
    name: name.trim() || "Coliseu do Tibre",
    money: 4000,
    ep: 2,
    popularity: 8,
    fame: 5,
    prestige: 0,
    favor: 40,
    staffMorale: 70,
    authenticity: 100,
    satisfaction: 60,
    buildings,
    nodes: [],
    gladiators: start.map((g) => ({ ...g, fameMark: g.fame })),
    market: [],
    rivalInterest: {},
    relations: [],
    staff: { organizadores: 1, tratadores: 1, vendedores: 1, segurancas: 0, administradores: 0, olheiros: 0 },
    managers: [],
    automation: {},
    branches: [],
    plans: [],
    reports: [],
    records: { attendance: 0, revenue: 0, satisfaction: 0 },
    modalitiesDone: [],
    custom: null,
    bets: newBets(),
    rival: newRival(),
    league: null,
    pendingCrises: [],
    quests: [],
    offers: [],
    contracts: [],
    bids: [],
    international: null,
    tempMods: [],
    flags: [],
    log: [],
    ledger: [],
    stats: { events: 0, scripted: 0, free: 0, spectators: 0, revenue: 0, hires: 0, builds: 0, crises: 0, weeksRed: 0, totalEp: 0, redStreak: 0, popZero: 0, favorZero: 0, rivalDominance: 0, internationals: 0, internationalWins: 0, leagueCrushed: 0, superiorWeeks: 0, leagueSuperior: 0 },
    achievements: {},
    tutorialDone: [],
    tutorialOff: false,
    victory: null,
    defeat: null,
    infinite: false,
    arc: null,
    lastSummary: null,
    rookies: start.map((g) => g.id),
    priceHint: {},
  };
  // Mercado inicial: candidatos baratos
  const market: Gladiator[] = [];
  for (let i = 0; i < 4; i++) market.push(generateGladiator(`g${s.counter + i}`, r, 0.1, 1, ["demonstracao", "habilidade", "torneio", "espetaculo"]));
  s = { ...s, market, counter: s.counter + 4 };
  s = log(s, `${s.name} abre as portas: uma arena de madeira para 500 pessoas.`, "era");
  return s;
}

export function log(s: GameState, text: string, kind: LogEntry["kind"]): GameState {
  return { ...s, log: [{ week: s.week, text, kind }, ...s.log].slice(0, 300) };
}

export function nextId(s: GameState, prefix: string): [GameState, string] {
  return [{ ...s, counter: s.counter + 1 }, `${prefix}${s.counter}`];
}

export function weekRng(s: GameState, tag: string) {
  return rngFrom(hash(`${s.seed}:${tag}:${s.week}:${s.counter}`));
}

export function gladiator(s: GameState, id: string): Gladiator | undefined {
  return s.gladiators.find((g) => g.id === id) ?? s.market.find((g) => g.id === id);
}

export function migrate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Partial<GameState>;
  if (typeof g.week !== "number" || !Array.isArray(g.gladiators)) return null;
  const base = newGame(g.name ?? "Coliseu", g.seed);
  return { ...base, ...g, stats: { ...base.stats, ...(g.stats ?? {}) }, bets: { ...base.bets, ...(g.bets ?? {}) }, rival: { ...base.rival, ...(g.rival ?? {}) }, version: SAVE_VERSION } as GameState;
}
