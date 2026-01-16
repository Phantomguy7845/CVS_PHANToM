/* sw.js - minimal offline cache (GitHub Pages friendly)
   Strategy:
   - HTML: network-first (avoid stale UI)
   - others: cache-first
*/
const CACHE = "stl-cache-v1";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const core = [
      "./",
      "./Selfie_TimeLogger_MintLight.html",
      "./manifest.json"
    ];

    // addAll แบบ tolerant: ถ้าไฟล์ใดไม่พบ จะไม่ทำให้ install fail
    for (const url of core) {
      try { await cache.add(url); } catch (_) {}
    }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only same-origin
  if (url.origin !== location.origin) return;

  const isDoc = req.mode === "navigate" || (req.destination === "document");
  if (isDoc) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match("./Selfie_TimeLogger_MintLight.html");
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  })());
});
