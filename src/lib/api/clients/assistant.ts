/**
 * AI Assistant API client (Chat endpoint)
 */

import { apiPost, getAuthHeaders } from "../http";
import { getApiBaseUrl } from "../base-url";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  session_id?: string;
  propertyId?: string;
  context?: Record<string, unknown>;
}

export interface PendingMaintenanceDraft {
  confirmation_token: string;
  draft: {
    title: string;
    description: string;
    category: string;
    priority: string;
    property_id: string;
    tenant_id: string | null;
  };
  expires_in_minutes: number;
}

export interface PendingShowingDraft {
  confirmation_token: string;
  draft: {
    property_id: string;
    start: string;
    end: string;
    attendee_name: string | null;
    attendee_email: string | null;
    notes: string | null;
  };
  expires_in_minutes: number;
}

/** Backend returns { reply, session_id?, pending_maintenance_draft?, pending_showing_draft? }. */
export interface ChatResponse {
  reply: string;
  session_id?: string;
  pending_maintenance_draft?: PendingMaintenanceDraft;
  pending_showing_draft?: PendingShowingDraft;
}

export interface ConfirmShowingDraftResponse {
  message: string;
  showing_id?: string;
  start?: string;
  end?: string;
  google_synced?: boolean;
  calendar_link?: string;
}

export interface ConfirmMaintenanceDraftResponse {
  message: string;
  id?: string;
  title?: string;
  status?: string;
  createdAt?: string;
}

export interface AssistantStreamHandlers {
  onDelta: (text: string) => void;
  onDone: (payload: {
    reply: string;
    session_id?: string;
    pending_maintenance_draft?: PendingMaintenanceDraft;
    pending_showing_draft?: PendingShowingDraft;
  }) => void;
  onError: (message: string) => void;
}

export const assistantApi = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const headers = getAuthHeaders();
    return apiPost<ChatResponse>("/dashboard/assistant/chat", request, headers);
  },

  /**
   * Streaming chat over SSE. The browser fetch stream is read incrementally and
   * each `data: {json}` frame is dispatched to the handlers. Returns an
   * AbortController so callers can cancel.
   */
  async chatStream(request: ChatRequest, handlers: AssistantStreamHandlers): Promise<AbortController> {
    const controller = new AbortController();
    const res = await fetch(`${getApiBaseUrl()}/dashboard/assistant/chat/stream`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      handlers.onError(`Request failed (${res.status}).`);
      return controller;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    // Read loop runs in the background; caller may await via handlers.
    (async () => {
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.replace(/^data:\s*/, "").trim();
            if (!line) continue;
            let evt: { type?: string; text?: string; message?: string } & Partial<ChatResponse>;
            try {
              evt = JSON.parse(line);
            } catch {
              continue;
            }
            if (evt.type === "delta" && typeof evt.text === "string") handlers.onDelta(evt.text);
            else if (evt.type === "done")
              handlers.onDone({
                reply: evt.reply ?? "",
                session_id: evt.session_id,
                pending_maintenance_draft: evt.pending_maintenance_draft,
                pending_showing_draft: evt.pending_showing_draft,
              });
            else if (evt.type === "error") handlers.onError(evt.message ?? "Assistant error.");
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") handlers.onError("Stream interrupted.");
      }
    })();

    return controller;
  },

  async confirmMaintenanceDraft(
    confirmationToken: string,
    draft: PendingMaintenanceDraft["draft"],
  ): Promise<ConfirmMaintenanceDraftResponse> {
    const headers = getAuthHeaders();
    return apiPost<ConfirmMaintenanceDraftResponse>(
      "/dashboard/assistant/confirm-maintenance-draft",
      { confirmation_token: confirmationToken, draft },
      headers,
    );
  },

  async confirmShowingDraft(
    confirmationToken: string,
    draft: PendingShowingDraft["draft"],
  ): Promise<ConfirmShowingDraftResponse> {
    const headers = getAuthHeaders();
    return apiPost<ConfirmShowingDraftResponse>(
      "/dashboard/assistant/confirm-showing-draft",
      { confirmation_token: confirmationToken, draft },
      headers,
    );
  },

  async sendMessage(
    message: string,
    propertyId?: string,
    context?: Record<string, unknown>,
  ): Promise<ChatResponse> {
    const headers = getAuthHeaders();
    const request: ChatRequest = {
      messages: [
        {
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        },
      ],
      propertyId,
      context,
    };
    return apiPost<ChatResponse>("/dashboard/assistant/chat", request, headers);
  },
};
