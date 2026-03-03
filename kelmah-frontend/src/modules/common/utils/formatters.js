/**
 * Shared currency and date formatting utilities for the Kelmah platform.
 * Centralizes formatting logic that was previously duplicated across 6+ payment pages.
 */

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Standard Ghana Cedi currency formatter.
 * Usage: currencyFormatter.format(1500) → 'GH₵1,500.00'
 */
export const currencyFormatter = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
});

/**
 * Format a currency amount with safe fallback.
 * @param {number|string} amount
 * @param {string} fallback - returned when amount is null/undefined/NaN
 * @returns {string}
 */
export const formatCurrency = (amount, fallback = 'GH₵0.00') => {
  const num = Number(amount);
  if (!Number.isFinite(num)) return fallback;
  return currencyFormatter.format(num);
};

/**
 * Safely format a date value. Returns fallback if the value is null, undefined,
 * or not a valid date.
 *
 * @param {string|number|Date} dateValue - The date to format
 * @param {string} formatStr - date-fns format string (e.g. 'd MMMM yyyy')
 * @param {string} fallback - returned when date is invalid
 * @returns {string}
 */
export const safeFormatDate = (dateValue, formatStr, fallback = '—') => {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return fallback;
    return format(d, formatStr);
  } catch {
    return fallback;
  }
};

/**
 * Safely format a relative time string (e.g. "2 hours ago").
 * @param {string|number|Date} dateValue
 * @param {object} options - passed to formatDistanceToNow
 * @param {string} fallback
 * @returns {string}
 */
export const safeFormatRelative = (dateValue, options = { addSuffix: true }, fallback = '—') => {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return fallback;
    return formatDistanceToNow(d, options);
  } catch {
    return fallback;
  }
};
