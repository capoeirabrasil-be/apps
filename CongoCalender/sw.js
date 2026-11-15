// CCC service worker. Page: network first (fresh daily data), offline fallback. Images/fonts/libs: cache first.
const C = "ccc-3e2c5792e7";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(["./", "img/icon-192.png"]))); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  if (r.mode === "navigate") { const app = new URL("./", self.registration.scope).href === new URL(".", r.url).href;
    e.respondWith(fetch(r).then(res => { if (app) { const cp = res.clone(); caches.open(C).then(c => c.put("./", cp)); } return res; }).catch(() => app ? caches.match("./") : caches.match(r))); return; }
  const u = new URL(r.url);
  if (u.origin !== location.origin && !/(^|\.)(gstatic\.com|googleapis\.com|cdnjs\.cloudflare\.com)$/.test(u.hostname)) return;
  if (/firestore|identitytoolkit|securetoken|apis\.google/.test(u.hostname)) return;
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); } return res; })));
});
// Phone notifications for owners (sent by tools/push.py through Firebase Cloud Messaging as data messages).
self.addEventListener("push", e => {
  let d = {}; try { const j = e.data ? e.data.json() : {}; d = j.data || j; } catch {}
  e.waitUntil(self.registration.showNotification(d.title || "Congo Capoeira Calendar", {
    body: d.body || "", tag: d.tag || "ccc", icon: "img/icon-192.png", badge: "img/icon-192.png", data: { url: d.url || "./#admin" } }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    const w = ws.find(x => x.url.startsWith(self.registration.scope));
    return w ? w.focus().then(x => x && x.navigate ? x.navigate(url) : x) : self.clients.openWindow(url);
  }));
});
