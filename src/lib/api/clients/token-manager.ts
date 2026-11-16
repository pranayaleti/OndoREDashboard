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
 *   Session flag   — a localStorage marker (no token, no user data) that the
 *                    backend issued a session in this browser. It is the only
 *                    way to tell a signed-in user's reload from a visitor who
 *                    never signed in, whose refresh call could only get a 401.
 *
 * Auto-refresh:
 *   `getValidAccessToken()` checks whether the stored access token is about to
 *   expire and silently calls /api/auth/refresh if so. Concurrent refresh calls
 *   are de-duplicated via `refreshPromise`. Without a session no call is made.
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

/**
 * Bumped by every login (`setAccessToken`) and logout (`endSession`). A refresh
 * that was already in flight when either happened must not overwrite the result.
 */
let _sessionGeneration = 0;

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
// Session flag
// ---------------------------------------------------------------------------

/**
 * Set whenever the backend issues a session (login, signup, refresh) and removed
 * when it ends (logout, or a refresh rejected with 401). The refresh cookie lives
 * on the API's origin, so this page cannot check for it directly.
 */
const SESSION_FLAG_KEY = "ondo_has_session";

function writeSessionFlag(present: boolean): void {
  try {
    if (present) localStorage.setItem(SESSION_FLAG_KEY, "1");
    else localStorage.removeItem(SESSION_FLAG_KEY);
  } catch {
    // Storage blocked — the in-memory token still covers this page
  }
}

// Browsers signed in before the flag existed have a valid refresh cookie but no flag. Letting
// each browser try the cookie once keeps those sessions across the deploy; after that the flag
// decides, so a visitor who never signed in gets at most one 401 per browser.
const SESSION_PROBE_KEY = "ondo_session_probe_v1";

function readSessionFlag(): boolean {
  try {
    if (localStorage.getItem(SESSION_FLAG_KEY) === "1") return true;
    if (localStorage.getItem(SESSION_PROBE_KEY) !== "1") {
      localStorage.setItem(SESSION_PROBE_KEY, "1");
      return true;
    }
    return false;
  } catch {
    // Storage blocked: the flag can never be written either, so assume a session
    // may exist and let the refresh cookie decide (the behavior before the flag).
    return true;
  }
}

function storeAccessToken(token: string, expiresIn: number): void {
  _state = {
    accessToken: token,
    expiresAt: Date.now() + (expiresIn - 30) * 1000,
  };
  writeSessionFlag(true);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Store an access token received from login or signup, and flag the session so
 * the next page load knows to refresh. Supersedes any refresh still in flight.
 *
 * @param token       Raw JWT access token string.
 * @param expiresIn   Lifetime in seconds as reported by the backend (default: 900).
 *                    We refresh 30 s early to avoid race conditions.
 */
export function setAccessToken(token: string, expiresIn = 900): void {
  _sessionGeneration += 1;
  storeAccessToken(token, expiresIn);
}

/** Discard the in-memory access token (e.g. on logout or 401). */
export function clearAccessToken(): void {
  _state = { accessToken: null, expiresAt: null };
}

/**
 * True when there is a session to refresh: an access token in memory, or a
 * session issued earlier in this browser whose token was lost on reload.
 */
export function hasSession(): boolean {
  return _state.accessToken !== null || readSessionFlag();
}

/** End the session in this browser (logout): drop the access token and the session flag. */
export function endSession(): void {
  _sessionGeneration += 1;
  clearAccessToken();
  writeSessionFlag(false);
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
 * several components call this simultaneously. Makes no request when there is
 * no session (see `hasSession()`): there is no cookie to send.
 *
 * @returns The new access token, or null if the session cannot be recovered.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;
  if (!hasSession()) return null;

  // A login or logout while this request is in flight owns the session from then
  // on: keep its state (a fresh login token, or nothing after logout).
  const generation = _sessionGeneration;
  const superseded = () => generation !== _sessionGeneration;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include", // sends the HttpOnly ondo_refresh cookie
        headers: { "Content-Type": "application/json" },
      });

      if (superseded()) return _state.accessToken;

      if (!res.ok) {
        if (res.status === 404) {
          console.warn(
            `[token-manager] Auth refresh endpoint returned 404. ` +
            `Verify VITE_API_BASE_URL (${API_BASE_URL}) points to a deployed backend ` +
            `and the /auth/refresh route is available.`
          );
        }
        clearAccessToken();
        // 401: the cookie is missing, expired or revoked, so the session is over.
        // Other failures may pass; keep the flag so the next page load tries again.
        if (res.status === 401) writeSessionFlag(false);
        return null;
      }

      const data = (await res.json()) as { accessToken: string; expiresIn: number };
      if (superseded()) return _state.accessToken;
      storeAccessToken(data.accessToken, data.expiresIn);
      return data.accessToken;
    } catch {
      if (superseded()) return _state.accessToken;
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
 * expired, is about to expire, or was lost on reload. Null without a session.
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
