/**
 * Reports API client — financial reporting (P&L, rent roll, vacancy).
 * Backend: GET /api/reports/pnl, /rent-roll, /vacancy (+ export endpoints).
 * Owner: no ownerId. Manager/Admin: pass ownerId in query.
 */

import { getApiBaseUrl } from "../base-url";
import { apiGet, getAuthHeaders } from "../http";

export interface PnLIncome {
  rent: number;
  lateFees: number;
  other: number;
  total: number;
}

export interface PnLExpenses {
  maintenance: number;
  utilities: number;
  management: number;
  other: number;
  total: number;
}

export interface PnLPropertyLine {
  propertyId: string;
  propertyAddress: string;
  income: number;
  expenses: number;
  netIncome: number;
}

export interface PnLStatement {
  startDate: string;
  endDate: string;
  income: PnLIncome;
  expenses: PnLExpenses;
  netIncome: number;
  properties: PnLPropertyLine[];
}

export interface RentRollRow {
  propertyId: string;
  propertyAddress: string;
  unitNumber: string | null;
  tenantName: string | null;
  tenantEmail: string | null;
  monthlyRent: number;
  leaseStart: string | null;
  leaseEnd: string | null;
  lastPaymentDate: string | null;
  balanceDue: number;
  status: "occupied" | "vacant" | "pending";
}

export interface VacancyPropertyRow {
  propertyId: string;
  propertyAddress: string;
  status: string;
  isOccupied: boolean;
  tenantName: string | null;
}

export interface VacancyReport {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  vacancyRate: number;
  properties: VacancyPropertyRow[];
}

export interface GetPnLParams {
  startDate: string;
  endDate: string;
  propertyId?: string;
}

export interface GetRentRollParams {
  month?: number;
  year?: number;
  propertyId?: string;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

export const reportsApi = {
  /**
   * P&L statement. Owner: omit ownerId. Manager/Admin: pass ownerId.
   */
  async getPnL(
    params: GetPnLParams,
    ownerId?: string
  ): Promise<PnLStatement> {
    const headers = getAuthHeaders();
    const query = buildQuery({
      startDate: params.startDate,
      endDate: params.endDate,
      propertyId: params.propertyId,
      ownerId,
    });
    const res = await apiGet<{ data: PnLStatement }>(
      `/reports/pnl${query}`,
      headers
    );
    return res.data;
  },

  /**
   * Rent roll. Owner: omit ownerId. Manager/Admin: pass ownerId.
   */
  async getRentRoll(
    params: GetRentRollParams = {},
    ownerId?: string
  ): Promise<RentRollRow[]> {
    const headers = getAuthHeaders();
    const query = buildQuery({
      month: params.month,
      year: params.year,
      propertyId: params.propertyId,
      ownerId,
    });
    const res = await apiGet<{ data: RentRollRow[] }>(
      `/reports/rent-roll${query}`,
      headers
    );
    return res.data ?? [];
  },

  /**
   * Vacancy report. Owner: omit ownerId. Manager/Admin: pass ownerId.
   */
  async getVacancy(ownerId?: string): Promise<VacancyReport> {
    const headers = getAuthHeaders();
    const query = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : "";
    const res = await apiGet<{ data: VacancyReport }>(
      `/reports/vacancy${query}`,
      headers
    );
    return res.data;
  },

  /**
   * Build URL for P&L CSV download (same query params as getPnL).
   * Caller must open in new window or use fetch with credentials to download.
   */
  buildPnLExportUrl(params: GetPnLParams, ownerId?: string): string {
    const base = getApiBaseUrl();
    const query = buildQuery({
      startDate: params.startDate,
      endDate: params.endDate,
      propertyId: params.propertyId,
      ownerId,
    });
    return `${base}/reports/pnl/export${query}`;
  },

  /**
   * Build URL for rent roll CSV download.
   */
  buildRentRollExportUrl(
    params: GetRentRollParams = {},
    ownerId?: string
  ): string {
    const base = getApiBaseUrl();
    const query = buildQuery({
      month: params.month,
      year: params.year,
      propertyId: params.propertyId,
      ownerId,
    });
    return `${base}/reports/rent-roll/export${query}`;
  },
};
