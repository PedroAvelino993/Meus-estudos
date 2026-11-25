// Busca de voos pelo backend (que consulta os fornecedores com as chaves protegidas).

import type { BookingOption, BookingOptionsResponse, FlightLeg, FlightSearchParams, FlightSearchResponse } from "../../types";
import { api } from "../../api/client";

export const searchFlights = (p: FlightSearchParams, signal?: AbortSignal) => api<FlightSearchResponse>("/api/flights/search", { body: p, signal });

export const returnFlights = (search: FlightSearchParams, token: string, outbound: FlightLeg) => api<FlightSearchResponse>("/api/flights/returns", { body: { search, token, outbound } });

export const bookingOptions = (search: FlightSearchParams, token: string) => api<BookingOptionsResponse>("/api/flights/booking", { body: { search, token } });

/** Abre o site do vendedor. Os links do Google Flights pedem POST com os dados da oferta. */
export function openBooking(o: BookingOption) {
  if (!o.request.postData) {
    window.open(o.request.url, "_blank", "noopener");
    return;
  }
  const form = document.createElement("form");
  form.method = "POST";
  form.action = o.request.url;
  form.target = "_blank";
  for (const pair of o.request.postData.split("&")) {
    const [k, v = ""] = pair.split("=");
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = decodeURIComponent(k);
    input.value = decodeURIComponent(v.replace(/\+/g, " "));
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
}
