// Trilha de aprendizado: mundos → unidades → lições, com testes de domínio e mundos planejados.

import { useEffect, useRef } from "react";
import { Award, BookOpen, Check, Crown, Lock, MapPin, Sparkles, Star, Zap } from "lucide-react";
import { useStudent } from "../store";
import { WORLDS, place } from "../content";
import { Bar } from "../components/ui";
import { Ru } from "../components/ru";
import { lessonPassed, lessonUnlocked, nextStep, unitComplete, unitTestKind, unitUnlocked } from "../core/progress";

export function LearnPage() {
  const s = useStudent();
  const step = nextStep(s);
  const currentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="page narrow">
      <div className="page-head">
        <div>
          <h1>Trilha de aprendizado</h1>
          <p className="muted">Cada unidade termina com um teste de domínio. Passar nele libera a próxima — e, se você já sabe o conteúdo, pode testar para pular.</p>
        </div>
      </div>

      {WORLDS.map((w) => {
        const planned = w.units.length === 0;
        const open = !planned && unitUnlocked(s, w.units[0].id);
        const done = w.units.filter((u) => unitComplete(s, u.id)).length;
        return (
          <section key={w.id} className={`world ${open ? "" : "locked"}`} aria-labelledby={`${w.id}-title`}>
            <div className="world-head" style={{ background: `linear-gradient(135deg, ${w.color}, color-mix(in srgb, ${w.color} 70%, #000))` }}>
              <div className="eyebrow" style={{ color: "rgba(255,255,255,.8)" }}>
                Mundo {w.n} · {w.level}
              </div>
              <h2 id={`${w.id}-title`} style={{ color: "#fff", marginTop: 4 }}>
                {w.title}
              </h2>
              <Ru text={w.ru} className="" />
              <p style={{ margin: "8px 0 0", opacity: 0.92, maxWidth: 520 }}>{w.description}</p>
              {!planned && (
                <div style={{ marginTop: 12, maxWidth: 320 }}>
                  <div className="bar thin" style={{ background: "rgba(255,255,255,.25)" }}>
                    <span style={{ width: `${(done / w.units.length) * 100}%`, background: "#fff" }} />
                  </div>
                  <div className="xs" style={{ marginTop: 4, opacity: 0.85 }}>
                    {done} de {w.units.length} unidades concluídas
                  </div>
                </div>
              )}
            </div>

            {planned && (
              <div className="card" style={{ marginTop: 14 }}>
                <div className="row">
                  <Lock size={18} color="var(--faint)" />
                  <b>Em construção</b>
                </div>
                <p className="small muted" style={{ margin: "6px 0 0" }}>
                  Este mundo ainda não tem lições. Tópicos planejados:
                </p>
                <ul className="planned-list small">
                  {w.planned?.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {w.units.map((u) => {
              const uOpen = unitUnlocked(s, u.id);
              const complete = unitComplete(s, u.id);
              const passedCount = u.lessons.filter((l) => lessonPassed(s, l.id)).length;
              const testKind = unitTestKind(s, u.id);
              const pl = u.place ? place(u.place) : undefined;
              return (
                <div key={u.id} className="unit">
                  <div className="unit-head">
                    <div>
                      <h3>
                        {complete && <Check size={18} color="var(--green)" style={{ verticalAlign: "-3px" }} />} {u.title}
                      </h3>
                      <div className="small muted ru-text">
                        <Ru text={u.subtitle} />
                      </div>
                    </div>
                    <div className="row">
                      {pl && (
                        <span className="chip" title="Lugar da história liberado ao terminar">
                          <MapPin size={12} /> {pl.name}
                        </span>
                      )}
                      <span className="chip">
                        {passedCount}/{u.lessons.length}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: "8px 4px 0" }}>
                    <Bar value={passedCount / u.lessons.length} tone="green" thin />
                  </div>
                  <div className="path">
                    {u.lessons.map((l, i) => {
                      const unlocked = uOpen && lessonUnlocked(s, l.id);
                      const passed = lessonPassed(s, l.id);
                      const gold = !!s.lessons[l.id]?.gold;
                      const current = step.kind === "lesson" && step.lessonId === l.id;
                      const offset = Math.sin(i * 1.2) * 70;
                      return (
                        <div key={l.id} className="node-wrap" style={{ transform: `translateX(${offset}px)` }} ref={current ? currentRef : undefined}>
                          <button
                            className={`node ${unlocked ? "" : "locked"} ${passed ? "done" : ""} ${current ? "current" : ""}`}
                            style={{ ["--node" as string]: passed ? "var(--gold)" : w.color }}
                            disabled={!unlocked}
                            onClick={() => (window.location.hash = `/licao/${l.id}`)}
                            aria-label={`${l.title}${passed ? ", concluída" : unlocked ? "" : ", bloqueada"}`}
                          >
                            {!unlocked ? <Lock size={26} /> : passed ? <Star size={30} fill="currentColor" /> : l.letters?.length ? <span className="ru" style={{ fontSize: "1.6rem", fontWeight: 700 }}>{l.letters[0]}</span> : <BookOpen size={28} />}
                            {gold && (
                              <span className="node-crown" title="Dominada (90%+)">
                                <Crown size={14} />
                              </span>
                            )}
                          </button>
                          <div className="node-label">{l.title}</div>
                          {current && (
                            <span className="chip red">
                              <Zap size={12} /> Próxima
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <div className="node-wrap" ref={step.kind === "test" && step.unitId === u.id ? currentRef : undefined}>
                      <button
                        className={`node test ${testKind ? "" : "locked"} ${complete ? "done" : ""} ${step.kind === "test" && step.unitId === u.id ? "current" : ""}`}
                        style={{ ["--node" as string]: complete ? "var(--gold)" : "var(--violet)" }}
                        disabled={!testKind}
                        onClick={() => (window.location.hash = `/teste/${u.id}`)}
                        aria-label={`Teste da unidade ${u.title}`}
                      >
                        {complete ? <Award size={30} /> : testKind ? <Award size={30} /> : <Lock size={26} />}
                      </button>
                      <div className="node-label">
                        {complete ? "Unidade concluída" : testKind === "skip" ? "Testar para pular" : "Teste de domínio"}
                        {s.tests[u.id] && !complete && <div className="xs muted">melhor: {Math.round(s.tests[u.id].best * 100)}%</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
      <div className="card row">
        <Sparkles color="var(--gold)" />
        <div className="small">Novos mundos e unidades entram aqui sem apagar o seu progresso.</div>
      </div>
    </div>
  );
}
