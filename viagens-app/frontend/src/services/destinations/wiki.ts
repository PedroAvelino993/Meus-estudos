// Textos sobre o destino: resumo e foto da Wikipédia e dicas do Wikivoyage (português,
// com o inglês como alternativa). Conteúdo livre (CC BY-SA), sempre com link para a fonte.

import { PUBLIC_SOURCES } from "../../config";

export interface WikiSummary {
  title: string;
  extract: string;
  image?: string;
  url: string;
  lang: string;
}

interface RestSummary {
  type?: string;
  title: string;
  extract?: string;
  thumbnail?: { source: string };
  originalimage?: { source: string };
  content_urls?: { desktop?: { page?: string } };
}

export async function wikiSummary(title: string, langs = ["pt", "en"], signal?: AbortSignal): Promise<WikiSummary | null> {
  for (const lang of langs) {
    try {
      const res = await fetch(`${PUBLIC_SOURCES.wikipedia(lang)}/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}?redirect=true`, { signal });
      if (!res.ok) continue;
      const d = (await res.json()) as RestSummary;
      if (d.type === "disambiguation" || !d.extract) continue;
      return { title: d.title, extract: d.extract, image: d.thumbnail?.source ?? d.originalimage?.source, url: d.content_urls?.desktop?.page ?? `${PUBLIC_SOURCES.wikipedia(lang)}/wiki/${encodeURIComponent(title)}`, lang };
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
    }
  }
  return null;
}

/** «pt:Torre Eiffel» (etiqueta wikipedia do OpenStreetMap) → resumo. */
export async function wikiFromTag(tag: string, signal?: AbortSignal): Promise<WikiSummary | null> {
  const m = /^([a-z-]+):(.+)$/.exec(tag);
  if (!m) return null;
  return wikiSummary(m[2], [m[1]], signal);
}

export interface TravelGuide {
  lang: string;
  url: string;
  intro: string;
  sections: { title: string; text: string }[];
}

/** Seções úteis do Wikivoyage (como chegar, transporte, segurança, clima…). */
const USEFUL = /^(entenda|understand|chegar|get in|circular|get around|segurança|stay safe|fique seguro|clima|climate|respeite|respect|dinheiro|money|compras|buy|cuide-se|stay healthy)/i;

export async function travelGuide(title: string, signal?: AbortSignal): Promise<TravelGuide | null> {
  for (const lang of ["pt", "en"]) {
    try {
      const base = PUBLIC_SOURCES.wikivoyage(lang);
      const res = await fetch(`${base}/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(title)}`, { signal });
      if (!res.ok) continue;
      const data = (await res.json()) as { query?: { pages?: Record<string, { extract?: string; title?: string; missing?: string }> } };
      const page = Object.values(data.query?.pages ?? {})[0];
      if (!page || page.missing !== undefined || !page.extract || page.extract.length < 400) continue;
      const parts = page.extract.split(/\n(?===+ )/);
      const intro = parts[0].trim().split("\n").filter(Boolean).slice(0, 3).join("\n\n");
      const sections = parts
        .slice(1)
        .map((p) => {
          const m = /^(=+)\s*(.+?)\s*=+\s*\n?([\s\S]*)$/.exec(p);
          return m && m[1].length === 2 ? { title: m[2], text: m[3].trim() } : null;
        })
        .filter((s): s is { title: string; text: string } => !!s && USEFUL.test(s.title) && s.text.length > 60)
        .map((s) => ({ title: s.title, text: s.text.replace(/\n{2,}/g, "\n").slice(0, 1800) }));
      return { lang, url: `${base}/wiki/${encodeURIComponent((page.title ?? title).replace(/ /g, "_"))}`, intro, sections };
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
    }
  }
  return null;
}
