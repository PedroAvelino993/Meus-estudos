// Roteiro dia a dia, com distâncias entre as paradas e link de rota no mapa.

import { ExternalLink, Utensils } from "lucide-react";
import type { ItineraryDay } from "../services/destinations/itinerary";
import { distanceLabel, googleMapsUrl, googleRouteUrl } from "../services/maps/geo";

export function ItineraryView({ days }: { days: ItineraryDay[] }) {
  return (
    <div className="stack">
      {days.map((d) => (
        <div key={d.day} className="day stack tight">
          <div className="row between wrap">
            <b>Dia {d.day}</b>
            <a className="small" href={googleRouteUrl(d.items.map((i) => i.poi))} target="_blank" rel="noopener">
              Ver rota do dia no mapa <ExternalLink size={12} />
            </a>
          </div>
          {d.items.map((it, i) => (
            <div key={it.poi.id} className="small">
              <span className="muted">{it.period}:</span> <b>{it.poi.name}</b> <span className="muted">({it.poi.kind}{it.legKm !== null && i > 0 ? `, ${distanceLabel(it.legKm)} da parada anterior` : ""})</span>
            </div>
          ))}
          {d.lunch && (
            <div className="small row" style={{ gap: 5 }}>
              <Utensils size={13} className="muted" /> Almoço perto:{" "}
              <a href={googleMapsUrl(d.lunch)} target="_blank" rel="noopener">
                {d.lunch.name}
              </a>
              {d.lunch.cuisine && <span className="muted">({d.lunch.cuisine})</span>}
            </div>
          )}
          <div className="tiny muted">Deslocamento total entre as paradas: {distanceLabel(d.totalKm)}</div>
        </div>
      ))}
    </div>
  );
}
