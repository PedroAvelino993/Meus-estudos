// Tela de conversa: retrato com expressões, sinais corporais, falas, interrupções,
// negociação de preço, contraproposta e resultado.

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, Eye, Gauge, HandCoins, MessageCircleQuestion, NotebookPen, Sparkles, TriangleAlert, Undo2, X } from "lucide-react";
import Portrait from "../components/Portrait";
import { character, district } from "../content";
import { acceptablePrice, optionsFor, persuasionScore, resultOf, type LogEntry } from "../core/encounter";
import { answer, anyMission, finishEncounter, makeOffer, playerCtx, refuseCounter, say, takeCounter } from "../core/game";
import { moodFace, tellsOf } from "../core/persona";
import { ATTRS, ATTR_LABEL, OUTCOME_LABEL, TACTIC_LABEL, type Attr, type Attrs } from "../core/types";
import { Bar, Money, fmt, sfx, useGame } from "../ui";

const band = (v: number) => (v < 25 ? "baixa" : v < 50 ? "média" : v < 75 ? "alta" : "muito alta");
const RISKY = new Set(["pressure", "bluff", "urgency", "flattery"]);

function Deltas({ d }: { d: Partial<Attrs> }) {
  const items = (Object.entries(d) as [Attr, number][]).filter(([, v]) => Math.abs(v) >= 1);
  if (!items.length) return null;
  return (
    <div className="deltas">
      {items.map(([k, v]) => {
        const good = k === "suspicion" ? v < 0 : v > 0;
        return (
          <span key={k} className={`delta ${good ? "up" : "down"}`}>
            {ATTR_LABEL[k]} {v > 0 ? "+" : ""}
            {Math.round(v)}
          </span>
        );
      })}
    </div>
  );
}

