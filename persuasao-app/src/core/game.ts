// Estado da partida e todas as ações do jogador. Funções puras: recebem o estado e devolvem outro.
// A interface só chama estas funções; o salvamento acontece em src/store.ts.

import type { LootKind, Mission, Outcome, Tactic } from "./types";
import { type EncounterState, type PlayerCtx, type Relationship, acceptCounter, answerSide, choose, newRelationship, offer, rejectCounter, resultOf, startEncounter } from "./encounter";
import { hash, rngFrom, pickOne, shuffle } from "./rng";
import { makeGig, makeVisit } from "./generated";
import { normalize, priceIn, saysYes, understand, understandSide, type Understood } from "./understand";
import { isBland, offTopic, smallTalkAnswer, steerLine } from "./smalltalk";
import { CHARACTERS, DISTRICTS, ITEMS, MISSIONS, PERKS, character, district, item, mission as missionById } from "../content";
import { CHALLENGES, CHAPTERS, ENDINGS, EVENTS, GIGS, POLICE_ALERTS, emptyDayStats, type DayStats } from "../content/story";

export const SAVE_VERSION = 1;
export const DAY_START = 8 * 60;
export const DAY_END = 22 * 60;
export const RENT = 35;

export type TxCategory = "acordo" | "bico" | "loja" | "aluguel" | "transporte" | "desafio" | "investigação" | "inicial" | "gasto" | "butim" | "policia" | "divida";

export interface Transaction {
  id: number;
  day: number;
  minute: number;
  label: string;
  amount: number;
  category: TxCategory;
}

export interface Message {
  id: number;
  from: string;
  text: string;
  day: number;
  read: boolean;
  kind: "msg" | "invite" | "news" | "alert" | "system";
  /** Mensagem agendada para aparecer num dia futuro. */
  deliverOn?: number;
}

export interface HistoryEntry {
  day: number;
  minute: number;
  text: string;
  kind: "deal" | "fail" | "travel" | "day" | "level" | "chapter" | "shop" | "case" | "info";
}

/** Algo que uma vítima entregou: dados, cartão, senha… Tudo fictício e sempre mascarado. */
export interface LootItem {
  id: number;
  kind: LootKind;
  label: string;
  owner: string;
  value: number;
  /** Final fictício do cartão, para exibir mascarado (•••• 4821). */
  last4?: string;
  day: number;
}

export interface MissionRecord {
  attempts: number;
  best: Outcome | null;
  lastDay: number;
  outcomes: Outcome[];
}

export interface Stats {
  conversations: number;
  deals: number;
  great: number;
  walkouts: number;
  liesTold: number;
  liesCaught: number;
  moneyEarned: number;
  moneySpent: number;
  needsFound: number;
  bestDeal: number;
  tactics: Partial<Record<Tactic, number>>;
  days: number;
  kmTravelled: number;
}

export interface GameState {
  version: number;
  createdAt: number;
  player: { name: string; avatar: number };
  money: number;
  xp: number;
  rep: number;
  integrity: number;
  energy: number;
  day: number;
  minute: number;
  location: string;
  chapter: number;
  chapterSeen: number[];
  missions: Record<string, MissionRecord>;
  relationships: Record<string, Relationship>;
  met: string[];
  items: string[];
  consumables: Record<string, number>;
  outfit: string;
  theme: string;
  perks: string[];
  transactions: Transaction[];
  messages: Message[];
  history: HistoryEntry[];
  flags: string[];
  dayStats: DayStats;
  claimed: string[];
  event: string;
  gigs: { id: string; template: string; char: string; done: boolean }[];
  visitsToday: string[];
  cases: Record<string, { done: boolean; score: number }>;
  /** Calor policial (0–100). Em 100, a polícia chega. */
  heat: number;
  arrests: number;
  loot: LootItem[];
  encounter: EncounterState | null;
  stats: Stats;
  achievements: Record<string, number>;
  ending: { id: string; day: number } | null;
  dossie: boolean;
  flowers: boolean;
  seed: number;
  counter: number;
}

// ---------- Criação ----------

export function newGame(name: string, avatar: number, seed = Date.now()): GameState {
  let s: GameState = {
    version: SAVE_VERSION,
    createdAt: Date.now(),
    player: { name: name.trim() || "Alex", avatar },
    money: 0,
    xp: 0,
    rep: 0,
    integrity: 0,
    energy: 100,
    day: 1,
    minute: DAY_START,
    location: "jardim",
    chapter: 1,
    chapterSeen: [],
    missions: {},
    relationships: {},
    met: [],
    items: ["roupa-comum", "tema-onix"],
    consumables: { cafe: 1 },
    outfit: "roupa-comum",
    theme: "tema-onix",
    perks: [],
    transactions: [],
    messages: [],
    history: [],
    flags: ["visitou:jardim"],
    dayStats: emptyDayStats(),
    claimed: [],
    event: "sol",
    gigs: [],
    visitsToday: [],
    cases: {},
    heat: 0,
    arrests: 0,
    loot: [],
    encounter: null,
    stats: { conversations: 0, deals: 0, great: 0, walkouts: 0, liesTold: 0, liesCaught: 0, moneyEarned: 0, moneySpent: 0, needsFound: 0, bestDeal: 0, tactics: {}, days: 1, kmTravelled: 0 },
    achievements: {},
    ending: null,
    dossie: false,
    flowers: false,
    seed: seed >>> 0,
    counter: 1,
  };
  s = tx(s, "Economias de quando você chegou", 50, "inicial");
  s = msg(s, "cida", "Seja bem-vindo à Pensão Nunes, meu bem! Seu quarto é o dos fundos. Aluguel de ₢ 35 por dia, cobrado à noite. Qualquer coisa, grita. — Dona Cida", "msg");
  s = msg(s, "lobo", "Achou que mudar de cidade apagava a dívida? São ₢ 300. Quando você juntar o dinheiro, eu fico sabendo. Não me faça ir buscar. — Lobo", "msg");
  s = msg(s, "sistema", "Como jogar: converse escrevendo, descubra o ponto fraco de cada pessoa e dê o bote na hora certa. Cada golpe gera calor policial: se chegar a 100, a polícia te pega. Use o mercado clandestino (app Loja) para comprar ferramentas melhores.", "system");
  s = rollDay(s, false);
  return s;
}

