// Motor de conversa. Funções puras: recebem o estado e devolvem um novo estado.
// Guarda o que o jogador afirmou (para perceber contradições), o que já descobriu,
// interrupções, perguntas inesperadas, proposta, contraproposta e o desfecho.

import type { Attrs, Beat, Character, Claim, Mission, MissionOption, Outcome, Reaction, SideOption, Tactic } from "./types";
import { ATTRS } from "./types";
import { applyMood, reactionOf, tacticEffect, type Delta } from "./persona";
import { rngFrom } from "./rng";

export interface Relationship {
  affinity: number;
  met: number;
  outcomes: Outcome[];
  liesCaught: number;
  /** Necessidades já descobertas (ficam para sempre). */
  known: string[];
  notes: string[];
  lastDay: number;
}

export function newRelationship(): Relationship {
  return { affinity: 0, met: 0, outcomes: [], liesCaught: 0, known: [], notes: [], lastDay: 0 };
}

export interface PlayerCtx {
  name: string;
  perks: string[];
  /** Bônus de habilidade por abordagem (0–1), calculado das vantagens. */
  skill: Partial<Record<Tactic, number>>;
  items: string[];
  /** Ajustes iniciais vindos da roupa e de itens. */
  startMods: Partial<Attrs>;
  energy: number;
  reputation: number;
  socialClass: number;
  hour: number;
  worldMood: number;
  relationship: Relationship;
  /** Marcos da história já alcançados. */
  worldFlags: string[];
  /** Lê sinais com números (vantagem «Leitura fria»). */
}

export interface LogEntry {
  who: "npc" | "me" | "sys";
  text: string;
  reaction?: Reaction;
  tactic?: Tactic;
  delta?: Delta;
  kind?: "reveal" | "caught";
}

export interface Pending {
  kind: "interruption" | "probe";
  id: string;
  text: string;
  options: SideOption[];
}

export interface Counter {
  /** Para negociação: valor proposto pelo personagem. */
  price?: number;
  text: string;
}

export interface EncounterState {
  missionId: string;
  charId: string;
  attrs: Attrs;
  beat: string;
  turn: number;
  log: LogEntry[];
  known: string[];
  claims: Record<string, { value: string; label: string; truthful: boolean; turn: number; caught?: boolean }>;
  used: string[];
  tactics: Tactic[];
  flags: string[];
  pending: Pending | null;
  counter: Counter | null;
  closeAttempts: number;
  status: "active" | "done";
  outcome: Outcome | null;
  liesTold: number;
  liesCaught: number;
  integrity: number;
  spent: number;
  seed: number;
  warnedPatience: boolean;
  lastReaction: Reaction;
  /** Preço final (negociação). */
  price?: number;
  usedSide: string[];
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));

function pick<T>(list: T[], r: () => number): T {
  return list[Math.floor(r() * list.length)];
}

export function fill(text: string, c: Character, p: { name: string }, extra: Record<string, string> = {}): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => ({ player: p.name, name: c.nick ?? c.name.split(" ")[0], ...extra })[k] ?? `{${k}}`);
}

// ---------- Início ----------

