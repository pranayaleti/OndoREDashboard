/**
 * Tenant Screening API client — wired to OndoREBackend `/api/screening` routes.
 */

import { apiGet, apiPost, apiPut, getAuthHeaders } from "../http";
import type {
  TenantScreeningSummary,
  TenantScreeningSummaryParams,
  TenantScreeningApplicant,
  TenantScreeningApplicantParams,
  TenantScreeningReport,
  TenantScreeningStatus,
} from "./legacy-types";
import { TenantScreeningSchema, ScreeningReportSchema } from "../schemas";

// ─── Backend list payload (camelCase from API) ───────────────────────────────

interface BackendScreeningRow {
  id: string;
  externalId: string | null;
  propertyId: string;
  tenantEmail: string;
  initiatedBy: string;
  status: string;
  result: {
    status?: string;
    creditScore?: number;
    recommendation?: string;
    reportUrl?: string;
    completedAt?: string;
    backgroundCheck?: { hasCriminal?: boolean; hasEviction?: boolean; summary?: string };
    incomeVerification?: { monthlyIncome?: number; employerVerified?: boolean };
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface ScreeningListResponse {
  screenings: BackendScreeningRow[];
  pagination: { page: number; limit: number; count: number };
}

interface ScreeningDetailResponse {
  screening: BackendScreeningRow;
}

function daysForTimeframe(tf: string | undefined): number {
  switch (tf) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    default:
      return 30;
  }
}

function inTimeframe(createdAt: string, days: number): boolean {
  const t = new Date(createdAt).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return t >= cutoff;
}

function mapBackendToUiStatus(row: BackendScreeningRow): TenantScreeningStatus {
  const rec = row.result?.recommendation;
  if (row.status === "failed" || row.status === "cancelled") return "flagged";
  if (row.status === "invited" || row.status === "in_progress") return "pending";
  if (row.status === "completed") {
    if (rec === "approved") return "approved";
    if (rec === "denied") return "flagged";
    return "in_review";
  }
  return "pending";
}

function mapRowToApplicant(row: BackendScreeningRow): TenantScreeningApplicant {
  const score = typeof row.result?.creditScore === "number" ? row.result.creditScore : 0;
  const status = mapBackendToUiStatus(row);
  const fraudFlags: string[] = [];
  if (row.result?.backgroundCheck?.hasCriminal) fraudFlags.push("criminal_record");
  if (row.result?.backgroundCheck?.hasEviction) fraudFlags.push("eviction");

  let progress = 33;
  if (row.status === "in_progress") progress = 66;
  if (row.status === "completed" || row.status === "failed") progress = 100;

  return {
    id: row.id,
    applicantName: row.tenantEmail,
    score,
    status,
    submittedAt: row.createdAt,
    verifiedIds: row.status === "completed" ? 1 : 0,
    fraudFlags: fraudFlags.length ? fraudFlags : undefined,
    progress,
    decisionTimeline: row.updatedAt !== row.createdAt ? row.updatedAt : undefined,
  };
}

function buildSummaryFromRows(
  rows: BackendScreeningRow[],
  timeframe: string,
): TenantScreeningSummary {
  const applicants = rows.map(mapRowToApplicant);
  const total = applicants.length;
  const approvedCount = applicants.filter((a) => a.status === "approved").length;
  const flaggedCount = applicants.filter((a) => a.status === "flagged").length;
  const scores = applicants.map((a) => a.score).filter((s) => s > 0);
  const averageScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  return {
    timeframe,
    totalApplications: total,
    approvedCount,
    flaggedCount,
    fraudPrevented: flaggedCount,
    averageScore,
    verificationRate: total ? Math.round((approvedCount / total) * 100) : 0,
    topSignals: total ? [{ label: "Screenings", value: String(total) }] : [],
  };
}

async function fetchFilteredScreenings(
  params: TenantScreeningApplicantParams,
): Promise<BackendScreeningRow[]> {
  const q = new URLSearchParams();
  q.set("page", "1");
  q.set("limit", "100");
  if (
    params.ownerId &&
    (params.role === "admin" || params.role === "super_admin")
  ) {
    q.set("ownerId", params.ownerId);
  }

  const res = await apiGet<ScreeningListResponse>(`/screening?${q.toString()}`);
  const rows = res.screenings ?? [];

  const days = daysForTimeframe(params.timeframe);
  let filtered = rows.filter((r) => inTimeframe(r.createdAt, days));

  if (params.propertyId) {
    filtered = filtered.filter((r) => r.propertyId === params.propertyId);
  }
  if (params.status) {
    filtered = filtered.filter((r) => mapBackendToUiStatus(r) === params.status);
  }

  return filtered;
}

/** Single round-trip for dashboard widgets (summary + applicant list). */
export async function getTenantScreeningWidgetData(
  params: TenantScreeningApplicantParams,
): Promise<{ summary: TenantScreeningSummary; applicants: TenantScreeningApplicant[] }> {
  const filtered = await fetchFilteredScreenings(params);
  const timeframe = params.timeframe ?? "30d";
  const summary = buildSummaryFromRows(filtered, timeframe);
  const lim = params.limit ?? 50;
  const applicants = filtered.slice(0, lim).map(mapRowToApplicant);
  return { summary, applicants };
}

function mapRowToReport(row: BackendScreeningRow): TenantScreeningReport {
  const base = mapRowToApplicant(row);
  const history: Array<{ label: string; value: string }> = [
    { label: "Workflow status", value: row.status },
    { label: "Tenant email", value: row.tenantEmail },
  ];
  if (row.result?.creditScore != null) {
    history.push({ label: "Credit score", value: String(row.result.creditScore) });
  }
  if (row.result?.recommendation) {
    history.push({ label: "Recommendation", value: row.result.recommendation });
  }
  if (row.result?.reportUrl) {
    history.push({ label: "Report URL", value: row.result.reportUrl });
  }

  const documents: Array<{ name: string; status: "verified" | "pending" | "missing" }> = [];
  if (row.result?.reportUrl) {
    documents.push({ name: "Provider report", status: "verified" });
  }

  return {
    ...base,
    email: row.tenantEmail,
    history,
    documents,
    riskSummary: row.result?.recommendation
      ? `Recommendation: ${row.result.recommendation}`
      : undefined,
    notes: row.result?.backgroundCheck?.summary,
  };
}

// ─── Legacy / extended shapes (keep for typings & rare callers) ─────────────

export interface TenantScreening {
  id: string;
  tenantId: string;
  propertyId: string;
  status: "pending" | "approved" | "rejected" | "review";
  creditScore?: number;
  backgroundCheckPassed?: boolean;
  incomeVerification?: {
    verified: boolean;
    monthlyIncome: number;
  };
  rentalHistory?: {
    yearsAsRenter: number;
    evictions: number;
  };
  flags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScreeningReport {
  screeningId: string;
  summary: string;
  riskLevel: "low" | "medium" | "high";
  creditInfo?: {
    score: number;
    delinquencies: number;
  };
  backgroundInfo?: {
    convictions: string[];
    evictions: number;
  };
  incomeInfo?: {
    monthly: number;
    source: string;
  };
  recommendations: string[];
}

export const tenantScreeningApi = {
  async submitScreening(
    tenantId: string,
    propertyId: string,
    data: Record<string, unknown>,
  ): Promise<TenantScreening> {
    const headers = getAuthHeaders();
    return apiPost<TenantScreening>(
      "/tenant-screening",
      { tenantId, propertyId, ...data },
      headers,
    );
  },

  async getScreening(id: string): Promise<TenantScreening> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>(`/tenant-screening/${id}`, headers);
    return TenantScreeningSchema.parse(raw) as TenantScreening;
  },

