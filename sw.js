/* Flat Out Grand Prix - offline play. Everything the game needs is kept on the phone;
   a new version is fetched in the background and used from the next launch. */
const CACHE = 'flatout-v9';
const FILES = ["./", "index.html", "css/style.css", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "js/util.js", "js/data.js", "js/names2.js", "js/state.js", "js/saves.js", "js/career.js", "js/develop.js", "js/weekend.js", "js/money.js", "js/relations.js", "js/profiles.js", "js/history.js", "js/teams.js", "js/circuits.js", "js/corners.js", "js/events2.js", "js/growth.js", "js/ui.js", "js/blackjack.js", "js/lifestyle.js", "js/main.js"];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const mine = url.origin === location.origin, fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!mine && !fonts) return;
  // serve from the phone at once, refresh the copy in the background
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request, { ignoreSearch: mine }).then((hit) => {
    const net = fetch(e.request).then((res) => { if (res && (res.ok || res.type === 'opaque')) c.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
