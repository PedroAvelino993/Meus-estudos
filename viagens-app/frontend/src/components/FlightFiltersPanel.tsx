// Filtros dos resultados (aplicados sobre os voos encontrados).

import type { FlightOffer } from "../types";
import { allAirlines, NO_FILTERS, type FlightFilters } from "../services/flights/sort";
import { money } from "../utils/format";

const TIMES: { label: string; from: number; to: number }[] = [
  { label: "Qualquer horário", from: 0, to: 24 },
  { label: "Madrugada (0h–6h)", from: 0, to: 6 },
  { label: "Manhã (6h–12h)", from: 6, to: 12 },
  { label: "Tarde (12h–18h)", from: 12, to: 18 },
  { label: "Noite (18h–24h)", from: 18, to: 24 },
];

export function FlightFiltersPanel({ offers, value, onChange }: { offers: FlightOffer[]; value: FlightFilters; onChange: (f: FlightFilters) => void }) {
  const set = (p: Partial<FlightFilters>) => onChange({ ...value, ...p });
  const prices = offers.map((o) => o.price.total);
  const min = prices.length ? Math.floor(Math.min(...prices)) : 0;
  const max = prices.length ? Math.ceil(Math.max(...prices)) : 0;
  const currency = offers[0]?.price.currency ?? "BRL";
  const airlines = allAirlines(offers);
  const hasConfirmed = offers.some((o) => o.availability === "confirmed");
  const hasBagInfo = offers.some((o) => o.baggage.checked !== null);
  return (
    <aside className="card stack" aria-label="Filtros">
      <div className="row between">
        <h3>Filtros</h3>
        <button className="btn ghost sm" onClick={() => onChange(NO_FILTERS)}>
          Limpar
        </button>
      </div>
      <label className="field">
        <span>Escalas</span>
        <select className="input" value={value.maxStops ?? ""} onChange={(e) => set({ maxStops: e.target.value === "" ? null : Number(e.target.value) })}>
          <option value="">Qualquer número</option>
          <option value="0">Só voos diretos</option>
          <option value="1">Até 1 escala</option>
          <option value="2">Até 2 escalas</option>
        </select>
      </label>
      {max > min && (
        <label className="field">
          <span>Preço máximo: {money(value.maxPrice ?? max, currency)}</span>
          <input type="range" min={min} max={max} step={Math.max(1, Math.round((max - min) / 50))} value={value.maxPrice ?? max} onChange={(e) => set({ maxPrice: Number(e.target.value) >= max ? null : Number(e.target.value) })} />
        </label>
      )}
      <label className="field">
        <span>Partida da ida</span>
        <select className="input" value={`${value.departFrom}-${value.departTo}`} onChange={(e) => {
          const t = TIMES.find((x) => `${x.from}-${x.to}` === e.target.value)!;
          set({ departFrom: t.from, departTo: t.to });
        }}>
          {TIMES.map((t) => (
            <option key={t.label} value={`${t.from}-${t.to}`}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Duração máxima da ida</span>
        <select className="input" value={value.maxDurationH ?? ""} onChange={(e) => set({ maxDurationH: e.target.value ? Number(e.target.value) : null })}>
          <option value="">Qualquer</option>
          {[3, 5, 8, 12, 18, 24, 36].map((h) => (
            <option key={h} value={h}>
              Até {h} horas
            </option>
          ))}
        </select>
      </label>
      {airlines.length > 1 && (
        <div className="field">
          <span>Companhias</span>
          {airlines.map((a) => (
            <label key={a} className="check small">
              <input type="checkbox" checked={value.airlines.includes(a)} onChange={(e) => set({ airlines: e.target.checked ? [...value.airlines, a] : value.airlines.filter((x) => x !== a) })} /> {a}
            </label>
          ))}
          {value.airlines.length === 0 && <span className="tiny muted" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>Nenhuma marcada = todas</span>}
        </div>
      )}
      {hasBagInfo && (
        <label className="check small">
          <input type="checkbox" checked={value.checkedBag} onChange={(e) => set({ checkedBag: e.target.checked })} /> Com mala despachada incluída
        </label>
      )}
      {hasConfirmed && (
        <label className="check small">
          <input type="checkbox" checked={value.confirmedOnly} onChange={(e) => set({ confirmedOnly: e.target.checked })} /> Só disponibilidade confirmada
        </label>
      )}
    </aside>
  );
}
