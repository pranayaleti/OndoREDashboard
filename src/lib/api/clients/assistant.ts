/**
 * AI Assistant API client (Chat endpoint)
 */

import { apiPost, getAuthHeaders } from "../http";

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

/** Backend returns { reply, session_id?, pending_maintenance_draft? }. */
export interface ChatResponse {
  reply: string;
  session_id?: string;
  pending_maintenance_draft?: PendingMaintenanceDraft;
}

export interface ConfirmMaintenanceDraftResponse {
  message: string;
  id?: string;
  title?: string;
  status?: string;
  createdAt?: string;
}

export const assistantApi = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const headers = getAuthHeaders();
    return apiPost<ChatResponse>("/dashboard/assistant/chat", request, headers);
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
