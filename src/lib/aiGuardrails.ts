/**
 * Client-side AI guardrails for the assistant chat. Mirrors backend limits
 * (OndoREBackend src/lib/aiGuardrails.ts) so we validate before sending and show
 * clear errors. Backend enforces the same rules; this is for UX and defense in depth.
 */

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

/** Must match backend GUARDRAILS_CONFIG. */
export const GUARDRAILS_CONFIG = {
  maxMessages: 50,
  maxContentLengthPerMessage: 8_000,
  maxTotalInputChars: 32_000,
  maxReplyLength: 4_096,
} as const;

const PROMPT_INJECTION_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|above|prior)\s+instructions?\b/i,
  /\bdisregard\s+(all\s+)?(previous|above|prior)\s+instructions?\b/i,
  /\byou\s+are\s+now\s+/i,
  /\bfrom\s+now\s+on\s+you\s+/i,
  /\bnew\s+instructions?\s*:\s*/i,
  /\bsystem\s*:\s*\[/i,
  /\b\[system\]\s*:/i,
  /\b<\s*system\s*>/i,
  /\bpretend\s+you\s+are\s+/i,
  /\bact\s+as\s+if\s+you\s+are\s+/i,
  /\boutput\s+(only|just)\s+/i,
  /\brespond\s+only\s+with\s+/i,
  /\breveal\s+(your|the)\s+(system\s+)?prompt\b/i,
  /\bprint\s+(your|the)\s+(system\s+)?prompt\b/i,
  /\brepeat\s+(your|the)\s+(system\s+)?prompt\b/i,
];

/**
 * Validates chat input before sending. Use in the assistant UI to block invalid
 * or disallowed content and show a clear message without a round-trip.
 */
export function validateChatInput(
  messages: ChatMessage[]
): { ok: true; messages: ChatMessage[] } | { ok: false; error: string } {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "At least one message is required." };
  }
  if (messages.length > GUARDRAILS_CONFIG.maxMessages) {
    return {
      ok: false,
      error: `Too many messages. Maximum is ${GUARDRAILS_CONFIG.maxMessages}. Start a new conversation if needed.`,
    };
  }

  let totalChars = 0;
  const normalized: ChatMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m || typeof m.role !== "string" || typeof m.content !== "string") {
      return { ok: false, error: "Each message must have role and content." };
    }
    const role = m.role.toLowerCase();
    if (role !== "user" && role !== "assistant" && role !== "system") {
      return { ok: false, error: 'Role must be "user", "assistant", or "system".' };
    }

    let content = m.content;
    if (content.length > GUARDRAILS_CONFIG.maxContentLengthPerMessage) {
      content = content.slice(0, GUARDRAILS_CONFIG.maxContentLengthPerMessage);
    }
    totalChars += content.length;

    if (role === "user") {
      const lower = content.toLowerCase().replace(/\s+/g, " ");
      for (const pattern of PROMPT_INJECTION_PATTERNS) {
        if (pattern.test(lower)) {
          return {
            ok: false,
            error: "Your message could not be sent. Please rephrase and avoid instruction-like text.",
          };
        }
      }
    }

    normalized.push({ role: role as ChatMessage["role"], content });
  }

  if (totalChars > GUARDRAILS_CONFIG.maxTotalInputChars) {
    return {
      ok: false,
      error: `Conversation is too long (max ${GUARDRAILS_CONFIG.maxTotalInputChars} characters). Shorten it or start a new chat.`,
    };
  }

  return { ok: true, messages: normalized };
}
