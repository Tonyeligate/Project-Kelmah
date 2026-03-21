// Kelmah Service Worker for Ghana Market
// Optimized for poor network conditions and offline functionality

const CACHE_NAME = 'kelmah-v1.0.7-chunk-recovery';
const OFFLINE_URL = '/offline.html';
const HEALTHY_GATEWAY_DB = 'kelmah-gateway-db';
const HEALTHY_GATEWAY_STORE = 'healthyGatewayStore';
const HEALTHY_GATEWAY_KEY = 'lastHealthyGateway';
const SW_DEBUG_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const SW_DEBUG =
  SW_DEBUG_HOSTS.has(self.location.hostname) ||
  self.location.search.includes('sw_debug=1');

const swLog = (...args) => {
  if (SW_DEBUG) console.log(...args);
};

const swWarn = (...args) => {
  if (SW_DEBUG) console.warn(...args);
};

const swError = (...args) => {
  if (SW_DEBUG) console.error(...args);
};

async function openGatewayDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(HEALTHY_GATEWAY_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(HEALTHY_GATEWAY_STORE)) {
        db.createObjectStore(HEALTHY_GATEWAY_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveHealthyGateway(origin) {
  try {
    const db = await openGatewayDb();
    const tx = db.transaction(HEALTHY_GATEWAY_STORE, 'readwrite');
    tx.objectStore(HEALTHY_GATEWAY_STORE).put(
      {
        origin,
        updatedAt: Date.now(),
      },
      HEALTHY_GATEWAY_KEY,
    );
    return tx.complete;
  } catch (error) {
    swWarn('[SW] Failed to persist healthy gateway:', error);
    return null;
  }
}

async function readHealthyGateway() {
  try {
    const db = await openGatewayDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HEALTHY_GATEWAY_STORE, 'readonly');
      const request = tx
        .objectStore(HEALTHY_GATEWAY_STORE)
        .get(HEALTHY_GATEWAY_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    swWarn('[SW] Failed to read healthy gateway cache:', error);
    return null;
  }
}

async function fetchAndCacheGatewayStatus() {
  try {
    const [runtimeConfig, healthResponse] = await Promise.all([
      fetch('/runtime-config.json', { credentials: 'omit' }).then((res) =>
        res.ok ? res.json() : null,
      ),
      fetch('/api/health/aggregate', {
        credentials: 'omit',
        headers: { 'X-SW-Gateway-Probe': 'kelmah' },
      }).then((res) => (res.ok ? res.clone() : null)),
    ]);

    if (runtimeConfig?.apiGatewayUrl) {
      await saveHealthyGateway(runtimeConfig.apiGatewayUrl);
    }

    if (healthResponse) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put('/api/health/aggregate', healthResponse);
    }
  } catch (error) {
    swWarn('[SW] Gateway status fetch failed:', error);
  }
}
// Critical resources to cache immediately (avoid CRA-specific paths)
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// API endpoints to cache for offline
const CACHE_API_PATTERNS = [
  '/api/jobs',
  '/api/workers',
  '/api/users/profile',
  '/api/messages/conversations',
  '/api/payments/wallet',
];

// Resources that should always be fetched fresh
const NETWORK_FIRST_PATTERNS = [
  '/api/auth/',
  '/api/payments/transactions',
  '/api/messages/send',
  '/api/jobs/apply',
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  swLog('🔧 Service Worker installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        swLog('📦 Caching core resources for offline access');
        // Cache each resource individually — SPA routes may fail and that's OK
        const results = await Promise.allSettled(
          PRECACHE_URLS.map((url) => cache.add(url).catch(() => null))
        );
        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length > 0) {
          swWarn(`⚠️ ${failed.length}/${PRECACHE_URLS.length} precache URLs skipped (SPA routes)`);
        }
      })
      .then(() => fetchAndCacheGatewayStatus())
      .then(() => {
        swLog('✅ Service Worker installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        swError('❌ Service Worker installation failed:', error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  swLog('🚀 Service Worker activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              swLog('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        swLog('✅ Service Worker activated');
        return self.clients.claim();
      })
      .then(() => fetchAndCacheGatewayStatus())
      .then(() => {
        self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: 'GATEWAY_CACHE_READY' }),
          );
        });
      }),
  );
});

