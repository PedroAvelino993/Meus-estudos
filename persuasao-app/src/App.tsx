// Raiz do jogo: tela de título, estado da partida, salvamento automático, navegação e sobreposições.

import { useCallback, useEffect, useRef, useState } from "react";
import { BatteryMedium, Clock, Crown, House, Map as MapIcon, MapPin, MessageCircle, Moon, Smartphone, Sparkles, Star } from "lucide-react";
import Title from "./screens/Title";
import Home from "./screens/Home";
import CityMap from "./screens/CityMap";
import District, { Briefing, CharacterSheet } from "./screens/District";
import Encounter from "./screens/Encounter";
import Phone from "./phone/Phone";
import { checkAchievements } from "./core/achievements";
import { CHAPTERS, ENDINGS } from "./content/story";
import { district } from "./content";
import { type GameState, clock, daySummary, endDay, levelOf, repTier, unread } from "./core/game";
import { currentSlot, load, loadPrefs, save, savePrefs, type Prefs } from "./store";
import { ACH_ICONS, Ctx, Modal, fmt, sfx, type GameCtx, type Toast, type View } from "./ui";

function Confetti() {
  const colors = ["#c9a44c", "#e2c37a", "#3fbf8a", "#f2ebdd", "#7fa8e8"];
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 46 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 12) * 0.06}s`, transform: `rotate(${i * 29}deg)` }} />
      ))}
    </div>
  );
}

type Summary = ReturnType<typeof daySummary> & { day: number; money: number };

export default function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [slot, setSlot] = useState(1);
  const ref = useRef<GameState | null>(null);
  const [view, setView] = useState<View>("home");
  const [phone, setPhone] = useState<string | null>(null);
  const [charId, setCharId] = useState<string | null>(null);
  const [briefId, setBriefId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confetti, setConfetti] = useState(0);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs);
  const tid = useRef(1);

  useEffect(() => {
    document.body.classList.toggle("reduce-motion", prefs.reducedMotion);
  }, [prefs.reducedMotion]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = tid.current++;
    setToasts((x) => [...x.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3200);
  }, []);

  const begin = (s: GameState, n: number) => {
    ref.current = s;
    setGame(s);
    setSlot(n);
    save(n, s);
    setView(s.encounter ? "district" : "home");
    window.scrollTo(0, 0);
  };

  const act = useCallback(
    (f: (s: GameState) => GameState): GameState => {
      const before = ref.current!;
      let next = f(before);
      if (next === before) return before;
      const ach = checkAchievements(next);
      next = ach.state;
      ref.current = next;
      setGame(next);
      if (!save(slot, next)) toast({ text: "Não foi possível salvar neste navegador.", tone: "red" });
      for (const a of ach.unlocked) toast({ text: `Conquista: ${a.title}`, tone: "gold", icon: ACH_ICONS[a.icon] ?? Star });
      if (levelOf(next.xp).level > levelOf(before.xp).level) {
        sfx("level", prefs.sound);
        toast({ text: `Nível ${levelOf(next.xp).level}! Você ganhou um ponto de habilidade.`, tone: "gold", icon: Sparkles });
        setConfetti((c) => c + 1);
      }
      if (repTier(next.rep).name !== repTier(before.rep).name && next.rep > before.rep) toast({ text: `Reputação: agora você é «${repTier(next.rep).name}»`, tone: "green", icon: Crown });
      if (before.encounter && !next.encounter && next.money > before.money) sfx("coin", prefs.sound);
      if (unread(next) > unread(before) && !next.encounter) {
        sfx("msg", prefs.sound);
        toast({ text: "Nova mensagem no celular", icon: MessageCircle });
      }
      return next;
    },
    [slot, toast, prefs.sound],
  );

  const setPrefs = (p: Prefs) => {
    setPrefsState(p);
    savePrefs(p);
  };

  if (!game) {
    return (
      <Title
        lastSlot={currentSlot()}
        onStart={begin}
        onLoad={(n) => {
          const s = load(n);
          if (s) begin(s, n);
        }}
      />
    );
  }

  const s = game;
  const lv = levelOf(s.xp);
  const go = (v: View) => {
    setView(v);
    setPhone(null);
    window.scrollTo({ top: 0 });
  };
  const ctx: GameCtx = {
    s,
    act,
    go,
    openPhone: (app = "home") => !s.encounter && setPhone(app),
    closePhone: () => setPhone(null),
    toast,
    showCharacter: (id) => {
      setPhone(null);
      setBriefId(null);
      setCharId(id);
    },
    brief: (id) => {
      setCharId(null);
      setBriefId(id);
    },
    prefs,
    setPrefs,
    slot,
    quit: () => {
      ref.current = null;
      setGame(null);
      setPhone(null);
    },
    replaceGame: (g) => {
      ref.current = g;
      setGame(g);
      save(slot, g);
    },
  };

  const onEndDay = () => {
    if (s.encounter) return;
    const before = s;
    const after = act((g) => endDay(g));
    setSummary({ ...daySummary(before, after), day: before.day, money: after.money });
    setView("home");
  };

  const showChapter = !s.encounter && !s.chapterSeen.includes(s.chapter) && !summary;
  const ch = CHAPTERS.find((c) => c.n === s.chapter)!;
  const ending = s.ending && !s.flags.includes("final-visto") && !s.encounter ? ENDINGS.find((e) => e.id === s.ending!.id) : null;
  const msgs = unread(s);

  return (
    <Ctx.Provider value={ctx}>
      <div className="app">
        <header className="topbar">
          <div className="topbar-inner">
            <button className="brand" style={{ background: "none", border: 0, padding: 0 }} onClick={() => !s.encounter && go("home")} aria-label="Início">
              <span className="brand-mark">P</span>
              <span className="brand-text">The Art of Persuasion</span>
            </button>
            <div className="hud">
              <span className="hud-pill money-pill" title="Saldo">
                {fmt(s.money)}
              </span>
              <span className="hud-pill" title={`Nível ${lv.level}: ${lv.into}/${lv.need} XP`}>
                <Star size={15} className="gold" /> {lv.level}
                <span className="mini-bar">
                  <i style={{ width: `${(lv.into / lv.need) * 100}%`, background: "var(--gold)" }} />
                </span>
              </span>
              <span className="hud-pill hide-sm" title="Reputação">
                <Crown size={15} className="gold" /> {s.rep}
              </span>
              <span className="hud-pill" title="Dia e horário">
                <Clock size={15} /> D{s.day} {clock(s.minute)}
              </span>
              <span className="hud-pill hide-sm" title="Energia">
                <BatteryMedium size={15} className={s.energy < 25 ? "red" : "green"} />
                <span className="mini-bar">
                  <i style={{ width: `${s.energy}%` }} />
                </span>
              </span>
              <button className="icon-btn" onClick={() => ctx.openPhone()} disabled={!!s.encounter} aria-label="Abrir o celular" title="Celular">
                <Smartphone size={18} />
                {msgs > 0 && <span className="badge">{msgs}</span>}
              </button>
            </div>
          </div>
        </header>

        <main className="main">
          {s.encounter ? (
            <Encounter key={s.encounter.missionId} />
          ) : view === "home" ? (
            <Home onEndDay={onEndDay} />
          ) : view === "map" ? (
            <CityMap />
          ) : (
            <District />
          )}
        </main>

        {!s.encounter && (
          <nav className="bottom-nav" aria-label="Navegação">
            <div className="bottom-nav-inner">
              <button className={`nav-btn ${view === "home" ? "active" : ""}`} onClick={() => go("home")}>
                <House /> Início
              </button>
              <button className={`nav-btn ${view === "map" ? "active" : ""}`} onClick={() => go("map")}>
                <MapIcon /> Mapa
              </button>
              <button className={`nav-btn ${view === "district" ? "active" : ""}`} onClick={() => go("district")}>
                <MapPin /> {district(s.location).name.split(" ").slice(-1)[0]}
              </button>
              <button className={`nav-btn ${phone ? "active" : ""}`} onClick={() => ctx.openPhone()}>
                <Smartphone /> Celular
                {msgs > 0 && <span className="badge">{msgs}</span>}
              </button>
              <button className="nav-btn" onClick={onEndDay}>
                <Moon /> Dormir
              </button>
            </div>
          </nav>
        )}

        {phone && <Phone app={phone} setApp={setPhone} onClose={() => setPhone(null)} />}
        {charId && <CharacterSheet id={charId} onClose={() => setCharId(null)} />}
        {briefId && <Briefing id={briefId} onClose={() => setBriefId(null)} />}

        {summary && (
          <Modal label="Fim do dia" onClose={() => setSummary(null)}>
            <div className="chapter-screen">
              <Moon size={34} className="gold" />
              <h2 style={{ marginTop: 8 }}>Fim do dia {summary.day}</h2>
              <div className="rewards">
                <div className="reward">
                  <b className="green">{fmt(summary.income)}</b>
                  <span>Ganhos</span>
                </div>
                <div className="reward">
                  <b className="red">{fmt(summary.spent + summary.rent)}</b>
                  <span>Gastos + aluguel</span>
                </div>
                <div className="reward">
                  <b>{summary.talks}</b>
                  <span>Conversas</span>
                </div>
                <div className="reward">
                  <b>{summary.deals}</b>
                  <span>Acordos</span>
                </div>
              </div>
              <p className="small muted">
                Dona Cida cobrou {fmt(summary.rent)} do quarto. Saldo agora: <b className={summary.money < 0 ? "red" : "gold"}>{fmt(summary.money)}</b>
              </p>
              <div className="card tight event-banner" style={{ marginTop: 14, textAlign: "left" }}>
                <Sparkles size={18} />
                <div>
                  <b className="small">Amanhã: {summary.event.title}</b>
                  <p className="tiny muted">{summary.event.text}</p>
                </div>
              </div>
              <button className="btn primary block" style={{ marginTop: 16 }} onClick={() => setSummary(null)}>
                Começar o dia {summary.day + 1}
              </button>
            </div>
          </Modal>
        )}

        {showChapter && !ending && (
          <Modal label={`Capítulo ${ch.n}`}>
            <div className="chapter-screen">
              <div className="eyebrow">Capítulo</div>
              <div className="chapter-num">{ch.n}</div>
              <h2 style={{ marginTop: 6 }}>{ch.title}</h2>
              <p className="gold small" style={{ marginTop: 4 }}>
                {ch.subtitle}
              </p>
              <p className="ending-text" style={{ marginTop: 14 }}>
                {ch.intro}
              </p>
              <div className="card tight" style={{ marginTop: 14, textAlign: "left" }}>
                <b className="small">Objetivo</b>
                <p className="small muted">{ch.goalText}</p>
              </div>
              <button className="btn primary block" style={{ marginTop: 16 }} onClick={() => act((g) => ({ ...g, chapterSeen: [...g.chapterSeen, g.chapter] }))}>
                {ch.n === 1 ? "Começar" : "Continuar"}
              </button>
            </div>
          </Modal>
        )}

        {ending && (
          <Modal label="Final" wide>
            <div className="chapter-screen">
              <div className="eyebrow">Final</div>
              <h1 style={{ fontSize: "2rem", marginTop: 8 }}>{ending.title}</h1>
              <div className="title-rule" />
              <p className="ending-text">{ending.text}</p>
              <div className="rewards">
                <div className="reward">
                  <b>{s.day}</b>
                  <span>Dias</span>
                </div>
                <div className="reward">
                  <b>{s.stats.deals}</b>
                  <span>Acordos</span>
                </div>
                <div className="reward">
                  <b className="gold">{fmt(s.money)}</b>
                  <span>Saldo</span>
                </div>
                <div className="reward">
                  <b>{s.met.length}</b>
                  <span>Pessoas</span>
                </div>
              </div>
              <p className="small muted">Existem quatro finais, decididos pela sua integridade e pelo resultado com o prefeito. A cidade continua aberta: termine as missões que faltaram.</p>
              <button className="btn primary block" style={{ marginTop: 16 }} onClick={() => act((g) => ({ ...g, flags: [...g.flags, "final-visto"] }))}>
                Continuar em Vila Áurea
              </button>
            </div>
          </Modal>
        )}

        <div className="toasts" role="status">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.tone ?? ""}`}>
              {t.icon && <t.icon size={18} className={t.tone === "red" ? "red" : t.tone === "green" ? "green" : "gold"} />}
              {t.text}
            </div>
          ))}
        </div>
        {confetti > 0 && !prefs.reducedMotion && <Confetti key={confetti} />}
      </div>
    </Ctx.Provider>
  );
}