// ---------- Utilitários ----------

function tx(s: GameState, label: string, amount: number, category: TxCategory): GameState {
  const t: Transaction = { id: s.counter, day: s.day, minute: s.minute, label, amount, category };
  const stats = { ...s.stats };
  if (amount > 0 && category !== "inicial") stats.moneyEarned += amount;
  if (amount < 0) stats.moneySpent += -amount;
  return { ...s, counter: s.counter + 1, money: s.money + amount, transactions: [t, ...s.transactions].slice(0, 300), stats };
}

export function msg(s: GameState, from: string, text: string, kind: Message["kind"], deliverOn?: number): GameState {
  const m: Message = { id: s.counter, from, text, day: deliverOn ?? s.day, read: false, kind, deliverOn };
  return { ...s, counter: s.counter + 1, messages: [m, ...s.messages].slice(0, 200) };
}

function log(s: GameState, text: string, kind: HistoryEntry["kind"]): GameState {
  return { ...s, history: [{ day: s.day, minute: s.minute, text, kind }, ...s.history].slice(0, 200) };
}

export function visibleMessages(s: GameState): Message[] {
  return s.messages.filter((m) => !m.deliverOn || m.deliverOn <= s.day);
}

export function unread(s: GameState): number {
  return visibleMessages(s).filter((m) => !m.read).length;
}

