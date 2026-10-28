// Executa uma sequência de exercícios: verificar, explicar, repetir os errados no fim, pontuar.
// A precisão conta só a primeira tentativa de cada exercício; respostas com dica contam meio ponto.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Flag, Lightbulb, SkipForward, X, Zap } from "lucide-react";
import type { Exercise, Skill, Verdict } from "../core/types";
import type { Mode, Quality } from "../core/srs";
import { checkBuild, checkGap, checkRussian } from "../core/evaluate";
import { normalize, stripStress } from "../core/text";
import { text as textOf, lex } from "../content";
import { type Answer, renderExercise, Rich } from "./exercises";
import { Bar } from "./ui";
import { Ru, WordByWord } from "./ru";
import { sfx } from "../audio/sfx";
import { stopSpeaking } from "../audio/speech";
import { getState, update } from "../store";
import { addStudyTime, markSeen, recordAnswer } from "../core/state";
import { itemLabel } from "../core/progress";

/** Exercícios que não são avaliados (só leitura/apresentação). */
export function isScored(ex: Exercise): boolean {
  if (ex.kind === "read") return !!textOf(ex.text)?.question;
  return !["teach-letter", "teach-word", "tip", "grammar", "speak"].includes(ex.kind);
}

export function modeOf(ex: Exercise): Mode {
  switch (ex.kind) {
    case "choice":
      return ex.audioOnly ? "listen" : ex.skill === "leitura" ? "read" : "recognize";
    case "build":
      return ex.audioOnly ? "listen" : "produce";
    case "speak":
      return "speak";
    case "pairs":
      return "recognize";
    case "read":
      return "read";
    default:
      return "produce";
  }
}

export function skillOf(ex: Exercise): Skill {
  if ("skill" in ex) return ex.skill;
  if (ex.kind === "speak") return "fala";
  if (ex.kind === "read") return "leitura";
  return "vocabulario";
}

/** Verifica uma resposta. Devolve null se o exercício não tem certo/errado. */
export function evaluate(ex: Exercise, a: Answer | null): Verdict | null {
  switch (ex.kind) {
    case "choice": {
      const i = a?.kind === "index" ? a.value : -1;
      const right = ex.options[ex.answer].text;
      return { ok: i === ex.answer, expected: right, why: i === ex.answer ? undefined : ex.explain };
    }
    case "build": {
      const v = checkBuild(a?.kind === "tokens" ? a.value : [], ex.accept);
      return { ...v, why: v.why ?? ex.explain };
    }
    case "type":
      return checkRussian(a?.kind === "text" ? a.value : "", ex.accept);
    case "gap": {
      const val = a?.kind === "text" ? a.value : a?.kind === "index" && ex.options ? ex.options[a.value] : "";
      const v = checkGap(val, ex.answer);
      return { ...v, expected: ex.ru.replace("___", ex.answer[0]), why: v.ok ? ex.explain : `${v.why ?? ""} ${ex.explain}`.trim() };
    }
    case "fix": {
      const v = checkRussian(a?.kind === "text" ? a.value : "", ex.right);
      if (v.ok && normalize(a?.kind === "text" ? a.value : "") === normalize(ex.wrong)) return { ok: false, expected: ex.right[0], why: "A frase continua igual à errada." };
      return { ...v, why: v.ok ? ex.explain : `${v.why ?? ""} ${ex.explain}`.trim() };
    }
    case "pairs":
      return { ok: a?.kind === "pairs" && a.mistakes === 0, expected: "", why: a?.kind === "pairs" && a.mistakes ? `${a.mistakes} par(es) trocado(s) antes de acertar.` : undefined };
    case "spell": {
      const got = a?.kind === "tokens" ? a.value.join("") : "";
      const want = stripStress(ex.word).toLowerCase();
      return { ok: got === want, expected: ex.word, why: got === want ? undefined : `A grafia certa é «${stripStress(ex.word)}».` };
    }
    case "read": {
      const q = textOf(ex.text)?.question;
      if (!q) return null;
      const i = a?.kind === "index" ? a.value : -1;
      return { ok: i === q.answer, expected: q.options[q.answer], why: q.explain };
    }
    default:
      return null;
  }
}

