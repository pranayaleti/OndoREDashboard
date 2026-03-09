/**
 * Maintenance API client
 */

import {
  MaintenanceRequest,
} from "@ondo/types";
import { apiGet, apiPost, apiPut, apiDelete, getAuthHeaders } from "../http";

export interface MaintenanceListResponse {
  requests: MaintenanceRequest[];
  total: number;
  page: number;
  pageSize: number;
}

export const maintenanceApi = {
  async getRequests(
    propertyId?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<MaintenanceListResponse> {
    const headers = getAuthHeaders();
    const query = new URLSearchParams();
    if (propertyId) query.append("propertyId", propertyId);
    query.append("page", String(page));
    query.append("pageSize", String(pageSize));

    return apiGet<MaintenanceListResponse>(
      `/maintenance?${query.toString()}`,
      headers,
    );
  },

  async getRequest(id: string): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    return apiGet<MaintenanceRequest>(`/maintenance/${id}`, headers);
  },

  async createRequest(request: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    return apiPost<MaintenanceRequest>("/maintenance", request, headers);
  },

  async updateRequest(
    id: string,
    request: Partial<MaintenanceRequest>,
  ): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    return apiPut<MaintenanceRequest>(`/maintenance/${id}`, request, headers);
  },

  async updateStatus(
    id: string,
    status: string,
  ): Promise<MaintenanceRequest> {
    const headers = getAuthHeaders();
    return apiPut<MaintenanceRequest>(`/maintenance/${id}/status`, { status }, headers);
  },

  async deleteRequest(id: string): Promise<{ message: string }> {
    const headers = getAuthHeaders();
    return apiDelete<{ message: string }>(`/maintenance/${id}`, headers);
  },
};
