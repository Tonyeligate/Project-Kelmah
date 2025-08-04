/**
 * Utility functions for formatting various data types
 */

/**
 * Format currency with appropriate symbol and locale
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'GHS')
 * @param {string} locale - Locale for formatting (default: 'en-GH')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'GHS', locale = 'en-GH') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₵0.00';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    // Fallback for unsupported currency or locale
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

/**
 * Get currency symbol for a given currency code
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency) => {
  const symbols = {
    GHS: '₵',
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    KES: 'KSh',
    ZAR: 'R',
  };
  return symbols[currency] || currency;
};

/**
 * Format date with appropriate locale and options
 * @param {string|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  try {
    return new Date(date).toLocaleDateString('en-GH', defaultOptions);
  } catch (error) {
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
  }
};

/**
 * Format date and time
 * @param {string|Date} datetime - DateTime to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (datetime, options = {}) => {
  if (!datetime) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  try {
    return new Date(datetime).toLocaleString('en-GH', defaultOptions);
  } catch (error) {
    return new Date(datetime).toLocaleString('en-US', defaultOptions);
  }
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';

  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (Math.abs(diffInSeconds) < 60) {
    return 'just now';
  } else if (Math.abs(diffInMinutes) < 60) {
    return diffInMinutes > 0 ? `${diffInMinutes} minutes ago` : `in ${Math.abs(diffInMinutes)} minutes`;
  } else if (Math.abs(diffInHours) < 24) {
    return diffInHours > 0 ? `${diffInHours} hours ago` : `in ${Math.abs(diffInHours)} hours`;
  } else if (Math.abs(diffInDays) < 7) {
    return diffInDays > 0 ? `${diffInDays} days ago` : `in ${Math.abs(diffInDays)} days`;
  } else if (Math.abs(diffInWeeks) < 4) {
    return diffInWeeks > 0 ? `${diffInWeeks} weeks ago` : `in ${Math.abs(diffInWeeks)} weeks`;
  } else if (Math.abs(diffInMonths) < 12) {
    return diffInMonths > 0 ? `${diffInMonths} months ago` : `in ${Math.abs(diffInMonths)} months`;
  } else {
    return diffInYears > 0 ? `${diffInYears} years ago` : `in ${Math.abs(diffInYears)} years`;
  }
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format duration in human readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0 min';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  } else if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

/**
 * Format percentage with appropriate precision
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Format phone number for Ghana
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';

  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Handle Ghana phone numbers
  if (cleaned.startsWith('233')) {
    // International format: +233 XX XXX XXXX
    const match = cleaned.match(/^233(\d{2})(\d{3})(\d{4})$/);
    if (match) {
      return `+233 ${match[1]} ${match[2]} ${match[3]}`;
    }
  } else if (cleaned.startsWith('0')) {
    // Local format: 0XX XXX XXXX
    const match = cleaned.match(/^0(\d{2})(\d{3})(\d{4})$/);
    if (match) {
      return `0${match[1]} ${match[2]} ${match[3]}`;
    }
  }

  // Fallback: return original if no pattern matches
  return phoneNumber;
};

/**
 * Format rating with stars
 * @param {number} rating - Rating value (0-5)
 * @param {number} maxRating - Maximum rating (default: 5)
 * @returns {string} Formatted rating with stars
 */
export const formatRating = (rating, maxRating = 5) => {
  if (rating === null || rating === undefined || isNaN(rating)) {
    return '☆☆☆☆☆ (0.0)';
  }

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const stars = '★'.repeat(fullStars) + 
                (hasHalfStar ? '½' : '') + 
                '☆'.repeat(emptyStars);

  return `${stars} (${Number(rating).toFixed(1)})`;
};

/**
 * Format address for Ghana
 * @param {Object} address - Address object
 * @returns {string} Formatted address
 */
