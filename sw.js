// Bump this version anytime you want to force all installed PWAs to refetch.
const CACHE = 'web-slinger-v2';

// Relative paths so this works on both localhost AND GitHub Pages subpaths
const ASSETS = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for HTML/JS/CSS so app updates appear quickly.
// Cache-first for icons/manifest (rarely change) to stay fast offline.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isAsset = /\.(png|jpg|svg|webmanifest|json|ico)$/i.test(url.pathname);

  if (isAsset) {
    // Cache-first
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return resp;
        }).catch(() => cached)
      )
    );
  } else {
    // Network-first (so HTML/index updates appear immediately)
    e.respondWith(
      fetch(e.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return resp;
      }).catch(() => caches.match(e.request).then(cached => cached || caches.match('index.html')))
    );
  }
});
