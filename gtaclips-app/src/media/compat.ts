// Teste de compatibilidade no próprio aparelho (iPhone/iPad/Safari).
//
// O app grava um vídeo de 1,5 s em cada formato candidato e pede para o player do próprio
// aparelho abrir. O primeiro formato que toca é o usado na exportação. Assim o arquivo final
// sempre abre no Fotos, no menu de compartilhar e nos apps — em vez de adivinhar.

import { AudioBufferSource, BufferTarget, CanvasSource, MovOutputFormat, Mp4OutputFormat, Output, getFirstEncodableAudioCodec, getFirstEncodableVideoCodec } from "mediabunny";
import { installAacFix, isWebKitEngine, setAacFix } from "./aacfix";
import { logError } from "./device";

export interface Plan {
  id: string;
  container: "mp4" | "mov";
  audio: "aac" | "opus" | "pcm-s16" | null;
  aacFix: boolean;
  label: string;
}

export const CANDIDATES: Plan[] = [
  { id: "mp4-aac-corrigido", container: "mp4", audio: "aac", aacFix: true, label: "MP4 (H.264 + AAC)" },
  { id: "mp4-aac", container: "mp4", audio: "aac", aacFix: false, label: "MP4 (H.264 + AAC do Safari)" },
  { id: "mov-pcm", container: "mov", audio: "pcm-s16", aacFix: false, label: "MOV (H.264 + áudio PCM)" },
  { id: "mp4-opus", container: "mp4", audio: "opus", aacFix: false, label: "MP4 (H.264 + Opus)" },
  { id: "mp4-mudo", container: "mp4", audio: null, aacFix: false, label: "MP4 sem áudio" },
];

export type PlayResult = "ok" | "ruim" | "sem-resposta";

/**
 * O aparelho consegue tocar o arquivo? Usa o player do próprio navegador (no iPhone é o mesmo
 * leitor do app Fotos e do menu de compartilhar). Toca mudo, sem precisar de toque do usuário.
 */
export function checkPlayback(blob: Blob, expectAudio = false, ms = 10_000): Promise<PlayResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.preload = "auto";
    Object.assign(v.style, { position: "fixed", left: "0", bottom: "0", width: "4px", height: "4px", opacity: "0.02", pointerEvents: "none" });
    document.body.appendChild(v);
    let done = false;
    const end = (r: PlayResult) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      v.pause();
      v.removeAttribute("src");
      v.load();
      v.remove();
      URL.revokeObjectURL(url);
      resolve(r);
    };
    const timer = setTimeout(() => end(v.readyState >= 1 && v.videoWidth > 0 ? "ok" : "sem-resposta"), ms);
    const okIfPlaying = () => {
      if (!(v.videoWidth > 0 && v.duration > 0)) return;
      // Safari informa as faixas de áudio: arquivo sem áudio legível não serve
      const tracks = (v as HTMLVideoElement & { audioTracks?: { length: number } }).audioTracks;
      if (expectAudio && tracks && tracks.length === 0) return end("ruim");
      end("ok");
    };
    v.onerror = () => end("ruim");
    v.onloadeddata = okIfPlaying;
    v.ontimeupdate = () => v.currentTime > 0 && okIfPlaying();
    v.src = url;
    v.load();
    v.play().catch((e) => {
      if (e instanceof DOMException && e.name === "NotSupportedError") end("ruim");
    });
  });
}

