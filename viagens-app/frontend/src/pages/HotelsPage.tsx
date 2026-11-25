// Hotéis: preços reais (Google Hotels via servidor), comparação e, sem servidor, hospedagens
// do OpenStreetMap + links de reserva com as mesmas datas.

import { useMemo, useState } from "react";
import { ExternalLink, Settings } from "lucide-react";
import type { HotelOffer, HotelSearchParams, HotelSort } from "../types";
import { ApiRequestError, hasServer } from "../api/client";
import { HotelSearchForm } from "../components/HotelSearchForm";
import { HotelCard, Stars } from "../components/HotelCard";
import { ProviderLinks, ProviderStatusLine } from "../components/ProviderLinks";
import { Empty, Loading, Modal, Notice, Seg, Skeleton } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { navigate } from "../hooks/useRoute";
import { defaultHotelParams, hotelParamsToQuery, hotelProviderLinks, queryToHotelParams, searchHotels } from "../services/hotels/search";
import { osmHotels } from "../services/hotels/osm";
import { geocode } from "../services/destinations/geocode";
import { radiusFor } from "../services/destinations/pois";
import { distanceLabel, googleMapsUrl, km } from "../services/maps/geo";
import { dayLabel, money } from "../utils/format";

type ClientSort = HotelSort | "distance";

