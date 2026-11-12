// Progressão: eras, autoridade, conquistas, tutorial, objetivos de vitória e derrota.

import type { GameState } from "./state";
import { log } from "./state";
import { capacity, has } from "./economy";
import { authority } from "./events";
import { isLegend } from "./gladiators";
import { activateRival } from "./rival";
import { triggerRebellion } from "./crises";
import { AUTHORITY, ERAS } from "../content/world";
import { ACHIEVEMENTS, TUTORIAL } from "../content/story";

export function legends(s: GameState): number {
  return s.gladiators.filter(isLegend).length;
}

export interface Need {
  label: string;
  have: number;
  need: number;
}

/** O que falta para a próxima era. */
export function eraNeeds(s: GameState): Need[] {
  const next = ERAS[s.era];
  if (!next) return [];
  const n = next.needs;
  const out: Need[] = [];
  if (n.events) out.push({ label: "Espetáculos realizados", have: s.stats.events, need: n.events });
  if (n.fame) out.push({ label: "Fama", have: Math.floor(s.fame), need: n.fame });
  if (n.prestige) out.push({ label: "Prestígio", have: Math.floor(s.prestige), need: n.prestige });
  if (n.capacity) out.push({ label: "Lugares no Coliseu", have: capacity(s, "roma"), need: n.capacity });
  if (n.branches) out.push({ label: "Filiais", have: s.branches.length, need: n.branches });
  if (n.legends) out.push({ label: "Gladiadores lendários (fama 90+)", have: legends(s), need: n.legends });
  return out;
}

function advanceEra(s0: GameState, r: () => number): GameState {
  let s = s0;
  while (ERAS[s.era] && eraNeeds(s).every((n) => n.have >= n.need)) {
    const next = ERAS[s.era];
    s = { ...s, era: next.n, ep: s.ep + 4 + next.n * 2 };
    s = log(s, `ERA ${next.n}: ${next.name.toUpperCase()} — ${next.subtitle}.`, "era");
    if (next.n === 2 && !s.rival.active && !s.rival.defeated) s = activateRival(s, r);
    if (next.n === 6) s = { ...s, achievements: { ...s.achievements, era6: s.achievements.era6 ?? s.week } };
  }
  return s;
}

export function authorityName(s: GameState): string {
  return AUTHORITY[authority(s) - 1].name;
}

export function authorityProgress(s: GameState): { score: number; next: number | null } {
  const score = Math.round(s.fame + s.prestige * 3);
  const lvl = authority(s);
  return { score, next: AUTHORITY[lvl]?.needs ?? null };
}

// ---------- Vitória ----------

export interface Goal {
  id: string;
  label: string;
  have: number;
  need: number;
  done: boolean;
}

export function victoryGoals(s: GameState): Goal[] {
  const g = (id: string, label: string, have: number, need: number): Goal => ({ id, label, have: Math.floor(have), need, done: have >= need });
  const totalLevels = Object.values(s.buildings).reduce((a, b) => a + b, 0);
  const dominus = s.rival.defeated || s.stats.superiorWeeks >= 20 ? 1 : 0;
  const rebellion = s.flags.includes("rebeliao") && !s.pendingCrises.includes("rebeliao") && (!s.league || s.league.defeated) ? 1 : 0;
  const rivalsDone = dominus + rebellion;
  return [
    g("prestigio", "Prestígio mundial", s.prestige, 150),
    g("regioes", "Filiais pelo mundo", s.branches.length, 5),
    g("publico", "Espectadores ao longo da história", s.stats.spectators, 500000),
    g("lendas", "Gladiadores lendários ao mesmo tempo", legends(s), 3),
    g("estrutura", "Níveis de construção no Coliseu", (s.buildings.arquibancada ?? 0) >= 6 ? 30 : totalLevels, 30),
    g("rivais", "Rivais superados (Dominus derrotada ou 20 semanas de superioridade, e a Rebelião resolvida)", rivalsDone, 2),
    g("historia", "Reconhecimento histórico", s.nodes.includes("pre-historia") ? 1 : 0, 1),
  ];
}

// ---------- Derrota ----------

