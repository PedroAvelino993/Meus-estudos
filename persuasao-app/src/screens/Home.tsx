// Painel inicial: quem você é, como está o dia, o objetivo do capítulo, desafios e histórico.

import { BatteryMedium, Check, ChevronRight, CircleDollarSign, Clock, Flag, MapPin, Moon, Newspaper, ScrollText, Target, Trophy } from "lucide-react";
import Portrait from "../components/Portrait";
import { MISSIONS, character, district, item } from "../content";
import { heatLabel } from "../phone/apps2";
import { EVENTS } from "../content/story";
import { DAY_END, RENT, availableHere, challengesToday, chapterGoal, claimChallenge, clock, fareTo, gigsHere, levelOf, missionAvailable, missionDone, missionLock, districtUnlocked, travel } from "../core/game";
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
            {heatLabel(s.heat)} · prisões {s.arrests}/3
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

      <NextStep />

      <div className="stat-row">
        <div className="stat">
          <span>Saldo</span>
          <b className="gold">{fmt(s.money)}</b>
        </div>
        <div className="stat">
          <span>Calor policial</span>
          <b className={s.heat >= 65 ? "red" : s.heat >= 40 ? "gold" : "green"}>{s.heat}/100</b>
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
            {goal.chapter.goal.money ? (
              <div className="goal-line">
                <Check size={16} className={goal.moneyOk ? "green" : "muted"} />
                <span className="grow">Juntar dinheiro</span>
                <span className="small muted">
                  {fmt(goal.money)}/{fmt(goal.chapter.goal.money)}
                </span>
              </div>
            ) : null}
            {(goal.chapter.goal.items ?? []).map((id) => (
              <div key={id} className="goal-line">
                <Check size={16} className={s.items.includes(id) ? "green" : "muted"} />
                <span className="grow">
                  Comprar: {item(id)?.name} <span className="muted small">({fmt(item(id)?.price ?? 0)}, Mercado)</span>
                </span>
              </div>
            ))}
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
                <span className="grow">Outros golpes do capítulo</span>
                <span className="small muted">
                  {goal.any}/{goal.anyNeeded}
                </span>
              </div>
            )}
            {s.ending && (
              <p className="small gold" style={{ marginTop: 8 }}>
                História concluída. Vila Áurea continua: há golpes rápidos e alvos que ficaram para trás.
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
                    <div className="small muted">Golpe rápido · {character(m.npc).name}</div>
                  </div>
                  <span className="chip green">{fmt(m.rewards.money)}</span>
                </button>
              ))}
              {!missionsHere.length && !gigs.length && <div className="empty">Nenhum alvo disponível aqui hoje. Sonde alguém com uma visita ou mude de bairro.</div>}
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
              Dormir recupera sua energia e esfria o calor policial em 12 pontos. À noite, a Dona Cida cobra o aluguel ({fmt(RENT)}). {s.money < RENT && <span className="red">Seu saldo não cobre o aluguel.</span>}
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

