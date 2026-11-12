// ARENA BETS — mercado de previsões com fichas fictícias e gratuitas.

import { useState } from "react";
import { BarChart3, Coins, Dices, Info, LineChart as LineIcon, ShieldCheck, Sparkles, Trophy, Users } from "lucide-react";
import type { Market, MarketType } from "../core/types";
import { MARKET_INFO, createMarket, gladiatorQuotes, marketIssue, modelAccuracy, participantsFor, publishOdds, resetOdds, typeUnlocked, type MarketSpec } from "../core/bets";
import { has } from "../core/economy";
import { BETS_TREE } from "../content/tree";
import { useGame } from "../ui/game";
import { TreeGraph } from "../ui/TreeGraph";
import { Bar, Card, Empty, HBars, Head, LineChart, Seg, Stat, fmt, money, pct } from "../ui/kit";

type Tab = "central" | "mercados" | "painel" | "ranking" | "cotacoes" | "arvore";

export default function Bets() {
  const { s } = useGame();
  const [tab, setTab] = useState<Tab>("central");
  return (
    <div className="stack">
      <Head
        title="Arena Bets"
        text="O mercado de previsões do Coliseu. O público prevê resultados das competições livres usando fichas gratuitas; você cria os mercados, publica estimativas e cuida da credibilidade."
        right={<span className="tag">{s.bets.points} pontos do mercado</span>}
      />
      <div className="banner small">
        <ShieldCheck size={16} />
        <span>
          <b>Fichas 100% fictícias e gratuitas.</b> Não podem ser compradas, vendidas nem convertidas em dinheiro. Só competições livres (resultado calculado pelo motor) recebem mercados; espetáculos roteirizados do Decreto Imperial nunca entram aqui.
        </span>
      </div>
      <Seg
        value={tab}
        onChange={setTab}
        options={[
          { id: "central", label: "Central" },
          { id: "mercados", label: `Mercados (${s.bets.markets.filter((m) => m.status === "aberto").length})` },
          { id: "painel", label: "Painel do Mercado" },
          { id: "ranking", label: "Previsores" },
          { id: "cotacoes", label: "Cotações" },
          { id: "arvore", label: "Árvore" },
        ]}
      />
      {tab === "central" && <Central />}
      {tab === "mercados" && <Markets />}
      {tab === "painel" && <Panel />}
      {tab === "ranking" && <Ranking />}
      {tab === "cotacoes" && <Quotes />}
      {tab === "arvore" && <TreeGraph nodes={BETS_TREE} currency="pontos do mercado" />}
    </div>
  );
}