/** Grava um vídeo curto de teste no formato candidato. */
async function sample(plan: Plan): Promise<Blob | null> {
  const W = 320;
  const H = 568;
  const videoCodec = await getFirstEncodableVideoCodec(["avc"], { width: W, height: H, bitrate: 800_000 });
  if (!videoCodec) return null;
  if (plan.audio === "aac" || plan.audio === "opus") {
    if (typeof AudioEncoder === "undefined" || !(await getFirstEncodableAudioCodec([plan.audio], { numberOfChannels: 2, sampleRate: 48000 }))) return null;
  }
  setAacFix(plan.aacFix);
  const canvas = Object.assign(document.createElement("canvas"), { width: W, height: H });
  const ctx = canvas.getContext("2d")!;
  const target = new BufferTarget();
  const output = new Output({ format: plan.container === "mov" ? new MovOutputFormat({ fastStart: "reserve" }) : new Mp4OutputFormat({ fastStart: "reserve" }), target });
  const vs = new CanvasSource(canvas, { codec: videoCodec, bitrate: 800_000, keyFrameInterval: 1 });
  output.addVideoTrack(vs, { frameRate: 30, maximumPacketCount: 120 });
  let as: AudioBufferSource | null = null;
  if (plan.audio) {
    as = new AudioBufferSource({ codec: plan.audio, bitrate: 128_000 });
    output.addAudioTrack(as, { maximumPacketCount: 600 });
  }
  await output.start();
  if (as) {
    const len = 48000 * 1.5;
    const ab = new AudioBuffer({ length: len, numberOfChannels: 2, sampleRate: 48000 });
    const tone = new Float32Array(len).map((_, i) => 0.2 * Math.sin((2 * Math.PI * 440 * i) / 48000));
    ab.copyToChannel(tone, 0);
    ab.copyToChannel(tone, 1);
    await as.add(ab);
    as.close();
  }
  for (let f = 0; f < 45; f++) {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#e11d48";
    ctx.fillRect((f * 6) % W, H / 2 - 30, 60, 60);
    await vs.add(f / 30, 1 / 30);
  }
  vs.close();
  await output.finalize();
  return new Blob([target.buffer!], { type: plan.container === "mov" ? "video/quicktime" : "video/mp4" });
}

const KEY = "gca:plan";

interface Stored {
  ua: string;
  id: string;
  results: Record<string, string>;
}

export function storedPlanInfo(): Stored | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Stored | null;
    return s && s.ua === navigator.userAgent ? s : null;
  } catch {
    return null;
  }
}

export function forgetPlan() {
  localStorage.removeItem(KEY);
}

/** Marca um formato como ruim (o arquivo final não abriu) para a próxima escolha pular ele. */
export function markPlanBad(id: string) {
  const s = storedPlanInfo() ?? { ua: navigator.userAgent, id: "", results: {} };
  s.results[id] = "ruim (arquivo final)";
  s.id = "";
  localStorage.setItem(KEY, JSON.stringify(s));
}

/**
 * Formato de exportação para este aparelho. Fora do motor do Safari: null (MP4 automático).
 * No Safari: testa os candidatos uma vez e guarda o resultado.
 */
export async function devicePlan(onStatus?: (msg: string) => void): Promise<Plan | null> {
  if (!isWebKitEngine()) return null;
  installAacFix();
  const st = storedPlanInfo();
  const known = st?.id ? CANDIDATES.find((c) => c.id === st.id) : undefined;
  if (known) {
    setAacFix(known.aacFix);
    return known;
  }
  const results: Record<string, string> = { ...(st?.results ?? {}) };
  let chosen: Plan | null = null;
  let fallback: Plan | null = null;
  for (const c of CANDIDATES) {
    if (results[c.id]?.startsWith("ruim")) continue;
    onStatus?.(`Testando qual formato este aparelho abre: ${c.label}…`);
    try {
      const b = await sample(c);
      if (!b) {
        results[c.id] = "não suportado";
        continue;
      }
      const r = await checkPlayback(b, !!c.audio);
      results[c.id] = r;
      if (r === "ok") {
        chosen = c;
        break;
      }
      if (r === "sem-resposta" && !fallback) fallback = c;
    } catch (e) {
      logError(`teste de formato ${c.id}`, e);
      results[c.id] = `erro: ${e instanceof Error ? e.message : e}`;
    }
  }
  const plan = chosen ?? fallback ?? CANDIDATES[CANDIDATES.length - 1];
  localStorage.setItem(KEY, JSON.stringify({ ua: navigator.userAgent, id: plan.id, results }));
  setAacFix(plan.aacFix);
  return plan;
}

/** Próximo formato a tentar depois que o arquivo final não abriu. */
export async function nextPlan(failed: Plan, onStatus?: (msg: string) => void): Promise<Plan | null> {
  markPlanBad(failed.id);
  const p = await devicePlan(onStatus);
  return p && p.id !== failed.id ? p : null;
}
