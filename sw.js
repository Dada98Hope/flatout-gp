/* Flat Out Grand Prix - offline play. Everything the game needs is kept on the phone.
   An update downloads every file fresh (never from the browser's short-term cache), so the
   code and the styles always arrive together; it is used from the next launch. */
const CACHE = 'flatout-v10';
const FILES = ["./", "index.html", "css/style.css", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "js/util.js", "js/data.js", "js/names2.js", "js/state.js", "js/saves.js", "js/career.js", "js/develop.js", "js/weekend.js", "js/money.js", "js/relations.js", "js/profiles.js", "js/history.js", "js/teams.js", "js/circuits.js", "js/corners.js", "js/events2.js", "js/growth.js", "js/ui.js", "js/blackjack.js", "js/lifestyle.js", "js/main.js"];
const fresh = (u) => new Request(u, { cache: 'reload' });
// one key per file, whatever version tag is on the link
const keyOf = (url) => { const u = new URL(url); u.search = ''; return u.href; };
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map(fresh))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const mine = url.origin === location.origin, fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!mine && !fonts) return;
  const key = mine ? keyOf(e.request.url) : e.request.url;
  // serve from the phone at once, refresh the copy in the background (fresh from the server)
  e.respondWith(caches.open(CACHE).then((c) => c.match(key).then((hit) => {
    const net = fetch(mine ? fresh(key) : e.request).then((res) => { if (res && (res.ok || res.type === 'opaque')) c.put(key, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
