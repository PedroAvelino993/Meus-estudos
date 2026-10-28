// História: mapa de Svetlorechensk, capítulos com cenas, placas para ler, escolhas e missões de conversa.

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Coffee, GraduationCap, House, Landmark, Lock, MessagesSquare, Play, ShoppingBasket, Sparkles, TrainFront, TramFront, Trees, X } from "lucide-react";
import { useStudent, update } from "../store";
import { CHAPTERS, CITY, PLACES, character, conversation, place, unitRef } from "../content";
import { Portrait } from "../components/Portrait";
import { AudioButton, Ru } from "../components/ru";
import { Confetti, Modal } from "../components/ui";
import { chapterAvailable, placeUnlocked } from "../core/progress";
import { finishChapter } from "../core/state";
import type { Flags } from "../core/convo";
import type { Panel } from "../content/story";
import { navigate } from "../router";
import { sfx } from "../audio/sfx";

const ICONS: Record<string, typeof Coffee> = {
  vokzal: TrainFront,
  universitet: GraduationCap,
  park: Trees,
  kvartira: House,
  kafe: Coffee,
  metro: TramFront,
  rynok: ShoppingBasket,
  knizhny: BookOpen,
  muzey: Landmark,
};

function CityDecor() {
  return (
    <svg className="decor" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden>
      <path d="M-5 58 C 25 50, 40 66, 70 56 S 120 40, 165 50 L165 62 C 120 52, 100 70, 70 68 S 25 62, -5 70 Z" fill="#7fb3d9" opacity="0.55" />
      <ellipse cx="48" cy="34" rx="18" ry="9" fill="#7cbf7a" opacity="0.45" />
      <ellipse cx="128" cy="76" rx="16" ry="7" fill="#7cbf7a" opacity="0.35" />
      <g stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.4" fill="none">
        <path d="M0 20 H160" />
        <path d="M60 0 V90" />
        <path d="M110 0 C 108 30, 112 60, 110 90" />
        <path d="M0 82 C 40 80, 90 86, 160 80" />
      </g>
      <g fill="#c9b79a" opacity="0.5">
        {[
          [8, 8], [18, 10], [72, 6], [86, 8], [96, 30], [122, 12], [140, 24], [20, 30], [76, 40], [140, 40], [30, 78], [92, 74],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="7" height="6" rx="1" />
        ))}
      </g>
    </svg>
  );
}

