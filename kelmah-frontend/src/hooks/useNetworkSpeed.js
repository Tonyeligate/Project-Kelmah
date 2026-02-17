import { useState, useEffect } from 'react';

/**
 * useNetworkSpeed — exposes connection type and effective speed via the
 * Network Information API (`navigator.connection`).
 *
 * Returns a simple tier ('slow' | 'medium' | 'fast') alongside raw values
 * so consumers can progressively degrade features (e.g. disable animations
 * on 2G, lower image quality on 3G).
 *
 * Falls back to 'unknown' when the API is unavailable.
 */
export default function useNetworkSpeed() {
  const getConnectionInfo = () => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return { effectiveType: 'unknown', downlink: null, rtt: null, saveData: false };
    return {
      effectiveType: conn.effectiveType || 'unknown', // '2g' | '3g' | '4g' | 'slow-2g'
      downlink: conn.downlink ?? null,                 // Mbps
      rtt: conn.rtt ?? null,                           // ms
      saveData: conn.saveData || false,
    };
  };

  const tierFromType = (effectiveType, saveData) => {
    if (saveData) return 'slow';
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow';
      case '3g':
        return 'medium';
      case '4g':
        return 'fast';
      default:
        return 'unknown';
    }
  };

  const initial = getConnectionInfo();
  const [info, setInfo] = useState(initial);
  const [tier, setTier] = useState(tierFromType(initial.effectiveType, initial.saveData));

  useEffect(() => {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return;

    const handleChange = () => {
      const next = getConnectionInfo();
      setInfo(next);
      setTier(tierFromType(next.effectiveType, next.saveData));
    };

    conn.addEventListener('change', handleChange);
    return () => conn.removeEventListener('change', handleChange);
  }, []);

  return { ...info, tier, isSlow: tier === 'slow' };
}
