// Um resultado de voo, explicado de forma simples: de onde sai, por onde passa, onde chega,
// quanto tempo leva e quanto custa. Os detalhes técnicos ficam em «Mais informações».

import { useState } from "react";
import { Bookmark, Check, ChevronDown, ChevronUp, Clock, ExternalLink, Luggage, Plane, Repeat2, Scale, ShoppingCart } from "lucide-react";
import type { AirportRef, FlightLeg, FlightOffer, FlightSegment, Trip } from "../types";
import { clock, dayLabel, dayShift, duration, money, plural } from "../utils/format";
import { airportByCode, cityOf } from "../services/flights/airports";
import { isCompared, toggleCompare } from "../database/compare";
import { saveTrip } from "../database/trips";
import { useStore } from "../hooks/useStore";
import { navigate } from "../hooks/useRoute";
import { PriceStamp } from "./PriceStamp";
import { SaveToTrip } from "./SaveToTrip";
import { toast } from "./ui";

/** Nome da cidade (o que a pessoa entende) com o código do aeroporto entre parênteses. */
function place(a: AirportRef): string {
  const city = airportByCode(a.code) ? cityOf(a.code) : a.name || a.code;
  return `${city} (${a.code})`;
}
const cityName = (a: AirportRef) => (airportByCode(a.code) ? cityOf(a.code) : a.name || a.code);

const minutesBetween = (a: string, b: string) => Math.round((Date.parse(b.replace(" ", "T")) - Date.parse(a.replace(" ", "T"))) / 60_000);

/** Linha do tempo vertical: saída → (voo) → parada → (voo) → chegada. */
function Route({ leg }: { leg: FlightLeg }) {
  const segs = leg.segments;
  if (!segs.length) return null;
  const rows: JSX.Element[] = [];
  const point = (key: string, time: string, where: string, note: string, kind: "end" | "stop") =>
    rows.push(
      <li key={key} className={`rt-point ${kind}`}>
        <span className="rt-time">{time}</span>
        <span className="rt-dot" aria-hidden />
        <span className="rt-text">
          <b>{where}</b>
          <span className={kind === "stop" ? "rt-note warn" : "rt-note"}>{note}</span>
        </span>
      </li>,
    );
  const flight = (key: string, s: FlightSegment) =>
    rows.push(
      <li key={key} className="rt-flight">
        <span />
        <span className="rt-line" aria-hidden />
        <span className="rt-note">
          <Plane size={13} /> {duration(s.durationMin)} de voo · {s.carrier}
          {s.overnight ? " · voo noturno" : ""}
        </span>
      </li>,
    );

  point("start", clock(segs[0].departure), place(segs[0].from), "Saída", "end");
  segs.forEach((s, i) => {
    flight(`f${i}`, s);
    const next = segs[i + 1];
    if (next) {
      const wait = leg.layovers[i]?.durationMin ?? minutesBetween(s.arrival, next.departure);
      const otherAirport = next.from.code !== s.to.code ? ` O próximo voo sai de outro aeroporto: ${place(next.from)}.` : "";
      const night = leg.layovers[i]?.overnight ? " (passa a noite)" : "";
      point(`p${i}`, clock(s.arrival), place(s.to), `Parada: troca de avião e espera ${duration(wait)}${night}. Sai de novo às ${clock(next.departure)}.${otherAirport}`, "stop");
    } else {
      const plus = dayShift(segs[0].departure, s.arrival);
      point("end", clock(s.arrival), place(s.to), plus > 0 ? `Chegada no dia seguinte${plus > 1 ? ` (+${plus} dias)` : ""} · ${dayLabel(s.arrival)}` : "Chegada", "end");
    }
  });
  return <ol className="route">{rows}</ol>;
}

function LegBlock({ leg, label }: { leg: FlightLeg; label: string }) {
  const stopsText = leg.stops === 0 ? "Voo direto" : `${plural(leg.stops, "parada", "paradas")} (${leg.layovers.length ? leg.layovers.map((l) => cityName(l.airport)).join(", ") : leg.segments.slice(0, -1).map((s) => cityName(s.to)).join(", ")})`;
  return (
    <section className="stack tight">
      <div className="tiny muted upper">
        {label} · {dayLabel(leg.departure)}
      </div>
      <div className="leg-title">
        {cityName(leg.from)} → {cityName(leg.to)}
      </div>
      <div className="row wrap" style={{ gap: 6 }}>
        <span className="pill">
          <Clock size={13} /> {duration(leg.durationMin)} no total
        </span>
        <span className={`pill ${leg.stops ? "warn" : "good"}`}>{stopsText}</span>
      </div>
      <Route leg={leg} />
    </section>
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

export function FlightCard({ offer, onChooseReturn, onBuy, chosenLabel, onlyReturn }: { offer: FlightOffer; onChooseReturn?: (o: FlightOffer) => void; onBuy?: (o: FlightOffer) => void; chosenLabel?: string; /** Na escolha da volta, a ida já foi vista: mostra só a volta. */ onlyReturn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const compared = useStore(() => isCompared(offer.id));
  const legLabel = (i: number) => (offer.legs.length > 1 ? (i === 0 ? "Ida" : "Volta") : (chosenLabel ?? "Ida"));
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
  const actionLabel = !canContinue ? "Ver preço de hoje" : offer.booking.kind === "link" ? offer.booking.label : needsReturn ? "Escolher esta ida" : "Comprar este voo";

  return (
    <article className="card flight">
      <div className="flight-main">
        <div className="row" style={{ gap: 8 }}>
          <div className="bold ellipsis grow">{offer.airlines.join(" + ")}</div>
          {offer.fareName && <span className="tiny muted">Tarifa {offer.fareName}</span>}
        </div>
        {offer.legs.map((l, i) => (onlyReturn && i === 0 && offer.legs.length > 1 ? null : <LegBlock key={i} leg={l} label={legLabel(i)} />))}
        <div className="row small muted" style={{ gap: 6 }}>
          <Luggage size={15} /> {baggageText(offer)}
        </div>
        <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />} {open ? "Menos informações" : "Mais informações"}
        </button>
        {open && (
          <div className="details">
            {offer.legs.map((l, i) => (
              <div key={i} className="small">
                <b>{legLabel(i)} — voos:</b>{" "}
                {l.segments.map((s) => `${s.carrier} ${s.flightNumber} (${s.from.code} → ${s.to.code}${s.aircraft ? `, ${s.aircraft}` : ""})`).join(" · ")}
              </div>
            ))}
            <div className="small">
              <b>Regras da tarifa:</b> {offer.fareRules.length ? offer.fareRules.join(" · ") : "a fonte não informou nesta etapa; aparecem na hora de comprar."}
            </div>
            <div className="small">
              <b>Preço:</b> {offer.price.basis}
              {offer.passengers > 1 ? ` · ${money(offer.price.perPassenger, offer.price.currency)} por pessoa` : ""}
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
          <div className="small muted">{offer.price.basis}</div>
        </div>
        <PriceStamp offer={offer} />
        {needsReturn && canContinue && <div className="tiny muted">Este preço já inclui a volta. Depois de escolher a ida, você escolhe o horário da volta.</div>}
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
