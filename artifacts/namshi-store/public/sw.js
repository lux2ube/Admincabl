const CACHE_VERSION = 'cabl-pwa-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;

const shellAssets = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './cabl-logo.svg',
  './pwa-icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(shellAssets))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function cacheUrls(urls) {
  const cache = await caches.open(RUNTIME_CACHE);
  await Promise.allSettled(urls.map(async (url) => {
    if (await cache.match(url)) return;
    const request = new Request(url, {
      mode: new URL(url).origin === self.location.origin ? 'same-origin' : 'no-cors',
    });
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      await cache.put(request, response);
    }
  }));
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_CATALOG_IMAGES' && Array.isArray(event.data.urls)) {
    event.waitUntil(cacheUrls(event.data.urls.filter((url) => typeof url === 'string')));
  }
});

async function networkFirst(request, cacheName, fallbackRequest = request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(fallbackRequest);
    if (cached) return cached;
    throw new Error('Offline and no cached response is available.');
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE, './index.html'));
    return;
  }

  if (url.pathname.includes('/api/store/catalog')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (request.destination === 'image' && url.protocol.startsWith('http')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
  }
});