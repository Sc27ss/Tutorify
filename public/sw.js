/* Service worker de Tutorify.
 * - Archivos estáticos con hash (/assets/*) e íconos: caché primero.
 * - Navegación: red primero; si no hay conexión, se muestra /offline.html.
 * - NUNCA se cachean funciones de servidor, POST ni respuestas autenticadas (cookie de sesión). */
const VERSION = "tutorify-v1-a11y";
const ESTATICOS = `${VERSION}-estaticos`;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(ESTATICOS).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api")) return;

  if (request.mode === "navigate") {
    evento.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  const estatico = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/");
  if (estatico) {
    evento.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((resp) => {
            if (resp.ok) {
              const copia = resp.clone();
              caches.open(ESTATICOS).then((c) => c.put(request, copia));
            }
            return resp;
          }),
      ),
    );
  }
});
