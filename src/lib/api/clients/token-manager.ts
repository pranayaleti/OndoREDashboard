import { getApiBaseUrl } from "../base-url";

/**
 * Token Manager — access token storage, expiry detection, and silent refresh.
 *
 * Security model:
 *   Access tokens  — kept in module-level memory only (never localStorage /
 *                    sessionStorage). Lost on page reload; recovered via the
 *                    refresh endpoint below.
 *   Refresh tokens — stored in an HttpOnly cookie set by the backend. The
 *                    browser sends it automatically; JS cannot read it at all.
 *
 * Auto-refresh:
 *   `getValidAccessToken()` checks whether the stored access token is about to
 *   expire and silently calls /api/auth/refresh if so. Concurrent refresh calls
 *   are de-duplicated via `refreshPromise`.
 *
 * Migration:
 *   On first load, any legacy tokens found in localStorage / sessionStorage are
 *   cleared immediately — the backend refresh endpoint (HttpOnly cookie) takes
 *   over session recovery from this point forward.
 */

const API_BASE_URL: string = getApiBaseUrl();

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

interface TokenState {
  accessToken: string | null;
  /** Unix milliseconds at which the token should be considered expired for our purposes. */
  expiresAt: number | null;
}

let _state: TokenState = { accessToken: null, expiresAt: null };

/** De-duplicates concurrent refresh calls so we never fire two at once. */
let _refreshPromise: Promise<string | null> | null = null;

// ---------------------------------------------------------------------------
// Legacy cleanup — run once on module load
// ---------------------------------------------------------------------------

(function clearLegacyStorage() {
  try {
    ["ondoToken", "token", "auth_token"].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch {
    // SSR / restricted environments — silently ignore
  }
})();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Store an access token received from the login or refresh endpoint.
 *
 * @param token       Raw JWT access token string.
 * @param expiresIn   Lifetime in seconds as reported by the backend (default: 900).
 *                    We refresh 30 s early to avoid race conditions.
 */
export function setAccessToken(token: string, expiresIn = 900): void {
  _state = {
    accessToken: token,
    expiresAt: Date.now() + (expiresIn - 30) * 1000,
  };
}

/** Discard the in-memory access token (e.g. on logout or 401). */
export function clearAccessToken(): void {
  _state = { accessToken: null, expiresAt: null };
}

/** Return the raw access token without any expiry check. */
export function getAccessToken(): string | null {
  return _state.accessToken;
}

/** True when the token is absent or within the 30-second early-refresh window. */
export function isTokenExpiringSoon(): boolean {
  if (_state.expiresAt === null) return true;
  return Date.now() >= _state.expiresAt;
}

/**
 * Call POST /api/auth/refresh.
 * The browser automatically sends the HttpOnly `ondo_refresh` cookie.
 * De-duplicates concurrent calls — only one HTTP request is made even if
 * several components call this simultaneously.
 *
 * @returns The new access token, or null if the session cannot be recovered.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include", // sends the HttpOnly ondo_refresh cookie
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        if (res.status === 404) {
          console.warn(
            `[token-manager] Auth refresh endpoint returned 404. ` +
            `Verify VITE_API_BASE_URL (${API_BASE_URL}) points to a deployed backend ` +
            `and the /auth/refresh route is available.`
          );
        }
        clearAccessToken();
        return null;
      }

      const data = (await res.json()) as { accessToken: string; expiresIn: number };
      setAccessToken(data.accessToken, data.expiresIn);
      return data.accessToken;
    } catch {
      clearAccessToken();
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

/**
 * Return a valid access token, silently refreshing if the current one has
 * expired or is about to expire.
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (_state.accessToken && !isTokenExpiringSoon()) {
    return _state.accessToken;
  }
  return refreshAccessToken();
}

// ---------------------------------------------------------------------------
// Legacy compatibility shim
// ---------------------------------------------------------------------------
// Parts of the codebase still call `tokenManager.getToken()` / `setToken()`.
// This shim keeps them working without any other code changes.

export const tokenManager = {
  /** @deprecated Use getValidAccessToken() for async-aware token access. */
  getToken(): string | null {
    return getAccessToken();
  },

  /** @deprecated Use setAccessToken(token, expiresIn) instead. */
  setToken(token: string): void {
    // We don't have an expiresIn here — parse the JWT exp claim as a fallback.
    let expiresIn = 900;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1])) as { exp?: number; iat?: number };
        if (typeof payload.exp === "number" && typeof payload.iat === "number") {
          expiresIn = payload.exp - payload.iat;
        }
      }
    } catch {
      // Keep default
    }
    setAccessToken(token, expiresIn);
  },

  /** @deprecated Use clearAccessToken() instead. */
  removeToken(): void {
    clearAccessToken();
  },

  isTokenExpired(token: string): boolean {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1])) as { exp?: number };
      if (typeof payload.exp !== "number") return true;
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
};
