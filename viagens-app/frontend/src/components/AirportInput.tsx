// Campo de origem/destino com sugestões de cidades e aeroportos (teclado e toque).

import { useEffect, useRef, useState } from "react";
import { Building2, Plane } from "lucide-react";
import { labelFor, suggest, type PlaceOption } from "../services/flights/airports";

export function AirportInput({ label, value, onChange, placeholder, autoFocus }: { label: string; value: string[]; onChange: (codes: string[]) => void; placeholder: string; autoFocus?: boolean }) {
  const [text, setText] = useState(() => labelFor(value));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const box = useRef<HTMLLabelElement>(null);

  useEffect(() => setText(labelFor(value)), [value.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const pick = (o: PlaceOption) => {
    onChange(o.codes);
    setText(o.label);
    setOpen(false);
  };

  return (
    <label className="field ac" ref={box}>
      <span>{label}</span>
      <input
        className="input"
        value={text}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        onFocus={(e) => {
          e.target.select();
          if (options.length) setOpen(true);
        }}
        onChange={(e) => {
          setText(e.target.value);
          const s = suggest(e.target.value);
          setOptions(s);
          setActive(0);
          setOpen(s.length > 0);
          if (!e.target.value) onChange([]);
        }}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(options.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" || e.key === "Tab") {
            if (options[active]) {
              if (e.key === "Enter") e.preventDefault();
              pick(options[active]);
            }
          } else if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => {
          // Texto sem escolher: usa a primeira sugestão, se houver
          if (!value.length && options[0] && text.length >= 2) pick(options[0]);
        }}
      />
      {open && (
        <div className="ac-list" role="listbox">
          {options.map((o, i) => (
            <div key={o.codes.join() + o.kind} role="option" aria-selected={i === active} className={`ac-item ${i === active ? "on" : ""}`} onMouseDown={(e) => (e.preventDefault(), pick(o))} onMouseEnter={() => setActive(i)}>
              {o.kind === "city" ? <Building2 size={17} className="muted" /> : <Plane size={17} className="muted" />}
              <div className="grow">
                <div className="bold ellipsis">{o.label}</div>
                <div className="tiny muted ellipsis">{o.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </label>
  );
}
