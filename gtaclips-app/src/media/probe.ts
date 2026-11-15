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
    return {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      duration,
      width: video.displayWidth,
      height: video.displayHeight,
      fps: Math.round(stats.averagePacketRate || 30),
      videoCodec: video.codec ?? "?",
      audioCodec: audio && (await audio.canDecode()) ? audio.codec : null,
      container: format.name,
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
