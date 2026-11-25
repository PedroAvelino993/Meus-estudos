// Atalhos para a mesma busca nos sites dos fornecedores.

import { ExternalLink } from "lucide-react";

export function ProviderLinks({ links, title }: { links: { label: string; url: string; note?: string }[]; title: string }) {
  return (
    <div className="stack tight">
      <div className="small bold">{title}</div>
      <div className="row wrap">
        {links.map((l) => (
          <a key={l.label} className="btn" href={l.url} target="_blank" rel="noopener" title={l.note}>
            {l.label} <ExternalLink size={14} />
          </a>
        ))}
      </div>
    </div>
  );
}

export function ProviderStatusLine({ providers }: { providers: { label: string; ok: boolean; count: number; error?: string; notConfigured?: boolean }[] }) {
  return (
    <div className="row wrap tiny muted" style={{ gap: 12 }}>
      {providers.map((p) => (
        <span key={p.label} title={p.error}>
          {p.label}: {p.notConfigured ? "não configurado" : p.ok ? `${p.count} resultado(s)` : `falhou (${p.error ?? "erro"})`}
        </span>
      ))}
    </div>
  );
}
