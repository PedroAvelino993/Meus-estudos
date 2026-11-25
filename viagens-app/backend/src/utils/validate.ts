// Validação das buscas recebidas do frontend (nunca confiar no que chega).

import type { CabinClass, FlightSearchParams, HotelSearchParams, HotelSort } from "../../../shared/types.ts";
import { HttpError } from "../http/router.ts";
import { isDate, todayUtc } from "./time.ts";

const bad = (msg: string) => new HttpError(400, "bad_request", msg);
const int = (v: unknown, min: number, max: number, name: string): number => {
  const n = Number(v ?? 0);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${name} deve ser um número entre ${min} e ${max}.`);
  return n;
};
const codes = (v: unknown, name: string): string[] => {
  const list = (Array.isArray(v) ? v : String(v ?? "").split(",")).map((c) => String(c).trim().toUpperCase()).filter(Boolean);
  if (!list.length || list.length > 6 || list.some((c) => !/^[A-Z]{3}$/.test(c))) throw bad(`${name}: informe códigos de aeroporto de 3 letras (ex.: GRU).`);
  return list;
};
const CABINS: CabinClass[] = ["economy", "premium_economy", "business", "first"];

export function parseFlightSearch(b: Record<string, unknown>): FlightSearchParams {
  const origin = codes(b.origin, "Origem");
  const destination = codes(b.destination, "Destino");
  if (origin.some((o) => destination.includes(o))) throw bad("Origem e destino precisam ser diferentes.");
  if (!isDate(b.departDate)) throw bad("Data de ida inválida.");
  if ((b.departDate as string) < todayUtc()) throw bad("A data de ida já passou.");
  const returnDate = b.returnDate ? String(b.returnDate) : undefined;
  if (returnDate && (!isDate(returnDate) || returnDate < (b.departDate as string))) throw bad("A data de volta precisa ser igual ou depois da ida.");
  const adults = int(b.adults ?? 1, 1, 9, "Adultos");
  const children = int(b.children, 0, 8, "Crianças");
  const infants = int(b.infants, 0, adults, "Bebês (até 1 por adulto)");
  if (adults + children + infants > 9) throw bad("No máximo 9 passageiros por busca.");
  const cabin = (CABINS.includes(b.cabin as CabinClass) ? b.cabin : "economy") as CabinClass;
  const currency = /^[A-Z]{3}$/.test(String(b.currency ?? "")) ? String(b.currency) : "BRL";
  return { origin, destination, departDate: b.departDate as string, returnDate, adults, children, infants, cabin, directOnly: b.directOnly === true, currency };
}

const SORTS: HotelSort[] = ["relevance", "price", "rating", "reviews"];

export function parseHotelSearch(b: Record<string, unknown>): HotelSearchParams {
  const query = String(b.query ?? "").trim();
  if (query.length < 2 || query.length > 120) throw bad("Informe a cidade ou o nome do hotel.");
  if (!isDate(b.checkIn) || !isDate(b.checkOut)) throw bad("Datas de entrada e saída inválidas.");
  if ((b.checkIn as string) < todayUtc()) throw bad("A data de entrada já passou.");
  if ((b.checkOut as string) <= (b.checkIn as string)) throw bad("A saída precisa ser depois da entrada.");
  const adults = int(b.adults ?? 2, 1, 12, "Adultos");
  const children = int(b.children, 0, 8, "Crianças");
  const ages = Array.isArray(b.childrenAges) ? b.childrenAges.map((a) => int(a, 0, 17, "Idade")).slice(0, children) : [];
  return {
    query,
    checkIn: b.checkIn as string,
    checkOut: b.checkOut as string,
    adults,
    children,
    childrenAges: ages,
    rooms: int(b.rooms ?? 1, 1, 8, "Quartos"),
    currency: /^[A-Z]{3}$/.test(String(b.currency ?? "")) ? String(b.currency) : "BRL",
    sort: SORTS.includes(b.sort as HotelSort) ? (b.sort as HotelSort) : "relevance",
    minRating: [3.5, 4, 4.5].includes(Number(b.minRating)) ? Number(b.minRating) : undefined,
    stars: Array.isArray(b.stars) ? b.stars.map(Number).filter((s) => s >= 2 && s <= 5) : undefined,
  };
}
