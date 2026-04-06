/**
 * Handoff API client
 * CRUD for property handoff data, photos, and checklist notifications.
 */

import { apiGet, apiPut, apiPost, apiDelete, apiUpload } from "../http";
import type { PropertyHandoff } from "@/types/handoff.types";

export interface HandoffPhoto {
  id: string;
  handoffId: string;
  category: "key" | "access_code" | "garage" | "mailbox" | "other";
  label: string | null;
  storagePath: string;
  uploadedBy: string;
  createdAt: string;
  signedUrl?: string;
}

export interface HandoffResponse {
  id: string;
  propertyId: string;
  data: Record<string, unknown>;
  ownerNotes: string | null;
  status: "draft" | "in_progress" | "completed";
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  photos: HandoffPhoto[];
}

export const handoffApi = {
  /**
   * Get handoff data for a property.
   */
  async getHandoff(propertyId: string): Promise<HandoffResponse | null> {
    try {
      const res = await apiGet<{ data: HandoffResponse }>(
        `/properties/${propertyId}/handoff`,
      );
      return res.data;
    } catch (e: unknown) {
      // 404 means no handoff exists yet
      if (e && typeof e === "object" && "statusCode" in e && (e as { statusCode: number }).statusCode === 404) {
        return null;
      }
      throw e;
    }
  },

  /**
   * Create or update handoff data.
   */
  async saveHandoff(
    propertyId: string,
    data: Partial<PropertyHandoff>,
    ownerNotes?: string | null,
  ): Promise<HandoffResponse> {
    const res = await apiPut<{ data: HandoffResponse }>(
      `/properties/${propertyId}/handoff`,
      { data, ownerNotes },
    );
    return res.data;
  },

  /**
   * Update handoff status.
   */
  async updateStatus(
    propertyId: string,
    status: "draft" | "in_progress" | "completed",
  ): Promise<HandoffResponse> {
    const res = await apiPost<{ data: HandoffResponse }>(
      `/properties/${propertyId}/handoff/status`,
      { status },
    );
    return res.data;
  },

  /**
   * Upload a photo (key, access code, garage, mailbox, etc.).
   */
  async uploadPhoto(
    propertyId: string,
    category: "key" | "access_code" | "garage" | "mailbox" | "other",
    label: string | null,
    file: File,
  ): Promise<HandoffPhoto> {
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("category", category);
    if (label) formData.append("label", label);

    const res = await apiUpload<{ data: HandoffPhoto }>(
      `/properties/${propertyId}/handoff/photos`,
      formData,
    );
    return res.data;
  },

  /**
   * Delete a handoff photo.
   */
  async deletePhoto(photoId: string): Promise<void> {
    await apiDelete(`/handoff-photos/${photoId}`);
  },

  /**
   * Notify property manager about checklist completion.
   */
  async notifyChecklistCompletion(
    propertyId: string,
    tenantName: string,
    propertyAddress: string,
  ): Promise<{ message: string }> {
    return apiPost<{ message: string }>(
      "/handoff/checklist-completion",
      { propertyId, tenantName, propertyAddress },
    );
  },
};
