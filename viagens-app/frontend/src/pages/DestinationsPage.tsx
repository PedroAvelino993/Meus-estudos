// Assistente de viagem: tudo sobre o destino a partir de fontes abertas e reais
// (OpenStreetMap, Wikipédia, Wikivoyage, Open-Meteo) + roteiro dia a dia.

import { useMemo, useState, type FormEvent } from "react";
import { BedDouble, CalendarDays, ExternalLink, Plane, Search } from "lucide-react";
import type { Trip } from "../types";
import { useAsync } from "../hooks/useAsync";
import { navigate } from "../hooks/useRoute";
import { geocode, type Place } from "../services/destinations/geocode";
import { CATEGORY_LABEL, fetchPois, radiusFor, type Poi, type PoiCategory } from "../services/destinations/pois";
import { buildItinerary, type ItineraryDay } from "../services/destinations/itinerary";
import { travelGuide, wikiSummary } from "../services/destinations/wiki";
import { forecast, weatherLabel } from "../services/destinations/weather";
import { nearestAirports } from "../services/flights/airports";
import { defaultFlightParams, paramsToQuery } from "../services/flights/params";
import { defaultHotelParams, hotelParamsToQuery } from "../services/hotels/search";
import { osmEmbedUrl } from "../services/maps/geo";
import { addPlace, saveTrip } from "../database/trips";
import { PoiList } from "../components/PoiList";
import { ItineraryView } from "../components/ItineraryView";
import { SaveToTrip } from "../components/SaveToTrip";
import { Empty, Loading, Notice, Seg, Skeleton, toast } from "../components/ui";
import { dayLabel } from "../utils/format";

export const POPULAR = ["Rio de Janeiro", "Salvador", "Gramado", "Fortaleza", "Florianópolis", "Foz do Iguaçu", "Lisboa", "Paris", "Buenos Aires", "Santiago", "Orlando", "Roma"];

