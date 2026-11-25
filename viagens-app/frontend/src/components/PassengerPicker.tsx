// Passageiros (adultos, crianças, bebês) e classe da passagem.

import { useEffect, useRef, useState } from "react";
import type { CabinClass, FlightSearchParams } from "../types";
import { CABIN_LABEL, passengersLabel } from "../services/flights/params";
import { Counter } from "./ui";

export function PassengerPicker({ value, onChange }: { value: FlightSearchParams; onChange: (p: Partial<FlightSearchParams>) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const total = value.adults + value.children + value.infants;
  return (
    <div className="field ac" ref={box}>
      <span>Passageiros e classe</span>
      <button type="button" className="input" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {total} · {CABIN_LABEL[value.cabin]}
      </button>
      {open && (
        <div className="pop">
          <Counter label="Adultos" hint="12 anos ou mais" value={value.adults} min={1} max={9 - value.children - value.infants} onChange={(adults) => onChange({ adults, infants: Math.min(value.infants, adults) })} />
          <Counter label="Crianças" hint="2 a 11 anos" value={value.children} min={0} max={9 - value.adults - value.infants} onChange={(children) => onChange({ children })} />
          <Counter label="Bebês" hint="Menos de 2 anos, no colo" value={value.infants} min={0} max={Math.min(value.adults, 9 - value.adults - value.children)} onChange={(infants) => onChange({ infants })} />
          <div className="divider" />
          <label className="field">
            <span>Classe</span>
            <select className="input" value={value.cabin} onChange={(e) => onChange({ cabin: e.target.value as CabinClass })}>
              {(Object.keys(CABIN_LABEL) as CabinClass[]).map((c) => (
                <option key={c} value={c}>
                  {CABIN_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <div className="tiny muted" style={{ marginTop: 8 }}>
            {passengersLabel(value)}. Até 9 passageiros; 1 bebê por adulto.
          </div>
          <button type="button" className="btn primary block" style={{ marginTop: 10 }} onClick={() => setOpen(false)}>
            Pronto
          </button>
        </div>
      )}
    </div>
  );
}
