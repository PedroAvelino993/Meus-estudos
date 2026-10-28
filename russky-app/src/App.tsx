import { useEffect, useState } from "react";
import {
  BarChart3, BookA, Flame, BookMarked, BookOpen, Home, LayoutGrid, Library, Map as MapIcon, MessagesSquare, RotateCcw, Settings as SettingsIcon, Trophy, X,
} from "lucide-react";
import { useRoute } from "./router";
import { getState, onAchievements, useStudent } from "./store";
import { Logo, Toasts, toast } from "./components/ui";
import { configureSpeech } from "./audio/speech";
import { setSfxEnabled, sfx } from "./audio/sfx";
import { dueItems } from "./core/srs";
import { currentStreak } from "./core/state";
import { HomePage } from "./pages/Home";
import { LearnPage } from "./pages/Learn";
import { LessonRoute, TestRoute, ReviewRoute, GrammarPracticeRoute, LetterPracticeRoute, RecoveryRoute } from "./pages/Run";
import { AlphabetPage, LetterPage } from "./pages/Alphabet";
import { ConversationsPage, ConversationPage } from "./pages/Conversations";
import { VocabularyPage } from "./pages/Vocabulary";
import { ReviewPage } from "./pages/Review";
import { GrammarPage, GrammarTopicPage } from "./pages/Grammar";
import { StoryPage, ChapterPage } from "./pages/Story";
import { ProgressPage } from "./pages/Progress";
import { SettingsPage } from "./pages/Settings";
import { Onboarding } from "./pages/Onboarding";
import { NotFound } from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";

const NAV = [
  { to: "/", label: "Início", icon: Home },
  { to: "/aprender", label: "Aprender", icon: LayoutGrid },
  { to: "/alfabeto", label: "Alfabeto", icon: BookA },
  { to: "/conversas", label: "Conversação", icon: MessagesSquare },
  { to: "/vocabulario", label: "Vocabulário", icon: Library },
  { to: "/revisao", label: "Revisão", icon: RotateCcw },
  { to: "/gramatica", label: "Gramática", icon: BookOpen },
  { to: "/historia", label: "História", icon: MapIcon },
  { to: "/progresso", label: "Progresso", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: SettingsIcon },
];

const MOBILE = ["/", "/aprender", "/revisao", "/conversas"];

function useTheme() {
  const s = useStudent().settings;
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = s.theme === "dark" || (s.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.dataset.theme = dark ? "dark" : "light";
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#11141b" : "#fbf7f0");
    };
    apply();
    root.dataset.motion = s.motion === "system" ? "" : s.motion;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [s.theme, s.motion]);
  useEffect(() => {
    configureSpeech({ voiceURI: s.voiceURI, rate: s.rate });
    setSfxEnabled(s.sound);
  }, [s.voiceURI, s.rate, s.sound]);
}

