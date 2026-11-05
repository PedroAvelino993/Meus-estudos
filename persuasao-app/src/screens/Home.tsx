// Painel inicial: quem você é, como está o dia, o objetivo do capítulo, desafios e histórico.

import { BatteryMedium, Check, ChevronRight, CircleDollarSign, Clock, Flag, MapPin, Moon, Newspaper, ScrollText, Target, Trophy } from "lucide-react";
import Portrait from "../components/Portrait";
import { MISSIONS, character, district } from "../content";
import { EVENTS } from "../content/story";
import { DAY_END, RENT, availableHere, challengesToday, chapterGoal, claimChallenge, clock, gigsHere, levelOf, missionAvailable, missionDone, repTier, REP_TIERS, districtUnlocked } from "../core/game";
import type { GameState } from "../core/game";
import type { Look } from "../core/types";
import { Bar, Difficulty, Money, PLAYER_LOOKS, fmt, useGame } from "../ui";

export function playerLook(s: GameState): Look {
  const base = PLAYER_LOOKS[s.player.avatar] ?? PLAYER_LOOKS[0];
  const map: Record<string, Partial<Look>> = {
    camisa: { outfit: "shirt", outfitColor: "#E9E4DA", accent: "#FFFFFF" },
    jaqueta: { outfit: "jacket", outfitColor: "#3A2A22", accent: "#1C1C1C" },
    terno: { outfit: "suit", outfitColor: "#2A2F3A", accent: "#F2EEE6", extra: "tie" },
    elegante: { outfit: "suit", outfitColor: "#121418", accent: "#F7F4EE", extra: "bowtie" },
  };
  return { ...base, ...(map[s.outfit] ?? {}) };
}

