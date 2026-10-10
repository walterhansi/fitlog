// AO fitlog – Service Worker
// Bei jeder neuen Version VERSION erhöhen, damit Geräte das Update erkennen.
const VERSION = '1.1.0';
const CACHE = 'aofl-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './anleitung.html',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './anleitung-bilder/01_training_start.jpg',
  './anleitung-bilder/02_workout_vorschlag.jpg',
  './anleitung-bilder/03_workout_saetze.jpg',
  './anleitung-bilder/04_zusammenfassung.jpg',
  './anleitung-bilder/05_daten.jpg',
  './anleitung-bilder/06_pc_plan_gesperrt.jpg',
  './anleitung-bilder/07_pc_uebung.jpg',
  './anleitung-bilder/08_pc_verlauf.jpg',
  './anleitung-bilder/09_sync_einrichten.jpg',
  './anleitung-bilder/10_hinweis_holen.jpg',
  './anleitung-bilder/11_holen_vorschau.jpg',
  './anleitung-bilder/12_datei_austausch.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('aofl-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

// Cache zuerst: Die App startet sofort, auch ohne Netz im Studio.
// Updates kommen über eine neue sw.js-Version (Hinweis in der App).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((hit) => hit || fetch(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
