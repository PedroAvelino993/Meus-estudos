// Comparador: voos encontrados (e opções digitadas) lado a lado, e viagens salvas.

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ManualOption, Trip } from "../types";
import { clearCompare, compareOffers, manualOptions, removeManual, saveManual, toggleCompare } from "../database/compare";
import { budgetSummary, listTrips } from "../database/trips";
import { useStore } from "../hooks/useStore";
import { fromManual, fromOffer, summarize } from "../services/flights/compare";
import { baggageText } from "../components/FlightCard";
import { Empty, Notice, Seg } from "../components/ui";
import { ago, dayLabel, duration, money } from "../utils/format";
import { uid } from "../utils/text";

function ManualForm() {
  const [m, setM] = useState({ label: "", route: "", price: "", hours: "", minutes: "", stops: "0", baggage: "", notes: "" });
  const set = (p: Partial<typeof m>) => setM({ ...m, ...p });
  return (
    <form
      className="card stack"
      onSubmit={(e) => {
        e.preventDefault();
        const price = Number(m.price.replace(",", "."));
        const durationMin = (Number(m.hours) || 0) * 60 + (Number(m.minutes) || 0);
        if (!m.label.trim() || !(price > 0) || !(durationMin > 0)) return;
        const opt: ManualOption = { id: uid("m_"), label: m.label.trim(), route: m.route.trim(), price, durationMin, stops: Math.max(0, Number(m.stops) || 0), baggage: m.baggage.trim(), notes: m.notes.trim() };
        saveManual(opt);
        setM({ label: "", route: "", price: "", hours: "", minutes: "", stops: "0", baggage: "", notes: "" });
      }}
    >
      <h3>Adicionar uma opção que você viu em outro site</h3>
      <div className="small muted">Ela aparece marcada como «informado por você».</div>
      <div className="grid g4">
        <label className="field">
          <span>Nome</span>
          <input className="input" value={m.label} onChange={(e) => set({ label: e.target.value })} placeholder="Ex.: Opção B" />
        </label>
        <label className="field">
          <span>Trecho</span>
          <input className="input" value={m.route} onChange={(e) => set({ route: e.target.value })} placeholder="Ex.: Fortaleza → São Paulo" />
        </label>
        <label className="field">
          <span>Preço total (R$)</span>
          <input className="input" inputMode="decimal" value={m.price} onChange={(e) => set({ price: e.target.value })} />
        </label>
        <label className="field">
          <span>Duração</span>
          <div className="row">
            <input className="input" inputMode="numeric" value={m.hours} onChange={(e) => set({ hours: e.target.value })} placeholder="h" aria-label="Horas" />
            <input className="input" inputMode="numeric" value={m.minutes} onChange={(e) => set({ minutes: e.target.value })} placeholder="min" aria-label="Minutos" />
          </div>
        </label>
        <label className="field">
          <span>Escalas</span>
          <input className="input" type="number" min={0} max={4} value={m.stops} onChange={(e) => set({ stops: e.target.value })} />
        </label>
        <label className="field">
          <span>Bagagem</span>
          <input className="input" value={m.baggage} onChange={(e) => set({ baggage: e.target.value })} placeholder="Ex.: 1 mala de 23 kg" />
        </label>
        <label className="field" style={{ gridColumn: "span 2" }}>
          <span>Condições</span>
          <input className="input" value={m.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Ex.: sem reembolso" />
        </label>
      </div>
      <button className="btn" style={{ alignSelf: "flex-start" }}>
        <Plus size={15} /> Adicionar ao comparador
      </button>
    </form>
  );
}

function FlightsCompare() {
  const offers = useStore(compareOffers);
  const manual = useStore(manualOptions);
  const items = [...offers.map((o) => fromOffer(o, baggageText(o))), ...manual.map(fromManual)];
  const s = summarize(items, (n) => money(n), duration);
  const cheapest = items.length ? Math.min(...items.map((i) => i.price)) : 0;
  const fastest = items.length ? Math.min(...items.map((i) => i.durationMin)) : 0;
  return (
    <div className="stack">
      {!items.length && <Empty>Nenhuma opção para comparar. Na pesquisa de passagens, toque em «Comparar» nos voos (até 4), ou adicione abaixo.</Empty>}
      {s && <Notice kind="info">{s.insight}</Notice>}
      {items.length > 0 && (
        <div className="card scroll-x">
          <table className="compare">
            <tbody>
              <tr>
                <th>Opção</th>
                {items.map((i) => (
                  <td key={i.id}>
                    <b>{i.label}</b>
                    <div className="tiny muted">{i.route}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <th>Preço</th>
                {items.map((i) => (
                  <td key={i.id} className={i.price === cheapest ? "best" : ""}>
                    <b className="num">{money(i.price, i.currency)}</b>
                    <div className="tiny muted">{i.price === cheapest ? "mais barata" : `+${money(i.price - cheapest, i.currency)}`}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <th>Duração (ida)</th>
                {items.map((i) => (
                  <td key={i.id} className={i.durationMin === fastest ? "best" : ""}>
                    {duration(i.durationMin)}
                    <div className="tiny muted">{i.durationMin === fastest ? "mais rápida" : `+${duration(i.durationMin - fastest)}`}</div>
                  </td>
                ))}
              </tr>
              <tr>
                <th>Escalas</th>
                {items.map((i) => (
                  <td key={i.id} className={s?.fewestStopsIds.includes(i.id) ? "best" : ""}>
                    {i.stops === 0 ? "Direto" : `${i.stops} escala(s)`}
                  </td>
                ))}
              </tr>
              <tr>
                <th>Bagagem</th>
                {items.map((i) => (
                  <td key={i.id} className="small">
                    {i.baggage}
                  </td>
                ))}
              </tr>
              <tr>
                <th>Condições</th>
                {items.map((i) => (
                  <td key={i.id} className="small">
                    {i.conditions}
                  </td>
                ))}
              </tr>
              <tr>
                <th>Fonte do preço</th>
                {items.map((i) => (
                  <td key={i.id} className="tiny muted">
                    {i.source}
                    {i.fetchedAt ? ` · encontrado ${ago(i.fetchedAt)}` : ""}
                  </td>
                ))}
              </tr>
              <tr>
                <th />
                {items.map((i) => (
                  <td key={i.id}>
                    <button className="btn sm ghost danger" onClick={() => (i.origin === "manual" ? removeManual(i.id) : toggleCompare(offers.find((o) => o.id === i.id)!))}>
                      <Trash2 size={13} /> Tirar
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {items.length > 0 && (
        <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={clearCompare}>
          Limpar comparador
        </button>
      )}
      <ManualForm />
    </div>
  );
}

function TripsCompare() {
  const trips = useStore(listTrips);
  const [sel, setSel] = useState<string[]>([]);
  const chosen = trips.filter((t) => sel.includes(t.id));
  const totals = chosen.map((t) => budgetSummary(t).total);
  const min = totals.length ? Math.min(...totals) : 0;
  const row = (label: string, f: (t: Trip) => string) => (
    <tr>
      <th>{label}</th>
      {chosen.map((t) => (
        <td key={t.id}>{f(t)}</td>
      ))}
    </tr>
  );
  return (
    <div className="stack">
      {trips.length < 2 && <Empty>Salve pelo menos duas viagens (por exemplo, duas opções de datas ou destinos) para comparar.</Empty>}
      <div className="row wrap">
        {trips.map((t) => (
          <label key={t.id} className="check small card flat" style={{ padding: "6px 10px" }}>
            <input type="checkbox" checked={sel.includes(t.id)} onChange={(e) => setSel(e.target.checked ? [...sel, t.id].slice(-4) : sel.filter((x) => x !== t.id))} /> {t.name}
          </label>
        ))}
      </div>
      {chosen.length >= 2 && (
        <div className="card scroll-x">
          <table className="compare">
            <tbody>
              {row("Destino", (t) => t.destination?.name ?? "—")}
              {row("Datas", (t) => (t.startDate ? `${dayLabel(t.startDate)}${t.endDate ? ` – ${dayLabel(t.endDate)}` : ""}` : "—"))}
              {row("Passagens", (t) => (t.outbound ? `${money(t.outbound.price.total + (t.inbound && t.inbound.id !== t.outbound.id ? t.inbound.price.total : 0), t.currency)} · ${t.outbound.airlines.join(", ")}` : "—"))}
              {row("Hotel", (t) => (t.hotel ? `${t.hotel.name} · ${money(t.hotel.total, t.currency)}` : "—"))}
              {row("Passeios salvos", (t) => String(t.activities.length))}
              <tr>
                <th>Total estimado</th>
                {chosen.map((t, i) => (
                  <td key={t.id} className={totals[i] === min ? "best" : ""}>
                    <b className="num">{money(totals[i], t.currency)}</b>
                    <div className="tiny muted">{totals[i] === min ? "mais econômica" : `+${money(totals[i] - min, t.currency)}`}</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ComparePage() {
  const [tab, setTab] = useState<"voos" | "viagens">("voos");
  return (
    <div className="stack">
      <h1>Comparar</h1>
      <Seg value={tab} onChange={setTab} label="O que comparar" options={[{ id: "voos", label: "Passagens" }, { id: "viagens", label: "Viagens salvas" }]} />
      {tab === "voos" ? <FlightsCompare /> : <TripsCompare />}
    </div>
  );
}
