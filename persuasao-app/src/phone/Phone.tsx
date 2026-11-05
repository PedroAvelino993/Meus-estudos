// O celular do jogo: moldura, tela inicial e navegação entre os aplicativos.

import { useEffect, useRef } from "react";
import { ArrowLeft, BatteryMedium, House, X, Contact, Landmark, MessageCircle, Settings, ShieldAlert, ShoppingBag, Signal, User, Wifi } from "lucide-react";
import { item } from "../content";
import { clock, unread } from "../core/game";
import { useGame } from "../ui";
import { Bank, Contacts, Messages } from "./apps";
import { Investigation, Profile, SettingsApp, Shop } from "./apps2";
import { perkPoints } from "../core/game";

export const APPS = [
  { id: "banco", name: "Conta", icon: Landmark, color: "linear-gradient(135deg,#c9a44c,#7a5e1f)" },
  { id: "contatos", name: "Contatos", icon: Contact, color: "linear-gradient(135deg,#3fbf8a,#1d6e4c)" },
  { id: "mensagens", name: "Mensagens", icon: MessageCircle, color: "linear-gradient(135deg,#5b8fd1,#2a4f86)" },
  { id: "investigacao", name: "Central", icon: ShieldAlert, color: "linear-gradient(135deg,#3fa7a0,#1a5754)" },
  { id: "loja", name: "Mercado", icon: ShoppingBag, color: "linear-gradient(135deg,#b5655b,#6e2f28)" },
  { id: "perfil", name: "Perfil", icon: User, color: "linear-gradient(135deg,#9a7bc9,#54398a)" },
  { id: "ajustes", name: "Ajustes", icon: Settings, color: "linear-gradient(135deg,#6b7585,#353c48)" },
] as const;

export function PhoneHeader({ title, back }: { title: string; back: () => void }) {
  return (
    <div className="phone-head">
      <button className="icon-btn" onClick={back} aria-label="Voltar">
        <ArrowLeft size={18} />
      </button>
      <h2>{title}</h2>
    </div>
  );
}

export default function Phone({ app, setApp, onClose }: { app: string; setApp: (a: string) => void; onClose: () => void }) {
  const { s } = useGame();
  const theme = item(s.theme)?.theme ?? { accent: "#C9A44C", bg: "#0E1117" };
  // O botão/gesto "voltar" do celular ou do navegador também guarda o celular do jogo
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    history.pushState({ phone: true }, "");
    const pop = () => closeRef.current();
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  const close = () => {
    if ((history.state as { phone?: boolean } | null)?.phone) history.back();
    else onClose();
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });
  const home = () => setApp("home");
  const badges: Record<string, number> = {
    mensagens: unread(s),
    investigacao: s.loot.length,
    perfil: Math.max(0, perkPoints(s)),
  };
  return (
    <div className="phone-overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="phone" style={{ ["--accent" as string]: theme.accent, ["--pbg" as string]: theme.bg }} role="dialog" aria-modal="true" aria-label="Celular">
        <div className="phone-status">
          <span>{clock(s.minute)}</span>
          <span className="row" style={{ gap: 5 }}>
            <Signal size={13} />
            <Wifi size={13} />
            <BatteryMedium size={15} /> {s.energy}%
            <button className="phone-x" onClick={close} aria-label="Fechar o celular e voltar ao jogo" title="Voltar ao jogo">
              <X size={16} />
            </button>
          </span>
        </div>
        <div className="phone-body">
          {app === "home" && (
            <div className="phone-home">
              <div className="phone-clock">{clock(s.minute)}</div>
              <p className="center small muted" style={{ marginTop: 6 }}>
                Dia {s.day} · Vila Áurea
              </p>
              <div className="app-grid">
                {APPS.map((a) => (
                  <button key={a.id} className="app-icon" onClick={() => setApp(a.id)}>
                    <span className="ico" style={{ background: a.color }}>
                      <a.icon size={26} />
                    </span>
                    {a.name}
                    {badges[a.id] ? <span className="badge">{badges[a.id]}</span> : null}
                  </button>
                ))}
              </div>
              <p className="center tiny muted" style={{ marginTop: 36 }}>
                Aparelho, contas e cartões 100% fictícios.
              </p>
            </div>
          )}
          {app === "banco" && <Bank back={home} />}
          {app === "contatos" && <Contacts back={home} />}
          {app === "mensagens" && <Messages back={home} />}
          {app === "investigacao" && <Investigation back={home} />}
          {app === "loja" && <Shop back={home} />}
          {app === "perfil" && <Profile back={home} />}
          {app === "ajustes" && <SettingsApp back={home} />}
        </div>
        <div className="phone-dock">
          {app !== "home" && (
            <button className="btn sm" onClick={home}>
              <House size={15} /> Apps
            </button>
          )}
          <button className="btn sm primary" onClick={close}>
            <X size={15} /> Voltar ao jogo
          </button>
        </div>
      </div>
    </div>
  );
}
