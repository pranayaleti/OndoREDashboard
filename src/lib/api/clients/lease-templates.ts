/**
 * Staff-authored lease templates. GET /lease-templates returns approved rows
 * for owners; staff may pass includeUnapproved. Drafts/samples are for
 * reference only and are never a binding form until reviewed through
 * appropriate legal channels and marked approved.
 */

import { apiGet, apiPost, getAuthHeaders } from "../http";

export type LeaseTemplateKind = "base_lease" | "addendum" | "disclosure" | "other";
export type LeaseTemplateStatus = "draft" | "approved" | "archived";

export interface LeaseTemplateRecord {
  id: string;
  name: string;
  state: string | null;
  kind: LeaseTemplateKind;
  description: string | null;
  body: string;
  status: LeaseTemplateStatus;
  version: number;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  mergeFields?: string[];
}

export interface ListLeaseTemplatesParams {
  state?: string;
  kind?: LeaseTemplateKind;
  includeUnapproved?: boolean;
}

function queryString(params?: ListLeaseTemplatesParams): string {
  if (!params) return "";
  const q = new URLSearchParams();
  if (params.state) q.set("state", params.state);
  if (params.kind) q.set("kind", params.kind);
  if (params.includeUnapproved) q.set("includeUnapproved", "1");
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const leaseTemplatesApi = {
  async list(params?: ListLeaseTemplatesParams): Promise<LeaseTemplateRecord[]> {
    const headers = getAuthHeaders();
    const response = await apiGet<{ message?: string; data: LeaseTemplateRecord[] }>(
      `/lease-templates${queryString(params)}`,
      headers,
    );
    return response.data ?? [];
  },

  async get(id: string): Promise<LeaseTemplateRecord> {
    const headers = getAuthHeaders();
    const response = await apiGet<{ message?: string; data: LeaseTemplateRecord }>(
      `/lease-templates/${id}`,
      headers,
    );
    return response.data;
  },

  async render(
    id: string,
    data: Record<string, string | number | null>,
  ): Promise<{ template: LeaseTemplateRecord; text: string; missing: string[] }> {
    const headers = getAuthHeaders();
    const response = await apiPost<{
      message?: string;
      data: { template: LeaseTemplateRecord; text: string; missing: string[] };
    }>(`/lease-templates/${id}/render`, { data }, headers);
    return response.data;
  },
};
