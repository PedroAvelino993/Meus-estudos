import { ArrowRight, BookA, Check, Clock, Flame, Gift, Library, MessagesSquare, RotateCcw, Shield, Sparkles, Target, Trophy } from "lucide-react";
import { useStudent, update } from "../store";
import { Bar, Ring } from "../components/ui";
import { Portrait } from "../components/Portrait";
import { Ru } from "../components/ru";
import { CHAPTERS, CONVERSATIONS, character, lessonRef, unitRef } from "../content";
import { ACHIEVEMENTS } from "../core/achievements";
import { dueItems } from "../core/srs";
import { claimMission, currentStreak, dayKey, emptyDay, levelOf, missionsFor, weekXp } from "../core/state";
import {
  SKILL_LABEL, alphabetCounts, chapterAvailable, convoAvailable, currentUnit, levelLabel, lessonPassed, nextStep, skillScores, vocabCounts,
} from "../core/progress";
import { WeekChart } from "./Progress";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "До́брое у́тро" : h < 18 ? "До́брый день" : "До́брый ве́чер";
}

export function HomePage() {
  const s = useStudent();
  const now = Date.now();
  const today = s.days[dayKey(now)] ?? emptyDay();
  const goal = s.settings.dailyGoal;
  const streak = currentStreak(s, now);
  const step = nextStep(s);
  const unit = currentUnit(s);
  const due = dueItems(s.items, now, 999).length;
  const abc = alphabetCounts(s);
  const vocab = vocabCounts(s);
  const lvl = levelOf(s.xp);
  const missions = missionsFor(dayKey(now));
  const claimed = s.missionsClaimed[dayKey(now)] ?? [];
  const skills = skillScores(s);
  const ranked = Object.entries(skills).filter(([, v]) => v.answers >= 5).sort((a, b) => b[1].score - a[1].score);
  const chapter = CHAPTERS.find((c) => chapterAvailable(s, c.id) && !s.chapters[c.id]?.done);
  const convo = CONVERSATIONS.find((c) => convoAvailable(s, c.id) && !s.convos[c.id]?.completed);
  const recentAch = Object.entries(s.achievements).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean);

  const nextLabel =
    step.kind === "lesson" ? lessonRef(step.lessonId)!.lesson.title : step.kind === "test" ? `Teste: ${unitRef(step.unitId)!.unit.title}` : "Todo o conteúdo disponível foi concluído";
  const nextHref = step.kind === "lesson" ? `#/licao/${step.lessonId}` : step.kind === "test" ? `#/teste/${step.unitId}` : "#/revisao";
  const unitDone = unit ? unit.lessons.filter((l) => lessonPassed(s, l.id)).length : 0;
  const started = Object.keys(s.lessons).length > 0 || Object.keys(s.tests).length > 0;

  return (
    <div className="page stack lg">
      <section className="hero">
        <div className="row between wrap" style={{ alignItems: "flex-start" }}>
          <div className="stack" style={{ gap: 6, maxWidth: 560 }}>
            <span style={{ fontSize: "1.15rem", opacity: 0.92 }}>
              <Ru text={`${greeting()}${s.settings.nameRu ? `, ${s.settings.nameRu}` : ""}!`} />
            </span>
            <h1>{started ? "Vamos continuar?" : "Vamos começar pelo alfabeto"}</h1>
            <div style={{ opacity: 0.92 }}>
              {levelLabel(s)} · Nível {lvl.level} · {s.xp} XP
            </div>
          </div>
          <Ring value={Math.min(1, today.xp / goal)} size={92} stroke={9} color="#fff" ink="#fff" subInk="rgba(255,255,255,.85)" track="rgba(255,255,255,.25)" label={`${today.xp}`} sub={`de ${goal} XP`} />
        </div>
        <div className="card" style={{ marginTop: 18, color: "var(--text)" }}>
          <div className="row between wrap">
            <div style={{ minWidth: 0 }}>
              <div className="eyebrow">{unit ? `Unidade: ${unit.title}` : "Próximo passo"}</div>
              <div style={{ fontWeight: 800, fontSize: "1.15rem" }}>{nextLabel}</div>
            </div>
            <a className="btn lg primary" href={nextHref}>
              {started ? "Continuar" : "Começar"} <ArrowRight size={18} />
            </a>
          </div>
          {unit && (
            <div style={{ marginTop: 12 }}>
              <Bar value={unitDone / unit.lessons.length} tone="green" label="Progresso da unidade" />
              <div className="xs muted" style={{ marginTop: 4 }}>
                {unitDone} de {unit.lessons.length} lições da unidade
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mini-stats">
        <a href="#/progresso" className="card tight stat hover" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="row between">
            <span className="stat-label">Sequência</span>
            <Flame size={20} color="var(--gold)" />
          </div>
          <span className="stat-value">{streak}</span>
          <span className="xs muted">
            {s.streak.freezes > 0 ? (
              <>
                <Shield size={12} /> {s.streak.freezes} proteção{s.streak.freezes > 1 ? "ões" : ""}
              </>
            ) : (
              `recorde: ${s.streak.best}`
            )}
          </span>
        </a>
        <a href="#/alfabeto" className="card tight stat hover" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="row between">
            <span className="stat-label">Alfabeto</span>
            <BookA size={20} color="var(--red)" />
          </div>
          <span className="stat-value">
            {abc.seen}
            <span className="small muted">/33</span>
          </span>
          <span className="xs muted">{abc.mastered} dominadas</span>
        </a>
        <a href="#/vocabulario" className="card tight stat hover" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="row between">
            <span className="stat-label">Vocabulário</span>
            <Library size={20} color="var(--blue)" />
          </div>
          <span className="stat-value">{vocab.seen}</span>
          <span className="xs muted">
            vistas · {vocab.mastered} dominadas
          </span>
        </a>
        <a href="#/revisao" className="card tight stat hover" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="row between">
            <span className="stat-label">Revisão</span>
            <RotateCcw size={20} color="var(--teal)" />
          </div>
          <span className="stat-value">{due}</span>
          <span className="xs muted">{due ? "itens para hoje" : "nada pendente"}</span>
        </a>
      </section>

      <div className="grid two">
        <section className="card stack">
          <div className="row between">
            <h3>
              <Target size={18} style={{ verticalAlign: "-3px" }} color="var(--red)" /> Missões de hoje
            </h3>
            <span className="xs muted">renovam à meia-noite</span>
          </div>
          {missions.map((m) => {
            const p = Math.min(m.target, m.progress(today));
            const isClaimed = claimed.includes(m.id);
            const done = p >= m.target;
            return (
              <div key={m.id} className="stack" style={{ gap: 6 }}>
                <div className="row between">
                  <span style={{ fontWeight: 700 }}>{m.title}</span>
                  {isClaimed ? (
                    <span className="chip green">
                      <Check size={14} /> +{m.xp} XP
                    </span>
                  ) : done ? (
                    <button className="btn sm primary" onClick={() => update((st) => claimMission(st, m.id, Date.now()).state)}>
                      <Gift size={14} /> Pegar {m.xp} XP
                    </button>
                  ) : (
                    <span className="xs muted">
                      {p}/{m.target}
                    </span>
                  )}
                </div>
                <Bar value={p / m.target} tone="gold" thin />
              </div>
            );
          })}
          <div className="xs muted">
            Meta semanal: {weekXp(s, now)} de {goal * 5} XP
          </div>
          <Bar value={weekXp(s, now) / (goal * 5)} tone="blue" thin />
        </section>

        <section className="card stack">
          <div className="row between">
            <h3>Últimos 14 dias</h3>
            <span className="xs muted">
              <Clock size={12} /> hoje: {Math.round(today.seconds / 60)} min
            </span>
          </div>
          <WeekChart days={14} />
          {ranked.length >= 2 ? (
            <div className="row between small">
              <span>
                Mais forte: <b>{SKILL_LABEL[ranked[0][0] as keyof typeof SKILL_LABEL]}</b>
              </span>
              <span>
                Precisa de atenção: <b>{SKILL_LABEL[ranked[ranked.length - 1][0] as keyof typeof SKILL_LABEL]}</b>
              </span>
            </div>
          ) : (
            <div className="small muted">As competências aparecem depois de algumas respostas.</div>
          )}
        </section>
      </div>

      {(chapter || convo) && (
        <section className="grid two">
          {chapter && (
            <a href={`#/capitulo/${chapter.id}`} className="card hover row" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="stat-icon" style={{ background: "var(--gold-soft)", color: "var(--gold)" }}>
                <Sparkles size={22} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="eyebrow">Novo capítulo</div>
                <div style={{ fontWeight: 800 }}>
                  {chapter.title} · <Ru text={chapter.ru} />
                </div>
                <div className="small muted">{chapter.summary}</div>
              </div>
            </a>
          )}
          {convo && (
            <a href={`#/conversa/${convo.id}`} className="card hover row" style={{ textDecoration: "none", color: "inherit" }}>
              <Portrait id={convo.character} size={52} mood="happy" />
              <div style={{ minWidth: 0 }}>
                <div className="eyebrow">
                  <MessagesSquare size={12} /> Conversa disponível
                </div>
                <div style={{ fontWeight: 800 }}>
                  {convo.title} com {character(convo.character).name}
                </div>
                <div className="small muted">{convo.goal}</div>
              </div>
            </a>
          )}
        </section>
      )}

      {recentAch.length > 0 && (
        <section className="card">
          <div className="row between" style={{ marginBottom: 10 }}>
            <h3>Conquistas recentes</h3>
            <a href="#/progresso" className="small">
              ver todas
            </a>
          </div>
          <div className="row wrap">
            {recentAch.map((a) => (
              <span key={a!.id} className="chip gold">
                <Trophy size={14} /> {a!.title}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
