/**
 * Progressive Web App Helper Functions
 * Optimized for Ghana's mobile market and network conditions
 */

// Service Worker Registration with Ghana-specific optimizations
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    // Skip SW registration if the script isn't present (e.g., Vercel without public asset)
    try {
      const headCheck = await fetch('/sw.js', { method: 'HEAD' });
      if (!headCheck.ok) {
        console.warn('ServiceWorker script not found at /sw.js, skipping registration');
        return null;
      }
    } catch (_) {
      console.warn('ServiceWorker script HEAD check failed, skipping registration');
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('ServiceWorker registered successfully:', registration.scope);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
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
      console.error('ServiceWorker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Show update notification to user
const showUpdateNotification = () => {
  // Create custom update notification
  const notification = document.createElement('div');
  notification.id = 'pwa-update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #FFD700 0%, #FFC000 100%);
      color: #000;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(255,215,0,0.3);
      z-index: 10000;
      font-weight: 600;
      max-width: 90vw;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="margin-bottom: 8px;">🚀 New Kelmah Update Available!</div>
      <div style="font-size: 12px; opacity: 0.8; margin-bottom: 12px;">
        Enhanced performance and new features
      </div>
      <button onclick="updatePWA()" style="
        background: #000;
        color: #FFD700;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        margin-right: 8px;
      ">Update Now</button>
      <button onclick="dismissUpdate()" style="
        background: transparent;
        color: #000;
        border: 1px solid #000;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
      ">Later</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    dismissUpdate();
  }, 10000);
};

// Update PWA
window.updatePWA = () => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
  window.location.reload();
};

// Dismiss update notification
window.dismissUpdate = () => {
  const notification = document.getElementById('pwa-update-notification');
  if (notification) {
    notification.remove();
  }
};

// Check if app is installed
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
};

// Install prompt handling
let deferredPrompt = null;

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install prompt triggered');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install banner for Ghana users
  showInstallBanner();
});

// Show custom install banner
const showInstallBanner = () => {
  if (isAppInstalled()) return;
  
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #FFD700;
      padding: 12px 16px;
      z-index: 10000;
      border-bottom: 2px solid #FFD700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 20px;">📱</span>
          <div>
            <div style="font-weight: 700; font-size: 14px;">Install Kelmah App</div>
            <div style="font-size: 11px; opacity: 0.8;">Works offline • Fast loading • Save data</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="installPWA()" style="
            background: #FFD700;
            color: #000;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
          ">Install</button>
          <button onclick="dismissInstallBanner()" style="
            background: transparent;
            color: #FFD700;
            border: 1px solid #FFD700;
            padding: 8px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
          ">×</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    dismissInstallBanner();
  }, 15000);
};

// Install PWA
window.installPWA = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('PWA install outcome:', outcome);
    
    if (outcome === 'accepted') {
      // Track installation success
      trackPWAInstall('accepted');
    } else {
      trackPWAInstall('dismissed');
    }
    
    deferredPrompt = null;
  }
  
  dismissInstallBanner();
};

// Dismiss install banner
window.dismissInstallBanner = () => {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.remove();
  }
  
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
    if (typeof gtag !== 'undefined') {
      gtag('event', 'pwa_install', {
        outcome: outcome,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    }
    
    // Log for debugging
    console.log('PWA install tracked:', outcome);
  } catch (error) {
    console.error('Failed to track PWA install:', error);
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
      type: connection.type
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
        console.log('2G network detected - enabling ultra-lite mode');
        break;
        
      case '3g':
        // Balanced mode for 3G
        document.documentElement.classList.add('network-3g');
        console.log('3G network detected - enabling balanced mode');
        break;
        
      case '4g':
        // Full experience for 4G
        document.documentElement.classList.add('network-4g');
        console.log('4G network detected - enabling full experience');
        break;
    }
    
    // Save data mode
    if (networkInfo.saveData) {
      document.documentElement.classList.add('save-data');
      console.log('Data saver mode detected');
    }
  }
};

// Background sync registration
export const registerBackgroundSync = async (tag) => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
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
            'BPKgG7qQ8HHgIJL1MHj9rW3sFu0JVhLvKwJ1w1HGpOjOJ6T5XlNE4C2Kj3mPqR4tLqE3N9D7qM8jL5rQ2hK6gL1Y9' // Replace with your VAPID public key
          )
        });
        
        console.log('Push notification subscription:', subscription);
        
        // Send subscription to server
        await sendSubscriptionToServer(subscription);
        
        return subscription;
      }
    } catch (error) {
      console.error('Push notification setup failed:', error);
    }
  }
  
  return null;
};

// Helper function to convert VAPID key
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Send subscription to server
const sendSubscriptionToServer = async (subscription) => {
  try {
    const response = await fetch('/api/notifications/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(subscription)
    });
    if (!response.ok) {
      // Fail softly; push endpoints may not be active yet
      console.warn('Push subscribe endpoint not available:', response.status, await response.text().catch(() => ''));
      return { success: false };
    }
    console.log('Subscription sent to server successfully');
    return { success: true };
  } catch (error) {
    console.warn('Push subscription send failed (non-blocking):', error?.message || error);
    return { success: false };
  }
};

// App lifecycle events
export const handleAppLifecycle = () => {
  // App install event
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    trackPWAInstall('installed');
    
    // Hide any install prompts
    dismissInstallBanner();
    
    // Show welcome message
    showWelcomeMessage();
  });
  
  // Visibility change (app backgrounded/foregrounded)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('App backgrounded');
      // Pause non-critical operations
    } else {
      console.log('App foregrounded');
      // Resume operations, check for updates
      checkForUpdates();
    }
  });
};

// Show welcome message after install
const showWelcomeMessage = () => {
  const welcome = document.createElement('div');
  welcome.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: #FFD700;
      padding: 32px;
      border-radius: 16px;
      border: 2px solid #FFD700;
      text-align: center;
      z-index: 10000;
      max-width: 90vw;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
      <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Welcome to Kelmah!</div>
      <div style="font-size: 14px; opacity: 0.8; margin-bottom: 20px;">
        App installed successfully. Now you can access Kelmah even when offline!
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: #FFD700;
        color: #000;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      ">Get Started</button>
    </div>
  `;
  
  document.body.appendChild(welcome);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (welcome.parentElement) {
      welcome.remove();
    }
  }, 5000);
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
      console.error('Failed to check for updates:', error);
    }
  }
};

// Initialize PWA features
export const initializePWA = async () => {
  console.log('Initializing PWA features for Ghana 🇬🇭');
  
  // Register service worker
  await registerServiceWorker();
  
  // Optimize for Ghana networks
  optimizeForGhanaNetworks();
  
  // Handle app lifecycle
  handleAppLifecycle();
  
  // Setup push notifications (optional)
  if (shouldShowInstallBanner()) {
    // Will show install banner if appropriate
  }
  
  // Register background sync
  await registerBackgroundSync('kelmah-background-sync');
  
  console.log('PWA initialization complete');
};