export function startEncounter(m: Mission, c: Character, p: PlayerCtx, seed: number): EncounterState {
  const r = rngFrom(seed);
  const rel = p.relationship;
  const outOfHours = p.hour < c.hours[0] || p.hour >= c.hours[1];
  const base: Attrs = {
    trust: 30 + rel.affinity / 4 + Math.min(10, p.reputation / 10) - c.suspicion * 3,
    interest: 30,
    patience: 88 - c.traits.impatience * 22 - (outOfHours ? 12 : 0),
    suspicion: c.suspicion * 11 + (rel.liesCaught ? 25 : 0),
    mood: c.baseMood + p.worldMood + (r() * 20 - 10),
    credibility: 22 + Math.min(25, p.reputation / 4),
    affinity: 30 + rel.affinity / 3,
  };
  for (const [k, v] of Object.entries(m.start ?? {})) base[k as keyof Attrs] += v as number;
  for (const [k, v] of Object.entries(p.startMods)) base[k as keyof Attrs] += v as number;
  if (p.energy < 30) base.credibility -= 5;
  for (const k of ATTRS) base[k] = clamp(Math.round(base[k]));

  const greet = rel.met > 0 ? pick(c.voice.greetAgain, r) : pick(c.voice.greet, r);
  const log: LogEntry[] = [{ who: "npc", text: fill(greet, c, p) }];
  if (rel.liesCaught > 0) log.push({ who: "npc", text: "E da última vez você não foi muito sincero comigo. Vou prestar atenção.", reaction: "skeptical" });
  if (outOfHours) log.push({ who: "sys", text: `${c.name.split(" ")[0]} não costuma ter tempo neste horário: a paciência começa menor.` });
  const first = m.beats[0];
  log.push({ who: "npc", text: fill(pick(first.npc, r), c, p) });

  return {
    missionId: m.id,
    charId: c.id,
    attrs: base,
    beat: first.id,
    turn: 0,
    log,
    known: [...rel.known],
    claims: {},
    used: [],
    tactics: [],
    flags: [],
    pending: null,
    counter: null,
    closeAttempts: 0,
    status: "active",
    outcome: null,
    liesTold: 0,
    liesCaught: 0,
    integrity: 0,
    spent: 0,
    seed: Math.floor(r() * 2 ** 31),
    warnedPatience: false,
    lastReaction: "neutral",
    usedSide: [],
  };
}

// ---------- Opções ----------

export interface ShownOption {
  id: string;
  text: string;
  tactic: Tactic;
  /** Opção nova graças a uma necessidade descoberta. */
  insight?: boolean;
  bluff?: boolean;
  /** Contradiz algo que você já disse (só aparece com o caderno ou «Memória afiada»). */
  contradicts?: string;
  cost?: number;
  universal?: boolean;
}

function beatOf(m: Mission, id: string): Beat {
  return m.beats.find((b) => b.id === id) ?? m.beats[0];
}

function optionVisible(o: MissionOption, s: EncounterState, p: PlayerCtx): boolean {
  if (s.used.includes(o.id)) return false;
  if (o.needs && !s.known.includes(o.needs)) return false;
  if (o.requiresItem && !p.items.includes(o.requiresItem)) return false;
  if (o.requiresPerk && !p.perks.includes(o.requiresPerk)) return false;
  if (o.ifFlag && !s.flags.includes(o.ifFlag)) return false;
  if (o.notFlag && s.flags.includes(o.notFlag)) return false;
  if (o.ifWorld && !p.worldFlags.includes(o.ifWorld)) return false;
  return true;
}

export function optionsFor(s: EncounterState, m: Mission, c: Character, p: PlayerCtx): ShownOption[] {
  if (s.status !== "active" || s.pending || s.counter) return [];
  const b = beatOf(m, s.beat);
  const out: ShownOption[] = b.options
    .filter((o) => optionVisible(o, s, p))
    .map((o) => {
      const warn = p.items.includes("caderno") || p.perks.includes("memoria");
      const prev = o.claim ? s.claims[o.claim.key] : undefined;
      const contradicts = warn && prev && prev.value !== o.claim!.value ? prev.label : undefined;
      return { id: o.id, text: fill(o.text, c, p), tactic: o.tactic, insight: !!o.needs, bluff: o.truthful === false, cost: o.cost, contradicts };
    });

  const unknown = c.needs.filter((n) => !s.known.includes(n.id));
  const askedRecently = s.used.slice(-2).includes("u-question");
  if (unknown.length && !askedRecently) out.push({ id: "u-question", text: `Perguntar o que mais pesa para ${c.nick ?? c.name.split(" ")[0]} nessa decisão`, tactic: "question", universal: true });
  for (const [i, it] of c.interests.entries()) {
    const id = `u-interest-${i}`;
    if (!s.used.includes(id) && s.turn >= 1 && out.filter((o) => o.tactic === "rapport").length < 1) out.push({ id, text: it.line, tactic: "rapport", universal: true });
  }
  if (["offended", "impatient", "skeptical"].includes(s.lastReaction) && !s.used.slice(-1).includes("u-change")) {
    out.push({ id: "u-change", text: "Mudar de assunto e aliviar o clima", tactic: "changeSubject", universal: true });
  }
  if (!s.used.includes("u-honest") && s.turn >= 2) out.push({ id: "u-honest", text: "Ser franco sobre o que você pode e o que não pode garantir", tactic: "honesty", universal: true });
  if (b.canClose || s.turn >= 3) out.push({ id: "u-close", text: m.negotiation ? "Fazer uma oferta" : m.id.startsWith("visit:") ? "Despedir-se e combinar de voltar" : "Fazer a proposta", tactic: "close", universal: true });
  out.push({ id: "u-leave", text: "Encerrar a conversa", tactic: "leave", universal: true });
  return out;
}

