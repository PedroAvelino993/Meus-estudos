import { Clapperboard, FolderOpen, LayoutDashboard, Scissors, Settings as Gear, Sparkles, Youtube } from "lucide-react";
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
  const { tab, go, jobs, toasts } = useApp();
  const running = jobs.filter((j) => j.status === "rodando");
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
