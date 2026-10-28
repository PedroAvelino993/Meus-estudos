// Componentes de cada tipo de exercício. O LessonPlayer cuida de verificar, pontuar e avançar.

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Check, Eye, Keyboard as KbIcon, Lightbulb, Mic, MicOff, Square, Volume2 } from "lucide-react";
import type { Exercise, Verdict } from "../core/types";
import { AudioButton, Ru, Stressed, TapText, Translit, WordByWord, trOf, useShowTranslit, useVoice } from "./ru";
import { Keyboard, prefersAppKeyboard } from "./Keyboard";
import { grammar, letter as letterOf, lex, text as textOf } from "../content";
import { canRecognize, canRecord, listen, record, speak } from "../audio/speech";
import { checkRussian } from "../core/evaluate";
import { normalize, shuffle, stripStress, tokensOf } from "../core/text";
import { sfx } from "../audio/sfx";

export type Answer =
  | { kind: "index"; value: number }
  | { kind: "tokens"; value: string[] }
  | { kind: "text"; value: string }
  | { kind: "pairs"; mistakes: number }
  | { kind: "speak"; result: "recognized" | "self-ok" | "self-retry" | "skipped"; heard?: string }
  | { kind: "none" };

export interface ExProps<E extends Exercise = Exercise> {
  ex: E;
  checked: boolean;
  verdict: Verdict | null;
  answer: Answer | null;
  setAnswer: (a: Answer | null) => void;
  onSubmit: () => void;
  hinted: boolean;
}

