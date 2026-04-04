/**
 * Handoff API client
 * Handles move-in/move-out checklist notifications.
 */

import { apiPost, apiGet, getAuthHeaders } from "../http";

export interface MoveOutResource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
}

export const handoffApi = {
  /**
   * Notify property manager about checklist completion.
   */
  async notifyChecklistCompletion(
    propertyId: string,
    tenantName: string,
    propertyAddress: string,
  ): Promise<{ message: string }> {
    const headers = getAuthHeaders();
    return apiPost<{ message: string }>(
      '/handoff/checklist-completion',
      { propertyId, tenantName, propertyAddress },
      headers,
    );
  },

  /**
   * Get move-out resources (helpful external links for tenants).
   */
  async getMoveOutResources(): Promise<MoveOutResource[]> {
    const headers = getAuthHeaders();
    const res = await apiGet<{ data: MoveOutResource[] }>('/move-out-resources', headers);
    return res.data;
  },
};
