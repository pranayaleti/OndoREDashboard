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
  propertyId?: string;
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  message: ChatMessage;
  suggestions?: string[];
  context?: Record<string, unknown>;
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
