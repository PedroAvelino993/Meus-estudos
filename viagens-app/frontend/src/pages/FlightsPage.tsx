// Pesquisa de passagens: resultados reais dos fornecedores, filtros, ordenação, volta e compra.

import { useEffect, useMemo, useState } from "react";
import { Pencil, Settings } from "lucide-react";
import type { BookingOptionsResponse, FlightOffer, FlightSearchParams, FlightSearchResponse } from "../types";
import { ApiRequestError, hasServer } from "../api/client";
import { FlightSearchForm } from "../components/FlightSearchForm";
import { FlightCard } from "../components/FlightCard";
import { FlightFiltersPanel } from "../components/FlightFiltersPanel";
import { FlightPager } from "../components/FlightPager";
import { BookingOptions } from "../components/BookingOptions";
import { ProviderLinks, ProviderStatusLine } from "../components/ProviderLinks";
import { Empty, Modal, Notice, Seg, Skeleton, Loading } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { navigate } from "../hooks/useRoute";
import { labelFor } from "../services/flights/airports";
import { providerLinks } from "../services/flights/links";
import { paramsToQuery, partialParams, passengersLabel, queryToParams, CABIN_LABEL } from "../services/flights/params";
import { bookingOptions, returnFlights, searchFlights } from "../services/flights/search";
import { applyFilters, NO_FILTERS, sortOffers, type FlightFilters, type FlightSort } from "../services/flights/sort";
import { rememberSearch } from "../database/recent";
import { dayLabel, money } from "../utils/format";

const PRICE_LEVEL: Record<string, string> = { low: "baixo", typical: "normal", high: "alto" };

/** O que mostrar primeiro (em palavras simples). */
const FIRST: { id: FlightSort; label: string; title: string }[] = [
  { id: "value", label: "Melhor opção", title: "Melhor opção (preço e tempo de viagem juntos)" },
  { id: "price", label: "Mais barato", title: "A opção mais barata" },
  { id: "duration", label: "Mais rápido", title: "A opção mais rápida" },
];

function NoLiveSearch({ p, reason }: { p: FlightSearchParams; reason: string }) {
  return (
    <div className="stack">
      <Notice kind="warn">
        <b>Preços em tempo real indisponíveis.</b> {reason} Nada é inventado: abra a mesma busca direto em um fornecedor confiável.
      </Notice>
      <div className="card">
        <ProviderLinks title={`Pesquisar ${labelFor(p.origin)} → ${labelFor(p.destination)} em:`} links={providerLinks(p)} />
      </div>
      <a className="btn" href="#/ajustes" style={{ alignSelf: "flex-start" }}>
        <Settings size={16} /> Configurar o servidor de pesquisa
      </a>
    </div>
  );
}

