export const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Decode the JWT token (without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check if token has expired
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
};

export const getTokenExpiryTime = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000;
  } catch (error) {
    return null;
  }
}; 