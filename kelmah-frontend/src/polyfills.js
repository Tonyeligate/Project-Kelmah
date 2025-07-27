// Ensure React is properly loaded and all hooks are available
import React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

// Ensure React and all its hooks are available globally
if (typeof window !== 'undefined') {
  window.React = React;
}

// Ensure the hook is available on React object
if (!React.useSyncExternalStore) {
  React.useSyncExternalStore = useSyncExternalStore;
}

// Ensure all hooks are available
const hooks = ['useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 'useMemo', 'useRef', 'useImperativeHandle', 'useLayoutEffect', 'useDebugValue', 'useSyncExternalStore'];

hooks.forEach(hook => {
  if (!React[hook]) {
    console.error(`React hook ${hook} is not available`);
  }
});

export default React; 