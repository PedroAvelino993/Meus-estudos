// Ajustes: endereço do servidor (e o que ele tem configurado), conta, sincronização e dados.

import { useState } from "react";
import { CheckCircle2, Download, LogOut, RefreshCw, Upload, XCircle } from "lucide-react";
import type { ServerStatus, Trip } from "../types";
import { api, diagnoseServer, serverStatus } from "../api/client";
import { apiUrl, setApiUrl } from "../config";
import { getSession, setSession, type Session } from "../database/session";
import { syncTrips } from "../database/sync";
import { listTrips, saveTrip } from "../database/trips";
import { useAsync } from "../hooks/useAsync";
import { useStore } from "../hooks/useStore";
import { downloadJson } from "../utils/files";
import { Loading, Notice, Seg, toast } from "../components/ui";

function Item({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="row top small">
      {ok ? <CheckCircle2 size={17} color="var(--good)" /> : <XCircle size={17} color="var(--faint)" />}
      <div>
        <b>{label}</b>: {ok ? "configurado" : "não configurado"}
        {!ok && <div className="tiny muted">{hint}</div>}
      </div>
    </div>
  );
}

function ServerCard() {
  const [url, setUrl] = useState(apiUrl());
  const [tick, setTick] = useState(0);
  const status = useAsync<ServerStatus | null>(() => serverStatus(true), [tick, apiUrl()], !!apiUrl());
  const why = useAsync(() => diagnoseServer(), [tick, apiUrl(), status.data === null && !status.loading], !!apiUrl() && status.data === null && !status.loading);
  return (
    <div className="card stack">
      <h2>Servidor de pesquisa</h2>
      <p className="small muted">
        As buscas de passagens e hotéis com preço passam pelo servidor do app, que guarda as chaves das APIs (SerpApi, Duffel) com segurança — elas nunca ficam no navegador. Sem servidor, o app continua funcionando com links para os sites dos fornecedores, o assistente de destinos e o planejamento.
      </p>
      <form
        className="row wrap"
        onSubmit={(e) => {
          e.preventDefault();
          setApiUrl(url);
          setTick((t) => t + 1);
          toast(url ? "Endereço salvo." : "Servidor removido.");
        }}
      >
        <input className="input grow" style={{ minWidth: 240 }} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://sua-api.onrender.com" aria-label="Endereço do servidor" />
        <button className="btn primary">Salvar e testar</button>
      </form>
      {!apiUrl() && <Notice kind="info">Nenhum servidor configurado. Veja como publicar o seu (é gratuito) no arquivo docs/SETUP.md do projeto.</Notice>}
      {status.loading && <Loading text="Testando o servidor…" />}
      {apiUrl() && !status.loading && status.data === null && (
        <Notice kind="bad">
          {why.data === "cors" ? (
            <>
              O servidor está no ar, mas <b>não autoriza este site</b>. No Render, abra o serviço → <b>Environment</b> e coloque <b>ALLOWED_ORIGINS</b> = <code>{location.origin}</code> (sem barra no fim). Salve, espere ficar «Live» e toque em «Salvar e testar» de novo.
            </>
          ) : (
            <>Não foi possível falar com {apiUrl()}. Se o servidor é do plano grátis do Render, ele pode estar «dormindo»: espere 1 minuto e toque em «Salvar e testar» de novo. Confira também o endereço.</>
          )}
        </Notice>
      )}
      {status.data && (
        <div className="stack tight">
          <Notice kind="good">Servidor respondendo (versão {status.data.version}).</Notice>
          <Item ok={status.data.flights.serpapi} label="Passagens e hotéis — Google Flights/Hotels (SerpApi)" hint="Defina SERPAPI_KEY no servidor (plano gratuito: 250 buscas/mês)." />
          <Item ok={status.data.flights.duffel} label="Passagens — ofertas das companhias (Duffel)" hint="Defina DUFFEL_TOKEN (conta ativada, modo live) no servidor." />
          <Item ok={status.data.deals} label="Ofertas da página inicial" hint="Defina DEALS_ORIGIN e DEALS_DESTINATIONS no servidor." />
          <Item ok={status.data.accounts} label="Contas e viagens na nuvem" hint="ACCOUNTS_ENABLED=true no servidor." />
        </div>
      )}
    </div>
  );
}

