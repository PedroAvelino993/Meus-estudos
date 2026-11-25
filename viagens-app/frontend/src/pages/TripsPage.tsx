// Minhas viagens: lista e detalhes (passagens, hotel, passeios, restaurantes, endereços, gastos e orçamento).

import { useState } from "react";
import { BedDouble, CalendarDays, Compass, MapPin, Plane, Plus, Trash2, Wallet } from "lucide-react";
import type { Expense, SavedPlace, Trip } from "../types";
import { budgetSummary, deleteTrip, EXPENSE_LABEL, getTrip, listTrips, newTrip, removePlace, saveTrip } from "../database/trips";
import { useStore } from "../hooks/useStore";
import { navigate } from "../hooks/useRoute";
import { googleMapsUrl, googleRouteUrl } from "../services/maps/geo";
import { cityOf } from "../services/flights/airports";
import { defaultHotelParams, hotelParamsToQuery } from "../services/hotels/search";
import { FlightCard } from "../components/FlightCard";
import { Stars } from "../components/HotelCard";
import { Empty, Notice } from "../components/ui";
import { dayLabel, money } from "../utils/format";
import { daysBetween } from "../utils/dates";
import { uid } from "../utils/text";

export function TripsPage() {
  const trips = useStore(listTrips);
  const [name, setName] = useState("");
  return (
    <div className="stack">
      <div className="row wrap between">
        <h1>Minhas viagens</h1>
        <a className="btn" href="#/comparar">
          Comparar opções
        </a>
      </div>
      <form
        className="card row wrap"
        onSubmit={(e) => {
          e.preventDefault();
          const t = saveTrip(newTrip({ name: name.trim() || "Nova viagem" }));
          navigate(`viagens/${t.id}`);
        }}
      >
        <label className="field grow">
          <span>Nova viagem</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Férias em Lisboa" />
        </label>
        <button className="btn primary" style={{ alignSelf: "flex-end" }}>
          <Plus size={16} /> Criar
        </button>
      </form>
      {!trips.length && <Empty>Nenhuma viagem salva ainda. Pesquise passagens, hotéis ou destinos e toque em «Salvar».</Empty>}
      <div className="grid g3">
        {trips.map((t) => {
          const b = budgetSummary(t);
          return (
            <a key={t.id} className="card stack tight" href={`#/viagens/${encodeURIComponent(t.id)}`} style={{ color: "inherit", textDecoration: "none" }}>
              <h3>{t.name}</h3>
              <div className="small muted">
                {t.destination?.name ?? "Destino a definir"}
                {t.startDate ? ` · ${dayLabel(t.startDate)}${t.endDate ? ` – ${dayLabel(t.endDate)}` : ""}` : ""}
              </div>
              <div className="row wrap tiny muted" style={{ gap: 10 }}>
                <span>
                  <Plane size={12} /> {t.outbound ? "passagem salva" : "sem passagem"}
                </span>
                <span>
                  <BedDouble size={12} /> {t.hotel ? "hotel salvo" : "sem hotel"}
                </span>
                <span>
                  <Compass size={12} /> {t.activities.length} passeio(s)
                </span>
              </div>
              <div className="bold">Total estimado: {money(b.total, t.currency)}</div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function PlaceList({ trip, list, title }: { trip: Trip; list: "activities" | "restaurants"; title: string }) {
  const items = trip[list];
  const byDay = new Map<number, SavedPlace[]>();
  for (const p of items) byDay.set(p.day ?? 0, [...(byDay.get(p.day ?? 0) ?? []), p]);
  const days = [...byDay.keys()].sort((a, b) => (a || 99) - (b || 99));
  const setPrice = (p: SavedPlace, price: number | undefined) => saveTrip({ ...trip, [list]: trip[list].map((x) => (x.id === p.id ? { ...x, price } : x)) });
  return (
    <div className="card stack">
      <h3>{title}</h3>
      {!items.length && <div className="small muted">Nada salvo. Use o assistente de destino para encontrar e salvar lugares.</div>}
      {days.map((d) => {
        const ps = byDay.get(d)!;
        const located = ps.filter((p) => p.lat !== undefined && p.lon !== undefined) as (SavedPlace & { lat: number; lon: number })[];
        return (
          <div key={d} className="stack tight">
            {d > 0 && (
              <div className="row between">
                <b className="small">Dia {d}</b>
                {located.length > 1 && (
                  <a className="tiny" href={googleRouteUrl(located)} target="_blank" rel="noopener">
                    Rota do dia
                  </a>
                )}
              </div>
            )}
            {ps.map((p) => (
              <div key={p.id} className="row" style={{ gap: 8 }}>
                <div className="grow">
                  <div className="small bold">{p.name}</div>
                  <div className="tiny muted">
                    {p.kind}
                    {p.address ? ` · ${p.address}` : ""}
                  </div>
                </div>
                {list === "activities" && (
                  <input className="input" style={{ width: 110, minHeight: 34, padding: "4px 8px" }} type="number" min={0} step="1" placeholder="Preço R$" aria-label={`Preço de ${p.name}`} value={p.price ?? ""} onChange={(e) => setPrice(p, e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)))} />
                )}
                <a className="btn sm ghost" href={googleMapsUrl(p)} target="_blank" rel="noopener" aria-label="Mapa">
                  <MapPin size={14} />
                </a>
                <button className="btn sm ghost" aria-label={`Remover ${p.name}`} onClick={() => removePlace(trip, list, p.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Budget({ trip }: { trip: Trip }) {
  const [cat, setCat] = useState<Expense["category"]>("alimentacao");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const b = budgetSummary(trip);
  const pct = trip.budget ? Math.min(100, (b.total / trip.budget) * 100) : 0;
  return (
    <div className="card stack">
      <h3>
        <Wallet size={18} style={{ verticalAlign: "-3px" }} /> Resumo financeiro
      </h3>
      <table className="compare">
        <tbody>
          {b.rows.map((r) => (
            <tr key={r.category}>
              <th>{r.label}</th>
              <td className="num">
                {money(r.amount, trip.currency)}
                {r.auto > 0 && <span className="tiny muted"> (inclui {money(r.auto, trip.currency)} {r.category === "passagens" ? "das passagens salvas" : r.category === "hospedagem" ? "do hotel salvo" : "dos passeios"})</span>}
              </td>
            </tr>
          ))}
          <tr>
            <th>Total estimado</th>
            <td className="price sm">
              {money(b.total, trip.currency)}
              {trip.travelers > 1 && <span className="small muted"> · {money(b.total / trip.travelers, trip.currency)} por pessoa</span>}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="row wrap">
        <label className="field" style={{ width: 200 }}>
          <span>Orçamento total</span>
          <input className="input" type="number" min={0} value={trip.budget ?? ""} onChange={(e) => saveTrip({ ...trip, budget: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)) })} placeholder="R$" />
        </label>
        {trip.budget ? (
          <div className="grow stack tight">
            <div className="bar">
              <div style={{ width: `${pct}%`, background: b.total > trip.budget ? "var(--bad)" : undefined }} />
            </div>
            <div className="small" style={{ color: b.total > trip.budget ? "var(--bad)" : "var(--good)" }}>
              {b.total > trip.budget ? `Passou ${money(b.total - trip.budget, trip.currency)} do orçamento` : `Sobram ${money(trip.budget - b.total, trip.currency)}`}
            </div>
          </div>
        ) : null}
      </div>
      <form
        className="row wrap"
        onSubmit={(e) => {
          e.preventDefault();
          const v = Number(amount.replace(",", "."));
          if (!label.trim() || !Number.isFinite(v) || v <= 0) return;
          saveTrip({ ...trip, expenses: [...trip.expenses, { id: uid("g_"), category: cat, label: label.trim(), amount: v }] });
          setLabel("");
          setAmount("");
        }}
      >
        <select className="input" style={{ width: 160 }} value={cat} onChange={(e) => setCat(e.target.value as Expense["category"])} aria-label="Categoria do gasto">
          {(Object.keys(EXPENSE_LABEL) as Expense["category"][]).map((c) => (
            <option key={c} value={c}>
              {EXPENSE_LABEL[c]}
            </option>
          ))}
        </select>
        <input className="input grow" style={{ minWidth: 160 }} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Descrição (ex.: Uber do aeroporto)" aria-label="Descrição do gasto" />
        <input className="input" style={{ width: 120 }} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor R$" aria-label="Valor do gasto" />
        <button className="btn primary">Adicionar gasto</button>
      </form>
      {trip.expenses.length > 0 && (
        <div className="stack tight">
          {trip.expenses.map((x) => (
            <div key={x.id} className="row small">
              <span className="tag">{EXPENSE_LABEL[x.category]}</span>
              <span className="grow">{x.label}</span>
              <b className="num">{money(x.amount, trip.currency)}</b>
              <button className="btn sm ghost" aria-label={`Remover ${x.label}`} onClick={() => saveTrip({ ...trip, expenses: trip.expenses.filter((e) => e.id !== x.id) })}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TripPage({ id }: { id: string }) {
  const trip = useStore(() => getTrip(id));
  const [addr, setAddr] = useState({ label: "", address: "" });
  if (!trip) return <Empty>Viagem não encontrada. <a href="#/viagens">Ver minhas viagens</a></Empty>;
  const set = (p: Partial<Trip>) => saveTrip({ ...trip, ...p });
  const nights = trip.startDate && trip.endDate ? daysBetween(trip.startDate, trip.endDate) : null;
  const dest = trip.destination?.name ?? (trip.outbound ? cityOf(trip.outbound.legs[0].to.code) : "");

  return (
    <div className="stack">
      <a href="#/viagens" className="small">
        ← Minhas viagens
      </a>
      <div className="card stack">
        <input className="input" style={{ fontSize: 22, fontWeight: 800 }} value={trip.name} onChange={(e) => set({ name: e.target.value })} aria-label="Nome da viagem" />
        <div className="grid g4">
          <label className="field">
            <span>Destino</span>
            <input className="input" value={trip.destination?.name ?? ""} onChange={(e) => set({ destination: { ...trip.destination, name: e.target.value } })} placeholder="Cidade" />
          </label>
          <label className="field">
            <span>Ida</span>
            <input className="input" type="date" value={trip.startDate ?? ""} onChange={(e) => set({ startDate: e.target.value || undefined })} />
          </label>
          <label className="field">
            <span>Volta</span>
            <input className="input" type="date" min={trip.startDate} value={trip.endDate ?? ""} onChange={(e) => set({ endDate: e.target.value || undefined })} />
          </label>
          <label className="field">
            <span>Viajantes</span>
            <input className="input" type="number" min={1} max={20} value={trip.travelers} onChange={(e) => set({ travelers: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} />
          </label>
        </div>
        {nights !== null && nights >= 0 && (
          <div className="small muted">
            <CalendarDays size={13} style={{ verticalAlign: "-2px" }} /> {nights} noite(s)
          </div>
        )}
        <div className="row wrap">
          {dest && (
            <button className="btn sm" onClick={() => navigate("destinos", { q: dest })}>
              <Compass size={14} /> Assistente do destino
            </button>
          )}
          <button className="btn sm" onClick={() => navigate("voos", { para: trip.outbound?.legs[0].to.code, ida: trip.startDate, volta: trip.endDate })}>
            <Plane size={14} /> Buscar passagens
          </button>
          {dest && (
            <button className="btn sm" onClick={() => navigate("hoteis", hotelParamsToQuery({ ...defaultHotelParams(dest), ...(trip.startDate && trip.endDate ? { checkIn: trip.startDate, checkOut: trip.endDate } : {}), adults: trip.travelers }))}>
              <BedDouble size={14} /> Buscar hotéis
            </button>
          )}
        </div>
      </div>

      <div className="stack">
        <h2>Passagens</h2>
        {!trip.outbound && !trip.inbound && <div className="card small muted">Nenhuma passagem salva. Pesquise e toque em «Salvar».</div>}
        {trip.outbound && (
          <div className="stack tight">
            <div className="row between">
              <b className="small">{trip.outbound.legs.length > 1 ? "Ida e volta" : "Ida"}</b>
              <button className="btn sm ghost danger" onClick={() => set({ outbound: undefined })}>
                Remover
              </button>
            </div>
            <FlightCard offer={trip.outbound} />
          </div>
        )}
        {trip.inbound && (
          <div className="stack tight">
            <div className="row between">
              <b className="small">Volta</b>
              <button className="btn sm ghost danger" onClick={() => set({ inbound: undefined })}>
                Remover
              </button>
            </div>
            <FlightCard offer={trip.inbound} chosenLabel="Volta" />
          </div>
        )}
        {(trip.outbound || trip.inbound) && <Notice kind="info">Os preços salvos são os da hora em que foram encontrados (veja em cada passagem). Antes de comprar, abra a oferta de novo para confirmar o valor atual.</Notice>}
      </div>

      <div className="stack">
        <h2>Hospedagem</h2>
        {!trip.hotel && <div className="card small muted">Nenhum hotel salvo.</div>}
        {trip.hotel && (
          <div className="card row wrap top">
            {trip.hotel.photos[0] && <img src={trip.hotel.photos[0]} alt="" style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 8 }} />}
            <div className="grow stack tight">
              <b>
                {trip.hotel.name} <Stars n={trip.hotel.stars} />
              </b>
              <div className="small muted">
                {trip.hotel.nights} noite(s) · {money(trip.hotel.nightly, trip.hotel.currency)}/diária · total {money(trip.hotel.total, trip.hotel.currency)}
              </div>
              <div className="row wrap">
                {trip.hotel.links.slice(0, 2).map((l) => (
                  <a key={l.url} className="btn sm" href={l.url} target="_blank" rel="noopener">
                    {l.label}
                  </a>
                ))}
                <button className="btn sm ghost danger" onClick={() => set({ hotel: undefined })}>
                  Remover
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid g2">
        <PlaceList trip={trip} list="activities" title="Passeios planejados" />
        <PlaceList trip={trip} list="restaurants" title="Restaurantes salvos" />
      </div>

      <div className="card stack">
        <h3>Endereços importantes</h3>
        {trip.addresses.map((a) => (
          <div key={a.id} className="row small">
            <b>{a.label}:</b>
            <a className="grow" href={googleMapsUrl({ name: a.address })} target="_blank" rel="noopener">
              {a.address}
            </a>
            <button className="btn sm ghost" aria-label={`Remover ${a.label}`} onClick={() => set({ addresses: trip.addresses.filter((x) => x.id !== a.id) })}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <form
          className="row wrap"
          onSubmit={(e) => {
            e.preventDefault();
            if (!addr.label.trim() || !addr.address.trim()) return;
            set({ addresses: [...trip.addresses, { id: uid("e_"), label: addr.label.trim(), address: addr.address.trim() }] });
            setAddr({ label: "", address: "" });
          }}
        >
          <input className="input" style={{ width: 180 }} value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} placeholder="Nome (ex.: Consulado)" aria-label="Nome do endereço" />
          <input className="input grow" style={{ minWidth: 200 }} value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} placeholder="Endereço" aria-label="Endereço" />
          <button className="btn">Adicionar</button>
        </form>
      </div>

      <Budget trip={trip} />

      <div className="card stack">
        <h3>Anotações</h3>
        <textarea className="input" value={trip.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Documentos, vacinas, reservas de restaurante…" aria-label="Anotações" />
      </div>

      <button
        className="btn danger"
        style={{ alignSelf: "flex-start" }}
        onClick={() => {
          if (confirm(`Apagar a viagem «${trip.name}»?`)) {
            deleteTrip(trip.id);
            navigate("viagens");
          }
        }}
      >
        <Trash2 size={16} /> Apagar viagem
      </button>
    </div>
  );
}
