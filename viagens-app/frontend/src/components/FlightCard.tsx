// Um resultado de voo: horários, duração, escalas, conexões, bagagem, regras, preço e compra.

import { useState } from "react";
import { Bookmark, Check, ChevronDown, ChevronUp, ExternalLink, Luggage, Repeat2, Scale, ShoppingCart } from "lucide-react";
import type { FlightLeg, FlightOffer, Trip } from "../types";
import { clock, dayLabel, dayShift, duration, money, plural } from "../utils/format";
import { cityOf } from "../services/flights/airports";
import { isCompared, toggleCompare } from "../database/compare";
import { saveTrip } from "../database/trips";
import { useStore } from "../hooks/useStore";
import { navigate } from "../hooks/useRoute";
import { PriceStamp } from "./PriceStamp";
import { SaveToTrip } from "./SaveToTrip";
import { Tag, toast } from "./ui";

function LegSummary({ leg, label }: { leg: FlightLeg; label: string }) {
  const plus = dayShift(leg.departure, leg.arrival);
  return (
    <div className="stack tight">
      <div className="tiny muted">
        {label} · {dayLabel(leg.departure)}
      </div>
      <div className="leg">
        <div>
          <div className="t">{clock(leg.departure)}</div>
          <div className="small muted">{leg.from.code}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="small muted">{duration(leg.durationMin)}</div>
          <div className="line">
            {leg.layovers.map((_, i) => (
              <i key={i} style={{ left: `${((i + 1) / (leg.layovers.length + 1)) * 100}%` }} />
            ))}
          </div>
          <div className="small" style={{ color: leg.stops ? "var(--warn)" : "var(--good)", fontWeight: 650 }}>
            {leg.stops === 0 ? "Direto" : `${plural(leg.stops, "escala", "escalas")}: ${leg.layovers.map((l) => l.airport.code).join(", ")}`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="t">
            {clock(leg.arrival)}
            {plus > 0 && <sup className="small" style={{ color: "var(--warn)" }}>+{plus}</sup>}
          </div>
          <div className="small muted">{leg.to.code}</div>
        </div>
      </div>
    </div>
  );
}

function LegDetails({ leg, label }: { leg: FlightLeg; label: string }) {
  return (
    <div className="stack tight">
      <div className="bold small">
        {label}: {cityOf(leg.from.code)} → {cityOf(leg.to.code)} · {duration(leg.durationMin)} no total
      </div>
      {leg.segments.map((s, i) => (
        <div key={i}>
          <div className="seg-row">
            <div className="num small bold">{clock(s.departure)}</div>
            <div className="small">
              {s.from.name} ({s.from.code})
            </div>
          </div>
          <div className="seg-row">
            <div />
            <div className="tiny muted">
              {s.carrier} · voo {s.flightNumber} · {duration(s.durationMin)}
              {s.aircraft ? ` · ${s.aircraft}` : ""}
              {s.overnight ? " · voo noturno" : ""}
            </div>
          </div>
          <div className="seg-row">
            <div className="num small bold">{clock(s.arrival)}</div>
            <div className="small">
              {s.to.name} ({s.to.code}){dayShift(s.departure, s.arrival) > 0 ? ` · chega ${dayLabel(s.arrival)}` : ""}
            </div>
          </div>
          {leg.layovers[i] && (
            <div className="layover">
              Conexão em {leg.layovers[i].airport.name}: espera de {duration(leg.layovers[i].durationMin)}
              {leg.layovers[i].overnight ? " (passa a noite)" : ""}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function baggageText(o: FlightOffer): string {
  const b = o.baggage;
  if (b.checked !== null || b.carryOn !== null) {
    const parts = [];
    if (b.carryOn !== null) parts.push(b.carryOn ? `${b.carryOn} bagagem de mão` : "sem bagagem de mão");
    if (b.checked !== null) parts.push(b.checked ? `${b.checked} mala despachada` : "sem mala despachada");
    return parts.join(" · ") + " (por passageiro)";
  }
  return b.notes.join(" · ") || "Não informada pela fonte";
}

export function FlightCard({ offer, onChooseReturn, onBuy, chosenLabel }: { offer: FlightOffer; onChooseReturn?: (o: FlightOffer) => void; onBuy?: (o: FlightOffer) => void; chosenLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const compared = useStore(() => isCompared(offer.id));
  const legLabel = (i: number) => (offer.legs.length > 1 ? (i === 0 ? "Ida" : "Volta") : offer.tripType === "round_trip" && !chosenLabel ? "Ida" : (chosenLabel ?? "Ida"));
  const logos = offer.legs[0].segments[0]?.carrierCode ?? offer.airlines[0]?.slice(0, 2).toUpperCase();
  const needsReturn = offer.booking.kind === "serpapi_return";

  // Fora da página de busca (ex.: viagem salva) não há como continuar a oferta: refaz a busca com o preço atual
  const canContinue = offer.booking.kind === "link" || (needsReturn ? !!onChooseReturn : !!onBuy);
  const research = () => {
    const l = offer.legs[0];
    navigate("voos", { de: l.from.code, para: (offer.legs[1]?.from ?? l.to).code, ida: offer.departDate, volta: offer.returnDate, adultos: offer.passengers });
  };
  const action = () => {
    if (!canContinue) return research();
    if (offer.booking.kind === "link") window.open(offer.booking.url, "_blank", "noopener");
    else if (offer.booking.kind === "serpapi_return") onChooseReturn?.(offer);
    else onBuy?.(offer);
  };
  const actionLabel = !canContinue ? "Ver preço atual e comprar" : offer.booking.kind === "link" ? offer.booking.label : needsReturn ? "Escolher a volta" : "Ver onde comprar";

  return (
    <article className="card flight">
      <div className="flight-main">
        <div className="row" style={{ gap: 8 }}>
          <div className="airline-logo" aria-hidden>
            {logos}
          </div>
          <div className="bold ellipsis grow">{offer.airlines.join(" + ")}</div>
          {offer.fareName && <Tag>{offer.fareName}</Tag>}
        </div>
        {offer.legs.map((l, i) => (
          <LegSummary key={i} leg={l} label={legLabel(i)} />
        ))}
        <div className="row wrap small muted" style={{ gap: 12 }}>
          <span className="row" style={{ gap: 4 }}>
            <Luggage size={14} /> {baggageText(offer)}
          </span>
          {offer.fareRules.slice(0, 2).map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
        {needsReturn && canContinue && <div className="tiny muted">O preço já é o total de ida e volta; depois de escolher a ida, você escolhe a volta.</div>}
        <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />} {open ? "Esconder detalhes" : "Detalhes, conexões e regras"}
        </button>
        {open && (
          <div className="details">
            {offer.legs.map((l, i) => (
              <LegDetails key={i} leg={l} label={legLabel(i)} />
            ))}
            <div className="small">
              <b>Bagagem:</b> {baggageText(offer)}
            </div>
            <div className="small">
              <b>Regras da tarifa:</b> {offer.fareRules.length ? offer.fareRules.join(" · ") : "a fonte não informou nesta etapa; aparecem nas opções de compra ou no site do vendedor."}
            </div>
            <div className="small">
              <b>Datas:</b> ida {dayLabel(offer.departDate, { day: "2-digit", month: "2-digit", year: "numeric" })}
              {offer.returnDate ? ` · volta ${dayLabel(offer.returnDate, { day: "2-digit", month: "2-digit", year: "numeric" })}` : " · só ida"}
            </div>
            <div className="tiny muted">{offer.availabilityNote}</div>
            {offer.emissionsKg ? <div className="tiny muted">Emissão estimada pela fonte: {offer.emissionsKg} kg de CO₂</div> : null}
            {offer.checkUrl && (
              <a className="small" href={offer.checkUrl} target="_blank" rel="noopener">
                Conferir esta busca na fonte <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </div>
      <div className="flight-side">
        <div>
          <div className="price">{money(offer.price.total, offer.price.currency)}</div>
          <div className="small muted">
            {money(offer.price.perPassenger, offer.price.currency)} por passageiro · {offer.price.basis}
          </div>
        </div>
        <PriceStamp offer={offer} />
        <div className="stack tight">
          <button className="btn primary block" onClick={action}>
            {needsReturn ? <Repeat2 size={16} /> : <ShoppingCart size={16} />} {actionLabel}
          </button>
          <div className="row">
            <button
              className={`btn sm grow ${compared ? "primary" : ""}`}
              onClick={() => {
                const r = toggleCompare(offer);
                toast(r === "added" ? "Adicionado ao comparador." : r === "removed" ? "Removido do comparador." : "O comparador já tem 4 opções. Remova uma antes.");
              }}
            >
              {compared ? <Check size={14} /> : <Scale size={14} />} Comparar
            </button>
            <button className="btn sm grow" onClick={() => setSaving(true)}>
              <Bookmark size={14} /> Salvar
            </button>
          </div>
        </div>
      </div>
      {saving && (
        <SaveToTrip
          title="Salvar voo na viagem"
          suggestedName={`Viagem para ${cityOf(offer.legs[0].to.code)}`}
          onClose={() => setSaving(false)}
          onPick={(t: Trip) => {
            // Ida e volta numa oferta só, ou só ida: vai para «ida». Um voo só de volta escolhido à parte: «volta».
            const isReturnOnly = chosenLabel === "Volta";
            return saveTrip({ ...t, [isReturnOnly ? "inbound" : "outbound"]: offer, startDate: t.startDate ?? offer.departDate, endDate: t.endDate ?? offer.returnDate, destination: t.destination ?? { name: cityOf(offer.legs[0].to.code) } });
          }}
        />
      )}
    </article>
  );
}
