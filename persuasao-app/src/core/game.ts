// Estado da partida e todas as ações do jogador. Funções puras: recebem o estado e devolvem outro.
// A interface só chama estas funções; o salvamento acontece em src/store.ts.

import type { Mission, Outcome, Tactic } from "./types";
import { type EncounterState, type PlayerCtx, type Relationship, acceptCounter, answerSide, choose, newRelationship, offer, rejectCounter, resultOf, startEncounter } from "./encounter";
import { hash, rngFrom, pickOne, shuffle } from "./rng";
import { makeGig, makeVisit } from "./generated";
import { CHARACTERS, DISTRICTS, ITEMS, MISSIONS, PERKS, character, district, item, mission as missionById } from "../content";
import { CASES, CHALLENGES, CHAPTERS, ENDINGS, EVENTS, GIGS, SECURITY_TIPS, emptyDayStats, type DayStats } from "../content/story";

export const SAVE_VERSION = 1;
export const DAY_START = 8 * 60;
export const DAY_END = 22 * 60;
export const RENT = 35;

export type TxCategory = "acordo" | "bico" | "loja" | "aluguel" | "transporte" | "desafio" | "investigação" | "inicial" | "gasto";

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
  s = msg(s, "sistema", "Dica: no mapa, toque num bairro para ver quem está lá. Converse, descubra o que cada pessoa precisa e só faça a proposta quando sentir que é a hora.", "system");
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
  return (u.level ?? 0) <= levelOf(s.xp).level && (u.rep ?? 0) <= s.rep && (u.chapter ?? 0) <= s.chapter;
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
    if (e.liesTold === 0) ds.dealsNoBluff++;
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
    s = msg(s, "noticias", `Boato no ${district(c.district).name}: dizem que ${s.player.name} não é de confiança. Reputação abalada.`, "news", s.day + 1);
  }
  s = advanceChapter(s);
  if (m.id === "m-roberto" && success && !s.ending) s = finishGame(s, r.outcome);
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
  return {
    chapter: ch,
    rep: Math.min(s.rep, ch.goal.rep),
    storyDone,
    storyTotal: ch.goal.story.length,
    any,
    anyNeeded: ch.goal.anyOf?.count ?? 0,
    complete: s.rep >= ch.goal.rep && storyDone === ch.goal.story.length && any >= (ch.goal.anyOf?.count ?? 0),
  };
}

function advanceChapter(s0: GameState): GameState {
  let s = s0;
  while (s.chapter < CHAPTERS.length && chapterGoal(s).complete) {
    const n = s.chapter + 1;
    const ch = CHAPTERS.find((c) => c.n === n)!;
    s = { ...s, chapter: n };
    s = log(s, `Capítulo ${n}: ${ch.title}`, "chapter");
    s = msg(s, "sistema", `Novo capítulo: ${ch.title}. ${ch.subtitle} agora pode ser explorado quando você tiver nível e reputação suficientes.`, "system");
    s = tx(s, `Bônus de capítulo concluído`, 100 * (n - 1), "desafio");
    if (n === 2) s = msg(s, "clara", "Oi. Você não me conhece. Sou Clara Bastos, do jornal O Relógio. Ouvi falar do seu trabalho na Vila Jardim. Tem uma coisa estranha acontecendo no Mercado Central — panfletos de um tal Grupo Zênite. Se puder, descubra o que o Valdir da galeria sabe. Com cuidado.", "invite");
    if (n === 3) s = msg(s, "clara", "Precisamos conversar pessoalmente. Estou no Largo do Relógio, na redação. Traga o que você tem.", "invite");
    if (n === 4) s = msg(s, "mariana", "Ouvi falar do tal 'Plano Áurea'. Se precisar de dados para convencer gente grande nas Torres, me procure. — M.", "msg");
    if (n === 5) s = msg(s, "roberto", "O gabinete do prefeito confirma uma audiência de dez minutos. Data a combinar. — Cerimonial do Paço Municipal", "invite");
  }
  return s;
}

function finishGame(s: GameState, outcome: Outcome): GameState {
  const end = ENDINGS.find((x) => x.when({ outcome, integrity: s.integrity, liesCaught: s.stats.liesCaught, money: s.money, rep: s.rep }))!;
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
  // Dica de segurança na central de investigação
  if (s.chapter >= 2 && r() < 0.5) s = msg(s, "seguranca", `Alerta de segurança: ${pickOne(SECURITY_TIPS, r)}`, "alert");
  return s;
}

export function endDay(s0: GameState): GameState {
  if (s0.encounter) return s0;
  let s: GameState = { ...s0, day: s0.day + 1, minute: DAY_START, energy: 100, dayStats: emptyDayStats(), claimed: [], visitsToday: [], stats: { ...s0.stats, days: s0.stats.days + 1 } };
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

// ---------- Investigação ----------

export function caseAvailable(s: GameState, id: string): boolean {
  const c = CASES.find((x) => x.id === id)!;
  return c.requires.every((m) => missionDone(s, m));
}

export function solveCase(s0: GameState, id: string, marked: string[], answerIndex: number): { state: GameState; score: number; passed: boolean } {
  const c = CASES.find((x) => x.id === id);
  if (!c || !caseAvailable(s0, id) || s0.cases[id]?.done) return { state: s0, score: 0, passed: false };
  const correct = c.items.filter((i) => marked.includes(i.id) === i.suspicious).length;
  const score = correct / c.items.length;
  const passed = score >= 0.8 && answerIndex === c.question.answer;
  let s: GameState = { ...s0, cases: { ...s0.cases, [id]: { done: passed, score } } };
  if (passed) {
    s = { ...s, xp: s.xp + c.reward.xp, rep: s.rep + c.reward.rep, flags: s.flags.includes(c.flag) ? s.flags : [...s.flags, c.flag] };
    if (c.reward.money) s = tx(s, `Investigação: ${c.title}`, c.reward.money, "investigação");
    s = log(s, `Caso resolvido: ${c.title}`, "case");
    s = advanceChapter(s);
  }
  return { state: s, score, passed };
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
  return { ...base, ...g, version: SAVE_VERSION, stats: { ...base.stats, ...(g.stats ?? {}) }, dayStats: { ...base.dayStats, ...(g.dayStats ?? {}) } } as GameState;
}

export const ALL_ITEMS = ITEMS;