export default function Encounter() {
  const { s, act, prefs, toast } = useGame();
  const e = s.encounter!;
  const m = anyMission(s, e.missionId);
  const c = character(m.npc);
  const d = district(c.district);
  const ctx = playerCtx(s, c.id);
  const exact = s.perks.includes("leitura-fria");
  const approx = exact || s.perks.includes("olho-clinico");
  const notebook = s.items.includes("caderno") || s.perks.includes("memoria");

  // Revela as falas aos poucos, como numa conversa de verdade
  const [shown, setShown] = useState(() => Math.max(0, e.log.length - 3));
  const instant = prefs.reducedMotion || prefs.textSpeed === "rapido";
  const chatRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // No celular, mantém a conversa e as opções à vista depois de cada escolha
  useEffect(() => {
    if (window.innerWidth < 900 && e.turn > 0) sectionRef.current?.scrollIntoView({ block: "start", behavior: instant ? "auto" : "smooth" });
  }, [e.turn, e.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (shown > e.log.length) setShown(e.log.length);
    if (shown >= e.log.length) return;
    const next = e.log[shown];
    const t = setTimeout(() => setShown((x) => x + 1), instant ? 0 : next.who === "me" ? 120 : next.who === "sys" ? 260 : Math.min(1100, 380 + next.text.length * 8));
    return () => clearTimeout(t);
  }, [shown, e.log, instant]);
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [shown, e.pending, e.counter, e.status]);
  const typing = shown < e.log.length && e.log[shown].who === "npc";
  const busy = shown < e.log.length;

  const opts = optionsFor(e, m, c, ctx);
  const visibleLog = e.log.slice(0, shown);
  const lastNpc = [...visibleLog].reverse().find((l) => l.who === "npc");
  const face = e.status === "done" && !busy ? (e.outcome === "great" || e.outcome === "good" || e.outcome === "partial" ? "happy" : e.outcome === "walkout" ? "angry" : "sad") : moodFace(e.attrs, lastNpc?.reaction ?? e.lastReaction);
  const score = persuasionScore(e.attrs);

  const choose = (id: string) => {
    if (busy) return;
    sfx("tap", prefs.sound);
    const before = s.encounter!;
    const after = act((g) => say(g, id)).encounter;
    if (after && after.liesCaught > before.liesCaught) {
      sfx("bad", prefs.sound);
      toast({ text: `${c.name.split(" ")[0]} percebeu uma contradição.`, tone: "red", icon: TriangleAlert });
    } else if (after && after.known.length > before.known.length) {
      sfx("good", prefs.sound);
      toast({ text: "Nova necessidade descoberta!", tone: "green", icon: Sparkles });
    }
  };

  // Atalhos de teclado: 1–9 escolhem a opção
  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      if (busy || ev.target instanceof HTMLInputElement) return;
      const n = Number(ev.key);
      if (!n) return;
      if (e.pending) {
        const o = e.pending.options[n - 1];
        if (o) act((g) => answer(g, n - 1));
      } else if (!e.counter && opts[n - 1]) choose(opts[n - 1].id);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const extras = (
    <>
        <div className="card tight">
          <div className="row small" style={{ marginBottom: 6 }}>
            <BookOpen size={15} className="gold" /> <b>Objetivo</b>
          </div>
          <p className="small muted">{m.objective}</p>
        </div>

        {approx ? (
          <div className="card tight">
            <div className="row small" style={{ marginBottom: 8 }}>
              <Eye size={15} className="gold" /> <b>{exact ? "Leitura fria" : "Olho clínico"}</b>
            </div>
            <div className="meters">
              {ATTRS.map((k) => (
                <div key={k} className="meter">
                  <span>{ATTR_LABEL[k]}</span>
                  <Bar value={e.attrs[k]} tone={k === "suspicion" ? "red" : k === "patience" ? "blue" : k === "affinity" || k === "trust" ? "green" : undefined} fuzzy={!exact} label={ATTR_LABEL[k]} />
                  <span>{exact ? e.attrs[k] : band(e.attrs[k])}</span>
                </div>
              ))}
            </div>
            {exact && (
              <div className="score-dial small" style={{ marginTop: 10 }}>
                <Gauge size={15} className="gold" /> Convencimento <b>{score}</b>
                <span className="muted tiny">(precisa de {m.threshold - (s.perks.includes("fechador") ? 6 : 0)})</span>
              </div>
            )}
          </div>
        ) : (
          <div className="card tight">
            <p className="tiny muted">Leia a linguagem corporal para saber como a conversa vai. A habilidade «Olho clínico» (Perfil) mostra os atributos.</p>
          </div>
        )}

        {e.known.length > 0 && (
          <div className="card tight">
            <div className="row small" style={{ marginBottom: 6 }}>
              <Sparkles size={15} className="green" /> <b>O que você sabe</b>
            </div>
            <ul className="tiny" style={{ margin: 0, paddingLeft: 16 }}>
              {e.known.map((k) => {
                const n = c.needs.find((x) => x.id === k);
                return n ? (
                  <li key={k} className="green" style={{ marginBottom: 3 }}>
                    {n.label}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        )}

        {notebook && Object.keys(e.claims).length > 0 && (
          <div className="card tight">
            <div className="row small" style={{ marginBottom: 6 }}>
              <NotebookPen size={15} className="gold" /> <b>Caderno: o que você afirmou</b>
            </div>
            <ul className="tiny muted" style={{ margin: 0, paddingLeft: 16 }}>
              {Object.values(e.claims).map((cl) => (
                <li key={cl.label}>
                  {cl.label} {cl.caught && <span className="red">(descoberto)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
    </>
  );

  return (
    <div className="encounter">
      <aside className="enc-side">
        <div className="card">
          <div className="enc-person">
            <div className="enc-portrait">
              <Portrait look={c.look} mood={face} bg={d.color + "77"} title={c.name} />
            </div>
            <div className="grow">
              <div className="eyebrow" style={{ color: d.color }}>
                {m.title}
              </div>
              <h2 style={{ fontSize: "1.2rem", marginTop: 2 }}>{c.name}</h2>
              <div className="small muted">{c.role}</div>
              <div className="tells" style={{ marginTop: 8, justifyContent: "inherit" }}>
                {tellsOf(e.attrs).map((t) => (
                  <span key={t} className="tell">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col desk-only" style={{ gap: 12 }}>
          {extras}
        </div>
      </aside>

      <section className="card" ref={sectionRef} style={{ padding: 0, overflow: "hidden", scrollMarginTop: 64 }}>
        <div className="chat" ref={chatRef} aria-live="polite">
          {visibleLog.map((l: LogEntry, i) => (
            <div key={i} className={`bubble ${l.who} ${l.kind ?? ""}`}>
              {l.who === "me" && l.tactic && <span className="tag">{TACTIC_LABEL[l.tactic]}</span>}
              {l.who === "npc" && i > 0 && <span className="tag">{c.nick ?? c.name.split(" ")[0]}</span>}
              {l.text}
              {exact && l.delta && l.who === "npc" && <Deltas d={l.delta} />}
            </div>
          ))}
          {typing && (
            <div className="typing" aria-label="digitando">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>

        {!busy && e.status === "active" && e.pending && (
          <div className="options side-event">
            <div className="row small">
              <MessageCircleQuestion size={16} className="blue" />
              <b>{e.pending.kind === "probe" ? "Pergunta inesperada" : "Interrupção"}</b>
            </div>
            {e.pending.options.map((o, i) => (
              <button key={i} className={`option ${o.kind === "bluff" ? "risky" : ""}`} onClick={() => act((g) => answer(g, i))}>
                <span className="kbd">{i + 1}</span>
                <span className="opt-text">{o.text}</span>
                {o.kind === "bluff" && <span className="chip red">Blefe</span>}
              </button>
            ))}
          </div>
        )}

        {!busy && e.status === "active" && e.counter && <CounterBox />}

        {!busy && e.status === "active" && !e.pending && !e.counter && (
          <div className="options">
            {opts.map((o, i) => (
              <button
                key={o.id}
                className={`option ${o.insight ? "insight" : ""} ${o.bluff || o.contradicts || (RISKY.has(o.tactic) && !o.universal) ? "risky" : ""} ${o.universal ? "universal" : ""} ${o.tactic === "leave" ? "leave" : ""} ${o.tactic === "close" ? "close" : ""}`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => choose(o.id)}
              >
                <span className="kbd">{i + 1}</span>
                <span className="opt-text">{o.text}</span>
                <span className="opt-tags">
                  {o.insight && <span className="chip green">Você sabe disso</span>}
                  {o.bluff && <span className="chip red">Blefe</span>}
                  {o.contradicts && (
                    <span className="chip red" title={`Antes você disse: ${o.contradicts}`}>
                      Contradiz
                    </span>
                  )}
                  {o.cost ? <span className="chip gold">{fmt(o.cost)}</span> : null}
                  {o.tactic !== "leave" && o.tactic !== "close" && !(o.bluff && o.tactic === "bluff") && <span className="chip">{TACTIC_LABEL[o.tactic]}</span>}
                </span>
              </button>
            ))}
          </div>
        )}

        {!busy && e.status === "done" && <ResultBox />}
      </section>
      <details className="card tight mob-only enc-more">
        <summary className="small">
          <b>Objetivo, o que você sabe e anotações</b>
        </summary>
        <div className="col" style={{ gap: 10, marginTop: 10 }}>
          {extras}
        </div>
      </details>
    </div>
  );
}

function CounterBox() {
  const { s, act, prefs } = useGame();
  const e = s.encounter!;
  const m = anyMission(s, e.missionId);
  const n = m.negotiation;
  const counter = e.counter!;
  const [price, setPrice] = useState(() => (n ? (n.npcSells ? Math.min(n.clientLimit, Math.round((n.fair * 0.8) / 5) * 5) : Math.max(n.clientLimit, Math.round((n.fair * 1.15) / 5) * 5)) : 0));
  if (!n) {
    return (
      <div className="options">
        <p className="small">
          <b>Contraproposta:</b> {counter.text}
        </p>
        <div className="row wrap">
          <button className="btn green" onClick={() => act((g) => takeCounter(g))}>
            <Check size={16} /> Aceitar o meio-termo
          </button>
          <button className="btn" onClick={() => act((g) => refuseCounter(g))}>
            <Undo2 size={16} /> Recusar e continuar conversando
          </button>
        </div>
        <p className="tiny muted">O meio-termo conta como acordo, mas rende menos. Recusar custa um pouco de paciência.</p>
      </div>
    );
  }
  const lo = Math.round((n.fair * 0.4) / 5) * 5;
  const hi = Math.round((Math.max(n.anchor, n.clientLimit, n.fair) * 1.5) / 5) * 5;
  const overLimit = n.npcSells ? price > n.clientLimit : price < n.clientLimit;
  const isCounter = counter.text === "Contraproposta";
  const counterOk = counter.price !== undefined && !(n.npcSells ? counter.price > n.clientLimit : counter.price < n.clientLimit);
  void acceptablePrice;
  return (
    <div className="options offer-box">
      <div className="row between small">
        <span>
          <HandCoins size={15} className="gold" /> <b>{n.npcSells ? "Quanto você oferece" : "Quanto você pede"}</b> pelo {n.item}?
        </span>
        <span className="muted">
          Limite do cliente: <b className="gold">{fmt(n.clientLimit)}</b>
        </span>
      </div>
      <div className="offer-value">{fmt(price)}</div>
      <input type="range" min={lo} max={hi} step={5} value={price} onChange={(ev) => setPrice(Number(ev.target.value))} aria-label="Valor da oferta" />
      <div className="offer-scale">
        <span>{fmt(lo)}</span>
        <span>Preço de mercado ≈ {fmt(n.fair)}</span>
        <span>{fmt(hi)}</span>
      </div>
      {overLimit && <p className="tiny red">Esse valor passa do limite que o seu cliente autorizou.</p>}
      <div className="row wrap">
        <button
          className="btn primary"
          onClick={() => {
            sfx("tap", prefs.sound);
            act((g) => makeOffer(g, price));
          }}
        >
          Oferecer {fmt(price)}
        </button>
        {counter.price !== undefined && counterOk && (isCounter || counter.price === n.anchor) && (
          <button className="btn green" disabled={!counterOk} onClick={() => act((g) => takeCounter(g))} title={counterOk ? "" : "Passa do limite do cliente"}>
            <Check size={16} /> Aceitar {fmt(counter.price)}
          </button>
        )}
        <button className="btn ghost" onClick={() => act((g) => refuseCounter(g))}>
          <Undo2 size={16} /> Voltar a conversar
        </button>
      </div>
      <p className="tiny muted">Quanto melhor o clima da conversa, mais a pessoa cede. Ofertas absurdas ofendem. Aceitar o valor dela fecha um meio-termo.</p>
    </div>
  );
}

function ResultBox() {
  const { s, act, prefs } = useGame();
  const e = s.encounter!;
  const m = anyMission(s, e.missionId);
  const c = character(m.npc);
  const r = resultOf(e, m, c);
  const success = r.outcome === "great" || r.outcome === "good" || r.outcome === "partial";
  useEffect(() => {
    sfx(success ? (r.outcome === "great" ? "level" : "good") : "bad", prefs.sound);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="options result">
      <div>
        <span className={`result-badge ${r.outcome}`}>
          {success ? <Check size={18} /> : <X size={18} />} {OUTCOME_LABEL[r.outcome]}
        </span>
      </div>
      <p className="ending-text">{r.ending}</p>
      <div className="rewards">
        <div className="reward">
          <b>
            <Money n={r.money} sign />
          </b>
          <span>Dinheiro</span>
        </div>
        <div className="reward">
          <b>+{r.xp}</b>
          <span>XP</span>
        </div>
        <div className="reward">
          <b className={r.rep >= 0 ? "green" : "red"}>
            {r.rep >= 0 ? "+" : ""}
            {r.rep}
          </b>
          <span>Reputação</span>
        </div>
        <div className="reward">
          <b className={r.affinity >= 0 ? "green" : "red"}>
            {r.affinity >= 0 ? "+" : ""}
            {r.affinity}
          </b>
          <span>Afinidade</span>
        </div>
      </div>
      {r.price !== undefined && <p className="small muted">Preço fechado: {fmt(r.price)}</p>}
      {e.liesCaught > 0 && <p className="small red">Você foi pego {e.liesCaught === 1 ? "numa contradição" : `em ${e.liesCaught} contradições`}. Isso vai correr pelo bairro.</p>}
      {e.liesTold > 0 && e.liesCaught === 0 && <p className="small gold">Ninguém percebeu seus blefes… desta vez.</p>}
      <button className="btn primary block" style={{ marginTop: 10 }} onClick={() => act((g) => finishEncounter(g))}>
        Continuar
      </button>
    </div>
  );
}
