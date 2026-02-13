/**
 * storageQuota.js — Browser storage quota monitoring utility
 *
 * Detects when browser storage is nearing capacity (FILE_ERROR_NO_SPACE)
 * and logs a warning so developers / advanced users know to clear storage.
 */

const QUOTA_WARNING_THRESHOLD = 0.9; // warn at 90 % usage

/**
 * Check available browser storage and warn if nearing capacity.
 * Safe to call on startup — resolves silently when the API is unavailable.
 */
export async function checkStorageQuota() {
  try {
    if (!navigator?.storage?.estimate) return; // API unavailable

    const { usage, quota } = await navigator.storage.estimate();
    if (!quota) return;

    const usagePercent = usage / quota;
    const usageMB = (usage / 1024 / 1024).toFixed(1);
    const quotaMB = (quota / 1024 / 1024).toFixed(1);

    if (usagePercent >= QUOTA_WARNING_THRESHOLD) {
      console.warn(
        `⚠️ Browser storage ${(usagePercent * 100).toFixed(0)}% full (${usageMB} MB / ${quotaMB} MB). ` +
          'Consider clearing site data to avoid FILE_ERROR_NO_SPACE errors.'
      );
    }
  } catch {
    // Non-critical — silently ignore
  }
}
