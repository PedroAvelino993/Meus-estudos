import { useEffect, useState } from "react";
import { BarChart3, Building2, Castle, Coins, Crown, Dices, Flame, Gem, Globe2, Hourglass, Landmark, ScrollText, Settings, Sparkles, Swords, Trophy, Users } from "lucide-react";
import type { GameState } from "./core/state";
import { newGame } from "./core/state";
import { lastSlot, load, slots as listSlots } from "./core/store";
import { advanceWeek, blockers } from "./core/turn";
import { capacity } from "./core/economy";
import { betsOpen } from "./core/bets";
import { authority } from "./core/events";
import { ERAS } from "./content/world";
import { GameProvider, useGame } from "./ui/game";
import { Logo } from "./ui/art";
import { fmt, money, one } from "./ui/kit";
import { CrisisModal, EndModal, EraModal, SummaryModal, TutorialCard } from "./screens/Overlays";
import Home from "./screens/Home";
import Events from "./screens/Events";
import Gladiators from "./screens/Gladiators";
import Evolution from "./screens/Evolution";
import Construction from "./screens/Construction";
import World from "./screens/World";
import Bets from "./screens/Bets";
import Rival from "./screens/Rival";
import Imperial from "./screens/Imperial";
import Chronicle from "./screens/Chronicle";
import SettingsScreen from "./screens/Settings";

export default function App() {
  const [game, setGame] = useState<{ s: GameState; slot: number } | null>(() => {
    const sl = lastSlot();
    if (!sl) return null;
    const s = load(sl);
    return s ? { s, slot: sl } : null;
  });
  if (!game) return <Start onStart={(s, slot) => setGame({ s, slot })} />;
  return (
    <GameProvider key={`${game.slot}:${game.s.seed}`} initial={game.s} slot={game.slot} onExit={() => setGame(null)}>
      <Shell />
    </GameProvider>
  );
}

// ---------- Tela inicial ----------

function Start({ onStart }: { onStart: (s: GameState, slot: number) => void }) {
  const saved = listSlots();
  const [name, setName] = useState("Coliseu do Tibre");
  const free = saved.findIndex((x) => !x);
  const [slot, setSlot] = useState(free >= 0 ? free + 1 : 1);
  return (
    <div className="content" style={{ maxWidth: 880, paddingTop: 40 }}>
      <div className="center col" style={{ alignItems: "center", gap: 10, marginBottom: 24 }}>
        <Logo size={84} />
        <h1 style={{ fontSize: 38, letterSpacing: "0.16em" }}>COLOSSEUM INC.</h1>
        <p className="muted" style={{ maxWidth: 560 }}>
          Estratégia, administração e expansão mundial. Comece com uma arena de madeira para 500 pessoas em Roma e transforme-a no maior império do entretenimento do mundo antigo.
        </p>
      </div>
      <div className="grid g2">
        <section className="card gilded">
          <h3 style={{ marginBottom: 12 }}>Nova campanha</h3>
          <label className="field">
            Nome do seu Coliseu
            <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="small muted" style={{ margin: "12px 0 6px" }}>
            Espaço de salvamento
          </div>
          <div className="seg" style={{ marginBottom: 14 }}>
            {[1, 2, 3].map((n) => (
              <button key={n} className={slot === n ? "on" : ""} onClick={() => setSlot(n)}>
                Espaço {n}
                {saved[n - 1] ? " (ocupado)" : ""}
              </button>
            ))}
          </div>
          {saved[slot - 1] && <p className="small neg" style={{ marginBottom: 10 }}>Começar aqui substitui a campanha salva neste espaço.</p>}
          <button className="btn gold block advance" onClick={() => onStart(newGame(name, Date.now() & 0x7fffffff), slot)}>
            Abrir as portas
          </button>
        </section>
        <section className="card">
          <h3 style={{ marginBottom: 12 }}>Continuar</h3>
          <div className="list">
            {saved.map((x, i) =>
              x ? (
                <button
                  key={i}
                  className="item selectable"
                  style={{ textAlign: "left" }}
                  onClick={() => {
                    const s = load(x.slot);
                    if (s) onStart(s, x.slot);
                  }}
                >
                  <div className="row between">
                    <b>{x.name}</b>
                    <span className="tag">Espaço {x.slot}</span>
                  </div>
                  <div className="small muted">
                    Semana {x.week} · Era {x.era} ({ERAS[x.era - 1]?.name}) · {money(x.money)} denários
                  </div>
                </button>
              ) : (
                <div key={i} className="item small faint">
                  Espaço {i + 1} vazio
                </div>
              ),
            )}
          </div>
        </section>
      </div>
      <p className="tiny faint center" style={{ marginTop: 24 }}>
        Jogo de ficção. O Arena Bets usa apenas fichas fictícias e gratuitas, sem valor em dinheiro. Espetáculos roteirizados são sempre identificados como tal.
      </p>
    </div>
  );
}

// ---------- Estrutura principal ----------

