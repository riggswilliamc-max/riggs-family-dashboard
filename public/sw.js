// Minimal service worker — exists to satisfy install criteria on Android/Chrome.
// Intentionally does NOT cache anything: this dashboard relies on live Firestore
// data and should always hit the network, not a stale cache.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // No-op: let the browser handle every request normally.
})
