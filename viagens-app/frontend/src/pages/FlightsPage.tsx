// Pesquisa de passagens: resultados reais dos fornecedores, filtros, ordenação, volta e compra.

import { useEffect, useMemo, useState } from "react";
import { Settings } from "lucide-react";
import type { BookingOptionsResponse, FlightOffer, FlightSearchParams, FlightSearchResponse } from "../types";
import { ApiRequestError, hasServer } from "../api/client";
import { FlightSearchForm } from "../components/FlightSearchForm";
import { FlightCard } from "../components/FlightCard";
import { FlightFiltersPanel } from "../components/FlightFiltersPanel";
import { BookingOptions } from "../components/BookingOptions";
import { ProviderLinks, ProviderStatusLine } from "../components/ProviderLinks";
import { Empty, Modal, Notice, Seg, Skeleton, Loading } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { navigate } from "../hooks/useRoute";
import { labelFor } from "../services/flights/airports";
import { providerLinks } from "../services/flights/links";
import { paramsToQuery, partialParams, passengersLabel, queryToParams, CABIN_LABEL } from "../services/flights/params";
import { bookingOptions, returnFlights, searchFlights } from "../services/flights/search";
import { applyFilters, NO_FILTERS, sortOffers, SORT_LABEL, type FlightFilters, type FlightSort } from "../services/flights/sort";
import { rememberSearch } from "../database/recent";
import { ago, dayLabel, money } from "../utils/format";

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
  const [sort, setSort] = useState<FlightSort>("price");
  const [filters, setFilters] = useState<FlightFilters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
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
      <div className="card">
        <FlightSearchForm key={query.toString()} compact initial={params ?? partialParams(query)} onSearch={(p) => navigate("voos", paramsToQuery(p))} />
      </div>

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
          </div>
          {res.data && <Seg value={sort} onChange={setSort} label="Ordenar" options={(Object.keys(SORT_LABEL) as FlightSort[]).map((id) => ({ id, label: SORT_LABEL[id] }))} />}
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
          <ProviderStatusLine providers={res.data.providers} />
          {res.data.insights?.lowest !== undefined && (
            <Notice kind="info">
              Google Flights: menor preço desta busca {money(res.data.insights.lowest, res.data.insights.currency)}
              {res.data.insights.level ? ` — nível de preço «${res.data.insights.level}»` : ""}
              {res.data.insights.typicalRange ? ` (o normal para esta rota fica entre ${money(res.data.insights.typicalRange[0], res.data.insights.currency)} e ${money(res.data.insights.typicalRange[1], res.data.insights.currency)})` : ""}.
            </Notice>
          )}
          {res.data.notes.map((n) => (
            <Notice key={n} kind="warn">
              {n}
            </Notice>
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
            <div className="layout-side">
              <div className="stack">
                <button className="btn only-mobile" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
                  {showFilters ? "Esconder filtros" : "Mostrar filtros"}
                </button>
                <div className={showFilters ? "" : "closed-mobile"}>
                  <FlightFiltersPanel offers={res.data.offers} value={filters} onChange={setFilters} />
                </div>
              </div>
              <div className="stack">
                <div className="small muted">
                  {visible.length} de {res.data.offers.length} voos · pesquisa feita {ago(res.data.fetchedAt)} · ordenado por {SORT_LABEL[sort].toLowerCase()}
                  {sort === "value" && " (preço e duração juntos: um voo pouco mais caro e bem mais rápido pode ganhar)"}
                </div>
                {visible.map((o) => (
                  <FlightCard key={o.id} offer={o} onChooseReturn={chooseReturn} onBuy={buy} />
                ))}
                {!visible.length && <Empty>Nenhum voo com esses filtros. Clique em «Limpar» nos filtros.</Empty>}
                <div className="card">
                  <ProviderLinks title="Comparar com outros sites:" links={providerLinks(params)} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {outbound && (
        <Modal title="Escolha o voo de volta" onClose={() => setOutbound(null)}>
          <div className="stack">
            <FlightCard offer={outbound} chosenLabel="Ida escolhida" />
            {returns.loading && <Loading text="Buscando voos de volta para esta ida…" />}
            {returns.error && <Notice kind="bad">{returns.error}</Notice>}
            {returns.data && !returns.data.offers.length && <Empty>Sem voos de volta disponíveis para esta ida. Escolha outra ida.</Empty>}
            {returns.data && <div className="small muted">Preço = total de ida e volta para todos os passageiros.</div>}
            {returns.data?.offers.map((o) => (
              <FlightCard key={o.id} offer={o} onBuy={buy} />
            ))}
          </div>
        </Modal>
      )}
      {booking && <BookingOptions {...booking} onClose={() => setBooking(null)} />}
    </div>
  );
}