export function clock(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

// ---------- Níveis ----------

export function xpForLevel(n: number): number {
  return 60 * n * (n - 1);
}

export function levelOf(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return { level, into: xp - xpForLevel(level), need: xpForLevel(level + 1) - xpForLevel(level) };
}

export function perkPoints(s: GameState): number {
  return levelOf(s.xp).level - 1 - s.perks.length;
}

export const REP_TIERS = [
  { min: 0, name: "Desconhecido" },
  { min: 10, name: "Conhecido no bairro" },
  { min: 30, name: "Nome na praça" },
  { min: 55, name: "Respeitado" },
  { min: 85, name: "Influente" },
  { min: 110, name: "Voz da cidade" },
  { min: 160, name: "Lenda de Vila Áurea" },
];

export function repTier(rep: number) {
  return [...REP_TIERS].reverse().find((t) => rep >= t.min)!;
}

// ---------- Acesso ----------

export function districtUnlocked(s: GameState, id: string): boolean {
  const d = district(id);
  const u = d.unlock;
  return (u.level ?? 0) <= levelOf(s.xp).level && (u.rep ?? 0) <= s.rep && (u.chapter ?? 0) <= s.chapter && (u.items ?? []).every((i) => s.items.includes(i));
}

export function missionDone(s: GameState, id: string): boolean {
  const b = s.missions[id]?.best;
  return b === "great" || b === "good" || b === "partial";
}

export function missionAvailable(s: GameState, m: Mission): boolean {
  if (missionDone(s, m.id)) return false;
  const r = m.requires;
  if (r.level && levelOf(s.xp).level < r.level) return false;
  if (r.rep && s.rep < r.rep) return false;
  if (r.chapter && s.chapter < r.chapter) return false;
  if (r.missions?.some((x) => !missionDone(s, x))) return false;
  if (r.flags?.some((f) => !s.flags.includes(f))) return false;
  if (r.item && !s.items.includes(r.item)) return false;
  if (r.items?.some((i) => !s.items.includes(i))) return false;
  // Depois de um fracasso, só no dia seguinte
  const rec = s.missions[m.id];
  if (rec && rec.lastDay === s.day && rec.attempts > 0) return false;
  return true;
}

export interface MissionReason {
  ok: boolean;
  reason?: string;
}

/** Por que uma missão ainda não está disponível (texto para a interface). */
export function missionLock(s: GameState, m: Mission): MissionReason {
  if (missionDone(s, m.id)) return { ok: false, reason: "Concluída" };
  const r = m.requires;
  if (r.chapter && s.chapter < r.chapter) return { ok: false, reason: `Capítulo ${r.chapter}` };
  if (r.level && levelOf(s.xp).level < r.level) return { ok: false, reason: `Nível ${r.level}` };
  if (r.rep && s.rep < r.rep) return { ok: false, reason: `Reputação ${r.rep}` };
  const tool = [...(r.items ?? []), ...(r.item ? [r.item] : [])].find((i) => !s.items.includes(i));
  if (tool) return { ok: false, reason: `Precisa de: ${item(tool)?.name ?? tool}` };
  const miss = r.missions?.find((x) => !missionDone(s, x));
  if (miss) return { ok: false, reason: `Antes: ${missionById(miss).title}` };
  const rec = s.missions[m.id];
  if (rec && rec.lastDay === s.day && rec.attempts > 0) return { ok: false, reason: "Tente de novo amanhã" };
  return { ok: true };
}

export function availableHere(s: GameState): Mission[] {
  return MISSIONS.filter((m) => m.district === s.location && missionAvailable(s, m));
}

export function gigsHere(s: GameState): Mission[] {
  return s.gigs.filter((g) => !g.done && character(g.char).district === s.location).map((g) => makeGig(g.template, character(g.char), s.day));
}

/** Monta uma missão a partir do id (inclui bicos e visitas, que são gerados). */
export function anyMission(_s: GameState, id: string): Mission {
  if (id.startsWith("visit:")) return makeVisit(character(id.slice(6)));
  if (id.startsWith("gig:")) {
    const [, t, c, day] = id.split(":");
    return makeGig(t, character(c), Number(day));
  }
  return missionById(id);
}

// ---------- Viagem e tempo ----------

export function fareTo(s: GameState, dest: string): number {
  if (s.items.includes("passe")) return 0;
  const ev = EVENTS.find((e) => e.id === s.event);
  return Math.round(district(dest).fare * (ev?.fareMult ?? 1));
}

export function travel(s0: GameState, dest: string): GameState {
  if (s0.encounter || dest === s0.location || !districtUnlocked(s0, dest)) return s0;
  const fare = fareTo(s0, dest);
  if (s0.money < fare) return s0;
  if (s0.minute + 30 > DAY_END) return s0;
  const flags = s0.flags.includes(`visitou:${dest}`) ? s0.flags : [...s0.flags, `visitou:${dest}`];
  let s: GameState = { ...s0, location: dest, minute: s0.minute + 30, flags, stats: { ...s0.stats, kmTravelled: s0.stats.kmTravelled + 4 } };
  if (fare) s = tx(s, `Transporte até ${district(dest).name}`, -fare, "transporte");
  return log(s, `Foi para ${district(dest).name}.`, "travel");
}

export function hourOf(s: GameState): number {
  return Math.floor(s.minute / 60);
}

// ---------- Conversas ----------

export function playerCtx(s: GameState, charId: string): PlayerCtx {
  const c = character(charId);
  const startMods: PlayerCtx["startMods"] = {};
  const add = (m?: Partial<Record<string, number>>) => {
    for (const [k, v] of Object.entries(m ?? {})) (startMods as Record<string, number>)[k] = ((startMods as Record<string, number>)[k] ?? 0) + (v as number);
  };
  const outfit = item(s.outfit);
  add(outfit?.start);
  if (c.traits.formality >= 0.5) add(outfit?.formal);
  if (c.traits.formality <= 0.3) add(outfit?.casual);
  for (const id of s.items) if (item(id)?.kind === "tool") add(item(id)?.start);
  for (const p of s.perks) add(PERKS.find((x) => x.id === p)?.start);
  if (s.flowers) add({ affinity: 10, mood: 6 });
  const ev = EVENTS.find((e) => e.id === s.event);
  add(ev?.start);
  const skill: PlayerCtx["skill"] = {};
  for (const p of s.perks) for (const [t, v] of Object.entries(PERKS.find((x) => x.id === p)?.skill ?? {})) skill[t as Tactic] = Math.max(skill[t as Tactic] ?? 0, v as number);
  const worldMood = (ev?.mood?.all ?? 0) + (ev?.mood?.[c.district] ?? 0);
  return {
    name: s.player.name,
    perks: s.perks,
    skill,
    items: s.items,
    startMods,
    energy: s.energy,
    reputation: s.rep,
    socialClass: Math.min(4, 2 + Math.floor(s.rep / 60)),
    hour: hourOf(s),
    worldMood,
    relationship: s.relationships[charId] ?? newRelationship(),
    worldFlags: s.flags,
  };
}

export type StartError = "energia" | "horario" | "conversa" | "indisponivel";

export function canStart(s: GameState, m: Mission): StartError | null {
  if (s.encounter) return "conversa";
  if (s.energy < 10) return "energia";
  if (s.minute + m.minutes > DAY_END) return "horario";
  return null;
}

export function startMission(s0: GameState, missionId: string): GameState {
  const m = anyMission(s0, missionId);
  if (canStart(s0, m)) return s0;
  if (!missionId.startsWith("gig:") && !missionId.startsWith("visit:") && !missionAvailable(s0, m)) return s0;
  if (missionId.startsWith("visit:") && s0.visitsToday.includes(m.npc)) return s0;
  const c = character(m.npc);
  let s = s0;
  // O Dossiê revela uma necessidade antes da conversa
  if (s.dossie) {
    const rel = { ...(s.relationships[c.id] ?? newRelationship()) };
    const n = c.needs.find((x) => !rel.known.includes(x.id));
    if (n) {
      rel.known = [...rel.known, n.id];
      s = { ...s, relationships: { ...s.relationships, [c.id]: rel } };
      s = msg(s, "sistema", `Dossiê sobre ${c.name}: ${n.label}`, "alert");
    }
    s = { ...s, dossie: false };
  }
  const seed = hash(`${s.seed}:${missionId}:${s.day}:${s.minute}`);
  const enc = startEncounter(m, c, playerCtx(s, c.id), seed);
  const isNew = !s.met.includes(c.id);
  s = { ...s, encounter: enc, flowers: false, met: isNew ? [...s.met, c.id] : s.met, dayStats: { ...s.dayStats, newPeople: s.dayStats.newPeople + (isNew ? 1 : 0) } };
  return s;
}

function withEncounter(s: GameState, f: (e: EncounterState, m: Mission, ctx: PlayerCtx) => EncounterState): GameState {
  if (!s.encounter) return s;
  const m = anyMission(s, s.encounter.missionId);
  const c = character(m.npc);
  const ctx = playerCtx(s, c.id);
  const before = s.encounter;
  const after = f(before, m, ctx);
  let next: GameState = { ...s, encounter: after };
  // Estatísticas de abordagem e descobertas
  const lastMine = [...after.log].reverse().find((l) => l.who === "me" && l.tactic);
  if (after.turn > before.turn && lastMine?.tactic) {
    const tactics = { ...next.stats.tactics, [lastMine.tactic]: (next.stats.tactics[lastMine.tactic] ?? 0) + 1 };
    next = { ...next, stats: { ...next.stats, tactics } };
  }
  const found = after.known.length - before.known.length;
  if (found > 0) next = { ...next, stats: { ...next.stats, needsFound: next.stats.needsFound + found }, dayStats: { ...next.dayStats, needsFound: next.dayStats.needsFound + found } };
  if (after.lastReaction === "amused" && after.turn > before.turn) next = { ...next, dayStats: { ...next.dayStats, humorHits: next.dayStats.humorHits + 1 } };
  return next;
}

export function say(s: GameState, optionId: string): GameState {
  return withEncounter(s, (e, m, ctx) => choose(e, optionId, m, character(m.npc), ctx));
}

export function answer(s: GameState, index: number): GameState {
  return withEncounter(s, (e, m, ctx) => answerSide(e, index, m, character(m.npc), ctx));
}

export function makeOffer(s: GameState, price: number): GameState {
  return withEncounter(s, (e, m, ctx) => offer(e, price, m, character(m.npc), ctx));
}

export function takeCounter(s: GameState): GameState {
  return withEncounter(s, (e, m, ctx) => acceptCounter(e, m, character(m.npc), ctx));
}

export function refuseCounter(s: GameState): GameState {
  return withEncounter(s, (e) => rejectCounter(e));
}

export function leaveEncounter(s: GameState): GameState {
  return say(s, "u-leave");
}

/** Fecha a conversa terminada e aplica todas as consequências. */
export function finishEncounter(s0: GameState): GameState {
  const e = s0.encounter;
  if (!e || e.status !== "done") return s0;
  const m = anyMission(s0, e.missionId);
  const c = character(m.npc);
  const r = resultOf(e, m, c);
  const isGig = m.id.startsWith("gig:");
  const isVisit = m.id.startsWith("visit:");
  const success = r.outcome === "great" || r.outcome === "good" || r.outcome === "partial";
  let s: GameState = { ...s0, encounter: null };

  // Tempo e energia
  const minutes = Math.min(m.minutes + e.turn * 4, 120);
  s = { ...s, minute: Math.min(DAY_END, s.minute + minutes), energy: Math.max(0, s.energy - Math.round(14 + e.turn * 1.2)) };

  // Dinheiro, XP, reputação, integridade
  const ev = EVENTS.find((x) => x.id === s.event);
  const money = isGig && r.money > 0 ? Math.round(r.money * (ev?.gigBonus ?? 1)) : r.money;
  if (money !== 0) s = tx(s, `${isGig ? "Bico" : "Acordo"}: ${m.title}`, money, isGig ? "bico" : "acordo");
  const level0 = levelOf(s.xp).level;
  s = { ...s, xp: s.xp + r.xp, rep: Math.max(0, s.rep + r.rep), integrity: s.integrity + r.integrity };
  const level1 = levelOf(s.xp).level;
  if (level1 > level0) {
    s = log(s, `Subiu para o nível ${level1}! Você ganhou um ponto de habilidade.`, "level");
    s = msg(s, "sistema", `Nível ${level1}! Use o seu ponto de habilidade no app Perfil.`, "system");
  }

  // Butim e calor policial
  if (success && !isVisit) {
    const share = r.outcome === "great" ? 1.3 : r.outcome === "good" ? 1 : 0.5;
    const specs = r.outcome === "partial" ? (m.loot ?? []).slice(0, 1) : m.loot ?? [];
    for (const spec of specs) s = addLoot(s, spec.kind, spec.label, c.id, Math.round(spec.value * share));
    s = addHeat(s, (m.heat ?? 8) * (r.outcome === "great" ? 0.7 : 1), `${m.title}`);
  } else if (!isVisit && (r.outcome === "walkout" || r.outcome === "fail")) {
    s = addHeat(s, r.outcome === "walkout" ? 8 : 4, "vítima desconfiada");
  }
  if (e.liesCaught > 0) s = addHeat(s, 12 * e.liesCaught, "contradição percebida");

  // Relacionamento e memória do personagem
  const rel0 = s.relationships[c.id] ?? newRelationship();
  const rel: Relationship = {
    affinity: Math.max(-100, Math.min(100, rel0.affinity + r.affinity)),
    met: rel0.met + 1,
    outcomes: [...rel0.outcomes, r.outcome].slice(-10),
    liesCaught: rel0.liesCaught + e.liesCaught,
    known: [...new Set([...rel0.known, ...e.known])],
    notes: [...r.notes, ...rel0.notes].slice(0, 12),
    lastDay: s.day,
  };
  s = { ...s, relationships: { ...s.relationships, [c.id]: rel } };

  // Registro da missão
  if (!isGig) {
    const rec0 = s.missions[m.id] ?? { attempts: 0, best: null, lastDay: 0, outcomes: [] };
    const rank: Outcome[] = ["great", "good", "partial", "fail", "walkout", "left"];
    const best = !rec0.best || rank.indexOf(r.outcome) < rank.indexOf(rec0.best) ? r.outcome : rec0.best;
    s = { ...s, missions: { ...s.missions, [m.id]: { attempts: rec0.attempts + 1, best, lastDay: s.day, outcomes: [...rec0.outcomes, r.outcome] } } };
  } else {
    s = { ...s, gigs: s.gigs.map((g) => (m.id.startsWith(`gig:${g.template}:${g.char}:`) ? { ...g, done: true } : g)) };
  }
  if (isVisit) s = { ...s, visitsToday: [...s.visitsToday, c.id] };

  // Estatísticas
  const stats = { ...s.stats, conversations: s.stats.conversations + 1, liesTold: s.stats.liesTold + e.liesTold, liesCaught: s.stats.liesCaught + e.liesCaught };
  if (success && !isVisit) stats.deals++;
  if (r.outcome === "great") stats.great++;
  if (r.outcome === "walkout") stats.walkouts++;
  if (money > stats.bestDeal) stats.bestDeal = money;
  const ds = { ...s.dayStats, talks: s.dayStats.talks + 1 };
  if (success && !isVisit) {
    ds.deals++;
    if (e.liesCaught === 0) ds.dealsNoBluff++;
  }
  if (money > 0) ds.earned += money;
  if (r.outcome === "walkout") ds.walkouts++;
  if (e.attrs.affinity >= 70) ds.highAffinity++;
  s = { ...s, stats, dayStats: ds };

  // História, mensagens e marcos
  s = log(s, `${OUT_TEXT[r.outcome]} — ${m.title} (${c.name.split(" ")[0]})`, success ? "deal" : "fail");
  if (success) for (const f of m.flagsOnSuccess ?? []) if (!s.flags.includes(f)) s = { ...s, flags: [...s.flags, f] };
  const fu = r.outcome === "great" ? m.followUp?.great ?? m.followUp?.good : r.outcome === "good" || r.outcome === "partial" ? m.followUp?.good : m.followUp?.fail;
  if (fu) s = msg(s, c.id, fu, "msg", s.day + 1);
  if (e.liesCaught > 0 && !isVisit) {
    s = msg(s, "noticias", `Boato no ${district(c.district).name}: tem gente dizendo que um golpista anda pelo bairro. ${c.name.split(" ")[0]} contou para os vizinhos.`, "news", s.day + 1);
  }
  if (r.outcome === "walkout" && !isVisit && s.heat >= 40) s = msg(s, "policia", `Registro de ocorrência: ${c.name} descreveu uma pessoa suspeita no ${district(c.district).name}. A descrição bate com você.`, "alert");
  s = advanceChapter(s);
  if (m.id === "m-roberto" && success && !s.ending) s = finishGame(s, r.outcome);
  if (s.heat >= 100 && !s.ending) s = arrest(s);
  return s;
}

const OUT_TEXT: Record<Outcome, string> = {
  great: "Sucesso total",
  good: "Acordo fechado",
  partial: "Meio-termo",
  fail: "Recusado",
  walkout: "A pessoa foi embora",
  left: "Conversa encerrada",
};

// ---------- Capítulos e final ----------

export function chapterGoal(s: GameState) {
  const ch = CHAPTERS.find((c) => c.n === s.chapter)!;
  const storyDone = ch.goal.story.filter((id) => missionDone(s, id)).length;
  const any = ch.goal.anyOf ? ch.goal.anyOf.missions.filter((id) => missionDone(s, id)).length : 0;
  const itemsOk = (ch.goal.items ?? []).every((i) => s.items.includes(i));
  const moneyOk = s.money >= (ch.goal.money ?? 0);
  return {
    chapter: ch,
    money: Math.min(s.money, ch.goal.money ?? 0),
    moneyOk,
    itemsOk,
    storyDone,
    storyTotal: ch.goal.story.length,
    any,
    anyNeeded: ch.goal.anyOf?.count ?? 0,
    complete: moneyOk && itemsOk && storyDone === ch.goal.story.length && any >= (ch.goal.anyOf?.count ?? 0),
  };
}

function advanceChapter(s0: GameState): GameState {
  let s = s0;
  while (s.chapter < CHAPTERS.length && chapterGoal(s).complete) {
    const n = s.chapter + 1;
    const ch = CHAPTERS.find((c) => c.n === n)!;
    s = { ...s, chapter: n };
    s = log(s, `Capítulo ${n}: ${ch.title}`, "chapter");
    s = msg(s, "sistema", `Novo capítulo: ${ch.title}. ${ch.subtitle} pode ser explorado quando você tiver nível e ferramentas.`, "system");
    s = tx(s, `Bônus de capítulo concluído`, 100 * (n - 1), "desafio");
    if (n === 2) {
      s = tx(s, "Dívida paga ao Lobo", -300, "divida");
      s = msg(s, "lobo", "Recebi. Viu como é fácil? Agora some da minha frente. — Lobo", "msg");
      s = msg(s, "zenite", "Soubemos do seu trabalho na Vila Jardim. Bom trabalho, mas sem autorização. Procure o Valdir, na galeria do Mercado Central. — Z.", "invite");
    }
    if (n === 3) s = msg(s, "noticias", "O Relógio: «Golpistas fazem vítimas em série na cidade», reportagem de Clara Bastos. A jornalista diz ter depoimentos e um retrato falado.", "news");
    if (n === 4) s = msg(s, "diego", "Você está pisando no meu território. O Zênite tem um golpista só, e sou eu. Último aviso. — D.S.", "msg");
    if (n === 5) s = msg(s, "zenite", "O Fundo Áurea. Três assinaturas: Celina, Otávio, o prefeito. Se você conseguir, a cidade é sua. — Z.", "invite");
  }
  return s;
}

function finishGame(s: GameState, outcome: Outcome): GameState {
  const end = ENDINGS.find((x) => x.when({ outcome, heat: s.heat, arrests: s.arrests, liesCaught: s.stats.liesCaught, money: s.money }))!;
  return log({ ...s, ending: { id: end.id, day: s.day } }, `Final: ${end.title}`, "chapter");
}

// ---------- Fim do dia ----------

function rollDay(s0: GameState, charge: boolean): GameState {
  let s = s0;
  const r = rngFrom(hash(`${s.seed}:day:${s.day}`));
  if (charge) {
    s = tx(s, "Aluguel do quarto (Pensão Nunes)", -RENT, "aluguel");
    if (s.money < 0) {
      s = msg(s, "cida", "Meu bem, o aluguel ficou devendo. Eu confio em você, mas não abusa, tá? — Dona Cida", "msg");
      s = { ...s, rep: Math.max(0, s.rep - 1) };
    }
  }
  // Evento do dia
  const pool = EVENTS.filter((e) => (e.minChapter ?? 1) <= s.chapter);
  const total = pool.reduce((a, e) => a + e.weight, 0);
  let x = r() * total;
  let ev = pool[0];
  for (const e of pool) {
    x -= e.weight;
    if (x <= 0) {
      ev = e;
      break;
    }
  }
  s = { ...s, event: ev.id };
  s = msg(s, "noticias", `${ev.title}: ${ev.text}`, "news");
  // Bicos: dois por bairro liberado
  const gigs: GameState["gigs"] = [];
  for (const d of DISTRICTS.filter((d) => districtUnlocked(s, d.id))) {
    const people = shuffle(CHARACTERS.filter((c) => c.district === d.id), r).slice(0, 2);
    for (const c of people) gigs.push({ id: `${d.id}:${c.id}`, template: pickOne(GIGS, r).id, char: c.id, done: false });
  }
  s = { ...s, gigs };
  // Personagens que gostam de você puxam conversa
  const fans = Object.entries(s.relationships).filter(([, rel]) => rel.affinity >= 25);
  if (fans.length && r() < 0.6) {
    const [id] = pickOne(fans, r);
    const c = character(id);
    s = msg(s, id, `${pickOne(c.voice.greetAgain, r).replace("{player}", s.player.name)} Passa aqui quando puder. — ${c.nick ?? c.name.split(" ")[0]}`, "invite");
  }
  // Rádio da polícia
  if (s.heat >= 40 || (s.chapter >= 2 && r() < 0.35)) s = msg(s, "policia", `Radar: ${pickOne(POLICE_ALERTS, r)}`, "alert");
  if (s.heat >= 70) s = msg(s, "policia", "Radar: seu apelido foi citado num inquérito. Considere sumir por um tempo.", "alert");
  return s;
}

export function endDay(s0: GameState): GameState {
  if (s0.encounter) return s0;
  let s: GameState = { ...s0, day: s0.day + 1, minute: DAY_START, energy: 100, dayStats: emptyDayStats(), claimed: [], visitsToday: [], heat: Math.max(0, s0.heat - 12), stats: { ...s0.stats, days: s0.stats.days + 1 } };
  s = log(s, `Dia ${s.day} começou.`, "day");
  s = rollDay(s, true);
  return s;
}

/** Resumo para a tela de fim de dia. */
export function daySummary(before: GameState, after: GameState) {
  const income = before.transactions.filter((t) => t.day === before.day && t.amount > 0 && t.category !== "inicial").reduce((a, t) => a + t.amount, 0);
  const spent = before.transactions.filter((t) => t.day === before.day && t.amount < 0).reduce((a, t) => a - t.amount, 0);
  return { income, spent, rent: RENT, talks: before.dayStats.talks, deals: before.dayStats.deals, event: EVENTS.find((e) => e.id === after.event)! };
}

// ---------- Desafios, loja, habilidades ----------

export function challengesToday(s: GameState) {
  const r = rngFrom(hash(`${s.seed}:ch:${s.day}`));
  return shuffle(CHALLENGES, r).slice(0, 3);
}

export function claimChallenge(s0: GameState, id: string): GameState {
  const c = challengesToday(s0).find((x) => x.id === id);
  if (!c || s0.claimed.includes(id) || c.value(s0.dayStats) < c.target) return s0;
  let s = tx({ ...s0, claimed: [...s0.claimed, id] }, `Desafio do dia: ${c.title}`, c.reward.money, "desafio");
  s = { ...s, xp: s.xp + c.reward.xp };
  return log(s, `Desafio cumprido: ${c.title}`, "info");
}

export function shopPrice(s: GameState, id: string): number {
  const it = item(id)!;
  const ev = EVENTS.find((e) => e.id === s.event);
  return Math.round(it.price * (1 - (ev?.shopDiscount ?? 0)));
}

export function itemLocked(s: GameState, id: string): string | null {
  const it = item(id)!;
  if (it.unlock?.level && levelOf(s.xp).level < it.unlock.level) return `Nível ${it.unlock.level}`;
  if (it.unlock?.chapter && s.chapter < it.unlock.chapter) return `Capítulo ${it.unlock.chapter}`;
  return null;
}

export function buy(s0: GameState, id: string): GameState {
  const it = item(id);
  if (!it || itemLocked(s0, id)) return s0;
  const price = shopPrice(s0, id);
  if (s0.money < price) return s0;
  if (it.kind !== "consumable" && s0.items.includes(id)) return s0;
  let s = tx(s0, `Loja: ${it.name}`, -price, "loja");
  if (it.kind === "consumable") s = { ...s, consumables: { ...s.consumables, [id]: (s.consumables[id] ?? 0) + 1 } };
  else s = { ...s, items: [...s.items, id] };
  return log(s, `Comprou ${it.name}.`, "shop");
}

export function equip(s: GameState, id: string): GameState {
  const it = item(id);
  if (!it || !s.items.includes(id)) return s;
  if (it.kind === "outfit") return { ...s, outfit: id };
  if (it.kind === "theme") return { ...s, theme: id };
  return s;
}

export function useConsumable(s: GameState, id: string): GameState {
  if ((s.consumables[id] ?? 0) <= 0) return s;
  const consumables = { ...s.consumables, [id]: s.consumables[id] - 1 };
  if (id === "cafe") return { ...s, consumables, energy: Math.min(100, s.energy + 30) };
  if (id === "dossie") return { ...s, consumables, dossie: true };
  if (id === "flores") return { ...s, consumables, flowers: true };
  if (id === "sumico") return log({ ...s, consumables, heat: Math.max(0, s.heat - 30) }, "Sumiu por um tempo: o calor baixou.", "info");
  return s;
}

export function perkAvailable(s: GameState, id: string): boolean {
  const p = PERKS.find((x) => x.id === id);
  if (!p || s.perks.includes(id)) return false;
  if (levelOf(s.xp).level < p.level) return false;
  if (p.requires && !s.perks.includes(p.requires)) return false;
  return perkPoints(s) > 0;
}

export function takePerk(s: GameState, id: string): GameState {
  if (!perkAvailable(s, id)) return s;
  return log({ ...s, perks: [...s.perks, id] }, `Nova habilidade: ${PERKS.find((p) => p.id === id)!.name}`, "level");
}

// ---------- Calor, polícia e butim ----------

/** Quanto do calor de um golpe chega até você, depois das ferramentas e habilidades. */
export function heatFactor(s: GameState): number {
  let cut = 0;
  for (const id of s.items) cut += item(id)?.heatCut ?? 0;
  if (s.perks.includes("calma")) cut += 0.1;
  if (s.flags.includes("sentinela-cego")) cut += 0.1;
  if (s.flags.includes("clara-despistada")) cut += 0.1;
  const ev = EVENTS.find((e) => e.id === s.event);
  return Math.max(0.25, 1 - cut) * (ev?.heatMult ?? 1);
}

function addHeat(s: GameState, raw: number, why: string): GameState {
  const gain = Math.round(raw * heatFactor(s));
  if (gain <= 0) return s;
  return log({ ...s, heat: Math.min(100, s.heat + gain) }, `Calor +${gain} (${why}).`, "info");
}

function addLoot(s: GameState, kind: LootKind, label: string, owner: string, value: number): GameState {
  const r = rngFrom(hash(`${s.seed}:loot:${s.counter}`));
  const v = kind === "cartao" && s.items.includes("leitor") ? Math.round(value * 1.5) : value;
  const it: LootItem = { id: s.counter, kind, label, owner, value: v, day: s.day, last4: kind === "cartao" ? String(1000 + Math.floor(r() * 9000)) : undefined };
  return { ...s, counter: s.counter + 1, loot: [it, ...s.loot] };
}

/** O que dá para fazer com um item do butim e quanto rende. */
export function lootOptions(s: GameState, l: LootItem) {
  const sell = Math.round(l.value * (l.kind === "dados" && s.items.includes("site") ? 0.8 : 0.4));
  let use: { ok: boolean; value: number; heat: number; need?: string } | null = null;
  if (l.kind === "cartao") use = { ok: s.items.includes("kit-clone"), value: Math.round(l.value * (s.perks.includes("negociador") ? 1.05 : 0.9)), heat: 8, need: "kit-clone" };
  if (l.kind === "senha" || l.kind === "acesso") use = { ok: s.items.includes("notebook"), value: Math.round(l.value * 0.9), heat: 6, need: "notebook" };
  return { sell, use };
}

/** Vender ao receptador ou usar (cartão com o kit, senha/acesso com o notebook). */
export function cashOut(s0: GameState, lootId: number, mode: "vender" | "usar"): GameState {
  const l = s0.loot.find((x) => x.id === lootId);
  if (!l || s0.encounter) return s0;
  const o = lootOptions(s0, l);
  let s: GameState = { ...s0, loot: s0.loot.filter((x) => x.id !== lootId) };
  if (mode === "vender") {
    s = tx(s, `Receptador: ${l.label}`, o.sell, "butim");
    s = addHeat(s, 2, "venda ao receptador");
  } else {
    if (!o.use?.ok) return s0;
    s = tx(s, `${l.kind === "cartao" ? "Cartão usado" : "Acesso usado"}: ${l.label}`, o.use.value, "butim");
    s = addHeat(s, o.use.heat, l.kind === "cartao" ? "cartão clonado" : "acesso usado");
  }
  s = { ...s, dayStats: { ...s.dayStats, earned: s.dayStats.earned + (mode === "vender" ? o.sell : o.use!.value) } };
  if (s.heat >= 100 && !s.ending) s = arrest(s);
  return advanceChapter(s);
}

/** A polícia chegou. */
export function arrest(s0: GameState): GameState {
  const arrests = s0.arrests + 1;
  let s: GameState = { ...s0, arrests, encounter: null, loot: [] };
  if (arrests >= 3) {
    s = { ...s, ending: { id: "preso", day: s.day } };
    return log(s, "Final: Atrás das grades", "chapter");
  }
  const lawyer = s.items.includes("advogado");
  const lost = Math.max(0, Math.round(s.money * (lawyer ? 0.25 : 0.6)));
  if (lost) s = tx(s, lawyer ? "Fiança (com advogado)" : "Fiança, advogado e bens apreendidos", -lost, "policia");
  let toolLost = "";
  if (!lawyer) {
    const tools = s.items.filter((i) => item(i)?.kind === "tool").sort((a, b) => (item(b)?.price ?? 0) - (item(a)?.price ?? 0));
    if (tools[0]) {
      toolLost = item(tools[0])!.name;
      s = { ...s, items: s.items.filter((i) => i !== tools[0]) };
    }
  }
  s = { ...s, heat: 35, day: s.day + 2, minute: DAY_START, energy: 100, dayStats: emptyDayStats(), claimed: [], visitsToday: [] };
  s = log(s, `Preso pela ${arrests}ª vez. Dois dias na delegacia.`, "fail");
  s = msg(s, "policia", `Você passou dois dias detido. Perdeu ${fmtMoney(lost)}${toolLost ? ` e a polícia apreendeu: ${toolLost}` : ""}. Todo o butim foi apreendido. ${arrests === 2 ? "Na próxima, não tem fiança." : ""}`, "alert");
  return rollDay(s, false);
}

function fmtMoney(n: number) {
  return `₢ ${n.toLocaleString("pt-BR")}`;
}

export function readAll(s: GameState, from?: string): GameState {
  return { ...s, messages: s.messages.map((m) => ((!from || m.from === from) && (!m.deliverOn || m.deliverOn <= s.day) ? { ...m, read: true } : m)) };
}

// ---------- Salvamento ----------

export function migrate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Partial<GameState>;
  if (!g.player || typeof g.money !== "number") return null;
  const base = newGame(g.player.name, g.player.avatar ?? 0, g.seed);
  return { ...base, ...g, heat: g.heat ?? 0, arrests: g.arrests ?? 0, loot: g.loot ?? [], version: SAVE_VERSION, stats: { ...base.stats, ...(g.stats ?? {}) }, dayStats: { ...base.dayStats, ...(g.dayStats ?? {}) } } as GameState;
}

