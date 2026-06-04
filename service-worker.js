// legacy smoke marker: zingsa-crop-collector-v1068-map-draw-mbtiles-fix
const CACHE_NAME = 'crop-collector-v1068-map-draw-mbtiles-fix';
const TRANSPARENT_GIF_BYTES = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='),
  (char) => char.charCodeAt(0)
);
const ASSETS_TO_CACHE = [
  './',
  './WELCOME.html',
  './collector.css',
  './app-db.js',
  './app-sync.js',
  './app-map.js',
  './app-wizard.js',
  './offline-sync-engine.js',
  './collector-form-open-save-fix-v1030.js',
  './collector-display-cleanup-v1050.js',
  './collector-photo-evidence-v1060.js',
  './collector-mobile-field-test-v1062.js',
  './admin-review-polish-v1060.js',
  './collector-final-fixes.css',
  './offline-sync-workflow.css',
  './geography-controls.js',
  './geography-map.js',
  './ministry-full-headers.js',
  './ministry-full-form.js',
  './manifest.json',
  './favicon.svg',
  './admin-dashboard.html',
  './admin-clean-v1050.css',
  './admin-clean-v1050.js',
  './vendor/leaflet/leaflet.css',
  './vendor/leaflet/leaflet.js',
  './vendor/leaflet/images/layers.png',
  './vendor/leaflet/images/layers-2x.png',
  './vendor/leaflet/images/marker-icon.png',
  './vendor/leaflet/images/marker-icon-2x.png',
  './vendor/leaflet/images/marker-shadow.png',
  './vendor/leaflet-draw/leaflet.draw.css',
  './vendor/leaflet-draw/leaflet.draw.js',
  './vendor/leaflet-draw/images/spritesheet.png',
  './vendor/leaflet-draw/images/spritesheet-2x.png',
  './vendor/leaflet-draw/images/spritesheet.svg',
  './vendor/leaflet-geometryutil/leaflet.geometryutil.js',
  './vendor/feather/feather.min.js',
  './vendor/sqljs/sql-wasm.js',
  './vendor/sqljs/sql-wasm.wasm'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(ASSETS_TO_CACHE.map((asset) => cache.add(asset)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request) || caches.match('./WELCOME.html');
  }
}

async function cacheFirstWithRefresh(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() => null);
  return cached || fetchPromise || offlineOptionalResponse(request);
}

function offlineOptionalResponse(request) {
  if (request.destination === 'image') {
    return new Response(TRANSPARENT_GIF_BYTES, {
      status: 200,
      headers: { 'Content-Type': 'image/gif' }
    });
  }
  return new Response('', { status: 204, statusText: 'Offline optional asset' });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isHtmlRequest =
    event.request.mode === 'navigate' ||
    event.request.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/');

  if (!isSameOrigin) {
    event.respondWith(
      fetch(event.request).catch(() => offlineOptionalResponse(event.request))
    );
    return;
  }

  event.respondWith(
    isHtmlRequest
      ? networkFirst(event.request)
      : cacheFirstWithRefresh(event.request)
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});




