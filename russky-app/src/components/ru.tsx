// Texto russo: acento tônico destacado, transliteração opcional, áudio e toque para traduzir.

import { Fragment, useEffect, useState } from "react";
import { Snail, Volume2, VolumeX } from "lucide-react";
import { hasRussianVoice, onVoices, speak, type Speed } from "../audio/speech";
import { lex, lookup } from "../content";
import { transliterate, tokensOf } from "../core/text";
import { useStudent } from "../store";
import { unitComplete } from "../core/progress";

/** Mostra а́ com a vogal tônica destacada (sublinhado vermelho), em vez do acento solto. */
export function Stressed({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    if (chars[i + 1] === "́") {
      parts.push(
        <span key={i} className="stress">
          {chars[i]}
        </span>,
      );
      i++;
    } else parts.push(chars[i]);
  }
  return <>{parts}</>;
}

export function Ru({ text, className = "", as = "span" }: { text: string; className?: string; as?: "span" | "div" | "p" }) {
  const Tag = as;
  return (
    <Tag className={`ru ru-text ${className}`} lang="ru">
      <Stressed text={text} />
    </Tag>
  );
}

/**
 * A transliteração aparece enquanto o alfabeto não foi concluído (modo automático),
 * ou sempre/nunca conforme a preferência.
 */
export function useShowTranslit(): boolean {
  const s = useStudent();
  if (s.settings.translit === "always") return true;
  if (s.settings.translit === "never") return false;
  return !unitComplete(s, "u1-6");
}

export function Translit({ ru, tr }: { ru: string; tr?: string }) {
  const show = useShowTranslit();
  if (!show) return null;
  return <div className="translit">{tr ? `«${tr}»` : `«${transliterate(ru)}»`}</div>;
}

/** Pronúncia aproximada de uma palavra do dicionário (ou transliteração automática). */
export function trOf(ru: string): string {
  const hit = lookup(ru)[0];
  return hit && !hit.note ? hit.entry.tr ?? transliterate(ru) : transliterate(ru);
}

export function useVoice(): boolean {
  const [ok, setOk] = useState(hasRussianVoice());
  useEffect(() => onVoices(() => setOk(hasRussianVoice())), []);
  return ok;
}

export function AudioButton({ text, big, slow = true, auto, label = "Ouvir", pitch, rate, female }: { text: string; big?: boolean; slow?: boolean; auto?: boolean; label?: string; pitch?: number; rate?: number; female?: boolean }) {
  const voice = useVoice();
  const [playing, setPlaying] = useState<Speed | null>(null);
  const play = async (speed: Speed) => {
    setPlaying(speed);
    await speak(text, { speed, pitch, rate, female });
    setPlaying(null);
  };
  useEffect(() => {
    if (auto && voice) void play("normal");
    // tocar automaticamente só quando o texto muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, auto, voice]);
  if (!voice) {
    return (
      <span className="chip" title="Nenhuma voz russa instalada neste aparelho. Veja Configurações → Áudio.">
        <VolumeX size={14} /> sem voz russa
      </span>
    );
  }
  return (
    <span className="audio-row">
      <button type="button" className={`audio-btn ${big ? "big" : ""} ${playing === "normal" ? "playing" : ""}`} onClick={() => play("normal")} aria-label={label}>
        <Volume2 size={big ? 40 : 22} />
      </button>
      {slow && (
        <button type="button" className={`audio-btn slow ${playing === "slow" ? "playing" : ""}`} onClick={() => play("slow")} aria-label={`${label} devagar`} title="Devagar">
          <Snail size={18} />
        </button>
      )}
    </span>
  );
}

/** Frase com áudio inteiro e palavra por palavra. */
export function WordByWord({ text }: { text: string }) {
  const voice = useVoice();
  if (!voice) return null;
  return (
    <div className="word-chips" aria-label="Ouvir palavra por palavra">
      {tokensOf(text).map((w, i) => (
        <button key={i} type="button" className="word-chip" onClick={() => speak(w, { speed: "slow" })}>
          <Stressed text={w} />
        </button>
      ))}
    </div>
  );
}

// ---------- Toque para traduzir ----------

export function WordInfo({ word, onClose }: { word: string; onClose: () => void }) {
  const hits = lookup(word);
  const show = useShowTranslit();
  return (
    <div className="popover" role="dialog" aria-label={`Tradução de ${word}`}>
      <div className="row between">
        <div className="row">
          <Ru text={hits[0]?.note ? word : hits[0]?.entry.ru ?? word} className="teach-word" />
        </div>
        <div className="row">
          <AudioButton text={word} />
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
      </div>
      {hits.length === 0 && <p className="muted">Palavra fora do dicionário do app.</p>}
      {hits.slice(0, 2).map((h, i) => (
        <div key={i} style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{h.entry.pt}</div>
          {h.entry.alt?.length ? <div className="small muted">também: {h.entry.alt.join(", ")}</div> : null}
          {show && h.entry.tr && !h.note && <div className="translit">«{h.entry.tr}»</div>}
          {h.note && (
            <div className="notice warn" style={{ marginTop: 8 }}>
              <div>
                Forma de dicionário: <Ru text={h.entry.ru} /> — {h.note}
              </div>
            </div>
          )}
          {!h.note && h.entry.note && <p className="small muted" style={{ margin: "6px 0 0" }}>{h.entry.note}</p>}
          {h.entry.gender && <span className="chip" style={{ marginTop: 6 }}>{{ m: "masculino", f: "feminino", n: "neutro" }[h.entry.gender]}</span>}
        </div>
      ))}
    </div>
  );
}

/** Texto em russo em que cada palavra pode ser tocada para ver tradução e forma básica. */
export function TapText({ text, onWord }: { text: string; onWord?: (w: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const tokens = text.split(/(\s+|[«»"„“.,!?:;—]+)/);
  return (
    <>
      {tokens.map((t, i) =>
        /[Ѐ-ӿ]/.test(t) ? (
          <button
            key={i}
            type="button"
            className={`tap-word ${open === `${i}` ? "on" : ""}`}
            onClick={() => {
              setOpen(`${i}:${t}`);
              onWord?.(t);
            }}
          >
            <Stressed text={t} />
          </button>
        ) : (
          <Fragment key={i}>{t}</Fragment>
        ),
      )}
      {open && <WordInfo word={open.split(":").slice(1).join(":")} onClose={() => setOpen(null)} />}
    </>
  );
}

export function genderLabel(id: string): string | null {
  const e = lex(id);
  return e.gender ? { m: "masc.", f: "fem.", n: "neutro" }[e.gender] : null;
}
