// Lista de lugares de uma categoria: localização, horário, entrada, links e resumo da Wikipédia.

import { useState } from "react";
import { BookOpen, ExternalLink, MapPin, Plus } from "lucide-react";
import type { Poi } from "../services/destinations/pois";
import { wikiFromTag, type WikiSummary } from "../services/destinations/wiki";
import { distanceLabel, googleMapsUrl } from "../services/maps/geo";
import { Tag } from "./ui";

function PoiRow({ p, onSave }: { p: Poi; onSave?: (p: Poi) => void }) {
  const [wiki, setWiki] = useState<WikiSummary | null | "loading">(null);
  return (
    <div className="poi">
      <div className="grow stack tight">
        <div className="row wrap" style={{ gap: 6 }}>
          <b>{p.name}</b>
          <span className="tiny muted">{p.kind}</span>
          {p.notable && <Tag kind="brand">Conhecido</Tag>}
          {p.fee && <Tag kind={p.fee === "gratuita" ? "good" : undefined}>Entrada {p.fee}</Tag>}
        </div>
        <div className="tiny muted">
          {distanceLabel(p.distanceKm)} do centro
          {p.cuisine ? ` · cozinha: ${p.cuisine}` : ""}
          {p.address ? ` · ${p.address}` : ""}
        </div>
        {p.openingHours && <div className="tiny muted">Horário (OpenStreetMap): {p.openingHours}</div>}
        {wiki && wiki !== "loading" && (
          <div className="small" style={{ background: "var(--bg)", borderRadius: 8, padding: 8 }}>
            {wiki.extract}{" "}
            <a href={wiki.url} target="_blank" rel="noopener">
              Wikipédia
            </a>
          </div>
        )}
        <div className="row wrap" style={{ gap: 6 }}>
          <a className="btn sm" href={googleMapsUrl(p)} target="_blank" rel="noopener">
            <MapPin size={13} /> Mapa
          </a>
          {p.website && (
            <a className="btn sm" href={p.website} target="_blank" rel="noopener">
              Site <ExternalLink size={12} />
            </a>
          )}
          {p.wikipedia && !wiki && (
            <button
              className="btn sm"
              onClick={async () => {
                setWiki("loading");
                setWiki(await wikiFromTag(p.wikipedia!).catch(() => null));
              }}
            >
              <BookOpen size={13} /> Sobre
            </button>
          )}
          {onSave && (
            <button className="btn sm" onClick={() => onSave(p)}>
              <Plus size={13} /> Salvar na viagem
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PoiList({ items, onSave, limit = 12 }: { items: Poi[]; onSave?: (p: Poi) => void; limit?: number }) {
  const [more, setMore] = useState(false);
  const shown = more ? items : items.slice(0, limit);
  return (
    <div>
      {shown.map((p) => (
        <PoiRow key={p.id} p={p} onSave={onSave} />
      ))}
      {items.length > limit && (
        <button className="btn ghost sm" onClick={() => setMore((m) => !m)}>
          {more ? "Mostrar menos" : `Mostrar mais ${items.length - limit}`}
        </button>
      )}
    </div>
  );
}
