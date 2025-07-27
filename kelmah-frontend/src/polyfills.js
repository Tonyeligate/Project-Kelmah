// React 18 useSyncExternalStore polyfill
import React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

// Ensure the hook is available on React object
if (!React.useSyncExternalStore) {
  React.useSyncExternalStore = useSyncExternalStore;
}

export default React; 