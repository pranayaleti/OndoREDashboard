/**
 * Organizations API client (Phase 1 backend). Responses wrapped in { message, data }.
 */

import { apiGet, apiPost, apiDelete, apiRequest, getAuthHeaders } from "../http";

export type OrgRole = "org_admin" | "member";
export type OrgType = "pm_firm" | "team";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  branding: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  createdAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  type?: OrgType;
  branding?: Record<string, unknown>;
}

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export interface OrgPendingInvite {
  id: string;
  email: string;
  orgRole: string | null;
  status: string;
  expiresAt: string;
  createdAt: string | null;
}

export type InviteResult =
  | { status: "added"; member: OrganizationMember }
  | { status: "invited"; email: string; expiresAt: string };

interface Wrapped<T> {
  message: string;
  data: T;
}

export const organizationsApi = {
  async list(): Promise<Organization[]> {
    const res = await apiGet<Wrapped<Organization[]>>("/organizations", getAuthHeaders());
    return res.data;
  },
  async get(id: string): Promise<Organization> {
    const res = await apiGet<Wrapped<Organization>>(`/organizations/${id}`, getAuthHeaders());
    return res.data;
  },
  async create(input: CreateOrganizationInput): Promise<Organization> {
    const res = await apiPost<Wrapped<Organization>>("/organizations", input, getAuthHeaders());
    return res.data;
  },
  async update(id: string, patch: UpdateOrganizationInput): Promise<Organization> {
    const res = await apiRequest<Wrapped<Organization>>(
      "PATCH",
      `/organizations/${id}`,
      patch,
      getAuthHeaders(),
    );
    return res.data;
  },
  async listMembers(id: string): Promise<OrganizationMember[]> {
    const res = await apiGet<Wrapped<OrganizationMember[]>>(`/organizations/${id}/members`, getAuthHeaders());
    return res.data;
  },
  async addMember(id: string, userId: string, role: OrgRole = "member"): Promise<OrganizationMember> {
    const res = await apiPost<Wrapped<OrganizationMember>>(
      `/organizations/${id}/members`,
      { userId, role },
      getAuthHeaders(),
    );
    return res.data;
  },
  /**
   * Invite by email. Existing accounts are added immediately; brand-new emails
   * get a signup invitation that auto-joins the org on signup.
   */
  async inviteByEmail(id: string, email: string, role: OrgRole = "member"): Promise<InviteResult> {
    const res = await apiPost<Wrapped<InviteResult>>(
      `/organizations/${id}/invites`,
      { email, role },
      getAuthHeaders(),
    );
    return res.data;
  },
  async listInvites(id: string): Promise<OrgPendingInvite[]> {
    const res = await apiGet<Wrapped<OrgPendingInvite[]>>(`/organizations/${id}/invites`, getAuthHeaders());
    return res.data;
  },
  async revokeInvite(id: string, inviteId: string): Promise<{ id: string }> {
    const res = await apiDelete<Wrapped<{ id: string }>>(
      `/organizations/${id}/invites/${inviteId}`,
      getAuthHeaders(),
    );
    return res.data;
  },
  async removeMember(id: string, userId: string): Promise<{ userId: string }> {
    const res = await apiDelete<Wrapped<{ userId: string }>>(
      `/organizations/${id}/members/${userId}`,
      getAuthHeaders(),
    );
    return res.data;
  },
};
