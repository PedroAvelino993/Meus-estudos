// Progresso: perfil, visto × dominado, competências, histórico semanal, conquistas e erros recentes.

import {
  Award, BookOpen, Brain, Crown, Flame, Footprints, Headphones, Keyboard, Languages, Layers, Library, Lock, Map as MapIcon, MessagesSquare, Palette, RotateCcw, Star, Trophy, Type, Users,
} from "lucide-react";

const ACH_ICON: Record<string, typeof Award> = {
  type: Type, footprints: Footprints, languages: Languages, "book-open": BookOpen, star: Star, layers: Layers, "messages-square": MessagesSquare,
  users: Users, map: MapIcon, library: Library, brain: Brain, "rotate-ccw": RotateCcw, keyboard: Keyboard, headphones: Headphones, flame: Flame, crown: Crown,
};
import { useStudent, update } from "../store";
import { Bar, Ring } from "../components/ui";
import { Ru } from "../components/ru";
import { ALL_LESSONS, ALL_UNITS, GRAMMAR } from "../content";
import { ACHIEVEMENTS } from "../core/achievements";
import { DAY, mastery } from "../core/srs";
import { SKILLS } from "../core/types";
import { currentStreak, dayKey, emptyDay, levelOf } from "../core/state";
import { SKILL_LABEL, alphabetCounts, itemLabel, lessonPassed, levelLabel, overallProgress, skillScores, unitComplete, vocabCounts } from "../core/progress";

