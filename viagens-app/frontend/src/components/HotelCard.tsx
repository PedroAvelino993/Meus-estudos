// Um hotel: fotos, estrelas, avaliações, localização, serviços, café da manhã e preço.

import { useState } from "react";
import { Bookmark, Check, Coffee, ExternalLink, MapPin, Scale } from "lucide-react";
import type { HotelOffer, HotelSearchParams, Trip } from "../types";
import { ago, money } from "../utils/format";
import { distanceLabel, googleMapsUrl, km, type LatLon } from "../services/maps/geo";
import { hotelProviderLinks } from "../services/hotels/search";
import { saveTrip } from "../database/trips";
import { SaveToTrip } from "./SaveToTrip";
import { Tag } from "./ui";

export function Stars({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="stars" aria-label={`${n} estrelas`}>
      {"★".repeat(Math.round(n))}
    </span>
  );
}

export function HotelCard({ h, params, center, compared, onCompare }: { h: HotelOffer; params: HotelSearchParams; center?: LatLon | null; compared: boolean; onCompare: () => void }) {
  const [photo, setPhoto] = useState(0);
  const [saving, setSaving] = useState(false);
  const dist = center && h.lat !== undefined && h.lon !== undefined ? km(center, { lat: h.lat, lon: h.lon }) : null;
  const links = [...h.links, ...hotelProviderLinks(params, h.name).filter((l) => !h.links.some((x) => x.label === l.label))];
  return (
    <article className="card hotel">
      <div className="hotel-photo" style={{ backgroundImage: h.photos[photo] ? `url("${h.photos[photo]}")` : undefined }} role="img" aria-label={`Foto de ${h.name}`}>
        {h.photos.length > 1 && (
          <div className="photo-nav">
            <button onClick={() => setPhoto((p) => (p - 1 + h.photos.length) % h.photos.length)} aria-label="Foto anterior">
              ‹
            </button>
            <span className="tiny" style={{ background: "rgba(0,0,0,.55)", color: "#fff", borderRadius: 6, padding: "3px 6px" }}>
              {photo + 1}/{h.photos.length}
            </span>
            <button onClick={() => setPhoto((p) => (p + 1) % h.photos.length)} aria-label="Próxima foto">
              ›
            </button>
          </div>
        )}
      </div>
      <div className="hotel-body">
        <div className="row wrap" style={{ gap: 6 }}>
          <h3 className="grow">{h.name}</h3>
          <Stars n={h.stars} />
        </div>
        <div className="row wrap small" style={{ gap: 10 }}>
          {h.rating !== undefined && (
            <span>
              <b>{h.rating.toFixed(1).replace(".", ",")}</b>/5 <span className="muted">({h.reviews?.toLocaleString("pt-BR") ?? 0} avaliações)</span>
            </span>
          )}
          {h.locationRating !== undefined && <span className="muted">Localização {h.locationRating.toFixed(1).replace(".", ",")}/5</span>}
          {dist !== null && (
            <a href={googleMapsUrl({ lat: h.lat, lon: h.lon })} target="_blank" rel="noopener" className="row" style={{ gap: 3 }}>
              <MapPin size={13} /> {distanceLabel(dist)} do centro
            </a>
          )}
        </div>
        {h.nearby.length > 0 && <div className="small muted">Perto de: {h.nearby.slice(0, 3).map((n) => `${n.name}${n.transport ? ` (${n.transport})` : ""}`).join(" · ")}</div>}
        <div className="row wrap" style={{ gap: 6 }}>
          {h.breakfast === true && (
            <Tag kind="good">
              <Coffee size={12} /> Café da manhã incluso
            </Tag>
          )}
          {h.breakfast === false && <Tag>Sem café da manhã</Tag>}
          {h.amenities.slice(0, 6).map((a) => (
            <Tag key={a}>{a}</Tag>
          ))}
        </div>
        {(h.checkInTime || h.checkOutTime) && (
          <div className="tiny muted">
            Entrada {h.checkInTime ?? "—"} · Saída {h.checkOutTime ?? "—"}
          </div>
        )}
      </div>
      <div className="hotel-side">
        {h.priceKind === "found" ? (
          <div>
            <div className="price">{money(h.total, h.currency)}</div>
            <div className="small muted">
              {money(h.nightly, h.currency)} por diária · {h.nights} noite(s) · {h.guests} hóspede(s) · {h.rooms} quarto(s)
            </div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              <Tag kind="brand">Preço encontrado</Tag> {ago(h.fetchedAt)} · {h.providerLabel}
            </div>
          </div>
        ) : (
          <div className="small muted">Sem preço para essas datas na fonte. Veja nos sites abaixo.</div>
        )}
        {h.sources.length > 0 && <div className="tiny muted">Ofertas de: {h.sources.slice(0, 4).map((s) => `${s.name}${s.nightly ? ` ${money(s.nightly, h.currency)}` : ""}`).join(" · ")}</div>}
        <div className="stack tight">
          {links.slice(0, 3).map((l, i) => (
            <a key={l.label} className={`btn ${i === 0 ? "primary" : ""} sm`} href={l.url} target="_blank" rel="noopener">
              {i === 0 ? "Reservar: " : ""}
              {l.label} <ExternalLink size={13} />
            </a>
          ))}
          <div className="row">
            <button className={`btn sm grow ${compared ? "primary" : ""}`} onClick={onCompare}>
              {compared ? <Check size={13} /> : <Scale size={13} />} Comparar
            </button>
            <button className="btn sm grow" onClick={() => setSaving(true)}>
              <Bookmark size={13} /> Salvar
            </button>
          </div>
        </div>
      </div>
      {saving && <SaveToTrip title="Salvar hotel na viagem" suggestedName={`Viagem para ${params.query}`} onClose={() => setSaving(false)} onPick={(t: Trip) => saveTrip({ ...t, hotel: h, startDate: t.startDate ?? params.checkIn, endDate: t.endDate ?? params.checkOut })} />}
    </article>
  );
}
