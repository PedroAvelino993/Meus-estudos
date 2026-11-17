// Leitura das informações do vídeo e verificação de suporte do navegador.

import { ALL_FORMATS, BlobSource, Input, canEncodeVideo, getFirstEncodableAudioCodec, getFirstEncodableVideoCodec } from "mediabunny";
import type { SourceInfo } from "../core/types";

export function openInput(file: Blob) {
  return new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
}

export async function probe(file: File): Promise<SourceInfo> {
  const input = openInput(file);
  try {
    const format = await input.getFormat();
    const video = await input.getPrimaryVideoTrack();
    if (!video) throw new Error("Este arquivo não tem uma faixa de vídeo.");
    if (!(await video.canDecode())) throw new Error(`O navegador não consegue decodificar o vídeo (${video.codec ?? "codec desconhecido"}). Tente o Chrome/Edge atualizado ou converta para MP4 (H.264).`);
    const audio = await input.getPrimaryAudioTrack();
    const duration = await input.computeDuration();
    const stats = await video.computePacketStats(120);
    const codecString = (await video.getCodecParameterString().catch(() => null)) ?? undefined;
    const hdr = await video.hasHighDynamicRange().catch(() => false);
    return {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      duration,
      width: video.displayWidth,
      height: video.displayHeight,
      fps: Math.round(stats.averagePacketRate || 30),
      videoCodec: video.codec ?? "?",
      // Faixa de áudio presente (mesmo que o decodificador do navegador não leia: há o nativo)
      audioCodec: audio ? (audio.codec ?? "áudio") : null,
      container: format.name,
      codecString,
      hdr,
      bitDepth: bitDepthOf(codecString),
      stored: false,
    };
  } finally {
    input.dispose?.();
  }
}

export interface Capabilities {
  webcodecs: boolean;
  videoCodec: string | null;
  audioCodec: string | null;
  h264_1080: boolean;
  webgpu: boolean;
  offscreen: boolean;
}

let caps: Promise<Capabilities> | null = null;

/** O que este navegador consegue fazer (exportar MP4 H.264, usar a GPU para a IA…). */
export function capabilities(): Promise<Capabilities> {
  if (caps) return caps;
  caps = (async () => {
    const webcodecs = typeof VideoEncoder !== "undefined" && typeof VideoDecoder !== "undefined";
    let videoCodec: string | null = null;
    let audioCodec: string | null = null;
    let h264 = false;
    if (webcodecs) {
      try {
        h264 = await canEncodeVideo("avc", { width: 1080, height: 1920 });
        videoCodec = await getFirstEncodableVideoCodec(["avc", "vp9", "av1"], { width: 1080, height: 1920 });
        audioCodec = typeof AudioEncoder !== "undefined" ? await getFirstEncodableAudioCodec(["aac", "opus"], { numberOfChannels: 2, sampleRate: 48000 }) : null;
      } catch {
        /* sem suporte */
      }
    }
    const webgpu = typeof navigator !== "undefined" && "gpu" in navigator && !!(await (navigator as unknown as { gpu: { requestAdapter: () => Promise<unknown> } }).gpu.requestAdapter().catch(() => null));
    return { webcodecs, videoCodec, audioCodec, h264_1080: h264, webgpu, offscreen: typeof OffscreenCanvas !== "undefined" };
  })();
  return caps;
}

/** Bits por cor a partir do codec (10 bits costuma ser HDR de console/celular, difícil de decodificar no celular). */
export function bitDepthOf(codec?: string): number | undefined {
  if (!codec) return undefined;
  const p = codec.split(".");
  if (p[0] === "vp09" && p[3]) return Number(p[3]) || undefined;
  if (p[0] === "av01" && p[3]) return Number(p[3]) || undefined;
  if ((p[0] === "hvc1" || p[0] === "hev1") && p[1]) return p[1].replace(/\D/g, "") === "2" ? 10 : 8;
  if (p[0] === "avc1" && p[1]) return parseInt(p[1].slice(0, 2), 16) === 110 ? 10 : 8;
  return undefined;
}

const CODEC_NAME: Record<string, string> = { avc: "H.264", hevc: "HEVC/H.265", vp9: "VP9", av1: "AV1", vp8: "VP8" };

/** Descrição curta do vídeo para mensagens (ex.: «VP9 10 bits HDR · 3840×2160 · 60 FPS»). */
export function describeSource(i: Pick<SourceInfo, "videoCodec" | "width" | "height" | "fps"> & Partial<SourceInfo>): string {
  const parts = [CODEC_NAME[i.videoCodec] ?? i.videoCodec.toUpperCase()];
  if (i.bitDepth && i.bitDepth > 8) parts.push(`${i.bitDepth} bits`);
  if (i.hdr) parts.push("HDR");
  return `${parts.join(" ")} · ${i.width}×${i.height} · ${i.fps} FPS`;
}

/** Vídeos que celulares costumam não conseguir decodificar bem. */
export function heavyForPhone(i: Partial<SourceInfo>): string[] {
  const r: string[] = [];
  if (i.hdr || (i.bitDepth ?? 8) > 8) r.push("HDR/10 bits");
  if ((i.width ?? 0) * (i.height ?? 0) > 2560 * 1440) r.push("resolução acima de 1440p");
  if (i.videoCodec === "hevc") r.push("HEVC/H.265");
  return r;
}