/** Negrito simples: **texto**. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <b key={i}>
            <Stressed text={p.slice(2, -2)} />
          </b>
        ) : (
          <Stressed key={i} text={p} />
        ),
      )}
    </>
  );
}

// ---------- Ensino ----------

export function TeachLetter({ ex }: ExProps<Extract<Exercise, { kind: "teach-letter" }>>) {
  const l = letterOf(ex.letter)!;
  const voice = useVoice();
  return (
    <div className="stack lg">
      <span className="ex-kicker">
        <BookOpen size={14} /> Letra nova
      </span>
      <div className="letter-hero">
        <div className="letter-big" lang="ru">
          {l.upper}
          <span className="lower">{l.lower}</span>
        </div>
        <div className="stack" style={{ flex: 1, minWidth: 220 }}>
          <div>
            <div className="eyebrow">Nome</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>
              <Ru text={l.name} /> <span className="muted small">({l.nameTr})</span>
            </div>
          </div>
          <div>
            <div className="eyebrow">Som</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--red)" }}>«{l.sound}»</div>
          </div>
          {voice && <AudioButton text={l.examples[0].ru} label={`Ouvir ${l.examples[0].ru}`} />}
        </div>
      </div>
      <p style={{ fontSize: "1.1rem", margin: 0 }}>
        <Rich text={l.explain} />
      </p>
      {l.pitfall && (
        <div className="notice warn">
          <AlertTriangle size={18} />
          <div>
            <b>Atenção, brasileiro:</b> <Rich text={l.pitfall} />
          </div>
        </div>
      )}
      <div className="grid three">
        {l.examples.map((e) => (
          <div className="card tight row between" key={e.ru}>
            <div>
              <Ru text={e.ru} className="teach-word" />
              <div className="small muted">
                {e.pt} · «{e.tr}»
              </div>
            </div>
            <AudioButton text={e.ru} slow={false} label={`Ouvir ${e.ru}`} />
          </div>
        ))}
      </div>
      {l.lookalikes?.length ? (
        <div className="stack">
          <div className="eyebrow">Não confunda</div>
          {l.lookalikes.map((x) => (
            <div key={x.char} className="row" style={{ alignItems: "flex-start" }}>
              <span className="chip red" style={{ fontFamily: "var(--serif)", fontSize: "1.1rem" }}>
                {x.char}
              </span>
              <span className="small">{x.note}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TeachWord({ ex }: ExProps<Extract<Exercise, { kind: "teach-word" }>>) {
  const e = lex(ex.word);
  return (
    <div className="stack lg">
      <span className="ex-kicker">
        <BookOpen size={14} /> Palavra nova
      </span>
      <div className="card teach">
        <Ru text={e.ru} className="teach-word" />
        <Translit ru={e.ru} tr={e.tr} />
        <div style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: 4 }}>{e.pt}</div>
        {e.alt?.length ? <div className="small muted">também: {e.alt.join(", ")}</div> : null}
        <div className="row" style={{ marginTop: 10 }}>
          <AudioButton text={e.ru} auto />
          {e.gender && <span className="chip">{{ m: "masculino", f: "feminino", n: "neutro" }[e.gender]}</span>}
        </div>
      </div>
      {e.note && (
        <div className="notice">
          <Lightbulb size={18} />
          <div>
            <Rich text={e.note} />
          </div>
        </div>
      )}
      {e.forms?.length ? (
        <div className="stack">
          <div className="eyebrow">Formas que você vai ver</div>
          {e.forms.slice(0, 6).map((f) => (
            <div key={f.ru} className="row small" style={{ alignItems: "baseline" }}>
              <Ru text={f.ru} className="" />
              <span className="muted">— {f.note}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TipCard({ ex }: ExProps<Extract<Exercise, { kind: "tip" }>>) {
  return (
    <div className="stack lg">
      <span className="ex-kicker">
        <Lightbulb size={14} /> Dica
      </span>
      <h2>{ex.title}</h2>
      <p style={{ fontSize: "1.1rem", margin: 0 }}>
        <Rich text={ex.text} />
      </p>
      {ex.ex?.map((x) => (
        <div key={x.ru} className="card tight row between">
          <div>
            <Ru text={x.ru} className="teach-word" />
            <div className="muted">{x.pt}</div>
          </div>
          {/[Ѐ-ӿ]{2}/.test(x.ru) && <AudioButton text={x.ru} slow={false} />}
        </div>
      ))}
    </div>
  );
}

export function GrammarCard({ ex }: ExProps<Extract<Exercise, { kind: "grammar" }>>) {
  const g = grammar(ex.topic)!;
  return <GrammarBody id={g.id} compact />;
}

export function GrammarBody({ id, compact }: { id: string; compact?: boolean }) {
  const g = grammar(id)!;
  return (
    <div className="stack lg">
      <span className="ex-kicker" style={{ color: "var(--violet)" }}>
        <BookOpen size={14} /> Gramática · {g.level}
      </span>
      <div>
        <h2>{g.title}</h2>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          {g.summary}
        </p>
      </div>
      {g.body.map((p, i) => (
        <p key={i} style={{ margin: 0, fontSize: "1.05rem" }}>
          <Rich text={p} />
        </p>
      ))}
      <div className="stack">
        {g.examples.map((x) => (
          <div key={x.ru} className="card tight row between">
            <div>
              <Ru text={x.ru} className="teach-word" />
              <div className="muted">
                {x.pt}
                {x.note && <span className="chip violet" style={{ marginLeft: 8 }}>{x.note}</span>}
              </div>
            </div>
            <AudioButton text={x.ru} slow={false} />
          </div>
        ))}
      </div>
      {g.compare && (
        <div className="notice">
          <Lightbulb size={18} />
          <div>
            <b>Comparando com o português:</b> <Rich text={g.compare} />
          </div>
        </div>
      )}
      {!compact || g.mistakes.length ? (
        <div className="stack">
          <div className="eyebrow">Erros comuns de brasileiros</div>
          {g.mistakes.map((m) => (
            <div key={m.wrong} className="card tight">
              <div className="row wrap">
                <span className="chip" style={{ textDecoration: "line-through", color: "var(--bad)" }}>
                  <Stressed text={m.wrong} />
                </span>
                <span>→</span>
                <span className="chip green">
                  <Stressed text={m.right} />
                </span>
              </div>
              <div className="small muted" style={{ marginTop: 6 }}>
                {m.why}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------- Escolha ----------

export function ChoiceEx({ ex, checked, answer, setAnswer, onSubmit }: ExProps<Extract<Exercise, { kind: "choice" }>>) {
  const sel = answer?.kind === "index" ? answer.value : -1;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (checked) return;
      const n = Number(e.key);
      if (n >= 1 && n <= ex.options.length) setAnswer({ kind: "index", value: n - 1 });
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [checked, ex.options.length, setAnswer]);
  const multiline = ex.ru?.includes("\n");
  return (
    <div className="stack lg">
      <div className="ex-prompt">{ex.prompt}</div>
      {ex.ru && (
        <div className="row wrap" style={{ gap: 16 }}>
          {ex.audioOnly ? (
            <AudioButton text={ex.ru} big auto />
          ) : multiline ? (
            <div className="card reader" style={{ width: "100%" }}>
              {ex.ru.split("\n").map((l, i) => (
                <p key={i}>
                  <TapText text={l} />
                </p>
              ))}
            </div>
          ) : (
            <>
              <div>
                <Ru text={ex.ru} className={ex.big ? "letter-big" : "teach-word"} />
                {!ex.noTr && <Translit ru={ex.ru} tr={trOf(ex.ru)} />}
              </div>
              {/[Ѐ-ӿ]{2}/.test(ex.ru) && !ex.big && <AudioButton text={ex.ru} />}
            </>
          )}
        </div>
      )}
      <div className={`options ${ex.big || ex.options.every((o) => o.text.length < 14) ? "cols" : ""}`}>
        {ex.options.map((o, i) => {
          const state = checked ? (i === ex.answer ? "correct" : i === sel ? "wrong" : "") : i === sel ? "selected" : "";
          return (
            <button
              key={i}
              type="button"
              className={`option ${state} ${ex.big ? "big" : ""}`}
              disabled={checked}
              onClick={() => {
                sfx.tap();
                setAnswer({ kind: "index", value: i });
              }}
              onDoubleClick={onSubmit}
            >
              {!ex.big && <span className="key">{i + 1}</span>}
              {o.ru ? <Ru text={o.text} /> : <span>{o.text}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Banco de palavras ----------

export function BuildEx({ ex, checked, answer, setAnswer, hinted }: ExProps<Extract<Exercise, { kind: "build" }>>) {
  const picked = answer?.kind === "tokens" ? answer.value : [];
  // índices usados (a mesma palavra pode aparecer duas vezes)
  const [used, setUsed] = useState<number[]>([]);
  useEffect(() => setUsed([]), [ex.id]);
  useEffect(() => {
    if (!answer) setUsed([]);
  }, [answer]);
  const add = (i: number) => {
    if (checked) return;
    sfx.tap();
    const next = [...used, i];
    setUsed(next);
    setAnswer({ kind: "tokens", value: next.map((j) => ex.tokens[j]) });
  };
  const remove = (pos: number) => {
    if (checked) return;
    const next = used.filter((_, k) => k !== pos);
    setUsed(next);
    setAnswer(next.length ? { kind: "tokens", value: next.map((j) => ex.tokens[j]) } : null);
  };
  const firstWord = tokensOf(ex.accept[0])[0];
  return (
    <div className="stack lg">
      <div className="ex-prompt">{ex.prompt}</div>
      {ex.audioOnly ? (
        <div className="row wrap">
          <AudioButton text={ex.audio!} big auto />
          {checked && <WordByWord text={ex.audio!} />}
        </div>
      ) : (
        <div className="card tight" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
          {ex.pt}
        </div>
      )}
      {hinted && !checked && (
        <div className="notice warn">
          <Lightbulb size={18} /> A frase começa com «{firstWord}».
        </div>
      )}
      <div className="answer-line" aria-label="Sua resposta">
        {picked.map((t, pos) => (
          <button key={pos} type="button" className="tile" onClick={() => remove(pos)} disabled={checked}>
            <Stressed text={t} />
          </button>
        ))}
      </div>
      <div className="bank">
        {ex.tokens.map((t, i) => (
          <button key={i} type="button" className={`tile ${used.includes(i) ? "used" : ""}`} onClick={() => add(i)} disabled={checked} aria-hidden={used.includes(i)}>
            <Stressed text={t} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Digitação ----------

function TypeInput({ value, onChange, onEnter, checked, verdict, placeholder }: { value: string; onChange: (v: string) => void; onEnter: () => void; checked: boolean; verdict: Verdict | null; placeholder?: string }) {
  const [appKb, setAppKb] = useState(prefersAppKeyboard);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!appKb) ref.current?.focus();
  }, [appKb]);
  return (
    <div>
      <textarea
        ref={ref}
        className={`type-box ru ${checked ? (verdict?.ok ? "ok" : "bad") : ""}`}
        value={value}
        rows={1}
        lang="ru"
        inputMode={appKb ? "none" : "text"}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder ?? "Escreva em russo…"}
        disabled={checked}
        onChange={(e) => onChange(e.target.value.replace(/\n/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter();
          }
        }}
        aria-label="Resposta em russo"
      />
      <div className="row between" style={{ marginTop: 8 }}>
        <button type="button" className="btn ghost sm" onClick={() => setAppKb((v) => !v)} aria-pressed={appKb}>
          <KbIcon size={16} /> {appKb ? "Usar teclado do aparelho" : "Teclado russo do app"}
        </button>
      </div>
      {appKb && !checked && <Keyboard value={value} onChange={onChange} onEnter={onEnter} />}
    </div>
  );
}

export function Diff({ verdict }: { verdict: Verdict }) {
  if (!verdict.diff?.length) return null;
  return (
    <div className="diff" aria-label="Comparação palavra a palavra">
      {verdict.diff.map((d, i) =>
        d.status === "ok" ? (
          <span key={i}>{d.word}</span>
        ) : d.status === "missing" ? (
          <span key={i} className="missing" title="faltou">
            + {d.expected}
          </span>
        ) : (
          <span key={i} className={d.status} title={d.expected ? `esperado: ${d.expected}` : "sobrou"}>
            {d.word}
          </span>
        ),
      )}
    </div>
  );
}

export function TypeEx({ ex, checked, verdict, answer, setAnswer, onSubmit, hinted }: ExProps<Extract<Exercise, { kind: "type" }>>) {
  const value = answer?.kind === "text" ? answer.value : "";
  return (
    <div className="stack lg">
      <div className="ex-prompt">{ex.prompt}</div>
      {ex.audioOnly ? <AudioButton text={ex.audio!} big auto /> : <div className="card tight" style={{ fontSize: "1.2rem", fontWeight: 750 }}>{ex.pt}</div>}
      {hinted && !checked && (
        <div className="notice warn">
          <Lightbulb size={18} /> {ex.hint ?? `Começa com «${stripStress(ex.accept[0]).split(" ")[0]}».`}
        </div>
      )}
      <TypeInput value={value} onChange={(v) => setAnswer(v ? { kind: "text", value: v } : null)} onEnter={onSubmit} checked={checked} verdict={verdict} />
      {checked && verdict && <Diff verdict={verdict} />}
    </div>
  );
}

// ---------- Lacuna ----------

export function GapEx({ ex, checked, verdict, answer, setAnswer, onSubmit }: ExProps<Extract<Exercise, { kind: "gap" }>>) {
  const [before, after] = ex.ru.split("___");
  const filled = answer?.kind === "text" ? answer.value : answer?.kind === "index" && ex.options ? ex.options[answer.value] : "";
  return (
    <div className="stack lg">
      <div className="ex-prompt">Complete a frase</div>
      <div className="card" style={{ fontSize: "1.45rem" }}>
        <span className="ru" lang="ru">
          <Stressed text={before} />
          <span
            style={{
              display: "inline-block",
              minWidth: 70,
              borderBottom: `3px solid ${checked ? (verdict?.ok ? "var(--ok)" : "var(--bad)") : "var(--blue)"}`,
              margin: "0 4px",
              textAlign: "center",
              color: checked ? (verdict?.ok ? "var(--ok)" : "var(--bad)") : "var(--blue)",
            }}
          >
            {filled ? <Stressed text={filled} /> : " "}
          </span>
          <Stressed text={after ?? ""} />
        </span>
        <div className="muted small" style={{ marginTop: 8 }}>
          {ex.pt}
        </div>
      </div>
      {ex.options ? (
        <div className="options cols">
          {ex.options.map((o, i) => {
            const sel = answer?.kind === "index" && answer.value === i;
            const isRight = normalize(o) === normalize(ex.answer[0]) || ex.answer.some((a) => normalize(a) === normalize(o));
            const state = checked ? (isRight ? "correct" : sel ? "wrong" : "") : sel ? "selected" : "";
            return (
              <button key={i} type="button" className={`option ${state}`} disabled={checked} onClick={() => setAnswer({ kind: "index", value: i })}>
                <span className="key">{i + 1}</span>
                <Ru text={o} />
              </button>
            );
          })}
        </div>
      ) : (
        <TypeInput value={filled} onChange={(v) => setAnswer(v ? { kind: "text", value: v } : null)} onEnter={onSubmit} checked={checked} verdict={verdict} placeholder="Palavra que falta…" />
      )}
    </div>
  );
}

// ---------- Corrigir o erro ----------

export function FixEx({ ex, checked, verdict, answer, setAnswer, onSubmit }: ExProps<Extract<Exercise, { kind: "fix" }>>) {
  const value = answer?.kind === "text" ? answer.value : "";
  return (
    <div className="stack lg">
      <div className="ex-prompt">Encontre e corrija o erro</div>
      <div className="card" style={{ borderLeft: "5px solid var(--bad)" }}>
        <Ru text={ex.wrong} className="teach-word" />
        <div className="muted small" style={{ marginTop: 6 }}>
          Deveria significar: {ex.pt}
        </div>
      </div>
      <button type="button" className="btn ghost sm" style={{ alignSelf: "flex-start" }} disabled={checked} onClick={() => setAnswer({ kind: "text", value: stripStress(ex.wrong) })}>
        Copiar a frase para editar
      </button>
      <TypeInput value={value} onChange={(v) => setAnswer(v ? { kind: "text", value: v } : null)} onEnter={onSubmit} checked={checked} verdict={verdict} placeholder="Escreva a frase corrigida…" />
      {checked && verdict && <Diff verdict={verdict} />}
    </div>
  );
}

// ---------- Pares ----------

export function PairsEx({ ex, checked, setAnswer }: ExProps<Extract<Exercise, { kind: "pairs" }>>) {
  const left = useMemo(() => shuffle(ex.pairs.map((p) => p.ru)), [ex.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const right = useMemo(() => shuffle(ex.pairs.map((p) => p.pt)), [ex.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selL, setSelL] = useState<string | null>(null);
  const [selR, setSelR] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [bad, setBad] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  useEffect(() => {
    if (selL && selR) {
      const ok = ex.pairs.some((p) => p.ru === selL && p.pt === selR);
      if (ok) {
        sfx.correct();
        const next = [...done, selL];
        setDone(next);
        if (next.length === ex.pairs.length) setAnswer({ kind: "pairs", mistakes });
      } else {
        sfx.wrong();
        setMistakes((m) => m + 1);
        setBad(selL + selR);
        setTimeout(() => setBad(null), 450);
      }
      setSelL(null);
      setSelR(null);
    }
  }, [selL, selR]); // eslint-disable-line react-hooks/exhaustive-deps
  const doneR = ex.pairs.filter((p) => done.includes(p.ru)).map((p) => p.pt);
  return (
    <div className="stack lg">
      <div className="ex-prompt">Toque nos pares</div>
      <div className="grid two" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="options">
          {left.map((t) => (
            <button key={t} type="button" disabled={checked || done.includes(t)} className={`option ${done.includes(t) ? "correct" : selL === t ? "selected" : ""} ${bad?.startsWith(t) ? "wrong" : ""}`} onClick={() => {
              setSelL(t);
              if (!selR) void speak(t);
            }}>
              <Ru text={t} />
            </button>
          ))}
        </div>
        <div className="options">
          {right.map((t) => (
            <button key={t} type="button" disabled={checked || doneR.includes(t)} className={`option ${doneR.includes(t) ? "correct" : selR === t ? "selected" : ""} ${bad?.endsWith(t) ? "wrong" : ""}`} onClick={() => setSelR(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Soletrar ----------

export function SpellEx({ ex, checked, answer, setAnswer }: ExProps<Extract<Exercise, { kind: "spell" }>>) {
  const [used, setUsed] = useState<number[]>([]);
  useEffect(() => setUsed([]), [ex.id]);
  useEffect(() => {
    if (!answer) setUsed([]);
  }, [answer]);
  const push = (i: number) => {
    if (checked) return;
    sfx.tap();
    const next = [...used, i];
    setUsed(next);
    setAnswer({ kind: "tokens", value: next.map((j) => ex.tiles[j]) });
  };
  const pop = (pos: number) => {
    if (checked) return;
    const next = used.filter((_, k) => k !== pos);
    setUsed(next);
    setAnswer(next.length ? { kind: "tokens", value: next.map((j) => ex.tiles[j]) } : null);
  };
  return (
    <div className="stack lg">
      <div className="ex-prompt">Monte a palavra</div>
      <div className="row wrap">
        <div className="card tight" style={{ fontSize: "1.2rem", fontWeight: 750 }}>
          {ex.pt}
        </div>
        <AudioButton text={ex.word} />
      </div>
      <div className="answer-line dashed" style={{ justifyContent: "center" }}>
        {used.map((j, pos) => (
          <button key={pos} type="button" className="tile letter" onClick={() => pop(pos)} disabled={checked}>
            {ex.tiles[j]}
          </button>
        ))}
      </div>
      <div className="bank">
        {ex.tiles.map((t, i) => (
          <button key={i} type="button" className={`tile letter ${used.includes(i) ? "used" : ""}`} onClick={() => push(i)} disabled={checked}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Leitura com toque ----------

export function ReadEx({ ex, checked, answer, setAnswer }: ExProps<Extract<Exercise, { kind: "read" }>>) {
  const t = textOf(ex.text)!;
  const [showPt, setShowPt] = useState<number[]>([]);
  const sel = answer?.kind === "index" ? answer.value : -1;
  const q = t.question;
  useEffect(() => {
    if (!q) setAnswer({ kind: "none" });
  }, [ex.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="stack lg">
      <span className="ex-kicker" style={{ color: "var(--blue)" }}>
        <BookOpen size={14} /> Leitura · toque numa palavra para traduzir
      </span>
      <h2>{t.title}</h2>
      <div className="card reader">
        {t.ru.map((line, i) => {
          const m = line.match(/^([^:]{1,24}):\s*(.*)$/);
          const body = m ? m[2] : line;
          return (
            <div key={i} style={{ marginBottom: 10 }}>
              <p>
                {m && <span className="speaker">{m[1]}:</span>}
                <TapText text={body} />
              </p>
              <div className="row" style={{ gap: 6 }}>
                <AudioButton text={body} slow />
                <button type="button" className="btn ghost sm" onClick={() => setShowPt((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]))}>
                  <Eye size={14} /> {showPt.includes(i) ? "Esconder" : "Tradução"}
                </button>
              </div>
              {showPt.includes(i) && <div className="small muted" style={{ marginTop: 4 }}>{t.pt[i]}</div>}
            </div>
          );
        })}
      </div>
      {q && (
        <div className="stack">
          <h3>{q.q}</h3>
          <div className="options">
            {q.options.map((o, i) => {
              const state = checked ? (i === q.answer ? "correct" : i === sel ? "wrong" : "") : i === sel ? "selected" : "";
              return (
                <button key={i} type="button" className={`option ${state}`} disabled={checked} onClick={() => setAnswer({ kind: "index", value: i })}>
                  <span className="key">{i + 1}</span>
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Pronúncia ----------

export function SpeakEx({ ex, checked, answer, setAnswer }: ExProps<Extract<Exercise, { kind: "speak" }>>) {
  const recognize = canRecognize();
  const recordable = canRecord();
  const [busy, setBusy] = useState<"listening" | "recording" | null>(null);
  const [heard, setHeard] = useState<{ text: string; ok: boolean; v?: Verdict } | null>(null);
  const [clip, setClip] = useState<string | null>(null);
  const [rec, setRec] = useState<{ stop: () => Promise<string | null> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const showTr = useShowTranslit();

  const doListen = async () => {
    setError(null);
    setBusy("listening");
    const r = await listen();
    setBusy(null);
    if (r.error && r.error !== "no-speech") {
      setError(r.error === "not-allowed" ? "O navegador não deu permissão para usar o microfone." : "Não foi possível usar o reconhecimento de fala agora.");
      return;
    }
    if (!r.alternatives.length) {
      setError("Não ouvi nada. Tente de novo, perto do microfone.");
      return;
    }
    let best = { text: r.alternatives[0], v: checkRussian(r.alternatives[0], [ex.ru]) };
    for (const a of r.alternatives) {
      const v = checkRussian(a, [ex.ru]);
      if (v.ok) {
        best = { text: a, v };
        break;
      }
    }
    setHeard({ text: best.text, ok: best.v.ok, v: best.v });
    if (best.v.ok) setAnswer({ kind: "speak", result: "recognized", heard: best.text });
  };

  const doRecord = async () => {
    if (rec) {
      const url = await rec.stop();
      setRec(null);
      setBusy(null);
      setClip(url);
      return;
    }
    setError(null);
    const r = await record();
    if (!r) {
      setError("Não foi possível acessar o microfone.");
      return;
    }
    setRec(r);
    setBusy("recording");
  };

  return (
    <div className="stack lg">
      <div className="ex-prompt">Fale em voz alta</div>
      <div className="card teach">
        <Ru text={ex.ru} className="teach-word" />
        {showTr && <Translit ru={ex.ru} tr={trOf(ex.ru)} />}
        <div className="muted">{ex.pt}</div>
        <div className="row" style={{ marginTop: 8 }}>
          <AudioButton text={ex.ru} label="Ouvir o modelo" />
        </div>
        <WordByWord text={ex.ru} />
      </div>

      {recognize ? (
        <div className="stack">
          <button type="button" className={`btn lg ${busy === "listening" ? "bad" : "primary"}`} onClick={doListen} disabled={!!busy || checked}>
            {busy === "listening" ? <MicOff size={20} /> : <Mic size={20} />} {busy === "listening" ? "Ouvindo…" : "Falar agora"}
          </button>
          <p className="xs faint" style={{ margin: 0 }}>
            O reconhecimento de fala é feito pelo serviço do navegador (no Chrome, o áudio vai para o Google; no Safari, para a Apple). Ele transcreve o que entendeu — não dá nota de sotaque.
          </p>
        </div>
      ) : recordable ? (
        <div className="stack">
          <div className="notice">
            <AlertTriangle size={18} />
            <div>Este navegador não reconhece fala. Grave sua voz e compare com o modelo de ouvido — a avaliação é sua.</div>
          </div>
          <button type="button" className={`btn lg ${busy === "recording" ? "bad" : "primary"}`} onClick={doRecord} disabled={checked}>
            {busy === "recording" ? <Square size={18} /> : <Mic size={20} />} {busy === "recording" ? "Parar gravação" : "Gravar minha voz"}
          </button>
          {clip && (
            <div className="card tight stack">
              <div className="row wrap">
                <audio src={clip} controls />
                <AudioButton text={ex.ru} slow={false} label="Ouvir o modelo" />
              </div>
              <div className="row wrap">
                <button type="button" className={`btn ${answer?.kind === "speak" && answer.result === "self-ok" ? "ok" : ""}`} onClick={() => setAnswer({ kind: "speak", result: "self-ok" })}>
                  <Check size={16} /> Soou parecido
                </button>
                <button type="button" className="btn" onClick={() => setAnswer({ kind: "speak", result: "self-retry" })}>
                  Preciso treinar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="notice warn">
          <AlertTriangle size={18} />
          <div>Este aparelho não permite gravar nem reconhecer fala aqui. Repita em voz alta junto com o áudio e continue.</div>
        </div>
      )}

      {error && <div className="notice warn">{error}</div>}
      {heard && (
        <div className={`coach ${heard.ok ? "ok" : ""}`}>
          <div className="small muted">O navegador entendeu:</div>
          <div className="ru" style={{ fontSize: "1.2rem" }}>
            «{heard.text}»
          </div>
          {heard.ok ? (
            <div style={{ color: "var(--ok)", fontWeight: 800, marginTop: 4 }}>Isso! Sua frase foi reconhecida.</div>
          ) : (
            <>
              {heard.v && <Diff verdict={heard.v} />}
              <div className="small" style={{ marginTop: 6 }}>
                Não bateu com a frase. Ouça o modelo devagar e tente de novo.
              </div>
            </>
          )}
        </div>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        <Volume2 size={14} /> Este exercício não tira pontos: pode pular se não puder falar agora.
      </p>
    </div>
  );
}

export function renderExercise(p: ExProps) {
  const ex = p.ex;
  switch (ex.kind) {
    case "teach-letter":
      return <TeachLetter {...(p as ExProps<typeof ex>)} />;
    case "teach-word":
      return <TeachWord {...(p as ExProps<typeof ex>)} />;
    case "tip":
      return <TipCard {...(p as ExProps<typeof ex>)} />;
    case "grammar":
      return <GrammarCard {...(p as ExProps<typeof ex>)} />;
    case "choice":
      return <ChoiceEx {...(p as ExProps<typeof ex>)} />;
    case "build":
      return <BuildEx {...(p as ExProps<typeof ex>)} />;
    case "type":
      return <TypeEx {...(p as ExProps<typeof ex>)} />;
    case "gap":
      return <GapEx {...(p as ExProps<typeof ex>)} />;
    case "fix":
      return <FixEx {...(p as ExProps<typeof ex>)} />;
    case "pairs":
      return <PairsEx {...(p as ExProps<typeof ex>)} />;
    case "spell":
      return <SpellEx {...(p as ExProps<typeof ex>)} />;
    case "read":
      return <ReadEx {...(p as ExProps<typeof ex>)} />;
    case "speak":
      return <SpeakEx {...(p as ExProps<typeof ex>)} />;
  }
}
