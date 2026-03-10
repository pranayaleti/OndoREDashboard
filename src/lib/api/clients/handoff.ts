/**
 * Handoff API client
 * Handles move-in/move-out checklist notifications.
 */

import { apiPost, getAuthHeaders } from "../http";

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
};
