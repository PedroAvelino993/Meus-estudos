// Gladiadores: elenco, mercado, propostas do rival e relações (rivalidades e amizades).

import { useState } from "react";
import { AlertTriangle, HeartHandshake, Swords, UserMinus, UserPlus } from "lucide-react";
import type { Gladiator } from "../core/types";
import { PERSONALITY_LABEL, SPECIALTY_LABEL } from "../core/types";
import { fairSalary, hire, isLegend, marketValue, raiseSalary, release, setFocus, signingFee, skill } from "../core/gladiators";
import { acceptOffer, matchOffer } from "../core/rival";
import { useGame } from "../ui/game";
import { Portrait } from "../ui/art";
import { Bar, Card, Empty, Head, Seg, fmt, money } from "../ui/kit";

const FOCUS = [
  { id: "tecnica", label: "Técnica" },
  { id: "forca", label: "Força" },
  { id: "resistencia", label: "Resistência" },
  { id: "carisma", label: "Carisma" },
  { id: "descanso", label: "Descanso" },
] as const;

export default function Gladiators() {
  const { s } = useGame();
  const [tab, setTab] = useState<"elenco" | "mercado" | "relacoes">(s.offers.length ? "elenco" : "elenco");
  return (
    <div className="stack">
      <Head
        title="Gladiadores"
        text="Cada gladiador tem atributos, personalidade, história e fama próprias. Escale quem combina com a modalidade, treine nas semanas livres e proteja suas estrelas das propostas do rival."
        right={<Seg value={tab} onChange={setTab} options={[{ id: "elenco", label: `Elenco (${s.gladiators.length})` }, { id: "mercado", label: `Mercado (${s.market.length})` }, { id: "relacoes", label: `Relações (${s.relations.length})` }]} />}
      />
      {s.offers.length > 0 && <Offers />}
      {tab === "elenco" && (
        <div className="grid g2">
          {[...s.gladiators]
            .sort((a, b) => b.fame - a.fame)
            .map((g) => (
              <GladCard key={g.id} g={g} owned />
            ))}
        </div>
      )}
      {tab === "mercado" && <Market />}
      {tab === "relacoes" && <Relations />}
    </div>
  );
}

