/**
 * Token manager for JWT storage and validation.
 * Uses sessionStorage as primary store with localStorage migration support.
 */

export const tokenManager = {
  getToken(): string | null {
    // Check sessionStorage first (current method)
    let token = sessionStorage.getItem('ondoToken');
    if (token) return token;

    // Fallback to localStorage (old method)
    token = localStorage.getItem('ondoToken');
    if (token) {
      // Migrate to sessionStorage
      sessionStorage.setItem('ondoToken', token);
      localStorage.removeItem('ondoToken');
      return token;
    }

    // Check for legacy token key
    token = localStorage.getItem('token');
    if (token) {
      // Migrate to sessionStorage with new key
      sessionStorage.setItem('ondoToken', token);
      localStorage.removeItem('token');
      return token;
    }

    return null;
  },

  setToken(token: string): void {
    sessionStorage.setItem('ondoToken', token);
  },

  removeToken(): void {
    sessionStorage.removeItem('ondoToken');
    localStorage.removeItem('ondoToken');
    localStorage.removeItem('token');
  },

  isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true; // Invalid JWT format
      }
      const payload = JSON.parse(atob(parts[1]));
      if (!payload || typeof payload.exp !== 'number') {
        return true; // Invalid payload or missing expiration
      }
      return payload.exp * 1000 < Date.now();
    } catch {
      return true; // Any parsing error means token is invalid
    }
  },
};
