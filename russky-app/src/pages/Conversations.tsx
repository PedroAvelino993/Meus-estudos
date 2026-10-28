// Conversação com personagens: missões ramificadas, três níveis de ajuda e retorno linguístico.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Eye, Keyboard as KbIcon, Lightbulb, Lock, Mic, MicOff, RotateCcw, Send, Undo2, Volume2, VolumeX, X } from "lucide-react";
import { useStudent, update, getState } from "../store";
import { CHARACTERS, CONVERSATIONS, character, conversation, place, unitRef, wordIdsIn } from "../content";
import { Portrait } from "../components/Portrait";
import { Ru, Stressed, useVoice } from "../components/ru";
import { Keyboard, prefersAppKeyboard } from "../components/Keyboard";
import { Confetti, Ring, Seg } from "../components/ui";
import { Diff } from "../components/exercises";
import { canRecognize, listen, speak, stopSpeaking } from "../audio/speech";
import { sfx } from "../audio/sfx";
import { fillText, linesOf, nodeOf, optionsOf, understand, type Flags, type Line, type Node, type Option, type Understanding } from "../core/convo";
import { finishConvo, recordAnswer, type Transcript } from "../core/state";
import { convoAvailable, metCharacters } from "../core/progress";
import { checkRussian } from "../core/evaluate";
import { shuffle, tokensOf } from "../core/text";
import { navigate } from "../router";
import { reducedMotion } from "../components/ui";

type Level = "facil" | "medio" | "dificil";

const LEVELS: { value: Level; label: string; desc: string }[] = [
  { value: "facil", label: "Fácil", desc: "Escolha entre respostas prontas; tradução sempre visível." },
  { value: "medio", label: "Médio", desc: "Monte a resposta com palavras ou escreva; tradução ao tocar." },
  { value: "dificil", label: "Difícil", desc: "Escreva (ou fale) sozinho; sem tradução." },
];