function Overview({ place }: { place: Place }) {
  const wiki = useAsync((s) => wikiSummary(place.name, ["pt", "en"], s), [place.name]);
  const weather = useAsync((s) => forecast(place.lat, place.lon, s), [place.lat, place.lon]);
  return (
    <div className="grid g2">
      <div className="card stack">
        {wiki.loading && <Skeleton height={140} count={1} />}
        {wiki.data?.image && <img src={wiki.data.image} alt={place.name} style={{ borderRadius: 10, maxHeight: 220, objectFit: "cover", width: "100%" }} />}
        <h2>{place.name}</h2>
        <div className="small muted">{place.displayName}</div>
        {wiki.data && (
          <p className="small">
            {wiki.data.extract}{" "}
            <a href={wiki.data.url} target="_blank" rel="noopener">
              Wikipédia{wiki.data.lang !== "pt" ? " (em inglês)" : ""}
            </a>
          </p>
        )}
      </div>
      <div className="stack">
        <iframe className="map-frame" title={`Mapa de ${place.name}`} loading="lazy" src={osmEmbedUrl(place, undefined, radiusFor(place.bbox) * 1.6)} />
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Previsão do tempo (7 dias)</h3>
          {weather.loading && <Loading text="Consultando a previsão…" />}
          {weather.error && <div className="small muted">{weather.error.message}</div>}
          {weather.data && (
            <div className="grid g4" style={{ gap: 6 }}>
              {weather.data.slice(0, 7).map((d) => (
                <div key={d.date} className="small" style={{ background: "var(--bg)", borderRadius: 8, padding: 7 }}>
                  <div className="bold">{dayLabel(d.date, { weekday: "short", day: "numeric" })}</div>
                  <div>
                    {Math.round(d.max)}° / {Math.round(d.min)}°
                  </div>
                  <div className="tiny muted">
                    {weatherLabel(d.code)}
                    {d.rainChance !== null ? ` · chuva ${d.rainChance}%` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="tiny faint" style={{ marginTop: 6 }}>
            Fonte: Open-Meteo
          </div>
        </div>
      </div>
    </div>
  );
}

function Guide({ place }: { place: Place }) {
  const guide = useAsync((s) => travelGuide(place.name, s), [place.name]);
  if (guide.loading) return <Loading text="Buscando dicas no Wikivoyage…" />;
  if (!guide.data) return null;
  return (
    <div className="card stack">
      <h3>Dicas para quem vai (Wikivoyage{guide.data.lang !== "pt" ? ", em inglês" : ""})</h3>
      <p className="small" style={{ whiteSpace: "pre-line" }}>
        {guide.data.intro}
      </p>
      {guide.data.sections.map((s) => (
        <details key={s.title}>
          <summary className="bold small" style={{ cursor: "pointer" }}>
            {s.title}
          </summary>
          <p className="small muted" style={{ whiteSpace: "pre-line", marginTop: 6 }}>
            {s.text}
          </p>
        </details>
      ))}
      <a className="small" href={guide.data.url} target="_blank" rel="noopener">
        Guia completo no Wikivoyage <ExternalLink size={12} />
      </a>
    </div>
  );
}

function Places({ place }: { place: Place }) {
  const [cat, setCat] = useState<PoiCategory>("atracoes");
  const [days, setDays] = useState(3);
  const [plan, setPlan] = useState<ItineraryDay[] | null>(null);
  const [saving, setSaving] = useState<{ kind: "poi"; poi: Poi } | { kind: "plan" } | null>(null);
  const radius = radiusFor(place.bbox);
  const pois = useAsync((s) => fetchPois(place, radius, undefined, s), [place.lat, place.lon]);
  const counts = pois.data ? (Object.keys(CATEGORY_LABEL) as PoiCategory[]).filter((c) => pois.data![c].length) : [];

  const makePlan = () => {
    if (!pois.data) return;
    // Programa do dia: pontos turísticos, museus, parques e praias (os mais conhecidos primeiro)
    const sights = [...pois.data.atracoes, ...pois.data.museus, ...pois.data.parques.filter((p) => p.notable), ...pois.data.praias.filter((p) => p.notable)].sort((a, b) => Number(b.notable) - Number(a.notable));
    setPlan(buildItinerary(sights, pois.data.restaurantes, days, place));
  };

  const savePoi = (t: Trip, p: Poi, day?: number) => addPlace(t, p.category === "restaurantes" || p.category === "noite" ? "restaurants" : "activities", { name: p.name, kind: p.kind, lat: p.lat, lon: p.lon, address: p.address, url: p.website, day });

  if (pois.loading) return <Loading text="Buscando pontos turísticos, restaurantes e passeios no mapa…" />;
  if (pois.error) return <Notice kind="warn">{pois.error.message} <button className="btn sm" onClick={pois.reload}>Tentar de novo</button></Notice>;
  if (!pois.data) return null;
  return (
    <div className="stack">
      <div className="card stack">
        <div className="row wrap between">
          <h3>O que fazer</h3>
          <span className="tiny muted">Fonte: OpenStreetMap (dados colaborativos). Preço só quando o mapa informa a entrada.</span>
        </div>
        {!counts.length && <Empty>Poucos lugares cadastrados no mapa para este destino.</Empty>}
        {counts.length > 0 && (
          <>
            <Seg value={counts.includes(cat) ? cat : counts[0]} onChange={setCat} label="Categoria" options={counts.map((c) => ({ id: c, label: `${CATEGORY_LABEL[c]} (${pois.data![c].length})` }))} />
            <PoiList items={pois.data[counts.includes(cat) ? cat : counts[0]]} onSave={(p) => setSaving({ kind: "poi", poi: p })} />
          </>
        )}
      </div>
      <div className="card stack">
        <div className="row wrap between">
          <h3>
            <CalendarDays size={18} style={{ verticalAlign: "-3px" }} /> Roteiro sugerido
          </h3>
          <div className="row">
            <label className="row small">
              Dias
              <input className="input" type="number" min={1} max={14} value={days} onChange={(e) => setDays(Math.max(1, Math.min(14, Number(e.target.value) || 1)))} style={{ width: 72 }} />
            </label>
            <button className="btn primary" onClick={makePlan}>
              Montar roteiro
            </button>
          </div>
        </div>
        <div className="small muted">Os lugares de cada dia ficam perto uns dos outros, na ordem do menor caminho, para evitar deslocamentos desnecessários.</div>
        {plan && !plan.length && <Empty>Não há lugares suficientes no mapa para montar um roteiro.</Empty>}
        {plan && plan.length > 0 && (
          <>
            <ItineraryView days={plan} />
            {plan.length < days && <div className="small muted">Só deu para preencher {plan.length} dia(s) com os lugares cadastrados no mapa.</div>}
            <button className="btn" style={{ alignSelf: "flex-start" }} onClick={() => setSaving({ kind: "plan" })}>
              Salvar roteiro na viagem
            </button>
          </>
        )}
      </div>
      {saving && (
        <SaveToTrip
          title={saving.kind === "plan" ? "Salvar roteiro na viagem" : `Salvar «${saving.poi.name}»`}
          suggestedName={`Viagem para ${place.name}`}
          onClose={() => setSaving(null)}
          onPick={(t0) => {
            let t = saveTrip({ ...t0, destination: t0.destination ?? { name: place.name, lat: place.lat, lon: place.lon, country: place.country } });
            if (saving.kind === "poi") return savePoi(t, saving.poi);
            for (const d of plan ?? []) {
              for (const it of d.items) t = savePoi(t, it.poi, d.day);
              if (d.lunch) t = savePoi(t, d.lunch, d.day);
            }
            toast("Roteiro salvo: veja em Minhas viagens.");
            return t;
          }}
        />
      )}
    </div>
  );
}

export function DestinationsPage({ query }: { query: URLSearchParams }) {
  const q = query.get("q") ?? "";
  const [text, setText] = useState(q);
  const [pick, setPick] = useState(0);
  const places = useAsync((s) => geocode(q, s), [q], q.length >= 2);
  const place = places.data?.[pick] ?? null;
  const airports = useMemo(() => (place ? nearestAirports(place.lat, place.lon) : []), [place]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setPick(0);
    if (text.trim().length >= 2) navigate("destinos", { q: text.trim() });
  };

  return (
    <div className="stack">
      <form className="card row wrap" onSubmit={submit}>
        <label className="field grow">
          <span>Destino</span>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Paris, Gramado, Salvador" />
        </label>
        <button className="btn primary" style={{ alignSelf: "flex-end" }}>
          <Search size={16} /> Explorar
        </button>
      </form>
      {!q && (
        <div className="stack">
          <h2>Destinos populares</h2>
          <div className="row wrap">
            {POPULAR.map((p) => (
              <button key={p} className="btn" onClick={() => navigate("destinos", { q: p })}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
      {places.loading && <Loading text="Localizando o destino…" />}
      {places.error && <Notice kind="bad">{places.error.message}</Notice>}
      {places.data && !places.data.length && <Empty>Não encontramos «{q}». Tente o nome da cidade.</Empty>}
      {places.data && places.data.length > 1 && (
        <div className="row wrap small">
          <span className="muted">Não é esse?</span>
          {places.data.map((p, i) => (
            <button key={i} className={`btn sm ${i === pick ? "primary" : ""}`} onClick={() => setPick(i)}>
              {p.displayName.split(",").slice(0, 3).join(",")}
            </button>
          ))}
        </div>
      )}
      {place && (
        <>
          <div className="row wrap">
            <button className="btn" disabled={!airports.length} title={airports.length ? airports.map((a) => a.code).join(", ") : "Nenhum aeroporto comercial a menos de 120 km"} onClick={() => navigate("voos", { ...paramsToQuery({ ...defaultFlightParams(), origin: [], destination: airports.map((a) => a.code) }), de: undefined })}>
              <Plane size={16} /> Passagens para cá{airports.length ? ` (${airports.map((a) => a.code).join(", ")})` : ""}
            </button>
            <button className="btn" onClick={() => navigate("hoteis", hotelParamsToQuery(defaultHotelParams(place.name)))}>
              <BedDouble size={16} /> Hotéis em {place.name}
            </button>
          </div>
          <Overview place={place} />
          <Places place={place} />
          <Guide place={place} />
        </>
      )}
    </div>
  );
}
