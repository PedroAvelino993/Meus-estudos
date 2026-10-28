// Telas que executam lições, testes, revisões e práticas com o LessonPlayer.

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, BookOpen, Lock, RefreshCw, RotateCcw, Sparkles } from "lucide-react";
import { LessonPlayer, MissedList, ResultStats, type RunResult } from "../components/LessonPlayer";
import { Confetti, Ring } from "../components/ui";
import { Ru } from "../components/ru";
import { getState, update, useStudent } from "../store";
import { navigate } from "../router";
import { hasRussianVoice, voicesReady } from "../audio/speech";
import { buildGrammarPractice, buildLesson, buildReview, buildUnitTest, itemL } from "../core/generate";
import { finishLesson, finishTest, GOLD, PASS, TEST_PASS } from "../core/state";
import { dueItems, newItem, weakItems, type ItemState } from "../core/srs";
import { SKIP_PASS, chapterAvailable, lessonUnlocked, nextStep, unitTestKind, itemLabel } from "../core/progress";
import { ALL_LESSONS, CHAPTERS, grammar, lessonRef, letter as letterOf, unitRef } from "../content";
import type { Exercise } from "../core/types";

/** Espera as vozes do aparelho para decidir se há exercícios de áudio. */
function useAudioDecision(): boolean | null {
  const [audio, setAudio] = useState<boolean | null>(hasRussianVoice() ? true : null);
  useEffect(() => {
    if (audio !== null) return;
    let alive = true;
    void voicesReady().then(() => alive && setAudio(hasRussianVoice()));
    return () => {
      alive = false;
    };
  }, [audio]);
  return audio;
}

function Loading() {
  return (
    <div className="lesson">
      <div className="lesson-top">
        <div className="skeleton" style={{ height: 14, flex: 1 }} />
      </div>
      <div className="lesson-body">
        <div className="lesson-inner stack">
          <div className="skeleton" style={{ height: 32, width: "60%" }} />
          <div className="skeleton" style={{ height: 160 }} />
          <div className="skeleton" style={{ height: 56 }} />
          <div className="skeleton" style={{ height: 56 }} />
        </div>
      </div>
    </div>
  );
}

function Blocked({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="lesson">
      <div className="lesson-body">
        <div className="lesson-inner empty">
          <Lock size={40} />
          <h2 style={{ color: "var(--text)" }}>{title}</h2>
          <p>{children}</p>
          <a className="btn primary" href="#/aprender">
            Ir para a trilha
          </a>
        </div>
      </div>
    </div>
  );
}

/** Itens para misturar no fim de uma lição: vencidos e difíceis, exceto os da própria lição. */
function reviewMix(exclude: string[], n: number): ItemState[] {
  const s = getState();
  const now = Date.now();
  const due = dueItems(s.items, now, 30).filter((i) => !exclude.includes(i.id));
  const weak = weakItems(s.items, 10).filter((i) => !exclude.includes(i.id) && !due.includes(i));
  return [...due, ...weak].slice(0, n);
}

function goNext() {
  const n = nextStep(getState());
  if (n.kind === "lesson") navigate(`/licao/${n.lessonId}`, true);
  else if (n.kind === "test") navigate(`/teste/${n.unitId}`, true);
  else navigate("/aprender", true);
}

function startRecovery(ids: string[]) {
  try {
    sessionStorage.setItem("russky:recovery", JSON.stringify(ids));
  } catch {
    /* sem sessionStorage: a recuperação usa os itens fracos */
  }
  navigate("/praticar/recuperacao");
}

// ---------- Lição ----------

