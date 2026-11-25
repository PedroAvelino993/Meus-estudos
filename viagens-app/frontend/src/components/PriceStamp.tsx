// Mostra de onde veio o preço, quando foi encontrado e se a disponibilidade está confirmada.

import { CheckCircle2, Clock } from "lucide-react";
import type { FlightOffer } from "../types";
import { ago, dateTime } from "../utils/format";
import { Tag } from "./ui";

export function PriceStamp({ offer }: { offer: Pick<FlightOffer, "fetchedAt" | "providerLabel" | "availability" | "availabilityNote" | "price"> }) {
  return (
    <div className="stack tight">
      <div className="row wrap" style={{ gap: 6 }}>
        {offer.price.kind === "found" ? <Tag kind="brand">Preço encontrado</Tag> : <Tag kind="warn">Preço estimado</Tag>}
        {offer.availability === "confirmed" ? (
          <Tag kind="good" title={offer.availabilityNote}>
            <CheckCircle2 size={12} /> Disponibilidade confirmada
          </Tag>
        ) : (
          <Tag title={offer.availabilityNote}>Disponibilidade não confirmada</Tag>
        )}
      </div>
      <div className="tiny muted row" style={{ gap: 4 }} title={dateTime(offer.fetchedAt)}>
        <Clock size={12} /> Atualizado {ago(offer.fetchedAt)} · {offer.providerLabel}
      </div>
    </div>
  );
}
