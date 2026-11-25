// Formulário principal: origem, destino, datas, passageiros, classe, só ida/ida e volta e voo direto.

import { useState, type FormEvent } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import type { FlightSearchParams } from "../types";
import { addDays, today } from "../utils/dates";
import { AirportInput } from "./AirportInput";
import { PassengerPicker } from "./PassengerPicker";
import { Seg } from "./ui";

export function FlightSearchForm({ initial, onSearch, compact }: { initial: FlightSearchParams; onSearch: (p: FlightSearchParams) => void; compact?: boolean }) {
  const [p, setP] = useState<FlightSearchParams>(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (x: Partial<FlightSearchParams>) => {
    setP((cur) => ({ ...cur, ...x }));
    setError(null);
  };
  const roundTrip = p.returnDate !== undefined;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!p.origin.length) return setError("Escolha a cidade ou o aeroporto de origem na lista.");
    if (!p.destination.length) return setError("Escolha a cidade ou o aeroporto de destino na lista.");
    if (p.origin.some((c) => p.destination.includes(c))) return setError("Origem e destino precisam ser diferentes.");
    if (p.departDate < today()) return setError("A data de ida já passou.");
    if (roundTrip && (!p.returnDate || p.returnDate < p.departDate)) return setError("A volta precisa ser no mesmo dia ou depois da ida.");
    onSearch(p);
  };

  return (
    <form onSubmit={submit} className="stack" aria-label="Pesquisar passagens">
      <div className="row wrap between">
        <Seg value={roundTrip ? "rt" : "ow"} label="Tipo de viagem" onChange={(v) => set({ returnDate: v === "rt" ? (p.returnDate ?? addDays(p.departDate, 7)) : undefined })} options={[{ id: "rt", label: "Ida e volta" }, { id: "ow", label: "Só ida" }]} />
        <label className="check small">
          <input type="checkbox" checked={p.directOnly} onChange={(e) => set({ directOnly: e.target.checked })} /> Só voos diretos
        </label>
      </div>
      <div className="search-grid">
        <AirportInput label="De onde" value={p.origin} onChange={(origin) => set({ origin })} placeholder="Cidade ou aeroporto" autoFocus={!compact && !p.origin.length} />
        <button type="button" className="btn ghost swap" aria-label="Inverter origem e destino" onClick={() => set({ origin: p.destination, destination: p.origin })}>
          <ArrowLeftRight size={18} />
        </button>
        <AirportInput label="Para onde" value={p.destination} onChange={(destination) => set({ destination })} placeholder="Cidade ou aeroporto" />
        <label className="field">
          <span>Ida</span>
          <input className="input" type="date" required min={today()} value={p.departDate} onChange={(e) => set({ departDate: e.target.value, returnDate: roundTrip && p.returnDate && p.returnDate < e.target.value ? e.target.value : p.returnDate })} />
        </label>
        <label className="field">
          <span>Volta</span>
          <input className="input" type="date" min={p.departDate} disabled={!roundTrip} value={p.returnDate ?? ""} onChange={(e) => set({ returnDate: e.target.value })} aria-label="Data de volta" />
        </label>
        <div className="span-all">
          <PassengerPicker value={p} onChange={set} />
        </div>
      </div>
      {error && <div className="small" style={{ color: "var(--bad)" }} role="alert">{error}</div>}
      <button type="submit" className="btn primary lg">
        <Search size={18} /> Pesquisar passagens
      </button>
    </form>
  );
}
