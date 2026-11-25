// Sites oficiais das principais companhias aéreas (para comprar direto com a companhia).
// Só domínios oficiais conhecidos; companhias fora da lista usam a busca do Google Flights.

export interface AirlineInfo {
  code: string;
  name: string;
  site: string;
}

export const AIRLINES: AirlineInfo[] = [
  { code: "LA", name: "LATAM", site: "https://www.latamairlines.com" },
  { code: "JJ", name: "LATAM Brasil", site: "https://www.latamairlines.com" },
  { code: "G3", name: "GOL", site: "https://www.voegol.com.br" },
  { code: "AD", name: "Azul", site: "https://www.voeazul.com.br" },
  { code: "TP", name: "TAP Air Portugal", site: "https://www.flytap.com" },
  { code: "AF", name: "Air France", site: "https://www.airfrance.com" },
  { code: "KL", name: "KLM", site: "https://www.klm.com" },
  { code: "LH", name: "Lufthansa", site: "https://www.lufthansa.com" },
  { code: "IB", name: "Iberia", site: "https://www.iberia.com" },
  { code: "UX", name: "Air Europa", site: "https://www.aireuropa.com" },
  { code: "AA", name: "American Airlines", site: "https://www.aa.com" },
  { code: "UA", name: "United Airlines", site: "https://www.united.com" },
  { code: "DL", name: "Delta", site: "https://www.delta.com" },
  { code: "B6", name: "JetBlue", site: "https://www.jetblue.com" },
  { code: "WN", name: "Southwest", site: "https://www.southwest.com" },
  { code: "CM", name: "Copa Airlines", site: "https://www.copaair.com" },
  { code: "AV", name: "Avianca", site: "https://www.avianca.com" },
  { code: "AR", name: "Aerolíneas Argentinas", site: "https://www.aerolineas.com.ar" },
  { code: "JA", name: "JetSMART", site: "https://jetsmart.com" },
  { code: "H2", name: "Sky Airline", site: "https://www.skyairline.com" },
  { code: "FO", name: "Flybondi", site: "https://flybondi.com" },
  { code: "DM", name: "Arajet", site: "https://www.arajet.com" },
  { code: "AC", name: "Air Canada", site: "https://www.aircanada.com" },
  { code: "AM", name: "Aeroméxico", site: "https://www.aeromexico.com" },
  { code: "BA", name: "British Airways", site: "https://www.britishairways.com" },
  { code: "LX", name: "SWISS", site: "https://www.swiss.com" },
  { code: "AZ", name: "ITA Airways", site: "https://www.ita-airways.com" },
  { code: "FR", name: "Ryanair", site: "https://www.ryanair.com" },
  { code: "U2", name: "easyJet", site: "https://www.easyjet.com" },
  { code: "VY", name: "Vueling", site: "https://www.vueling.com" },
  { code: "EK", name: "Emirates", site: "https://www.emirates.com" },
  { code: "QR", name: "Qatar Airways", site: "https://www.qatarairways.com" },
  { code: "EY", name: "Etihad", site: "https://www.etihad.com" },
  { code: "TK", name: "Turkish Airlines", site: "https://www.turkishairlines.com" },
  { code: "ET", name: "Ethiopian Airlines", site: "https://www.ethiopianairlines.com" },
  { code: "SQ", name: "Singapore Airlines", site: "https://www.singaporeair.com" },
  { code: "NH", name: "ANA", site: "https://www.ana.co.jp" },
  { code: "JL", name: "Japan Airlines", site: "https://www.jal.co.jp" },
];

const byCode = new Map(AIRLINES.map((a) => [a.code, a]));

export function airlineByCode(code: string | null | undefined): AirlineInfo | undefined {
  return code ? byCode.get(code.toUpperCase()) : undefined;
}

/** "LA 3456" → "LA" */
export function carrierFromFlightNumber(flightNumber: string): string | undefined {
  const m = /^([A-Z0-9]{2})\s?\d+/.exec(flightNumber.trim().toUpperCase());
  return m?.[1];
}

/** Busca equivalente no Google Flights (para conferir o preço ou comprar). */
export function googleFlightsUrl(p: { origin: string; destination: string; departDate: string; returnDate?: string; adults?: number }): string {
  const q = `Flights from ${p.origin} to ${p.destination} on ${p.departDate}${p.returnDate ? ` through ${p.returnDate}` : " one way"}${p.adults && p.adults > 1 ? ` for ${p.adults} adults` : ""}`;
  return `https://www.google.com/travel/flights?hl=pt-BR&curr=BRL&q=${encodeURIComponent(q)}`;
}
