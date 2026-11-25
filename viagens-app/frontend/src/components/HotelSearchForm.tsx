// Busca de hotéis: destino, datas, hóspedes (com idades das crianças) e quartos.

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import type { HotelSearchParams } from "../types";
import { today } from "../utils/dates";
import { Counter } from "./ui";

export function HotelSearchForm({ initial, onSearch }: { initial: HotelSearchParams; onSearch: (p: HotelSearchParams) => void }) {
  const [p, setP] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const set = (x: Partial<HotelSearchParams>) => {
    setP((c) => ({ ...c, ...x }));
    setError(null);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (p.query.trim().length < 2) return setError("Digite a cidade, o bairro ou o nome do hotel.");
    if (p.checkIn < today()) return setError("A data de entrada já passou.");
    if (p.checkOut <= p.checkIn) return setError("A saída precisa ser depois da entrada.");
    onSearch({ ...p, query: p.query.trim() });
  };
  return (
    <form className="stack" onSubmit={submit} aria-label="Pesquisar hotéis">
      <div className="grid g4">
        <label className="field">
          <span>Destino</span>
          <input className="input" value={p.query} onChange={(e) => set({ query: e.target.value })} placeholder="Cidade, bairro ou hotel" />
        </label>
        <label className="field">
          <span>Entrada</span>
          <input className="input" type="date" min={today()} value={p.checkIn} onChange={(e) => set({ checkIn: e.target.value, checkOut: e.target.value >= p.checkOut ? e.target.value : p.checkOut })} />
        </label>
        <label className="field">
          <span>Saída</span>
          <input className="input" type="date" min={p.checkIn} value={p.checkOut} onChange={(e) => set({ checkOut: e.target.value })} />
        </label>
        <div className="field ac">
          <span>Hóspedes e quartos</span>
          <button type="button" className="input" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => setGuestsOpen((o) => !o)}>
            {p.adults + p.children} hóspede(s) · {p.rooms} quarto(s)
          </button>
          {guestsOpen && (
            <div className="pop">
              <Counter label="Adultos" value={p.adults} min={1} max={12} onChange={(adults) => set({ adults })} />
              <Counter label="Crianças" hint="0 a 17 anos" value={p.children} min={0} max={8} onChange={(children) => set({ children, childrenAges: [...p.childrenAges, 8].slice(0, children) })} />
              {p.childrenAges.map((a, i) => (
                <label key={i} className="row small between" style={{ padding: "3px 0" }}>
                  Idade da criança {i + 1}
                  <select className="input" style={{ width: 90, minHeight: 34, padding: "4px 8px" }} value={a} onChange={(e) => set({ childrenAges: p.childrenAges.map((x, j) => (j === i ? Number(e.target.value) : x)) })}>
                    {Array.from({ length: 18 }, (_, n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "ano" : "anos"}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <Counter label="Quartos" value={p.rooms} min={1} max={8} onChange={(rooms) => set({ rooms })} />
              <button type="button" className="btn primary block" style={{ marginTop: 8 }} onClick={() => setGuestsOpen(false)}>
                Pronto
              </button>
            </div>
          )}
        </div>
      </div>
      {error && <div className="small" style={{ color: "var(--bad)" }} role="alert">{error}</div>}
      <button className="btn primary lg">
        <Search size={18} /> Pesquisar hotéis
      </button>
    </form>
  );
}
