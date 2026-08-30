import { apiGet, apiPost, apiPut, apiDelete } from "../http";

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  triggerEvent: string;
  conditions: Record<string, unknown>;
  actions: Array<{ type: string; params: Record<string, unknown> }>;
  isActive: boolean;
  createdAt: string;
}

export const workflowsApi = {
  async listRules(): Promise<WorkflowRule[]> {
    const res = await apiGet<{ data?: WorkflowRule[]; rules?: WorkflowRule[] }>("/workflows/rules");
    return res.data ?? res.rules ?? [];
  },
  async createRule(rule: Omit<WorkflowRule, "id" | "createdAt" | "isActive">): Promise<WorkflowRule> {
    const res = await apiPost<{ data: WorkflowRule }>("/workflows/rules", rule);
    return res.data;
  },
  async updateRule(id: string, updates: Partial<WorkflowRule>): Promise<WorkflowRule> {
    const res = await apiPut<{ data: WorkflowRule }>(`/workflows/rules/${id}`, updates);
    return res.data;
  },
  async deleteRule(id: string): Promise<void> {
    await apiDelete(`/workflows/rules/${id}`);
  },
  async listTemplates(): Promise<Array<{ id: string; name: string; description: string; category: string }>> {
    const res = await apiGet<{ data: Array<{ id: string; name: string; description: string; category: string }> }>(
      "/workflows/templates",
    );
    return res.data ?? [];
  },
  async activateTemplate(templateId: string): Promise<void> {
    await apiPost(`/workflows/templates/${templateId}/activate`, {});
  },
  async getStats(): Promise<{ totalRules: number; activeRules: number; totalExecutions?: number } | null> {
    const res = await apiGet<{ data: { totalRules: number; activeRules: number; totalExecutions?: number } }>(
      "/workflows/stats",
    );
    return res.data ?? null;
  },
};
