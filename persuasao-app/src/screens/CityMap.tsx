// Mapa interativo de Vila Áurea: bairros, bloqueios, transporte e quem está em cada lugar.

import { useState } from "react";
import { Bus, Lock, MapPin, Users } from "lucide-react";
import Portrait from "../components/Portrait";
import { CHARACTERS, CITY, DISTRICTS, MISSIONS, district } from "../content";
import { DAY_END, districtUnlocked, fareTo, gigsHere, levelOf, missionAvailable, travel } from "../core/game";
import type { GameState } from "../core/game";
import { fmt, useGame } from "../ui";

const ROADS: [string, string][] = [
  ["jardim", "mercado"],
  ["jardim", "campus"],
  ["mercado", "largo"],
  ["campus", "largo"],
  ["largo", "torres"],
  ["mercado", "paco"],
  ["paco", "palmeiras"],
  ["torres", "palmeiras"],
  ["jardim", "paco"],
];

function lockText(s: GameState, id: string): string[] {
  const u = district(id).unlock;
  const out: string[] = [];
  if (u.chapter && s.chapter < u.chapter) out.push(`Capítulo ${u.chapter}`);
  if (u.level && levelOf(s.xp).level < u.level) out.push(`Nível ${u.level}`);
  if (u.rep && s.rep < u.rep) out.push(`Reputação ${u.rep}`);
  return out;
}

