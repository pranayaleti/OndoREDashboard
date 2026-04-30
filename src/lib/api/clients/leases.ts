/**
 * Leases + lease renewals API client.
 */
import { apiGet, apiPost, apiPut } from "../http";

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rent: number;
  securityDeposit?: number | null;
  status: "draft" | "pending_signature" | "signed" | "active" | "expired" | "terminated";
  esignProvider?: string | null;
  esignExternalId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaseRenewal {
  id: string;
  leaseId: string;
  proposedRent: number;
  proposedStartDate: string;
  proposedEndDate: string;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  noticeSentAt?: string | null;
  respondedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export const leasesApi = {
  async createLease(input: Partial<Lease>): Promise<Lease> {
    const res = await apiPost("/leases", input);
    return (res as { data: Lease }).data ?? (res as Lease);
  },

  async getLease(leaseId: string): Promise<Lease> {
    const res = await apiGet(`/leases/${leaseId}`);
    return (res as { data: Lease }).data ?? (res as Lease);
  },

  async updateLease(leaseId: string, updates: Partial<Lease>): Promise<Lease> {
    const res = await apiPut(`/leases/${leaseId}`, updates);
    return (res as { data: Lease }).data ?? (res as Lease);
  },

  async sendForSignature(leaseId: string): Promise<{ signingUrls: Record<string, string> }> {
    const res = await apiPost(`/leases/${leaseId}/send-for-signature`, {});
    return (res as { data: { signingUrls: Record<string, string> } }).data;
  },

  async createRenewalOffer(input: {
    leaseId: string;
    proposedRent: number;
    proposedStartDate: string;
    proposedEndDate: string;
    expiresInDays?: number;
  }): Promise<LeaseRenewal> {
    const res = await apiPost("/lease-renewals", input);
    return (res as { data: LeaseRenewal }).data;
  },

  async sendRenewalNotice(renewalId: string): Promise<LeaseRenewal> {
    const res = await apiPost(`/lease-renewals/${renewalId}/send`, {});
    return (res as { data: LeaseRenewal }).data;
  },

  async getRenewals(propertyId: string, status?: string): Promise<LeaseRenewal[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await apiGet(`/properties/${propertyId}/lease-renewals${qs}`);
    return ((res as { data: LeaseRenewal[] }).data ?? []) as LeaseRenewal[];
  },

  async getUpcomingRenewals(daysAhead = 90): Promise<Array<Lease & { daysUntilExpiry: number }>> {
    const res = await apiGet(`/lease-renewals/upcoming?days=${daysAhead}`);
    return ((res as { data: Array<Lease & { daysUntilExpiry: number }> }).data ?? []);
  },
};