export function LessonRoute({ id }: { id: string }) {
  const s = useStudent();
  const audio = useAudioDecision();
  const ref = lessonRef(id);
  const [seed] = useState(() => Date.now());
  const exercises = useMemo(() => {
    if (!ref || audio === null) return null;
    const own = [...(ref.lesson.letters ?? []).map(itemL), ...(ref.lesson.words ?? []).map((w) => `W:${w}`)];
    return buildLesson(id, { seed, audio, review: reviewMix(own, ref.lesson.practice ?? 2) });
  }, [id, audio]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ref) return <Blocked title="Lição não encontrada">Ela pode ter mudado de lugar na trilha.</Blocked>;
  if (!lessonUnlocked(s, id)) return <Blocked title="Lição bloqueada">Conclua as lições anteriores (ou passe no teste da unidade anterior) para chegar aqui.</Blocked>;
  if (!exercises) return <Loading />;
  const replay = !!s.lessons[id]?.gold;

  return (
    <LessonPlayer
      title={ref.lesson.title}
      exercises={exercises}
      context="lesson"
      replay={replay}
      onExit={() => navigate("/aprender")}
      onFinish={(r) => update((st) => finishLesson(st, id, r.accuracy, Date.now()).state)}
      result={(r) => <LessonResult r={r} lessonId={id} />}
    />
  );
}

