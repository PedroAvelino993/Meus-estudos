// Formatação de preços, datas, horários e durações (pt-BR).

import { LOCALE } from "../config";

export function money(value: number | null | undefined, currency = "BRL"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency, maximumFractionDigits: value >= 100 || Number.isInteger(value) ? 0 : 2 }).format(value);
}

export function duration(min: number): string {
  if (!min || min < 0) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? (m ? `${h}h ${String(m).padStart(2, "0")}min` : `${h}h`) : `${m}min`;
}

/** "2026-12-10T06:05" → "06:05" */
export function clock(local: string): string {
  return local?.slice(11, 16) ?? "";
}

/** "2026-12-10" → "qua., 10 de dez." */
export function dayLabel(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  if (!date) return "";
  return new Date(date.slice(0, 10) + "T12:00:00").toLocaleDateString(LOCALE, opts);
}

/** Dias de diferença entre a chegada e a partida (voo que chega no dia seguinte). */
export function dayShift(from: string, to: string): number {
  return Math.round((Date.parse(to.slice(0, 10)) - Date.parse(from.slice(0, 10))) / 86_400_000);
}

/** «há 5 min», «há 2 h», ou a data. */
export function ago(iso: string): string {
  const diff = (Date.now() - Date.parse(iso)) / 60_000;
  if (!Number.isFinite(diff)) return "";
  if (diff < 1) return "agora há pouco";
  if (diff < 60) return `há ${Math.round(diff)} min`;
  if (diff < 24 * 60) return `há ${Math.round(diff / 60)} h`;
  return new Date(iso).toLocaleString(LOCALE, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
