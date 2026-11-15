// Componentes de interface reutilizáveis.

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { db } from "../media/db";

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

export function Stat({ icon, label, value, sub }: { icon?: ReactNode; label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="stat">
      <div className="label">
        {icon}
        {label}
      </div>
      <div className="value">{value}</div>
      {sub !== undefined && <div className="sub">{sub}</div>}
    </div>
  );
}

export function Bar({ value, tone, anim }: { value: number; tone?: "green"; anim?: boolean }) {
  return (
    <div className={`bar ${tone ?? ""} ${anim ? "anim" : ""}`}>
      <i style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
    </div>
  );
}

export function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={String(o.id)} className={o.id === value ? "on" : ""} onClick={() => onChange(o.id)} role="tab" aria-selected={o.id === value}>
          {o.label}
        </button>
      ))}
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
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div className="modal">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2>{title}</h2>
          <button className="btn ghost sm" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const thumbCache = new Map<string, { t: number; url: string }[]>();

/** Miniaturas da análise (guardadas no aparelho). */
export function useThumbs(projectId: string | null | undefined) {
  const [thumbs, setThumbs] = useState<{ t: number; url: string }[]>(() => (projectId ? thumbCache.get(projectId) ?? [] : []));
  useEffect(() => {
    if (!projectId) return;
    if (thumbCache.has(projectId)) {
      setThumbs(thumbCache.get(projectId)!);
      return;
    }
    let alive = true;
    db.getThumbs(projectId).then((list) => {
      if (!alive || !list) return;
      const urls = list.map((x) => ({ t: x.t, url: URL.createObjectURL(x.blob) }));
      thumbCache.set(projectId, urls);
      setThumbs(urls);
    });
    return () => {
      alive = false;
    };
  }, [projectId]);
  return thumbs;
}

export function invalidateThumbs(projectId: string) {
  thumbCache.delete(projectId);
}

export function thumbAt(thumbs: { t: number; url: string }[], t: number): string | undefined {
  if (!thumbs.length) return undefined;
  let best = thumbs[0];
  for (const x of thumbs) if (Math.abs(x.t - t) < Math.abs(best.t - t)) best = x;
  return best.url;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="item muted small" style={{ textAlign: "center", padding: 22 }}>{children}</div>;
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? "#ef233c" : score >= 50 ? "#f59e0b" : score >= 25 ? "#a1a1ad" : "#52525b";
  return (
    <span className="score" style={{ color }}>
      {score}
    </span>
  );
}
