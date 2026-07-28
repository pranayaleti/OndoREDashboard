/**
 * Tenant Screening API client — aligned with backend /api/screening.
 * List/get return role-shaped views (`scorecard` | `full` | `status`).
 */

import { ApiError } from "@ondo/types"
import { apiGet, apiPost, apiPut, getAuthHeaders } from "../http"

export type ScreeningStatus =
  | "invited"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"

export type ScreeningRecommendation = "approved" | "conditional" | "denied"

export type CreditScoreBand =
  | "300-579"
  | "580-669"
  | "670-739"
  | "740-799"
  | "800-850"
  | "unavailable"

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

/** @deprecated Prefer ScreeningViewResponse — kept for initiate payloads / legacy. */
export interface ScreeningResult {
  status: ScreeningStatus
  creditScore?: number
  backgroundCheck?: BackgroundCheck
  incomeVerification?: IncomeVerification
  recommendation?: ScreeningRecommendation
  reportUrl?: string
  completedAt?: string
  ownerNote?: string | null
}

/** @deprecated Prefer ScreeningViewResponse. */
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

export interface ScreeningScorecardView {
  view: "scorecard"
  id: string
  status: ScreeningStatus
  recommendation: ScreeningRecommendation | null
  creditScoreBand: CreditScoreBand
  hasCriminal: boolean
  hasEviction: boolean
  incomeVerified: boolean
  ownerNote: string | null
  completedAt: string | null
  expiresAt: string | null
  propertyId: string
  tenantEmail: string
}

export interface ScreeningFullView {
  view: "full"
  id: string
  status: ScreeningStatus
  recommendation: ScreeningRecommendation | null
  creditScore: number | null
  creditScoreBand: CreditScoreBand
  backgroundCheck: BackgroundCheck | null
  incomeVerification: IncomeVerification | null | unknown
  reportUrl: string | null
  ownerNote: string | null
  completedAt: string | null
  expiresAt: string | null
  propertyId: string
  tenantEmail: string
  providerSubjectId: string | null
  result: ScreeningResult | null
}

export interface ScreeningStatusView {
  view: "status"
  id: string
  status: ScreeningStatus
  completedAt: string | null
  expiresAt: string | null
  isPortable: boolean
}

export type ScreeningViewResponse =
  | ScreeningScorecardView
  | ScreeningFullView
  | ScreeningStatusView

export interface InitiateScreeningPayload {
  tenantEmail: string
  tenantName: string
  propertyId: string
  landlordEmail?: string
}

export interface InitiateScreeningResponse {
  message: string
  screeningId: string
  externalId?: string
  inviteUrl?: string
  status?: ScreeningStatus
  needsPayment?: boolean
}

export interface ListScreeningsParams {
  ownerId?: string
  page?: number
  limit?: number
}

export interface ScreeningCta {
  enabled: boolean
  feeCents: number
  reuseDays: number
  applyPath: string | null
}

export interface CreateFeeIntentResponse {
  message: string
  clientSecret: string
  paymentIntentId: string
}

export interface SendScreeningPayload {
  propertyId: string
  applicationId?: string
}

export interface AttachScreeningPayload {
  applicationId: string
}

function tenantEmailFromView(s: ScreeningViewResponse): string {
  if (s.view === "status") return ""
  return s.tenantEmail
}

export const screeningApi = {
  async list(
    params: ListScreeningsParams = {}
  ): Promise<{
    screenings: ScreeningViewResponse[]
    pagination: { page: number; limit: number; count: number }
  }> {
    const headers = getAuthHeaders()
    const search = new URLSearchParams()
    if (params.ownerId) search.set("ownerId", params.ownerId)
    if (params.page != null) search.set("page", String(params.page))
    if (params.limit != null) search.set("limit", String(params.limit))
    const q = search.toString()
    return apiGet<{
      screenings: ScreeningViewResponse[]
      pagination: { page: number; limit: number; count: number }
    }>(`/screening${q ? `?${q}` : ""}`, headers)
  },

  async get(screeningId: string): Promise<ScreeningViewResponse> {
    const headers = getAuthHeaders()
    const res = await apiGet<{ screening: ScreeningViewResponse }>(
      `/screening/${screeningId}`,
      headers
    )
    return res.screening
  },

  async initiate(payload: InitiateScreeningPayload): Promise<InitiateScreeningResponse> {
    const headers = getAuthHeaders()
    return apiPost<InitiateScreeningResponse>("/screening/initiate", payload, headers)
  },

  async listPortable(): Promise<{ screenings: ScreeningViewResponse[] }> {
    const headers = getAuthHeaders()
    return apiGet<{ screenings: ScreeningViewResponse[] }>("/screening/portable", headers)
  },

  async send(
    screeningId: string,
    payload: SendScreeningPayload
  ): Promise<{ message: string; shareId: string }> {
    const headers = getAuthHeaders()
    return apiPost<{ message: string; shareId: string }>(
      `/screening/${screeningId}/send`,
      payload,
      headers
    )
  },

  async attach(
    screeningId: string,
    payload: AttachScreeningPayload
  ): Promise<{ message: string; shareId: string; screeningId: string }> {
    const headers = getAuthHeaders()
    const res = await apiPost<{ message: string; shareId: string; screeningId?: string }>(
      `/screening/${screeningId}/attach`,
      payload,
      headers
    )
    // Backend may omit screeningId; fall back to the id we attached.
    return { ...res, screeningId: res.screeningId ?? screeningId }
  },

  /**
   * Linked package for an application (role-shaped).
   * Returns null when the endpoint is missing (404) or no package is linked.
   */
  async getScreeningPackage(applicationId: string): Promise<ScreeningViewResponse | null> {
    const headers = getAuthHeaders()
    try {
      const res = await apiGet<{
        screening?: ScreeningViewResponse
        data?: ScreeningViewResponse
      }>(`/applications/${applicationId}/screening-package`, headers)
      return res.screening ?? res.data ?? null
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
        return null
      }
      throw err
    }
  },

  async createFeeIntent(screeningId: string): Promise<CreateFeeIntentResponse> {
    const headers = getAuthHeaders()
    return apiPost<CreateFeeIntentResponse>(
      `/screening/${screeningId}/create-fee-intent`,
      {},
      headers
    )
  },

  async updateOwnerNote(
    screeningId: string,
    ownerNote: string
  ): Promise<ScreeningViewResponse> {
    const headers = getAuthHeaders()
    const res = await apiPut<{ screening: ScreeningViewResponse }>(
      `/screening/${screeningId}/owner-note`,
      { ownerNote },
      headers
    )
    return res.screening
  },

  async waiveFee(applicationId: string): Promise<{ message: string }> {
    const headers = getAuthHeaders()
    return apiPost<{ message: string }>(
      `/applications/${applicationId}/waive-screening-fee`,
      {},
      headers
    )
  },

  async screeningCta(propertyId: string): Promise<ScreeningCta> {
    const res = await apiGet<{ message: string; data: ScreeningCta }>(
      `/properties/${propertyId}/screening-cta`
    )
    return res.data
  },

  /** Convenience: list items matching an applicant email (owner/manager initiated). */
  async listMatchingEmail(email: string): Promise<ScreeningViewResponse[]> {
    const res = await this.list({ page: 1, limit: 100 })
    const needle = email.trim().toLowerCase()
    return (res.screenings ?? []).filter(
      (s) => tenantEmailFromView(s).trim().toLowerCase() === needle
    )
  },
}