export function FlightsPage({ query }: { query: URLSearchParams }) {
  const params = useMemo(() => queryToParams(query), [query.toString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sort, setSort] = useState<FlightSort>("value");
  const [filters, setFilters] = useState<FlightFilters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState(false);
  const [outbound, setOutbound] = useState<FlightOffer | null>(null);
  const [returns, setReturns] = useState<{ loading: boolean; data: FlightSearchResponse | null; error: string | null }>({ loading: false, data: null, error: null });
  const [booking, setBooking] = useState<{ loading: boolean; data: BookingOptionsResponse | null; error: string | null } | null>(null);

  const server = hasServer();
  const res = useAsync((signal) => searchFlights(params!, signal), [params ? JSON.stringify(params) : ""], !!params && server);

  useEffect(() => {
    setFilters(NO_FILTERS);
    setOutbound(null);
  }, [params ? JSON.stringify(params) : ""]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!params || !res.data) return;
    const cheapest = res.data.offers[0];
    rememberSearch({ params, labels: { origin: labelFor(params.origin), destination: labelFor(params.destination) }, lowest: cheapest ? { price: cheapest.price.total, currency: cheapest.price.currency, fetchedAt: cheapest.fetchedAt, provider: cheapest.providerLabel } : undefined, at: new Date().toISOString() });
  }, [res.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => (res.data ? sortOffers(applyFilters(res.data.offers, filters), sort) : []), [res.data, filters, sort]);

  const chooseReturn = async (o: FlightOffer) => {
    if (o.booking.kind !== "serpapi_return" || !params) return;
    setOutbound(o);
    setReturns({ loading: true, data: null, error: null });
    try {
      setReturns({ loading: false, data: await returnFlights(params, o.booking.token, o.legs[0]), error: null });
    } catch (e) {
      setReturns({ loading: false, data: null, error: (e as Error).message });
    }
  };
  const buy = async (o: FlightOffer) => {
    if (o.booking.kind !== "serpapi_booking" || !params) return;
    setBooking({ loading: true, data: null, error: null });
    try {
      setBooking({ loading: false, data: await bookingOptions(params, o.booking.token), error: null });
    } catch (e) {
      setBooking({ loading: false, data: null, error: (e as Error).message });
    }
  };

  const err = res.error as ApiRequestError | null;
  return (
    <div className="stack">
      {(!params || editing) && (
        <div className="card">
          <FlightSearchForm key={query.toString()} compact initial={params ?? partialParams(query)} onSearch={(p) => { setEditing(false); navigate("voos", paramsToQuery(p)); }} />
        </div>
      )}

      {!params && <Empty>Escolha origem, destino e datas para pesquisar.</Empty>}

      {params && (
        <div className="row wrap between">
          <div>
            <h2>
              {labelFor(params.origin)} → {labelFor(params.destination)}
            </h2>
            <div className="small muted">
              {dayLabel(params.departDate)}
              {params.returnDate ? ` – ${dayLabel(params.returnDate)}` : " · só ida"} · {passengersLabel(params)} · {CABIN_LABEL[params.cabin]}
              {params.directOnly ? " · só diretos" : ""}
            </div>
            {!editing && (
              <button className="btn sm" style={{ marginTop: 8 }} onClick={() => setEditing(true)}>
                <Pencil size={14} /> Alterar busca
              </button>
            )}
          </div>
          {res.data && res.data.offers.length > 1 && <Seg value={sort} onChange={setSort} label="Mostrar primeiro" options={FIRST.map(({ id, label }) => ({ id, label }))} />}
        </div>
      )}

      {params && !server && <NoLiveSearch p={params} reason="O servidor do app (que guarda as chaves das APIs com segurança) ainda não foi configurado." />}
      {params && server && res.loading && (
        <>
          <Loading text="Consultando as companhias e agências… pode levar até 30 segundos." />
          <Skeleton height={130} count={4} />
        </>
      )}
      {params && err && (err.code === "not_configured" || err.code === "no_server" || err.code === "offline" ? <NoLiveSearch p={params} reason={err.message} /> : (
        <div className="stack">
          <Notice kind="bad">{err.message}</Notice>
          <button className="btn" style={{ alignSelf: "flex-start" }} onClick={res.reload}>Tentar de novo</button>
          <div className="card">
            <ProviderLinks title="Enquanto isso, pesquise em:" links={providerLinks(params)} />
          </div>
        </div>
      ))}

      {params && res.data && (
        <div className="stack">
          <ProviderStatusLine providers={res.data.providers.filter((p) => !p.ok && !p.notConfigured)} />
          {res.data.insights?.level && (
            <div className="small muted">
              Google Flights diz que o preço para esta rota está <b>{PRICE_LEVEL[res.data.insights.level] ?? res.data.insights.level}</b>
              {res.data.insights.typicalRange ? ` (o normal é entre ${money(res.data.insights.typicalRange[0], res.data.insights.currency)} e ${money(res.data.insights.typicalRange[1], res.data.insights.currency)})` : ""}.
            </div>
          )}
          {res.data.notes.map((n) => (
            <div key={n} className="tiny muted">
              {n}
            </div>
          ))}
          {!res.data.offers.length && (
            <div className="stack">
              <Empty>Nenhum voo encontrado para essas datas. Tente outras datas, aeroportos próximos ou permita escalas.</Empty>
              <div className="card">
                <ProviderLinks title="Conferir nos sites:" links={providerLinks(params)} />
              </div>
            </div>
          )}
          {res.data.offers.length > 0 && (
            <div className="stack">
              <FlightPager offers={visible} title={(i) => (i === 0 ? FIRST.find((f) => f.id === sort)?.title : "Outra opção")} render={(o) => <FlightCard offer={o} onChooseReturn={chooseReturn} onBuy={buy} />} />
              {!visible.length && <Empty>Nenhum voo com esses filtros. Toque em «Limpar» nos filtros.</Empty>}
              <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
                {showFilters ? "Esconder filtros" : "Filtrar (escalas, horário, companhia, bagagem…)"}
              </button>
              {showFilters && <FlightFiltersPanel offers={res.data.offers} value={filters} onChange={setFilters} />}
              <div className="card">
                <ProviderLinks title="Comparar com outros sites:" links={providerLinks(params)} />
              </div>
            </div>
          )}
        </div>
      )}

      {outbound && (
        <Modal title="Escolha o voo de volta" onClose={() => setOutbound(null)}>
          <div className="stack">
            <div className="small">
              <b>Ida escolhida:</b> {outbound.legs[0].segments[0] ? `${dayLabel(outbound.legs[0].departure)}, sai às ${outbound.legs[0].departure.slice(11, 16)} e chega às ${outbound.legs[0].arrival.slice(11, 16)} (${outbound.airlines.join(" + ")})` : ""}.{" "}
              <button className="btn ghost sm" onClick={() => setOutbound(null)}>Trocar a ida</button>
            </div>
            {returns.loading && <Loading text="Buscando voos de volta para esta ida…" />}
            {returns.error && <Notice kind="bad">{returns.error}</Notice>}
            {returns.data && !returns.data.offers.length && <Empty>Sem voos de volta disponíveis para esta ida. Escolha outra ida.</Empty>}
            {returns.data && returns.data.offers.length > 0 && (
              <FlightPager offers={returns.data.offers} title={(i) => (i === 0 ? "Voo de volta (o preço é o total de ida e volta)" : "Outra opção de volta")} render={(o) => <FlightCard offer={o} onBuy={buy} onlyReturn />} />
            )}
          </div>
        </Modal>
      )}
      {booking && <BookingOptions {...booking} onClose={() => setBooking(null)} />}
    </div>
  );
}
