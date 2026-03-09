/**
 * Rent Schedules API client
 */

import { apiGet, apiPost, apiPut, getAuthHeaders } from "../http";

export interface RentSchedule {
  id: string;
  tenantId: string;
  propertyId: string;
  amountCents: number;
  dueDate: string;
  status: string;
  paymentId?: string;
  paidAt?: string;
  lateFeeCents: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RentSummary {
  totalExpected: number;
  totalCollected: number;
  totalOverdue: number;
  paidCount: number;
  overdueCount: number;
  upcomingCount: number;
}

export const rentSchedulesApi = {
  async getMySchedule(status?: string): Promise<{ data: RentSchedule[] }> {
    const headers = getAuthHeaders();
    const qs = status ? `?status=${status}` : "";
    return apiGet<{ data: RentSchedule[] }>(`/rent-schedules/my-schedule${qs}`, headers);
  },

  async getUpcoming(): Promise<{ data: RentSchedule | null }> {
    const headers = getAuthHeaders();
    return apiGet<{ data: RentSchedule | null }>("/rent-schedules/upcoming", headers);
  },

  async getPropertySchedules(propertyId: string): Promise<{ data: RentSchedule[] }> {
    const headers = getAuthHeaders();
    return apiGet<{ data: RentSchedule[] }>(
      `/rent-schedules/property/${propertyId}`,
      headers,
    );
  },

  async getPropertySummary(propertyId: string): Promise<{ data: RentSummary }> {
    const headers = getAuthHeaders();
    return apiGet<{ data: RentSummary }>(
      `/rent-schedules/property/${propertyId}/summary`,
      headers,
    );
  },

  async create(payload: {
    tenantId: string;
    propertyId: string;
    amountCents: number;
    dueDate: string;
  }): Promise<{ data: RentSchedule }> {
    const headers = getAuthHeaders();
    return apiPost<{ data: RentSchedule }>("/rent-schedules", payload, headers);
  },

  async generate(payload: {
    tenantId: string;
    propertyId: string;
    amountCents: number;
    startDate: string;
    months?: number;
  }): Promise<{ data: RentSchedule[] }> {
    const headers = getAuthHeaders();
    return apiPost<{ data: RentSchedule[] }>("/rent-schedules/generate", payload, headers);
  },

  async markPaid(
    id: string,
    paymentId: string,
  ): Promise<{ data: RentSchedule }> {
    const headers = getAuthHeaders();
    return apiPut<{ data: RentSchedule }>(
      `/rent-schedules/${id}/paid`,
      { paymentId },
      headers,
    );
  },
};
