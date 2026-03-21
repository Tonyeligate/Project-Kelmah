/**
 * Progressive Web App Helper Functions
 * Optimized for Ghana's mobile market and network conditions
 */

import { api } from '../services/apiClient';

const HEALTHY_GATEWAY_DB = 'kelmah-gateway-db';
const HEALTHY_GATEWAY_STORE = 'healthyGatewayStore';
const HEALTHY_GATEWAY_KEY = 'lastHealthyGateway';
const BOOTSTRAP_GATEWAY_SESSION_KEY = 'kelmah:bootstrapGateway';
const BOOTSTRAP_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

const openGatewayDb = () => {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable in this context'));
  }

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
};

const saveHealthyGateway = async (origin) => {
  if (!origin) return;
  let db;
  try {
    db = await openGatewayDb();
    const tx = db.transaction(HEALTHY_GATEWAY_STORE, 'readwrite');
    tx.objectStore(HEALTHY_GATEWAY_STORE).put(
      {
        origin,
        updatedAt: Date.now(),
      },
      HEALTHY_GATEWAY_KEY,
    );
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[PWA] Failed to persist healthy gateway:', error);
  } finally {
    db?.close();
  }
};

const readHealthyGateway = async () => {
  let db;
  try {
    db = await openGatewayDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HEALTHY_GATEWAY_STORE, 'readonly');
      const store = tx.objectStore(HEALTHY_GATEWAY_STORE);
      const request = store.get(HEALTHY_GATEWAY_KEY);
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    db?.close();
    if (import.meta.env.DEV) console.warn('[PWA] Failed to read healthy gateway cache:', error);
    return null;
  }
};

const requestCachedGatewayFromSW = () => {
  if (
    typeof navigator === 'undefined' ||
    !navigator.serviceWorker?.controller
  ) {
    return null;
  }
  return new Promise((resolve) => {
    const listener = (event) => {
      if (event.data?.type === 'CACHED_GATEWAY_RESULT') {
        navigator.serviceWorker.removeEventListener('message', listener);
        resolve(event.data.payload || null);
      }
    };
    navigator.serviceWorker.addEventListener('message', listener);
    navigator.serviceWorker.controller.postMessage({
      type: 'GET_CACHED_GATEWAY',
    });

    // Timeout fallback after 1.5s
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('message', listener);
      resolve(null);
    }, 1500);
  });
};

// Service Worker Registration with Ghana-specific optimizations
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    // Skip SW registration if the script isn't present (e.g., Vercel without public asset)
    try {
      const headCheck = await fetch('/sw.js', { method: 'HEAD' });
      if (!headCheck.ok) {
        if (import.meta.env.DEV) console.warn(
          'ServiceWorker script not found at /sw.js, skipping registration',
        );
        return null;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn(
        'ServiceWorker script HEAD check failed, skipping registration',
        error,
      );
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });

      if (import.meta.env.DEV) console.log('ServiceWorker registered successfully:', registration.scope);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New version available - show update notification
              showUpdateNotification();
            }
          });
        }
      });

      // Check for waiting service worker
      if (registration.waiting) {
        showUpdateNotification();
      }

      return registration;
    } catch (error) {
      if (import.meta.env.DEV) console.error('ServiceWorker registration failed:', error);
      return null;
    }
  }
  return null;
};

