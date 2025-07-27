// Runtime fix for Vercel React undefined issue
(function() {
  'use strict';
  
  // Ensure React is available globally before any modules load
  if (typeof window !== 'undefined' && !window.React) {
    // Create a minimal React stub to prevent undefined errors
    window.React = {
      useState: function() { return [null, function() {}]; },
      useEffect: function() {},
      useContext: function() { return null; },
      useReducer: function() { return [null, function() {}]; },
      useCallback: function(fn) { return fn; },
      useMemo: function(fn) { return fn(); },
      useRef: function() { return { current: null }; },
      useImperativeHandle: function() {},
      useLayoutEffect: function() {},
      useDebugValue: function() {},
      useSyncExternalStore: function() { return null; },
      createElement: function() { return null; },
      Fragment: 'div'
    };
    
    console.log('React stub initialized for Vercel compatibility');
  }
})(); 