// ---------- Escolha ----------

function apply(attrs: Attrs, d: Delta): Attrs {
  const out = { ...attrs };
  for (const [k, v] of Object.entries(d)) out[k as keyof Attrs] = clamp(Math.round(out[k as keyof Attrs] + (v as number)));
  return out;
}

function sum(a: Delta, b: Delta): Delta {
  const out: Delta = { ...a };
  for (const [k, v] of Object.entries(b)) out[k as keyof Attrs] = (out[k as keyof Attrs] ?? 0) + (v as number);
  return out;
}

const POSITIVE: Reaction[] = ["warm", "interested", "considering", "amused"];

export function isPositive(r: Reaction) {
  return POSITIVE.includes(r);
}

function nextBeatId(m: Mission, s: EncounterState, p: PlayerCtx, current: string): string {
  const b = beatOf(m, current);
  const remaining = b.options.filter((o) => optionVisible(o, s, p));
  if (remaining.length > 1) return current;
  const i = m.beats.findIndex((x) => x.id === current);
  return m.beats[Math.min(m.beats.length - 1, i + 1)].id;
}

/** Contradição: mesma afirmação com valor diferente. */
function checkClaim(s: EncounterState, claim: Claim): { contradicts?: { before: string } } {
  const prev = s.claims[claim.key];
  if (prev && prev.value !== claim.value) return { contradicts: { before: prev.label } };
  return {};
}

/** Abordagens possíveis numa fala livre (propor e encerrar têm caminhos próprios). */
export const FREE_TACTICS: Tactic[] = ["explain", "evidence", "empathy", "question", "rapport", "authority", "socialProof", "urgency", "flattery", "humor", "concession", "pressure", "reframe", "honesty", "changeSubject"];

const CAUGHT: Delta = { trust: -25, suspicion: 30, credibility: -20, affinity: -10, patience: -10 };