async function clearRuntimeCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => /kelmah|vite|workbox|assets|static/i.test(name))
        .map((name) => caches.delete(name).catch(() => false)),
    );
  } catch (error) {
    swWarn('[SW] Failed to clear runtime caches:', error);
  }
}

self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'GET_CACHED_GATEWAY') {
    event.waitUntil(
      (async () => {
        const cached = await readHealthyGateway();
        event.source?.postMessage({
          type: 'CACHED_GATEWAY_RESULT',
          payload: cached,
        });
      })(),
    );
  } else if (data.type === 'CACHE_HEALTHY_GATEWAY' && data.payload) {
    event.waitUntil(saveHealthyGateway(data.payload));
  } else if (data.type === 'KELMAH_CLEAR_RUNTIME_CACHES') {
    event.waitUntil(clearRuntimeCaches());
  } else if (data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip requests to other origins
  if (url.origin !== location.origin && !url.href.includes('/api/')) {
    return;
  }

  // Skip development files and hot reload requests
  if (
    url.pathname.includes('/src/') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/.vite/') ||
    url.pathname.includes('/__vite_ping') ||
    url.pathname.includes('?import') ||
    url.searchParams.has('import') ||
    url.searchParams.has('t') ||
    request.url.includes('main.jsx') ||
    request.url.includes('vite/client')
  ) {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (request.destination === 'document') {
    // HTML documents - Network first, fallback to cache, then offline page
    event.respondWith(handleDocumentRequest(request));
  } else if (isAPIRequest(request.url)) {
    // API requests - Different strategies based on endpoint
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(request.url)) {
    // Static assets - Cache first with network fallback
    event.respondWith(handleStaticAssetRequest(request));
  } else {
    // Other requests - Network first
    event.respondWith(handleNetworkFirstRequest(request));
  }
});

// Handle document requests (HTML pages)
async function handleDocumentRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);

    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    swLog('📱 Network failed, serving from cache:', request.url);

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Final fallback to offline page
    return caches.match(OFFLINE_URL);
  }
}

// Handle API requests with smart caching
async function handleAPIRequest(request) {
  const url = request.url;

  // Authentication requests - always network
  if (NETWORK_FIRST_PATTERNS.some((pattern) => url.includes(pattern))) {
    return handleNetworkOnlyRequest(request);
  }

  // Cacheable API requests - stale while revalidate
  if (CACHE_API_PATTERNS.some((pattern) => url.includes(pattern))) {
    return handleStaleWhileRevalidate(request);
  }

  // Default: network first with cache fallback
  return handleNetworkFirstRequest(request);
}

// Handle static assets (JS, CSS, images)
async function handleStaticAssetRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background
    updateCacheInBackground(request);
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const response = await fetch(request);

    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    swError('Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Network first strategy
async function handleNetworkFirstRequest(request) {
  // Create timeout controller scoped for both try/catch paths
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  try {
    // Create timeout promise for Ghana's network conditions

    const response = await fetch(request, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    if (isAPIRequest(request.url)) {
      const isTimeout = error?.name === 'AbortError';
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: isTimeout
              ? 'The request timed out before the server responded.'
              : 'The request could not reach the server.',
            code: isTimeout ? 'REQUEST_TIMEOUT' : 'NETWORK_FAILURE',
          },
        }),
        {
          status: isTimeout ? 504 : 503,
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Worker-Fallback': 'network-first',
          },
        },
      );
    }

    throw error;
  }
}

