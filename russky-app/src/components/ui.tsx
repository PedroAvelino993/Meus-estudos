import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect x="2" y="2" width="44" height="44" rx="14" fill="var(--red)" />
      <path d="M17 36V12h9.5c5.2 0 8.5 3 8.5 7.6S31.7 27.2 26.5 27.2H21.6V36H17zm4.6-12.6h4.6c2.6 0 4.2-1.4 4.2-3.8s-1.6-3.8-4.2-3.8h-4.6v7.6z" fill="#fff" />
      <circle cx="35.5" cy="34.5" r="3.5" fill="var(--gold)" />
    </svg>
  );
}

export function Bar({ value, tone, thin, label }: { value: number; tone?: "green" | "gold" | "blue" | "violet" | "teal"; thin?: boolean; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`bar ${tone ?? ""} ${thin ? "thin" : ""}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({ value, size = 96, stroke = 10, color = "var(--red)", label, sub, ink = "var(--text)", subInk = "var(--muted)", track = "var(--bg-2)" }: { value: number; size?: number; stroke?: number; color?: string; label?: ReactNode; sub?: string; ink?: string; subInk?: string; track?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(v * 100)}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 900ms var(--ease)" }}
      />
      <text x="50%" y={sub ? "47%" : "52%"} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.22} fill={ink}>
        {label ?? `${Math.round(v * 100)}%`}
      </text>
      {sub && (
        <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.11} fill={subInk}>
          {sub}
        </text>
      )}
    </svg>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />;
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, children, onClose, footer }: { title: ReactNode; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        {children}
        {footer && <div className="row" style={{ marginTop: 18, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      {icon}
      <h3 style={{ color: "var(--text)" }}>{title}</h3>
      {children && <div className="small" style={{ marginTop: 6 }}>{children}</div>}
    </div>
  );
}

// ---------- Toasts ----------

export type Toast = { id: number; title: string; body?: string; icon?: ReactNode; tone?: "gold" | "red" | "green" | "blue" };
let tid = 1;
let list: Toast[] = [];
const subs = new Set<(t: Toast[]) => void>();

export function toast(t: Omit<Toast, "id">) {
  const item = { ...t, id: tid++ };
  list = [...list, item].slice(-3);
  subs.forEach((s) => s(list));
  setTimeout(() => {
    list = list.filter((x) => x.id !== item.id);
    subs.forEach((s) => s(list));
  }, 3800);
}

export function Toasts() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    subs.add(setItems);
    return () => {
      subs.delete(setItems);
    };
  }, []);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast">
          {t.icon && (
            <div className="stat-icon" style={{ background: `var(--${t.tone ?? "gold"}-soft)`, color: `var(--${t.tone ?? "gold"})` }}>
              {t.icon}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 800 }}>{t.title}</div>
            {t.body && <div className="small muted">{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Confete (respeita movimento reduzido) ----------

export function reducedMotion(): boolean {
  const attr = document.documentElement.dataset.motion;
  if (attr === "reduce") return true;
  if (attr === "full") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function Confetti({ count = 60 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 1.6 + Math.random() * 1.4,
      dx: `${(Math.random() - 0.5) * 200}px`,
      rot: `${Math.random() * 900 - 450}deg`,
      color: ["var(--red)", "var(--gold)", "var(--blue)", "var(--green)", "var(--violet)"][i % 5],
    })),
  );
  if (reducedMotion()) return null;
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i
          key={i}
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              animationDuration: `${p.dur}s`,
              animationDelay: `${p.delay}s`,
              "--dx": p.dx,
              "--rot": p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
