// Revisão diária: itens vencidos e difíceis, em formatos variados (não só flashcards).

import { AlertCircle, CalendarClock, RotateCcw, Sparkles } from "lucide-react";
import { useStudent } from "../store";
import { Ru } from "../components/ru";
import { Empty, Ring } from "../components/ui";
import { DAY, dueItems, weakItems } from "../core/srs";
import { itemLabel } from "../core/progress";

export function ReviewPage() {
  const s = useStudent();
  const now = Date.now();
  const due = dueItems(s.items, now, 999);
  const weak = weakItems(s.items, 8);
  const seen = Object.values(s.items).filter((i) => i.seen > 0);
  const upcoming = [1, 2, 3, 4, 5, 6, 7].map((d) => seen.filter((i) => i.due > now + (d - 1) * DAY && i.due <= now + d * DAY).length);

  return (
    <div className="page narrow stack lg">
      <div className="page-head">
        <div>
          <h1>Revisão diária</h1>
          <p className="muted">O que você errou volta logo; o que você sabe volta em intervalos cada vez maiores. Cada item aparece num formato diferente: escrever, ouvir, ler, montar frases.</p>
        </div>
      </div>

      {seen.length === 0 ? (
        <Empty icon={<RotateCcw size={40} />} title="Nada para revisar ainda">
          Faça a primeira lição e os itens aprendidos aparecem aqui.
          <div style={{ marginTop: 12 }}>
            <a className="btn primary" href="#/aprender">
              Ir para a trilha
            </a>
          </div>
        </Empty>
      ) : (
        <>
          <div className="card row wrap" style={{ gap: 20 }}>
            <Ring value={due.length ? 0 : 1} size={110} color="var(--teal)" label={`${due.length}`} sub="para hoje" />
            <div className="stack" style={{ flex: 1, minWidth: 220 }}>
              <h2>{due.length ? `${due.length} ${due.length === 1 ? "item espera" : "itens esperam"} por você` : "Tudo em dia!"}</h2>
              <p className="muted small" style={{ margin: 0 }}>
                {due.length
                  ? "Uma sessão leva poucos minutos e vale XP. Revisar é o que faz uma palavra passar de «vista» para «dominada»."
                  : "Nenhum item venceu hoje. Você pode fazer uma revisão extra com os itens mais frágeis."}
              </p>
              <div>
                <a className="btn lg primary" href="#/praticar/revisao">
                  {due.length ? (
                    <>
                      <RotateCcw size={18} /> Revisar agora
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Revisão extra
                    </>
                  )}
                </a>
              </div>
            </div>
          </div>

          {weak.length > 0 && (
            <section className="card">
              <div className="row between" style={{ marginBottom: 8 }}>
                <h3>
                  <AlertCircle size={18} color="var(--bad)" style={{ verticalAlign: "-3px" }} /> Pontos fracos
                </h3>
                <a className="btn sm" href="#/praticar/recuperacao" onClick={() => sessionStorage.setItem("russky:recovery", JSON.stringify(weak.map((w) => w.id)))}>
                  Treinar estes
                </a>
              </div>
              <div className="list">
                {weak.map((w) => {
                  const l = itemLabel(w.id);
                  return (
                    <div key={w.id} className="list-item">
                      <span className="chip">{l.kind}</span>
                      {l.ru && <Ru text={l.ru} />}
                      <span className="small muted" style={{ flex: 1 }}>
                        {l.pt}
                      </span>
                      <span className="xs" style={{ color: "var(--bad)" }}>
                        {w.wrong} erro{w.wrong > 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="card">
            <h3>
              <CalendarClock size={18} style={{ verticalAlign: "-3px" }} /> Próximos 7 dias
            </h3>
            <div className="row" style={{ alignItems: "flex-end", gap: 8, height: 110, marginTop: 12 }}>
              {upcoming.map((n, i) => {
                const max = Math.max(1, ...upcoming);
                const d = new Date(now + (i + 1) * DAY);
                return (
                  <div key={i} className="stack" style={{ flex: 1, alignItems: "center", gap: 4 }}>
                    <span className="xs muted">{n}</span>
                    <div style={{ width: "100%", maxWidth: 34, height: `${(n / max) * 70 + 4}px`, borderRadius: 8, background: "var(--teal)", opacity: n ? 1 : 0.25 }} />
                    <span className="xs muted">{d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