export function choose(s0: EncounterState, optionId: string, m: Mission, c: Character, p: PlayerCtx): EncounterState {
  if (s0.status !== "active" || s0.pending || s0.counter) return s0;
  const r = rngFrom(s0.seed);
  let s: EncounterState = { ...s0, log: [...s0.log], used: [...s0.used, optionId], tactics: [...s0.tactics], known: [...s0.known], claims: { ...s0.claims }, flags: [...s0.flags], turn: s0.turn + 1 };

  const b = beatOf(m, s.beat);
  const scripted = b.options.find((o) => o.id === optionId);
  // Fala livre digitada pelo jogador: "u-free:<abordagem>"
  const freeTactic = optionId.startsWith("u-free:") ? (optionId.slice(7) as Tactic) : null;
  const universalShown = freeTactic && FREE_TACTICS.includes(freeTactic) ? { id: optionId, text: "", tactic: freeTactic } : optionsFor(s0, m, c, p).find((o) => o.id === optionId);
  if (!scripted && !universalShown) return s0;
  const tactic: Tactic = scripted?.tactic ?? universalShown!.tactic;
  const text = scripted ? fill(scripted.text, c, p) : universalShown!.text;

  if (tactic === "close") return proposal({ ...s, used: s0.used }, m, c, p);
  if (tactic === "leave") return finish({ ...s, log: [...s.log, { who: "me", text }] }, "left", m, c, p);

  s.log.push({ who: "me", text, tactic });
  if (scripted?.cost) s.spent += scripted.cost;

  let repeats = 0;
  for (let i = s.tactics.length - 1; i >= 0 && s.tactics[i] === tactic; i--) repeats++;
  s.tactics.push(tactic);
  const boosts = c.needs.filter((n) => s.known.includes(n.id)).flatMap((n) => n.boosts);
  const targetsNeed = (!!scripted?.needs && s.known.includes(scripted.needs)) || boosts.includes(tactic);

  let d = tacticEffect(c, tactic, {
    repeats,
    targetsNeed,
    skill: p.skill[tactic] ?? 0,
    credibility: s.attrs.credibility,
    statusGap: c.socialClass - p.socialClass,
  });
  if (scripted?.mod) d = sum(d, scripted.mod);
  d = applyMood(d, s.attrs.mood);
  if (p.energy < 30) for (const k of Object.keys(d) as (keyof Attrs)[]) if ((d[k] ?? 0) > 0 && k !== "suspicion") d[k] = d[k]! * 0.8;
  d = sum(d, { patience: -(1.5 + c.traits.impatience * 2.5) });

  let reaction = reactionOf(d, tactic, c);
  const lines: string[] = [];

  // Afirmações e contradições
  if (scripted?.claim) {
    const chk = checkClaim(s, scripted.claim);
    if (chk.contradicts) {
      const notice = 0.25 + c.intelligence * 0.13;
      if (r() < notice) {
        d = sum(d, CAUGHT);
        reaction = "skeptical";
        s.liesCaught++;
        s.integrity -= 2;
        lines.push(fill(pick(c.voice.caughtLie, r), c, p, { before: chk.contradicts.before }));
        s.log.push({ who: "sys", text: "Contradição percebida: confiança e credibilidade despencaram.", kind: "caught" });
      }
    }
    if (!s.claims[scripted.claim.key]) s.claims[scripted.claim.key] = { value: scripted.claim.value, label: scripted.claim.label, truthful: scripted.truthful !== false, turn: s.turn };
  }
  if (scripted?.truthful === false || tactic === "bluff") {
    s.liesTold++;
    s.integrity -= 3;
  }
  if (tactic === "flattery" || tactic === "urgency" || tactic === "pressure") s.integrity -= 1;
  if (tactic === "honesty" || tactic === "empathy") s.integrity += 1;

  // Pergunta universal: descobrir uma necessidade
  if (optionId === "u-question") {
    const unknown = c.needs.filter((n) => !s.known.includes(n.id));
    const chance = Math.max(0.15, Math.min(0.95, (s.attrs.trust - 15) / 55 + (p.skill.question ?? 0) * 0.3));
    if (unknown.length && r() < chance) {
      const n = unknown[0];
      s.known.push(n.id);
      lines.push(fill(n.reveal, c, p));
      s.log.push({ who: "sys", text: `Você descobriu: ${n.label}`, kind: "reveal" });
      reaction = "warm";
    } else {
      lines.push(fill(pick(c.voice.deflect, r), c, p));
      reaction = "neutral";
    }
  } else if (optionId.startsWith("u-interest-")) {
    const it = c.interests[Number(optionId.split("-")[2])];
    lines.push(fill(it.reply, c, p));
  } else if (scripted?.reply) {
    const rep = typeof scripted.reply === "string" ? scripted.reply : isPositive(reaction) || reaction === "neutral" ? scripted.reply.good : scripted.reply.bad;
    lines.unshift(fill(rep, c, p));
  }

  // Revelação roteirizada
  if (scripted?.reveals && !s.known.includes(scripted.reveals) && (isPositive(reaction) || reaction === "neutral")) {
    const n = c.needs.find((x) => x.id === scripted.reveals);
    if (n) {
      s.known.push(n.id);
      lines.push(fill(n.reveal, c, p));
      s.log.push({ who: "sys", text: `Você descobriu: ${n.label}`, kind: "reveal" });
    }
  }
  if (scripted?.flag) s.flags.push(scripted.flag);

  // Reação da personalidade quando não há fala roteirizada
  if (!lines.length) lines.push(fill(pick(c.voice.reactions[reaction], r), c, p));

  s.attrs = apply(s.attrs, d);
  s.lastReaction = reaction;
  for (const l of lines) s.log.push({ who: "npc", text: l, reaction, delta: d });

  // Blefes antigos podem ser descobertos
  for (const [k, cl] of Object.entries(s.claims)) {
    if (cl.truthful || cl.caught || cl.turn === s.turn) continue;
    const chance = 0.03 * c.intelligence + s.attrs.suspicion / 500;
    if (r() < chance) {
      s.claims[k] = { ...cl, caught: true };
      s.attrs = apply(s.attrs, CAUGHT);
      s.liesCaught++;
      s.lastReaction = "skeptical";
      s.log.push({ who: "npc", text: fill(pick(c.voice.caughtLie, r), c, p, { before: cl.label }), reaction: "skeptical" });
      s.log.push({ who: "sys", text: "Um blefe antigo foi descoberto.", kind: "caught" });
      break;
    }
  }

  // Avança a etapa
  s.beat = scripted?.next ?? nextBeatId(m, s, p, s.beat);
  if (scripted?.next) {
    const nb = beatOf(m, scripted.next);
    s.log.push({ who: "npc", text: fill(pick(nb.npc, r), c, p) });
  } else if (s.beat !== s0.beat) {
    s.log.push({ who: "npc", text: fill(pick(beatOf(m, s.beat).npc, r), c, p) });
  }

  // Limites: paciência acabou ou afinidade no chão
  if (s.attrs.patience <= 0) return finish(s, "walkout", m, c, p, rngFrom(Math.floor(r() * 1e9)));
  if (s.attrs.affinity <= 3 && (reaction === "offended" || c.traits.pride > 0.6)) return finish(s, "walkout", m, c, p, rngFrom(Math.floor(r() * 1e9)));
  if (s.attrs.patience < 28 && !s.warnedPatience) {
    s.warnedPatience = true;
    s.log.push({ who: "npc", text: fill(pick(c.voice.reactions.impatient, r), c, p), reaction: "impatient" });
  }

  // Interrupções e perguntas inesperadas
  if (s.turn >= 2 && r() < 0.22) {
    const probeFirst = s.attrs.suspicion > 35 || c.traits.analytical > 0.55;
    const probes = c.probes.filter((x) => !s.usedSide.includes(x.id));
    const ints = c.interruptions.filter((x) => !s.usedSide.includes(x.id));
    const pool = probeFirst ? [...probes.map((x) => ({ k: "probe" as const, x })), ...ints.map((x) => ({ k: "interruption" as const, x }))] : [...ints.map((x) => ({ k: "interruption" as const, x })), ...probes.map((x) => ({ k: "probe" as const, x }))];
    const ev = pool[0];
    if (ev) {
      const textEv = ev.k === "probe" ? (ev.x as { question: string }).question : (ev.x as { text: string }).text;
      s.pending = { kind: ev.k, id: ev.x.id, text: fill(textEv, c, p), options: ev.x.options };
      s.usedSide = [...s.usedSide, ev.x.id];
      s.log.push({ who: "npc", text: fill(textEv, c, p), reaction: ev.k === "probe" ? "considering" : "neutral" });
    }
  }

  s.seed = Math.floor(r() * 2 ** 31);
  return s;
}