export const ALL_ITEMS = ITEMS;

// ---------- Fala digitada ----------

/** Troca a fala padrão do motor pelo que o jogador realmente escreveu. */
function withTyped(before: GameState, after: GameState, typed: string): GameState {
  if (!after.encounter || !before.encounter || after === before) return after;
  const start = before.encounter.log.length;
  const log = [...after.encounter.log];
  const i = log.findIndex((l, k) => k >= start && l.who === "me");
  if (i >= 0) log[i] = { ...log[i], text: typed };
  return { ...after, encounter: { ...after.encounter, log } };
}

export interface TalkResult {
  state: GameState;
  understood?: Understood;
}

/** O jogador escreveu algo na conversa: entende e aplica. */
export function talk(s0: GameState, raw: string): TalkResult {
  const typed = raw.trim().replace(/\s+/g, " ").slice(0, 400);
  const e = s0.encounter;
  if (!e || e.status !== "active" || !typed) return { state: s0 };
  const m = anyMission(s0, e.missionId);
  const c = character(m.npc);
  const n = m.negotiation;

  if (e.pending) {
    const idx = understandSide(typed, e.pending.options);
    return { state: withTyped(s0, answer(s0, idx), typed) };
  }

  if (e.counter) {
    const price = n ? priceIn(typed) : null;
    if (n && price !== null) return { state: withTyped(s0, makeOffer(s0, price), typed) };
    if (saysYes(typed)) return { state: withTyped(s0, takeCounter(s0), typed) };
    return { state: withTyped(s0, refuseCounter(s0), typed) };
  }

  // Negociação: "te pago 300" já abre a conversa de valor e faz a oferta
  const price = n ? priceIn(typed) : null;
  if (n && price !== null && /(ofere|dou |pago|pagar|fecho|vendo|aceita|topa|por \d|quero \d|faco)/.test(normalize(typed))) {
    const opened = say(s0, "u-close");
    if (opened.encounter?.counter) return { state: withTyped(s0, makeOffer(opened, price), typed) };
  }

  const u = understand(typed, e, m, c, playerCtx(s0, c.id));
  let next = withTyped(s0, say(s0, u.optionId), typed);
  // Fala livre: responder ao que foi perguntado e não deixar a conversa morrer em "Sei."
  if (u.optionId.startsWith("u-free:") && next.encounter && next.encounter.status === "active") {
    const enc = next.encounter;
    const from = e.log.length;
    const i = enc.log.findIndex((l, k) => k >= from && l.who === "npc");
    if (i >= 0) {
      const answer = smallTalkAnswer(typed, c, e);
      const generic = enc.log[i].text;
      const negative = ["offended", "impatient", "skeptical"].includes(enc.log[i].reaction ?? "");
      let text = generic;
      if (answer) text = negative && !answer.startsWith("Desculpa") ? `${generic} ${answer}` : answer;
      else if (isBland(generic)) text = `${generic} ${enc.turn % 3 === 0 ? offTopic(c) ?? "" : ""}`.trim();
      // Puxa de volta para o assunto (a pergunta da etapa atual), sem repetir a mesma frase
      const steer = steerLine(m, enc);
      const alreadySaid = enc.log.slice(Math.max(0, i - 6), i).some((l) => l.text.includes(steer));
      const lead = ["Mas, voltando ao assunto: ", "Enfim. ", "Mas me diz uma coisa: ", "Bom, e sobre o que você veio falar? "][enc.turn % 4];
      if (!alreadySaid && !text.endsWith("?") && !enc.pending) text = `${text} ${lead}${lead.endsWith("? ") ? "" : `${steer.charAt(0).toUpperCase()}${steer.slice(1)}`}`.trim();
      const log = [...enc.log];
      log[i] = { ...log[i], text };
      // Uma troca de verdade (pergunta respondida) cansa menos e aproxima um pouco
      const attrs = answer ? { ...enc.attrs, patience: Math.min(100, enc.attrs.patience + 5), affinity: Math.min(100, enc.attrs.affinity + 2) } : enc.attrs;
      next = { ...next, encounter: { ...enc, log, attrs } };
    }
  }
  return { state: next, understood: u };
}

