import { useState, useEffect } from 'react';

/**
 * usePrefersReducedMotion — returns `true` when the user's OS or browser requests
 * reduced motion (accessibility setting). Use to disable or simplify animations.
 *
 * @returns {boolean}
 */
export default function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  });

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