/** Resposta a uma interrupção ou pergunta inesperada. */
export function answerSide(s0: EncounterState, index: number, m: Mission, c: Character, p: PlayerCtx): EncounterState {
  if (!s0.pending) return s0;
  const r = rngFrom(s0.seed);
  const o = s0.pending.options[index];
  if (!o) return s0;
  const s: EncounterState = { ...s0, log: [...s0.log, { who: "me", text: fill(o.text, c, p) }], pending: null, claims: { ...s0.claims } };
  let d: Delta = { ...o.effect };
  const lines = [fill(o.reply, c, p)];
  if (o.claim) {
    const chk = checkClaim(s, o.claim);
    if (chk.contradicts && r() < 0.25 + c.intelligence * 0.13) {
      d = sum(d, CAUGHT);
      s.liesCaught++;
      lines.push(fill(pick(c.voice.caughtLie, r), c, p, { before: chk.contradicts.before }));
      s.log.push({ who: "sys", text: "Contradição percebida.", kind: "caught" });
    }
    if (!s.claims[o.claim.key]) s.claims[o.claim.key] = { value: o.claim.value, label: o.claim.label, truthful: o.kind !== "bluff", turn: s.turn };
  }
  if (o.kind === "bluff") {
    s.liesTold++;
    s.integrity -= 3;
  }
  if (o.kind === "honest") s.integrity += 1;
  s.attrs = apply(s.attrs, d);
  const reaction: Reaction = (d.trust ?? 0) + (d.affinity ?? 0) > 4 ? "warm" : (d.suspicion ?? 0) > 5 ? "skeptical" : (d.patience ?? 0) < -6 ? "impatient" : "neutral";
  s.lastReaction = reaction;
  for (const l of lines) s.log.push({ who: "npc", text: l, reaction, delta: d });
  s.seed = Math.floor(r() * 2 ** 31);
  if (s.attrs.patience <= 0) return finish(s, "walkout", m, c, p, r);
  return s;
}

