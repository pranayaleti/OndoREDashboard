/**
 * HTTP utilities for API requests
 * Handles authentication, timeout, error parsing, and retry logic
 */

import type { ApiErrorResponse } from "@ondo/types";
import { ApiError as OntoApiError } from "@ondo/types";

const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:3000/api";

const REQUEST_TIMEOUT_MS = 30000;

/**
 * Parse error response from API
 */
function parseApiError(data: unknown, status: number): ApiErrorResponse {
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    return {
      message: (obj.message as string) || "Unknown error",
      code: (obj.code as string) || undefined,
      statusCode: status,
      errors: (obj.errors as any[]) || undefined,
      correlationId: (obj.correlationId as string) || undefined,
    };
  }

  return {
    message: `HTTP ${status}`,
    code: `HTTP_${status}`,
    statusCode: status,
  };
}

/**
 * Make HTTP request with timeout and error handling
 */
export async function apiRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = parseApiError(data, response.status);
      throw new OntoApiError(
        errorData.message,
        response.status,
        errorData.code,
        errorData.errors,
        errorData.correlationId,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof OntoApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new OntoApiError(
        "Network error. Please check your connection.",
        0,
        "NETWORK_ERROR",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Helper to make GET request
 */
export async function apiGet<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
  return apiRequest<T>("GET", endpoint, undefined, headers);
}

/**
 * Helper to make POST request
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  return apiRequest<T>("POST", endpoint, body, headers);
}

/**
 * Helper to make PUT request
 */
export async function apiPut<T>(
  endpoint: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  return apiRequest<T>("PUT", endpoint, body, headers);
}

/**
 * Helper to make DELETE request
 */
export async function apiDelete<T>(
  endpoint: string,
  headers?: Record<string, string>,
): Promise<T> {
  return apiRequest<T>("DELETE", endpoint, undefined, headers);
}

/**
 * Get authorization headers from token
 */
export function getAuthHeaders(token?: string): Record<string, string> {
  const auth = token || localStorage.getItem("auth_token");
  return auth ? { Authorization: `Bearer ${auth}` } : {};
}
