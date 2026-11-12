// Painel do Coliseu: a tela inicial da campanha.

import { AlertTriangle, ArrowRight, Play, Building2, CalendarClock, Coins, Gem, Globe2, Landmark, Scale, ScrollText, Shield, Trophy, Users } from "lucide-react";
import { capacity, weeklyExpenses, weeklyIncome } from "../core/economy";
import { authority, estimate } from "../core/events";
import { authorityName, authorityProgress, eraNeeds, victoryGoals } from "../core/progression";
import { strategyLabel } from "../core/rival";
import { ERAS, REGIONS, modality } from "../content/world";
import { requestAdvance, useGame } from "../ui/game";
import { ColosseumArt } from "../ui/art";
import { Bar, Card, LineChart, Stat, fmt, money, one } from "../ui/kit";

export default function Home() {
  const { s, go } = useGame();
  const era = ERAS[s.era - 1];
  const needs = eraNeeds(s);
  const exp = weeklyExpenses(s).reduce((a, e) => a + e.amount, 0);
  const inc = weeklyIncome(s).reduce((a, e) => a + e.amount, 0);
  const last = s.ledger.slice(-12);
  const nets = last.slice(1).map((l, i) => l.balance - last[i].balance);
  const avgNet = nets.length ? nets.reduce((a, b) => a + b, 0) / nets.length : 0;
  const finance = s.money < 0 ? { label: "No vermelho", tone: "neg" as const } : avgNet < 0 ? { label: "Perdendo dinheiro", tone: "neg" as const } : s.money > exp * 20 ? { label: "Cofres cheios", tone: "pos" as const } : { label: "Estável", tone: "pos" as const };
  const ap = authorityProgress(s);
  const regions = REGIONS.length - 1;
  const recent = s.reports[0];
  const night = s.week % 2 === 0 && (s.buildings.iluminacao ?? 0) > 0;
  const goals = victoryGoals(s);
  const rv = s.rival;

  return (
    <div className="stack">
      <div className="hero">
        <section className="card gilded" style={{ padding: 10 }}>
          <ColosseumArt level={s.buildings.arquibancada ?? 0} lights={s.buildings.iluminacao ?? 0} water={s.buildings.aquatica ?? 0} crowd={Math.min(1, s.popularity / 100)} night={night} monuments={s.flags.filter((f) => f === "monumento").length} />
          <div className="row between wrap" style={{ padding: "10px 6px 2px" }}>
            <div>
              <h1>{s.name}</h1>
              <div className="small muted">
                Era {s.era} — {era.name} · Semana {s.week} · {authorityName(s)}
              </div>
            </div>
            <button className="btn gold" onClick={() => go("eventos")}>
              Planejar evento <ArrowRight size={16} />
            </button>
          </div>
        </section>
        <div className="grid g2" style={{ alignContent: "start" }}>
          <Stat icon={<Coins size={14} />} label="Dinheiro" value={money(s.money)} sub={`Fixo: +${fmt(inc)} / −${fmt(exp)} por semana`} tone={s.money < 0 ? "neg" : undefined} />
          <Stat icon={<Gem size={14} />} label="Pontos de evolução" value={s.ep} sub="Use na árvore de Evolução" />
          <Stat icon={<Users size={14} />} label="Popularidade" value={one(s.popularity)} sub={`Satisfação média ${Math.round(s.satisfaction)}%`} />
          <Stat icon={<Trophy size={14} />} label="Fama mundial" value={fmt(s.fame)} sub={`Prestígio ${fmt(s.prestige)}`} />
          <Stat icon={<Building2 size={14} />} label="Capacidade" value={fmt(capacity(s, "roma"))} sub={`${s.branches.length ? `+ ${fmt(s.branches.reduce((a, b) => a + [2000, 5000, 12000, 25000][b.level - 1], 0))} nas filiais` : "lugares no Coliseu"}`} />
          <Stat icon={<Scale size={14} />} label="Situação financeira" value={<span className={finance.tone}>{finance.label}</span>} sub={s.stats.redStreak ? `${s.stats.redStreak} semana(s) no vermelho — falência na 5ª` : "Média das últimas semanas"} />
          <Stat icon={<Globe2 size={14} />} label="Expansão" value={`${s.branches.length}/${regions}`} sub="Regiões com filial" />
          <Stat icon={<Landmark size={14} />} label="Favor imperial" value={one(s.favor)} sub={s.favor < 20 ? "Perigo: o Senado pode cassar a licença" : "Apoio do palácio"} tone={s.favor < 20 ? "neg" : undefined} />
        </div>
      </div>

      <div className="grid g3">
        <Card title="Rumo à próxima era" icon={<ScrollText size={16} />}>
          {needs.length ? (
            <div className="col">
              <div className="small muted">Era {s.era + 1}: {ERAS[s.era].name}</div>
              {needs.map((n) => (
                <div key={n.label} className="small">
                  <div className="row between">
                    <span>{n.label}</span>
                    <span className={n.have >= n.need ? "pos" : "muted"}>
                      {fmt(n.have)} / {fmt(n.need)}
                    </span>
                  </div>
                  <Bar value={n.have} max={n.need} tone={n.have >= n.need ? "green" : undefined} />
                </div>
              ))}
            </div>
          ) : (
            <div className="small">Você chegou à última era. Complete os objetivos de vitória.</div>
          )}
          <div className="sep" />
          <div className="small">
            <div className="row between">
              <span>Autoridade: {authorityName(s)}</span>
              <span className="muted">
                {ap.score}
                {ap.next ? ` / ${ap.next}` : ""}
              </span>
            </div>
            {ap.next && <Bar value={ap.score} max={ap.next} tone="blue" />}
          </div>
        </Card>

        <Card title="Próximo grande evento" icon={<CalendarClock size={16} />}>
          {s.plans.length ? (
            <div className="list">
              {s.plans.map((p) => {
                const e = estimate(s, p);
                return (
                  <div key={p.id} className="item small">
                    <div className="row between">
                      <b>{p.name}</b>
                      {p.mode === "roteirizado" && <span className="tag purple">ROTEIRIZADO</span>}
                    </div>
                    <div className="muted">
                      Estimativa: {fmt(e.attendance)} pessoas · {e.satisfaction}% · {money(e.profit)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="banner small">
              <AlertTriangle size={16} />
              <span>Nenhum evento planejado para esta semana. Sem espetáculo, a popularidade cai.</span>
            </div>
          )}
          {s.international && (
            <div className="item small" style={{ marginTop: 8 }}>
              <b>Jogos internacionais em {s.international.city}</b>
              <div className="muted">
                Semana {s.international.week} · {modality(s.international.modality).name} · campeão: {s.gladiators.find((g) => g.id === s.international!.champion)?.name ?? "escolha na Central Imperial"}
              </div>
            </div>
          )}
          {recent && (
            <div className="small muted" style={{ marginTop: 10 }}>
              Último: {recent.name} — {fmt(recent.attendance)} pessoas, {recent.satisfaction}% de satisfação.
            </div>
          )}
          {s.plans.length > 0 && (
            <button className="btn gold" style={{ marginTop: 10, marginRight: 8 }} onClick={requestAdvance}>
              <Play size={15} /> Iniciar {s.plans.length === 1 ? "evento" : "eventos"} agora
            </button>
          )}
          <button className="btn sm" style={{ marginTop: 10 }} onClick={() => go("eventos")}>
            Abrir planejamento
          </button>
        </Card>

        <Card title="Situação dos rivais" icon={<Shield size={16} />}>
          {!rv.active && !rv.defeated ? (
            <div className="small muted">Por enquanto você não tem concorrentes à altura. Isso muda na Era 2.</div>
          ) : (
            <div className="col small">
              <div className="row between">
                <b>{rv.name}</b>
                {rv.defeated ? <span className="tag green">Fechada</span> : <span className="tag red">{strategyLabel(rv.strategy).split(" — ")[0]}</span>}
              </div>
              {!rv.defeated && (
                <>
                  <div className="row between">
                    <span>Público em Roma</span>
                    <span>
                      {one(rv.regions.roma ?? 0)} <span className="faint">× seus {one(s.popularity)}</span>
                    </span>
                  </div>
                  <Bar value={rv.regions.roma ?? 0} tone="red" />
                  <div className="row between">
                    <span>Fama</span>
                    <span>
                      {fmt(rv.fame)} <span className="faint">× sua {fmt(s.fame)}</span>
                    </span>
                  </div>
                  <div className="row between">
                    <span>Ímpeto</span>
                    <span>{Math.round((rv.momentum ?? 1) * 100)}%</span>
                  </div>
                  <div className="faint">{rv.lastAction}</div>
                  {rv.weeksDominant > 3 && <div className="neg">Atenção: a Dominus domina há {rv.weeksDominant} semanas (derrota em 12).</div>}
                </>
              )}
              {s.league && (
                <div className="item" style={{ marginTop: 6 }}>
                  <b>{s.league.name}</b>{" "}
                  {s.league.defeated ? (
                    <span className="tag green">Desfeita</span>
                  ) : (
                    <span className="muted">
                      — fama {fmt(s.league.fame)}, ímpeto {Math.round((s.league.momentum ?? 1) * 100)}%
                    </span>
                  )}
                </div>
              )}
              <button className="btn sm" onClick={() => go("rival")}>
                Painel dos rivais
              </button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid g2">
        <Card title="Finanças e público" icon={<Coins size={16} />}>
          {last.length > 1 ? (
            <LineChart
              series={[
                { name: "Caixa", color: "#d2ab5f", values: last.map((l) => l.balance) },
                { name: "Público da semana", color: "#6f9fc8", values: last.map((l) => l.attendance) },
              ]}
              labels={last.map((l) => `sem ${l.week}`)}
            />
          ) : (
            <div className="small muted">Os gráficos aparecem depois das primeiras semanas.</div>
          )}
        </Card>
        <Card title="Objetivos de vitória" icon={<Trophy size={16} />}>
          <div className="col">
            {goals.map((g) => (
              <div key={g.id} className="small">
                <div className="row between">
                  <span>{g.label}</span>
                  <span className={g.done ? "pos" : "muted"}>{g.done ? "✓" : `${fmt(g.have)} / ${fmt(g.need)}`}</span>
                </div>
                <Bar value={g.have} max={g.need} tone={g.done ? "green" : undefined} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {(s.quests.length > 0 || s.offers.length > 0) && (
        <div className="grid g2">
          {s.quests.map((q) => (
            <div key={q.id} className="banner">
              <AlertTriangle size={16} />
              <div className="small">
                <b>Missão: {q.title}</b>
                <div>{q.description}</div>
              </div>
            </div>
          ))}
          {s.offers.map((o) => (
            <div key={o.id} className="banner red">
              <AlertTriangle size={16} />
              <div className="small">
                <b>Proposta do rival por {s.gladiators.find((g) => g.id === o.gladiator)?.name}</b>
                <div>
                  Responda até a semana {o.deadline} em Gladiadores.{" "}
                  <button className="btn sm" onClick={() => go("gladiadores")}>
                    Ver
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card title="Crônica recente" icon={<ScrollText size={16} />} right={<button className="btn sm ghost" onClick={() => go("cronica")}>Ver tudo</button>}>
        <div className="col small">
          {s.log.slice(0, 7).map((l, i) => (
            <div key={i} className="row" style={{ alignItems: "flex-start" }}>
              <span className="tag grey">S{l.week}</span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      </Card>
      <p className="tiny faint center">Autoridade {authority(s)}/5. As decisões fundamentais continuam sempre com você, mesmo com gerentes contratados.</p>
    </div>
  );
}