  async getScreeningsByProperty(propertyId: string): Promise<TenantScreening[]> {
    const headers = getAuthHeaders();
    return apiGet<TenantScreening[]>(`/tenant-screening/property/${propertyId}`, headers);
  },

  async getScreeningReport(screeningId: string): Promise<ScreeningReport> {
    const headers = getAuthHeaders();
    const raw = await apiGet<unknown>(
      `/tenant-screening/${screeningId}/report`,
      headers,
    );
    return ScreeningReportSchema.parse(raw) as ScreeningReport;
  },

  async approveScreening(id: string, notes?: string): Promise<TenantScreening> {
    const headers = getAuthHeaders();
    return apiPut<TenantScreening>(
      `/tenant-screening/${id}/approve`,
      { notes },
      headers,
    );
  },

  async rejectScreening(id: string, reason: string): Promise<TenantScreening> {
    const headers = getAuthHeaders();
    return apiPut<TenantScreening>(
      `/tenant-screening/${id}/reject`,
      { reason },
      headers,
    );
  },

  async requestAdditionalInfo(
    id: string,
    requiredInfo: string[],
  ): Promise<TenantScreening> {
    const headers = getAuthHeaders();
    return apiPut<TenantScreening>(
      `/tenant-screening/${id}/request-info`,
      { requiredInfo },
      headers,
    );
  },

  async getSummary(params: TenantScreeningSummaryParams): Promise<TenantScreeningSummary> {
    const { summary } = await getTenantScreeningWidgetData({
      ...params,
      limit: 100,
    } as TenantScreeningApplicantParams);
    return summary;
  },

  async getApplicants(
    params: TenantScreeningApplicantParams,
  ): Promise<TenantScreeningApplicant[]> {
    const { applicants } = await getTenantScreeningWidgetData(params);
    return applicants;
  },

  async getReport(reportId: string): Promise<TenantScreeningReport> {
    const headers = getAuthHeaders();
    const raw = await apiGet<ScreeningDetailResponse>(`/screening/${reportId}`, headers);
    if (!raw.screening) {
      throw new Error("Screening not found");
    }
    return mapRowToReport(raw.screening);
  },
};
