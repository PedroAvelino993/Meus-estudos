// Mostra uma opção de voo por vez, com «Ver outra opção» para passar para a próxima.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FlightOffer } from "../types";

export function FlightPager({ offers, title, render }: { offers: FlightOffer[]; title?: (index: number) => ReactNode; render: (offer: FlightOffer) => ReactNode }) {
  const [i, setI] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const ids = offers.map((o) => o.id).join("|");
  useEffect(() => {
    setI(0);
    moved.current = false;
  }, [ids]);
  useEffect(() => {
    // Ao trocar de opção, volta para o começo do cartão (no celular o botão fica lá embaixo)
    if (moved.current) top.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [i]);
  if (!offers.length) return null;
  const idx = Math.min(i, offers.length - 1);
  const go = (n: number) => {
    moved.current = true;
    setI(n);
  };
  return (
    <div className="stack" ref={top} style={{ scrollMarginTop: 80 }}>
      {title && <div className="bold">{title(idx)}</div>}
      {render(offers[idx])}
      {offers.length > 1 && (
        <div className="pager">
          <button className="btn prev" disabled={idx === 0} onClick={() => go(idx - 1)} aria-label="Opção anterior">
            <ChevronLeft size={16} /> <span>Anterior</span>
          </button>
          <span className="count small muted">
            Opção {idx + 1} de {offers.length}
          </span>
          {idx < offers.length - 1 ? (
            <button className="btn" onClick={() => go(idx + 1)}>
              Ver outra opção <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn" onClick={() => go(0)}>
              Voltar à primeira
            </button>
          )}
        </div>
      )}
    </div>
  );
}