// Network only strategy (for critical real-time data)
async function handleNetworkOnlyRequest(request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort('Request timeout'),
    15000,
  ); // Increased timeout for cold starts

  try {
    const response = await fetch(request, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Stale while revalidate strategy
async function handleStaleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const networkResponsePromise = (async () => {
    try {
      const response = await fetch(request);
      if (response && response.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      // Silent fail: stale-while-revalidate should not spam console on transient failures
      return null;
    }
  })();

  // Return cached version immediately if available
  if (cachedResponse) {
    // Kick off background update — catch to prevent unhandled rejection
    networkResponsePromise.catch(() => {});
    return cachedResponse;
  }

  // No cache, wait for network
  return networkResponsePromise;
}

// Update cache in background
async function updateCacheInBackground(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
  } catch (error) {
    // Silent fail for non-critical background update
  }
}

// Helper functions
function isAPIRequest(url) {
  return url.includes('/api/');
}

function isStaticAsset(url) {
  return (
    url.includes('/static/') ||
    url.includes('/assets/') ||
    url.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/)
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  swLog('🔄 Background sync event:', event.tag);

  if (event.tag === 'sync-job-applications') {
    event.waitUntil(syncJobApplications());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments());
  }
});

// Sync offline job applications
async function syncJobApplications() {
  try {
    // Get offline job applications from IndexedDB
    const offlineApplications = await getOfflineJobApplications();

    for (const application of offlineApplications) {
      try {
        // Job application endpoint requires jobId in path: POST /api/jobs/:jobId/apply
        const jobId = application.data?.jobId || application.data?.job;
        if (!jobId) {
          swError('Missing jobId for offline application:', application.id);
          continue;
        }
        const response = await fetch(`/api/jobs/${jobId}/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${application.token}`,
          },
          body: JSON.stringify(application.data),
        });

        if (response.ok) {
          await removeOfflineJobApplication(application.id);
          swLog('✅ Synced job application:', application.id);
        }
      } catch (error) {
        swError('Failed to sync job application:', error);
      }
    }
  } catch (error) {
    swError('Job applications sync failed:', error);
  }
}

// Sync offline messages
async function syncMessages() {
  try {
    const offlineMessages = await getOfflineMessages();

    for (const message of offlineMessages) {
      try {
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${message.token}`,
          },
          body: JSON.stringify(message.data),
        });

        if (response.ok) {
          await removeOfflineMessage(message.id);
          swLog('✅ Synced message:', message.id);
        }
      } catch (error) {
        swError('Failed to sync message:', error);
      }
    }
  } catch (error) {
    swError('Messages sync failed:', error);
  }
}

// Sync offline payments
async function syncPayments() {
  try {
    const offlinePayments = await getOfflinePayments();

    for (const payment of offlinePayments) {
      try {
        const response = await fetch('/api/payments/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payment.token}`,
          },
          body: JSON.stringify(payment.data),
        });

        if (response.ok) {
          await removeOfflinePayment(payment.id);
          swLog('✅ Synced payment:', payment.id);
        }
      } catch (error) {
        swError('Failed to sync payment:', error);
      }
    }
  } catch (error) {
    swError('Payments sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  swLog('📲 Push notification received:', event);

  const options = {
    body: 'You have new updates on Kelmah',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    tag: 'kelmah-notification',
    actions: [
      {
        action: 'explore',
        title: 'Open Kelmah',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  let notificationTitle = 'Kelmah';

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationTitle = payload?.title || notificationTitle;
      options.body = payload?.body || options.body;
      options.data = { ...options.data, ...(payload?.data || {}) };
    } catch (error) {
      // Some providers send plain-text push payloads.
      const fallbackBody = event.data.text();
      if (fallbackBody) {
        options.body = fallbackBody;
      }
      swWarn('[SW] Push payload was not valid JSON:', error);
    }
  }

  event.waitUntil(self.registration.showNotification(notificationTitle, options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  swLog('🔔 Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(clients.openWindow('/'));
});

// Placeholder functions for IndexedDB operations
// These would be implemented with a proper IndexedDB wrapper
async function getOfflineJobApplications() {
  return [];
}
async function removeOfflineJobApplication(id) { }
async function getOfflineMessages() {
  return [];
}
async function removeOfflineMessage(id) { }
async function getOfflinePayments() {
  return [];
}
async function removeOfflinePayment(id) { }

swLog('🇬🇭 Kelmah Service Worker loaded - Optimized for Ghana market (v1.0.7 chunk recovery)');
