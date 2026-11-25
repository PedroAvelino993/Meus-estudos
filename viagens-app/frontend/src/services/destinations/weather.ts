// Previsão do tempo (Open-Meteo, gratuito, sem chave): próximos 7 dias.

import { PUBLIC_SOURCES } from "../../config";

export interface DayForecast {
  date: string;
  max: number;
  min: number;
  rainChance: number | null;
  code: number;
}

export async function forecast(lat: number, lon: number, signal?: AbortSignal): Promise<DayForecast[]> {
  const url = `${PUBLIC_SOURCES.openMeteo}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=7`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Previsão do tempo indisponível agora.");
  const d = (await res.json()) as { daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max?: (number | null)[]; weather_code: number[] } };
  return d.daily.time.map((date, i) => ({ date, max: d.daily.temperature_2m_max[i], min: d.daily.temperature_2m_min[i], rainChance: d.daily.precipitation_probability_max?.[i] ?? null, code: d.daily.weather_code[i] }));
}

/** Códigos WMO → descrição curta. */
export function weatherLabel(code: number): string {
  if (code === 0) return "Céu limpo";
  if (code <= 2) return "Poucas nuvens";
  if (code === 3) return "Nublado";
  if (code <= 48) return "Neblina";
  if (code <= 57) return "Garoa";
  if (code <= 67) return "Chuva";
  if (code <= 77) return "Neve";
  if (code <= 82) return "Pancadas de chuva";
  return "Tempestade";
}
