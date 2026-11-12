// Peças de interface reutilizáveis.

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
export const money = (n: number) => `${n < 0 ? "−" : ""}${Math.abs(Math.round(n)).toLocaleString("pt-BR")}`;
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const one = (n: number) => (Math.round(n * 10) / 10).toLocaleString("pt-BR");

export function Stat({ icon, label, value, sub, tone }: { icon?: ReactNode; label: string; value: ReactNode; sub?: ReactNode; tone?: "pos" | "neg" }) {
  return (
    <div className="stat">
      <div className="label">
        {icon}
        {label}
      </div>
      <div className={`value ${tone ?? ""}`}>{value}</div>
      {sub !== undefined && <div className="sub">{sub}</div>}
    </div>
  );
}

export function Bar({ value, max = 100, tone }: { value: number; max?: number; tone?: "red" | "green" | "blue" }) {
  const w = Math.max(0, Math.min(100, (value / Math.max(1e-9, max)) * 100));
  return (
    <div className={`bar ${tone ?? ""}`}>
      <i style={{ width: `${w}%` }} />
    </div>
  );
}

export function Card({ title, icon, right, children, className = "" }: { title?: ReactNode; icon?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || right) && (
        <div className="card-head">
          <h3>
            {icon}
            {title}
          </h3>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Modal({ title, onClose, children, wide, closable = true }: { title: ReactNode; onClose?: () => void; children: ReactNode; wide?: boolean; closable?: boolean }) {
  useEffect(() => {
    if (!closable || !onClose) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [closable, onClose]);
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && closable && onClose?.()} role="dialog" aria-modal="true">
      <div className={`modal ${wide ? "wide" : ""}`}>
        <div className="modal-head">
          <h2>{title}</h2>
          {closable && onClose && (
            <button className="btn ghost sm" onClick={onClose} aria-label="Fechar">
              <X size={16} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.id} className={o.id === value ? "on" : ""} onClick={() => onChange(o.id)} role="tab" aria-selected={o.id === value}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Head({ title, text, right }: { title: ReactNode; text?: ReactNode; right?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {right}
    </div>
  );
}

export function Delta({ v, suffix = "" }: { v: number; suffix?: string }) {
  if (!v) return <span className="faint">±0{suffix}</span>;
  return (
    <span className={v > 0 ? "pos" : "neg"}>
      {v > 0 ? "+" : "−"}
      {Math.abs(Math.round(v * 10) / 10).toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

/** Gráfico de linhas simples em SVG (várias séries). */
export function LineChart({ series, height = 160, labels }: { series: { name: string; color: string; values: number[] }[]; height?: number; labels?: string[] }) {
  const W = 600;
  const H = height;
  const pad = { l: 44, r: 10, t: 10, b: 22 };
  const n = Math.max(...series.map((x) => x.values.length), 2);
  const all = series.flatMap((x) => x.values);
  const max = Math.max(1, ...all);
  const min = Math.min(0, ...all);
  const x = (i: number) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min || 1)) * (H - pad.t - pad.b);
  const ticks = [min, (min + max) / 2, max];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={series.map((x) => x.name).join(", ")}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#4a3c2d" strokeDasharray="3 4" />
            <text x={pad.l - 6} y={y(t) + 4} fill="#7d705d" fontSize="11" textAnchor="end">
              {Math.abs(t) >= 10000 ? `${Math.round(t / 1000)}k` : Math.round(t)}
            </text>
          </g>
        ))}
        {series.map((sr) =>
          sr.values.length > 1 ? (
            <polyline key={sr.name} fill="none" stroke={sr.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" points={sr.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
          ) : null,
        )}
        {labels && labels.length > 1 && (
          <>
            <text x={pad.l} y={H - 4} fill="#7d705d" fontSize="11">
              {labels[0]}
            </text>
            <text x={W - pad.r} y={H - 4} fill="#7d705d" fontSize="11" textAnchor="end">
              {labels[labels.length - 1]}
            </text>
          </>
        )}
      </svg>
      <div className="row wrap small" style={{ gap: 14, marginTop: 4 }}>
        {series.map((sr) => (
          <span key={sr.name} className="row" style={{ gap: 6 }}>
            <i style={{ width: 12, height: 3, background: sr.color, borderRadius: 2, display: "inline-block" }} />
            <span className="muted">{sr.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Barras horizontais (distribuição). */
export function HBars({ items }: { items: { label: string; value: number; color?: string; note?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="col" style={{ gap: 6 }}>
      {items.map((i) => (
        <div key={i.label} className="small">
          <div className="row between">
            <span>{i.label}</span>
            <span className="muted num">{i.note ?? fmt(i.value)}</span>
          </div>
          <div className="bar">
            <i style={{ width: `${(i.value / max) * 100}%`, background: i.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="item center muted small">{children}</div>;
}
