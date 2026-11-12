// Eventos: planejamento com estimativa ao vivo, Decreto Imperial (roteirizado), Ateliê e relatórios.

import { useMemo, useState } from "react";
import { Ban, Check, Dices, Drama, Flame, Info, Lock, Pencil, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import type { Decree, EventPlan } from "../core/types";
import { capacity, refPrice, slots } from "../core/economy";
import { authority, availableGladiators, estimate, modalityAvailable, modalityLock, planIssues, storyFit, suggestName } from "../core/events";
import { power } from "../core/gladiators";
import { atelierIssue, bestPrice, draftPlan, fitGladiators, freeSlots, removePlan, savePlan, setCustom } from "../core/plans";
import { betsOpen, createMarket, marketIssue } from "../core/bets";
import { ATELIER, EXTRAS, MODALITIES, modality, region } from "../content/world";
import { DECREE_STORIES } from "../content/story";
import { SPECIALTY_LABEL } from "../core/types";
import { useGame } from "../ui/game";
import { Card, Empty, Head, Seg, fmt, money } from "../ui/kit";
import { ReportView } from "./Overlays";

export default function Events() {
  const { s, act } = useGame();
  const [editing, setEditing] = useState<EventPlan | null>(null);
  const [tab, setTab] = useState<"plan" | "reports" | "atelie">("plan");
  const venues = ["roma", ...s.branches.filter((b) => !b.delegated).map((b) => b.region)];

  const startNew = (venue: string) => {
    const [, p] = draftPlan(s, venue);
    setEditing({ ...fitGladiators(s, p), id: `ev${s.counter}` });
  };

  return (
    <div className="stack">
      <Head
        title="Eventos"
        text="Escolha a modalidade, os gladiadores, o preço e a produção. A estimativa mostra o resultado esperado antes de confirmar; o relatório completo chega quando a semana avança."
        right={<Seg value={tab} onChange={setTab} options={[{ id: "plan", label: "Planejamento" }, { id: "reports", label: `Relatórios (${s.reports.length})` }, { id: "atelie", label: "Ateliê" }]} />}
      />
      {tab === "plan" && (
        <>
          {!editing && (
            <div className="grid g3">
              {venues.map((v) => {
                const free = freeSlots(s, v);
                return (
                  <div key={v} className="card">
                    <div className="row between">
                      <h3>{v === "roma" ? s.name : `Filial: ${region(v).name}`}</h3>
                      <span className="tag">{slots(s, v) - free}/{slots(s, v)} na semana</span>
                    </div>
                    <div className="small muted" style={{ margin: "6px 0 10px" }}>
                      {fmt(capacity(s, v))} lugares · preço justo base {refPrice(s, v, "demonstracao")}
                    </div>
                    <button className="btn gold block" disabled={free <= 0 || availableGladiators(s).length < 2} onClick={() => startNew(v)}>
                      <Plus size={16} /> Novo evento
                    </button>
                    {availableGladiators(s).length < 2 && <div className="tiny neg" style={{ marginTop: 6 }}>Faltam gladiadores disponíveis (descansando, lesionados ou já escalados).</div>}
                  </div>
                );
              })}
            </div>
          )}
          {editing ? (
            <Planner plan={editing} onClose={() => setEditing(null)} />
          ) : (
            <Card title="Programação da semana" icon={<Flame size={16} />}>
              {s.plans.length === 0 ? (
                <Empty>Nada planejado ainda. Crie um evento acima — ou contrate um Diretor de eventos em Construção para planejar sozinho.</Empty>
              ) : (
                <div className="list">
                  {s.plans.map((p) => (
                    <PlanRow key={p.id} plan={p} onEdit={() => setEditing(p)} onRemove={() => act((x) => removePlan(x, p.id), "Evento cancelado.")} />
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
      {tab === "reports" && (
        <div className="stack">
          {s.reports.length === 0 ? <Empty>Os relatórios aparecem depois do primeiro evento.</Empty> : s.reports.slice(0, 20).map((r) => <ReportView key={r.id} r={r} />)}
        </div>
      )}
      {tab === "atelie" && <Atelier />}
    </div>
  );
}

function PlanRow({ plan: p, onEdit, onRemove }: { plan: EventPlan; onEdit: () => void; onRemove: () => void }) {
  const { s, act } = useGame();
  const e = estimate(s, p);
  const markets = s.bets.markets.filter((m) => m.eventId === p.id && m.status === "aberto");
  const canMarket = betsOpen(s) && p.mode === "livre" && !marketIssue(s, { type: "vencedor", eventId: p.id });
  return (
    <div className="item">
      <div className="row between wrap">
        <div>
          <b>{p.name}</b> {p.mode === "roteirizado" ? <span className="tag purple">ROTEIRIZADO</span> : <span className="tag green">Livre</span>} {p.auto && <span className="tag blue">Diretor</span>}
          <div className="small muted">
            {modality(p.modality).name} · {region(p.venue).name} · {p.days} dia(s) · {p.gladiators.map((id) => s.gladiators.find((g) => g.id === id)?.name).join(", ")}
          </div>
        </div>
        <div className="row">
          <button className="btn sm" onClick={onEdit}>
            <Pencil size={14} /> Editar
          </button>
          <button className="btn sm ghost" onClick={onRemove} aria-label="Cancelar evento">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="row wrap small" style={{ gap: 14, marginTop: 6 }}>
        <span>Público ≈ {fmt(e.attendance)}</span>
        <span>Satisfação ≈ {e.satisfaction}%</span>
        <span className={e.profit >= 0 ? "pos" : "neg"}>Lucro ≈ {money(e.profit)}</span>
        <span>+{e.ep} PE</span>
        {markets.length > 0 && (
          <span className="tag blue">
            <Dices size={12} /> {markets.length} mercado(s) no Arena Bets
          </span>
        )}
        {canMarket && (
          <button className="btn sm" onClick={() => act((x) => createMarket(x, { type: "vencedor", eventId: p.id }), "Mercado do vencedor aberto (fichas fictícias).")}>
            <Dices size={14} /> Abrir mercado do vencedor
          </button>
        )}
      </div>
    </div>
  );
}

function Planner({ plan: initial, onClose }: { plan: EventPlan; onClose: () => void }) {
  const { s, act } = useGame();
  const [p, setP] = useState<EventPlan>(initial);
  const [showLocked, setShowLocked] = useState(false);
  const m = modality(p.modality);
  const cap = capacity(s, p.venue);
  const ref = refPrice(s, p.venue, p.modality);
  const pool = availableGladiators(s, p.id);
  const e = useMemo(() => estimate(s, p), [s, p]);
  const issues = planIssues(s, p);
  const auth = authority(s);
  const set = (patch: Partial<EventPlan>) => setP((x) => ({ ...x, ...patch }));

  const pickModality = (id: string) => {
    if (!modalityAvailable(s, id)) return;
    const mm = modality(id);
    const next = fitGladiators(s, { ...p, modality: id, name: p.name === suggestName(s, p.modality, p.venue) ? suggestName(s, id, p.venue) : p.name, price: s.priceHint[`${p.venue}:${id}`] ?? refPrice(s, p.venue, id), decoration: Math.round(mm.cost * 0.4), marketing: Math.round(mm.cost * 0.5), days: mm.festival ? Math.max(2, p.days) : 1 });
    setP(next.decree && !next.gladiators.includes(next.decree.winner) ? { ...next, decree: { ...next.decree, winner: next.gladiators[0] } } : next);
  };
  const toggleGlad = (id: string) => {
    const has = p.gladiators.includes(id);
    if (!has && p.gladiators.length >= m.maxGladiators) return;
    const gl = has ? p.gladiators.filter((x) => x !== id) : [...p.gladiators, id];
    set({ gladiators: gl, decree: p.decree && !gl.includes(p.decree.winner) ? { ...p.decree, winner: gl[0] ?? "" } : p.decree });
  };
  const setMode = (mode: EventPlan["mode"]) => {
    if (mode === "roteirizado") set({ mode, decree: p.decree ?? { winner: p.gladiators[0] ?? "", twist: "nenhuma", story: "gloria", fame: {} } });
    else set({ mode, decree: undefined });
  };
  const setDecree = (patch: Partial<Decree>) => set({ decree: { ...p.decree!, ...patch } });

  const save = () => {
    const decree = p.decree ? { ...p.decree, fame: { [p.decree.winner]: 4, ...(p.decree.surprise ? { [p.decree.surprise]: 3 } : {}) } } : undefined;
    if (act((x) => savePlan(x, { ...p, decree }), "Evento confirmado.", issues[0])) onClose();
  };

  return (
    <div className="grid planner">
      <div className="stack" style={{ minWidth: 0 }}>
        <Card title="1. Modalidade" icon={<Sparkles size={16} />}>
          <div className="grid g3" style={{ gap: 8 }}>
            {MODALITIES.filter((mm) => showLocked || !modalityLock(s, mm.id) || mm.id === p.modality).map((mm) => {
              const lock = modalityLock(s, mm.id);
              return (
                <button key={mm.id} className={`item selectable ${p.modality === mm.id ? "on" : ""} ${lock ? "locked" : ""}`} style={{ textAlign: "left" }} onClick={() => pickModality(mm.id)} title={lock ?? mm.description}>
                  <div className="row between">
                    <b className="small">{mm.id === "exclusivo" && s.custom ? s.custom.name : mm.name}</b>
                    {lock ? <Lock size={13} /> : mm.original ? <span className="tag purple">Inédito</span> : null}
                  </div>
                  <div className="tiny muted">
                    Atração {mm.appeal.toFixed(1)} · custo {fmt(mm.cost)} · {mm.minGladiators === mm.maxGladiators ? mm.minGladiators : `${mm.minGladiators}–${mm.maxGladiators}`} gladiadores
                  </div>
                  <div className="tiny faint">{lock ?? (s.modalitiesDone.includes(mm.id) || !mm.firstTimeEp ? `Prestígio ${mm.prestige}` : `Estreia: +${mm.firstTimeEp} PE`)}</div>
                </button>
              );
            })}
          </div>
          {MODALITIES.some((mm) => modalityLock(s, mm.id)) && (
            <button className="btn sm ghost" style={{ marginTop: 8 }} onClick={() => setShowLocked(!showLocked)}>
              <Lock size={13} /> {showLocked ? "Esconder bloqueadas" : `Ver as ${MODALITIES.filter((mm) => modalityLock(s, mm.id)).length} modalidades bloqueadas e o que falta`}
            </button>
          )}
          <p className="small muted" style={{ marginTop: 8 }}>
            {m.description} Brilham: {m.specialties.map((x) => SPECIALTY_LABEL[x]).join(", ")}.
          </p>
        </Card>

        <Card title={`2. Gladiadores (${p.gladiators.length}/${m.minGladiators === m.maxGladiators ? m.maxGladiators : `${m.minGladiators}–${m.maxGladiators}`})`} icon={<Check size={16} />}>
          <div className="grid g2" style={{ gap: 6 }}>
            {s.gladiators.map((g) => {
              const avail = pool.some((x) => x.id === g.id);
              const on = p.gladiators.includes(g.id);
              return (
                <button key={g.id} className={`item selectable ${on ? "on" : ""} ${!avail && !on ? "locked" : ""}`} disabled={!avail && !on} style={{ textAlign: "left", padding: 9 }} onClick={() => toggleGlad(g.id)}>
                  <div className="row between">
                    <b className="small">{g.name}</b>
                    <span className="tag grey">força {power(g, m)}</span>
                  </div>
                  <div className="tiny muted">
                    Fama {Math.round(g.fame)} · condição {Math.round(g.condition)}% · {SPECIALTY_LABEL[g.specialty]}
                    {g.injuredWeeks ? ` · lesionado (${g.injuredWeeks} sem.)` : ""}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="3. Público, preço e produção" icon={<Wand2 size={16} />}>
          <div className="grid g2">
            <label className="field">
              Nome do evento
              <input className="input" value={p.name} maxLength={60} onChange={(ev) => set({ name: ev.target.value })} />
            </label>
            <label className="field">
              Duração: {p.days} dia(s)
              <input type="range" min={1} max={m.festival ? 5 : 3} value={p.days} onChange={(ev) => set({ days: Number(ev.target.value) })} />
            </label>
            <label className="field">
              Lugares à venda: {fmt(p.capacity)} de {fmt(cap)}
              <input type="range" min={Math.min(50, cap)} max={cap} step={Math.max(10, Math.round(cap / 100))} value={p.capacity} onChange={(ev) => set({ capacity: Number(ev.target.value) })} />
            </label>
            <label className="field">
              Preço do ingresso (justo ≈ {ref})
              <div className="row">
                <button className="btn sm" onClick={() => set({ price: Math.max(0.5, p.price - 0.5) })}>
                  −
                </button>
                <input className="input num" type="number" min={0.5} step={0.5} value={p.price} onChange={(ev) => set({ price: Math.max(0.5, Number(ev.target.value) || 0.5) })} style={{ textAlign: "center" }} />
                <button className="btn sm" onClick={() => set({ price: p.price + 0.5 })}>
                  +
                </button>
                <button className="btn sm" onClick={() => set({ price: bestPrice(s, p) })} title="Calcula o preço com melhor equilíbrio entre lucro e satisfação">
                  Ideal
                </button>
              </div>
            </label>
            <label className="field">
              Decoração: {money(p.decoration)}
              <input type="range" min={0} max={Math.max(500, m.cost * 3)} step={50} value={p.decoration} onChange={(ev) => set({ decoration: Number(ev.target.value) })} />
            </label>
            <label className="field">
              Divulgação: {money(p.marketing)}
              <input type="range" min={0} max={Math.max(800, m.cost * 4)} step={50} value={p.marketing} onChange={(ev) => set({ marketing: Number(ev.target.value) })} />
            </label>
          </div>
          <div className="small muted" style={{ margin: "12px 0 6px" }}>
            Atrações extras
          </div>
          <div className="row wrap" style={{ gap: 6 }}>
            {EXTRAS.map((x) => {
              const on = p.extras.includes(x.id);
              return (
                <button key={x.id} className={`btn sm ${on ? "gold" : ""}`} onClick={() => set({ extras: on ? p.extras.filter((y) => y !== x.id) : [...p.extras, x.id] })}>
                  {x.name} · {fmt(x.cost)}
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="4. Tipo de espetáculo" icon={<Drama size={16} />}>
          <Seg
            value={p.mode}
            onChange={setMode}
            options={[
              { id: "livre", label: "Competição livre" },
              { id: "roteirizado", label: "Decreto Imperial (roteirizado)" },
            ]}
          />
          {p.mode === "livre" ? (
            <p className="small muted" style={{ marginTop: 10 }}>
              O resultado é calculado pelo motor do jogo a partir dos atributos, da condição e da sorte. Só competições livres podem ter mercados no Arena Bets.
            </p>
          ) : auth < 2 ? (
            <div className="banner red small" style={{ marginTop: 10 }}>
              <Ban size={16} />
              <span>O Decreto Imperial exige o nível de autoridade Magnata dos Espetáculos.</span>
            </div>
          ) : (
            <div className="stack" style={{ marginTop: 10 }}>
              <div className="banner purple small">
                <Info size={16} />
                <span>Espetáculo ROTEIRIZADO: você decide a história e o vencedor, e o evento é anunciado ao público como encenação. Ele não pode ter mercado de previsão, e roteiros demais reduzem a autenticidade do Coliseu.</span>
              </div>
              <div className="grid g2">
                <label className="field">
                  História
                  <select className="input" value={p.decree!.story} onChange={(ev) => setDecree({ story: ev.target.value })}>
                    {DECREE_STORIES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Vencedor escolhido
                  <select className="input" value={p.decree!.winner} onChange={(ev) => setDecree({ winner: ev.target.value })}>
                    {p.gladiators.map((id) => (
                      <option key={id} value={id}>
                        {s.gladiators.find((g) => g.id === id)?.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Atuação surpreendente
                  <select className="input" value={p.decree!.surprise ?? ""} onChange={(ev) => setDecree({ surprise: ev.target.value || undefined })}>
                    <option value="">Nenhuma</option>
                    {p.gladiators
                      .filter((id) => id !== p.decree!.winner)
                      .map((id) => (
                        <option key={id} value={id}>
                          {s.gladiators.find((g) => g.id === id)?.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="field">
                  Reviravolta {auth < 3 && "(nível Senhor das Arenas)"}
                  <select className="input" value={p.decree!.twist} disabled={auth < 3} onChange={(ev) => setDecree({ twist: ev.target.value as Decree["twist"] })}>
                    <option value="nenhuma">Sem reviravolta</option>
                    <option value="inicio">Logo no começo</option>
                    <option value="meio">No meio do espetáculo</option>
                    <option value="final">No último instante</option>
                  </select>
                </label>
              </div>
              <div className="small muted">
                {DECREE_STORIES.find((x) => x.id === p.decree!.story)?.description} Encaixe da história com o elenco: <b className={storyFit(s, p, p.decree!) >= 0 ? "pos" : "neg"}>{storyFit(s, p, p.decree!) >= 0 ? "+" : ""}{Math.round(storyFit(s, p, p.decree!))} de satisfação</b>.
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="stack planner-side">
        <section className="card gilded">
          <h3 style={{ marginBottom: 10 }}>Estimativa</h3>
          <div className="grid g2" style={{ gap: 8 }}>
            <div className="stat">
              <div className="label">Público</div>
              <div className="value">{fmt(e.attendance)}</div>
              <div className="sub">de {fmt(p.capacity * p.days)}</div>
            </div>
            <div className="stat">
              <div className="label">Satisfação</div>
              <div className="value">{e.satisfaction}%</div>
            </div>
            <div className="stat">
              <div className="label">Receita</div>
              <div className="value">{money(e.revenue)}</div>
            </div>
            <div className="stat">
              <div className="label">Custos</div>
              <div className="value neg">−{money(e.cost)}</div>
            </div>
            <div className="stat">
              <div className="label">Lucro</div>
              <div className={`value ${e.profit >= 0 ? "pos" : "neg"}`}>{money(e.profit)}</div>
            </div>
            <div className="stat">
              <div className="label">Popularidade · PE</div>
              <div className="value">
                {e.popularity >= 0 ? "+" : ""}
                {e.popularity} · +{e.ep}
              </div>
            </div>
          </div>
          {e.notes.length > 0 && (
            <div className="col small" style={{ marginTop: 10 }}>
              {e.notes.map((n, i) => (
                <div key={i} className="muted">
                  • {n}
                </div>
              ))}
            </div>
          )}
          {issues.length > 0 && (
            <div className="col small" style={{ marginTop: 10 }}>
              {issues.map((n, i) => (
                <div key={i} className="neg">
                  ✗ {n}
                </div>
              ))}
            </div>
          )}
          <div className="tiny faint" style={{ marginTop: 8 }}>
            Estimativa sem o fator sorte (±12% de público). O dinheiro de produção sai na hora do evento.
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn gold" style={{ flex: 1 }} disabled={issues.length > 0} onClick={save}>
              Confirmar evento
            </button>
            <button className="btn" onClick={onClose}>
              Voltar
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Atelier() {
  const { s, act } = useGame();
  const issue = atelierIssue(s);
  const [name, setName] = useState(s.custom?.name ?? "Sonho de Roma");
  const [tema, setTema] = useState<string>(s.custom?.tema ?? ATELIER.temas[0].id);
  const [cenario, setCenario] = useState<string>(s.custom?.cenario ?? ATELIER.cenarios[0].id);
  const [efeito, setEfeito] = useState<string>(s.custom?.efeito ?? ATELIER.efeitos[0].id);
  const appeal = 2.4 + (ATELIER.temas.find((x) => x.id === tema)?.appeal ?? 0) + (ATELIER.cenarios.find((x) => x.id === cenario)?.appeal ?? 0) + (ATELIER.efeitos.find((x) => x.id === efeito)?.appeal ?? 0);
  const cost = 5000 + (ATELIER.cenarios.find((x) => x.id === cenario)?.cost ?? 0) + (ATELIER.efeitos.find((x) => x.id === efeito)?.cost ?? 0);
  return (
    <Card title="Ateliê de espetáculos exclusivos" icon={<Sparkles size={16} />}>
      {issue ? (
        <div className="banner small">
          <Lock size={16} />
          <span>{issue}. Lá você combina tema, cenário e efeito para criar um espetáculo que só o seu Coliseu tem.</span>
        </div>
      ) : (
        <div className="stack">
          <label className="field">
            Nome do espetáculo
            <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          </label>
          {(
            [
              ["Tema", ATELIER.temas, tema, setTema],
              ["Cenário", ATELIER.cenarios, cenario, setCenario],
              ["Efeito", ATELIER.efeitos, efeito, setEfeito],
            ] as const
          ).map(([label, list, value, setter]) => (
            <div key={label}>
              <div className="small muted" style={{ marginBottom: 6 }}>
                {label}
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                {list.map((x) => (
                  <button key={x.id} className={`btn sm ${value === x.id ? "gold" : ""}`} onClick={() => setter(x.id)}>
                    {x.name} (+{Math.round(x.appeal * 100)}%{"cost" in x ? ` · ${fmt(x.cost)}` : ""})
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="small">
            Atração prevista <b className="gold">{appeal.toFixed(2)}</b> · custo de produção ≈ <b>{fmt(cost)}</b> por dia (mais em arenas grandes).
          </div>
          <button className="btn gold" onClick={() => act((x) => setCustom(x, name, tema, cenario, efeito), "Espetáculo exclusivo criado! Ele aparece como modalidade nos eventos.")}>
            {s.custom ? "Atualizar espetáculo" : "Criar espetáculo"}
          </button>
        </div>
      )}
    </Card>
  );
}