function ready(ex: Exercise, a: Answer | null): boolean {
  if (!isScored(ex)) return true;
  if (!a) return false;
  if (a.kind === "text") return a.value.trim().length > 0;
  if (a.kind === "tokens") return a.value.length > 0;
  return true;
}

function hasHint(ex: Exercise): boolean {
  return ex.kind === "type" || ex.kind === "build";
}

export interface RunResult {
  scored: number;
  firstTry: number;
  hinted: number;
  accuracy: number;
  xp: number;
  missed: string[];
  seconds: number;
}

interface Props {
  title: string;
  exercises: Exercise[];
  context: "lesson" | "test" | "review" | "practice";
  /** Repetindo conteúdo já dominado: XP pela metade. */
  replay?: boolean;
  onExit: () => void;
  onFinish: (r: RunResult) => void;
  result?: (r: RunResult) => ReactNode;
}

export function LessonPlayer({ title, exercises, context, replay, onExit, onFinish, result }: Props) {
  const [queue, setQueue] = useState<Exercise[]>(exercises);
  const [pos, setPos] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [checked, setChecked] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [done, setDone] = useState<RunResult | null>(null);
  const firstTry = useRef(new Map<string, "right" | "hinted" | "wrong">());
  const attempts = useRef(new Map<string, number>());
  const xp = useRef(0);
  const missed = useRef(new Set<string>());
  const clock = useRef({ last: Date.now(), seconds: 0 });

  const ex = queue[pos];
  const scoredTotal = useMemo(() => exercises.filter(isScored).length, [exercises]);

  // Tempo ativo: soma os intervalos entre interações, com teto de 60 s (pausas não contam)
  const tick = useCallback(() => {
    const now = Date.now();
    clock.current.seconds += Math.min(60, (now - clock.current.last) / 1000);
    clock.current.last = now;
  }, []);

  // Exposto para os testes automáticos de ponta a ponta (não altera nada)
  useEffect(() => {
    (window as unknown as { __russkyEx?: Exercise }).__russkyEx = ex;
  }, [ex]);

  useEffect(() => {
    if (ex && (ex.kind === "teach-letter" || ex.kind === "teach-word" || ex.kind === "grammar")) {
      update((s) => markSeen(s, ex.items, Date.now()));
    }
  }, [ex]);

  const finish = useCallback(() => {
    tick();
    stopSpeaking();
    const results = [...firstTry.current.values()];
    const right = results.filter((r) => r === "right").length;
    const half = results.filter((r) => r === "hinted").length;
    const accuracy = scoredTotal ? (right + half * 0.5) / scoredTotal : 1;
    const r: RunResult = { scored: scoredTotal, firstTry: right, hinted: half, accuracy, xp: xp.current, missed: [...missed.current], seconds: Math.round(clock.current.seconds) };
    update((s) => addStudyTime(s, r.seconds, Date.now()));
    onFinish(r);
    setDone(r);
    sfx.complete();
  }, [onFinish, scoredTotal, tick]);

  const next = useCallback(() => {
    tick();
    stopSpeaking();
    setAnswer(null);
    setVerdict(null);
    setChecked(false);
    setHinted(false);
    if (pos + 1 >= queue.length) finish();
    else setPos(pos + 1);
  }, [finish, pos, queue.length, tick]);

  const check = useCallback(() => {
    if (!ex || checked) return;
    tick();
    if (!isScored(ex)) {
      if (ex.kind === "speak" && answer?.kind === "speak" && answer.result === "recognized") {
        update((s) => recordAnswer(s, { items: ex.items, quality: "right", mode: "speak", skill: "fala", firstTry: true, replay }, Date.now()).state);
      }
      next();
      return;
    }
    if (!ready(ex, answer)) return;
    const v = evaluate(ex, answer)!;
    const n = (attempts.current.get(ex.id) ?? 0) + 1;
    attempts.current.set(ex.id, n);
    const first = n === 1;
    const quality: Quality = !v.ok ? "wrong" : hinted ? "hinted" : "right";
    if (first) firstTry.current.set(ex.id, quality);
    if (!v.ok) ex.items.forEach((i) => missed.current.add(i));
    const typed = ex.kind === "type" || ex.kind === "fix" || (ex.kind === "gap" && !ex.options);
    const got = answer?.kind === "text" ? answer.value : answer?.kind === "tokens" ? answer.value.join(" ") : answer?.kind === "index" && ex.kind === "choice" ? ex.options[answer.value]?.text : "";
    let gained = 0;
    update((s) => {
      const r = recordAnswer(
        s,
        {
          items: ex.items,
          quality,
          mode: modeOf(ex),
          skill: skillOf(ex),
          firstTry: first,
          audio: modeOf(ex) === "listen",
          typed,
          inReview: context === "review",
          replay,
          exercise: ex.id,
          got,
          expected: v.expected,
        },
        Date.now(),
      );
      gained = r.xp;
      return r.state;
    });
    xp.current += gained;
    setVerdict(v);
    setChecked(true);
    if (v.ok) sfx.correct();
    else {
      sfx.wrong();
      // Volta no fim da lição para fixar (até 2 vezes)
      if (n <= 2) setQueue((q) => [...q, { ...ex }]);
    }
  }, [answer, checked, context, ex, hinted, next, replay, tick]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || done) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (tag === "BUTTON" && !(e.target as HTMLElement).classList.contains("lesson-cta")) return;
      e.preventDefault();
      if (checked) next();
      else check();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [check, checked, done, next]);

  if (done) {
    return (
      <div className="lesson">
        <div className="lesson-top">
          <button className="icon-btn" onClick={onExit} aria-label="Fechar">
            <X size={22} />
          </button>
          <div style={{ fontWeight: 800 }}>{title}</div>
        </div>
        <div className="lesson-body">
          <div className="lesson-inner">{result ? result(done) : <DefaultResult r={done} onExit={onExit} />}</div>
        </div>
      </div>
    );
  }

  if (!ex) {
    return (
      <div className="lesson">
        <div className="lesson-body">
          <div className="lesson-inner empty">
            <h3>Nada para praticar aqui agora.</h3>
            <button className="btn primary" onClick={onExit}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scoredDone = [...firstTry.current.keys()].length;
  const progress = scoredTotal ? scoredDone / scoredTotal : pos / queue.length;
  const isRetry = (attempts.current.get(ex.id) ?? 0) > 0 && !checked;
  const footTone = checked ? (verdict?.ok ? "ok" : "bad") : "";
  const scored = isScored(ex);

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="icon-btn" onClick={() => (pos > 0 ? setConfirmExit(true) : onExit())} aria-label="Sair da lição">
          <X size={22} />
        </button>
        <Bar value={Math.max(progress, pos / Math.max(queue.length, 1))} tone={context === "test" ? "violet" : "green"} label="Progresso da lição" />
        <span className="chip gold" title="XP ganho">
          <Zap size={14} /> {xp.current}
        </span>
      </div>

      <div className="lesson-body">
        <div className="lesson-inner" key={`${ex.id}-${pos}`}>
          {isRetry && (
            <div className="chip red" style={{ marginBottom: 8 }}>
              <Flag size={13} /> De novo: este você errou antes
            </div>
          )}
          {renderExercise({ ex, checked, verdict, answer, setAnswer, onSubmit: () => (checked ? next() : check()), hinted })}
        </div>
      </div>

      <div className={`lesson-foot ${footTone}`}>
        <div className="foot-inner">
          {checked && verdict ? (
            <Feedback ex={ex} v={verdict} hinted={hinted} />
          ) : (
            <div className="row" style={{ flex: 1 }}>
              {scored && hasHint(ex) && context !== "test" && (
                <button className="btn ghost" onClick={() => setHinted(true)} disabled={hinted}>
                  <Lightbulb size={18} /> Dica
                </button>
              )}
              {ex.kind === "speak" && (
                <button className="btn ghost" onClick={next}>
                  <SkipForward size={18} /> Agora não posso falar
                </button>
              )}
            </div>
          )}
          <div className="foot-actions">
            {checked ? (
              <button className={`btn lg lesson-cta ${verdict?.ok ? "ok" : "bad"}`} onClick={next} autoFocus>
                Continuar
              </button>
            ) : (
              <button className="btn lg primary lesson-cta" onClick={check} disabled={scored && !ready(ex, answer)}>
                {scored ? "Verificar" : "Continuar"}
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmExit && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setConfirmExit(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <h2>Sair agora?</h2>
            <p className="muted">As respostas já dadas ficam salvas na sua revisão, mas a lição não será concluída.</p>
            <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn" onClick={() => setConfirmExit(false)}>
                Continuar estudando
              </button>
              <button
                className="btn bad"
                onClick={() => {
                  tick();
                  update((s) => addStudyTime(s, Math.round(clock.current.seconds), Date.now()));
                  onExit();
                }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Feedback({ ex, v, hinted }: { ex: Exercise; v: Verdict; hinted: boolean }) {
  const showExpected = !v.ok && v.expected && ex.kind !== "pairs";
  const ruExpected = /[Ѐ-ӿ]/.test(v.expected);
  return (
    <div className="feedback" role="status">
      <div className="feedback-title">
        {v.ok ? <Check size={22} /> : <X size={22} />}
        {v.ok ? (hinted ? "Certo, com dica" : v.note ? "Certo!" : pickPraise()) : "Não foi dessa vez"}
      </div>
      {showExpected && (
        <p>
          <span className="small muted">Resposta certa: </span>
          {ruExpected ? <Ru text={v.expected} /> : <b>{v.expected}</b>}
        </p>
      )}
      {v.ok && ex.kind !== "choice" && ruExpected && ex.kind !== "spell" && (
        <p>
          <Ru text={v.expected} />
        </p>
      )}
      {v.note && <p className="small">{v.note}</p>}
      {v.why && (
        <p className="small">
          <Rich text={v.why} />
        </p>
      )}
      {"pt" in ex && ex.pt && ex.kind !== "type" && ex.kind !== "spell" && <p className="small muted">«{ex.pt}»</p>}
      {ex.kind === "build" && ex.audioOnly && ex.audio && (
        <div style={{ marginTop: 6 }}>
          <WordByWord text={ex.audio} />
        </div>
      )}
    </div>
  );
}

const PRAISE = ["Isso!", "Muito bem!", "Perfeito!", "Отлично!", "Certo!", "Хорошо!"];
function pickPraise() {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

export function DefaultResult({ r, onExit }: { r: RunResult; onExit: () => void }) {
  return (
    <div className="result">
      <h1>Sessão concluída</h1>
      <ResultStats r={r} />
      <button className="btn lg primary" onClick={onExit}>
        Continuar
      </button>
    </div>
  );
}

export function ResultStats({ r }: { r: RunResult }) {
  const mins = Math.max(1, Math.round(r.seconds / 60));
  return (
    <div className="result-stats">
      <div className="result-stat" style={{ borderColor: "var(--green)" }}>
        <span className="small muted">Acerto</span>
        <b style={{ color: "var(--green)" }}>{Math.round(r.accuracy * 100)}%</b>
      </div>
      <div className="result-stat" style={{ borderColor: "var(--gold)" }}>
        <span className="small muted">XP</span>
        <b style={{ color: "var(--gold)" }}>+{r.xp}</b>
      </div>
      <div className="result-stat" style={{ borderColor: "var(--blue)" }}>
        <span className="small muted">Tempo</span>
        <b style={{ color: "var(--blue)" }}>{mins} min</b>
      </div>
    </div>
  );
}

/** Lista dos itens errados, com tradução. */
export function MissedList({ ids }: { ids: string[] }) {
  const items = ids.slice(0, 12).map(itemLabel);
  if (!items.length) return null;
  return (
    <div className="card tight" style={{ width: "100%", textAlign: "left" }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>
        Para revisar
      </div>
      <div className="list">
        {items.map((it, i) => (
          <div key={i} className="list-item">
            <span className="chip">{it.kind}</span>
            {it.ru && <Ru text={it.ru} />}
            <span className="muted small">{it.pt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function seenWords(ids: string[]): string[] {
  return ids.filter((i) => i.startsWith("W:")).map((i) => {
    try {
      return lex(i.slice(2)).ru;
    } catch {
      return i;
    }
  });
}

export { getState };
