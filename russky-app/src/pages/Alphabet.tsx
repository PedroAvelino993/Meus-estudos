// Módulo do alfabeto: as 33 letras, com sons, armadilhas, exemplos, comparações e estatísticas.

import { useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Dumbbell, Info } from "lucide-react";
import { useStudent } from "../store";
import { ALPHABET, ALL_LESSONS } from "../content";
import { AudioButton, Ru } from "../components/ru";
import { Rich } from "../components/exercises";
import { Bar, Seg } from "../components/ui";
import { MASTERY_LABEL, mastery, strength } from "../core/srs";
import { alphabetCounts, lessonUnlocked } from "../core/progress";
import { itemL } from "../core/generate";

type Filter = "todas" | "vogal" | "consoante" | "sinal" | "falsos";

export function AlphabetPage() {
  const s = useStudent();
  const [filter, setFilter] = useState<Filter>("todas");
  const counts = alphabetCounts(s);
  const list = ALPHABET.filter((l) => (filter === "todas" ? true : filter === "falsos" ? l.falseFriend : l.kind === filter));
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Alfabeto cirílico</h1>
          <p className="muted">33 letras. Toque numa letra para ver o som, as armadilhas para brasileiros, exemplos e as suas estatísticas.</p>
        </div>
        <div className="card tight" style={{ minWidth: 220 }}>
          <div className="row between small">
            <span>Vistas</span>
            <b>{counts.seen}/33</b>
          </div>
          <Bar value={counts.seen / 33} thin />
          <div className="row between small" style={{ marginTop: 6 }}>
            <span>Dominadas</span>
            <b>{counts.mastered}/33</b>
          </div>
          <Bar value={counts.mastered / 33} tone="green" thin />
        </div>
      </div>

      <div className="row wrap" style={{ marginBottom: 16 }}>
        <Seg<Filter>
          label="Filtrar letras"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "todas", label: "Todas" },
            { value: "vogal", label: "Vogais" },
            { value: "consoante", label: "Consoantes" },
            { value: "sinal", label: "Sinais" },
            { value: "falsos", label: "Falsos amigos" },
          ]}
        />
      </div>

      <div className="letter-grid">
        {list.map((l) => {
          const st = s.items[itemL(l.upper)];
          return (
            <a key={l.upper} href={`#/alfabeto/${encodeURIComponent(l.upper)}`} className={`letter-tile ${l.falseFriend ? "ff" : ""} ${st ? "" : "locked"}`} title={l.falseFriend ? "Falso amigo: parece latina, mas soa diferente" : undefined}>
              <div className="glyph" lang="ru">
                {l.upper}
                {l.lower}
              </div>
              <div className="snd">«{l.sound}»</div>
              <div className="meter">
                <span style={{ width: `${strength(st) * 100}%` }} />
              </div>
            </a>
          );
        })}
      </div>

      <div className="grid three" style={{ marginTop: 28 }}>
        <div className="card">
          <h3>Vogais duras e suaves</h3>
          <p className="small muted">а у о э ы deixam a consoante normal; я ю ё е и amolecem a consoante anterior.</p>
          <div className="row wrap">
            {["а-я", "у-ю", "о-ё", "э-е", "ы-и"].map((p) => (
              <span key={p} className="chip red ru">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>O о que vira «a»</h3>
          <p className="small muted">Fora da sílaba tônica, о soa «a»: молоко́ = «malakó».</p>
          <a className="btn sm" href="#/gramatica/pronuncia">
            <BookOpen size={14} /> Ver explicação
          </a>
        </div>
        <div className="card">
          <h3>Sinais sem som</h3>
          <p className="small muted">ь amolece a consoante (мать); ъ separa a consoante da vogal (подъе́зд).</p>
          <a className="btn sm" href={`#/alfabeto/${encodeURIComponent("Ь")}`}>
            Ver Ь
          </a>
        </div>
      </div>
    </div>
  );
}

export function LetterPage({ letter }: { letter: string }) {
  const s = useStudent();
  const idx = ALPHABET.findIndex((l) => l.upper === letter || l.lower === letter);
  if (idx < 0) return <div className="page narrow empty">Letra não encontrada.</div>;
  const l = ALPHABET[idx];
  const st = s.items[itemL(l.upper)];
  const m = mastery(st);
  const lesson = ALL_LESSONS.find((r) => r.lesson.letters?.includes(l.upper));
  const canPractice = !!st || (lesson && lessonUnlocked(s, lesson.lesson.id));
  const prev = ALPHABET[(idx + 32) % 33];
  const next = ALPHABET[(idx + 1) % 33];

  return (
    <div className="page narrow stack lg">
      <div className="row between">
        <a className="btn ghost sm" href="#/alfabeto">
          <ArrowLeft size={16} /> Alfabeto
        </a>
        <div className="row">
          <a className="icon-btn" href={`#/alfabeto/${encodeURIComponent(prev.upper)}`} aria-label={`Letra anterior: ${prev.upper}`}>
            <ArrowLeft size={18} />
          </a>
          <span className="small muted">
            {idx + 1} de 33
          </span>
          <a className="icon-btn" href={`#/alfabeto/${encodeURIComponent(next.upper)}`} aria-label={`Próxima letra: ${next.upper}`}>
            <ArrowRight size={18} />
          </a>
        </div>
      </div>

      <div className="letter-hero">
        <div className="letter-big" lang="ru" key={l.upper}>
          {l.upper}
          <span className="lower">{l.lower}</span>
        </div>
        <div className="stack" style={{ flex: 1, minWidth: 220 }}>
          <div className="row wrap">
            <span className="chip">{{ vogal: "Vogal", consoante: "Consoante", sinal: "Sinal" }[l.kind]}</span>
            {l.falseFriend && (
              <span className="chip gold">
                <AlertTriangle size={12} /> Falso amigo
              </span>
            )}
            <span className="chip">
              <span className={`mastery-dot m-${m}`} /> {MASTERY_LABEL[m]}
            </span>
          </div>
          <div>
            <div className="eyebrow">Nome</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>
              <Ru text={l.name} /> <span className="small muted">({l.nameTr})</span>
            </div>
          </div>
          <div>
            <div className="eyebrow">Som principal</div>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "var(--red)" }}>«{l.sound}»</div>
          </div>
          <AudioButton text={l.name} label={`Ouvir o nome da letra ${l.upper}`} />
        </div>
      </div>

      <div className="card">
        <p style={{ margin: 0, fontSize: "1.08rem" }}>
          <Rich text={l.explain} />
        </p>
        {l.pitfall && (
          <div className="notice warn" style={{ marginTop: 12 }}>
            <AlertTriangle size={18} />
            <div>
              <b>Dificuldade para brasileiros:</b> <Rich text={l.pitfall} />
            </div>
          </div>
        )}
      </div>

      <section className="stack">
        <h3>Exemplos</h3>
        {l.examples.map((e) => (
          <div key={e.ru} className="card tight row between">
            <div>
              <Ru text={e.ru} className="teach-word" />
              <div className="small muted">
                {e.pt} · pronúncia aproximada «{e.tr}»
              </div>
            </div>
            <AudioButton text={e.ru} />
          </div>
        ))}
      </section>

      {l.lookalikes?.length ? (
        <section className="stack">
          <h3>Compare com letras parecidas</h3>
          <div className="grid two">
            {l.lookalikes.map((x) => (
              <div key={x.char} className="card tight row" style={{ alignItems: "flex-start" }}>
                <div className="letter-big" style={{ fontSize: "2.4rem", minWidth: 70, padding: "6px 10px", background: "var(--bg-2)", color: "var(--text)", animation: "none" }}>
                  {x.char}
                </div>
                <div className="small">{x.note}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="card">
        <h3>Suas estatísticas</h3>
        {st && st.seen > 0 ? (
          <div className="grid three" style={{ marginTop: 10 }}>
            <div className="stat">
              <span className="stat-value" style={{ color: "var(--green)" }}>
                {st.right}
              </span>
              <span className="stat-label">acertos</span>
            </div>
            <div className="stat">
              <span className="stat-value" style={{ color: "var(--bad)" }}>
                {st.wrong}
              </span>
              <span className="stat-label">erros</span>
            </div>
            <div className="stat">
              <span className="stat-value">{st.interval ? `${st.interval} d` : "hoje"}</span>
              <span className="stat-label">próxima revisão em</span>
            </div>
          </div>
        ) : (
          <p className="small muted" style={{ margin: "6px 0 0" }}>
            <Info size={14} /> Você ainda não praticou esta letra.{lesson ? ` Ela é ensinada em «${lesson.lesson.title}».` : ""}
          </p>
        )}
        <div className="row wrap" style={{ marginTop: 14 }}>
          {canPractice ? (
            <a className="btn primary" href={`#/praticar/letra/${encodeURIComponent(l.upper)}`}>
              <Dumbbell size={16} /> Treinar esta letra
            </a>
          ) : (
            lesson && (
              <span className="small muted">Disponível depois da lição «{lesson.lesson.title}».</span>
            )
          )}
          {lesson && lessonUnlocked(s, lesson.lesson.id) && (
            <a className="btn" href={`#/licao/${lesson.lesson.id}`}>
              Abrir a lição
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