function AccountCard() {
  const session = useStore(getSession);
  const status = useAsync(() => serverStatus(), [apiUrl()], !!apiUrl());
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!apiUrl() || !status.data?.accounts) {
    return (
      <div className="card stack">
        <h2>Conta</h2>
        <p className="small muted">Suas viagens ficam salvas neste aparelho. Com um servidor configurado, você pode criar uma conta para guardá-las na nuvem e abrir em outros aparelhos.</p>
      </div>
    );
  }
  const sync = async () => {
    setBusy(true);
    try {
      const r = await syncTrips();
      toast(`Sincronizado: ${r.sent} enviada(s), ${r.received} recebida(s).`);
    } catch (e) {
      toast(`Falha ao sincronizar: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  if (session) {
    return (
      <div className="card stack">
        <h2>Conta</h2>
        <div className="small">
          Conectado como <b>{session.user.name}</b> ({session.user.email})
        </div>
        <div className="row wrap">
          <button className="btn primary" disabled={busy} onClick={sync}>
            <RefreshCw size={15} className={busy ? "spin" : ""} /> Sincronizar viagens
          </button>
          <button
            className="btn"
            onClick={async () => {
              await api("/api/auth/logout", { method: "POST", auth: true }).catch(() => undefined);
              setSession(null);
            }}
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </div>
    );
  }
  return (
    <form
      className="card stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const s = await api<Session>(mode === "login" ? "/api/auth/login" : "/api/auth/register", { body: form });
          setSession(s);
          await syncTrips();
          toast("Conta conectada. Suas viagens foram sincronizadas.");
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Conta</h2>
      <Seg value={mode} onChange={setMode} label="Entrar ou criar conta" options={[{ id: "login", label: "Entrar" }, { id: "register", label: "Criar conta" }]} />
      {mode === "register" && (
        <label className="field">
          <span>Nome</span>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
        </label>
      )}
      <label className="field">
        <span>E-mail</span>
        <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />
      </label>
      <label className="field">
        <span>Senha {mode === "register" ? "(mínimo 8 caracteres)" : ""}</span>
        <input className="input" type="password" required minLength={mode === "register" ? 8 : 1} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </label>
      {error && <Notice kind="bad">{error}</Notice>}
      <button className="btn primary" disabled={busy}>
        {mode === "login" ? "Entrar" : "Criar conta"}
      </button>
    </form>
  );
}

function DataCard() {
  return (
    <div className="card stack">
      <h2>Seus dados</h2>
      <p className="small muted">Viagens, comparações e pesquisas recentes ficam guardadas neste navegador. Faça uma cópia para não perder.</p>
      <div className="row wrap">
        <button className="btn" onClick={() => downloadJson(`viagens-${new Date().toISOString().slice(0, 10)}.json`, { app: "rota", version: 1, trips: listTrips() })}>
          <Download size={15} /> Exportar viagens
        </button>
        <label className="btn">
          <Upload size={15} /> Importar viagens
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const data = JSON.parse(await f.text()) as { trips?: Trip[] };
                const trips = (data.trips ?? []).filter((t) => t && typeof t.id === "string" && typeof t.name === "string");
                for (const t of trips) saveTrip({ ...t, activities: t.activities ?? [], restaurants: t.restaurants ?? [], addresses: t.addresses ?? [], expenses: t.expenses ?? [], notes: t.notes ?? "", travelers: t.travelers || 1, currency: t.currency || "BRL" }, false);
                toast(`${trips.length} viagem(ns) importada(s).`);
              } catch {
                toast("Arquivo inválido.");
              }
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="tiny muted">
        Fontes de dados: Google Flights e Google Hotels (via SerpApi), Duffel, OpenStreetMap (© colaboradores do OpenStreetMap, ODbL), Wikipédia e Wikivoyage (CC BY-SA), Open-Meteo e OurAirports (domínio público).
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="stack">
      <h1>Ajustes</h1>
      <ServerCard />
      <AccountCard />
      <DataCard />
    </div>
  );
}
