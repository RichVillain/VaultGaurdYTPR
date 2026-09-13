// Minimal service worker: enables install-to-home-screen without an offline
// cache strategy. This app is data-fresh by design (live extraction and
// Gemini calls), so caching API responses would show stale research state.
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass-through: no caching. Present so the app qualifies as installable.
});
