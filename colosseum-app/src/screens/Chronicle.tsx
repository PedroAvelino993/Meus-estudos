// Crônica: registro da campanha, estatísticas, conquistas e objetivos.

import { useState } from "react";
import { Award, BarChart3, ScrollText, Target } from "lucide-react";
import type { LogEntry } from "../core/types";
import { victoryGoals } from "../core/progression";
import { ACHIEVEMENTS } from "../content/story";
import { useGame } from "../ui/game";
import { Bar, Card, Head, LineChart, Seg, Stat, fmt, money } from "../ui/kit";

const KINDS: { id: LogEntry["kind"] | "todos"; label: string }[] = [
  { id: "todos", label: "Tudo" },
  { id: "evento", label: "Eventos" },
  { id: "gladiador", label: "Gladiadores" },
  { id: "rival", label: "Rivais" },
  { id: "crise", label: "Crises" },
  { id: "mundo", label: "Mundo" },
  { id: "bets", label: "Bets" },
  { id: "era", label: "Eras" },
];

export default function Chronicle() {
  const { s } = useGame();
  const [tab, setTab] = useState<"registro" | "estatisticas" | "conquistas">("registro");
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("todos");
  const log = s.log.filter((l) => kind === "todos" || l.kind === kind);
  const L = s.ledger.slice(-52);
  return (
    <div className="stack">
      <Head title="Crônica" text="Tudo o que aconteceu desde que o Coliseu abriu as portas." right={<Seg value={tab} onChange={setTab} options={[{ id: "registro", label: "Registro" }, { id: "estatisticas", label: "Estatísticas" }, { id: "conquistas", label: "Conquistas" }]} />} />
      {tab === "registro" && (
        <Card title="Registro" icon={<ScrollText size={16} />} right={<select className="input" style={{ width: "auto" }} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>{KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select>}>
          <div className="col small">
            {log.slice(0, 150).map((l, i) => (
              <div key={i} className="row" style={{ alignItems: "flex-start" }}>
                <span className="tag grey">S{l.week}</span>
                <span>{l.text}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {tab === "estatisticas" && (
        <div className="stack">
          <div className="grid g4">
            <Stat label="Espetáculos" value={fmt(s.stats.events)} sub={`${s.stats.free} livres · ${s.stats.scripted} roteirizados`} />
            <Stat label="Espectadores" value={fmt(s.stats.spectators)} />
            <Stat label="Receita total" value={money(s.stats.revenue)} />
            <Stat label="Recorde de público" value={fmt(s.records.attendance)} sub={`Satisfação recorde ${s.records.satisfaction}%`} />
            <Stat label="Contratações" value={s.stats.hires} />
            <Stat label="Obras" value={s.stats.builds} />
            <Stat label="Crises enfrentadas" value={s.stats.crises} />
            <Stat label="PE ganhos" value={fmt(s.stats.totalEp)} />
          </div>
          {L.length > 1 && (
            <div className="grid g2">
              <Card title="Caixa" icon={<BarChart3 size={16} />}>
                <LineChart series={[{ name: "Caixa", color: "#d2ab5f", values: L.map((l) => l.balance) }]} labels={L.map((l) => `sem ${l.week}`)} />
              </Card>
              <Card title="Público semanal" icon={<BarChart3 size={16} />}>
                <LineChart series={[{ name: "Público", color: "#6f9fc8", values: L.map((l) => l.attendance) }]} labels={L.map((l) => `sem ${l.week}`)} />
              </Card>
              <Card title="Popularidade" icon={<BarChart3 size={16} />}>
                <LineChart series={[{ name: "Popularidade", color: "#6fae6a", values: L.map((l) => l.popularity) }]} labels={L.map((l) => `sem ${l.week}`)} />
              </Card>
              <Card title="Despesas fixas" icon={<BarChart3 size={16} />}>
                <LineChart series={[{ name: "Despesas", color: "#c8392c", values: L.map((l) => l.expenses) }]} labels={L.map((l) => `sem ${l.week}`)} />
              </Card>
            </div>
          )}
        </div>
      )}
      {tab === "conquistas" && (
        <div className="grid g2">
          <Card title="Objetivos de vitória" icon={<Target size={16} />}>
            <div className="col">
              {victoryGoals(s).map((g) => (
                <div key={g.id} className="small">
                  <div className="row between">
                    <span>{g.label}</span>
                    <span className={g.done ? "pos" : "muted"}>{g.done ? "✓" : `${fmt(g.have)} / ${fmt(g.need)}`}</span>
                  </div>
                  <Bar value={g.have} max={g.need} tone={g.done ? "green" : undefined} />
                </div>
              ))}
            </div>
            <p className="tiny faint" style={{ marginTop: 8 }}>
              Derrota: 5 semanas seguidas no vermelho, 4 semanas com popularidade zero, 4 semanas sem favor imperial, ou 12 semanas de domínio de um rival.
            </p>
          </Card>
          <Card title={`Conquistas (${Object.keys(s.achievements).length}/${ACHIEVEMENTS.length})`} icon={<Award size={16} />}>
            <div className="list">
              {ACHIEVEMENTS.map((a) => {
                const got = s.achievements[a.id] !== undefined;
                if (a.secret && !got)
                  return (
                    <div key={a.id} className="item locked small">
                      <b>Conquista secreta</b>
                      <div className="muted">Continue jogando para descobrir.</div>
                    </div>
                  );
                return (
                  <div key={a.id} className={`item small ${got ? "on" : "locked"}`}>
                    <div className="row between">
                      <b>{a.title}</b>
                      {got && <span className="tag">Semana {s.achievements[a.id]}</span>}
                    </div>
                    <div className="muted">{a.description}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
