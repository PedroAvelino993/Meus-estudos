// Estrutura do app: navegação simples (5 áreas + ajustes) e as páginas.

import { BedDouble, Briefcase, Compass, Home, Plane, Settings } from "lucide-react";
import { useRoute } from "./hooks/useRoute";
import { Toasts } from "./components/ui";
import { APP_NAME } from "./config";
import { HomePage } from "./pages/HomePage";
import { FlightsPage } from "./pages/FlightsPage";
import { HotelsPage } from "./pages/HotelsPage";
import { DestinationsPage } from "./pages/DestinationsPage";
import { TripPage, TripsPage } from "./pages/TripsPage";
import { ComparePage } from "./pages/ComparePage";
import { SettingsPage } from "./pages/SettingsPage";

const NAV = [
  { href: "#/", page: "home", label: "Início", icon: Home },
  { href: "#/voos", page: "voos", label: "Passagens", icon: Plane },
  { href: "#/hoteis", page: "hoteis", label: "Hotéis", icon: BedDouble },
  { href: "#/destinos", page: "destinos", label: "Destinos", icon: Compass },
  { href: "#/viagens", page: "viagens", label: "Minhas viagens", icon: Briefcase },
] as const;

export default function App() {
  const route = useRoute();
  const active = route.page === "viagem" || route.page === "comparar" ? "viagens" : route.page;
  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <a className="logo" href="#/">
            <span className="logo-mark">
              <Plane size={17} />
            </span>
            {APP_NAME}
          </a>
          <nav className="nav" aria-label="Principal">
            {NAV.map((n) => (
              <a key={n.page} href={n.href} className={active === n.page ? "on" : ""}>
                <n.icon size={16} /> {n.label}
              </a>
            ))}
          </nav>
          <a className={`btn ghost sm ${route.page === "ajustes" ? "on" : ""}`} href="#/ajustes" aria-label="Ajustes" style={{ marginLeft: "auto" }}>
            <Settings size={18} />
          </a>
        </div>
      </header>
      <main className="main">
        {route.page === "home" && <HomePage />}
        {route.page === "voos" && <FlightsPage query={route.query} />}
        {route.page === "hoteis" && <HotelsPage query={route.query} />}
        {route.page === "destinos" && <DestinationsPage query={route.query} />}
        {route.page === "viagens" && <TripsPage />}
        {route.page === "viagem" && <TripPage id={route.id} />}
        {route.page === "comparar" && <ComparePage />}
        {route.page === "ajustes" && <SettingsPage />}
      </main>
      <nav className="bottom-nav" aria-label="Principal">
        {NAV.map((n) => (
          <a key={n.page} href={n.href} className={active === n.page ? "on" : ""}>
            <n.icon size={20} />
            {n.page === "viagens" ? "Viagens" : n.label}
          </a>
        ))}
      </nav>
      <Toasts />
    </>
  );
}
