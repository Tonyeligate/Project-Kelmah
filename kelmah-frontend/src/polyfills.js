// Simple polyfill without React modification to prevent initialization issues
import { useSyncExternalStore } from 'use-sync-external-store/shim';

// Just ensure the hook is available - don't modify React object
if (typeof window !== 'undefined' && window.React) {
  if (!window.React.useSyncExternalStore) {
    window.React.useSyncExternalStore = useSyncExternalStore;
  }
}

// Debug module loading order
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
  console.log('🔧 Polyfills loaded');
}

export { useSyncExternalStore };
