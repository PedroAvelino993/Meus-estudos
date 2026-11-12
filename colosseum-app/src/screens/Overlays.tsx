// Janelas que interrompem o jogo: crises, resumo da semana, nova era, vitória/derrota e tutorial.

import { AlertTriangle, BookOpen, Crown, Skull, Sparkles, X } from "lucide-react";
import type { EventReport } from "../core/types";
import { weekRng } from "../core/state";
import { choiceIssue, crisisById, resolveCrisis } from "../core/crises";
import { continueInfinite } from "../core/turn";
import { tutorialStep, victoryGoals } from "../core/progression";
import { ERAS, modality, region } from "../content/world";
import { useGame } from "../ui/game";
import { Bar, Delta, Modal, fmt, money } from "../ui/kit";

export function CrisisModal() {
  const { s, act } = useGame();
  const id = s.pendingCrises[0];
  const c = crisisById(id);
  const effectText = (e: Record<string, number>) =>
    Object.entries(e)
      .map(([k, v]) => {
        const name: Record<string, string> = { money: "dinheiro", popularity: "popularidade", fame: "fama", prestige: "prestígio", favor: "favor imperial", staffMorale: "moral dos funcionários", condition: "condição dos gladiadores", satisfaction: "satisfação (3 semanas)", ep: "pontos de evolução", rivalPop: "público do rival", credibility: "credibilidade do Arena Bets", authenticity: "autenticidade" };
        return `${v > 0 ? "+" : ""}${fmt(v)} ${name[k] ?? k}`;
      })
      .join(" · ");
  return (
    <Modal
      title={
        <span className="row">
          <AlertTriangle size={20} color="#c8392c" />
          {c.title}
        </span>
      }
      closable={false}
    >
      <p style={{ marginBottom: 16 }}>{c.text}</p>
      <div className="list">
        {c.choices.map((ch, i) => {
          const issue = choiceIssue(s, ch);
          return (
            <button key={i} className="item selectable" style={{ textAlign: "left" }} disabled={!!issue} onClick={() => act((x) => resolveCrisis(x, id, i, weekRng(x, `crise:${id}`)), "Decisão tomada.")}>
              <div className="row between">
                <b>{ch.label}</b>
                {ch.cost ? <span className="tag red">−{money(ch.cost)}</span> : null}
              </div>
              <div className="small muted" style={{ margin: "4px 0" }}>
                {ch.detail}
              </div>
              <div className="tiny faint">{effectText(ch.effect as Record<string, number>)}</div>
              {issue && <div className="tiny neg">{issue}</div>}
            </button>
          );
        })}
      </div>
      {(s.staff.segurancas ?? 0) > 0 && <p className="tiny faint" style={{ marginTop: 10 }}>Seus guardas reduzem perdas de popularidade e satisfação nas crises.</p>}
    </Modal>
  );
}