function checkDefeat(s0: GameState): GameState {
  if (s0.defeat || s0.victory && !s0.infinite) return s0;
  let s = s0;
  const stats = { ...s.stats };
  stats.redStreak = s.money < 0 ? stats.redStreak + 1 : 0;
  stats.weeksRed = s.money < 0 ? stats.weeksRed + 1 : stats.weeksRed;
  stats.popZero = s.popularity <= 0.5 ? stats.popZero + 1 : 0;
  stats.favorZero = s.favor <= 0.5 ? stats.favorZero + 1 : 0;
  s = { ...s, stats };
  if (stats.redStreak === 3) s = { ...s, achievements: { ...s.achievements, falido: s.achievements.falido ?? s.week } };
  let reason: string | null = null;
  if (stats.redStreak >= 5) reason = "Falência: cinco semanas seguidas no vermelho. Os credores tomaram o Coliseu.";
  else if (stats.popZero >= 4) reason = "O povo abandonou o Coliseu: popularidade zero por quatro semanas.";
  else if (stats.favorZero >= 4) reason = "Perda política: sem nenhum favor imperial, o Senado cassou a sua licença.";
  else if (s.rival.weeksDominant >= 12) reason = `Domínio do rival: a ${s.rival.name} tomou Roma.`;
  else if (s.league && s.league.weeksDominant >= 12) reason = "A Liga das Arenas Livres dominou o mundo dos espetáculos.";
  if (reason) s = log({ ...s, defeat: { week: s.week, reason } }, `DERROTA — ${reason}`, "era");
  return s;
}

// ---------- Conquistas ----------

function checkAchievements(s0: GameState): GameState {
  const a = { ...s0.achievements };
  const set = (id: string, cond: boolean) => {
    if (cond && a[id] === undefined) a[id] = s0.week;
  };
  const best = s0.reports[0];
  set("primeiro", s0.stats.events >= 1);
  set("lotado", s0.reports.some((r) => r.attendance >= r.capacity * 0.99));
  set("mil", s0.records.attendance >= 1000);
  set("dezmil", s0.records.attendance >= 10000);
  set("satisfacao", s0.records.satisfaction >= 95);
  set("rico", s0.money >= 50000);
  set("arvore10", s0.nodes.length >= 10);
  set("arvore40", s0.nodes.length >= 40);
  set("estrela", s0.gladiators.some((g) => g.fame >= 50));
  set("lenda", s0.gladiators.some(isLegend));
  set("tres-lendas", legends(s0) >= 3);
  set("desconhecido", s0.gladiators.some((g) => s0.rookies.includes(g.id) && g.fame >= 60));
  set("filial", s0.branches.length >= 1);
  set("mundo", s0.branches.length >= 5);
  set("bets-100", s0.bets.participants >= 1000);
  set("credibilidade", s0.bets.credibility >= 90);
  set("decreto", s0.stats.scripted >= 5);
  set("livre", s0.stats.free >= 30);
  set("crises", s0.stats.crises >= 10);
  set("naumaquia", s0.modalitiesDone.includes("naumaquia"));
  set("vitoria", !!s0.victory);
  let s = { ...s0, achievements: a };
  for (const d of ACHIEVEMENTS) if (a[d.id] !== undefined && s0.achievements[d.id] === undefined) s = log({ ...s, ep: s.ep + 1 }, `Conquista: ${d.title}.`, "conquista");
  void best;
  return s;
}

// ---------- Tutorial ----------

export function tutorialStep(s: GameState) {
  if (s.tutorialOff) return null;
  return TUTORIAL.find((t) => !s.tutorialDone.includes(t.id)) ?? null;
}

function checkTutorial(s: GameState): GameState {
  const done = [...s.tutorialDone];
  for (const t of TUTORIAL) {
    if (done.includes(t.id)) continue;
    const [k, v] = t.check.split(">=");
    const val = k === "events" ? s.stats.events : k === "week" ? s.week : k === "nodes" ? s.nodes.length : k === "builds" ? s.stats.builds : k === "hires" ? s.stats.hires : k === "era" ? s.era : 0;
    if (val >= Number(v)) done.push(t.id);
  }
  return done.length === s.tutorialDone.length ? s : { ...s, tutorialDone: done };
}

/** Também chamado depois de ações (não só no fim do turno). */
export function refresh(s: GameState): GameState {
  return checkTutorial(checkAchievements(s));
}

/** Fim de semana: eras, autoridade, rebelião, conquistas, vitória e derrota. */
export function weeklyProgression(s0: GameState, r: () => number): GameState {
  const authBefore = authority(s0);
  let s = advanceEra(s0, r);
  const authAfter = authority(s);
  if (authAfter > authBefore) s = log(s, `Autoridade: agora você é ${AUTHORITY[authAfter - 1].name}. ${AUTHORITY[authAfter - 1].unlocks}`, "era");
  // Rebelião: era 5 e domínio claro do mercado
  if (s.era >= 5 && !s.flags.includes("rebeliao") && (s.rival.defeated || s.fame > s.rival.fame * 2 || s.branches.length >= 4)) s = triggerRebellion(s);
  if (has(s, "monumentos")) s = { ...s, prestige: Math.round((s.prestige + 0.15 * s.flags.filter((f) => f === "monumento").length) * 10) / 10 };
  s = checkDefeat(s);
  if (!s.victory && victoryGoals(s).every((g) => g.done)) {
    s = log({ ...s, victory: { week: s.week } }, "VITÓRIA — o seu nome entrou para a história como o maior organizador de espetáculos do mundo.", "era");
  }
  return refresh(s);
}
