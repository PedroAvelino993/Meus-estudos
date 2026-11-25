// Início: pesquisa de passagens em destaque, ofertas reais, hotéis, destinos populares e viagens salvas.

import { ArrowRight, Clock } from "lucide-react";
import type { DealsResponse } from "../types";
import { api, hasServer } from "../api/client";
import { FlightSearchForm } from "../components/FlightSearchForm";
import { HotelSearchForm } from "../components/HotelSearchForm";
import { Empty } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { useStore } from "../hooks/useStore";
import { navigate } from "../hooks/useRoute";
import { recentSearches } from "../database/recent";
import { budgetSummary, listTrips } from "../database/trips";
import { defaultFlightParams, paramsToQuery, passengersLabel } from "../services/flights/params";
import { cityOf } from "../services/flights/airports";
import { defaultHotelParams, hotelParamsToQuery } from "../services/hotels/search";
import { wikiSummary } from "../services/destinations/wiki";
import { POPULAR } from "./DestinationsPage";
import { ago, dayLabel, duration, money } from "../utils/format";

function Deals() {
  const deals = useAsync(() => api<DealsResponse>("/api/deals"), [], hasServer());
  const recent = useStore(recentSearches);
  const withPrice = recent.filter((r) => r.lowest);
  return (
    <section className="section">
      <div className="section-head">
        <h2>Ofertas e oportunidades</h2>
        <span className="small muted">Só preços reais, com a hora em que foram encontrados</span>
      </div>
      {deals.data?.configured && deals.data.deals.length > 0 && (
        <div className="grid g4" style={{ marginBottom: 12 }}>
          {deals.data.deals.map((d) => (
            <button key={d.destination} className="card stack tight" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => navigate("voos", paramsToQuery({ ...defaultFlightParams(), origin: [d.origin], destination: [d.destination], departDate: d.departDate, returnDate: undefined }))}>
              <div className="small muted">
                {cityOf(d.origin)} → <b style={{ color: "var(--text)" }}>{cityOf(d.destination)}</b>
              </div>
              <div className="price sm">{money(d.price, d.currency)}</div>
              <div className="tiny muted">
                só ida · {dayLabel(d.departDate)} · {d.stops === 0 ? "direto" : `${d.stops} escala(s)`}
                {d.durationMin ? ` · ${duration(d.durationMin)}` : ""}
              </div>
              <div className="tiny faint">
                <Clock size={11} /> encontrado {ago(d.fetchedAt)} · {d.provider}
              </div>
            </button>
          ))}
        </div>
      )}
      {deals.data?.notes.map((n) => (
        <div key={n} className="tiny muted" style={{ marginBottom: 8 }}>
          {n}
        </div>
      ))}
      {withPrice.length > 0 ? (
        <div className="stack tight">
          <div className="small bold">Suas pesquisas recentes</div>
          <div className="grid g4">
            {withPrice.slice(0, 4).map((r) => (
              <button key={r.at} className="card stack tight" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => navigate("voos", paramsToQuery(r.params))}>
                <div className="small">
                  {r.labels.origin} → <b>{r.labels.destination}</b>
                </div>
                <div className="tiny muted">
                  {dayLabel(r.params.departDate)}
                  {r.params.returnDate ? ` – ${dayLabel(r.params.returnDate)}` : ""} · {passengersLabel(r.params)}
                </div>
                <div className="bold">a partir de {money(r.lowest!.price, r.lowest!.currency)}</div>
                <div className="tiny faint">encontrado {ago(r.lowest!.fetchedAt)} · pode ter mudado</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        !deals.data?.deals.length && <div className="card small muted">Faça uma pesquisa de passagens: os menores preços encontrados aparecem aqui, com a data e a hora da consulta.{!hasServer() && " As ofertas automáticas precisam do servidor configurado (Ajustes)."}</div>
      )}
    </section>
  );
}

function PopularTile({ name }: { name: string }) {
  const w = useAsync((s) => wikiSummary(name, ["pt"], s), [name]);
  return (
    <button className="dest-tile" style={{ backgroundImage: w.data?.image ? `url("${w.data.image}")` : undefined }} onClick={() => navigate("destinos", { q: name })}>
      <span>
        {name}
        <small>Ver o que fazer</small>
      </span>
    </button>
  );
}

export function HomePage() {
  const trips = useStore(listTrips);
  return (
    <div>
      <div className="hero">
        <h1>Para onde vamos?</h1>
        <p style={{ opacity: 0.9 }}>Passagens e hotéis com preços de fontes reais, o que fazer no destino e a viagem toda organizada em um lugar.</p>
        <div className="card">
          <FlightSearchForm initial={defaultFlightParams()} onSearch={(p) => navigate("voos", paramsToQuery(p))} />
        </div>
      </div>

      <Deals />

      <section className="section">
        <div className="section-head">
          <h2>Hotéis</h2>
          <a href="#/hoteis" className="small">
            Abrir busca completa <ArrowRight size={13} />
          </a>
        </div>
        <div className="card">
          <HotelSearchForm initial={defaultHotelParams()} onSearch={(p) => navigate("hoteis", hotelParamsToQuery(p))} />
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Destinos populares</h2>
          <a href="#/destinos" className="small">
            Explorar outro destino <ArrowRight size={13} />
          </a>
        </div>
        <div className="grid g4">
          {POPULAR.slice(0, 8).map((p) => (
            <PopularTile key={p} name={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Minhas viagens</h2>
          <a href="#/viagens" className="small">
            Ver todas <ArrowRight size={13} />
          </a>
        </div>
        {!trips.length && <Empty>Nenhuma viagem salva ainda. Salve passagens, hotéis e passeios para montar a sua.</Empty>}
        <div className="grid g3">
          {trips.slice(0, 3).map((t) => (
            <a key={t.id} className="card stack tight" href={`#/viagens/${encodeURIComponent(t.id)}`} style={{ color: "inherit", textDecoration: "none" }}>
              <b>{t.name}</b>
              <div className="small muted">
                {t.destination?.name ?? "Destino a definir"}
                {t.startDate ? ` · ${dayLabel(t.startDate)}` : ""}
              </div>
              <div className="small">Total estimado: {money(budgetSummary(t).total, t.currency)}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