const fetchRuntimeHints = async () => {
  try {
    const response = await fetch('/runtime-config.json', {
      method: 'GET',
      credentials: 'omit',
    });
    if (response.ok) {
      const config = await response.json();
      if (config?.apiGatewayUrl) {
        await saveHealthyGateway(config.apiGatewayUrl);
        if (typeof window !== 'undefined' && window.sessionStorage) {
          try {
            window.sessionStorage.setItem(
              BOOTSTRAP_GATEWAY_SESSION_KEY,
              JSON.stringify({
                origin: config.apiGatewayUrl,
                updatedAt: Date.now(),
              }),
            );
          } catch (error) {
            if (import.meta.env.DEV) console.warn(
              '[PWA] Failed to cache bootstrap gateway hint:',
              error,
            );
          }
        }
        navigator.serviceWorker?.controller?.postMessage({
          type: 'CACHE_HEALTHY_GATEWAY',
          payload: config.apiGatewayUrl,
        });
      }
      return config;
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('[PWA] Runtime config fetch failed:', error);
  }
  return null;
};

const isBrowserEnvironment = () => typeof window !== 'undefined';

// Show update notification to user
const showUpdateNotification = () => {
  if (!isBrowserEnvironment()) return;
  window.dispatchEvent(new CustomEvent('sw:updateAvailable'));
};

// Update PWA
const updatePWA = () => {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) {
    window.location.reload();
    return Promise.resolve(false);
  }

  let fallbackTimer = null;
  const safeReload = () => {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    window.location.reload();
  };

  const handleControllerChange = () => {
    safeReload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, {
    once: true,
  });

  return navigator.serviceWorker
    .getRegistration()
    .then((registration) => {
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      } else {
        safeReload();
        return false;
      }

      // Fallback in case controllerchange is not emitted on this browser.
      fallbackTimer = setTimeout(() => {
        safeReload();
      }, 3000);

      return true;
    })
    .catch(() => {
      safeReload();
      return false;
    });
};

export const applyPwaUpdate = async () => {
  if (!isBrowserEnvironment()) {
    return false;
  }

  try {
    return await updatePWA();
  } catch (error) {
    if (import.meta.env.DEV) console.warn('PWA update failed:', error);
    return false;
  }
};

// Check if app is installed
export const isAppInstalled = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

// Install prompt handling
let deferredPrompt = null;

// Listen for install prompt
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    if (import.meta.env.DEV) console.log('PWA install prompt triggered');
    e.preventDefault();
    deferredPrompt = e;

    if (shouldShowInstallBanner()) {
      window.dispatchEvent(new CustomEvent('pwa:installAvailable'));
    }
  });
}

// Trigger the browser's native install prompt when available.
export const requestPwaInstall = async () => {
  let prompted = false;
  if (deferredPrompt) {
    prompted = true;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (import.meta.env.DEV) console.log('PWA install outcome:', outcome);

    if (outcome === 'accepted') {
      // Track installation success
      trackPWAInstall('accepted');
    } else {
      trackPWAInstall('dismissed');
    }

    deferredPrompt = null;
  }

  dismissInstallBanner();
  return prompted;
};

// Dismiss install banner
const dismissInstallBanner = () => {
  // Remember user dismissed banner (don't show again for 7 days)
  localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
};

// Check if we should show install banner
export const shouldShowInstallBanner = () => {
  if (isAppInstalled()) return false;

  const dismissed = localStorage.getItem('pwa_banner_dismissed');
  if (dismissed) {
    const dismissedTime = parseInt(dismissed);
    const weekInMs = 7 * 24 * 60 * 60 * 1000;

    if (Date.now() - dismissedTime < weekInMs) {
      return false;
    }
  }

  return true;
};

// Track PWA installation for analytics
const trackPWAInstall = (outcome) => {
  try {
    // Send to analytics
    if (isBrowserEnvironment() && typeof window.gtag === 'function') {
      window.gtag('event', 'pwa_install', {
        outcome: outcome,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    }

    // Log for debugging
    if (import.meta.env.DEV) console.log('PWA install tracked:', outcome);
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to track PWA install:', error);
  }
};

// Network quality detection for Ghana
export const detectNetworkQuality = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
      type: connection.type,
    };
  }

  return null;
};

// Optimize for Ghana's network conditions
export const optimizeForGhanaNetworks = () => {
  const networkInfo = detectNetworkQuality();

  if (networkInfo) {
    // Apply optimizations based on network quality
    switch (networkInfo.effectiveType) {
      case 'slow-2g':
      case '2g':
        // Ultra-lite mode for 2G networks
        document.documentElement.classList.add('network-2g');
        if (import.meta.env.DEV) console.log('2G network detected - enabling ultra-lite mode');
        break;

      case '3g':
        // Balanced mode for 3G
        document.documentElement.classList.add('network-3g');
        if (import.meta.env.DEV) console.log('3G network detected - enabling balanced mode');
        break;

      case '4g':
        // Full experience for 4G
        document.documentElement.classList.add('network-4g');
        if (import.meta.env.DEV) console.log('4G network detected - enabling full experience');
        break;
    }

    // Save data mode
    if (networkInfo.saveData) {
      document.documentElement.classList.add('save-data');
      if (import.meta.env.DEV) console.log('Data saver mode detected');
    }
  }
};

