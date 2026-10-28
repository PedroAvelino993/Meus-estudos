// Teclado cirílico virtual (layout ЙЦУКЕН, o padrão russo), para quem não tem teclado russo instalado.

import { useState } from "react";
import { ArrowBigUp, CornerDownLeft, Delete } from "lucide-react";
import { useShowTranslit } from "./ru";
import { sfx } from "../audio/sfx";

const ROWS = [
  ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ъ"],
  ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
  ["я", "ч", "с", "м", "и", "т", "ь", "б", "ю", "ё"],
];

const HINT: Record<string, string> = {
  й: "i", ц: "ts", у: "u", к: "k", е: "ie", н: "n", г: "g", ш: "sh", щ: "shch", з: "z", х: "kh", ъ: "duro",
  ф: "f", ы: "y", в: "v", а: "a", п: "p", р: "r", о: "o", л: "l", д: "d", ж: "j", э: "é",
  я: "ia", ч: "tch", с: "s", м: "m", и: "i", т: "t", ь: "brando", б: "b", ю: "iu", ё: "io",
};

export function Keyboard({ value, onChange, onEnter, enterLabel = "OK" }: { value: string; onChange: (v: string) => void; onEnter?: () => void; enterLabel?: string }) {
  const [shift, setShift] = useState(false);
  const hints = useShowTranslit();
  const type = (ch: string) => {
    sfx.tap();
    onChange(value + (shift ? ch.toUpperCase() : ch));
    if (shift) setShift(false);
  };
  return (
    <div className="kbd" role="group" aria-label="Teclado russo">
      {ROWS.map((row, r) => (
        <div className="kbd-row" key={r}>
          {r === 2 && (
            <button type="button" className={`kbd-key wide ${shift ? "active" : ""}`} onClick={() => setShift((s) => !s)} aria-label="Maiúscula" aria-pressed={shift}>
              <ArrowBigUp size={18} />
            </button>
          )}
          {row.map((k) => (
            <button key={k} type="button" className="kbd-key" onClick={() => type(k)} aria-label={k}>
              <span>{shift ? k.toUpperCase() : k}</span>
              {hints && <small>{HINT[k]}</small>}
            </button>
          ))}
          {r === 2 && (
            <button type="button" className="kbd-key wide" onClick={() => onChange([...value].slice(0, -1).join(""))} aria-label="Apagar">
              <Delete size={18} />
            </button>
          )}
        </div>
      ))}
      <div className="kbd-row">
        <button type="button" className="kbd-key" onClick={() => type("-")} aria-label="hífen">
          -
        </button>
        <button type="button" className="kbd-key" onClick={() => type(",")} aria-label="vírgula">
          ,
        </button>
        <button type="button" className="kbd-key space" onClick={() => onChange(value + " ")} aria-label="Espaço">
          espaço
        </button>
        <button type="button" className="kbd-key" onClick={() => type("?")} aria-label="interrogação">
          ?
        </button>
        {onEnter && (
          <button type="button" className="kbd-key wide" onClick={onEnter} aria-label={enterLabel}>
            <CornerDownLeft size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

/** O teclado do app deve abrir sozinho? Em telas de toque, sim (sem teclado russo instalado é o mais comum). */
export function prefersAppKeyboard(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}
