// Roteador por hash (#/licao/l1-1-1): funciona em qualquer hospedagem estática.

import { useSyncExternalStore } from "react";

function current(): string {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");
  return h || "/";
}

function subscribe(l: () => void) {
  window.addEventListener("hashchange", l);
  return () => window.removeEventListener("hashchange", l);
}

export function useRoute(): { path: string; parts: string[]; query: URLSearchParams } {
  const full = useSyncExternalStore(subscribe, current, () => "/");
  const [path, q = ""] = full.split("?");
  return { path, parts: path.split("/").filter(Boolean), query: new URLSearchParams(q) };
}

export function navigate(to: string, replace = false) {
  const target = `#${to}`;
  if (replace) window.location.replace(target);
  else window.location.hash = to;
  window.scrollTo({ top: 0 });
}

export function back(fallback = "/") {
  if (window.history.length > 1) window.history.back();
  else navigate(fallback);
}