// ---------- Proposta ----------

/** Pontuação de convencimento. */
export function persuasionScore(a: Attrs): number {
  return Math.round(0.3 * a.interest + 0.28 * a.trust + 0.15 * a.affinity + 0.15 * a.credibility + 0.12 * a.mood - 0.35 * a.suspicion);
}

/** Preço que o personagem aceitaria agora (negociação). */
export function acceptablePrice(m: Mission, a: Attrs, perks: string[] = []): number {
  const n = m.negotiation!;
  const score = persuasionScore(a);
  const f = Math.max(0, Math.min(1, (score - m.threshold + 20) / 45));
  let v = n.anchor + (n.limit - n.anchor) * f;
  // «Negociador»: 6% melhor para o jogador
  if (perks.includes("negociador")) v = n.npcSells ? v * 0.94 : v * 1.06;
  return Math.round(v / 5) * 5;
}

/** Fazer a proposta (sem preço) ou abrir a negociação de preço. */
function proposal(s0: EncounterState, m: Mission, c: Character, p: PlayerCtx): EncounterState {
  const s: EncounterState = { ...s0, used: [...s0.used, "u-close"], log: [...s0.log] };
  if (m.negotiation) {
    // A interface pede o valor: mostramos a âncora do personagem
    const n = m.negotiation;
    s.log.push({ who: "me", text: n.npcSells ? `Vamos falar de valor. Quanto você quer pelo ${n.item}?` : `Vamos falar de valor. Quanto você paga pelo ${n.item}?`, tactic: "close" });
    s.log.push({ who: "npc", text: `Eu pensei em ₢ ${n.anchor}.`, reaction: "considering" });
    s.counter = { price: n.anchor, text: "Faça sua oferta" };
    return s;
  }
  return resolveProposal(s, m, c, p);
}