export function WeekChart({ days = 14 }: { days?: number }) {
  const s = useStudent();
  const now = Date.now();
  const goal = s.settings.dailyGoal;
  const data = Array.from({ length: days }, (_, i) => {
    const t = now - (days - 1 - i) * DAY;
    return { t, d: s.days[dayKey(t)] ?? emptyDay() };
  });
  const max = Math.max(goal, ...data.map((x) => x.d.xp));
  const W = 300;
  const H = 110;
  const bw = W / days;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H + 16}`} role="img" aria-label={`XP por dia nos últimos ${days} dias`}>
      <line className="axis" x1="0" x2={W} y1={H - (goal / max) * (H - 10)} y2={H - (goal / max) * (H - 10)} strokeDasharray="4 4" />
      {data.map(({ t, d }, i) => {
        const h = (d.xp / max) * (H - 10);
        const today = i === days - 1;
        return (
          <g key={t}>
            <rect x={i * bw + bw * 0.18} y={H - h} width={bw * 0.64} height={Math.max(h, d.xp ? 2 : 0)} rx="3" fill={d.xp >= goal ? "var(--green)" : today ? "var(--red)" : "var(--gold)"} opacity={d.xp ? 1 : 0.2}>
              <title>
                {new Date(t).toLocaleDateString("pt-BR")}: {d.xp} XP, {Math.round(d.seconds / 60)} min
              </title>
            </rect>
            {(i % Math.ceil(days / 7) === 0 || today) && (
              <text x={i * bw + bw / 2} y={H + 12} textAnchor="middle">
                {new Date(t).getDate()}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const FRAMES = [
  { id: "classic", name: "Clássica", level: 1, css: "0 0 0 3px var(--surface), 0 0 0 5px var(--border-strong)" },
  { id: "matryoshka", name: "Matrioska", level: 3, css: "0 0 0 3px #fff, 0 0 0 6px #d63a2f, 0 0 0 9px #e3a92b" },
  { id: "neve", name: "Neve", level: 5, css: "0 0 0 3px #fff, 0 0 0 7px #9cd2ff" },
  { id: "ouro", name: "Ouro", level: 8, css: "0 0 0 3px #fff, 0 0 0 7px #e3a92b, 0 0 14px #e3a92b" },
  { id: "samovar", name: "Samovar", level: 12, css: "0 0 0 3px #2b1a0e, 0 0 0 7px #c77d1a, 0 0 0 10px #8c5a3c" },
];

const ACCENTS = [
  { id: "red", color: "#d63a2f", level: 1 },
  { id: "blue", color: "#2f6fd6", level: 2 },
  { id: "green", color: "#1f8a5b", level: 4 },
  { id: "violet", color: "#7b4bc4", level: 6 },
  { id: "gold", color: "#c98d10", level: 10 },
];

export function ProfileAvatar({ size = 72 }: { size?: number }) {
  const s = useStudent();
  const frame = FRAMES.find((f) => f.id === s.settings.frame) ?? FRAMES[0];
  const accent = ACCENTS.find((a) => a.id === s.settings.accent) ?? ACCENTS[0];
  const name = s.settings.nameRu || s.settings.name || "Я";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div className="avatar ru" style={{ width: size, height: size, background: accent.color, boxShadow: frame.css, fontSize: size * 0.38 }} aria-hidden>
      {initials}
    </div>
  );
}

export function ProgressPage() {
  const s = useStudent();
  const now = Date.now();
  const lvl = levelOf(s.xp);
  const abc = alphabetCounts(s);
  const vocab = vocabCounts(s);
  const grammarSeen = GRAMMAR.filter((g) => s.items[`G:${g.id}`]).length;
  const grammarMastered = GRAMMAR.filter((g) => mastery(s.items[`G:${g.id}`]) === "dominado").length;
  const lessonsDone = ALL_LESSONS.filter((r) => lessonPassed(s, r.lesson.id)).length;
  const unitsDone = ALL_UNITS.filter((u) => unitComplete(s, u.unit.id)).length;
  const skills = skillScores(s);
  const totalMin = Math.round(Object.values(s.days).reduce((a, d) => a + d.seconds, 0) / 60);

  // Histórico por semana (últimas 8)
  const weeks = Array.from({ length: 8 }, (_, w) => {
    const days = Array.from({ length: 7 }, (_, d) => s.days[dayKey(now - (w * 7 + d) * DAY)] ?? emptyDay());
    const sum = (k: keyof ReturnType<typeof emptyDay>) => days.reduce((a, x) => a + x[k], 0);
    const start = new Date(now - (w * 7 + 6) * DAY);
    return { label: start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), xp: sum("xp"), min: Math.round(sum("seconds") / 60), lessons: sum("lessons"), reviews: sum("reviews"), acc: sum("answers") ? sum("correct") / sum("answers") : null };
  });

  return (
    <div className="page stack lg">
      <div className="page-head">
        <div>
          <h1>Progresso</h1>
          <p className="muted">Números reais, calculados a partir das suas respostas. «Visto» é o que apareceu; «dominado» é o que você acerta há semanas.</p>
        </div>
      </div>

      <section className="card row wrap" style={{ gap: 20 }}>
        <ProfileAvatar size={84} />
        <div className="stack" style={{ flex: 1, minWidth: 220, gap: 6 }}>
          <h2>{s.settings.nameRu ? <Ru text={s.settings.nameRu} /> : s.settings.name || "Estudante"}</h2>
          <div className="small muted">
            {levelLabel(s)} · {currentStreak(s, now)} dias seguidos (recorde {s.streak.best}) · {totalMin} min de estudo
          </div>
          <div className="row between small">
            <b>Nível {lvl.level}</b>
            <span className="muted">
              {lvl.into}/{lvl.need} XP
            </span>
          </div>
          <Bar value={lvl.into / lvl.need} tone="gold" />
        </div>
        <Ring value={overallProgress(s)} size={96} color="var(--red)" sub="do curso" />
      </section>

      <section className="grid three">
        <Seen title="Alfabeto" seen={abc.seen} mastered={abc.mastered} total={33} />
        <Seen title="Vocabulário" seen={vocab.seen} mastered={vocab.mastered} total={vocab.total} />
        <Seen title="Gramática" seen={grammarSeen} mastered={grammarMastered} total={GRAMMAR.length} />
      </section>

      <div className="grid two">
        <section className="card stack">
          <h3>
            <Brain size={18} style={{ verticalAlign: "-3px" }} /> Competências
          </h3>
          {SKILLS.map((k) => (
            <div key={k} className="skill-row">
              <span>{SKILL_LABEL[k]}</span>
              <Bar value={skills[k].score} tone={k === "audicao" ? "teal" : k === "gramatica" ? "violet" : k === "escrita" ? "blue" : k === "fala" ? "gold" : "green"} />
              <span className="xs muted" title={`${skills[k].answers} respostas`}>
                {skills[k].answers ? `${Math.round(skills[k].score * 100)}%` : "—"}
              </span>
            </div>
          ))}
          <p className="xs muted" style={{ margin: 0 }}>
            Taxa de acerto ponderada pela força da memória e pelo volume de respostas. «Fala» só conta quando o reconhecimento de fala do navegador confirma a frase.
          </p>
        </section>
        <section className="card stack">
          <h3>XP nos últimos 30 dias</h3>
          <WeekChart days={30} />
          <div className="row between small">
            <span>
              Lições: <b>{lessonsDone}</b>/{ALL_LESSONS.length}
            </span>
            <span>
              Unidades: <b>{unitsDone}</b>/{ALL_UNITS.length}
            </span>
            <span>
              XP: <b>{s.xp}</b>
            </span>
          </div>
        </section>
      </div>

      <section className="card">
        <h3 style={{ marginBottom: 10 }}>Histórico semanal</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr className="muted" style={{ textAlign: "left" }}>
                <th style={{ padding: 6 }}>Semana de</th>
                <th>XP</th>
                <th>Minutos</th>
                <th>Lições</th>
                <th>Revisões</th>
                <th>Acerto</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: 6 }}>{i === 0 ? "esta semana" : w.label}</td>
                  <td>{w.xp}</td>
                  <td>{w.min}</td>
                  <td>{w.lessons}</td>
                  <td>{w.reviews}</td>
                  <td>{w.acc === null ? "—" : `${Math.round(w.acc * 100)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginBottom: 12 }}>
          <Trophy size={18} style={{ verticalAlign: "-3px" }} /> Conquistas ({Object.keys(s.achievements).length}/{ACHIEVEMENTS.length})
        </h3>
        <div className="grid auto" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {ACHIEVEMENTS.map((a) => {
            const got = s.achievements[a.id];
            const Icon = ACH_ICON[a.icon] ?? Award;
            return (
              <div key={a.id} className="row" style={{ opacity: got ? 1 : 0.5, alignItems: "flex-start" }}>
                <div className="stat-icon" style={{ background: got ? "var(--gold-soft)" : "var(--bg-2)", color: got ? "var(--gold)" : "var(--faint)" }}>
                  {got ? <Icon size={20} /> : <Lock size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>{a.title}</div>
                  <div className="xs muted">{a.description}</div>
                  {got && <div className="xs faint">{new Date(got).toLocaleDateString("pt-BR")}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginBottom: 10 }}>
          <Palette size={18} style={{ verticalAlign: "-3px" }} /> Personalizar perfil
        </h3>
        <div className="eyebrow">Moldura</div>
        <div className="row wrap" style={{ margin: "8px 0 14px" }}>
          {FRAMES.map((f) => {
            const ok = lvl.level >= f.level;
            return (
              <button key={f.id} className={`btn sm ${s.settings.frame === f.id ? "primary" : ""}`} disabled={!ok} onClick={() => update((st) => ({ ...st, settings: { ...st.settings, frame: f.id } }))} title={ok ? f.name : `Libera no nível ${f.level}`}>
                {!ok && <Lock size={12} />} {f.name}
              </button>
            );
          })}
        </div>
        <div className="eyebrow">Cor</div>
        <div className="row wrap" style={{ marginTop: 8 }}>
          {ACCENTS.map((a) => {
            const ok = lvl.level >= a.level;
            return (
              <button
                key={a.id}
                aria-label={`Cor ${a.id}${ok ? "" : ` (nível ${a.level})`}`}
                disabled={!ok}
                onClick={() => update((st) => ({ ...st, settings: { ...st.settings, accent: a.id } }))}
                style={{ width: 36, height: 36, borderRadius: "50%", background: a.color, border: s.settings.accent === a.id ? "3px solid var(--text)" : "3px solid transparent", opacity: ok ? 1 : 0.3 }}
              />
            );
          })}
        </div>
      </section>

      {s.mistakes.length > 0 && (
        <section className="card">
          <h3 style={{ marginBottom: 10 }}>Erros recentes</h3>
          <div className="list">
            {s.mistakes.slice(0, 10).map((m, i) => {
              const l = itemLabel(m.item);
              return (
                <div key={i} className="list-item small">
                  <span className="chip">{l.kind}</span>
                  <span className="ru" style={{ textDecoration: "line-through", color: "var(--bad)" }}>
                    {m.got || "—"}
                  </span>
                  <span>→</span>
                  {/[Ѐ-ӿ]/.test(m.expected) ? <Ru text={m.expected} /> : <span>{m.expected}</span>}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Seen({ title, seen, mastered, total }: { title: string; seen: number; mastered: number; total: number }) {
  return (
    <div className="card stack" style={{ gap: 8 }}>
      <h3>{title}</h3>
      <div className="row between small">
        <span>Visto</span>
        <b>
          {seen}/{total}
        </b>
      </div>
      <Bar value={seen / Math.max(1, total)} tone="blue" thin />
      <div className="row between small">
        <span>Dominado</span>
        <b>
          {mastered}/{total}
        </b>
      </div>
      <Bar value={mastered / Math.max(1, total)} tone="green" thin />
    </div>
  );
}