function OsmFallback({ p }: { p: HotelSearchParams }) {
  const res = useAsync(async (signal) => {
    const [place] = await geocode(p.query, signal);
    if (!place) throw new Error("Não encontramos esse destino no mapa.");
    return osmHotels(place, radiusFor(place.bbox), signal);
  }, [p.query]);
  return (
    <div className="card stack">
      <h3>Hospedagens no mapa (OpenStreetMap)</h3>
      <div className="small muted">Lista real de hotéis, pousadas e hostels cadastrados no mapa. O mapa não tem preços: veja valores e reserve pelos links.</div>
      {res.loading && <Loading text="Procurando hospedagens no mapa…" />}
      {res.error && <Notice kind="warn">{res.error.message}</Notice>}
      {res.data && !res.data.length && <Empty>Nenhuma hospedagem cadastrada no mapa perto daí.</Empty>}
      {res.data?.slice(0, 25).map((h) => (
        <div key={h.id} className="poi">
          <div className="grow">
            <div className="bold">
              {h.name} <Stars n={h.stars} />
            </div>
            <div className="tiny muted">
              {h.kind} · {distanceLabel(h.distanceKm)} do centro{h.address ? ` · ${h.address}` : ""}
            </div>
          </div>
          <div className="row wrap" style={{ gap: 6, justifyContent: "flex-end" }}>
            <a className="btn sm" href={hotelProviderLinks(p, h.name)[0].url} target="_blank" rel="noopener">
              Ver preço <ExternalLink size={12} />
            </a>
            <a className="btn sm ghost" href={googleMapsUrl(h)} target="_blank" rel="noopener">
              Mapa
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompareHotels({ hotels, onClose }: { hotels: HotelOffer[]; onClose: () => void }) {
  const bestPrice = Math.min(...hotels.map((h) => h.total ?? Infinity));
  const bestRating = Math.max(...hotels.map((h) => h.rating ?? 0));
  const rows: [string, (h: HotelOffer) => string, (h: HotelOffer) => boolean][] = [
    ["Total da estadia", (h) => money(h.total, h.currency), (h) => h.total === bestPrice],
    ["Diária", (h) => money(h.nightly, h.currency), () => false],
    ["Estrelas", (h) => (h.stars ? "★".repeat(h.stars) : "—"), () => false],
    ["Avaliação", (h) => (h.rating ? `${h.rating.toFixed(1)}/5 (${h.reviews ?? 0})` : "—"), (h) => !!h.rating && h.rating === bestRating],
    ["Localização", (h) => (h.locationRating ? `${h.locationRating.toFixed(1)}/5` : "—"), () => false],
    ["Café da manhã", (h) => (h.breakfast === true ? "Incluso" : h.breakfast === false ? "Não incluso" : "Não informado"), (h) => h.breakfast === true],
    ["Serviços", (h) => h.amenities.slice(0, 6).join(", ") || "—", () => false],
  ];
  return (
    <Modal title="Comparar hotéis" onClose={onClose}>
      <div className="scroll-x">
        <table className="compare">
          <thead>
            <tr>
              <th />
              {hotels.map((h) => (
                <td key={h.id} className="bold">
                  {h.name}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, f, best]) => (
              <tr key={label}>
                <th>{label}</th>
                {hotels.map((h) => (
                  <td key={h.id} className={best(h) ? "best" : ""}>
                    {f(h)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export function HotelsPage({ query }: { query: URLSearchParams }) {
  const params = useMemo(() => queryToHotelParams(query), [query.toString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sort, setSort] = useState<ClientSort>("relevance");
  const [compare, setCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const server = hasServer();
  const res = useAsync((signal) => searchHotels(params!, signal), [params ? JSON.stringify(params) : ""], !!params && server);
  const center = useAsync(async (signal) => (await geocode(params!.query, signal))[0] ?? null, [params?.query], !!params && !!res.data?.hotels.length);
  const err = res.error as ApiRequestError | null;
  const noLive = params && (!server || (err && ["not_configured", "no_server", "offline"].includes(err.code)));

  const list = useMemo(() => {
    const hs = [...(res.data?.hotels ?? [])];
    const c = center.data;
    if (sort === "price") hs.sort((a, b) => (a.total ?? Infinity) - (b.total ?? Infinity));
    if (sort === "rating") hs.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviews ?? 0) - (a.reviews ?? 0));
    if (sort === "reviews") hs.sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
    if (sort === "distance" && c) hs.sort((a, b) => (a.lat !== undefined ? km(c, { lat: a.lat, lon: a.lon! }) : 999) - (b.lat !== undefined ? km(c, { lat: b.lat, lon: b.lon! }) : 999));
    return hs;
  }, [res.data, sort, center.data]);

  return (
    <div className="stack">
      <div className="card">
        <HotelSearchForm key={query.toString()} initial={params ?? defaultHotelParams()} onSearch={(p) => navigate("hoteis", hotelParamsToQuery(p))} />
      </div>
      {!params && <Empty>Digite o destino e as datas para ver hotéis e preços.</Empty>}
      {params && (
        <div className="row wrap between">
          <div>
            <h2>Hospedagem em {params.query}</h2>
            <div className="small muted">
              {dayLabel(params.checkIn)} – {dayLabel(params.checkOut)} · {params.adults + params.children} hóspede(s) · {params.rooms} quarto(s)
            </div>
          </div>
          {res.data && res.data.hotels.length > 0 && (
            <Seg value={sort} onChange={setSort} label="Ordenar" options={[{ id: "relevance", label: "Relevância" }, { id: "price", label: "Menor preço" }, { id: "rating", label: "Melhor avaliação" }, { id: "distance", label: "Mais perto do centro" }]} />
          )}
        </div>
      )}
      {noLive && params && (
        <div className="stack">
          <Notice kind="warn">
            <b>Preços de hotéis em tempo real indisponíveis.</b> {err?.message ?? "O servidor do app ainda não foi configurado."} Nada é inventado: veja os preços nos sites de reserva (já com as suas datas e hóspedes).
          </Notice>
          <div className="card">
            <ProviderLinks title="Ver preços e reservar em:" links={hotelProviderLinks(params)} />
          </div>
          <a className="btn" href="#/ajustes" style={{ alignSelf: "flex-start" }}>
            <Settings size={16} /> Configurar o servidor de pesquisa
          </a>
          <OsmFallback p={params} />
        </div>
      )}
      {params && server && res.loading && (
        <>
          <Loading text="Buscando hotéis e preços…" />
          <Skeleton height={170} count={3} />
        </>
      )}
      {params && err && !noLive && <Notice kind="bad">{err.message}</Notice>}
      {params && res.data && (
        <div className="stack">
          <ProviderStatusLine providers={res.data.providers} />
          {res.data.notes.map((n) => (
            <Notice key={n} kind="warn">
              {n}
            </Notice>
          ))}
          {res.data.providers.some((p) => !p.ok && !p.notConfigured) && (
            <div className="card">
              <ProviderLinks title="A busca falhou agora. Veja nos sites:" links={hotelProviderLinks(params)} />
            </div>
          )}
          {compare.length >= 2 && (
            <div className="row" style={{ position: "sticky", top: 64, zIndex: 10 }}>
              <button className="btn primary" onClick={() => setShowCompare(true)}>
                Comparar {compare.length} hotéis
              </button>
              <button className="btn" onClick={() => setCompare([])}>
                Limpar seleção
              </button>
            </div>
          )}
          {list.map((h) => (
            <HotelCard key={h.id} h={h} params={params} center={center.data} compared={compare.includes(h.id)} onCompare={() => setCompare((c) => (c.includes(h.id) ? c.filter((x) => x !== h.id) : c.length >= 3 ? c : [...c, h.id]))} />
          ))}
          {res.data.hotels.length === 0 && res.data.providers.some((p) => p.ok) && <Empty>Nenhum hotel encontrado. Tente outro nome de destino ou outras datas.</Empty>}
          {res.data.sourceUrl && (
            <a className="small" href={res.data.sourceUrl} target="_blank" rel="noopener">
              Ver esta busca no Google Hotels <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
      {showCompare && <CompareHotels hotels={list.filter((h) => compare.includes(h.id))} onClose={() => setShowCompare(false)} />}
    </div>
  );
}
