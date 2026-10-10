// "Service worker": guarda uma cópia dos arquivos do app para ele abrir
// mesmo sem internet. Sempre tenta buscar a versão mais nova primeiro
// (assim o conteúdo atualizado aparece) e usa a cópia só se estiver offline.
const CACHE_NAME = "meus-estudos-v1";
const ARQUIVOS_PARA_GUARDAR = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./conteudo.js",
  "./manifest.json",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_PARA_GUARDAR))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;
  evento.respondWith(
    fetch(evento.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(evento.request, copia));
        return resposta;
      })
      .catch(() => caches.match(evento.request))
  );
});
