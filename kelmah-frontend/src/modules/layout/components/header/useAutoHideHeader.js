import { useState, useEffect } from 'react';

/**
 * useAutoHideHeader — manages header show/hide behaviour.
 * On desktop with autoShowMode: shows when mouse is near the top, hides otherwise.
 * On mobile: hides on scroll-down, shows on scroll-up.
 * Returns `isHeaderVisible` boolean.
 */
export default function useAutoHideHeader(
  autoShowMode,
  isMobile,
  disableAutoHide = false,
) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    if (!disableAutoHide) {
      return;
    }

    setIsHeaderVisible(true);
  }, [disableAutoHide]);

  // Desktop: mouse-proximity based show/hide
  useEffect(() => {
    if (disableAutoHide || !autoShowMode || isMobile) return;
    const handleMouseMove = (e) => {
      setIsHeaderVisible(e.clientY < 50);
    };
    const handleMouseLeave = () => setIsHeaderVisible(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [autoShowMode, isMobile, disableAutoHide]);

  // Mobile: scroll-direction based show/hide
  useEffect(() => {
    if (disableAutoHide || !isMobile) return;
    let lastScrollY = window.scrollY;
    let ticking = false;
    const handleScroll = () => {
      const y = window.scrollY;
      setIsHeaderVisible(y < lastScrollY || y < 50);
      lastScrollY = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile, disableAutoHide]);

  return isHeaderVisible;
}