function Central() {
  const { s } = useGame();
  const b = s.bets;
  const proj = participantsFor(s);
  const spy = has(s, "espionagem");
  const open = b.markets.filter((m) => m.status === "aberto");
  return (
    <div className="stack">
      <div className="grid g4">
        <Stat icon={<Users size={14} />} label="Participantes" value={fmt(b.participants)} sub={`Próxima semana ≈ ${fmt(proj.mine)}`} />
        <Stat icon={<ShieldCheck size={14} />} label="Credibilidade" value={Math.round(b.credibility)} sub="Acertos do modelo, transparência e regras" />
        <Stat icon={<Sparkles size={14} />} label="Popularidade do mercado" value={Math.round(b.popularity)} />
        <Stat icon={<Coins size={14} />} label="Fichas distribuídas" value={fmt(b.chipsDistributed)} sub="Gratuitas, sem valor real" />
        <Stat icon={<Dices size={14} />} label="Mercados abertos" value={open.length} sub={`${b.markets.length} no histórico`} />
        <Stat icon={<BarChart3 size={14} />} label="Precisão do modelo" value={pct(modelAccuracy(s))} sub="Sobe com a árvore de Estatísticas" />
        <Stat icon={<Info size={14} />} label="Transparência" value={Math.round(b.transparency)} sub={`Clareza das regras ${Math.round(b.ruleClarity)}`} />
        <Stat icon={<Trophy size={14} />} label="Previsões feitas" value={fmt(b.totalPredictions)} />
      </div>
      <div className="grid g2">
        <Card title="Dominus Arena Bets" icon={<Dices size={16} />}>
          {!s.rival.active ? (
            <div className="small muted">Sem concorrência no momento.</div>
          ) : (
            <div className="col small">
              <div className="row between">
                <span>Participantes deles</span>
                <b>{fmt(s.rival.betsParticipants)}</b>
              </div>
              <div className="row between">
                <span>Sua fatia do público de previsões</span>
                <b>{pct(b.participants / Math.max(1, b.participants + s.rival.betsParticipants))}</b>
              </div>
              <Bar value={b.participants} max={b.participants + s.rival.betsParticipants} />
              {spy ? (
                <div className="muted">
                  Espiões: a Dominus aposta em «{s.rival.strategy === "marketing" ? "muita propaganda" : "mercados rápidos e pouco transparentes"}». Credibilidade estimada: {Math.round(48 + s.rival.tech * 2)}. Regras claras e transparência tiram público deles.
                </div>
              ) : (
                <div className="faint">Desbloqueie «Espiões na Dominus» para ver a estratégia deles.</div>
              )}
            </div>
          )}
        </Card>
        <Card title="Como o mercado cresce" icon={<Info size={16} />}>
          <div className="small col">
            <div>• Mais participantes = mais público nos eventos com mercado (até +15%), mais fama para os gladiadores e pontos de evolução.</div>
            <div>• Credibilidade sobe quando as probabilidades publicadas acertam (pontuação de Brier) e com transparência; cai com erros grandes.</div>
            <div>• Publicar probabilidades diferentes do modelo é permitido, mas se forem piores que o modelo a credibilidade sofre.</div>
            <div>• Os resultados nunca são combinados: o motor calcula as competições livres de forma independente.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Markets() {
  const { s, act } = useGame();
  const types = (Object.keys(MARKET_INFO) as MarketType[]).filter((t) => typeUnlocked(s, t));
  const [type, setType] = useState<MarketType>(types[0] ?? "vencedor");
  const free = s.plans.filter((p) => p.mode === "livre");
  const scripted = s.plans.filter((p) => p.mode === "roteirizado");
  const [eventId, setEventId] = useState(free[0]?.id ?? "");
  const plan = free.find((p) => p.id === eventId);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [threshold, setThreshold] = useState(1);
  const [special, setSpecial] = useState(false);
  const rivalries = s.relations.filter((r) => r.kind === "rivalidade" && s.gladiators.some((g) => g.id === r.a) && s.gladiators.some((g) => g.id === r.b));
  const name = (id: string) => s.gladiators.find((g) => g.id === id)?.name ?? id;
  const spec: MarketSpec = { type, eventId, special, ...(type === "confronto" ? { a, b } : {}), ...(type === "desempenho" ? { gladiator: a, threshold } : {}), ...(type === "rivalidade" ? { a: a.split("|")[0], b: a.split("|")[1] } : {}) };
  const issue = marketIssue(s, spec);
  const needsEvent = !MARKET_INFO[type].period && type !== "frequencia";
  const open = s.bets.markets.filter((m) => m.status === "aberto");
  const closed = s.bets.markets.filter((m) => m.status !== "aberto").slice(0, 12);

  return (
    <div className="stack">
      <Card title="Criar mercado" icon={<Dices size={16} />}>
        <div className="grid g2">
          <label className="field">
            Tipo
            <select className="input" value={type} onChange={(e) => setType(e.target.value as MarketType)}>
              {(Object.keys(MARKET_INFO) as MarketType[]).map((t) => (
                <option key={t} value={t} disabled={!typeUnlocked(s, t)}>
                  {MARKET_INFO[t].label}
                  {typeUnlocked(s, t) ? "" : " (bloqueado na árvore)"}
                </option>
              ))}
            </select>
          </label>
          {needsEvent && (
            <label className="field">
              Evento livre desta semana
              <select className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">—</option>
                {free.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {(type === "confronto" || type === "desempenho") && plan && (
            <label className="field">
              {type === "confronto" ? "Gladiador A" : "Gladiador"}
              <select className="input" value={a} onChange={(e) => setA(e.target.value)}>
                <option value="">—</option>
                {plan.gladiators.map((id) => (
                  <option key={id} value={id}>
                    {name(id)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {type === "confronto" && plan && (
            <label className="field">
              Gladiador B
              <select className="input" value={b} onChange={(e) => setB(e.target.value)}>
                <option value="">—</option>
                {plan.gladiators
                  .filter((id) => id !== a)
                  .map((id) => (
                    <option key={id} value={id}>
                      {name(id)}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {type === "desempenho" && (
            <label className="field">
              Vitórias mínimas: {threshold}
              <input type="range" min={1} max={3} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
            </label>
          )}
          {type === "rivalidade" && (
            <label className="field">
              Rivalidade
              <select className="input" value={a} onChange={(e) => setA(e.target.value)}>
                <option value="">—</option>
                {rivalries.map((r) => (
                  <option key={r.a + r.b} value={`${r.a}|${r.b}`}>
                    {name(r.a)} × {name(r.b)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          {MARKET_INFO[type].description}
        </p>
        {has(s, "mk-especial") && (
          <label className="row small" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={special} onChange={(e) => setSpecial(e.target.checked)} /> Mercado especial (participação em dobro, 400 denários de produção)
          </label>
        )}
        {scripted.length > 0 && (
          <div className="banner purple small" style={{ marginTop: 10 }}>
            <Info size={16} />
            <span>{scripted.map((p) => p.name).join(", ")}: roteirizado(s) — não pode(m) receber mercado.</span>
          </div>
        )}
        <button className="btn gold" style={{ marginTop: 12 }} disabled={!!issue} onClick={() => act((x) => createMarket(x, spec), "Mercado aberto!")}>
          {issue ?? "Abrir mercado"}
        </button>
      </Card>
      {open.length === 0 ? <Empty>Nenhum mercado aberto. Planeje uma competição livre em Eventos e abra um mercado para ela.</Empty> : open.map((m) => <MarketCard key={m.id} m={m} />)}
      {closed.length > 0 && (
        <Card title="Resolvidos e cancelados" icon={<Trophy size={16} />}>
          <div className="list">
            {closed.map((m) => (
              <div key={m.id} className="item small">
                <div className="row between wrap">
                  <b>{m.name}</b>
                  <span className={`tag ${m.status === "cancelado" ? "grey" : "green"}`}>{m.status === "cancelado" ? "Cancelado" : `Brier ${m.brier}`}</span>
                </div>
                <div className="muted">
                  {m.result} · {fmt(m.participants)} participantes{m.custom ? " · probabilidades próprias" : ""}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MarketCard({ m }: { m: Market }) {
  const { act } = useGame();
  const [edit, setEdit] = useState(false);
  const [vals, setVals] = useState(m.options.map((o) => Math.round(o.published * 100)));
  const pool = m.options.reduce((a, o) => a + o.chips, 0);
  return (
    <div className="card">
      <div className="row between wrap">
        <div>
          <h3>{m.name}</h3>
          <div className="small muted">
            {MARKET_INFO[m.type].label} · {fmt(m.participants)} participantes · {fmt(pool)} fichas · fecha na semana {m.closeWeek}
          </div>
        </div>
        <div className="row">
          {m.special && <span className="tag purple">Especial</span>}
          {m.custom && <span className="tag blue">Probabilidades próprias</span>}
        </div>
      </div>
      <div className="scroll-x" style={{ marginTop: 10 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Opção</th>
              <th>Modelo</th>
              <th>Publicado</th>
              <th>Fichas</th>
              <th>Previsões</th>
            </tr>
          </thead>
          <tbody>
            {m.options.map((o, i) => (
              <tr key={o.id}>
                <td>{o.label}</td>
                <td>{pct(o.model)}</td>
                <td>
                  {edit ? (
                    <input className="input num" style={{ width: 70, padding: "4px 6px" }} type="number" min={1} max={99} value={vals[i]} onChange={(e) => setVals(vals.map((v, j) => (j === i ? Number(e.target.value) : v)))} />
                  ) : (
                    pct(o.published)
                  )}
                </td>
                <td style={{ minWidth: 120 }}>
                  <Bar value={o.chips} max={Math.max(1, pool)} />
                </td>
                <td>{fmt(o.picks)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tiny faint" style={{ marginTop: 6 }}>
        {m.rules}
      </p>
      <div className="row wrap" style={{ marginTop: 8, gap: 6 }}>
        {edit ? (
          <>
            <button
              className="btn gold sm"
              onClick={() => {
                act((x) => publishOdds(x, m.id, vals.map((v) => v / 100)), "Probabilidades publicadas.");
                setEdit(false);
              }}
            >
              Publicar
            </button>
            <button className="btn sm" onClick={() => setEdit(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button className="btn sm" onClick={() => setEdit(true)}>
              Publicar probabilidades próprias
            </button>
            {m.custom && (
              <button className="btn sm" onClick={() => act((x) => resetOdds(x, m.id), "Voltou a publicar o modelo.")}>
                Usar o modelo
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Panel() {
  const { s } = useGame();
  const h = s.bets.history;
  const chipsByType = (Object.keys(MARKET_INFO) as MarketType[])
    .map((t) => ({ label: MARKET_INFO[t].label, value: s.bets.markets.filter((m) => m.type === t).reduce((a, m) => a + m.options.reduce((x, o) => x + o.chips, 0), 0) }))
    .filter((x) => x.value > 0);
  return (
    <div className="grid g2">
      <Card title="Participantes: Arena Bets × Dominus" icon={<LineIcon size={16} />}>
        {h.length > 1 ? (
          <LineChart
            series={[
              { name: "Arena Bets", color: "#d2ab5f", values: h.map((x) => x.participants) },
              { name: "Dominus Arena Bets", color: "#c8392c", values: h.map((x) => x.rival) },
            ]}
            labels={h.map((x) => `sem ${x.week}`)}
          />
        ) : (
          <Empty>Os gráficos começam depois de algumas semanas de mercado.</Empty>
        )}
      </Card>
      <Card title="Credibilidade" icon={<ShieldCheck size={16} />}>
        {h.length > 1 ? <LineChart series={[{ name: "Credibilidade", color: "#6fae6a", values: h.map((x) => x.credibility) }]} labels={h.map((x) => `sem ${x.week}`)} /> : <Empty>Sem dados ainda.</Empty>}
      </Card>
      <Card title="Acerto das probabilidades publicadas" icon={<BarChart3 size={16} />}>
        {s.bets.accuracyHistory.length > 1 ? <LineChart series={[{ name: "Acerto (100 = perfeito)", color: "#6f9fc8", values: s.bets.accuracyHistory }]} /> : <Empty>Resolva alguns mercados para ver a precisão.</Empty>}
      </Card>
      <Card title="Fichas por tipo de mercado" icon={<Coins size={16} />}>
        {chipsByType.length ? <HBars items={chipsByType} /> : <Empty>Nenhuma ficha em jogo ainda.</Empty>}
      </Card>
    </div>
  );
}

function Ranking() {
  const { s } = useGame();
  const list = [...s.bets.predictors].sort((a, b) => b.chips - a.chips);
  return (
    <Card title="Ranking dos previsores" icon={<Trophy size={16} />}>
      <div className="scroll-x">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Previsor</th>
              <th>Cidade</th>
              <th>Fichas</th>
              <th>Acertos</th>
              <th>Sequência</th>
              <th>Título</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>{p.name}</td>
                <td className="muted">{p.city}</td>
                <td>{fmt(p.chips)}</td>
                <td>
                  {p.correct}/{p.total}
                </td>
                <td>
                  {p.streak} <span className="faint">(máx. {p.bestStreak})</span>
                </td>
                <td>{p.title ? <span className="tag">{p.title}</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Quotes() {
  const { s } = useGame();
  const q = gladiatorQuotes(s);
  return (
    <Card title="Cotação dos gladiadores" icon={<BarChart3 size={16} />}>
      <p className="small muted" style={{ marginBottom: 8 }}>
        Valor de mercado de cada contrato (em denários do jogo), com a variação desde a semana passada. Sobe com fama, nível e vitórias.
      </p>
      <div className="scroll-x">
        <table className="table">
          <thead>
            <tr>
              <th>Gladiador</th>
              <th>Fama</th>
              <th>Vitórias</th>
              <th>Valor</th>
              <th>Variação</th>
            </tr>
          </thead>
          <tbody>
            {q.map(({ g, value, prev }) => (
              <tr key={g.id}>
                <td>{g.name}</td>
                <td>{Math.round(g.fame)}</td>
                <td>{g.wins}</td>
                <td>{money(value)}</td>
                <td className={value >= prev ? "pos" : "neg"}>
                  {value >= prev ? "+" : ""}
                  {fmt(value - prev)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
