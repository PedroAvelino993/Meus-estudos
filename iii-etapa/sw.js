// Guarda uma cópia dos arquivos para o app abrir sem internet.
// Sempre tenta a versão mais nova primeiro e usa a cópia só se estiver offline.
// O progresso fica no localStorage do aparelho e não é apagado nas atualizações.
const CACHE_NAME = "iii-etapa-v1";
const ARQUIVOS_PARA_GUARDAR = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./conteudo/matematica.js",
  "./conteudo/portugues.js",
  "./conteudo/producao.js",
  "./conteudo/biologia.js",
  "./conteudo/fisica.js",
  "./conteudo/quimica.js",
  "./conteudo/historia.js",
  "./conteudo/geografia.js",
  "./conteudo/ingles.js",
  "./conteudo/arte.js",
  "./conteudo/edfisica.js",
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
      Promise.all(nomes.filter((n) => n.startsWith("iii-etapa-") && n !== CACHE_NAME).map((n) => caches.delete(n)))
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