function resolveProposal(s0: EncounterState, m: Mission, c: Character, p: PlayerCtx): EncounterState {
  const r = rngFrom(s0.seed);
  const s: EncounterState = { ...s0, log: [...s0.log], closeAttempts: s0.closeAttempts + 1 };
  s.log.push({ who: "me", text: m.id.startsWith("visit:") ? "Foi muito bom conversar. Posso voltar outro dia?" : "Então, o que me diz? Fechamos?", tactic: "close" });
  const score = persuasionScore(s.attrs);
  const T = m.threshold - (p.perks.includes("fechador") ? 6 : 0);
  if (score >= T + 15) return finish(s, "great", m, c, p, r);
  if (score >= T) return finish(s, "good", m, c, p, r);
  if (score >= T - 10) {
    s.counter = { text: "Assim, não. Mas topo uma versão menor: menos compromisso, menos resultado. Fechamos o meio-termo?" };
    s.log.push({ who: "npc", text: s.counter.text, reaction: "considering" });
    return s;
  }
  s.attrs = apply(s.attrs, { patience: -18, trust: -4, interest: -4 });
  s.lastReaction = "skeptical";
  s.log.push({ who: "npc", text: fill(pick(c.voice.reactions.skeptical, r), c, p) + " Ainda não estou convencido.", reaction: "skeptical" });
  if (s.closeAttempts >= 3 || s.attrs.patience <= 0) return finish(s, s.attrs.patience <= 0 ? "walkout" : "fail", m, c, p, r);
  s.seed = Math.floor(r() * 2 ** 31);
  return s;
}

/** Oferta de preço do jogador numa negociação. */
export function offer(s0: EncounterState, price: number, m: Mission, c: Character, p: PlayerCtx): EncounterState {
  if (!m.negotiation || !s0.counter) return s0;
  const r = rngFrom(s0.seed);
  const n = m.negotiation;
  const s: EncounterState = { ...s0, log: [...s0.log], closeAttempts: s0.closeAttempts + 1 };
  s.log.push({ who: "me", text: `Minha oferta é ₢ ${price}.`, tactic: "close" });
  const ok = acceptablePrice(m, s.attrs, p.perks);
  const accepts = n.npcSells ? price >= ok : price <= ok;
  // Oferta ofensiva (muito longe do justo) irrita
  const insult = n.npcSells ? price < n.fair * 0.55 : price > n.fair * 1.6;
  if (accepts) {
    s.price = price;
    const fairness = n.npcSells ? (n.clientLimit - price) / Math.max(1, n.clientLimit - n.limit) : (price - n.clientLimit) / Math.max(1, n.limit - n.clientLimit);
    if (n.npcSells ? price > n.clientLimit : price < n.clientLimit) {
      s.log.push({ who: "sys", text: "Esse valor passa do limite que o seu cliente autorizou." });
      s.counter = { price: ok, text: "Faça sua oferta" };
      return s;
    }
    return finish(s, fairness >= 0.5 ? "great" : "good", m, c, p, r);
  }
  if (insult) {
    s.attrs = apply(s.attrs, { affinity: -15, patience: -15, trust: -8 });
    s.log.push({ who: "npc", text: fill(pick(c.voice.reactions.offended, r), c, p), reaction: "offended" });
  } else {
    const counterPrice = Math.round(((price + ok) / 2) / 5) * 5;
    s.attrs = apply(s.attrs, { patience: -8 });
    s.log.push({ who: "npc", text: `Por ₢ ${price} não dá. Faço por ₢ ${counterPrice}.`, reaction: "considering" });
    s.counter = { price: counterPrice, text: "Contraproposta" };
  }
  if (s.closeAttempts >= 5 || s.attrs.patience <= 0) return finish(s, s.attrs.patience <= 0 ? "walkout" : "fail", m, c, p, r);
  s.seed = Math.floor(r() * 2 ** 31);
  return s;
}

