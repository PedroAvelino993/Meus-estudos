import { AlertTriangle, Clapperboard, FolderOpen, LayoutDashboard, Scissors, Settings as Gear, Sparkles, Youtube } from "lucide-react";
import { Modal } from "./ui/kit";
import { inAppBrowser, openInChromeUrl } from "./media/device";
import { AppProvider, useApp, type Tab } from "./ui/store";
import Dashboard from "./screens/Dashboard";
import Create from "./screens/Create";
import Projects from "./screens/Projects";
import Editor from "./screens/Editor";
import YouTube from "./screens/YouTube";
import Settings from "./screens/Settings";

const TABS: { id: Tab; label: string; short: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", short: "Início", icon: LayoutDashboard },
  { id: "criar", label: "Criar clipes", short: "Criar", icon: Sparkles },
  { id: "projetos", label: "Meus projetos", short: "Projetos", icon: FolderOpen },
  { id: "editor", label: "Edição manual", short: "Editor", icon: Scissors },
  { id: "youtube", label: "YouTube e monetização", short: "YouTube", icon: Youtube },
  { id: "config", label: "Configurações", short: "Ajustes", icon: Gear },
];

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

function Shell() {
  const { tab, go, jobs, toasts, crashed, dismissCrash } = useApp();
  const running = jobs.filter((j) => j.status === "rodando");
  const inApp = inAppBrowser();
  const Screen = { dashboard: Dashboard, criar: Create, projetos: Projects, editor: Editor, youtube: YouTube, config: Settings }[tab];
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <Clapperboard size={20} color="#fff" />
          </div>
          <div>
            <b>GTA CLIPS AI</b>
            <span>EDITOR INTELIGENTE</span>
          </div>
        </div>
        {TABS.map((t) => (
          <button key={t.id} className={`nav ${tab === t.id ? "active" : ""}`} onClick={() => go(t.id)}>
            <t.icon size={18} />
            {t.label}
            {t.id === "dashboard" && running.length > 0 && <span className="badge">{running.length}</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="item tiny muted">Tudo é processado no seu aparelho: os vídeos não são enviados para nenhum servidor.</div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="row grow" style={{ gap: 8 }}>
            <span className="display" style={{ fontSize: 18 }}>
              <span style={{ color: "var(--red)" }}>GTA</span> CLIPS AI
            </span>
          </div>
          {running.length > 0 && (
            <button className="btn sm" onClick={() => go("dashboard")}>
              <span className="tag red">{running.length}</span> processando
            </button>
          )}
          <button className="btn primary sm" onClick={() => go("criar")}>
            <Sparkles size={15} /> Novo vídeo
          </button>
        </header>
        {inApp && (
          <div className="banner amber" style={{ margin: "10px 14px 0" }}>
            <AlertTriangle size={18} />
            <span>
              Você está no navegador de dentro do {inApp}: aqui não dá para salvar nem compartilhar vídeos.{" "}
              {/Android/i.test(navigator.userAgent) ? (
                <a href={openInChromeUrl()} style={{ color: "#fff", fontWeight: 700 }}>
                  Abrir no Chrome
                </a>
              ) : (
                "Toque em ⋯ e escolha «Abrir no navegador»."
              )}
            </span>
          </div>
        )}
        <main className="content" key={tab}>
          <Screen />
        </main>
      </div>
      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => go(t.id)}>
            <t.icon size={19} />
            {t.short}
          </button>
        ))}
      </nav>
      {crashed && (
        <Modal title="O navegador fechou o app no meio da tarefa" onClose={dismissCrash}>
          <div className="stack small">
            <div className="banner amber">
              <AlertTriangle size={18} />
              <span>
                Enquanto {crashed.marks.map((m) => (m.kind === "analise" ? `analisava «${m.label}»` : m.kind === "exportacao" ? `exportava «${m.label}»` : `criava legendas de «${m.label}»`)).join(" e ")}, o navegador fechou a página. Isso acontece quando o aparelho fica sem memória (vídeos longos ou em alta resolução, ou outros apps abertos).
              </span>
            </div>
            <div>
              <b>Para não acontecer de novo, ajustei:</b>
              <ul style={{ margin: "6px 0", paddingLeft: 18 }}>
                {crashed.changes.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <b>Dicas:</b>
              <ul style={{ margin: "6px 0", paddingLeft: 18 }}>
                <li>Feche outros apps e abas antes de processar.</li>
                <li>Mantenha esta aba aberta e a tela ligada até terminar.</li>
                <li>Prefira gravações em 1080p; vídeos em 4K usam muito mais memória.</li>
                <li>Para exportar, selecione o vídeo original de novo no projeto.</li>
              </ul>
            </div>
            <div className="row wrap">
              <button
                className="btn primary"
                onClick={() => {
                  const pid = crashed.marks[0]?.projectId;
                  dismissCrash();
                  go("projetos", { projectId: pid ?? "" });
                }}
              >
                Abrir o projeto
              </button>
              <button className="btn" onClick={dismissCrash}>
                Entendi
              </button>
            </div>
          </div>
        </Modal>
      )}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.bad ? "bad" : ""}`}>
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