export default function CityMap() {
  const { s, act, go, toast, showCharacter } = useGame();
  const [sel, setSel] = useState<string>(s.location);
  const d = district(sel);
  const unlocked = districtUnlocked(s, sel);
  const fare = fareTo(s, sel);
  const people = CHARACTERS.filter((c) => c.district === sel);
  const missions = MISSIONS.filter((m) => m.district === sel && missionAvailable(s, m));
  const here = sel === s.location;
  const tooLate = s.minute + 30 > DAY_END;

  const center = (id: string) => district(id).label;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Mapa</div>
          <h1>{CITY}</h1>
        </div>
        <span className="small muted">Toque num bairro para ver quem está lá.</span>
      </div>
      <div className="map-layout">
        <div className="map-wrap">
          <svg className="map-svg" viewBox="0 0 1000 640" role="group" aria-label="Mapa da cidade">
            <defs>
              <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="4" />
              </pattern>
              <radialGradient id="sea" cx="85%" cy="90%" r="80%">
                <stop offset="0" stopColor="#0f2a33" />
                <stop offset="1" stopColor="#0a141a" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            <rect width="1000" height="640" fill="url(#sea)" />
            {Array.from({ length: 9 }, (_, i) => (
              <path key={i} d={`M${600 + i * 30} ${640 - i * 4} q 20 -6 40 0 t 40 0`} stroke="#3fa7a0" strokeOpacity="0.12" fill="none" />
            ))}
            <path d="M30 360 L40 210 L80 110 L300 80 L520 58 L810 48 L955 196 L975 470 L870 605 L615 615 L465 575 L280 575 L110 605 L40 505 Z" fill="#111820" stroke="#1f2a35" strokeWidth="2" />
            <path d="M300 82 C320 160 260 250 252 330 C246 400 300 430 290 575" stroke="#1d3d4a" strokeWidth="9" fill="none" strokeOpacity="0.8" />
            {ROADS.map(([a, b]) => {
              const [x1, y1] = center(a);
              const [x2, y2] = center(b);
              return <line key={a + b} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c9a44c" strokeOpacity="0.16" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />;
            })}
            {DISTRICTS.map((x) => {
              const open = districtUnlocked(s, x.id);
              const count = MISSIONS.filter((m) => m.district === x.id && missionAvailable(s, m)).length + (open ? s.gigs.filter((g) => !g.done && CHARACTERS.find((c) => c.id === g.char)?.district === x.id).length : 0);
              return (
                <g
                  key={x.id}
                  className={`district-shape ${sel === x.id ? "selected" : ""} ${open ? "" : "locked"}`}
                  onClick={() => setSel(x.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${x.name}${open ? "" : " (bloqueado)"}`}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(x.id)}
                >
                  <path className="fill" d={x.path} fill={x.color} fillOpacity="0.3" stroke={x.color} strokeOpacity="0.85" strokeWidth="1.5" strokeLinejoin="round" />
                  {!open && <path d={x.path} fill="url(#hatch)" />}
                  <text className="map-label" x={x.label[0]} y={x.label[1]} textAnchor="middle">
                    {x.name}
                  </text>
                  <text className="map-sub" x={x.label[0]} y={x.label[1] + 18} textAnchor="middle">
                    {open ? (count ? `${count} ${count === 1 ? "missão" : "missões"}` : x.kind) : "🔒 bloqueado"}
                  </text>
                </g>
              );
            })}
            {(() => {
              const [x, y] = center(s.location);
              return (
                <g className="pin" transform={`translate(${x} ${y - 40})`}>
                  <circle className="pin-pulse" r="10" fill="#e2c37a" opacity="0.6" />
                  <circle r="9" fill="#e2c37a" stroke="#17130a" strokeWidth="3" />
                  <circle r="3" fill="#17130a" />
                </g>
              );
            })()}
          </svg>
        </div>

        <div className="card map-panel" style={{ borderColor: d.color }}>
          <div className="eyebrow" style={{ color: d.color }}>
            {d.kind}
          </div>
          <h2 style={{ marginTop: 2 }}>{d.name}</h2>
          <p className="small gold" style={{ marginTop: 2 }}>
            {d.tagline}
          </p>
          <p className="small muted" style={{ marginTop: 8 }}>
            {d.description}
          </p>
          <div className="row wrap" style={{ marginTop: 10 }}>
            <span className="chip">
              <Users size={12} /> {people.length} moradores
            </span>
            <span className="chip">Classe {"★".repeat(d.tier)}</span>
            {unlocked && !here && (
              <span className="chip gold">
                <Bus size={12} /> {fare ? fmt(fare) : "grátis"} · 30 min
              </span>
            )}
          </div>

          {unlocked ? (
            <>
              <div className="row wrap" style={{ marginTop: 12, gap: 6 }}>
                {people.map((c) => (
                  <button key={c.id} className="avatar-opt" style={{ width: 54, padding: 2 }} onClick={() => showCharacter(c.id)} aria-label={c.name} title={c.name}>
                    <Portrait look={c.look} bg={d.color + "55"} />
                  </button>
                ))}
              </div>
              {missions.length > 0 && <p className="small" style={{ marginTop: 10 }}>{missions.length} missões disponíveis aqui.</p>}
              <div className="col" style={{ marginTop: 14 }}>
                {here ? (
                  <button className="btn primary block" onClick={() => go("district")}>
                    <MapPin size={16} /> Explorar {d.name}
                  </button>
                ) : (
                  <button
                    className="btn primary block"
                    disabled={s.money < fare || tooLate}
                    onClick={() => {
                      act((g) => travel(g, sel));
                      toast({ text: `Você chegou a ${d.name}.`, icon: MapPin });
                      go("district");
                    }}
                  >
                    <Bus size={16} /> Ir para {d.name}
                  </button>
                )}
                {!here && s.money < fare && <p className="tiny red">Saldo insuficiente para a passagem.</p>}
                {!here && tooLate && <p className="tiny red">O transporte não circula tão tarde. Durma e volte amanhã.</p>}
              </div>
              {sel === s.location && gigsHere(s).length > 0 && <p className="tiny muted" style={{ marginTop: 8 }}>Há bicos do dia por aqui.</p>}
            </>
          ) : (
            <div className="card tight" style={{ marginTop: 12, background: "var(--panel-2)" }}>
              <div className="row">
                <Lock size={16} className="gold" />
                <b className="small">Para liberar:</b>
              </div>
              <ul className="small muted" style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                {lockText(s, sel).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
