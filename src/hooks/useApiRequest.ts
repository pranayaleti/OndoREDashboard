import { useState } from "react";

type RequestOptions<TBody> = {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: TBody;
  headers?: Record<string, string>;
};

export default function useApiRequest() {
  const [loading, setLoading] = useState(false);

  async function request<TResponse = unknown, TBody = unknown>({
    url,
    method = "GET",
    body,
    headers = {},
  }: RequestOptions<TBody>): Promise<TResponse | null> {
    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
      });
      
      const contentType = res.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let json: unknown = {};
      if (isJson) {
        try {
          const text = await res.text();
          json = text ? JSON.parse(text) : {};
        } catch (_parseError) {
          throw new Error('Invalid JSON response from server');
        }
      } else {
        const text = await res.text();
        json = { message: text || 'Request failed' };
      }
      
      if (!res.ok) {
        const errorPayload =
          typeof json === "object" && json !== null ? (json as { message?: string; error?: string }) : undefined;
        const errorMessage = errorPayload?.message ?? errorPayload?.error ?? "Request failed";
        throw new Error(errorMessage);
      }
      return json as TResponse;
    } catch (_e) {
      // Error is handled by caller, just return null
      return null;
    } finally {
      setLoading(false);
    }
  }
  return { request, loading };
}