const SW_VERSION = "v1-20260307";
const STATIC_CACHE = `catalog-static-${SW_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/f9b3c1a2.html",
  "/z3x9v7w1.html",
  "/p4d6u2m9.html",
  "/viewer.js",
  "/admin.js",
  "/product-info.js",
  "/css/tailwind.css",
  "/mock-products.js",
  "/pwa-register.js",
  "/manifest-catalog.webmanifest",
  "/manifest-admin.webmanifest",
  "/image.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys
      .filter((k) => k.startsWith("catalog-static-") && k !== STATIC_CACHE)
      .map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(req));
    return;
  }

  const isPage = req.mode === "navigate" || url.pathname.endsWith(".html");

  if (isPage) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/f9b3c1a2.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
