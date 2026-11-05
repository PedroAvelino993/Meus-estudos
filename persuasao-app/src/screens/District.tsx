// Visão de um bairro: moradores, missões, bicos e visitas. Inclui a ficha do personagem e o briefing.

import { BatteryMedium, CircleDollarSign, Clock, Coffee, Heart, Lock, MapPin, Sparkles, Target, Users } from "lucide-react";
import Portrait from "../components/Portrait";
import { CHARACTERS, MISSIONS, character, district } from "../content";
import { hash } from "../core/rng";
import { DAY_END, anyMission, canStart, clock, districtUnlocked, gigsHere, missionAvailable, missionLock, startMission } from "../core/game";
import type { MissionType } from "../core/types";
import { Bar, CloseBtn, Difficulty, Modal, fmt, useGame } from "../ui";

export const TYPE_LABEL: Record<MissionType, string> = {
  pitch: "Proposta",
  negotiation: "Negociação",
  mediation: "Mediação",
  investigation: "Investigação",
  favor: "Favor",
  contract: "Contrato",
  duel: "Duelo de argumentos",
};

export default function District() {
  const { s, brief, showCharacter, go } = useGame();
  const d = district(s.location);
  const people = CHARACTERS.filter((c) => c.district === d.id);
  const all = MISSIONS.filter((m) => m.district === d.id);
  const gigs = gigsHere(s);
  const ambient = d.ambient[hash(`${s.day}:${d.id}:${Math.floor(s.minute / 120)}`) % d.ambient.length];

  return (
    <div>
      <div className="district-hero" style={{ ["--dc" as string]: d.color, borderColor: d.color + "66" }}>
        <div className="eyebrow" style={{ color: d.color }}>
          {d.kind}
        </div>
        <h1 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", marginTop: 2 }}>{d.name}</h1>
        <p className="gold small" style={{ marginTop: 4 }}>
          {d.tagline}
        </p>
        <p className="small muted" style={{ marginTop: 8, maxWidth: 640 }}>
          {d.description}
        </p>
        <p className="small" style={{ marginTop: 10, fontStyle: "italic" }}>
          {clock(s.minute)} — {ambient}
        </p>
        <button className="btn sm" style={{ marginTop: 12 }} onClick={() => go("map")}>
          <MapPin size={15} /> Ir para outro bairro
        </button>
      </div>

      <div className="card-title">
        <Users size={18} /> Quem está por aqui
      </div>
      <div className="people-grid" style={{ marginBottom: 18 }}>
        {people.map((c) => {
          const rel = s.relationships[c.id];
          const hasMission = all.some((m) => m.npc === c.id && missionAvailable(s, m));
          const hasGig = gigs.some((g) => g.npc === c.id);
          const h = Math.floor(s.minute / 60);
          const available = h >= c.hours[0] && h < c.hours[1];
          return (
            <button key={c.id} className="person-card" onClick={() => showCharacter(c.id)}>
              {hasMission && (
                <span className="person-flag chip gold" title="Tem uma missão">
                  <Target size={11} />
                </span>
              )}
              {!hasMission && hasGig && (
                <span className="person-flag chip green" title="Tem um bico">
                  <CircleDollarSign size={11} />
                </span>
              )}
              <Portrait look={c.look} bg={d.color + "55"} mood={rel && rel.affinity > 30 ? "happy" : "neutral"} />
              <b className="small">{s.met.includes(c.id) ? c.name : c.name.split(" ")[0]}</b>
              <span className="role">{c.role}</span>
              <span className={`tiny ${available ? "green" : "muted"}`}>
                <Clock size={10} /> {available ? "com tempo agora" : `melhor das ${c.hours[0]}h às ${c.hours[1]}h`}
              </span>
              {rel && (
                <div style={{ width: "100%" }}>
                  <Bar value={Math.max(0, rel.affinity)} tone={rel.affinity < 0 ? "red" : "green"} label="Afinidade" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid two">
        <div className="card">
          <div className="card-title">
            <Target size={18} /> Missões
          </div>
          <div className="list">
            {all.map((m) => {
              const lock = missionLock(s, m);
              const done = lock.reason === "Concluída";
              return (
                <button key={m.id} className={`list-item mission-row ${lock.ok ? "" : "locked"}`} disabled={!lock.ok} onClick={() => brief(m.id)}>
                  <div className="m-icon">{lock.ok ? <Target size={18} /> : done ? <Sparkles size={18} /> : <Lock size={18} />}</div>
                  <div className="grow">
                    <b>{m.title}</b>
                    <div className="small muted">
                      {character(m.npc).name.split(" ")[0]} · {TYPE_LABEL[m.type]} · <Difficulty n={m.difficulty} />
                    </div>
                    {!lock.ok && <div className={`tiny ${done ? "green" : "gold"}`}>{done ? `Concluída (${s.missions[m.id]?.best === "great" ? "sucesso total" : s.missions[m.id]?.best === "good" ? "acordo" : "meio-termo"})` : lock.reason}</div>}
                  </div>
                  {m.story && <span className="chip gold">História</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-title">
            <CircleDollarSign size={18} /> Bicos do dia
          </div>
          <div className="list">
            {gigs.map((m) => (
              <button key={m.id} className="list-item mission-row gig" onClick={() => brief(m.id)}>
                <div className="m-icon">
                  <CircleDollarSign size={18} />
                </div>
                <div className="grow">
                  <b>{m.title}</b>
                  <div className="small muted">{character(m.npc).name} · {m.client}</div>
                </div>
                <span className="chip green">{fmt(m.rewards.money)}</span>
              </button>
            ))}
            {!gigs.length && <div className="empty">Os bicos daqui já foram feitos hoje. Amanhã aparecem outros.</div>}
          </div>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            Bicos são serviços rápidos que mudam todos os dias. Pagam pouco, mas ajudam a fechar o mês e treinar.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CharacterSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, brief, go } = useGame();
  const c = character(id);
  const d = district(c.district);
  const rel = s.relationships[id];
  const met = s.met.includes(id);
  const here = s.location === c.district;
  const missions = MISSIONS.filter((m) => m.npc === id);
  const gig = gigsHere(s).find((g) => g.npc === id);
  const visited = s.visitsToday.includes(id);
  return (
    <Modal onClose={onClose} label={c.name} wide>
      <div className="modal-head">
        <div className="row" style={{ gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 96, flexShrink: 0 }}>
            <Portrait look={c.look} bg={d.color + "66"} mood={rel && rel.affinity > 30 ? "happy" : "neutral"} title={c.name} />
          </div>
          <div>
            <div className="eyebrow" style={{ color: d.color }}>
              {d.name}
            </div>
            <h2>
              {c.name}
              {c.nick ? <span className="muted small"> «{c.nick}»</span> : null}
            </h2>
            <div className="small muted">
              {c.age} anos · {c.role}
            </div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              <Clock size={11} /> Costuma ter tempo das {c.hours[0]}h às {c.hours[1]}h
            </div>
          </div>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      {rel ? (
        <div className="row" style={{ marginBottom: 12 }}>
          <Heart size={15} className={rel.affinity >= 0 ? "green" : "red"} />
          <span className="small" style={{ minWidth: 70 }}>
            Afinidade
          </span>
          <div className="grow">
            <Bar value={Math.max(0, rel.affinity)} tone={rel.affinity < 0 ? "red" : "green"} label="Afinidade" />
          </div>
          <span className="tiny muted">{rel.affinity}</span>
        </div>
      ) : (
        <p className="small muted" style={{ marginBottom: 12 }}>
          Vocês ainda não se conhecem.
        </p>
      )}

      <div className="grid two" style={{ gap: 12 }}>
        <div>
          <b className="small">O que se sabe</b>
          <ul className="small muted" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {c.publicInfo.map((x) => (
              <li key={x}>{x}</li>
            ))}
            {met && <li>{c.family}</li>}
          </ul>
          {met && (
            <>
              <b className="small" style={{ display: "block", marginTop: 10 }}>
                Gosta de
              </b>
              <p className="small muted">{c.likes.join(", ")}.</p>
              <b className="small" style={{ display: "block", marginTop: 8 }}>
                Não gosta de
              </b>
              <p className="small muted">{c.dislikes.join(", ")}.</p>
            </>
          )}
        </div>
        <div>
          <b className="small">Necessidades descobertas</b>
          {rel?.known.length ? (
            <ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {rel.known.map((k) => {
                const n = c.needs.find((x) => x.id === k);
                return n ? (
                  <li key={k} className="green">
                    {n.label}
                  </li>
                ) : null;
              })}
            </ul>
          ) : (
            <p className="small muted" style={{ marginTop: 4 }}>
              Nenhuma ainda. Pergunte, ouça e preste atenção.
            </p>
          )}
          {rel && rel.affinity >= 50 && (
            <p className="small gold" style={{ marginTop: 10 }}>
              Em confiança: {c.secret}
            </p>
          )}
          {rel?.notes.length ? (
            <>
              <b className="small" style={{ display: "block", marginTop: 10 }}>
                Histórico
              </b>
              <ul className="tiny muted" style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {rel.notes.slice(0, 5).map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>

      <div className="list" style={{ marginTop: 16 }}>
        {missions.map((m) => {
          const lock = missionLock(s, m);
          return (
            <button key={m.id} className={`list-item mission-row ${lock.ok && here ? "" : "locked"}`} disabled={!lock.ok || !here} onClick={() => brief(m.id)}>
              <div className="m-icon">{lock.ok ? <Target size={18} /> : <Lock size={18} />}</div>
              <div className="grow">
                <b>{m.title}</b>
                <div className="tiny muted">{lock.ok ? (here ? m.objective : `Vá até ${d.name}`) : lock.reason}</div>
              </div>
            </button>
          );
        })}
        {gig && (
          <button className="list-item mission-row gig" onClick={() => brief(gig.id)}>
            <div className="m-icon">
              <CircleDollarSign size={18} />
            </div>
            <div className="grow">
              <b>{gig.title}</b>
              <div className="tiny muted">Bico do dia · {fmt(gig.rewards.money)}</div>
            </div>
          </button>
        )}
        <button className={`list-item mission-row ${here && !visited ? "" : "locked"}`} disabled={!here || visited || !districtUnlocked(s, c.district)} onClick={() => brief(`visit:${id}`)}>
          <div className="m-icon" style={{ background: "rgba(127,168,232,.14)", color: "var(--blue)" }}>
            <Coffee size={18} />
          </div>
          <div className="grow">
            <b>Um café com {c.nick ?? c.name.split(" ")[0]}</b>
            <div className="tiny muted">{visited ? "Vocês já conversaram hoje." : here ? "Sem pedido nenhum: conhecer melhor a pessoa." : `Vá até ${d.name}`}</div>
          </div>
        </button>
      </div>
      {!here && districtUnlocked(s, c.district) && (
        <button
          className="btn block"
          style={{ marginTop: 12 }}
          onClick={() => {
            onClose();
            go("map");
          }}
        >
          <MapPin size={16} /> Abrir o mapa
        </button>
      )}
    </Modal>
  );
}

const START_ERR = {
  energia: "Você está sem energia. Tome um café ou durma.",
  horario: "Não dá tempo antes das 22h. Deixe para amanhã.",
  conversa: "Você já está numa conversa.",
  indisponivel: "Indisponível.",
};

export function Briefing({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, act } = useGame();
  const m = anyMission(s, id);
  const c = character(m.npc);
  const d = district(c.district);
  const err = canStart(s, m);
  const h = Math.floor(s.minute / 60);
  const outOfHours = h < c.hours[0] || h >= c.hours[1];
  const rel = s.relationships[c.id];
  const isVisit = id.startsWith("visit:");
  return (
    <Modal onClose={onClose} label={m.title}>
      <div className="modal-head">
        <div>
          <div className="eyebrow">
            {isVisit ? "Visita" : id.startsWith("gig:") ? "Bico do dia" : TYPE_LABEL[m.type]} {m.story ? "· História" : ""}
          </div>
          <h2 style={{ marginTop: 2 }}>{m.title}</h2>
        </div>
        <CloseBtn onClick={onClose} />
      </div>
      <div className="row" style={{ gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ width: 72, flexShrink: 0 }}>
          <Portrait look={c.look} bg={d.color + "66"} />
        </div>
        <div className="grow">
          <b>{c.name}</b>
          <div className="small muted">{c.role}</div>
          <div className="row small" style={{ marginTop: 6 }}>
            Dificuldade <Difficulty n={m.difficulty} />
          </div>
        </div>
      </div>
      <p className="small">
        <b className="gold">Cliente:</b> {m.client}
      </p>
      <p className="small muted" style={{ marginTop: 6 }}>
        {m.brief}
      </p>
      <div className="card tight" style={{ marginTop: 12, background: "var(--panel-2)" }}>
        <div className="row small">
          <Target size={15} className="gold" /> <b>Objetivo:</b>
        </div>
        <p className="small" style={{ marginTop: 4 }}>
          {m.objective}
        </p>
      </div>
      <div className="rewards" style={{ justifyContent: "flex-start" }}>
        {m.rewards.money > 0 && (
          <div className="reward">
            <b className="gold">{fmt(m.rewards.money)}</b>
            <span>até</span>
          </div>
        )}
        <div className="reward">
          <b>{m.rewards.xp}</b>
          <span>XP</span>
        </div>
        {m.rewards.rep > 0 && (
          <div className="reward">
            <b>+{m.rewards.rep}</b>
            <span>Reputação</span>
          </div>
        )}
        <div className="reward">
          <b>~{m.minutes}</b>
          <span>minutos</span>
        </div>
      </div>
      {m.negotiation && (
        <p className="small muted">
          Negociação: {m.negotiation.npcSells ? "você compra" : "você vende"} {m.negotiation.item}. Seu cliente autoriza {m.negotiation.npcSells ? "pagar até" : "vender por no mínimo"} <b className="gold">{fmt(m.negotiation.clientLimit)}</b>. Quanto melhor o preço, maior a sua comissão.
        </p>
      )}
      {rel?.known.length ? <p className="small green" style={{ marginTop: 8 }}>Você já sabe {rel.known.length} coisa(s) importante(s) sobre {c.name.split(" ")[0]}: elas abrem novas falas.</p> : null}
      {s.dossie && <p className="small blue" style={{ marginTop: 6 }}>Seu dossiê vai revelar uma necessidade escondida antes da conversa.</p>}
      {s.flowers && <p className="small green" style={{ marginTop: 6 }}>Você leva flores: a conversa começa com mais afinidade.</p>}
      {outOfHours && <p className="small gold" style={{ marginTop: 6 }}>Fora do horário de {c.name.split(" ")[0]} ({c.hours[0]}h–{c.hours[1]}h): a paciência começa menor.</p>}
      {s.energy < 30 && (
        <p className="small red" style={{ marginTop: 6 }}>
          <BatteryMedium size={13} /> Pouca energia: você começa com menos credibilidade.
        </p>
      )}
      {err && <p className="small red" style={{ marginTop: 8 }}>{START_ERR[err]}</p>}
      {s.minute + m.minutes > DAY_END - 60 && !err && <p className="tiny muted" style={{ marginTop: 6 }}>Já é tarde: esta pode ser a última conversa do dia.</p>}
      <button
        className="btn primary block"
        style={{ marginTop: 16 }}
        disabled={!!err}
        onClick={() => {
          act((g) => startMission(g, id));
          onClose();
        }}
      >
        Começar a conversa
      </button>
    </Modal>
  );
}
