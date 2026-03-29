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

/** Backend returns { reply: string, session_id: string }. */
export interface ChatResponse {
  reply: string;
  session_id: string;
}

export const assistantApi = {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const headers = getAuthHeaders();
    return apiPost<ChatResponse>("/dashboard/assistant/chat", request, headers);
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
