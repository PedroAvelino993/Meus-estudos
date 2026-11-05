// Tela de conversa: retrato com expressões, sinais corporais, falas, interrupções,
// negociação de preço, contraproposta e resultado.

import { useEffect, useRef, useState } from "react";
import { BookOpen, Check, DoorOpen, Eye, Gauge, HandCoins, Lightbulb, MessageCircleQuestion, NotebookPen, SendHorizontal, Sparkles, TriangleAlert, X } from "lucide-react";
import Portrait from "../components/Portrait";
import { character, district } from "../content";
import { persuasionScore, resultOf, type LogEntry } from "../core/encounter";
import { understand } from "../core/understand";
import { anyMission, finishEncounter, leaveEncounter, playerCtx, talk } from "../core/game";
import { moodFace, tellsOf } from "../core/persona";
import { ATTRS, ATTR_LABEL, OUTCOME_LABEL, TACTIC_LABEL, type Attr, type Attrs } from "../core/types";
import { Bar, Money, fmt, sfx, useGame } from "../ui";

const band = (v: number) => (v < 25 ? "baixa" : v < 50 ? "média" : v < 75 ? "alta" : "muito alta");

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

  const visibleLog = e.log.slice(0, shown);
  const lastNpc = [...visibleLog].reverse().find((l) => l.who === "npc");
  const face = e.status === "done" && !busy ? (e.outcome === "great" || e.outcome === "good" || e.outcome === "partial" ? "happy" : e.outcome === "walkout" ? "angry" : "sad") : moodFace(e.attrs, lastNpc?.reaction ?? e.lastReaction);
  const score = persuasionScore(e.attrs);

  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const preview = draft.trim().length > 3 && !e.pending && !e.counter ? understand(draft, e, m, c, ctx) : null;
  useEffect(() => {
    if (!busy && e.status === "active" && window.innerWidth >= 900) inputRef.current?.focus();
  }, [busy, e.status]);

  const send = () => {
    const text = draft.trim();
    if (busy || !text || e.status !== "active") return;
    sfx("tap", prefs.sound);
    const before = s.encounter!;
    let after = before;
    act((g) => {
      const r = talk(g, text);
      after = r.state.encounter ?? before;
      return r.state;
    });
    setDraft("");
    setHint(false);
    if (after.liesCaught > before.liesCaught) {
      sfx("bad", prefs.sound);
      toast({ text: `${c.name.split(" ")[0]} percebeu uma contradição.`, tone: "red", icon: TriangleAlert });
    } else if (after.known.length > before.known.length) {
      sfx("good", prefs.sound);
      toast({ text: "Nova necessidade descoberta!", tone: "green", icon: Sparkles });
    }
  };


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

        {!busy && e.status === "active" && (
          <div className="composer">
            {e.pending && (
              <div className="row small composer-note">
                <MessageCircleQuestion size={15} className="blue" />
                <span>{e.pending.kind === "probe" ? "Pergunta inesperada: responda do seu jeito." : "Interrupção: o que você faz?"}</span>
              </div>
            )}
            {e.counter && <CounterInfo />}
            {hint && <Hints />}
            {preview && (
              <div className="row wrap composer-note tiny">
                <span className="muted">Soa como:</span>
                <span className="chip">{preview.tactic === "close" ? (m.negotiation ? "Falar de valor" : "Fazer a proposta") : preview.tactic === "leave" ? "Encerrar a conversa" : TACTIC_LABEL[preview.tactic]}</span>
                {preview.matched?.insight && <span className="chip green">usa o que você sabe</span>}
                {preview.matched?.contradicts && <span className="chip red">contradiz: {preview.matched.contradicts}</span>}
                {preview.matched?.cost ? <span className="chip gold">custa {fmt(preview.matched.cost)}</span> : null}
              </div>
            )}
            <div className="composer-row">
              <textarea
                ref={inputRef}
                className="composer-input"
                rows={1}
                value={draft}
                maxLength={400}
                placeholder={e.pending ? "Responda…" : e.counter ? (m.negotiation ? "Ex.: «Te pago 320» ou «Aceito»" : "Aceitar o meio-termo ou continuar convencendo…") : `Escreva para ${c.nick ?? c.name.split(" ")[0]}…`}
                aria-label="Sua mensagem"
                onChange={(ev) => setDraft(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" && !ev.shiftKey) {
                    ev.preventDefault();
                    send();
                  }
                }}
              />
              <button className="send-btn" onClick={send} disabled={!draft.trim()} aria-label="Enviar">
                <SendHorizontal size={19} />
              </button>
            </div>
            <div className="row between composer-tools">
              <button className="btn ghost sm" onClick={() => setHint((h) => !h)}>
                <Lightbulb size={14} /> {hint ? "Esconder dica" : "Dica"}
              </button>
              <button
                className="btn ghost sm"
                onClick={() => {
                  if (confirm(`Encerrar a conversa com ${c.name.split(" ")[0]}? A missão fica para outro dia.`)) act((g) => leaveEncounter(g));
                }}
              >
                <DoorOpen size={14} /> Sair da conversa
              </button>
            </div>
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

function CounterInfo() {
  const { s } = useGame();
  const e = s.encounter!;
  const m = anyMission(s, e.missionId);
  const n = m.negotiation;
  const counter = e.counter!;
  if (!n) {
    return (
      <div className="composer-note small">
        <b>Contraproposta:</b> {counter.text} <span className="muted tiny">(Aceitar conta como acordo, mas rende menos. Recusar custa um pouco de paciência.)</span>
      </div>
    );
  }
  return (
    <div className="composer-note small">
      <div className="row wrap" style={{ gap: 6 }}>
        <HandCoins size={15} className="gold" />
        <b>Negociando o {n.item}</b>
        {counter.price !== undefined && <span className="chip">na mesa: {fmt(counter.price)}</span>}
        <span className="chip gold">limite do cliente: {fmt(n.clientLimit)}</span>
        <span className="chip">mercado ≈ {fmt(n.fair)}</span>
      </div>
      <p className="tiny muted" style={{ marginTop: 4 }}>
        Diga um valor para fazer a sua oferta, «aceito» para ficar com o valor na mesa, ou continue conversando. Quanto melhor o clima, mais a pessoa cede; ofertas absurdas ofendem.
      </p>
    </div>
  );
}

function Hints() {
  const { s } = useGame();
  const e = s.encounter!;
  const m = anyMission(s, e.missionId);
  const c = character(m.npc);
  const first = c.nick ?? c.name.split(" ")[0];
  const tips: string[] = [];
  for (const k of e.known) {
    const n = c.needs.find((x) => x.id === k);
    if (n) tips.push(`Você sabe que ${n.label.charAt(0).toLowerCase()}${n.label.slice(1)} Fale disso.`);
  }
  if (e.known.length < c.needs.length) tips.push(`Ainda há algo que pesa para ${first} e você não sabe. Pergunte o que a preocupa ou o que mais importa.`);
  if (e.attrs.patience < 30) tips.push(`${first} está perdendo a paciência: seja direto ou faça logo a proposta.`);
  if (e.attrs.suspicion > 55) tips.push("Há desconfiança no ar: dados concretos ou franqueza funcionam melhor que promessas.");
  if (e.lastReaction === "offended" || e.lastReaction === "impatient") tips.push("A última fala caiu mal. Mudar de assunto ou reconhecer o erro pode salvar o clima.");
  if (c.interests.length && e.turn >= 1) tips.push(`Assunto que aproxima: ${c.interests.map((i) => i.topic).join(", ")}.`);
  const last = e.tactics.slice(-2);
  if (last.length === 2 && last[0] === last[1]) tips.push("Você está repetindo a mesma abordagem: ela rende cada vez menos.");
  if (e.turn >= 3) tips.push(m.negotiation ? "Quando quiser falar de dinheiro, diga um valor (ex.: «te pago 300»)." : "Quando sentir que é a hora, faça a proposta (ex.: «Então, fechamos?»).");
  tips.push(`Gosta de: ${c.likes.join(", ")}. Não gosta de: ${c.dislikes.join(", ")}.`);
  return (
    <div className="composer-note hints">
      {tips.slice(0, 4).map((t) => (
        <p key={t} className="tiny">
          <Lightbulb size={12} className="gold" /> {t}
        </p>
      ))}
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
