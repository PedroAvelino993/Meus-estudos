// Onde comprar: companhia aérea e agências, com preço, bagagem e link de cada uma.

import { BadgeCheck, ExternalLink } from "lucide-react";
import type { BookingOptionsResponse } from "../types";
import { ago, money } from "../utils/format";
import { openBooking } from "../services/flights/search";
import { Empty, Loading, Modal, Notice, Tag } from "./ui";

export function BookingOptions({ data, loading, error, onClose }: { data: BookingOptionsResponse | null; loading: boolean; error: string | null; onClose: () => void }) {
  return (
    <Modal title="Onde comprar" onClose={onClose}>
      {loading && <Loading text="Consultando vendedores no Google Flights…" />}
      {error && <Notice kind="bad">{error}</Notice>}
      {data && (
        <div className="stack">
          <Notice kind="info">
            Preços encontrados {ago(data.fetchedAt)}. A compra é feita no site do vendedor, que confirma o valor final e os lugares disponíveis.
          </Notice>
          {!data.options.length && <Empty>Nenhum vendedor disponível para esta combinação agora. Tente outra opção de voo.</Empty>}
          {data.options.map((o, i) => (
            <div key={i} className="card flat stack tight">
              <div className="row between">
                <div className="row" style={{ gap: 6 }}>
                  <b>{o.seller}</b>
                  {o.isAirline && (
                    <Tag kind="good">
                      <BadgeCheck size={12} /> Companhia aérea
                    </Tag>
                  )}
                </div>
                <div className="price sm">{o.price !== null ? money(o.price, o.currency) : "Ver no site"}</div>
              </div>
              {o.title && <div className="small muted">{o.title}</div>}
              {o.baggage.length > 0 && <div className="small">Bagagem: {o.baggage.join(" · ")}</div>}
              {o.features.length > 0 && <div className="small muted">{o.features.join(" · ")}</div>}
              <button className="btn primary" onClick={() => openBooking(o)}>
                Comprar em {o.seller} <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
