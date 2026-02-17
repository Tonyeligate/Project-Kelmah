import { useState, useEffect } from 'react';

/**
 * useInputMode — tracks whether the user is currently interacting via
 * touch or mouse/pointer.
 *
 * Switches to 'touch' on any `touchstart`, back to 'pointer' on `mousemove`
 * that isn't immediately preceded by a touch event (avoids false positives
 * from touch-generated mouse events).
 *
 * @returns {'touch' | 'pointer'}
 */
export default function useInputMode() {
  const [mode, setMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
      ? 'touch'
      : 'pointer'
  );

  useEffect(() => {
    let recentTouch = false;
    let timer;

    const onTouchStart = () => {
      recentTouch = true;
      clearTimeout(timer);
      timer = setTimeout(() => { recentTouch = false; }, 500);
      setMode('touch');
    };

    const onMouseMove = () => {
      if (!recentTouch) setMode('pointer');
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('mousemove', onMouseMove);
      clearTimeout(timer);
    };
  }, []);

  return mode;
}
