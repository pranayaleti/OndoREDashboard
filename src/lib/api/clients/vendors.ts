/**
 * Vendors API client
 */

import { apiGet, apiPost, apiPut, apiDelete, getAuthHeaders } from "../http";

export interface Vendor {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  specialty: string;
  secondarySpecialties?: string[];
  licenseNumber?: string;
  insuranceInfo?: string;
  hourlyRate?: number;
  rating: number;
  reviewCount: number;
  status: string;
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  serviceRadiusMiles?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorPayload {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  specialty: string;
  secondarySpecialties?: string[];
  licenseNumber?: string;
  insuranceInfo?: string;
  hourlyRate?: number;
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  serviceRadiusMiles?: number;
}

export interface VendorAssignment {
  id: string;
  vendorId: string;
  maintenanceRequestId: string;
  assignedBy: string;
  estimatedCost?: number;
  actualCost?: number;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export const vendorsApi = {
  async list(filters?: {
    specialty?: string;
    status?: string;
    city?: string;
  }): Promise<{ data: Vendor[] }> {
    const headers = getAuthHeaders();
    const params = new URLSearchParams();
    if (filters?.specialty) params.set("specialty", filters.specialty);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.city) params.set("city", filters.city);
    const qs = params.toString();
    return apiGet<{ data: Vendor[] }>(`/vendors${qs ? `?${qs}` : ""}`, headers);
  },

  async get(id: string): Promise<{ data: Vendor }> {
    const headers = getAuthHeaders();
    return apiGet<{ data: Vendor }>(`/vendors/${id}`, headers);
  },

  async create(payload: CreateVendorPayload): Promise<{ data: Vendor }> {
    const headers = getAuthHeaders();
    return apiPost<{ data: Vendor }>("/vendors", payload, headers);
  },

  async update(
    id: string,
    payload: Partial<CreateVendorPayload>,
  ): Promise<{ data: Vendor }> {
    const headers = getAuthHeaders();
    return apiPut<{ data: Vendor }>(`/vendors/${id}`, payload, headers);
  },

  async delete(id: string): Promise<{ message: string }> {
    const headers = getAuthHeaders();
    return apiDelete<{ message: string }>(`/vendors/${id}`, headers);
  },

  async suggest(
    category: string,
    city?: string,
  ): Promise<{ data: Vendor[] }> {
    const headers = getAuthHeaders();
    const params = new URLSearchParams({ category });
    if (city) params.set("city", city);
    return apiGet<{ data: Vendor[] }>(`/vendors/suggest?${params.toString()}`, headers);
  },

  async assign(payload: {
    vendorId: string;
    maintenanceRequestId: string;
    estimatedCost?: number;
    scheduledDate?: string;
    notes?: string;
  }): Promise<{ data: VendorAssignment }> {
    const headers = getAuthHeaders();
    return apiPost<{ data: VendorAssignment }>("/vendors/assign", payload, headers);
  },

  async getAssignments(vendorId: string): Promise<{ data: VendorAssignment[] }> {
    const headers = getAuthHeaders();
    return apiGet<{ data: VendorAssignment[] }>(
      `/vendors/${vendorId}/assignments`,
      headers,
    );
  },
};
