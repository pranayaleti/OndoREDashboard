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

export type PipelineStage =
  | "lead"
  | "follow_up"
  | "qualified"
  | "application"
  | "screening"
  | "decision"
  | "lease"
  | "move_in"
  | "occupied";

export type PipelineCardKind = "lead" | "website_lead" | "application" | "lease";

export interface PipelineCard {
  id: string;
  kind: PipelineCardKind;
  stage: PipelineStage | "parked";
  title: string;
  subtitle: string;
  status: string;
  propertyId: string | null;
  propertyTitle: string | null;
  updatedAt: string;
}

export interface PipelineColumn {
  id: PipelineStage;
  label: string;
  count: number;
  cards: PipelineCard[];
}

export interface LeasingPipeline {
  generatedAt: string;
  stages: PipelineColumn[];
  parked: { count: number; cards: PipelineCard[] };
}

export const operationsApi = {
  async getActionCenter(): Promise<ActionCenter> {
    const res = await apiGet<{ message: string; data: ActionCenter }>(
      "/dashboard/action-center",
      getAuthHeaders(),
    );
    return res.data;
  },

  async getLeasingPipeline(): Promise<LeasingPipeline> {
    const res = await apiGet<{ message: string; data: LeasingPipeline }>(
      "/dashboard/leasing-pipeline",
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