export function ConversationsPage() {
  const s = useStudent();
  const met = metCharacters(s);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Conversação</h1>
          <p className="muted">Converse com moradores de Svetlorechensk. Eles entendem respostas diferentes da resposta modelo e corrigem com gentileza.</p>
        </div>
      </div>

      <h2 style={{ marginBottom: 12 }}>Missões</h2>
      <div className="grid two">
        {CONVERSATIONS.map((c) => {
          const ch = character(c.character);
          const ok = convoAvailable(s, c.id);
          const rec = s.convos[c.id];
          const req = c.requires.map((u) => unitRef(u)?.unit.title).filter(Boolean);
          return (
            <div key={c.id} className={`card ${ok ? "hover" : ""}`} style={{ opacity: ok ? 1 : 0.7 }}>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <Portrait id={c.character} size={64} mood={ok ? "happy" : "neutral"} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="eyebrow">
                    {ch.name} · {place(c.place)?.name} · {c.level}
                  </div>
                  <h3>{c.title}</h3>
                  <p className="small muted" style={{ margin: "4px 0 8px" }}>
                    {c.goal}
                  </p>
                  {ok ? (
                    <div className="row wrap">
                      <a className="btn primary sm" href={`#/conversa/${c.id}`}>
                        {rec?.completed ? "Conversar de novo" : "Começar"}
                      </a>
                      {rec?.completed ? <span className="chip green">melhor: {Math.round(rec.best * 100)}% entendido</span> : null}
                      {rec?.transcripts.length ? (
                        <button className="btn ghost sm" onClick={() => setOpen(open === c.id ? null : c.id)} aria-expanded={open === c.id}>
                          <ChevronDown size={14} /> Rever
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="chip">
                      <Lock size={12} /> Termine: {req.join(", ")}
                    </span>
                  )}
                </div>
              </div>
              {open === c.id && rec && <TranscriptView t={rec.transcripts[0]} />}
            </div>
          );
        })}
      </div>

      <h2 style={{ margin: "32px 0 12px" }}>Personagens</h2>
      <div className="grid auto">
        {CHARACTERS.map((ch) => {
          const known = met.includes(ch.id) || Object.keys(s.convos).some((id) => conversation(id)?.character === ch.id);
          return (
            <div key={ch.id} className="card stack" style={{ alignItems: "center", textAlign: "center" }}>
              <Portrait id={ch.id} size={96} mood={known ? "happy" : "neutral"} bob={known} />
              <div>
                <h3>
                  <Ru text={ch.ru} />
                </h3>
                <div className="small muted">
                  {ch.name}, {ch.age} anos · {ch.role}
                </div>
              </div>
              {known ? (
                <>
                  <p className="small" style={{ margin: 0 }}>
                    {ch.bio}
                  </p>
                  <p className="xs muted" style={{ margin: 0 }}>
                    <b>Jeito:</b> {ch.personality} <b>Fala:</b> {ch.speech}
                  </p>
                </>
              ) : (
                <p className="small muted" style={{ margin: 0 }}>
                  Você vai conhecer essa pessoa na história.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TranscriptView({ t }: { t: Transcript }) {
  return (
    <div className="chat" style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
      <div className="xs muted">{new Date(t.at).toLocaleString("pt-BR")}</div>
      {t.turns.map((m, i) => (
        <div key={i} className={`msg ${m.who === "me" ? "me" : ""}`}>
          <div className="bubble">
            <div className="ru">
              <Stressed text={m.ru} />
            </div>
            {m.pt && <div className="pt">{m.pt}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Conversa ----------

interface Msg {
  who: "npc" | "me" | "hint";
  ru: string;
  pt?: string;
  mood?: Line["mood"];
  fixed?: boolean;
}

interface Snapshot {
  node: string;
  flags: Flags;
  vars: Record<string, string>;
  msgs: Msg[];
}

interface Coach {
  typed: string;
  u: Understanding | null;
  retryLine?: Line;
}

const cap = (s: string) => s.replace(/(^|\s|-)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase());

export function ConversationPage({ id }: { id: string }) {
  const s = useStudent();
  const c = conversation(id);
  const [level, setLevel] = useState<Level | null>(null);
  if (!c) return <div className="page narrow empty">Conversa não encontrada.</div>;
  if (!convoAvailable(s, id))
    return (
      <div className="lesson">
        <div className="lesson-body">
          <div className="lesson-inner empty">
            <Lock size={40} />
            <h2>Conversa bloqueada</h2>
            <p>Termine as lições indicadas na seção Conversação.</p>
            <a className="btn primary" href="#/conversas">
              Voltar
            </a>
          </div>
        </div>
      </div>
    );
  const ch = character(c.character);
  if (!level) {
    return (
      <div className="lesson">
        <div className="lesson-top">
          <button className="icon-btn" onClick={() => navigate("/conversas")} aria-label="Voltar">
            <ArrowLeft size={22} />
          </button>
        </div>
        <div className="lesson-body">
          <div className="lesson-inner stack lg" style={{ alignItems: "center", textAlign: "center" }}>
            <Portrait id={ch.id} size={128} mood="happy" bob />
            <div>
              <div className="eyebrow">{place(c.place)?.name}</div>
              <h1>{c.title}</h1>
              <p className="muted">
                Com <Ru text={ch.ru} /> ({ch.role.toLowerCase()}). {c.goal}
              </p>
            </div>
            <div className="stack" style={{ width: "100%", maxWidth: 480 }}>
              {LEVELS.map((l) => (
                <button key={l.value} className="option" onClick={() => setLevel(l.value)}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 800 }}>{l.label}</div>
                    <div className="small muted">{l.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return <ChatRun id={id} level={level} />;
}

function ChatRun({ id, level }: { id: string; level: Level }) {
  const c = conversation(id)!;
  const ch = character(c.character);
  const s = getState();
  const player = s.settings.nameRu || "Алекс";
  const voice = useVoice();
  const [autoVoice, setAutoVoice] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [nodeId, setNodeId] = useState(c.start);
  const [flags, setFlags] = useState<Flags>({ ...s.flags });
  const [vars, setVars] = useState<Record<string, string>>({ name: player, player });
  const [typing, setTyping] = useState(false);
  const [awaiting, setAwaiting] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [ended, setEnded] = useState(false);
  const [tab, setTab] = useState<"opcoes" | "montar" | "escrever">(level === "facil" ? "opcoes" : level === "medio" ? "montar" : "escrever");
  const [helped, setHelped] = useState(false);
  const [showPt, setShowPt] = useState<number[]>([]);
  const history = useRef<Snapshot[]>([]);
  const stats = useRef({ turns: 0, understood: 0, corrections: [] as { typed: string; right: string; why?: string }[], xp: 0 });
  const bottom = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "end" });
  }, [msgs, typing, awaiting, coach]);

  const fill = useCallback((t: string, v = vars) => fillText(t.replace("{player}", player), { ...v, player }), [player, vars]);

  // Personagem fala as linhas do nó
  const play = useCallback(
    async (node: Node, f: Flags, v: Record<string, string>) => {
      setAwaiting(false);
      const lines = linesOf(node, f);
      for (const line of lines) {
        if (!mounted.current) return;
        setTyping(true);
        await new Promise((r) => setTimeout(r, reducedMotion() ? 150 : 550 + Math.min(900, line.ru.length * 12)));
        if (!mounted.current) return;
        setTyping(false);
        const ru = fillText(line.ru, { ...v, player });
        const pt = fillText(line.pt, { ...v, player });
        setMsgs((m) => [...m, { who: "npc", ru, pt, mood: line.mood }]);
        if (autoVoice && voice) await speak(ru, { pitch: ch.voice.pitch, rate: ch.voice.rate, female: ch.voice.female });
      }
      if (node.hint) setMsgs((m) => [...m, { who: "hint", ru: "", pt: node.hint }]);
      if (node.end) {
        setEnded(true);
        return;
      }
      if (node.next) {
        const nx = nodeOf(c, node.next);
        setNodeId(nx.id);
        void play(nx, f, v);
        return;
      }
      setAwaiting(true);
    },
    [autoVoice, c, ch, player, voice],
  );

  useEffect(() => {
    void play(nodeOf(c, c.start), flags, vars);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const node = nodeOf(c, nodeId);
  const options = optionsOf(node, flags);
  const visibleOptions = level === "facil" ? options.filter((o) => !o.hiddenInEasy) : options;

  const submit = (text: string, via: "option" | "build" | "type" | "voice", option?: Option) => {
    if (!awaiting || !text.trim()) return;
    history.current.push({ node: nodeId, flags, vars, msgs });
    stats.current.turns++;
    const u = option ? { option, slots: {}, exact: true, corrected: fill(option.ru), note: option.note } : understand(text, options, (t) => fill(t));
    if (!u) {
      sfx.wrong();
      const retry = node.reply!.retry;
      setMsgs((m) => [...m, { who: "me", ru: text }, { who: "npc", ru: fill(retry.ru), pt: fill(retry.pt), mood: retry.mood ?? "thinking" }]);
      setCoach({ typed: text, u: null, retryLine: retry });
      if (autoVoice && voice) void speak(fill(retry.ru), { pitch: ch.voice.pitch, rate: ch.voice.rate, female: ch.voice.female });
      return;
    }
    sfx.correct();
    const newVars = { ...vars };
    const newFlags: Flags = { ...flags, ...(u.option.set ?? {}) };
    for (const [k, v] of Object.entries(u.slots)) {
      newVars[k] = cap(v);
      newFlags[`${k}Set`] = true;
    }
    const corrected = fillText(u.option.ru.replace("{player}", newVars.name ?? player), { ...newVars, player: newVars.name ?? player });
    const firstTry = !helped && u.exact;
    if (u.exact) stats.current.understood++;
    else stats.current.corrections.push({ typed: text, right: corrected, why: u.why });
    // revisão espaçada: palavras usadas na conversa
    const ids = wordIdsIn(corrected).map((w) => `W:${w}`);
    update((st) => {
      const r = recordAnswer(
        st,
        {
          items: ids,
          quality: u.exact ? (helped ? "hinted" : "right") : "hinted",
          mode: via === "option" ? "recognize" : "convo",
          skill: via === "voice" ? "fala" : via === "type" ? "escrita" : via === "build" ? "gramatica" : "vocabulario",
          firstTry,
          typed: via === "type",
        },
        Date.now(),
      );
      stats.current.xp += r.xp;
      return r.state;
    });
    setMsgs((m) => [...m, { who: "me", ru: text, fixed: !u.exact }]);
    setCoach(u.exact && !u.note ? null : { typed: text, u });
    setHelped(false);
    setFlags(newFlags);
    setVars(newVars);
    const nx = nodeOf(c, u.option.next);
    setNodeId(nx.id);
    void play(nx, newFlags, newVars);
  };

  const rewind = () => {
    const snap = history.current.pop();
    if (!snap) return;
    stopSpeaking();
    stats.current.turns = Math.max(0, stats.current.turns - 1);
    setMsgs(snap.msgs);
    setFlags(snap.flags);
    setVars(snap.vars);
    setNodeId(snap.node);
    setCoach(null);
    setEnded(false);
    setTyping(false);
    setAwaiting(true);
  };

  useEffect(() => {
    if (!ended) return;
    const transcript: Transcript = {
      at: Date.now(),
      turns: msgs.filter((m) => m.who !== "hint").map((m) => ({ who: m.who === "me" ? "me" : "npc", ru: m.ru, pt: m.pt })),
    };
    const prefixed: Flags = {};
    for (const [k, v] of Object.entries(flags)) if (!(k in getState().flags) || getState().flags[k] !== v) prefixed[`${c.id}.${k}`] = v;
    update((st) => {
      const r = finishConvo(st, c.id, transcript, stats.current.understood, stats.current.turns, prefixed, Date.now());
      stats.current.xp += r.xp;
      return r.state;
    });
    sfx.complete();
  }, [ended]); // eslint-disable-line react-hooks/exhaustive-deps

  const mood = [...msgs].reverse().find((m) => m.who === "npc")?.mood ?? "neutral";

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="icon-btn" onClick={() => navigate("/conversas")} aria-label="Sair da conversa">
          <X size={22} />
        </button>
        <Portrait id={ch.id} size={44} mood={mood} talking={typing} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>
            <Ru text={ch.ru} />
          </div>
          <div className="xs muted">
            {c.title} · {LEVELS.find((l) => l.value === level)?.label}
          </div>
        </div>
        {voice && (
          <button className="icon-btn" onClick={() => setAutoVoice((v) => !v)} aria-pressed={autoVoice} aria-label={autoVoice ? "Desligar voz automática" : "Ligar voz automática"}>
            {autoVoice ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        )}
        {history.current.length > 0 && !ended && (
          <button className="icon-btn" onClick={rewind} aria-label="Desfazer a última resposta">
            <Undo2 size={20} />
          </button>
        )}
      </div>

      <div className="lesson-body">
        <div className="lesson-inner chat" aria-live="polite">
          {msgs.map((m, i) =>
            m.who === "hint" ? (
              <div key={i} className="hint-card">
                <Lightbulb size={14} /> <Stressed text={m.pt ?? ""} />
              </div>
            ) : (
              <div key={i} className={`msg ${m.who === "me" ? "me" : ""} ${m.fixed ? "fixed" : ""}`}>
                {m.who === "npc" && <Portrait id={ch.id} size={34} mood={m.mood} />}
                <div className="bubble">
                  <div className="ru" lang="ru">
                    <Stressed text={m.ru} />
                  </div>
                  {m.who === "npc" && m.pt && (level === "facil" || showPt.includes(i)) && <div className="pt">{m.pt}</div>}
                  {m.who === "npc" && (
                    <div className="row" style={{ gap: 4, marginTop: 6 }}>
                      {voice && (
                        <button className="btn ghost sm" style={{ padding: "2px 6px" }} onClick={() => speak(m.ru, { pitch: ch.voice.pitch, female: ch.voice.female, speed: "slow" })} aria-label="Ouvir devagar">
                          <Volume2 size={14} />
                        </button>
                      )}
                      {level === "medio" && m.pt && (
                        <button className="btn ghost sm" style={{ padding: "2px 6px" }} onClick={() => setShowPt((x) => (x.includes(i) ? x.filter((y) => y !== i) : [...x, i]))}>
                          <Eye size={14} /> {showPt.includes(i) ? "esconder" : "tradução"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
          {typing && (
            <div className="msg">
              <Portrait id={ch.id} size={34} mood={mood} talking />
              <div className="bubble typing" aria-label={`${ch.name} está escrevendo`}>
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
          {coach && <CoachCard coach={coach} onRetry={rewind} level={level} options={options.filter((o) => !o.hiddenInEasy && !o.note)} fill={fill} />}
          {ended && <EndCard stats={stats.current} />}
          <div ref={bottom} />
        </div>
      </div>

      {awaiting && !ended && (
        <div className="lesson-foot">
          <div className="foot-inner" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div className="row between wrap">
              <Seg
                label="Como responder"
                value={tab}
                onChange={(v) => setTab(v)}
                options={[
                  ...(level === "facil" ? [{ value: "opcoes" as const, label: "Opções" }] : []),
                  ...(level !== "dificil" ? [{ value: "montar" as const, label: "Montar" }] : []),
                  { value: "escrever" as const, label: "Escrever" },
                ]}
              />
              {level !== "facil" && (
                <button
                  className="btn ghost sm"
                  onClick={() => {
                    setHelped(true);
                    setTab(level === "medio" ? "montar" : "escrever");
                    setCoach({ typed: "", u: null });
                  }}
                >
                  <Lightbulb size={14} /> Ajuda
                </button>
              )}
            </div>
            {tab === "opcoes" && <OptionsReply options={visibleOptions} fill={fill} onPick={(o) => submit(fill(o.ru), "option", o)} />}
            {tab === "montar" && <BuildReply key={nodeId} options={visibleOptions} fill={fill} onSend={(t) => submit(t, "build")} />}
            {tab === "escrever" && <TypeReply key={nodeId} onSend={(t, v) => submit(t, v ? "voice" : "type")} />}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionsReply({ options, fill, onPick }: { options: Option[]; fill: (s: string) => string; onPick: (o: Option) => void }) {
  return (
    <div className="options" style={{ marginTop: 10 }}>
      {options.map((o) => (
        <button key={o.id} className="option" onClick={() => onPick(o)}>
          <div style={{ textAlign: "left" }}>
            <Ru text={fill(o.ru)} />
            <div className="small muted">{fill(o.pt)}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function BuildReply({ options, fill, onSend }: { options: Option[]; fill: (s: string) => string; onSend: (t: string) => void }) {
  // Banco com as palavras de até duas respostas possíveis, embaralhadas
  const bank = useMemo(() => {
    const pool = options.slice(0, 2).flatMap((o) => tokensOf(fill(o.ru)));
    const uniq: string[] = [];
    for (const t of pool) if (!uniq.some((u) => u.toLowerCase() === t.toLowerCase())) uniq.push(t);
    return shuffle(uniq);
  }, [options, fill]);
  const [picked, setPicked] = useState<number[]>([]);
  return (
    <div style={{ marginTop: 10 }}>
      <div className="answer-line" style={{ minHeight: 52, marginBottom: 12 }}>
        {picked.map((i, k) => (
          <button key={k} className="tile" onClick={() => setPicked((p) => p.filter((_, j) => j !== k))}>
            <Stressed text={bank[i]} />
          </button>
        ))}
      </div>
      <div className="bank">
        {bank.map((t, i) => (
          <button key={i} className={`tile ${picked.includes(i) ? "used" : ""}`} onClick={() => setPicked((p) => [...p, i])}>
            <Stressed text={t} />
          </button>
        ))}
      </div>
      <div className="row" style={{ justifyContent: "flex-end", marginTop: 12 }}>
        <button className="btn ghost" onClick={() => setPicked([])} disabled={!picked.length}>
          Limpar
        </button>
        <button className="btn primary" disabled={!picked.length} onClick={() => onSend(picked.map((i) => bank[i]).join(" "))}>
          <Send size={16} /> Enviar
        </button>
      </div>
    </div>
  );
}

function TypeReply({ onSend }: { onSend: (t: string, voice?: boolean) => void }) {
  const [text, setText] = useState("");
  const [kb, setKb] = useState(prefersAppKeyboard);
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const send = (voice?: boolean, t = text) => {
    if (!t.trim()) return;
    onSend(t.trim(), voice);
    setText("");
  };
  const mic = async () => {
    setErr(null);
    setListening(true);
    const r = await listen();
    setListening(false);
    if (r.alternatives[0]) send(true, r.alternatives[0]);
    else setErr(r.error === "not-allowed" ? "Sem permissão para o microfone." : "Não ouvi nada. Tente de novo.");
  };
  return (
    <div style={{ marginTop: 10 }}>
      <div className="row">
        <input
          className="type-box"
          style={{ minHeight: 52, padding: "10px 14px", fontSize: "1.15rem" }}
          value={text}
          lang="ru"
          inputMode={kb ? "none" : "text"}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Responda em russo…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          aria-label="Sua resposta em russo"
        />
        {canRecognize() && (
          <button className={`btn ${listening ? "bad" : ""}`} onClick={mic} disabled={listening} aria-label="Responder falando">
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}
        <button className="btn primary" onClick={() => send()} disabled={!text.trim()} aria-label="Enviar">
          <Send size={18} />
        </button>
      </div>
      {err && <div className="small" style={{ color: "var(--bad)", marginTop: 6 }}>{err}</div>}
      <button className="btn ghost sm" style={{ marginTop: 6 }} onClick={() => setKb((v) => !v)}>
        <KbIcon size={14} /> {kb ? "Usar teclado do aparelho" : "Teclado russo do app"}
      </button>
      {kb && <Keyboard value={text} onChange={setText} onEnter={() => send()} />}
    </div>
  );
}

function CoachCard({ coach, onRetry, level, options, fill }: { coach: Coach; onRetry: () => void; level: Level; options: Option[]; fill: (s: string) => string }) {
  const { u, typed } = coach;
  if (!u) {
    return (
      <div className="coach">
        <div style={{ fontWeight: 800 }}>{typed ? "O personagem não entendeu" : "Ideias de resposta"}</div>
        {typed && <p className="small" style={{ margin: "4px 0" }}>Tente uma frase curta usando as palavras das lições. Exemplos de respostas que funcionam aqui:</p>}
        <ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
          {options.slice(0, 3).map((o) => (
            <li key={o.id}>
              <Ru text={fill(o.ru)} /> <span className="muted">— {fill(o.pt)}</span>
            </li>
          ))}
        </ul>
        {level === "dificil" && <p className="xs muted" style={{ margin: "6px 0 0" }}>Usar a ajuda conta como resposta com apoio.</p>}
      </div>
    );
  }
  const v = !u.exact ? checkRussian(typed, [u.corrected]) : null;
  return (
    <div className={`coach ${u.exact && !u.note ? "ok" : ""}`}>
      <div className="row between wrap">
        <div style={{ fontWeight: 800 }}>{u.exact ? <><Check size={16} /> Entendido</> : "Entendido, com uma correção"}</div>
        <button className="btn ghost sm" onClick={onRetry}>
          <RotateCcw size={14} /> Tentar de novo
        </button>
      </div>
      {!u.exact && (
        <>
          <div className="small" style={{ marginTop: 6 }}>
            Você escreveu: <span className="ru">«{typed}»</span>
          </div>
          <div className="small">
            Forma correta: <Ru text={u.corrected} />
          </div>
          {v && <Diff verdict={v} />}
        </>
      )}
      <div className="small muted" style={{ marginTop: 4 }}>
        Significa: {fill(u.option.pt)}
      </div>
      {u.why && <div className="small" style={{ marginTop: 4 }}>{u.why}</div>}
      {u.note && <div className="small" style={{ marginTop: 4 }}><Lightbulb size={13} /> {u.note}</div>}
    </div>
  );
}

function EndCard({ stats }: { stats: { turns: number; understood: number; corrections: { typed: string; right: string; why?: string }[]; xp: number } }) {
  const score = stats.turns ? stats.understood / stats.turns : 1;
  return (
    <div className="card result" style={{ marginTop: 10 }}>
      <Confetti count={50} />
      <Ring value={score} size={110} color="var(--blue)" sub="entendido" />
      <h2>Conversa concluída!</h2>
      <p className="small muted">
        {stats.understood} de {stats.turns} respostas entendidas de primeira · +{stats.xp} XP
      </p>
      {stats.corrections.length > 0 && (
        <div style={{ width: "100%", textAlign: "left" }}>
          <div className="eyebrow">Correções</div>
          {stats.corrections.map((c, i) => (
            <div key={i} className="list-item small">
              <span className="ru" style={{ textDecoration: "line-through", color: "var(--bad)" }}>
                {c.typed}
              </span>
              <span>→</span>
              <Ru text={c.right} />
            </div>
          ))}
        </div>
      )}
      <div className="row wrap" style={{ justifyContent: "center" }}>
        <a className="btn" href="#/conversas">
          Conversas
        </a>
        <button className="btn primary" onClick={() => window.location.reload()}>
          <RotateCcw size={16} /> Conversar de novo
        </button>
      </div>
    </div>
  );
}