function Offers() {
  const { s, act } = useGame();
  return (
    <Card title="Propostas da concorrência" icon={<AlertTriangle size={16} />} className="gilded">
      <div className="list">
        {s.offers.map((o) => {
          const g = s.gladiators.find((x) => x.id === o.gladiator);
          if (!g) return null;
          return (
            <div key={o.id} className="item">
              <div className="row between wrap">
                <div>
                  <b>{g.name}</b> recebeu uma proposta da {s.rival.name}
                  <div className="small muted">
                    Responda até a semana {o.deadline}. Se ignorar, ele decide sozinho ({PERSONALITY_LABEL[g.personality].toLowerCase()}, moral {Math.round(g.morale)}).
                  </div>
                </div>
                <div className="row">
                  <button className="btn gold sm" disabled={s.money < o.amount} onClick={() => act((x) => matchOffer(x, o.id), `${g.name} fica no Coliseu.`)}>
                    Cobrir ({money(o.amount)})
                  </button>
                  <button className="btn sm" onClick={() => act((x) => acceptOffer(x, o.id), `${g.name} foi negociado.`)}>
                    Liberar (+{money(o.amount * 0.5)})
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Attr({ label, v }: { label: string; v: number }) {
  return (
    <div className="attr">
      <span className="muted">{label}</span>
      <Bar value={v} />
      <span className="num">{Math.round(v)}</span>
    </div>
  );
}

export function GladCard({ g, owned }: { g: Gladiator; owned?: boolean }) {
  const { s, act } = useGame();
  const [open, setOpen] = useState(false);
  const fair = fairSalary(g);
  const fee = Math.round(signingFee(g) * (s.rivalInterest[g.id] ? 1.3 : 1));
  const rels = s.relations.filter((r) => r.a === g.id || r.b === g.id);
  const legend = isLegend(g);
  return (
    <div className={`card ${legend ? "gilded" : ""}`}>
      <div className="glad-card">
        <Portrait look={g.look} legend={legend || g.legend} />
        <div style={{ minWidth: 0 }}>
          <div className="row between wrap">
            <h3 style={{ fontSize: 15 }}>{g.name}</h3>
            <div className="row" style={{ gap: 4 }}>
              {legend && <span className="tag">Lenda</span>}
              {g.injuredWeeks > 0 && <span className="tag red">Lesionado {g.injuredWeeks} sem.</span>}
              {!owned && s.rivalInterest[g.id] && <span className="tag red">Rival interessado</span>}
            </div>
          </div>
          <div className="small muted">
            {g.age} anos · {g.origin} · {SPECIALTY_LABEL[g.specialty]} · {PERSONALITY_LABEL[g.personality]}
          </div>
          <div className="row wrap small" style={{ gap: 12, marginTop: 4 }}>
            <span>
              Fama <b className="gold">{Math.round(g.fame)}</b>
            </span>
            <span>Simpatia {Math.round(g.popularity)}</span>
            <span>Nível {skill(g)}</span>
            <span>
              {g.wins}V {g.losses}D
            </span>
          </div>
        </div>
      </div>
      <div className="col" style={{ marginTop: 10, gap: 4 }}>
        <Attr label="Força" v={g.strength} />
        <Attr label="Técnica" v={g.technique} />
        <Attr label="Carisma" v={g.charisma} />
        <Attr label="Resistência" v={g.stamina} />
        {owned && (
          <>
            <div className="attr">
              <span className="muted">Condição</span>
              <Bar value={g.condition} tone={g.condition < 40 ? "red" : "green"} />
              <span className="num">{Math.round(g.condition)}</span>
            </div>
            <div className="attr">
              <span className="muted">Moral</span>
              <Bar value={g.morale} tone={g.morale < 35 ? "red" : "blue"} />
              <span className="num">{Math.round(g.morale)}</span>
            </div>
          </>
        )}
      </div>
      <div className="row between wrap small" style={{ marginTop: 8 }}>
        <span>
          Salário {money(g.salary)}/sem{" "}
          {owned && g.salary < fair * 0.75 && <span className="neg">(justo: {money(fair)})</span>}
        </span>
        <span className="muted">Valor de mercado {money(marketValue(g))}</span>
      </div>
      {owned ? (
        <>
          <div className="small muted" style={{ margin: "10px 0 4px" }}>
            Nas semanas sem evento:
          </div>
          <div className="seg">
            {FOCUS.map((f) => (
              <button key={f.id} className={g.focus === f.id ? "on" : ""} onClick={() => act((x) => setFocus(x, g.id, f.id))}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="row wrap" style={{ marginTop: 10, gap: 6 }}>
            <button className="btn sm" onClick={() => setOpen(!open)}>
              {open ? "Fechar história" : "História e relações"}
            </button>
            {g.salary < fair && (
              <button className="btn sm" onClick={() => act((x) => raiseSalary(x, g.id), `${g.name} renovou com salário de ${money(fair)}.`)}>
                Renovar contrato ({money(fair)}/sem)
              </button>
            )}
            <button className="btn sm ghost" disabled={s.gladiators.length <= 2} onClick={() => confirm(`Dispensar ${g.name}? Ele volta ao mercado.`) && act((x) => release(x, g.id), `${g.name} dispensado.`)}>
              <UserMinus size={14} /> Dispensar
            </button>
          </div>
          {open && (
            <div className="small" style={{ marginTop: 10 }}>
              <p className="muted" style={{ marginBottom: 6 }}>
                {g.bio}
              </p>
              {rels.map((r) => {
                const other = s.gladiators.find((x) => x.id === (r.a === g.id ? r.b : r.a));
                return (
                  <div key={r.a + r.b}>
                    {r.kind === "rivalidade" ? "⚔" : "♥"} {r.kind === "rivalidade" ? "Rival" : "Amigo(a)"} de {other?.name ?? "ex-colega"} — placar {r.a === g.id ? `${r.aWins}×${r.bWins}` : `${r.bWins}×${r.aWins}`}
                  </div>
                );
              })}
              {g.history.slice(0, 6).map((h, i) => (
                <div key={i} className="faint">
                  • {h}
                </div>
              ))}
              {!g.history.length && <div className="faint">Ainda sem grandes feitos no Coliseu.</div>}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="small muted" style={{ marginTop: 8 }}>
            {g.bio}
          </p>
          <button className="btn gold block" style={{ marginTop: 10 }} disabled={s.money < fee} onClick={() => act((x) => hire(x, g.id), `${g.name} contratado!`)}>
            <UserPlus size={15} /> Contratar — luvas {money(fee)}
          </button>
        </>
      )}
    </div>
  );
}

function Market() {
  const { s } = useGame();
  return (
    <div className="stack">
      <div className="banner small">
        <UserPlus size={16} />
        <span>O mercado se renova a cada duas semanas. Olheiros e a árvore de Gladiadores trazem candidatos melhores; personagens únicos aparecem conforme a era e a fama do Coliseu.</span>
      </div>
      {s.market.length === 0 ? (
        <Empty>Nenhum gladiador livre no momento.</Empty>
      ) : (
        <div className="grid g2">
          {s.market.map((g) => (
            <GladCard key={g.id} g={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function Relations() {
  const { s } = useGame();
  const name = (id: string) => s.gladiators.find((g) => g.id === id)?.name ?? s.market.find((g) => g.id === id)?.name ?? s.rival.gladiators.find((g) => g.id === id)?.name ?? "ex-gladiador";
  return (
    <Card title="Rivalidades e amizades" icon={<Swords size={16} />}>
      {!s.relations.length ? (
        <Empty>Relações nascem em duelos apertados — ou podem ser anunciadas pela Direção Dramática na Central Imperial.</Empty>
      ) : (
        <div className="list">
          {s.relations.map((r) => (
            <div key={r.a + r.b} className="item">
              <div className="row between wrap">
                <b>
                  {r.kind === "rivalidade" ? <Swords size={14} /> : <HeartHandshake size={14} />} {name(r.a)} {r.kind === "rivalidade" ? "×" : "&"} {name(r.b)}
                </b>
                <span className={`tag ${r.kind === "rivalidade" ? "red" : "green"}`}>{r.kind === "rivalidade" ? "Rivalidade" : "Amizade"}</span>
              </div>
              <div className="small muted">{r.story}</div>
              <div className="row small" style={{ gap: 12, marginTop: 4 }}>
                <span>
                  Confronto direto: {r.aWins} × {r.bWins}
                </span>
                <span>Intensidade {Math.round(r.intensity)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!s.flags.includes("rivalidades") && !s.nodes.includes("gla-rivalidades") && <p className="tiny faint" style={{ marginTop: 8 }}>Desbloqueie «Rivalidades públicas» para que os duelos entre rivais atraiam +25% de público.</p>}
      <p className="tiny faint" style={{ marginTop: 8 }}>
        Valor total do elenco: {fmt(s.gladiators.reduce((a, g) => a + marketValue(g), 0))} denários.
      </p>
    </Card>
  );
}
