// Conexão VOLUNTÁRIA com o canal pela API oficial do YouTube (OAuth do Google, só leitura).
// Nada é simulado: sem Client ID configurado e sem login, nenhum dado aparece.

import type { VideoStats } from "../core/learning";
import { isoDuration } from "../core/learning";

const CLIENT_KEY = "gca:ytClientId";
const SCOPES = "https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly";

export function ytClientId(): string {
  return localStorage.getItem(CLIENT_KEY) ?? "";
}
export function setYtClientId(id: string) {
  if (id.trim()) localStorage.setItem(CLIENT_KEY, id.trim());
  else localStorage.removeItem(CLIENT_KEY);
}

let token: { value: string; expires: number } | null = null;

interface GisTokenClient {
  requestAccessToken: (o?: { prompt?: string }) => void;
}
interface Gis {
  accounts: { oauth2: { initTokenClient: (cfg: { client_id: string; scope: string; callback: (r: { access_token?: string; expires_in?: number; error?: string; error_description?: string }) => void; error_callback?: (e: { type: string; message?: string }) => void }) => GisTokenClient; revoke: (t: string, cb: () => void) => void } };
}

function loadGis(): Promise<Gis> {
  const w = window as unknown as { google?: Gis };
  if (w.google?.accounts?.oauth2) return Promise.resolve(w.google);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => (w.google ? resolve(w.google) : reject(new Error("Login do Google indisponível")));
    s.onerror = () => reject(new Error("Não foi possível carregar o login do Google (verifique a conexão ou bloqueadores)."));
    document.head.appendChild(s);
  });
}

export function ytConnected(): boolean {
  return !!token && token.expires > Date.now();
}

export async function ytConnect(): Promise<void> {
  const clientId = ytClientId();
  if (!clientId) throw new Error("Configure o Client ID do Google em Configurações.");
  const gis = await loadGis();
  await new Promise<void>((resolve, reject) => {
    const tc = gis.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (r) => {
        if (r.error || !r.access_token) return reject(new Error(r.error_description || r.error || "Login cancelado"));
        token = { value: r.access_token, expires: Date.now() + (r.expires_in ?? 3600) * 1000 - 60000 };
        resolve();
      },
      error_callback: (e) => reject(new Error(e.message || e.type)),
    });
    tc.requestAccessToken({ prompt: "consent" });
  });
}

export async function ytDisconnect() {
  if (!token) return;
  const gis = await loadGis().catch(() => null);
  const t = token.value;
  token = null;
  gis?.accounts.oauth2.revoke(t, () => undefined);
}

async function api<T>(url: string): Promise<T> {
  if (!ytConnected()) throw new Error("Conecte o canal primeiro.");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token!.value}` } });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const j = await res.json();
      msg = j.error?.message ?? msg;
    } catch {
      /* corpo vazio */
    }
    throw new Error(`YouTube API: ${msg}`);
  }
  return res.json() as Promise<T>;
}

export interface ChannelInfo {
  id: string;
  title: string;
  thumbnail: string;
  subscribers: number | null;
  views: number;
  videos: number;
  uploadsPlaylist: string;
}

export async function ytChannel(): Promise<ChannelInfo> {
  const r = await api<{ items?: { id: string; snippet: { title: string; thumbnails: { default?: { url: string } } }; statistics: { subscriberCount?: string; hiddenSubscriberCount?: boolean; viewCount: string; videoCount: string }; contentDetails: { relatedPlaylists: { uploads: string } } }[] }>("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true");
  const c = r.items?.[0];
  if (!c) throw new Error("Esta conta Google não tem um canal do YouTube.");
  return {
    id: c.id,
    title: c.snippet.title,
    thumbnail: c.snippet.thumbnails.default?.url ?? "",
    subscribers: c.statistics.hiddenSubscriberCount ? null : Number(c.statistics.subscriberCount ?? 0),
    views: Number(c.statistics.viewCount),
    videos: Number(c.statistics.videoCount),
    uploadsPlaylist: c.contentDetails.relatedPlaylists.uploads,
  };
}

/** Últimos vídeos do canal com estatísticas públicas e, quando disponível, dados do Analytics. */
export async function ytVideos(ch: ChannelInfo, max = 50): Promise<VideoStats[]> {
  const pl = await api<{ items: { contentDetails: { videoId: string } }[] }>(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=${Math.min(50, max)}&playlistId=${ch.uploadsPlaylist}`);
  const ids = pl.items.map((i) => i.contentDetails.videoId);
  if (!ids.length) return [];
  const vs = await api<{ items: { id: string; snippet: { title: string; description: string; tags?: string[]; publishedAt: string }; statistics: { viewCount?: string; likeCount?: string; commentCount?: string }; contentDetails: { duration: string } }[] }>(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}`);
  const out: VideoStats[] = vs.items.map((v) => ({
    id: v.id,
    title: v.snippet.title,
    description: v.snippet.description,
    tags: v.snippet.tags ?? [],
    publishedAt: v.snippet.publishedAt,
    durationSec: isoDuration(v.contentDetails.duration),
    views: Number(v.statistics.viewCount ?? 0),
    likes: Number(v.statistics.likeCount ?? 0),
    comments: Number(v.statistics.commentCount ?? 0),
    avgViewPct: null,
    minutesWatched: null,
    subscribersGained: null,
  }));
  // Analytics: porcentagem assistida, minutos e inscritos por vídeo (últimos 365 dias)
  try {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
    const rep = await api<{ columnHeaders: { name: string }[]; rows?: (string | number)[][] }>(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${start}&endDate=${end}&metrics=views,estimatedMinutesWatched,averageViewPercentage,subscribersGained&dimensions=video&sort=-views&maxResults=200`,
    );
    const col = (n: string) => rep.columnHeaders.findIndex((h) => h.name === n);
    for (const row of rep.rows ?? []) {
      const v = out.find((x) => x.id === row[col("video")]);
      if (!v) continue;
      v.avgViewPct = Number(row[col("averageViewPercentage")]);
      v.minutesWatched = Number(row[col("estimatedMinutesWatched")]);
      v.subscribersGained = Number(row[col("subscribersGained")]);
    }
  } catch {
    /* Analytics pode não estar disponível para canais novos; ficam só os dados públicos */
  }
  return out;
}

/** Curva de retenção de um vídeo (porcentagem do público em cada ponto), quando disponível. */
export async function ytRetention(videoId: string): Promise<{ x: number; ratio: number }[]> {
  const end = new Date().toISOString().slice(0, 10);
  const rep = await api<{ rows?: (number | string)[][] }>(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=2005-01-01&endDate=${end}&metrics=audienceWatchRatio&dimensions=elapsedVideoTimeRatio&filters=video==${videoId}`);
  return (rep.rows ?? []).map((r) => ({ x: Number(r[0]), ratio: Number(r[1]) }));
}

/** Shorts: hoje o YouTube aceita Shorts de até 3 minutos (verticais ou quadrados). */
export function isShort(v: VideoStats): boolean {
  return v.durationSec > 0 && v.durationSec <= 180;
}
