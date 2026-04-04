import { apiGet, apiPost, apiPut, apiDelete } from "../http";

export interface InboxSummary {
  totalThreads: number;
  unreadThreads: number;
  slaBreachedCount: number;
  avgResponseTimeMinutes: number;
}

export interface InternalNote {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface SuggestedReply {
  suggestedReply: string;
  confidence: number;
  category: string;
}

export interface KnowledgeEntry {
  id: string;
  propertyId: string;
  category: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface AutoReplyConfig {
  propertyId: string;
  enabled: boolean;
  confidenceThreshold: number;
  replyDelayMinutes: number;
  excludeCategories: string[];
}

export interface SandboxResult {
  reply: string;
  confidence: number;
  category: string;
  knowledgeUsed: string[];
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
  targetLanguage: string;
}

export interface ThreadTranslation {
  messageId: string;
  original: string;
  translated: string;
  detectedLanguage: string;
}

export const inboxApi = {
  async getSummary(): Promise<InboxSummary> {
    const res = await apiGet<{ data: InboxSummary }>('/inbox/summary');
    return res.data;
  },
  async getThreadsNeedingAttention(): Promise<unknown[]> {
    const res = await apiGet<{ data: unknown[] }>('/inbox/attention');
    return res.data;
  },
  async getInternalNotes(threadId: string): Promise<InternalNote[]> {
    const res = await apiGet<{ data: InternalNote[] }>(`/inbox/threads/${threadId}/notes`);
    return res.data;
  },
  async addInternalNote(threadId: string, body: string): Promise<InternalNote> {
    const res = await apiPost<{ data: InternalNote }>(`/inbox/threads/${threadId}/notes`, { body });
    return res.data;
  },
  async setThreadSla(threadId: string, hours: number): Promise<void> {
    await apiPost(`/inbox/threads/${threadId}/sla`, { hours });
  },
  async suggestReply(threadId: string): Promise<SuggestedReply> {
    const res = await apiPost<{ data: SuggestedReply }>(`/inbox/threads/${threadId}/suggest-reply`, {});
    return res.data;
  },
  async classifyMessage(message: string): Promise<{ category: string; confidence: number }> {
    const res = await apiPost<{ data: { category: string; confidence: number } }>('/inbox/classify', { message });
    return res.data;
  },
  async getKnowledgeBase(propertyId: string): Promise<KnowledgeEntry[]> {
    const res = await apiGet<{ data: KnowledgeEntry[] }>(`/inbox/knowledge/${propertyId}`);
    return res.data;
  },
  async addKnowledgeEntry(propertyId: string, entry: { category?: string; title: string; content: string }): Promise<KnowledgeEntry> {
    const res = await apiPost<{ data: KnowledgeEntry }>(`/inbox/knowledge/${propertyId}`, entry);
    return res.data;
  },
  async updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>): Promise<KnowledgeEntry> {
    const res = await apiPut<{ data: KnowledgeEntry }>(`/inbox/knowledge/entries/${id}`, updates);
    return res.data;
  },
  async deleteKnowledgeEntry(id: string): Promise<void> {
    await apiDelete(`/inbox/knowledge/entries/${id}`);
  },
  // Auto-reply config
  async getAutoReplyConfig(propertyId: string): Promise<AutoReplyConfig> {
    const res = await apiGet<{ data: AutoReplyConfig }>(`/inbox/auto-reply/${propertyId}`);
    return res.data;
  },
  async updateAutoReplyConfig(propertyId: string, config: Partial<AutoReplyConfig>): Promise<AutoReplyConfig> {
    const res = await apiPut<{ data: AutoReplyConfig }>(`/inbox/auto-reply/${propertyId}`, config);
    return res.data;
  },
  // Sandbox testing
  async testSandboxReply(propertyId: string, message: string): Promise<SandboxResult> {
    const res = await apiPost<{ data: SandboxResult }>('/inbox/sandbox/test', { propertyId, message });
    return res.data;
  },
  // Translation
  async translateMessage(text: string, targetLanguage?: string): Promise<TranslationResult> {
    const res = await apiPost<{ data: TranslationResult }>('/inbox/translate', { text, targetLanguage });
    return res.data;
  },
  async translateThread(threadId: string, targetLanguage?: string): Promise<ThreadTranslation[]> {
    const res = await apiPost<{ data: ThreadTranslation[] }>(`/inbox/threads/${threadId}/translate`, { targetLanguage });
    return res.data;
  },
  // Pinning
  async getPinnedThreads(): Promise<unknown[]> {
    const res = await apiGet<{ data: unknown[] }>('/inbox/pinned');
    return res.data;
  },
  async pinThread(threadId: string): Promise<void> {
    await apiPost(`/inbox/threads/${threadId}/pin`, {});
  },
  async unpinThread(threadId: string): Promise<void> {
    await apiPost(`/inbox/threads/${threadId}/unpin`, {});
  },
  // Tenant-last filter
  async getThreadsWithTenantLastMessage(): Promise<unknown[]> {
    const res = await apiGet<{ data: unknown[] }>('/inbox/tenant-last');
    return res.data;
  },
};