/** O que fazer agora, em uma frase e um botão. */
function NextStep() {
  const { s, act, go, brief, openPhone, toast } = useGame();
  const goal = chapterGoal(s);
  const ch = goal.chapter;
  let title = "";
  let detail = "";
  let action: { label: string; run: () => void } | null = null;

  const pendingStory = ch.goal.story.map((id) => MISSIONS.find((m) => m.id === id)!).find((m) => !missionDone(s, m.id));
  const pendingAny = ch.goal.anyOf && goal.any < goal.anyNeeded ? MISSIONS.filter((m) => ch.goal.anyOf!.missions.includes(m.id) && !missionDone(s, m.id)) : [];
  const missingItem = (ch.goal.items ?? []).find((i) => !s.items.includes(i));
  const candidates = [pendingStory, ...pendingAny].filter(Boolean) as typeof MISSIONS;
  const ready = candidates.find((m) => missionAvailable(s, m) && districtUnlocked(s, m.district));

  const goTo = (m: (typeof MISSIONS)[number]) => () => {
    if (s.location !== m.district) {
      const after = act((g) => travel(g, m.district));
      if (after.location !== m.district) {
        toast({ text: `Não deu para ir até ${district(m.district).name} agora (passagem ou horário).`, tone: "red" });
        return;
      }
    }
    go("district");
    brief(m.id);
  };

  if (s.ending) {
    title = "A história acabou — mas a cidade continua.";
    detail = "Aplique golpes rápidos e termine os alvos que ficaram para trás.";
  } else if (s.energy < 15 || s.minute >= DAY_END - 30) {
    title = "Hora de dormir.";
    detail = "Sem energia (ou tarde demais) para conversar. Durma para começar um novo dia.";
  } else if (ready) {
    const c = character(ready.npc);
    title = `Aplique o golpe «${ready.title}» em ${c.name.split(" ")[0]}.`;
    detail = `${ready.objective} ${s.location === ready.district ? `Você já está em ${district(ready.district).name}.` : `Fica em ${district(ready.district).name} (passagem ${fmt(fareTo(s, ready.district))}).`}`;
    action = { label: s.location === ready.district ? "Falar agora" : `Ir para ${district(ready.district).name}`, run: goTo(ready) };
  } else if (missingItem) {
    const it = item(missingItem)!;
    title = `Compre: ${it.name} (${fmt(it.price)}).`;
    detail = s.money >= it.price ? "Abra o celular → Mercado → Ferramentas." : `Você tem ${fmt(s.money)}. Junte o resto com golpes rápidos ou vendendo o butim (celular → Central).`;
    action = s.money >= it.price ? { label: "Abrir o Mercado", run: () => openPhone("loja") } : { label: "Ver golpes rápidos", run: () => go("district") };
  } else if (ch.goal.money && s.money < ch.goal.money) {
    title = `Junte ${fmt(ch.goal.money)} (você tem ${fmt(s.money)}).`;
    detail = s.loot.length ? "Você tem butim parado: venda na Central do celular." : "Faça golpes rápidos no bairro: aparecem novos todo dia.";
    action = s.loot.length ? { label: "Vender o butim", run: () => openPhone("investigacao") } : { label: "Ver golpes rápidos", run: () => go("district") };
  } else if (candidates.length) {
    const m = candidates[0];
    const lock = missionLock(s, m);
    title = `Próximo alvo: ${character(m.npc).name.split(" ")[0]} (${district(m.district).name}).`;
    detail = lock.reason === "Tente de novo amanhã" ? "Não deu certo hoje. Durma e tente de novo amanhã, ou faça golpes rápidos." : `Ainda bloqueado: ${lock.reason ?? (districtUnlocked(s, m.district) ? "" : "bairro fechado")}.`;
  } else {
    title = "Objetivo do capítulo quase completo.";
    detail = ch.goalText;
  }
  return (
    <div className="card next-step">
      <div className="eyebrow">Próximo passo</div>
      <h2 style={{ fontSize: "1.15rem", marginTop: 4 }}>{title}</h2>
      <p className="small muted" style={{ marginTop: 4 }}>
        {detail}
      </p>
      {action && (
        <button className="btn primary" style={{ marginTop: 10 }} onClick={action.run}>
          {action.label} <ChevronRight size={16} />
        </button>
      )}
      {s.stats.conversations < 2 && (
        <details style={{ marginTop: 10 }}>
          <summary className="small gold" style={{ cursor: "pointer" }}>
            Como jogar (30 segundos)
          </summary>
          <ol className="small muted" style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            <li>Escolha um alvo e entre na conversa.</li>
            <li>Escreva como numa conversa normal. Pergunte, puxe assunto, descubra o ponto fraco da pessoa.</li>
            <li>Use o que descobriu para convencer. A barra «Convencimento» no topo da conversa mostra o quanto ela está no ponto.</li>
            <li>Quando a barra ficar verde, dê o bote: «Então, fechamos?».</li>
            <li>Cuidado com contradições: se ela perceber, o calor da polícia sobe.</li>
          </ol>
        </details>
      )}
    </div>
  );
}
