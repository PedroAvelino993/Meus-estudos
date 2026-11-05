// Apps do celular: Banco, Contatos e Mensagens.

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import Portrait from "../components/Portrait";
import { CHARACTERS, character, district } from "../content";
import { readAll, visibleMessages, type TxCategory } from "../core/game";
import { Bar, Money, SENDERS, fmt, useGame } from "../ui";
import { PhoneHeader } from "./Phone";

const CAT_LABEL: Record<TxCategory, string> = {
  acordo: "Acordos",
  bico: "Bicos",
  loja: "Loja",
  aluguel: "Aluguel",
  transporte: "Transporte",
  desafio: "Desafios e bônus",
  investigação: "Investigação",
  inicial: "Saldo inicial",
  gasto: "Gastos em conversas",
};

export function Bank({ back }: { back: () => void }) {
  const { s } = useGame();
  const [tab, setTab] = useState<"extrato" | "stats">("extrato");
  const [cat, setCat] = useState<TxCategory | "todas">("todas");
  const txs = s.transactions.filter((t) => cat === "todas" || t.category === cat);
  const cats = [...new Set(s.transactions.map((t) => t.category))];

  // Saldo no fim de cada dia (reconstruído a partir do extrato)
  const days = Array.from({ length: s.day }, (_, i) => i + 1).slice(-14);
  const balances = days.map((d) => s.money - s.transactions.filter((t) => t.day > d).reduce((a, t) => a + t.amount, 0));
  const maxB = Math.max(1, ...balances.map(Math.abs));
  const minB = Math.min(0, ...balances);
  const W = 320,
    H = 110;
  const pts = balances.map((b, i) => [days.length === 1 ? W / 2 : (i / (days.length - 1)) * (W - 20) + 10, H - 10 - ((b - minB) / (maxB - minB || 1)) * (H - 24)]);
  const byCat = (sign: 1 | -1) => {
    const m = new Map<TxCategory, number>();
    for (const t of s.transactions) if (Math.sign(t.amount) === sign && t.category !== "inicial") m.set(t.category, (m.get(t.category) ?? 0) + Math.abs(t.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const income = byCat(1);
  const spend = byCat(-1);
  const top = Math.max(1, ...income.map((x) => x[1]), ...spend.map((x) => x[1]));

  return (
    <div>
      <PhoneHeader title="Banco Áurea" back={back} />
      <div className="balance-card">
        <div className="tiny muted">Saldo disponível</div>
        <div className="amount">{fmt(s.money)}</div>
        <div className="row between" style={{ marginTop: 14 }}>
          <span className="fake-card-number">•••• •••• •••• 0000</span>
          <span className="tiny muted">{s.player.name.toUpperCase()}</span>
        </div>
        <div className="tiny muted" style={{ marginTop: 6 }}>
          Conta e cartão fictícios do jogo — sem relação com bancos reais.
        </div>
      </div>
      <div className="tabs" style={{ marginTop: 12 }}>
        <button className={`tab ${tab === "extrato" ? "on" : ""}`} onClick={() => setTab("extrato")}>
          Extrato
        </button>
        <button className={`tab ${tab === "stats" ? "on" : ""}`} onClick={() => setTab("stats")}>
          Estatísticas
        </button>
      </div>
      {tab === "extrato" ? (
        <>
          <div className="row wrap" style={{ gap: 5, marginBottom: 8 }}>
            {(["todas", ...cats] as const).map((c) => (
              <button key={c} className={`chip ${cat === c ? "gold" : ""}`} onClick={() => setCat(c)}>
                {c === "todas" ? "Todas" : CAT_LABEL[c]}
              </button>
            ))}
          </div>
          <div className="card tight">
            {txs.slice(0, 80).map((t) => (
              <div key={t.id} className="tx">
                <div className="grow">
                  <div>{t.label}</div>
                  <div className="tiny muted">
                    Dia {t.day} · {CAT_LABEL[t.category]}
                  </div>
                </div>
                <span className={`amt ${t.amount >= 0 ? "green" : "red"}`}>
                  <Money n={t.amount} sign />
                </span>
              </div>
            ))}
            {!txs.length && <div className="empty">Nenhuma movimentação.</div>}
          </div>
        </>
      ) : (
        <div className="col" style={{ gap: 12 }}>
          <div className="card tight">
            <b className="small">Saldo no fim de cada dia</b>
            <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico do saldo">
              <line x1="10" x2={W - 10} y1={H - 10 - ((0 - minB) / (maxB - minB || 1)) * (H - 24)} y2={H - 10 - ((0 - minB) / (maxB - minB || 1)) * (H - 24)} stroke="#364152" strokeDasharray="3 4" />
              {pts.length > 1 && <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />}
              {pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />
              ))}
            </svg>
            <div className="row between tiny muted">
              <span>Dia {days[0]}</span>
              <span>Dia {days[days.length - 1]}</span>
            </div>
          </div>
          <div className="card tight">
            <b className="small">De onde veio o dinheiro</b>
            {income.map(([k, v]) => (
              <div key={k} style={{ marginTop: 8 }}>
                <div className="row between tiny">
                  <span>{CAT_LABEL[k]}</span>
                  <span className="green">{fmt(v)}</span>
                </div>
                <Bar value={v} max={top} tone="green" label={CAT_LABEL[k]} />
              </div>
            ))}
            {!income.length && <p className="tiny muted">Ainda nada.</p>}
          </div>
          <div className="card tight">
            <b className="small">Para onde foi</b>
            {spend.map(([k, v]) => (
              <div key={k} style={{ marginTop: 8 }}>
                <div className="row between tiny">
                  <span>{CAT_LABEL[k]}</span>
                  <span className="red">{fmt(v)}</span>
                </div>
                <Bar value={v} max={top} tone="red" label={CAT_LABEL[k]} />
              </div>
            ))}
            {!spend.length && <p className="tiny muted">Ainda nada.</p>}
          </div>
          <div className="stat-row">
            <div className="stat">
              <span>Ganho total</span>
              <b className="green">{fmt(s.stats.moneyEarned)}</b>
            </div>
            <div className="stat">
              <span>Gasto total</span>
              <b className="red">{fmt(s.stats.moneySpent)}</b>
            </div>
            <div className="stat">
              <span>Melhor acordo</span>
              <b>{fmt(s.stats.bestDeal)}</b>
            </div>
            <div className="stat">
              <span>Acordos</span>
              <b>{s.stats.deals}</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Contacts({ back }: { back: () => void }) {
  const { s, showCharacter } = useGame();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const met = CHARACTERS.filter((c) => s.met.includes(c.id) && (c.name + c.role + (c.nick ?? "")).toLowerCase().includes(q.toLowerCase())).sort((a, b) => (s.relationships[b.id]?.affinity ?? 0) - (s.relationships[a.id]?.affinity ?? 0));
  if (open) {
    const c = character(open);
    const rel = s.relationships[open];
    return (
      <div>
        <PhoneHeader title={c.nick ?? c.name.split(" ")[0]} back={() => setOpen(null)} />
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 80, flexShrink: 0 }}>
            <Portrait look={c.look} bg={district(c.district).color + "66"} mood={rel && rel.affinity > 30 ? "happy" : "neutral"} />
          </div>
          <div>
            <b>{c.name}</b>
            <div className="small muted">
              {c.age} anos · {c.role}
            </div>
            <div className="small muted">{district(c.district).name}</div>
          </div>
        </div>
        {rel && (
          <div className="card tight" style={{ marginTop: 12 }}>
            <div className="row between tiny">
              <span>Afinidade</span>
              <span>{rel.affinity}</span>
            </div>
            <Bar value={Math.max(0, rel.affinity)} tone={rel.affinity < 0 ? "red" : "green"} label="Afinidade" />
            <div className="tiny muted" style={{ marginTop: 6 }}>
              {rel.met} conversa(s) · última no dia {rel.lastDay}
              {rel.liesCaught ? ` · pegou você ${rel.liesCaught}× em contradição` : ""}
            </div>
          </div>
        )}
        <div className="card tight" style={{ marginTop: 10 }}>
          <b className="small">Biografia</b>
          <p className="small muted" style={{ marginTop: 4 }}>
            {c.bio}
          </p>
          <b className="small" style={{ display: "block", marginTop: 8 }}>
            Família
          </b>
          <p className="small muted">{c.family}</p>
          <b className="small" style={{ display: "block", marginTop: 8 }}>
            Situação financeira
          </b>
          <p className="small muted">{c.finances}</p>
        </div>
        {rel?.known.length ? (
          <div className="card tight" style={{ marginTop: 10 }}>
            <b className="small">O que importa para {c.nick ?? c.name.split(" ")[0]}</b>
            <ul className="small green" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {rel.known.map((k) => (
                <li key={k}>{c.needs.find((n) => n.id === k)?.label}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {rel?.notes.length ? (
          <div className="card tight" style={{ marginTop: 10 }}>
            <b className="small">Histórico</b>
            <ul className="tiny muted" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {rel.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <button className="btn primary block" style={{ marginTop: 12 }} onClick={() => showCharacter(c.id)}>
          Ver missões e visitas
        </button>
      </div>
    );
  }
  return (
    <div>
      <PhoneHeader title="Contatos" back={back} />
      <div className="row" style={{ marginBottom: 10 }}>
        <Search size={16} className="muted" />
        <input className="input grow" style={{ height: 38 }} placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar contato" />
      </div>
      <p className="tiny muted" style={{ marginBottom: 8 }}>
        {s.met.length} de {CHARACTERS.length} moradores conhecidos
      </p>
      <div className="list">
        {met.map((c) => {
          const rel = s.relationships[c.id];
          return (
            <button key={c.id} className="list-item" onClick={() => setOpen(c.id)}>
              <div style={{ width: 42, flexShrink: 0 }}>
                <Portrait look={c.look} bg={district(c.district).color + "55"} />
              </div>
              <div className="grow">
                <b className="small">{c.name}</b>
                <div className="tiny muted">
                  {c.role} · {district(c.district).name}
                </div>
                {rel && <Bar value={Math.max(0, rel.affinity)} tone={rel.affinity < 0 ? "red" : "green"} label="Afinidade" />}
              </div>
              {rel?.known.length ? <span className="chip green">{rel.known.length}</span> : null}
            </button>
          );
        })}
        {!met.length && <div className="empty">{q ? "Ninguém com esse nome." : "Converse com as pessoas da cidade para que elas apareçam aqui."}</div>}
      </div>
    </div>
  );
}

function senderOf(id: string) {
  if (SENDERS[id]) return { ...SENDERS[id], look: null };
  const c = character(id);
  return { name: c.name, color: district(c.district).color, initials: c.name[0], look: c.look };
}

export function Messages({ back }: { back: () => void }) {
  const { s, act, showCharacter } = useGame();
  const [open, setOpen] = useState<string | null>(null);
  const msgs = visibleMessages(s);
  const threads = [...new Set(msgs.map((m) => m.from))].map((from) => ({ from, list: msgs.filter((m) => m.from === from) }));
  useEffect(() => {
    if (open && msgs.some((m) => m.from === open && !m.read)) act((g) => readAll(g, open));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  if (open) {
    const who = senderOf(open);
    const list = msgs.filter((m) => m.from === open).slice().reverse();
    return (
      <div>
        <PhoneHeader title={who.name} back={() => setOpen(null)} />
        <div className="col">
          {list.map((m) => (
            <div key={m.id} className="bubble npc" style={{ maxWidth: "100%" }}>
              <span className="tag">
                Dia {m.day}
                {m.kind === "invite" ? " · convite" : m.kind === "alert" ? " · alerta" : m.kind === "news" ? " · notícia" : ""}
              </span>
              {m.text}
            </div>
          ))}
        </div>
        {!SENDERS[open] && (
          <button className="btn block" style={{ marginTop: 12 }} onClick={() => showCharacter(open)}>
            Ver contato
          </button>
        )}
      </div>
    );
  }
  return (
    <div>
      <PhoneHeader title="Mensagens" back={back} />
      {s.messages.some((m) => !m.read && (!m.deliverOn || m.deliverOn <= s.day)) && (
        <button className="btn sm ghost" style={{ marginBottom: 6 }} onClick={() => act((g) => readAll(g))}>
          Marcar todas como lidas
        </button>
      )}
      {threads.map(({ from, list }) => {
        const who = senderOf(from);
        const last = list[0];
        const un = list.filter((m) => !m.read).length;
        return (
          <button key={from} className={`msg-thread ${un ? "unread" : ""}`} style={{ width: "100%", background: "none", border: 0, borderBottom: "1px solid var(--line)", textAlign: "left" }} onClick={() => setOpen(from)}>
            {who.look ? (
              <div style={{ width: 40, flexShrink: 0 }}>
                <Portrait look={who.look} bg={who.color + "55"} />
              </div>
            ) : (
              <div className="sys-avatar" style={{ background: who.color }}>
                {who.initials}
              </div>
            )}
            <div className="grow">
              <div className="row between">
                <b className="small">{who.name}</b>
                <span className="tiny muted">Dia {last.day}</span>
              </div>
              <div className="msg-text" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {last.text}
              </div>
            </div>
            {un ? <span className="unread-dot" /> : null}
          </button>
        );
      })}
      {!threads.length && <div className="empty">Nenhuma mensagem.</div>}
    </div>
  );
}