function LessonResult({ r, lessonId }: { r: RunResult; lessonId: string }) {
  const ref = lessonRef(lessonId)!;
  const passed = r.accuracy >= PASS;
  const gold = r.accuracy >= GOLD;
  const words = ref.lesson.words ?? [];
  const letters = ref.lesson.letters ?? [];
  const newChapter = CHAPTERS.find((c) => chapterAvailable(getState(), c.id) && !getState().chapters[c.id]?.done);
  return (
    <div className="result">
      {passed && <Confetti count={gold ? 90 : 50} />}
      <Ring value={r.accuracy} size={132} stroke={12} color={passed ? "var(--green)" : "var(--gold)"} sub="acerto" />
      <div>
        <h1>{gold ? "Lição dominada!" : passed ? "Lição concluída!" : "Quase lá"}</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          {gold
            ? "Excelente: mais de 90% de acerto na primeira tentativa."
            : passed
              ? "Você passou. Os itens com erro vão voltar na revisão."
              : `Para liberar a próxima lição é preciso ${Math.round(PASS * 100)}% de acerto. Revise os erros e tente de novo — sem pressa.`}
        </p>
      </div>
      <ResultStats r={r} />
      {(letters.length > 0 || words.length > 0) && (
        <div className="card tight" style={{ width: "100%" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Nesta lição
          </div>
          <div className="row wrap" style={{ justifyContent: "center" }}>
            {letters.map((L) => (
              <span key={L} className="chip red ru" style={{ fontSize: "1.1rem" }}>
                {L}
                {L.toLowerCase()}
              </span>
            ))}
            {words.slice(0, 12).map((w) => (
              <span key={w} className="chip">
                <Ru text={itemLabel(`W:${w}`).ru} />
              </span>
            ))}
          </div>
        </div>
      )}
      <MissedList ids={r.missed} />
      {passed && newChapter && (
        <a className="card tight row" href={`#/capitulo/${newChapter.id}`} style={{ width: "100%", textDecoration: "none", color: "inherit" }}>
          <Sparkles color="var(--gold)" /> <b>Novo capítulo da história: {newChapter.title}</b>
        </a>
      )}
      <div className="row wrap" style={{ justifyContent: "center" }}>
        {passed ? (
          <>
            <a className="btn" href="#/aprender">
              Trilha
            </a>
            <button className="btn lg primary" onClick={goNext}>
              Continuar <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            {r.missed.length > 0 && (
              <button className="btn lg" onClick={() => startRecovery(r.missed)}>
                <RotateCcw size={18} /> Revisar os erros
              </button>
            )}
            <button className="btn lg primary" onClick={() => window.location.reload()}>
              <RefreshCw size={18} /> Tentar de novo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Teste de unidade ----------

export function TestRoute({ unitId }: { unitId: string }) {
  const s = useStudent();
  const audio = useAudioDecision();
  const ref = unitRef(unitId);
  const kind = unitTestKind(s, unitId);
  const [started] = useState(kind);
  const [seed] = useState(() => Date.now());
  const exercises = useMemo(() => (ref && audio !== null ? buildUnitTest(unitId, seed, audio) : null), [unitId, audio]); // eslint-disable-line react-hooks/exhaustive-deps
  const [intro, setIntro] = useState(true);
  if (!ref) return <Blocked title="Teste não encontrado">Volte para a trilha.</Blocked>;
  if (!started) return <Blocked title="Teste bloqueado">Conclua a unidade anterior primeiro.</Blocked>;
  if (!exercises) return <Loading />;
  const threshold = started === "skip" ? SKIP_PASS : TEST_PASS;

  if (intro) {
    return (
      <div className="lesson">
        <div className="lesson-body">
          <div className="lesson-inner result">
            <div className="stat-icon" style={{ width: 72, height: 72, borderRadius: 22, background: "var(--violet-soft)", color: "var(--violet)" }}>
              <Award size={36} />
            </div>
            <h1>{started === "skip" ? "Testar para pular" : "Teste de domínio"}</h1>
            <p className="muted">
              {ref.unit.title} · {exercises.length} questões, sem dicas. É preciso {Math.round(threshold * 100)}% para {started === "skip" ? "pular a unidade" : "concluir a unidade e liberar a próxima"}.
              {started === "skip" && " Se você já sabe este conteúdo, este é o caminho rápido — os pré-requisitos continuam valendo."}
            </p>
            <div className="row">
              <a className="btn" href="#/aprender">
                Agora não
              </a>
              <button className="btn lg primary" onClick={() => setIntro(false)}>
                Começar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LessonPlayer
      title={`Teste · ${ref.unit.title}`}
      exercises={exercises}
      context="test"
      onExit={() => navigate("/aprender")}
      onFinish={(r) => update((st) => finishTest(st, unitId, r.accuracy, r.missed, Date.now(), threshold).state)}
      result={(r) => <TestResult r={r} unitId={unitId} threshold={threshold} exercises={exercises} />}
    />
  );
}

function TestResult({ r, unitId, threshold, exercises }: { r: RunResult; unitId: string; threshold: number; exercises: Exercise[] }) {
  const ref = unitRef(unitId)!;
  const passed = r.accuracy >= threshold;
  // Lições que contêm o que foi errado
  const lessonsToRedo = ref.unit.lessons.filter((l) => r.missed.some((m) => (l.words ?? []).some((w) => m === `W:${w}`) || (l.letters ?? []).some((L) => m === itemL(L))));
  const kinds = new Map<string, number>();
  for (const ex of exercises) if ("skill" in ex) kinds.set(ex.skill, (kinds.get(ex.skill) ?? 0) + 1);
  return (
    <div className="result">
      {passed && <Confetti count={100} />}
      <Ring value={r.accuracy} size={132} stroke={12} color={passed ? "var(--violet)" : "var(--gold)"} sub="acerto" />
      <div>
        <h1>{passed ? "Unidade concluída!" : "Ainda não"}</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          {passed ? `Você mostrou domínio de «${ref.unit.title}». A próxima unidade foi liberada.` : `Faltou pouco: o mínimo é ${Math.round(threshold * 100)}%. Abaixo está o que precisa de reforço.`}
        </p>
      </div>
      <ResultStats r={r} />
      <MissedList ids={r.missed} />
      {!passed && lessonsToRedo.length > 0 && (
        <div className="card tight" style={{ width: "100%", textAlign: "left" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            Recomendado antes de tentar de novo
          </div>
          {lessonsToRedo.map((l) => (
            <a key={l.id} href={`#/licao/${l.id}`} className="list-item">
              <BookOpen size={18} color="var(--blue)" /> {l.title}
            </a>
          ))}
        </div>
      )}
      <div className="row wrap" style={{ justifyContent: "center" }}>
        {passed ? (
          <button className="btn lg primary" onClick={goNext}>
            Continuar <ArrowRight size={18} />
          </button>
        ) : (
          <>
            {r.missed.length > 0 && (
              <button className="btn lg primary" onClick={() => startRecovery(r.missed)}>
                <RotateCcw size={18} /> Revisão de recuperação
              </button>
            )}
            <a className="btn lg" href="#/aprender">
              Voltar à trilha
            </a>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Revisões e práticas ----------

/** Monta a fila da Revisão diária: vencidos primeiro; se forem poucos, completa com os mais fracos. */
export function dailyReviewItems(limit = 15): { items: ItemState[]; extra: boolean } {
  const s = getState();
  const now = Date.now();
  const due = dueItems(s.items, now, limit);
  if (due.length >= 5) return { items: due, extra: false };
  const seen = Object.values(s.items).filter((i) => i.seen > 0 && !due.includes(i));
  const filler = seen.sort((a, b) => a.interval - b.interval || b.wrong - a.wrong).slice(0, Math.max(0, 10 - due.length));
  return { items: [...due, ...filler], extra: filler.length > 0 };
}

function PracticeRun({ title, build, onDoneHref = "/revisao", context = "review" }: { title: string; build: (audio: boolean) => Exercise[]; onDoneHref?: string; context?: "review" | "practice" }) {
  const audio = useAudioDecision();
  const exercises = useMemo(() => (audio === null ? null : build(audio)), [audio]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!exercises) return <Loading />;
  return (
    <LessonPlayer
      title={title}
      exercises={exercises}
      context={context}
      onExit={() => navigate(onDoneHref)}
      onFinish={() => undefined}
      result={(r) => (
        <div className="result">
          {r.accuracy >= 0.8 && <Confetti count={40} />}
          <Ring value={r.accuracy} size={120} stroke={11} color="var(--teal)" sub="acerto" />
          <h1>{r.accuracy >= 0.8 ? "Memória em dia!" : "Boa revisão"}</h1>
          <p className="muted">Os itens com erro voltam em breve; os acertos foram reagendados para mais tarde.</p>
          <ResultStats r={r} />
          <MissedList ids={r.missed} />
          <div className="row">
            <a className="btn lg primary" href={`#${onDoneHref}`}>
              Concluir
            </a>
          </div>
        </div>
      )}
    />
  );
}

export function ReviewRoute() {
  const [seed] = useState(() => Date.now());
  return <PracticeRun title="Revisão diária" build={(audio) => buildReview(dailyReviewItems().items, seed, audio)} />;
}

export function RecoveryRoute() {
  const [seed] = useState(() => Date.now());
  return (
    <PracticeRun
      title="Revisão de recuperação"
      onDoneHref="/aprender"
      build={(audio) => {
        let ids: string[] = [];
        try {
          ids = JSON.parse(sessionStorage.getItem("russky:recovery") ?? "[]");
        } catch {
          ids = [];
        }
        const s = getState();
        const items = (ids.length ? ids : weakItems(s.items, 8).map((i) => i.id)).map((id) => s.items[id] ?? { ...newItem(id, Date.now()), seen: 1 });
        // cada item duas vezes, em formas diferentes
        return buildReview([...items, ...items], seed, audio);
      }}
    />
  );
}

export function GrammarPracticeRoute({ id }: { id: string }) {
  const [seed] = useState(() => Date.now());
  const g = grammar(id);
  if (!g) return <Blocked title="Tópico não encontrado">Volte para a Gramática.</Blocked>;
  return <PracticeRun title={g.title} context="practice" onDoneHref={`/gramatica/${id}`} build={(audio) => buildGrammarPractice(id, seed, audio)} />;
}

export function LetterPracticeRoute({ letter }: { letter: string }) {
  const [seed] = useState(() => Date.now());
  const l = letterOf(letter);
  const s = useStudent();
  if (!l) return <Blocked title="Letra não encontrada">Volte para o Alfabeto.</Blocked>;
  const firstLesson = ALL_LESSONS.find((r) => r.lesson.letters?.includes(l.upper));
  if (firstLesson && !lessonUnlocked(s, firstLesson.lesson.id) && !s.items[itemL(l.upper)]) {
    return <Blocked title="Letra ainda não estudada">Ela aparece na lição «{firstLesson.lesson.title}».</Blocked>;
  }
  return (
    <PracticeRun
      title={`Treinar ${l.upper} ${l.lower}`}
      context="practice"
      onDoneHref={`/alfabeto/${encodeURIComponent(l.upper)}`}
      build={(audio) => {
        const st = getState().items[itemL(l.upper)] ?? { ...newItem(itemL(l.upper), Date.now()), seen: 1 };
        const teach: Exercise = { kind: "teach-letter", id: `teach-${l.upper}`, letter: l.upper, items: [itemL(l.upper)] };
        return [teach, ...buildReview([st, st, st, st], seed, audio)];
      }}
    />
  );
}