export function ReportView({ r }: { r: EventReport }) {
  const { s } = useGame();
  const name = (id: string | null) => (id ? s.gladiators.find((g) => g.id === id)?.name ?? s.rival.gladiators.find((g) => g.id === id)?.name ?? "Ex-gladiador" : "—");
  const totalRev = r.revenue.tickets + r.revenue.food + r.revenue.commerce + r.revenue.sponsor;
  const totalCost = r.costs.production + r.costs.decoration + r.costs.marketing + r.costs.extras + r.costs.medical;
  return (
    <div className="card marble">
      <div className="row between wrap" style={{ marginBottom: 8 }}>
        <div>
          <h3 style={{ textTransform: "uppercase" }}>{r.name}</h3>
          <div className="small muted">
            {modality(r.modality).name} · {region(r.venue).name} · semana {r.week}
          </div>
        </div>
        <div className="row">
          {r.mode === "roteirizado" ? <span className="tag purple">ROTEIRIZADO</span> : <span className="tag green">Competição livre</span>}
          {r.record && <span className="tag">Recorde!</span>}
        </div>
      </div>
      <div className="grid g4" style={{ gap: 8 }}>
        <Mini label="Público" value={`${fmt(r.attendance)} / ${fmt(r.capacity)}`} />
        <Mini label="Satisfação" value={`${r.satisfaction}%`} />
        <Mini label="Lucro" value={money(r.profit)} tone={r.profit >= 0 ? "pos" : "neg"} />
        <Mini label="Vencedor" value={name(r.winner)} />
      </div>
      <div className="grid g2" style={{ marginTop: 10, gap: 10 }}>
        <div className="small">
          <b>Receitas ({money(totalRev)})</b>
          <div>Ingressos: {money(r.revenue.tickets)}</div>
          <div>Comida e bebida: {money(r.revenue.food)}</div>
          <div>Comércio: {money(r.revenue.commerce)}</div>
          {r.revenue.sponsor > 0 && <div>Patrocínio: {money(r.revenue.sponsor)}</div>}
        </div>
        <div className="small">
          <b>Custos ({money(totalCost)})</b>
          <div>Produção e operação: {money(r.costs.production)}</div>
          <div>Decoração: {money(r.costs.decoration)}</div>
          <div>Divulgação: {money(r.costs.marketing)}</div>
          {r.costs.extras > 0 && <div>Atrações extras: {money(r.costs.extras)}</div>}
          {r.costs.medical > 0 && <div>Médicos: {money(r.costs.medical)}</div>}
        </div>
      </div>
      <div className="row wrap small" style={{ marginTop: 10, gap: 14 }}>
        <span>
          Popularidade <Delta v={r.popularity} />
        </span>
        <span>
          Fama <Delta v={r.fame} />
        </span>
        <span>
          Prestígio <Delta v={r.prestige} />
        </span>
        <span>
          Evolução <Delta v={r.ep} suffix=" PE" />
        </span>
      </div>
      {r.bouts.length > 0 && (
        <div className="small" style={{ marginTop: 10 }}>
          <b>Combates</b>
          {r.bouts.map((b, i) => (
            <div key={i}>
              {name(b.a)} × {name(b.b)} → <b>{name(b.winner)}</b> <span className="muted">({b.note})</span>
            </div>
          ))}
        </div>
      )}
      {(r.highlights.length > 0 || r.injuries.length > 0) && (
        <div className="small" style={{ marginTop: 10 }}>
          <b>Destaques</b>
          {r.highlights.map((h, i) => (
            <div key={i}>• {h}</div>
          ))}
          {r.injuries.length > 0 && <div>• No departamento médico: {r.injuries.join(", ")} (alguns dias de descanso).</div>}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.5)", borderRadius: 10, padding: "8px 10px", border: "1px solid #cbbd9f" }}>
      <div className="tiny" style={{ color: "#6d604c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--serif)", fontWeight: 700, color: tone === "neg" ? "#a3241c" : tone === "pos" ? "#2f6b2b" : "#3a2a14" }}>{value}</div>
    </div>
  );
}

export function SummaryModal({ onClose }: { onClose: () => void }) {
  const { s } = useGame();
  const w = s.lastSummary!;
  const profit = w.reports.reduce((a, r) => a + r.profit, 0);
  return (
    <Modal title={`Semana ${w.week} — relatório`} onClose={onClose} wide>
      <div className="grid g3" style={{ marginBottom: 14 }}>
        <div className="stat">
          <div className="label">Eventos</div>
          <div className={`value ${profit >= 0 ? "" : "neg"}`}>{money(profit)}</div>
          <div className="sub">{w.reports.length} espetáculo(s)</div>
        </div>
        <div className="stat">
          <div className="label">Receitas fixas</div>
          <div className="value">{money(w.income)}</div>
        </div>
        <div className="stat">
          <div className="label">Despesas fixas</div>
          <div className="value neg">−{money(w.expenses)}</div>
        </div>
      </div>
      {w.reports.length === 0 && <div className="banner small" style={{ marginBottom: 12 }}>Nenhum evento nesta semana: o público esfria e os salários continuam sendo pagos.</div>}
      <div className="stack">
        {w.reports.map((r) => (
          <ReportView key={r.id} r={r} />
        ))}
      </div>
      {w.markets.length > 0 && (
        <div className="item small" style={{ marginTop: 12 }}>
          <b>Arena Bets (fichas fictícias)</b>
          {w.markets.map((m, i) => (
            <div key={i}>• {m}</div>
          ))}
        </div>
      )}
      {w.news.length > 0 && (
        <div className="item small" style={{ marginTop: 12 }}>
          <b>Notícias</b>
          {w.news.map((n, i) => (
            <div key={i}>• {n}</div>
          ))}
        </div>
      )}
      <details className="small" style={{ marginTop: 12 }}>
        <summary className="muted">Despesas e receitas fixas detalhadas</summary>
        {w.breakdown.map((b, i) => (
          <div key={i} className="row between">
            <span>{b.label}</span>
            <span className={b.amount < 0 ? "neg" : "pos"}>{money(b.amount)}</span>
          </div>
        ))}
      </details>
      <button className="btn gold block" style={{ marginTop: 16 }} onClick={onClose}>
        Continuar
      </button>
    </Modal>
  );
}

export function EraModal({ onClose }: { onClose: () => void }) {
  const { s } = useGame();
  const e = ERAS[s.era - 1];
  return (
    <Modal title={`Era ${e.n}: ${e.name}`} onClose={onClose}>
      <div className="center" style={{ marginBottom: 12 }}>
        <Sparkles size={34} color="#d2ab5f" />
        <p className="muted" style={{ fontStyle: "italic" }}>
          {e.subtitle}
        </p>
      </div>
      <p style={{ marginBottom: 12 }}>{e.intro}</p>
      <div className="banner small">
        <BookOpen size={16} />
        <span>Objetivo: {e.goal}</span>
      </div>
      <button className="btn gold block" style={{ marginTop: 16 }} onClick={onClose}>
        Que comecem os jogos
      </button>
    </Modal>
  );
}

export function EndModal() {
  const { s, act, exit } = useGame();
  if (s.defeat)
    return (
      <Modal
        title={
          <span className="row">
            <Skull size={22} /> Derrota
          </span>
        }
        closable={false}
      >
        <p style={{ marginBottom: 12 }}>{s.defeat.reason}</p>
        <p className="small muted">
          Semana {s.defeat.week} · {fmt(s.stats.spectators)} espectadores ao longo da história · {s.stats.events} espetáculos.
        </p>
        <button className="btn gold block" style={{ marginTop: 16 }} onClick={exit}>
          Voltar ao início
        </button>
      </Modal>
    );
  return (
    <Modal
      title={
        <span className="row">
          <Crown size={22} /> Vitória — o Legado Eterno
        </span>
      }
      closable={false}
    >
      <p style={{ marginBottom: 12 }}>O seu nome entrou para a história como o maior organizador de espetáculos do mundo antigo. Os cronistas vão escrever sobre o {s.name} por séculos.</p>
      <div className="list small">
        {victoryGoals(s).map((g) => (
          <div key={g.id} className="row between">
            <span>{g.label}</span>
            <span className="pos">✓</span>
          </div>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>
        Vitória na semana {s.victory!.week}. Você pode continuar jogando no modo infinito.
      </p>
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn gold" style={{ flex: 1 }} onClick={() => act((x) => continueInfinite(x))}>
          Continuar no modo infinito
        </button>
        <button className="btn" onClick={exit}>
          Início
        </button>
      </div>
    </Modal>
  );
}

export function TutorialCard() {
  const { s, act } = useGame();
  const t = tutorialStep(s);
  if (!t) return null;
  const done = s.tutorialDone.length;
  return (
    <div className="banner" style={{ marginBottom: 16 }}>
      <BookOpen size={18} />
      <div style={{ flex: 1 }}>
        <div className="row between">
          <b className="gold">
            Tutorial {done + 1}/6 — {t.title}
          </b>
          <button className="btn ghost sm" onClick={() => act((x) => ({ ...x, tutorialOff: true }))} aria-label="Fechar tutorial">
            <X size={14} />
          </button>
        </div>
        <div className="small">{t.text}</div>
        <div style={{ marginTop: 6 }}>
          <Bar value={done} max={6} />
        </div>
      </div>
    </div>
  );
}
