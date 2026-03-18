/**
 * HTTP utilities for API requests
 * Handles authentication, timeout, error parsing, and automatic token refresh.
 *
 * On any 401 response the interceptor calls /api/auth/refresh once via the
 * token-manager, then retries the original request with the new access token.
 * If the refresh also fails the request throws with status 401 and dispatches
 * the custom `auth:session-expired` window event so the app can redirect.
 */

import type { ApiErrorResponse } from "@ondo/types";
import { ApiError as OntoApiError } from "@ondo/types";
import { ApiErrorFieldArraySchema } from "./schemas";
import { getValidAccessToken, refreshAccessToken, clearAccessToken, getAccessToken } from "./clients/token-manager";

const API_BASE_URL: string =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000/api";

const REQUEST_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Error parsing
// ---------------------------------------------------------------------------

function parseApiError(data: unknown, status: number): ApiErrorResponse {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    return {
      message: (obj.message as string) || "Unknown error",
      code: (obj.code as string) || undefined,
      statusCode: status,
      errors: ApiErrorFieldArraySchema.safeParse(obj.errors).data || undefined,
      correlationId: (obj.correlationId as string) || undefined,
    };
  }

  return {
    message: `HTTP ${status}`,
    code: `HTTP_${status}`,
    statusCode: status,
  };
}

// ---------------------------------------------------------------------------
// Core request — with 401 retry after token refresh
// ---------------------------------------------------------------------------

async function doFetch<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
  signal?: AbortSignal,
  isRetry = false
): Promise<T> {
  const token = await getValidAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  // 401 — attempt a silent token refresh, then retry once
  if (response.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return doFetch<T>(method, endpoint, body, extraHeaders, signal, true);
    }
    // Refresh failed — session is unrecoverable
    clearAccessToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
    }
    throw new OntoApiError("Session expired. Please log in again.", 401, "SESSION_EXPIRED");
  }

  // Non-2xx — parse and throw
  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    const errorData = parseApiError(data, response.status);
    throw new OntoApiError(
      errorData.message,
      response.status,
      errorData.code,
      errorData.errors,
      errorData.correlationId
    );
  }

  // 204 No Content
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public request helper (with AbortController timeout)
// ---------------------------------------------------------------------------

export async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await doFetch<T>(method, endpoint, body, headers, controller.signal);
  } catch (error) {
    if (error instanceof OntoApiError) throw error;

    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new OntoApiError(
        "Network error. Please check your connection.",
        0,
        "NETWORK_ERROR"
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Method helpers
// ---------------------------------------------------------------------------

export async function apiGet<T>(
  endpoint: string,
  headers?: Record<string, string>
): Promise<T> {
  return apiRequest<T>("GET", endpoint, undefined, headers);
}

export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  return apiRequest<T>("POST", endpoint, body, headers);
}

export async function apiPut<T>(
  endpoint: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  return apiRequest<T>("PUT", endpoint, body, headers);
}

export async function apiDelete<T>(
  endpoint: string,
  headers?: Record<string, string>
): Promise<T> {
  return apiRequest<T>("DELETE", endpoint, undefined, headers);
}

// ---------------------------------------------------------------------------
// Auth header helper
// ---------------------------------------------------------------------------

/**
 * Build an Authorization header map.
 *
 * NOTE: For new code, prefer letting `apiRequest` inject the token automatically
 * via `getValidAccessToken()`. This helper exists for legacy callers that build
 * headers explicitly.
 *
 * Because token retrieval is now async, this synchronous helper returns an empty
 * object when no token is available in memory — `apiRequest` will still attach
 * the token via `getValidAccessToken()`.
 */
export function getAuthHeaders(token?: string): Record<string, string> {
  const auth = token ?? getAccessToken();
  return auth ? { Authorization: `Bearer ${auth}` } : {};
}
