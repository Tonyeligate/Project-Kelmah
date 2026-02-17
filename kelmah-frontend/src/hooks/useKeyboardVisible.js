import { useState, useEffect } from 'react';

/**
 * useKeyboardVisible — detects when the virtual keyboard is open on mobile.
 * Uses the Visual Viewport API (supported in modern browsers). Falls back
 * to a resize heuristic when viewport API is unavailable.
 *
 * @returns {{ isKeyboardVisible: boolean, keyboardHeight: number }}
 */
export default function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;

    if (viewport) {
      const handleResize = () => {
        const diff = window.innerHeight - viewport.height;
        const visible = diff > 100; // threshold for keyboard vs toolbar
        setIsKeyboardVisible(visible);
        setKeyboardHeight(visible ? diff : 0);
      };

      viewport.addEventListener('resize', handleResize);
      viewport.addEventListener('scroll', handleResize);
      return () => {
        viewport.removeEventListener('resize', handleResize);
        viewport.removeEventListener('scroll', handleResize);
      };
    }

    // Fallback: listen for window resize (less accurate)
    const initialHeight = window.innerHeight;
    const handleResize = () => {
      const diff = initialHeight - window.innerHeight;
      const visible = diff > 100;
      setIsKeyboardVisible(visible);
      setKeyboardHeight(visible ? diff : 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}
