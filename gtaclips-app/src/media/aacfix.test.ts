import { describe, expect, it } from "vitest";
import { aacLcAsc, stripAdts } from "./aacfix";

describe("correção do AAC do Safari", () => {
  it("monta o AudioSpecificConfig do AAC-LC", () => {
    expect([...aacLcAsc(48000, 2)]).toEqual([0x11, 0x90]);
    expect([...aacLcAsc(44100, 2)]).toEqual([0x12, 0x10]);
    expect([...aacLcAsc(48000, 1)]).toEqual([0x11, 0x88]);
  });
  it("remove o cabeçalho ADTS e mantém quadros sem ele", () => {
    const payload = [1, 2, 3, 4, 5];
    const len = 7 + payload.length;
    // ADTS sem CRC: FFF1, perfil LC, 48 kHz, 2 canais, tamanho do quadro
    const adts = new Uint8Array([0xff, 0xf1, 0x4c, 0x80 | ((len >> 11) & 3), (len >> 3) & 0xff, ((len & 7) << 5) | 0x1f, 0xfc, ...payload]);
    expect([...stripAdts(adts)]).toEqual(payload);
    const raw = new Uint8Array([0x21, 0x10, 5, 6]);
    expect(stripAdts(raw)).toBe(raw);
  });
});

describe("AudioEncoder corrigido", () => {
  it("troca a descrição e tira o ADTS dos pacotes AAC; não mexe no Opus", async () => {
    const out: { data: number[]; meta: unknown }[] = [];
    class FakeChunk {
      type: string;
      timestamp: number;
      duration?: number;
      byteLength: number;
      private d: Uint8Array;
      constructor(o: { type: string; timestamp: number; duration?: number; data: Uint8Array }) {
        this.type = o.type;
        this.timestamp = o.timestamp;
        this.duration = o.duration;
        this.d = new Uint8Array(o.data);
        this.byteLength = this.d.length;
      }
      copyTo(dst: Uint8Array) {
        dst.set(this.d);
      }
      bytes() {
        return [...this.d];
      }
    }
    class FakeEncoder {
      init: { output: (c: unknown, m?: unknown) => void };
      cfg: { codec: string } | null = null;
      constructor(init: { output: (c: unknown, m?: unknown) => void }) {
        this.init = init;
      }
      configure(c: { codec: string }) {
        this.cfg = c;
      }
      encode() {
        const payload = [9, 8, 7];
        const len = 7 + payload.length;
        const data = this.cfg!.codec.startsWith("mp4a") ? new Uint8Array([0xff, 0xf1, 0x4c, 0x80, (len >> 3) & 0xff, ((len & 7) << 5) | 0x1f, 0xfc, ...payload]) : new Uint8Array(payload);
        this.init.output(new FakeChunk({ type: "key", timestamp: 0, duration: 21333, data }), { decoderConfig: { codec: "mp4a.40.2", sampleRate: 48000, numberOfChannels: 2, description: new Uint8Array([0xde, 0xad]) } });
      }
    }
    const g = globalThis as unknown as Record<string, unknown>;
    g.AudioEncoder = FakeEncoder;
    g.EncodedAudioChunk = FakeChunk;
    const { installAacFix } = await import("./aacfix");
    installAacFix(true);
    const Enc = g.AudioEncoder as unknown as new (i: { output: (c: FakeChunk, m?: { decoderConfig?: { description?: Uint8Array } }) => void; error: () => void }) => FakeEncoder;
    for (const codec of ["mp4a.40.2", "opus"]) {
      const e = new Enc({ output: (c, m) => out.push({ data: c.bytes(), meta: m?.decoderConfig?.description ? [...m.decoderConfig.description] : null }), error: () => undefined });
      e.configure({ codec, sampleRate: 48000, numberOfChannels: 2 } as never);
      e.encode();
    }
    expect(out[0]).toEqual({ data: [9, 8, 7], meta: [0x11, 0x90] });
    expect(out[1]).toEqual({ data: [9, 8, 7], meta: [0xde, 0xad] });
  });
});
