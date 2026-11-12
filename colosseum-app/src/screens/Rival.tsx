// Rivais: Dominus Arena e a Liga das Arenas Livres; disputas de contrato e campanhas.

import { Gavel, Megaphone, Shield, Swords } from "lucide-react";
import type { RivalState } from "../core/types";
import { bidChance, campaignCost, campaignIssue, raiseBid, rivalCampaign, strategyLabel, type Opponent } from "../core/rival";
import { useGame } from "../ui/game";
import { Bar, Card, Empty, Head, LineChart, Stat, fmt, money, one, pct } from "../ui/kit";

export default function Rival() {
  const { s } = useGame();
  return (
    <div className="stack">
      <Head title="Rivais" text="A concorrência disputa público, gladiadores, contratos, o reconhecimento imperial e os jogos internacionais. Ela reage quando perde força — e pode tomar Roma se você relaxar." />
      <Opp who="rival" rv={s.rival} />
      {s.league && <Opp who="league" rv={s.league} />}
      <Bids />
      {s.ledger.length > 1 && (
        <Card title="Fama: você × rival" icon={<Swords size={16} />}>
          <LineChart
            series={[
              { name: s.name, color: "#d2ab5f", values: s.ledger.slice(-40).map((l) => l.fame) },
              { name: s.rival.name, color: "#c8392c", values: s.ledger.slice(-40).map((l) => l.rivalFame) },
            ]}
            labels={s.ledger.slice(-40).map((l) => `sem ${l.week}`)}
          />
        </Card>
      )}
    </div>
  );
}

function Opp({ who, rv }: { who: Opponent; rv: RivalState }) {
  const { s, act } = useGame();
  if (!rv.active && !rv.defeated) return <Empty>A concorrência ainda não surgiu. Ela aparece quando o Coliseu chega à Era 2.</Empty>;
  const issue = campaignIssue(s, who);
  const sup = who === "rival" ? s.stats.superiorWeeks : s.stats.leagueSuperior;
  return (
    <section className={`card ${rv.defeated ? "" : "gilded"}`}>
      <div className="row between wrap">
        <h2 className="row">
          <Shield size={18} /> {rv.name}
        </h2>
        {rv.defeated ? <span className="tag green">Superada</span> : <span className="tag red">{strategyLabel(rv.strategy)}</span>}
      </div>
      {rv.defeated ? (
        <p className="small muted" style={{ marginTop: 8 }}>
          Esta concorrente fechou as portas. Seus melhores gladiadores foram para o mercado.
        </p>
      ) : (
        <>
          <div className="grid g4" style={{ marginTop: 12 }}>
            <Stat label="Fama" value={fmt(rv.fame)} sub={`Você: ${fmt(s.fame)}`} />
            <Stat label="Público em Roma" value={one(rv.regions.roma ?? 0)} sub={`Você: ${one(s.popularity)}`} />
            <Stat label="Estádio" value={fmt(rv.capacity)} sub={`Tecnologia ${rv.tech}`} />
            <Stat label="Ímpeto" value={pct(rv.momentum ?? 1)} sub="Cai quando perde disputas" />
          </div>
          <div className="grid g2" style={{ marginTop: 12 }}>
            <div className="small col">
              <div className="row between">
                <span>Semanas de superioridade sua (meta: 20)</span>
                <b>{sup}</b>
              </div>
              <Bar value={sup} max={20} tone="green" />
              <div className="row between">
                <span>Semanas de domínio dele (derrota em 12)</span>
                <b className={rv.weeksDominant > 5 ? "neg" : ""}>{rv.weeksDominant}</b>
              </div>
              <Bar value={rv.weeksDominant} max={12} tone="red" />
              <div className="faint">Superioridade: sua fama ≥ 1,5× a dele e popularidade 30 pontos acima. Se o ímpeto dele ficar abaixo de 40% com menos de 10 de público por 8 semanas, ele fecha.</div>
              <div className="row between" style={{ marginTop: 4 }}>
                <span>Regiões</span>
                <span className="muted">{Object.keys(rv.regions).length}</span>
              </div>
            </div>
            <div className="col small">
              <b>Gladiadores dele</b>
              {[...rv.gladiators]
                .sort((a, b) => b.fame - a.fame)
                .slice(0, 6)
                .map((g) => (
                  <div key={g.id} className="row between">
                    <span>{g.name}</span>
                    <span className="muted">fama {Math.round(g.fame)}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="row wrap" style={{ marginTop: 12 }}>
            <button className="btn gold" disabled={!!issue} onClick={() => act((x) => rivalCampaign(x, who), "Campanha lançada!")}>
              <Megaphone size={15} /> {issue ?? `Campanha contra ${rv.name} — ${money(campaignCost(s, who))}`}
            </button>
          </div>
          <div className="col small" style={{ marginTop: 12 }}>
            <b>Últimas ações</b>
            {rv.log.slice(0, 6).map((l, i) => (
              <div key={i} className="muted">
                • {l}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Bids() {
  const { s, act } = useGame();
  if (!s.rival.active && !s.bids.length && !s.contracts.length) return null;
  return (
    <Card title="Disputas de contrato e patrocínios" icon={<Gavel size={16} />}>
      {s.bids.length === 0 ? (
        <div className="small muted">Nenhuma disputa aberta. Casas comerciais (fictícias) aparecem a cada cinco semanas.</div>
      ) : (
        <div className="list">
          {s.bids.map((b) => {
            const ch = bidChance(s, b.id);
            const step = Math.max(500, Math.round(b.weekly * 2));
            return (
              <div key={b.id} className="item">
                <div className="row between wrap">
                  <div>
                    <b>{b.name}</b>
                    <div className="small muted">
                      {money(b.weekly)}/semana por {b.weeks} semanas · decide na semana {b.deadline} · sua oferta extra: {money(b.player)}
                    </div>
                  </div>
                  <button className="btn sm gold" disabled={s.money < step} onClick={() => act((x) => raiseBid(x, b.id, step), "Proposta reforçada.")}>
                    Reforçar (+{money(step)})
                  </button>
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  Chance de vencer ≈ {pct(ch)}
                  <Bar value={ch * 100} tone={ch >= 0.5 ? "green" : "red"} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {s.contracts.length > 0 && (
        <div className="small" style={{ marginTop: 10 }}>
          <b>Contratos ativos</b>
          {s.contracts.map((c) => (
            <div key={c.id} className="row between">
              <span>{c.name}</span>
              <span className={c.weekly >= 0 ? "pos" : "neg"}>
                {money(c.weekly)}/sem · {c.weeksLeft} sem.
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