// Background sync registration
export const registerBackgroundSync = async (tag) => {
  if (
    'serviceWorker' in navigator &&
    'sync' in window.ServiceWorkerRegistration.prototype
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      if (import.meta.env.DEV) console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
};

// Push notification setup
export const setupPushNotifications = async () => {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    try {
      // Request permission
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            'BPKgG7qQ8HHgIJL1MHj9rW3sFu0JVhLvKwJ1w1HGpOjOJ6T5XlNE4C2Kj3mPqR4tLqE3N9D7qM8jL5rQ2hK6gL1Y9', // Replace with your VAPID public key
          ),
        });

        if (import.meta.env.DEV) console.log('Push notification subscription:', subscription);

        // Send subscription to server
        await sendSubscriptionToServer(subscription);

        return subscription;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Push notification setup failed:', error);
    }
  }

  return null;
};

// Helper function to convert VAPID key
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const sendSubscriptionToServer = async (subscription) => {
  try {
    await api.post('/notifications/push/subscribe', subscription);
    if (import.meta.env.DEV) console.log('Subscription sent to server successfully');
    return { success: true };
  } catch (error) {
    if (import.meta.env.DEV) console.warn(
      'Push subscription send failed (non-blocking):',
      error?.message || error,
    );
    return { success: false };
  }
};

// App lifecycle events
export const handleAppLifecycle = () => {
  // App install event
  window.addEventListener('appinstalled', () => {
    if (import.meta.env.DEV) console.log('PWA was installed');
    trackPWAInstall('installed');

    // Hide any install prompts
    dismissInstallBanner();

    // Show welcome message
    showWelcomeMessage();
  });

  // Visibility change (app backgrounded/foregrounded)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (import.meta.env.DEV) console.log('App backgrounded');
      // Pause non-critical operations
    } else {
      if (import.meta.env.DEV) console.log('App foregrounded');
      // Resume operations, check for updates
      checkForUpdates();
    }
  });
};

// Show welcome message after install
const showWelcomeMessage = () => {
  if (!isBrowserEnvironment()) return;
  window.dispatchEvent(new CustomEvent('pwa:installed'));
};

// Check for app updates
const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to check for updates:', error);
    }
  }
};

// Initialize PWA features
export const initializePWA = async () => {
  if (import.meta.env.DEV) console.log('Initializing PWA features for Ghana 🇬🇭');

  const isDev =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    Boolean(import.meta.env.DEV);

  // Prime runtime config + cached gateway before app boot
  const cachedGateway = await Promise.race([
    requestCachedGatewayFromSW(),
    readHealthyGateway(),
  ]).catch(() => null);
  if (cachedGateway?.origin) {
    const isFresh = !cachedGateway.updatedAt
      ? true
      : Date.now() - Number(cachedGateway.updatedAt) <= BOOTSTRAP_TTL_MS;
    if (isFresh && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(
          BOOTSTRAP_GATEWAY_SESSION_KEY,
          JSON.stringify({
            origin: cachedGateway.origin,
            updatedAt: cachedGateway.updatedAt || Date.now(),
          }),
        );
      } catch (error) {
        if (import.meta.env.DEV) console.warn('[PWA] Failed to prime bootstrap gateway hint:', error);
      }
    }
  }
  fetchRuntimeHints();

  // Register service worker
  // NOTE: In development, Service Workers commonly cause blank-screen failures
  // (e.g., cached HTML/offline fallback served for JS modules -> "Invalid or unexpected token").
  // Keep SW behavior for production builds only.
  if (!isDev) {
    await registerServiceWorker();
  } else {
    if (import.meta.env.DEV) console.log('[PWA] DEV mode detected: skipping Service Worker registration');
  }

  // Optimize for Ghana networks
  optimizeForGhanaNetworks();

  // Handle app lifecycle
  handleAppLifecycle();

  // Setup push notifications (optional)
  if (shouldShowInstallBanner()) {
    // Will show install banner if appropriate
  }

  // Register background sync (production only; relies on SW)
  if (!isDev) {
    await registerBackgroundSync('kelmah-background-sync');
  }

  if (import.meta.env.DEV) console.log('PWA initialization complete');
};

// No window-level exports needed (avoid inline handlers for better security)
