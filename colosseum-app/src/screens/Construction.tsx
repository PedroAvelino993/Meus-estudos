// Construção, funcionários, gerentes (automação) e monumentos.

import { useState } from "react";
import { Bot, Building2, Hammer, Landmark, Minus, Plus, Users } from "lucide-react";
import { buildCost, weeklyExpenses } from "../core/economy";
import { build, buildIssue, buildMonument, managerIssue, monumentCost, monumentCount, monumentIssue, MONUMENT_NAMES, setAutomation, setStaff, staffIssue, toggleManager } from "../core/build";
import { BUILDINGS, MANAGERS, STAFF } from "../content/world";
import { useGame } from "../ui/game";
import { Bar, Card, Head, Seg, fmt, money } from "../ui/kit";

export default function Construction() {
  const [tab, setTab] = useState<"obras" | "pessoal" | "legado">("obras");
  return (
    <div className="stack">
      <Head title="Construção e administração" text="Amplie o Coliseu nível por nível, contrate funcionários e delegue tarefas a gerentes. Cada obra aumenta a manutenção semanal: invista quando o retorno compensar." right={<Seg value={tab} onChange={setTab} options={[{ id: "obras", label: "Obras" }, { id: "pessoal", label: "Pessoal e automação" }, { id: "legado", label: "Monumentos" }]} />} />
      {tab === "obras" && <Buildings />}
      {tab === "pessoal" && <Staff />}
      {tab === "legado" && <Monuments />}
    </div>
  );
}

function Buildings() {
  const { s, act } = useGame();
  return (
    <div className="grid g2">
      {BUILDINGS.map((b) => {
        const lvl = s.buildings[b.id] ?? 0;
        const cur = b.levels[lvl];
        const next = b.levels[lvl + 1];
        const issue = buildIssue(s, b.id);
        return (
          <div key={b.id} className="card">
            <div className="row between">
              <h3 className="row">
                <Building2 size={16} /> {b.name}
              </h3>
              <span className="tag">
                Nível {lvl}/{b.levels.length - 1}
              </span>
            </div>
            <p className="small muted" style={{ margin: "6px 0" }}>
              {b.description}
            </p>
            <div className="small">
              Agora: <b>{cur.label}</b> ({b.id === "arquibancada" ? `${fmt(cur.value)} lugares` : `${cur.value} ${b.unit}`})
            </div>
            <div style={{ margin: "8px 0" }}>
              <Bar value={lvl} max={b.levels.length - 1} />
            </div>
            {next ? (
              <>
                <div className="small">
                  Próximo: <b>{next.label}</b> ({b.id === "arquibancada" ? `${fmt(next.value)} lugares` : `${next.value} ${b.unit}`})
                </div>
                <button className="btn gold block" style={{ marginTop: 8 }} disabled={!!issue} onClick={() => act((x) => build(x, b.id), `${next.label} concluído!`)}>
                  <Hammer size={15} /> {issue ?? `Construir — ${money(buildCost(s, b.id))}`}
                </button>
              </>
            ) : (
              <div className="small pos">Construção completa.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Staff() {
  const { s, act } = useGame();
  const exp = weeklyExpenses(s);
  return (
    <div className="grid g2">
      <Card title="Funcionários" icon={<Users size={16} />}>
        <div className="list">
          {STAFF.map((st) => {
            const n = s.staff[st.id] ?? 0;
            return (
              <div key={st.id} className="item">
                <div className="row between">
                  <div>
                    <b>{st.name}</b>
                    <div className="small muted">{st.description}</div>
                    <div className="tiny faint">
                      {money(st.salary)}/semana cada · máximo {st.max}
                    </div>
                  </div>
                  <div className="row">
                    <button className="btn sm" disabled={!!staffIssue(s, st.id, -1)} onClick={() => act((x) => setStaff(x, st.id, -1))} aria-label={`Dispensar ${st.name}`}>
                      <Minus size={14} />
                    </button>
                    <b className="num" style={{ minWidth: 20, textAlign: "center" }}>
                      {n}
                    </b>
                    <button className="btn sm" disabled={!!staffIssue(s, st.id, 1)} onClick={() => act((x) => setStaff(x, st.id, 1))} aria-label={`Contratar ${st.name}`}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="small" style={{ marginTop: 10 }}>
          Moral da equipe: <b>{Math.round(s.staffMorale)}</b>
          <Bar value={s.staffMorale} tone={s.staffMorale < 40 ? "red" : "green"} />
        </div>
      </Card>
      <div className="stack">
        <Card title="Gerentes e automação" icon={<Bot size={16} />}>
          <p className="small muted" style={{ marginBottom: 10 }}>
            Gerentes cuidam das tarefas repetitivas. Você pode desligar a automação a qualquer momento — e as decisões fundamentais (árvore, construções, contratações, expansão, crises e roteiros) são sempre suas.
          </p>
          <div className="list">
            {MANAGERS.map((m) => {
              const hired = s.managers.includes(m.id);
              const issue = managerIssue(s, m.id);
              return (
                <div key={m.id} className="item">
                  <div className="row between wrap">
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <b>{m.name}</b> {hired && <span className="tag green">Contratado</span>}
                      <div className="small muted">{m.description}</div>
                      <div className="tiny faint">
                        {money(m.salary)}/semana · autoridade {m.authority}
                      </div>
                    </div>
                    <div className="row">
                      {hired && (
                        <label className="row small">
                          <input type="checkbox" checked={s.automation[m.id] !== false} onChange={(e) => act((x) => setAutomation(x, m.id, e.target.checked))} />
                          Ativo
                        </label>
                      )}
                      <button className={`btn sm ${hired ? "" : "gold"}`} disabled={!hired && !!issue} onClick={() => act((x) => toggleManager(x, m.id))} title={issue ?? ""}>
                        {hired ? "Dispensar" : issue ?? "Contratar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="Despesas fixas por semana" icon={<Building2 size={16} />}>
          {exp.map((e) => (
            <div key={e.label} className="row between small">
              <span>{e.label}</span>
              <span className="neg">−{money(e.amount)}</span>
            </div>
          ))}
          <div className="sep" />
          <div className="row between small">
            <b>Total</b>
            <b className="neg">−{money(exp.reduce((a, e) => a + e.amount, 0))}</b>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Monuments() {
  const { s, act } = useGame();
  const n = monumentCount(s);
  const issue = monumentIssue(s);
  return (
    <Card title="Monumentos ao legado" icon={<Landmark size={16} />}>
      <p className="small muted" style={{ marginBottom: 10 }}>
        Estátuas, arcos e colunas com o nome do Coliseu. Cada monumento dá prestígio na hora, prestígio passivo toda semana e atrai visitantes.
      </p>
      <div className="grid g3">
        {MONUMENT_NAMES.map((name, i) => (
          <div key={name} className={`item ${i < n ? "on" : "locked"}`}>
            <b className="small">{name}</b>
            <div className="tiny muted">{i < n ? "Erguido" : i === n ? `Custa ${money(monumentCost(s))}` : "—"}</div>
          </div>
        ))}
      </div>
      <button className="btn gold" style={{ marginTop: 12 }} disabled={!!issue} onClick={() => act((x) => buildMonument(x), "Monumento erguido!")}>
        <Landmark size={15} /> {issue ?? `Erguer ${MONUMENT_NAMES[n]}`}
      </button>
    </Card>
  );
}