export default function Home({ onEndDay }: { onEndDay: () => void }) {
  const { s, act, go, brief, toast, openPhone } = useGame();
  const lv = levelOf(s.xp);
  const tier = repTier(s.rep);
  const next = REP_TIERS.find((t) => t.min > s.rep);
  const ev = EVENTS.find((e) => e.id === s.event);
  const goal = chapterGoal(s);
  const here = district(s.location);
  const missionsHere = availableHere(s);
  const gigs = gigsHere(s);
  const elsewhere = MISSIONS.filter((m) => m.district !== s.location && missionAvailable(s, m) && districtUnlocked(s, m.district)).slice(0, 4);
  const challenges = challengesToday(s);
  const late = s.minute >= DAY_END - 30 || s.energy < 10;

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="card hero gold-edge">
        <div className="hero-portrait">
          <Portrait look={playerLook(s)} mood="happy" bg="#2a2412" title={s.player.name} />
        </div>
        <div className="grow">
          <div className="eyebrow">Capítulo {s.chapter} · Dia {s.day}</div>
          <h1 style={{ fontSize: "1.6rem", marginTop: 2 }}>{s.player.name}</h1>
          <div className="small muted">
            {tier.name}
            {next ? ` · faltam ${next.min - s.rep} de reputação para «${next.name}»` : ""}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <span className="small" style={{ minWidth: 64 }}>
              Nível {lv.level}
            </span>
            <div className="grow">
              <Bar value={lv.into} max={lv.need} label="Experiência" />
            </div>
            <span className="tiny muted">
              {lv.into}/{lv.need} XP
            </span>
          </div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span>Saldo</span>
          <b className="gold">{fmt(s.money)}</b>
        </div>
        <div className="stat">
          <span>Reputação</span>
          <b>{s.rep}</b>
        </div>
        <div className="stat">
          <span>Energia</span>
          <b className={s.energy < 25 ? "red" : ""}>{s.energy}%</b>
        </div>
        <div className="stat">
          <span>Horário</span>
          <b>{clock(s.minute)}</b>
        </div>
      </div>

      {ev && (
        <div className="card tight event-banner">
          <Newspaper size={20} />
          <div>
            <b>{ev.title}</b>
            <p className="small muted">{ev.text}</p>
          </div>
        </div>
      )}

      {late && (
        <div className="card tight row" style={{ borderColor: "rgba(201,164,76,.5)" }}>
          <Moon size={20} className="gold" />
          <div className="grow small">{s.energy < 10 ? "Você está sem energia para conversar. Tome um café ou vá descansar." : "Está ficando tarde. A cidade dorme às 22h."}</div>
          <button className="btn sm primary" onClick={onEndDay}>
            Dormir
          </button>
        </div>
      )}

      <div className="grid home">
        <div className="col" style={{ gap: 14 }}>
          <div className="card gold-edge">
            <div className="card-title">
              <Flag size={18} /> Capítulo {goal.chapter.n}: {goal.chapter.title}
            </div>
            <p className="small muted" style={{ marginBottom: 10 }}>
              {goal.chapter.goalText}
            </p>
            <div className="goal-line">
              <Check size={16} className={s.rep >= goal.chapter.goal.rep ? "green" : "muted"} />
              <span className="grow">Reputação</span>
              <span className="small muted">
                {goal.rep}/{goal.chapter.goal.rep}
              </span>
            </div>
            {goal.chapter.goal.story.map((id) => {
              const m = MISSIONS.find((x) => x.id === id)!;
              return (
                <div key={id} className="goal-line">
                  <Check size={16} className={missionDone(s, id) ? "green" : "muted"} />
                  <span className="grow">
                    {m.title} <span className="muted small">({character(m.npc).name.split(" ")[0]}, {district(m.district).name})</span>
                  </span>
                </div>
              );
            })}
            {goal.anyNeeded > 0 && (
              <div className="goal-line">
                <Check size={16} className={goal.any >= goal.anyNeeded ? "green" : "muted"} />
                <span className="grow">Outras missões do capítulo</span>
                <span className="small muted">
                  {goal.any}/{goal.anyNeeded}
                </span>
              </div>
            )}
            {s.ending && (
              <p className="small gold" style={{ marginTop: 8 }}>
                História concluída. Vila Áurea continua: há bicos, visitas e missões para terminar.
              </p>
            )}
          </div>

          <div className="card">
            <div className="row between" style={{ marginBottom: 10 }}>
              <div className="card-title" style={{ margin: 0 }}>
                <MapPin size={18} /> Você está em {here.name}
              </div>
              <button className="btn sm" onClick={() => go("district")}>
                Ver bairro <ChevronRight size={15} />
              </button>
            </div>
            <p className="small muted" style={{ marginBottom: 10 }}>
              {here.tagline}
            </p>
            <div className="list">
              {missionsHere.slice(0, 3).map((m) => (
                <button key={m.id} className="list-item mission-row" onClick={() => brief(m.id)}>
                  <div className="m-icon">
                    <Target size={18} />
                  </div>
                  <div className="grow">
                    <b>{m.title}</b>
                    <div className="small muted">
                      {character(m.npc).name} · <Difficulty n={m.difficulty} />
                    </div>
                  </div>
                  {m.story && <span className="chip gold">História</span>}
                </button>
              ))}
              {gigs.slice(0, 2).map((m) => (
                <button key={m.id} className="list-item mission-row gig" onClick={() => brief(m.id)}>
                  <div className="m-icon">
                    <CircleDollarSign size={18} />
                  </div>
                  <div className="grow">
                    <b>{m.title}</b>
                    <div className="small muted">Bico do dia · {character(m.npc).name}</div>
                  </div>
                  <span className="chip green">{fmt(m.rewards.money)}</span>
                </button>
              ))}
              {!missionsHere.length && !gigs.length && <div className="empty">Nada pendente por aqui hoje. Visite alguém ou vá para outro bairro.</div>}
            </div>
          </div>

          {elsewhere.length > 0 && (
            <div className="card">
              <div className="card-title">
                <MapPin size={18} /> Em outros bairros
              </div>
              <div className="list">
                {elsewhere.map((m) => (
                  <button key={m.id} className="list-item" onClick={() => go("map")}>
                    <div className="grow">
                      <b>{m.title}</b>
                      <div className="small muted">
                        {character(m.npc).name} · {district(m.district).name}
                      </div>
                    </div>
                    {m.story && <span className="chip gold">História</span>}
                    <ChevronRight size={16} className="muted" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col" style={{ gap: 14 }}>
          <div className="card">
            <div className="card-title">
              <Trophy size={18} /> Desafios do dia
            </div>
            <div className="list">
              {challenges.map((c) => {
                const v = Math.min(c.target, c.value(s.dayStats));
                const done = v >= c.target;
                const claimed = s.claimed.includes(c.id);
                return (
                  <div key={c.id} className="list-item challenge">
                    <div className="grow">
                      <b className="small">{c.title}</b>
                      <div className="row" style={{ marginTop: 5 }}>
                        <div className="grow">
                          <Bar value={v} max={c.target} tone="green" label={c.title} />
                        </div>
                        <span className="tiny muted">
                          {v}/{c.target}
                        </span>
                      </div>
                      <div className="tiny muted" style={{ marginTop: 3 }}>
                        Prêmio: {fmt(c.reward.money)} e {c.reward.xp} XP
                      </div>
                    </div>
                    {claimed ? (
                      <span className="chip green">
                        <Check size={12} /> Feito
                      </span>
                    ) : (
                      <button
                        className="btn sm primary"
                        disabled={!done}
                        onClick={() => {
                          act((g) => claimChallenge(g, c.id));
                          toast({ text: `Desafio cumprido: +${fmt(c.reward.money)}`, tone: "green" });
                        }}
                      >
                        Receber
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="row between" style={{ marginBottom: 10 }}>
              <div className="card-title" style={{ margin: 0 }}>
                <ScrollText size={18} /> Atividade recente
              </div>
              <button className="btn sm ghost" onClick={() => openPhone("banco")}>
                Extrato
              </button>
            </div>
            <div className="timeline">
              {s.history.slice(0, 8).map((h, i) => (
                <div key={i} className="timeline-item">
                  <time>
                    Dia {h.day}, {clock(h.minute)}
                  </time>
                  <span className={`dot ${h.kind}`} />
                  <span className="grow">{h.text}</span>
                </div>
              ))}
              {!s.history.length && <div className="empty">Sua história em Vila Áurea começa agora.</div>}
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <Moon size={18} /> Encerrar o dia
            </div>
            <p className="small muted" style={{ marginBottom: 10 }}>
              Dormir recupera sua energia. À noite, a Dona Cida cobra o aluguel ({fmt(RENT)}). {s.money < RENT && <span className="red">Seu saldo não cobre o aluguel.</span>}
            </p>
            <div className="row small muted" style={{ marginBottom: 10 }}>
              <Clock size={15} /> {clock(s.minute)} <BatteryMedium size={15} style={{ marginLeft: 8 }} /> {s.energy}% <span className="grow" /> Saldo <Money n={s.money} />
            </div>
            <button className="btn block" onClick={onEndDay}>
              <Moon size={16} /> Dormir e começar o dia {s.day + 1}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
