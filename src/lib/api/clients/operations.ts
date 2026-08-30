/**
 * Operations APIs — action center and global search.
 */

import { apiGet, getAuthHeaders } from "../http";

export type ActionSeverity = "high" | "medium" | "low";

export type ActionKind =
  | "emergency_maintenance"
  | "overdue_maintenance"
  | "open_maintenance"
  | "outstanding_rent"
  | "expiring_leases"
  | "upcoming_move_ins"
  | "upcoming_move_outs"
  | "pending_applications"
  | "new_leads"
  | "overdue_tasks"
  | "vacancy";

export interface ActionItem {
  id: string;
  kind: ActionKind;
  severity: ActionSeverity;
  title: string;
  subtitle: string;
  count: number;
  hrefKey: ActionKind;
}

export interface ActionCenter {
  generatedAt: string;
  today: {
    rentCollectedCents: number;
    outstandingRentCents: number;
    newMaintenance: number;
    emergencyMaintenance: number;
    newLeads: number;
    pendingApplications: number;
    upcomingMoveIns: number;
    upcomingMoveOuts: number;
    expiringLeases: number;
    overdueTasks: number;
  };
  portfolio: {
    propertyCount: number;
    occupiedCount: number;
    occupancyRate: number;
    vacancyCount: number;
    revenueCentsMtd: number;
    expenseCentsMtd: number;
    delinquencyCount: number;
    openMaintenance: number;
  };
  actions: ActionItem[];
}

export type SearchEntityType =
  | "property"
  | "tenant"
  | "owner"
  | "lease"
  | "maintenance"
  | "document";

export interface SearchHit {
  type: SearchEntityType;
  id: string;
  title: string;
  subtitle: string;
  propertyId: string | null;
}

export const operationsApi = {
  async getActionCenter(): Promise<ActionCenter> {
    const res = await apiGet<{ message: string; data: ActionCenter }>(
      "/dashboard/action-center",
      getAuthHeaders(),
    );
    return res.data;
  },

  async search(q: string): Promise<{ query: string; results: SearchHit[] }> {
    const res = await apiGet<{ message: string; data: { query: string; results: SearchHit[] } }>(
      `/search?q=${encodeURIComponent(q)}`,
      getAuthHeaders(),
    );
    return res.data;
  },
};
