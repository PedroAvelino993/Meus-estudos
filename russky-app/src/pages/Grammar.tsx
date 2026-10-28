// Gramática: tópicos com explicação, exemplos, comparação com o português, erros comuns e prática.

import { ArrowLeft, BookOpen, Dumbbell, Lock } from "lucide-react";
import { useStudent } from "../store";
import { ALL_LESSONS, GRAMMAR, grammar } from "../content";
import { GrammarBody } from "../components/exercises";
import { lessonPassed, lessonUnlocked } from "../core/progress";
import { mastery, MASTERY_LABEL } from "../core/srs";

function firstLessonWith(id: string) {
  return ALL_LESSONS.find((r) => r.lesson.grammar?.includes(id) || r.lesson.steps.some((s) => s.t === "grammar" && s.g === id));
}

export function GrammarPage() {
  const s = useStudent();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Gramática</h1>
          <p className="muted">Cada tópico aparece na trilha quando você precisa dele. Aqui ficam todos para consultar e praticar de novo.</p>
        </div>
      </div>
      <div className="grid auto">
        {GRAMMAR.map((g) => {
          const lesson = firstLessonWith(g.id);
          const open = !lesson || lessonUnlocked(s, lesson.lesson.id) || lessonPassed(s, lesson.lesson.id);
          const m = mastery(s.items[`G:${g.id}`]);
          return (
            <a key={g.id} href={open ? `#/gramatica/${g.id}` : undefined} className={`card ${open ? "hover" : ""}`} style={{ textDecoration: "none", color: "inherit", opacity: open ? 1 : 0.6 }} aria-disabled={!open}>
              <div className="row between">
                <span className="chip violet">{g.level}</span>
                {open ? (
                  <span className="xs muted">
                    <span className={`mastery-dot m-${m}`} style={{ display: "inline-block", marginRight: 4 }} />
                    {MASTERY_LABEL[m]}
                  </span>
                ) : (
                  <Lock size={16} color="var(--faint)" />
                )}
              </div>
              <h3 style={{ marginTop: 10 }}>{g.title}</h3>
              <p className="small muted" style={{ margin: "6px 0 0" }}>
                {g.summary}
              </p>
              {lesson && <div className="xs faint" style={{ marginTop: 8 }}>Na trilha: {lesson.lesson.title}</div>}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function GrammarTopicPage({ id }: { id: string }) {
  const g = grammar(id);
  if (!g) return <div className="page narrow empty">Tópico não encontrado.</div>;
  const lesson = firstLessonWith(id);
  return (
    <div className="page narrow stack lg">
      <a className="btn ghost sm" href="#/gramatica" style={{ alignSelf: "flex-start" }}>
        <ArrowLeft size={16} /> Gramática
      </a>
      <GrammarBody id={id} />
      <div className="card row wrap between">
        <div>
          <h3>Praticar este tópico</h3>
          <p className="small muted" style={{ margin: 0 }}>
            {g.practice.length} exercícios com explicação depois de cada resposta.
          </p>
        </div>
        <div className="row">
          {lesson && (
            <a className="btn" href={`#/licao/${lesson.lesson.id}`}>
              <BookOpen size={16} /> Lição
            </a>
          )}
          <a className="btn primary" href={`#/praticar/gramatica/${id}`}>
            <Dumbbell size={16} /> Praticar
          </a>
        </div>
      </div>
    </div>
  );
}
