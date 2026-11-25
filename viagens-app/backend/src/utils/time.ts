// Datas, horários e durações.

/** "PT2H30M" / "P1DT2H" → minutos. */
export function isoDurationToMinutes(iso: string | null | undefined): number {
  if (!iso) return 0;
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso);
  if (!m) return 0;
  const [, d, h, min] = m;
  return Number(d ?? 0) * 1440 + Number(h ?? 0) * 60 + Number(min ?? 0);
}

/** "2026-10-03 15:10" (SerpApi) → "2026-10-03T15:10". */
export function serpTime(t: string | undefined): string {
  return (t ?? "").trim().replace(" ", "T").slice(0, 16);
}

/** "2026-10-03T15:10:00" (Duffel, hora local) → "2026-10-03T15:10". */
export function localIso(t: string | undefined): string {
  return (t ?? "").slice(0, 16);
}

/** Diferença em minutos entre dois horários locais do mesmo fuso (aproximação para conexões). */
export function minutesBetween(a: string, b: string): number {
  const ta = Date.parse(a + ":00Z");
  const tb = Date.parse(b + ":00Z");
  return Number.isFinite(ta) && Number.isFinite(tb) ? Math.round((tb - ta) / 60000) : 0;
}

export function isDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(1, Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000));
}

export function addDays(date: string, days: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
