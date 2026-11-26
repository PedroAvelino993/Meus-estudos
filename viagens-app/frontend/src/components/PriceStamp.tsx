// Mostra, em uma linha, de onde veio o preço e quando foi encontrado (nada é inventado).

import { Clock } from "lucide-react";
import type { FlightOffer } from "../types";
import { ago, dateTime } from "../utils/format";

export function PriceStamp({ offer }: { offer: Pick<FlightOffer, "fetchedAt" | "providerLabel" | "availability" | "availabilityNote" | "price"> }) {
  const kind = offer.price.kind === "found" ? "Preço real" : "Preço estimado";
  const avail = offer.availability === "confirmed" ? "lugar confirmado" : "confirme na hora de comprar";
  return (
    <div className="tiny muted row top" style={{ gap: 4 }} title={`${dateTime(offer.fetchedAt)} · ${offer.availabilityNote}`}>
      <Clock size={12} style={{ flex: "none", marginTop: 2 }} />
      <span>
        {kind} do {offer.providerLabel}, {ago(offer.fetchedAt)} · {avail}
      </span>
    </div>
  );
}