/** Aceitar a contraproposta do personagem. */
export function acceptCounter(s0: EncounterState, m: Mission, c: Character, p: PlayerCtx): EncounterState {
  if (!s0.counter) return s0;
  const r = rngFrom(s0.seed);
  const s: EncounterState = { ...s0, log: [...s0.log, { who: "me", text: "Fechado." }] };
  if (m.negotiation) {
    const price = s0.counter.price ?? m.negotiation.anchor;
    const n = m.negotiation;
    if (n.npcSells ? price > n.clientLimit : price < n.clientLimit) {
      s.log.push({ who: "sys", text: "Esse valor passa do limite do seu cliente. Faça outra oferta ou volte a conversar." });
      return s;
    }
    s.price = price;
    return finish(s, "partial", m, c, p, r);
  }
  return finish(s, "partial", m, c, p, r);
}

/** Recusar a contraproposta e continuar conversando. */
export function rejectCounter(s0: EncounterState): EncounterState {
  if (!s0.counter) return s0;
  return {
    ...s0,
    counter: null,
    attrs: apply(s0.attrs, { patience: -6 }),
    log: [...s0.log, { who: "me", text: "Ainda não. Deixa eu te explicar melhor." }],
  };
}

// ---------- Fim ----------

export interface Result {
  outcome: Outcome;
  money: number;
  xp: number;
  rep: number;
  affinity: number;
  integrity: number;
  ending: string;
  price?: number;
  notes: string[];
}

function finish(s0: EncounterState, outcome: Outcome, _m: Mission, c: Character, p: PlayerCtx, r = rngFrom(s0.seed)): EncounterState {
  const s: EncounterState = { ...s0, status: "done", outcome, counter: null, pending: null, log: [...s0.log] };
  const v = c.voice;
  const line = outcome === "walkout" ? pick(v.walkout, r) : outcome === "great" || outcome === "good" || outcome === "partial" ? pick(v.farewellGood, r) : pick(v.farewellBad, r);
  s.log.push({ who: "npc", text: fill(line, c, p), reaction: outcome === "walkout" ? "offended" : outcome === "fail" ? "skeptical" : "warm" });
  return s;
}

export function resultOf(s: EncounterState, m: Mission, c: Character): Result {
  const o = s.outcome ?? "left";
  const mult = { great: 1.35, good: 1, partial: 0.5, fail: 0, walkout: 0, left: 0 }[o];
  let money = Math.round(m.rewards.money * mult);
  if (m.negotiation && s.price !== undefined && (o === "great" || o === "good" || o === "partial")) {
    const n = m.negotiation;
    // Comissão extra: metade da economia em relação ao limite do cliente
    const saved = n.npcSells ? n.clientLimit - s.price : s.price - n.clientLimit;
    money += Math.max(0, Math.round(saved * 0.5));
  }
  const xp = Math.round(m.rewards.xp * ({ great: 1.3, good: 1, partial: 0.7, fail: 0.4, walkout: 0.25, left: 0.2 }[o]));
  let rep = Math.round(m.rewards.rep * ({ great: 1.4, good: 1, partial: 0.4, fail: 0, walkout: 0, left: 0 }[o]));
  if (o === "fail") rep -= 1;
  if (o === "walkout") rep -= 3;
  rep -= s.liesCaught * 4;
  const affinity = Math.round((s.attrs.affinity - 40) / 3 + (o === "great" ? 10 : o === "good" ? 6 : o === "walkout" ? -12 : 0) - s.liesCaught * 15);
  const ending = { great: m.endings.great, good: m.endings.good, partial: m.endings.partial, fail: m.endings.fail, walkout: m.endings.walkout, left: m.endings.fail }[o];
  const notes: string[] = [];
  if (s.liesCaught) notes.push(`${c.name.split(" ")[0]} pegou você numa contradição.`);
  if (o === "great") notes.push(`Fechou um ótimo acordo: «${m.title}».`);
  else if (o === "good") notes.push(`Fechou acordo: «${m.title}».`);
  else if (o === "walkout") notes.push("Foi embora no meio da conversa.");
  return { outcome: o, money: money - s.spent, xp, rep, affinity, integrity: s.integrity, ending, price: s.price, notes };
}