export const formatAddress = (address) => {
  if (!address) return '';

  const parts = [];

  if (address.street) parts.push(address.street);
  if (address.area) parts.push(address.area);
  if (address.city) parts.push(address.city);
  if (address.region && address.region !== address.city) parts.push(address.region);
  if (address.country && address.country !== 'Ghana') parts.push(address.country);

  return parts.join(', ');
};

/**
 * Format skill level
 * @param {string|number} level - Skill level
 * @returns {string} Formatted skill level
 */
export const formatSkillLevel = (level) => {
  if (typeof level === 'number') {
    if (level >= 90) return 'Expert';
    if (level >= 70) return 'Advanced';
    if (level >= 50) return 'Intermediate';
    if (level >= 25) return 'Beginner';
    return 'Novice';
  }

  const levelMap = {
    'expert': 'Expert',
    'advanced': 'Advanced',
    'intermediate': 'Intermediate',
    'beginner': 'Beginner',
    'novice': 'Novice',
  };

  return levelMap[String(level).toLowerCase()] || level;
};

/**
 * Format job status for display
 * @param {string} status - Job status
 * @returns {Object} Status with color and label
 */
export const formatJobStatus = (status) => {
  const statusMap = {
    'draft': { label: 'Draft', color: 'default' },
    'open': { label: 'Open', color: 'success' },
    'in_progress': { label: 'In Progress', color: 'info' },
    'review': { label: 'Under Review', color: 'warning' },
    'completed': { label: 'Completed', color: 'success' },
    'cancelled': { label: 'Cancelled', color: 'error' },
    'paused': { label: 'Paused', color: 'warning' },
  };

  return statusMap[status] || { label: status, color: 'default' };
};

/**
 * Format application status for display
 * @param {string} status - Application status
 * @returns {Object} Status with color and label
 */
export const formatApplicationStatus = (status) => {
  const statusMap = {
    'submitted': { label: 'Submitted', color: 'info' },
    'under_review': { label: 'Under Review', color: 'warning' },
    'shortlisted': { label: 'Shortlisted', color: 'primary' },
    'accepted': { label: 'Accepted', color: 'success' },
    'rejected': { label: 'Rejected', color: 'error' },
    'withdrawn': { label: 'Withdrawn', color: 'default' },
  };

  return statusMap[status] || { label: status, color: 'default' };
};

/**
 * Format payment status for display
 * @param {string} status - Payment status
 * @returns {Object} Status with color and label
 */
export const formatPaymentStatus = (status) => {
  const statusMap = {
    'pending': { label: 'Pending', color: 'warning' },
    'processing': { label: 'Processing', color: 'info' },
    'completed': { label: 'Completed', color: 'success' },
    'failed': { label: 'Failed', color: 'error' },
    'cancelled': { label: 'Cancelled', color: 'default' },
    'refunded': { label: 'Refunded', color: 'info' },
  };

  return statusMap[status] || { label: status, color: 'default' };
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 100)
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Format number with thousand separators
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return Number(number).toLocaleString('en-US');
};

/**
 * Format compact number (e.g., 1.2K, 3.5M)
 * @param {number} number - Number to format
 * @returns {string} Compact formatted number
 */
export const formatCompactNumber = (number) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  const absNumber = Math.abs(number);
  
  if (absNumber >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  } else if (absNumber >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  } else {
    return number.toString();
  }
};

/**
 * Format time range
 * @param {string|Date} startTime - Start time
 * @param {string|Date} endTime - End time
 * @returns {string} Formatted time range
 */
export const formatTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return '';

  const start = new Date(startTime);
  const end = new Date(endTime);

  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  
  return `${start.toLocaleTimeString('en-US', timeOptions)} - ${end.toLocaleTimeString('en-US', timeOptions)}`;
};

export default {
  formatCurrency,
  getCurrencySymbol,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatFileSize,
  formatDuration,
  formatPercentage,
  formatPhoneNumber,
  formatRating,
  formatAddress,
  formatSkillLevel,
  formatJobStatus,
  formatApplicationStatus,
  formatPaymentStatus,
  truncateText,
  formatNumber,
  formatCompactNumber,
  formatTimeRange,
};