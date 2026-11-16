// Service Worker for make.fun frontend
// Cache-first for static assets, stale-while-revalidate for API

const CACHE_NAME = 'makefun-v1';
const STATIC_CACHE = 'makefun-static-v1';
const API_CACHE = 'makefun-api-v1';
const OFFLINE_CACHE = 'makefun-offline-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/api.js',
  '/format.js',
  '/views/board.js',
  '/views/bounty.js',
  '/views/leaderboard.js',
  '/views/profile.js',
  '/manifest.json',
];

const API_PATTERNS = [
  /^https:\/\/make\.fun\/api\/competitions/,
  /^https:\/\/make\.fun\/api\/profiles/,
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
    }).then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, API_CACHE, OFFLINE_CACHE].includes(key))
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Same-origin static assets - Cache First
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API requests - Stale While Revalidate
  if (API_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Cross-origin fonts/images - Cache First with long TTL
  if (url.origin !== location.origin &&
      (request.destination === 'font' || request.destination === 'image')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Default - network only
  event.respondWith(fetch(request));
});

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/index.html');
    }
    throw err;
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached); // Fall back to cache on network error

  return cached || fetchPromise;
}

// Background sync for offline actions (placeholder)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-views') {
    event.waitUntil(syncViews());
  }
});

async function syncViews() {
  // Could queue viewed bounties for analytics when back online
  console.log('Background sync: views');
}

// Push notification handler (placeholder)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: data.url,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});