const TABS = [
  { id: "coliseu", label: "Coliseu", icon: Castle },
  { id: "eventos", label: "Eventos", icon: Flame },
  { id: "gladiadores", label: "Gladiadores", icon: Swords },
  { id: "evolucao", label: "Evolução", icon: Sparkles },
  { id: "construcao", label: "Construção", icon: Building2 },
  { id: "mundo", label: "Mundo", icon: Globe2 },
  { id: "bets", label: "Arena Bets", icon: Dices },
  { id: "rival", label: "Rivais", icon: Users },
  { id: "central", label: "Central Imperial", icon: Crown },
  { id: "cronica", label: "Crônica", icon: ScrollText },
  { id: "ajustes", label: "Ajustes", icon: Settings },
] as const;

function Shell() {
  const { s, act, tab, go, toasts, toast } = useGame();
  const [summary, setSummary] = useState(false);
  const [eraShown, setEraShown] = useState(s.era);
  const blocked = blockers(s);
  const pending = s.pendingCrises.length;
  const badges: Record<string, number> = {
    eventos: s.plans.length === 0 ? 1 : 0,
    gladiadores: s.offers.length,
    evolucao: 0,
    rival: s.bids.length,
    central: s.international && !s.international.champion ? 1 : 0,
  };

  const advance = () => {
    if (blocked.length) {
      toast(blocked[0], true);
      return;
    }
    const ok = act((x) => advanceWeek(x));
    if (ok) setSummary(true);
  };
  useEffect(() => {
    const h = () => advance();
    window.addEventListener("colosseum:advance", h);
    return () => window.removeEventListener("colosseum:advance", h);
  });

  const lockedTab = (id: string) => (id === "bets" && !betsOpen(s) ? "Arena Bets abre no nível Magnata dos Espetáculos" : id === "rival" && !s.rival.active && !s.rival.defeated ? "A concorrência aparece na Era 2" : null);
  const Screen = { coliseu: Home, eventos: Events, gladiadores: Gladiators, evolucao: Evolution, construcao: Construction, mundo: World, bets: Bets, rival: Rival, central: Imperial, cronica: Chronicle, ajustes: SettingsScreen }[tab] ?? Home;
  const net = s.lastSummary ? s.lastSummary.reports.reduce((a, r) => a + r.profit, 0) + s.lastSummary.income - s.lastSummary.expenses : 0;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Logo />
          <div>
            <b>COLOSSEUM INC.</b>
            <span>{s.name.toUpperCase()}</span>
          </div>
        </div>
        {TABS.map((t) => {
          const lock = lockedTab(t.id);
          return (
            <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => (lock ? toast(lock, true) : go(t.id))} style={lock ? { opacity: 0.5 } : undefined}>
              <t.icon size={18} />
              {t.label}
              {!!badges[t.id] && <span className="dot">{badges[t.id]}</span>}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div className="item small">
          <div className="muted tiny">ERA {s.era}</div>
          <b className="gold" style={{ fontFamily: "var(--serif)" }}>
            {ERAS[s.era - 1].name}
          </b>
          <div className="tiny faint" style={{ marginTop: 4 }}>
            Semana {s.week} · Autoridade {authority(s)}
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="stats">
            <span className="chip" title="Denários em caixa">
              <Coins size={15} />
              <b className={s.money < 0 ? "neg" : ""}>{money(s.money)}</b>
            </span>
            <span className="chip" title="Pontos de evolução">
              <Gem size={15} />
              <b>{s.ep}</b> PE
            </span>
            <span className="chip" title="Popularidade em Roma">
              <Users size={15} />
              <b>{one(s.popularity)}</b>
            </span>
            <span className="chip" title="Fama mundial">
              <Trophy size={15} />
              <b>{fmt(s.fame)}</b>
            </span>
            <span className="chip hide-mobile" title="Prestígio">
              <Landmark size={15} />
              <b>{fmt(s.prestige)}</b>
            </span>
            <span className="chip hide-mobile" title="Capacidade do Coliseu">
              <Building2 size={15} />
              <b>{fmt(capacity(s, "roma"))}</b>
            </span>
            <span className="chip hide-mobile" title="Resultado da última semana">
              <BarChart3 size={15} />
              <b className={net < 0 ? "neg" : "pos"}>{money(net)}</b>
            </span>
          </div>
          <button className={`btn ${pending ? "red" : "gold"} advance`} onClick={advance} title={blocked[0] ?? "Avançar para a próxima semana"}>
            <Hourglass size={16} />
            {pending ? (
              "Crise!"
            ) : (
              <>
                {s.plans.length ? "Iniciar eventos" : "Avançar"}
                <span className="long"> · semana {s.week}</span>
              </>
            )}
          </button>
        </header>

        <main className="content" key={tab}>
          <TutorialCard />
          <Screen />
        </main>
      </div>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => (lockedTab(t.id) ? toast(lockedTab(t.id)!, true) : go(t.id))}>
            <t.icon size={19} />
            {t.label.split(" ")[0]}
            {!!badges[t.id] && <span className="dot" />}
          </button>
        ))}
      </nav>

      {pending > 0 && <CrisisModal />}
      {!pending && summary && s.lastSummary && <SummaryModal onClose={() => setSummary(false)} />}
      {!pending && !summary && eraShown !== s.era && <EraModal onClose={() => setEraShown(s.era)} />}
      {!pending && !summary && eraShown === s.era && (s.defeat || (s.victory && !s.infinite)) && <EndModal />}

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
