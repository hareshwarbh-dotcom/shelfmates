// Shelfmates & Me: lets the app open offline. Always tries the network first,
// so new versions you upload show up straight away.
const CACHE = 'shelfmates-v2';
const CDN = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // the sign-in library and fonts: use the saved copy, refresh it in the background
  if (CDN.includes(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (url.origin !== location.origin) return;   // never touch Supabase or book search
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
