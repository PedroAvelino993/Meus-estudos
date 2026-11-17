// Correção para o codificador de áudio AAC do Safari (iPhone/iPad/Mac).
//
// O AudioEncoder do WebKit entrega uma configuração do decodificador («description») incorreta
// para AAC, e em alguns casos os pacotes vêm com cabeçalho ADTS. O MP4 resultante não toca no
// iPhone: o Fotos não aceita, o Quick Look mostra só um ícone e o menu de compartilhar fica girando.
// Aqui a configuração é montada do jeito certo (AudioSpecificConfig do AAC-LC) e o ADTS é removido.

const RATES = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];

/** AudioSpecificConfig (2 bytes) do AAC-LC para a taxa e os canais dados. */
export function aacLcAsc(sampleRate: number, channels: number): Uint8Array {
  const idx = RATES.indexOf(sampleRate);
  if (idx < 0) throw new Error(`Taxa de amostragem sem índice AAC: ${sampleRate}`);
  // 5 bits tipo do objeto (2 = LC) | 4 bits índice da taxa | 4 bits canais | 3 bits zerados
  const v = (2 << 11) | (idx << 7) | ((channels & 0xf) << 3);
  return new Uint8Array([v >> 8, v & 0xff]);
}

/** Remove o cabeçalho ADTS de um quadro AAC, se houver. */
export function stripAdts(d: Uint8Array): Uint8Array {
  if (d.length > 7 && d[0] === 0xff && (d[1] & 0xf6) === 0xf0) {
    const header = d[1] & 1 ? 7 : 9; // sem CRC: 7 bytes; com CRC: 9
    const frameLen = ((d[3] & 0x03) << 11) | (d[4] << 3) | (d[5] >> 5);
    if (frameLen > header && frameLen <= d.length) return d.subarray(header, frameLen);
  }
  return d;
}

/** Navegadores com o motor do Safari (todo navegador do iPhone usa esse motor). */
export function isWebKitEngine(): boolean {
  if (typeof navigator === "undefined") return false;
  // Só para testes automáticos: simula o motor do Safari
  if (typeof localStorage !== "undefined" && localStorage.getItem("gca:forceWebkit") === "1") return true;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return true;
  return /AppleWebKit/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Android/i.test(ua);
}

let installed = false;
let enabled = true;

/** Liga/desliga a correção (o teste de compatibilidade experimenta com e sem). */
export function setAacFix(on: boolean) {
  enabled = on;
}

/** Troca o AudioEncoder global por uma versão que corrige a saída AAC (só no motor do Safari). */
export function installAacFix(force = false) {
  if (installed || typeof AudioEncoder === "undefined" || (!force && !isWebKitEngine())) return;
  installed = true;
  const Original = AudioEncoder;
  class FixedAudioEncoder extends Original {
    private fix: { cfg: AudioEncoderConfig | null };
    constructor(init: AudioEncoderInit) {
      const state: { cfg: AudioEncoderConfig | null } = { cfg: null };
      super({
        error: init.error,
        output: (chunk, meta) => {
          const cfg = state.cfg;
          if (!enabled || !cfg || !cfg.codec.startsWith("mp4a")) return init.output(chunk, meta);
          const raw = new Uint8Array(chunk.byteLength);
          chunk.copyTo(raw);
          const data = stripAdts(raw);
          const fixed = data === raw ? chunk : new EncodedAudioChunk({ type: chunk.type, timestamp: chunk.timestamp, duration: chunk.duration ?? undefined, data });
          let m = meta;
          if (meta?.decoderConfig) {
            m = { ...meta, decoderConfig: { ...meta.decoderConfig, codec: "mp4a.40.2", sampleRate: cfg.sampleRate, numberOfChannels: cfg.numberOfChannels, description: aacLcAsc(cfg.sampleRate, cfg.numberOfChannels) } };
          }
          init.output(fixed, m);
        },
      });
      this.fix = state;
    }
    configure(config: AudioEncoderConfig) {
      this.fix.cfg = config;
      super.configure(config);
    }
  }
  (globalThis as unknown as { AudioEncoder: typeof AudioEncoder }).AudioEncoder = FixedAudioEncoder;
}
