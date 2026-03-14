/**
 * Tenant Screening API client — aligned with backend /api/screening.
 * Backend returns camelCase (rowToCamel).
 */

import { apiGet, apiPost, getAuthHeaders } from "../http"

export type ScreeningStatus =
  | "invited"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"

export type ScreeningRecommendation = "approved" | "conditional" | "denied"

export interface BackgroundCheck {
  hasCriminal: boolean
  hasEviction: boolean
  summary?: string
}

export interface IncomeVerification {
  monthlyIncome: number
  employerVerified: boolean
  verifiedEmployer?: string
}

export interface ScreeningResult {
  status: ScreeningStatus
  creditScore?: number
  backgroundCheck?: BackgroundCheck
  incomeVerification?: IncomeVerification
  recommendation?: ScreeningRecommendation
  reportUrl?: string
  completedAt?: string
}

export interface Screening {
  id: string
  externalId: string | null
  propertyId: string
  tenantEmail: string
  initiatedBy: string
  status: ScreeningStatus
  result: ScreeningResult | null
  createdAt: string
  updatedAt: string
}

export interface InitiateScreeningPayload {
  tenantEmail: string
  tenantName: string
  propertyId: string
  landlordEmail?: string
}

export interface InitiateScreeningResponse {
  message: string
  screeningId: string
  externalId: string
  inviteUrl: string
  status: "invited"
}

export interface ListScreeningsParams {
  ownerId?: string
  page?: number
  limit?: number
}

export const screeningApi = {
  async list(params: ListScreeningsParams = {}): Promise<{ screenings: Screening[]; pagination: { page: number; limit: number; count: number } }> {
    const headers = getAuthHeaders()
    const search = new URLSearchParams()
    if (params.ownerId) search.set("ownerId", params.ownerId)
    if (params.page != null) search.set("page", String(params.page))
    if (params.limit != null) search.set("limit", String(params.limit))
    const q = search.toString()
    const res = await apiGet<{ screenings: Screening[]; pagination: { page: number; limit: number; count: number } }>(
      `/screening${q ? `?${q}` : ""}`,
      headers
    )
    return res
  },

  async get(screeningId: string): Promise<Screening> {
    const headers = getAuthHeaders()
    const res = await apiGet<{ screening: Screening }>(`/screening/${screeningId}`, headers)
    return res.screening
  },

  async initiate(payload: InitiateScreeningPayload): Promise<InitiateScreeningResponse> {
    const headers = getAuthHeaders()
    return apiPost<InitiateScreeningResponse>("/screening/initiate", payload, headers)
  },
}
