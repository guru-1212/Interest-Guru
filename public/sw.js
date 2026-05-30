const CACHE_NAME = "vyaajbook-v1";
const ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/window.svg",
  "/globals.css"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching assets...");
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache new static assets
        if (
          networkResponse.ok && 
          (event.request.url.includes(".js") || 
           event.request.url.includes(".css") || 
           event.request.url.includes(".svg") ||
           event.request.url.includes(".png"))
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Return offline page or home if network fails
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
      });
    })
  );
});