export function StoryPage() {
  const s = useStudent();
  const [sel, setSel] = useState<string | null>(null);
  const p = sel ? place(sel) : null;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>
            <Ru text={CITY.ru} />
          </h1>
          <p className="muted">Um semestre de intercâmbio numa cidade às margens do rio Svetlaia. Cada unidade concluída abre um lugar novo e um novo capítulo.</p>
        </div>
      </div>

      <div className="city-map" role="group" aria-label="Mapa da cidade">
        <CityDecor />
        {PLACES.map((pl) => {
          const open = placeUnlocked(s, pl.id);
          const Icon = ICONS[pl.id] ?? Landmark;
          return (
            <button key={pl.id} className={`pin ${open ? "" : "locked"}`} style={{ left: `${pl.x}%`, top: `${pl.y}%`, ["--pin" as string]: pl.color }} onClick={() => setSel(pl.id)} aria-label={`${pl.name}${open ? "" : " (bloqueado)"}`}>
              <span className="pin-dot">{open ? <Icon size={16} /> : <Lock size={14} />}</span>
              <span className="pin-label">{pl.name}</span>
            </button>
          );
        })}
      </div>

      <h2 style={{ margin: "28px 0 12px" }}>Capítulos</h2>
      <div className="stack">
        {CHAPTERS.map((ch) => {
          const ok = chapterAvailable(s, ch.id);
          const done = !!s.chapters[ch.id]?.done;
          const req = ch.requires.map((u) => unitRef(u)?.unit.title).filter(Boolean);
          return (
            <div key={ch.id} className="card row wrap" style={{ opacity: ok || done ? 1 : 0.65 }}>
              <div className="stat-icon" style={{ background: done ? "var(--green-soft)" : ok ? "var(--gold-soft)" : "var(--bg-2)", color: done ? "var(--green)" : ok ? "var(--gold)" : "var(--faint)", width: 48, height: 48 }}>
                {done ? <Check size={22} /> : ok ? <Sparkles size={22} /> : <Lock size={20} />}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="eyebrow">
                  Capítulo {ch.n} · {place(ch.place)?.name}
                </div>
                <h3>
                  {ch.title} · <Ru text={ch.ru} />
                </h3>
                <div className="small muted">{ok || done ? ch.summary : `Libera ao terminar: ${req.join(", ")}${req.length ? " (e o capítulo anterior)" : ""}`}</div>
              </div>
              {(ok || done) && (
                <a className={`btn ${done ? "" : "primary"}`} href={`#/capitulo/${ch.id}`}>
                  {done ? (
                    <>
                      <Play size={16} /> Rever
                    </>
                  ) : (
                    <>
                      Jogar <ArrowRight size={16} />
                    </>
                  )}
                </a>
              )}
            </div>
          );
        })}
        <div className="card row">
          <Lock size={18} color="var(--faint)" />
          <span className="small muted">Os próximos capítulos (livraria, museu) chegam com os Mundos 6 e 7.</span>
        </div>
      </div>

      {p && (
        <Modal title={p.name} onClose={() => setSel(null)}>
          <Ru text={p.ru} className="teach-word" />
          <p>{p.description}</p>
          {placeUnlocked(s, p.id) ? (
            <div className="stack">
              {CHAPTERS.filter((c) => c.place === p.id).map((c) => (
                <a key={c.id} className="list-item" href={chapterAvailable(s, c.id) || s.chapters[c.id]?.done ? `#/capitulo/${c.id}` : undefined}>
                  <BookOpen size={16} /> Capítulo {c.n}: {c.title}
                </a>
              ))}
            </div>
          ) : (
            <div className="notice warn">
              <Lock size={16} />
              {p.unlockedBy === "future" ? "Este lugar chega numa próxima atualização." : `Libera ao terminar a unidade «${unitRef(p.unlockedBy ?? "")?.unit.title}».`}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ---------- Capítulo ----------

export function ChapterPage({ id }: { id: string }) {
  const s = useStudent();
  const ch = CHAPTERS.find((c) => c.id === id);
  const key = `russky:chapter:${id}`;
  const [i, setI] = useState(() => {
    try {
      return Number(sessionStorage.getItem(key) ?? 0);
    } catch {
      return 0;
    }
  });
  const [flags, setFlags] = useState<Flags>({});
  const [answer, setAnswer] = useState<number | null>(null);
  const [reply, setReply] = useState<{ who: string; ru: string; pt: string } | null>(null);
  const [finished, setFinished] = useState<number | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(key, String(i));
    } catch {
      /* sem sessionStorage */
    }
  }, [i, key]);

  const pl = useMemo(() => (ch ? place(ch.place) : undefined), [ch]);
  if (!ch) return <div className="page narrow empty">Capítulo não encontrado.</div>;
  const available = chapterAvailable(s, id) || !!s.chapters[id]?.done;
  if (!available) {
    return (
      <div className="lesson">
        <div className="lesson-body">
          <div className="lesson-inner empty">
            <Lock size={40} />
            <h2>Capítulo bloqueado</h2>
            <a className="btn primary" href="#/historia">
              Voltar
            </a>
          </div>
        </div>
      </div>
    );
  }

  const panel: Panel | undefined = ch.panels[i];
  const last = i >= ch.panels.length - 1;
  const missionDone = panel?.k === "mission" && (s.convos[panel.convo]?.completed ?? 0) > 0;
  const canNext = !panel ? false : panel.k === "sign" ? answer === panel.answer : panel.k === "choice" ? answer !== null : panel.k === "mission" ? missionDone : true;

  const advance = () => {
    setAnswer(null);
    setReply(null);
    if (last) {
      let xp = 0;
      update((st) => {
        const r = finishChapter(st, ch.id, Object.fromEntries(Object.entries(flags).map(([k, v]) => [`story.${k}`, v])), ch.reward.xp, Date.now());
        xp = r.xp;
        return r.state;
      });
      try {
        sessionStorage.removeItem(key);
      } catch {
        /* nada */
      }
      sfx.complete();
      setFinished(xp);
      return;
    }
    setI(i + 1);
  };

  if (finished !== null) {
    return (
      <div className="lesson">
        <div className="lesson-body">
          <div className="lesson-inner result">
            <Confetti count={70} />
            <div className="stat-icon" style={{ width: 80, height: 80, borderRadius: 24, background: "var(--gold-soft)", color: "var(--gold)" }}>
              <Sparkles size={40} />
            </div>
            <h1>Fim do capítulo {ch.n}</h1>
            <p className="muted">{ch.reward.text}</p>
            {finished > 0 && <span className="chip gold">+{finished} XP</span>}
            <div className="row">
              <a className="btn" href="#/historia">
                Mapa da cidade
              </a>
              <a className="btn primary" href="#/">
                Início
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const speaker = panel?.k === "say" ? panel.who : panel?.k === "mission" ? conversation(panel.convo)?.character : reply?.who;

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="icon-btn" onClick={() => navigate("/historia")} aria-label="Sair do capítulo">
          <X size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="xs muted">Capítulo {ch.n}</div>
          <div style={{ fontWeight: 800 }}>{ch.title}</div>
        </div>
        <span className="chip">
          {i + 1}/{ch.panels.length}
        </span>
      </div>
      <div className="lesson-body">
        <div className="lesson-inner scene" key={i}>
          <div className="scene-stage" style={{ background: `linear-gradient(160deg, ${pl?.color ?? "#555"}, color-mix(in srgb, ${pl?.color ?? "#555"} 55%, #0b0d12))` }}>
            {speaker && <Portrait id={speaker} size={92} mood={panel?.k === "say" ? panel.mood ?? "neutral" : "happy"} bob />}
            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ color: "rgba(255,255,255,.75)" }}>
                {pl?.name}
              </div>
              <Ru text={pl?.ru ?? ""} className="" />
            </div>
          </div>

          {panel?.k === "narr" && <p className="panel-text">{panel.pt}</p>}

          {panel?.k === "say" && (
            <div className="card">
              <div className="eyebrow">{character(panel.who).name}</div>
              <div className="row wrap between">
                <Ru text={panel.ru} className="teach-word" />
                <AudioButton text={panel.ru} />
              </div>
              <div className="muted">{panel.pt}</div>
            </div>
          )}

          {panel?.k === "sign" && (
            <div className="stack lg" style={{ alignItems: "flex-start" }}>
              <div className="sign" lang="ru">
                {panel.ru.replace(/'/g, "").replace(/́/g, "")}
              </div>
              <h3>{panel.prompt}</h3>
              <div className="options" style={{ width: "100%" }}>
                {panel.options.map((o, k) => {
                  const state = answer === null ? "" : k === panel.answer && answer === k ? "correct" : answer === k ? "wrong" : "";
                  return (
                    <button key={k} className={`option ${state}`} onClick={() => {
                      setAnswer(k);
                      if (k === panel.answer) sfx.correct();
                      else sfx.wrong();
                    }}>
                      {o}
                    </button>
                  );
                })}
              </div>
              {answer !== null && (
                <div className={`notice ${answer === panel.answer ? "" : "warn"}`}>
                  {answer === panel.answer ? <Check size={16} /> : <X size={16} />} {answer === panel.answer ? panel.explain : "Leia de novo, letra por letra, e tente outra vez."}
                </div>
              )}
            </div>
          )}

          {panel?.k === "choice" && (
            <div className="stack lg">
              <h3>{panel.prompt}</h3>
              <div className="options">
                {panel.options.map((o, k) => (
                  <button
                    key={k}
                    className={`option ${answer === k ? "selected" : ""}`}
                    onClick={() => {
                      setAnswer(k);
                      setFlags((f) => ({ ...f, ...o.set }));
                      setReply(o.reply ?? null);
                    }}
                  >
                    {o.pt}
                  </button>
                ))}
              </div>
              {reply && (
                <div className="card">
                  <div className="eyebrow">{character(reply.who).name}</div>
                  <div className="row wrap between">
                    <Ru text={reply.ru} className="teach-word" />
                    <AudioButton text={reply.ru} slow={false} />
                  </div>
                  <div className="muted">{reply.pt}</div>
                </div>
              )}
            </div>
          )}

          {panel?.k === "mission" && (
            <div className="card stack">
              <div className="row">
                <MessagesSquare color="var(--blue)" />
                <h3>Missão</h3>
              </div>
              <p style={{ margin: 0 }}>{panel.intro}</p>
              {missionDone ? (
                <div className="notice">
                  <Check size={16} /> Missão cumprida! Você pode continuar a história.
                </div>
              ) : (
                <a className="btn lg primary" href={`#/conversa/${panel.convo}`}>
                  Começar a conversa
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="lesson-foot">
        <div className="foot-inner">
          <button className="btn ghost" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="foot-actions">
            <button className="btn lg primary lesson-cta" onClick={advance} disabled={!canNext}>
              {last ? "Concluir capítulo" : "Continuar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
