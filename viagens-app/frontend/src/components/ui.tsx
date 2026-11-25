// Peças básicas da interface: avisos, etiquetas, contador, janela, carregando, vazio e avisos rápidos.

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";

export function Notice({ kind = "info", children }: { kind?: "info" | "warn" | "bad" | "good"; children: ReactNode }) {
  const Icon = kind === "bad" ? XCircle : kind === "warn" ? AlertTriangle : kind === "good" ? CheckCircle2 : Info;
  return (
    <div className={`notice ${kind}`} role={kind === "bad" ? "alert" : "status"}>
      <Icon size={18} />
      <div className="grow">{children}</div>
    </div>
  );
}

export function Tag({ kind, children, title }: { kind?: "good" | "warn" | "bad" | "brand"; children: ReactNode; title?: string }) {
  return (
    <span className={`tag ${kind ?? ""}`} title={title}>
      {children}
    </span>
  );
}

export function Loading({ text }: { text: string }) {
  return (
    <div className="row muted" style={{ padding: "14px 2px" }}>
      <Loader2 size={18} className="spin" /> {text}
    </div>
  );
}

export function Skeleton({ height = 120, count = 3 }: { height?: number; count?: number }) {
  return (
    <div className="stack">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Counter({ label, hint, value, min, max, onChange }: { label: string; hint?: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="counter">
      <div>
        <div className="bold">{label}</div>
        {hint && <div className="tiny muted">{hint}</div>}
      </div>
      <div className="ctl">
        <button type="button" aria-label={`Menos ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <span className="num bold" style={{ minWidth: 16, textAlign: "center" }}>
          {value}
        </span>
        <button type="button" aria-label={`Mais ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="modal-back" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div className="modal">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2>{title}</h2>
          <button className="btn ghost sm" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={o.id === value} className={o.id === value ? "on" : ""} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Avisos rápidos ----------
type ToastFn = (text: string) => void;
let push: ToastFn = () => undefined;
export const toast: ToastFn = (t) => push(t);

export function Toasts() {
  const [list, setList] = useState<{ id: number; text: string; until: number }[]>([]);
  useEffect(() => {
    // Remove os vencidos também ao voltar para a aba (o navegador segura os timers em abas escondidas)
    const prune = () => setList((l) => l.filter((x) => x.until > Date.now()));
    push = (text) => {
      const id = Date.now() + Math.random();
      setList((l) => [...l.filter((x) => x.until > Date.now()), { id, text, until: Date.now() + 3600 }].slice(-3));
      setTimeout(prune, 3700);
    };
    document.addEventListener("visibilitychange", prune);
    window.addEventListener("focus", prune);
    return () => {
      document.removeEventListener("visibilitychange", prune);
      window.removeEventListener("focus", prune);
    };
  }, []);
  return (
    <div className="toast-wrap" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}
