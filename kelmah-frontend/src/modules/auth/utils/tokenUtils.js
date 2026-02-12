export const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Decode a base64url string (JWT-safe). Replaces `-` → `+` and `_` → `/`
 * before calling atob() so tokens with base64url characters don't crash.
 */
const decodeBase64Url = (str) => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' to make length a multiple of 4
  while (base64.length % 4 !== 0) base64 += '=';
  return atob(base64);
};

export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    // Decode the JWT token (without verification)
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1]));
    // Check if token has expired
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

export const getTokenExpiryTime = (token) => {
  try {
    const payload = JSON.parse(decodeBase64Url(token.split('.')[1]));
    return payload.exp * 1000;
  } catch (error) {
    return null;
  }
};
