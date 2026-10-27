/* Skills Advisor portal service worker — offline + instant repeat loads.
   Strategy: cache-first for the app shell + assets, network fallback, and a
   stale-while-revalidate refresh so deploys propagate on the next visit.
   Versioned cache name → bump CACHE on each deploy to invalidate cleanly. */
const CACHE = "skills-advisor-v11";
const SHELL = ["./", "./index.html", "./manifest.json", "./assets/invocation-examples.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      // stale-while-revalidate: serve cache immediately, refresh in background
      return cached || network;
    })
  );
});
