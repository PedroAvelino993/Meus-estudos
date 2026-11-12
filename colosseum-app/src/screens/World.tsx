// Mapa do mundo: regiões, filiais, presença dos rivais e expansão.

import { useState } from "react";
import { Globe2, MapPin, TrendingUp } from "lucide-react";
import { capacity, expansionCost } from "../core/economy";
import { expand, expandIssue, toggleDelegate, upgradeBranch, upgradeIssue } from "../core/world";
import { BRANCH_LEVELS, MODALITIES, REGIONS, region } from "../content/world";
import { useGame } from "../ui/game";
import { Bar, Card, Head, fmt, money, one } from "../ui/kit";

export default function World() {
  const { s, act, go } = useGame();
  const [sel, setSel] = useState("roma");
  const reg = region(sel);
  const br = s.branches.find((b) => b.region === sel);
  const rivalPop = s.rival.active ? s.rival.regions[sel] ?? 0 : 0;
  const leaguePop = s.league && s.league.active ? s.league.regions[sel] ?? 0 : 0;
  const issue = sel === "roma" ? null : expandIssue(s, sel);
  const up = br ? upgradeIssue(s, sel) : null;
  const nextLevel = br ? BRANCH_LEVELS[br.level] : null;
  const likes = Object.entries(reg.likes)
    .map(([id, v]) => ({ name: MODALITIES.find((m) => m.id === id)?.name ?? id, v }))
    .sort((a, b) => b.v - a.v);

  return (
    <div className="stack">
      <Head title="Expansão mundial" text="Abra filiais nas províncias. Cada região tem população, interesse, riqueza, concorrência e gostos próprios. Filiais delegadas a governadores organizam eventos sozinhas; as outras você programa em Eventos com seus gladiadores." right={<span className="tag">{s.branches.length} filiais</span>} />
      <div className="grid planner">
        <section className="card" style={{ padding: 10 }}>
          <svg className="map" viewBox="0 0 1000 560" role="img" aria-label="Mapa do mundo romano">
            <path d="M0 330 Q200 300 300 330 T560 330 T760 360 T1000 340 V560 H0 Z" fill="#2c5f7a" opacity="0.35" />
            <text x="700" y="364" fill="#9cc3d6" opacity="0.5" fontFamily="Cinzel, serif" fontSize="17" textAnchor="middle" letterSpacing="6">
              MARE NOSTRUM
            </text>
            {REGIONS.map((r) => {
              const mine = r.id === "roma" || s.branches.some((b) => b.region === r.id);
              const open = !expandIssue(s, r.id);
              const rv = (s.rival.active ? s.rival.regions[r.id] ?? 0 : 0) > 0 || (s.league?.active ? s.league.regions[r.id] ?? 0 : 0) > 0;
              const fill = mine ? "#b98d42" : open ? "#6f8a58" : r.era > s.era ? "#3a3530" : "#5a4e3c";
              return (
                <g key={r.id} className="region" onClick={() => setSel(r.id)}>
                  <path d={r.path} fill={fill} stroke={sel === r.id ? "#f0d79b" : "#2a1e14"} strokeWidth={sel === r.id ? 4 : 2} />
                  <text x={r.label[0]} y={r.label[1]} textAnchor="middle" fill="#f6eedd" fontFamily="Cinzel, serif" fontSize="15" style={{ pointerEvents: "none" }}>
                    {r.name}
                  </text>
                  {mine && <circle cx={r.label[0]} cy={r.label[1] - 26} r="8" fill="#d2ab5f" stroke="#2a1e14" strokeWidth="2" />}
                  {rv && <circle cx={r.label[0] + 18} cy={r.label[1] - 26} r="7" fill="#a3241c" stroke="#2a1e14" strokeWidth="2" />}
                </g>
              );
            })}
          </svg>
          <div className="row wrap small" style={{ gap: 14, padding: "8px 4px 0" }}>
            <span className="row">
              <i style={{ width: 12, height: 12, background: "#b98d42", borderRadius: 3, display: "inline-block" }} /> Suas arenas
            </span>
            <span className="row">
              <i style={{ width: 12, height: 12, background: "#6f8a58", borderRadius: 3, display: "inline-block" }} /> Pode expandir
            </span>
            <span className="row">
              <i style={{ width: 12, height: 12, background: "#5a4e3c", borderRadius: 3, display: "inline-block" }} /> Ainda não
            </span>
            <span className="row">
              <i style={{ width: 12, height: 12, background: "#a3241c", borderRadius: 6, display: "inline-block" }} /> Presença rival
            </span>
          </div>
        </section>

        <div className="planner-side stack">
          <section className="card gilded">
            <div className="row between">
              <h2 className="row">
                <MapPin size={18} /> {reg.name}
              </h2>
              {sel === "roma" ? <span className="tag">Sede</span> : br ? <span className="tag green">Filial nível {br.level}</span> : <span className="tag grey">Era {reg.era}</span>}
            </div>
            <p className="small muted" style={{ margin: "6px 0 10px" }}>
              {reg.description}
            </p>
            <div className="grid g2" style={{ gap: 8 }}>
              <div className="stat">
                <div className="label">População</div>
                <div className="value">{fmt(reg.population)}</div>
              </div>
              <div className="stat">
                <div className="label">Interesse</div>
                <div className="value">{Math.round(reg.interest * 100)}%</div>
              </div>
              <div className="stat">
                <div className="label">Potencial financeiro</div>
                <div className="value">{Math.round(reg.wealth * 100)}%</div>
              </div>
              <div className="stat">
                <div className="label">Concorrência</div>
                <div className="value">{Math.round(reg.competition * 100)}%</div>
              </div>
            </div>
            <div className="small" style={{ marginTop: 10 }}>
              <b>Cultura:</b> {reg.culture}
            </div>
            <div className="row wrap" style={{ gap: 4, marginTop: 6 }}>
              {likes.map((l) => (
                <span key={l.name} className="tag">
                  {l.name} +{Math.round((l.v - 1) * 100)}%
                </span>
              ))}
            </div>
            {(rivalPop > 0 || leaguePop > 0) && (
              <div className="small" style={{ marginTop: 10 }}>
                {rivalPop > 0 && <div className="neg">{s.rival.name}: popularidade {one(rivalPop)} aqui.</div>}
                {leaguePop > 0 && <div className="neg">Liga das Arenas Livres: popularidade {one(leaguePop)} aqui.</div>}
              </div>
            )}
            <div className="sep" />
            {sel === "roma" ? (
              <div className="small">
                Coliseu com {fmt(capacity(s, "roma"))} lugares · popularidade {one(s.popularity)}
                <Bar value={s.popularity} />
              </div>
            ) : br ? (
              <div className="stack">
                <div className="small">
                  {fmt(capacity(s, sel))} lugares · popularidade {one(br.popularity)}
                  <Bar value={br.popularity} />
                </div>
                <label className="row small">
                  <input type="checkbox" checked={br.delegated} onChange={() => act((x) => toggleDelegate(x, sel))} />
                  Delegar ao governador (eventos automáticos com a trupe local{!s.managers.includes("governador") ? " — contrate um governador em Construção" : ""})
                </label>
                {!br.delegated && (
                  <button className="btn" onClick={() => go("eventos")}>
                    Programar evento aqui
                  </button>
                )}
                {nextLevel && (
                  <button className="btn gold" disabled={!!up} onClick={() => act((x) => upgradeBranch(x, sel), "Filial ampliada!")}>
                    <TrendingUp size={15} /> {up ?? `${nextLevel.label} (${fmt(nextLevel.capacity)} lugares) — ${money(nextLevel.cost)}`}
                  </button>
                )}
              </div>
            ) : (
              <div className="stack">
                <div className="small">
                  Exige fama {reg.minFame}, prestígio {reg.minPrestige} e Era {reg.era}. Custo atual: <b>{money(expansionCost(s, sel))}</b>.
                </div>
                <button className="btn gold" disabled={!!issue} onClick={() => act((x) => expand(x, sel), `Filial aberta em ${reg.name}!`)}>
                  <Globe2 size={15} /> {issue ?? `Abrir filial — ${money(expansionCost(s, sel))}`}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
      <Card title="Suas filiais" icon={<Globe2 size={16} />}>
        {s.branches.length === 0 ? (
          <div className="small muted">Nenhuma filial ainda. A primeira expansão fica disponível na Era 3.</div>
        ) : (
          <div className="scroll-x">
            <table className="table">
              <thead>
                <tr>
                  <th>Região</th>
                  <th>Nível</th>
                  <th>Lugares</th>
                  <th>Popularidade</th>
                  <th>Gestão</th>
                  <th>Último evento</th>
                </tr>
              </thead>
              <tbody>
                {s.branches.map((b) => (
                  <tr key={b.region}>
                    <td>{region(b.region).name}</td>
                    <td>{b.level}</td>
                    <td>{fmt(BRANCH_LEVELS[b.level - 1].capacity)}</td>
                    <td>{one(b.popularity)}</td>
                    <td>{b.delegated ? "Governador" : "Você"}</td>
                    <td>{b.lastEventWeek ? `semana ${b.lastEventWeek}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
