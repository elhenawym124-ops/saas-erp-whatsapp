/**
 * Token Utilities
 * 
 * Utility functions for managing JWT tokens in the application.
 * Handles token retrieval from localStorage and cookies.
 */

/**
 * Get JWT access token from localStorage or cookies
 * 
 * Priority:
 * 1. localStorage (primary storage)
 * 2. cookies (fallback)
 * 
 * @returns {string | null} JWT token or null if not found
 */
export const getToken = (): string | null => {
  // Try localStorage first
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('accessToken');
    if (localToken) {
      console.log('🔑 Token found in localStorage');
      return localToken;
    }
  }
  
  // Fallback to cookies
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'accessToken') {
        console.log('🔑 Token found in cookies');
        return value;
      }
    }
  }
  
  console.warn('⚠️ No token found in localStorage or cookies');
  return null;
};

/**
 * Get refresh token from localStorage or cookies
 * 
 * @returns {string | null} Refresh token or null if not found
 */
export const getRefreshToken = (): string | null => {
  // Try localStorage first
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('refreshToken');
    if (localToken) {
      return localToken;
    }
  }
  
  // Fallback to cookies
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'refreshToken') {
        return value;
      }
    }
  }
  
  return null;
};

/**
 * Set JWT token in localStorage
 * 
 * @param {string} token - JWT access token
 */
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
    console.log('✅ Token saved to localStorage');
  }
};

/**
 * Set refresh token in localStorage
 * 
 * @param {string} token - JWT refresh token
 */
export const setRefreshToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('refreshToken', token);
  }
};

/**
 * Remove tokens from localStorage
 */
export const clearTokens = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    console.log('🗑️ Tokens cleared from localStorage');
  }
};

/**
 * Check if user is authenticated (has valid token)
 * 
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

/**
 * Decode JWT token (without verification)
 * 
 * @param {string} token - JWT token
 * @returns {any} Decoded token payload or null
 */
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * 
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Get user ID from token
 * 
 * @returns {number | null} User ID or null
 */
export const getUserIdFromToken = (): number | null => {
  const token = getToken();
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return decoded?.userId || decoded?.id || null;
};

/**
 * Get organization ID from token
 * 
 * @returns {number | null} Organization ID or null
 */
export const getOrganizationIdFromToken = (): number | null => {
  const token = getToken();
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return decoded?.organizationId || null;
};

