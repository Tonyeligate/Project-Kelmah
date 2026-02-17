import { useCallback, useRef } from 'react';

/**
 * useLongPress — fires callback after holding for `delay` ms on touch devices.
 * Cancels on scroll (>10 px move) or early release.
 * Optionally triggers haptic feedback via navigator.vibrate.
 *
 * @param {Function} onLongPress   – called with the original TouchEvent
 * @param {Object}   [options]
 * @param {number}   [options.delay=500]      – hold duration in ms
 * @param {number}   [options.moveThreshold=10] – px movement to cancel
 * @param {boolean}  [options.vibrate=true]    – haptic feedback
 * @returns {{ onTouchStart, onTouchMove, onTouchEnd, onContextMenu }}
 */
export default function useLongPress(onLongPress, options = {}) {
  const { delay = 500, moveThreshold = 10, vibrate = true } = options;
  const timerRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (e) => {
      firedRef.current = false;
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };

      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        if (vibrate && navigator.vibrate) navigator.vibrate(50);
        onLongPress(e);
      }, delay);
    },
    [onLongPress, delay, vibrate],
  );

  const onTouchMove = useCallback(
    (e) => {
      if (!timerRef.current) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - startPos.current.x);
      const dy = Math.abs(touch.clientY - startPos.current.y);
      if (dx > moveThreshold || dy > moveThreshold) {
        clear();
      }
    },
    [clear, moveThreshold],
  );

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  // Prevent native context menu when long-press fires
  const onContextMenu = useCallback(
    (e) => {
      if (firedRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [],
  );

  return { onTouchStart, onTouchMove, onTouchEnd, onContextMenu };
}
