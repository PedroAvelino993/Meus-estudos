// Vocabulário: tudo o que já apareceu, com nível de domínio real (visto ≠ dominado).

import { useMemo, useState } from "react";
import { Library, Search } from "lucide-react";
import { useStudent } from "../store";
import { LEXICON, ALL_LESSONS } from "../content";
import { AudioButton, Ru, WordInfo } from "../components/ru";
import { Empty, Seg } from "../components/ui";
import { MASTERY_LABEL, mastery, type Mastery } from "../core/srs";
import { normalize } from "../core/text";
import { vocabCounts } from "../core/progress";

type Filter = "todas" | Mastery;

export function VocabularyPage() {
  const s = useStudent();
  const [filter, setFilter] = useState<Filter>("todas");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const counts = vocabCounts(s);

  const lessonOf = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of ALL_LESSONS) for (const w of r.lesson.words ?? []) if (!m.has(w)) m.set(w, r.lesson.title);
    return m;
  }, []);

  const list = LEXICON.filter((e) => e.pos !== "name" && s.items[`W:${e.id}`])
    .map((e) => ({ e, st: s.items[`W:${e.id}`], m: mastery(s.items[`W:${e.id}`]) }))
    .filter((x) => filter === "todas" || x.m === filter)
    .filter((x) => !q || normalize(x.e.ru).includes(normalize(q)) || normalize(x.e.pt).includes(normalize(q)) || x.e.alt?.some((a) => normalize(a).includes(normalize(q))))
    .sort((a, b) => (b.st?.last ?? 0) - (a.st?.last ?? 0));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Vocabulário</h1>
          <p className="muted">
            {counts.seen} palavras e expressões vistas · {counts.practicing} praticando · {counts.mastered} dominadas. Uma palavra só fica «dominada» depois de vários acertos espaçados em semanas, incluindo escrever ou usar em conversa.
          </p>
        </div>
      </div>
      <div className="row wrap" style={{ marginBottom: 16 }}>
        <div className="row input" style={{ flex: "1 1 240px", padding: "0 10px" }}>
          <Search size={18} color="var(--faint)" />
          <input
            style={{ border: 0, outline: "none", background: "transparent", padding: "10px 0", flex: 1, minWidth: 0 }}
            placeholder="Buscar em russo ou português"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar palavra"
          />
        </div>
        <Seg<Filter>
          label="Filtrar por domínio"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "todas", label: "Todas" },
            { value: "aprendendo", label: "Aprendendo" },
            { value: "praticando", label: "Praticando" },
            { value: "dominado", label: "Dominadas" },
          ]}
        />
      </div>
      {list.length === 0 ? (
        <Empty icon={<Library size={40} />} title={counts.seen ? "Nada com esse filtro" : "Nenhuma palavra ainda"}>
          {counts.seen ? "Tente outro filtro ou busca." : "As palavras aparecem aqui assim que você as estuda nas lições."}
        </Empty>
      ) : (
        <div className="card" style={{ padding: "4px 16px" }}>
          <div className="list">
            {list.map(({ e, st, m }) => (
              <div key={e.id} className="list-item" style={{ cursor: "pointer" }} onClick={() => setOpen(e.ru)} role="button" tabIndex={0} onKeyDown={(k) => k.key === "Enter" && setOpen(e.ru)}>
                <span className={`mastery-dot m-${m}`} title={MASTERY_LABEL[m]} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Ru text={e.ru} className="" />
                  <div className="small muted">
                    {e.pt}
                    {lessonOf.get(e.id) ? ` · ${lessonOf.get(e.id)}` : ""}
                  </div>
                </div>
                <span className="xs muted" style={{ textAlign: "right" }}>
                  {MASTERY_LABEL[m]}
                  <br />
                  {st && st.right + st.wrong > 0 ? `${st.right}✓ ${st.wrong}✗` : "só visto"}
                </span>
                <span onClick={(ev) => ev.stopPropagation()}>
                  <AudioButton text={e.ru} slow={false} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {open && <WordInfo word={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
