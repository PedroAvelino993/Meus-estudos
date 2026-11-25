// Navegação por âncora (#/voos?…): funciona em qualquer hospedagem estática.

import { useEffect, useState } from "react";
import type { Route } from "../types";

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, "");
  const [path, qs = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const query = new URLSearchParams(qs);
  switch (parts[0]) {
    case "voos":
      return { page: "voos", query };
    case "hoteis":
      return { page: "hoteis", query };
    case "destinos":
      return { page: "destinos", query };
    case "viagens":
      return parts[1] ? { page: "viagem", id: decodeURIComponent(parts[1]) } : { page: "viagens" };
    case "comparar":
      return { page: "comparar" };
    case "ajustes":
      return { page: "ajustes" };
    default:
      return { page: "home" };
  }
}

export function navigate(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== "" && v !== false) q.set(k, String(v));
  const qs = q.toString();
  location.hash = `#/${path}${qs ? `?${qs}` : ""}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
