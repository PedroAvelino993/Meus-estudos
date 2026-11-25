// Itens no comparador: ofertas encontradas na busca e opções digitadas pelo usuário.

import type { FlightOffer, ManualOption } from "../types";
import { read, write } from "./store";

export const MAX_COMPARE = 4;

export const compareOffers = (): FlightOffer[] => read<FlightOffer[]>("compare:offers", []);
export const manualOptions = (): ManualOption[] => read<ManualOption[]>("compare:manual", []);

export function toggleCompare(o: FlightOffer): "added" | "removed" | "full" {
  const list = compareOffers();
  if (list.some((x) => x.id === o.id)) {
    write("compare:offers", list.filter((x) => x.id !== o.id));
    return "removed";
  }
  if (list.length + manualOptions().length >= MAX_COMPARE) return "full";
  write("compare:offers", [...list, o]);
  return "added";
}

export const isCompared = (id: string) => compareOffers().some((x) => x.id === id);

export function saveManual(m: ManualOption) {
  write("compare:manual", [...manualOptions().filter((x) => x.id !== m.id), m]);
}
export function removeManual(id: string) {
  write("compare:manual", manualOptions().filter((x) => x.id !== id));
}
export function clearCompare() {
  write("compare:offers", []);
  write("compare:manual", []);
}