// ---------- Falas geradas pela IA ----------

/**
 * Junta as falas prontas do personagem a partir de `from` numa só entrada (que a IA vai escrever).
 * Devolve o estado e o índice da entrada. As linhas do sistema ("Você descobriu…") ficam onde estão.
 */
export function collapseNpcLines(s: GameState, from: number, text: string): { state: GameState; index: number; lines: string[] } {
  const e = s.encounter;
  if (!e) return { state: s, index: -1, lines: [] };
  const tail = e.log.slice(from);
  const npc = tail.filter((l) => l.who === "npc");
  if (!npc.length) return { state: s, index: -1, lines: [] };
  const firstIdx = from + tail.findIndex((l) => l.who === "npc");
  const last = npc[npc.length - 1];
  const merged = { who: "npc" as const, text, reaction: last.reaction, delta: npc.find((l) => l.delta)?.delta };
  const log = [...e.log.slice(0, from), ...tail.filter((l) => l.who !== "npc")];
  log.splice(firstIdx, 0, merged);
  return { state: { ...s, encounter: { ...e, log } }, index: firstIdx, lines: npc.map((l) => l.text) };
}

export function setLogText(s: GameState, index: number, text: string): GameState {
  const e = s.encounter;
  if (!e || !e.log[index]) return s;
  const log = [...e.log];
  log[index] = { ...log[index], text };
  return { ...s, encounter: { ...e, log } };
}