function isActive(path: string, to: string) {
  return to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`);
}

export default function App() {
  useTheme();
  const { path, parts } = useRoute();
  const s = useStudent();
  const [more, setMore] = useState(false);
  const due = dueItems(s.items, Date.now(), 99).length;
  const streak = currentStreak(s, Date.now());

  useEffect(
    () =>
      onAchievements((list) => {
        sfx.achievement();
        for (const a of list) toast({ title: `Conquista: ${a.title}`, body: a.description, icon: <Trophy size={20} />, tone: "gold" });
      }),
    [],
  );

  useEffect(() => setMore(false), [path]);

  if (!s.onboarded) return <Onboarding />;

  // Telas de tela cheia (lição, teste, conversa, capítulo)
  const full = (() => {
    switch (parts[0]) {
      case "licao":
        return <LessonRoute id={parts[1]} />;
      case "teste":
        return <TestRoute unitId={parts[1]} />;
      case "praticar":
        return parts[1] === "revisao" ? <ReviewRoute /> : parts[1] === "gramatica" ? <GrammarPracticeRoute id={parts[2]} /> : parts[1] === "letra" ? <LetterPracticeRoute letter={decodeURIComponent(parts[2] ?? "")} /> : parts[1] === "recuperacao" ? <RecoveryRoute /> : null;
      case "conversa":
        return <ConversationPage id={parts[1]} />;
      case "capitulo":
        return <ChapterPage id={parts[1]} />;
      default:
        return null;
    }
  })();
  if (full) return <ErrorBoundary key={path}>{full}<Toasts /></ErrorBoundary>;

  const page = (() => {
    switch (parts[0]) {
      case undefined:
        return <HomePage />;
      case "aprender":
        return <LearnPage />;
      case "alfabeto":
        return parts[1] ? <LetterPage letter={decodeURIComponent(parts[1])} /> : <AlphabetPage />;
      case "conversas":
        return <ConversationsPage />;
      case "vocabulario":
        return <VocabularyPage />;
      case "revisao":
        return <ReviewPage />;
      case "gramatica":
        return parts[1] ? <GrammarTopicPage id={parts[1]} /> : <GrammarPage />;
      case "historia":
        return <StoryPage />;
      case "progresso":
        return <ProgressPage />;
      case "configuracoes":
        return <SettingsPage />;
      default:
        return <NotFound />;
    }
  })();

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Navegação principal">
        <a href="#/" className="brand">
          <Logo />
          <span className="brand-name">
            Russ<span>ky</span>
          </span>
        </a>
        {NAV.map((n) => (
          <a key={n.to} href={`#${n.to}`} className={`nav-link ${isActive(path, n.to) ? "active" : ""}`} aria-current={isActive(path, n.to) ? "page" : undefined}>
            <n.icon size={20} /> {n.label}
            {n.to === "/revisao" && due > 0 && <span className="nav-badge">{due > 99 ? "99+" : due}</span>}
          </a>
        ))}
        <div className="spacer" />
        <div className="card tight small" style={{ marginTop: 16 }}>
          <div className="row between">
            <span className="muted">Sequência</span>
            <b>{streak} {streak === 1 ? "dia" : "dias"}</b>
          </div>
          <div className="row between">
            <span className="muted">XP total</span>
            <b>{getState().xp}</b>
          </div>
        </div>
      </aside>

      <header className="topbar">
        <a href="#/" className="brand" style={{ padding: 0 }}>
          <Logo size={30} />
          <span className="brand-name">
            Russ<span>ky</span>
          </span>
        </a>
        <div className="row">
          <span className="chip gold" title="Sequência de dias">
            <Flame size={14} /> {streak}
          </span>
          <a className="icon-btn" href="#/configuracoes" aria-label="Configurações">
            <SettingsIcon size={20} />
          </a>
        </div>
      </header>

      <main className="main" id="main">
        <ErrorBoundary key={path}>{page}</ErrorBoundary>
      </main>

      <nav className="bottom-nav" aria-label="Navegação">
        {NAV.filter((n) => MOBILE.includes(n.to)).map((n) => (
          <a key={n.to} href={`#${n.to}`} className={isActive(path, n.to) ? "active" : ""} aria-current={isActive(path, n.to) ? "page" : undefined}>
            <n.icon size={22} />
            {n.label}
            {n.to === "/revisao" && due > 0 && <span className="dot" />}
          </a>
        ))}
        <button type="button" onClick={() => setMore(true)} className={NAV.some((n) => !MOBILE.includes(n.to) && isActive(path, n.to)) ? "active" : ""} aria-haspopup="dialog">
          <BookMarked size={22} />
          Mais
        </button>
      </nav>

      {more && (
        <div className="modal-backdrop" style={{ alignItems: "end" }} onMouseDown={(e) => e.target === e.currentTarget && setMore(false)}>
          <div className="modal" role="dialog" aria-label="Mais seções">
            <div className="row between" style={{ marginBottom: 10 }}>
              <h2>Mais</h2>
              <button className="icon-btn" onClick={() => setMore(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {NAV.filter((n) => !MOBILE.includes(n.to)).map((n) => (
                <a key={n.to} href={`#${n.to}`} className="card tight row" style={{ textDecoration: "none", color: "inherit", fontWeight: 750 }}>
                  <n.icon size={20} color="var(--red)" /> {n.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
      <Toasts />
    </div>
  );
}
