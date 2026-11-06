// Peças de interface compartilhadas: ícones, modal, barras, valores e o contexto do jogo.

import { createContext, useContext, useEffect, type ReactNode } from "react";
import {
  BadgeCheck,
  BookOpen,
  Calendar,
  Coins,
  Crown,
  Ear,
  Eye,
  Flag,
  Handshake,
  Heart,
  Map as MapIcon,
  Search,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { GameState } from "./core/game";
import type { Look } from "./core/types";
import { CURRENCY } from "./content";
import type { Prefs } from "./store";

export const ACH_ICONS: Record<string, LucideIcon> = {
  handshake: Handshake,
  crown: Crown,
  star: Star,
  ear: Ear,
  eye: Eye,
  users: Users,
  heart: Heart,
  shield: Shield,
  alert: TriangleAlert,
  coins: Coins,
  trending: TrendingUp,
  map: MapIcon,
  calendar: Calendar,
  search: Search,
  sparkles: Sparkles,
  flag: Flag,
  trophy: Trophy,
  book: BookOpen,
  badge: BadgeCheck,
};

export type View = "home" | "map" | "district";

export interface Toast {
  id: number;
  text: string;
  tone?: "gold" | "green" | "red";
  icon?: LucideIcon;
  ms?: number;
}

export interface GameCtx {
  s: GameState;
  act: (f: (s: GameState) => GameState) => GameState;
  go: (v: View) => void;
  openPhone: (app?: string) => void;
  closePhone: () => void;
  toast: (t: Omit<Toast, "id">) => void;
  showCharacter: (id: string) => void;
  brief: (missionId: string) => void;
  prefs: Prefs;
  setPrefs: (p: Prefs) => void;
  slot: number;
  quit: () => void;
  replaceGame: (s: GameState) => void;
}

export const Ctx = createContext<GameCtx | null>(null);

export function useGame(): GameCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("Sem contexto de jogo");
  return c;
}

export function fmt(n: number): string {
  return `${CURRENCY} ${Math.round(n).toLocaleString("pt-BR")}`;
}

export function signed(n: number): string {
  return `${n >= 0 ? "+" : "−"}${CURRENCY} ${Math.abs(Math.round(n)).toLocaleString("pt-BR")}`;
}

export function Money({ n, sign }: { n: number; sign?: boolean }) {
  return <span className={`money ${sign ? (n >= 0 ? "green" : "red") : ""}`}>{sign ? signed(n) : fmt(n)}</span>;
}

export function Bar({ value, max = 100, tone, fuzzy, label }: { value: number; max?: number; tone?: "green" | "red" | "blue"; fuzzy?: boolean; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`bar ${tone ?? ""} ${fuzzy ? "fuzzy" : ""}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Difficulty({ n }: { n: number }) {
  return (
    <span className="diff" aria-label={`Dificuldade ${n} de 5`} title={`Dificuldade ${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= n ? "on" : ""} />
      ))}
    </span>
  );
}

export function Modal({ children, onClose, wide, label }: { children: ReactNode; onClose?: () => void; wide?: boolean; label: string }) {
  useEffect(() => {
    if (!onClose) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

export function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className="icon-btn" onClick={onClick} aria-label="Fechar">
      <X size={18} />
    </button>
  );
}

/** Aparências que o jogador pode escolher. */
export const PLAYER_LOOKS: Look[] = [
  { skin: "#E0B08C", hair: "#3A2618", hairStyle: "short", outfit: "jacket", outfitColor: "#2F3A4A", accent: "#E9E1D2", age: 28 },
  { skin: "#8D5A3B", hair: "#141010", hairStyle: "curly", outfit: "shirt", outfitColor: "#2E4D3E", accent: "#F1ECE2", age: 27, extra: "earrings" },
  { skin: "#F1C9A8", hair: "#B5652E", hairStyle: "long", outfit: "blouse", outfitColor: "#5A3448", accent: "#C9A44C", age: 26 },
  { skin: "#5E3B27", hair: "#0F0B09", hairStyle: "buzz", outfit: "tee", outfitColor: "#3D3326", accent: "#C9A44C", age: 30, beard: "stubble" },
  { skin: "#C98E6B", hair: "#20140D", hairStyle: "bob", outfit: "cardigan", outfitColor: "#3A4560", accent: "#E8DFC9", age: 29, glasses: true },
  { skin: "#D9A47C", hair: "#2B1A10", hairStyle: "slick", outfit: "suit", outfitColor: "#22262E", accent: "#F2EEE6", age: 31, extra: "tie" },
];

export const SENDERS: Record<string, { name: string; color: string; initials: string }> = {
  sistema: { name: "Vila Áurea", color: "#C9A44C", initials: "VA" },
  noticias: { name: "O Relógio — notícias", color: "#B5655B", initials: "OR" },
  seguranca: { name: "Central de Segurança", color: "#3FA7A0", initials: "CS" },
  policia: { name: "Radar da polícia", color: "#E0705F", initials: "RP" },
  lobo: { name: "Lobo (agiota)", color: "#6B7585", initials: "LB" },
  zenite: { name: "Z.", color: "#8C6D26", initials: "Z" },
};

// ---------- Efeitos sonoros simples (gerados, sem arquivos) ----------

let audio: AudioContext | null = null;
export function sfx(kind: "tap" | "good" | "bad" | "coin" | "level" | "msg", on: boolean) {
  if (!on) return;
  try {
    audio ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const notes: Record<string, [number, number][]> = {
      tap: [[520, 0.04]],
      good: [
        [523, 0.08],
        [784, 0.12],
      ],
      bad: [
        [330, 0.1],
        [247, 0.16],
      ],
      coin: [
        [988, 0.06],
        [1319, 0.14],
      ],
      level: [
        [523, 0.08],
        [659, 0.08],
        [784, 0.08],
        [1047, 0.2],
      ],
      msg: [
        [880, 0.05],
        [1175, 0.08],
      ],
    };
    let t = audio.currentTime;
    for (const [f, d] of notes[kind]) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = kind === "bad" ? "triangle" : "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(audio.destination);
      o.start(t);
      o.stop(t + d + 0.02);
      t += d * 0.8;
    }
  } catch {
    /* sem áudio */
  }
}
