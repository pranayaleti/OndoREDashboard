import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ApiError,
  getTenantScreeningWidgetData,
  tenantScreeningApi,
  type TenantScreeningApplicant,
  type TenantScreeningApplicantParams,
  type TenantScreeningReport,
  type TenantScreeningSummary,
  type TenantScreeningSummaryParams,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type UseTenantScreeningOptions = {
  propertyId?: string
  tenantId?: string
  timeframe?: TenantScreeningSummaryParams["timeframe"]
  limit?: number
  status?: TenantScreeningApplicantParams["status"]
  auto?: boolean
}

interface TenantScreeningHookResult {
  summary: TenantScreeningSummary | null
  applicants: TenantScreeningApplicant[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  fetchReport: (reportId: string) => Promise<TenantScreeningReport>
}

export function useTenantScreening(options?: UseTenantScreeningOptions): TenantScreeningHookResult {
  const { user } = useAuth()
  const [summary, setSummary] = useState<TenantScreeningSummary | null>(null)
  const [applicants, setApplicants] = useState<TenantScreeningApplicant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const derivedParams = useMemo<TenantScreeningApplicantParams | null>(() => {
    if (!user) return null

    const base: TenantScreeningApplicantParams = {
      role: user.role,
      timeframe: options?.timeframe ?? "30d",
      limit: options?.limit ?? 5,
    }

    switch (user.role) {
      case "owner":
      case "manager":
        // Backend scopes list by JWT userId (initiated_by). Do not send ownerId unless admin uses ?ownerId.
        break
      case "tenant":
        base.tenantId = options?.tenantId ?? user.id
        if (options?.propertyId) {
          base.propertyId = options.propertyId
        }
        break
      case "maintenance":
        break
      default:
        break
    }

    if (options?.propertyId && user.role !== "tenant") {
      base.propertyId = options.propertyId
    }
    if (options?.tenantId && user.role !== "tenant") {
      base.tenantId = options.tenantId
    }
    if (options?.status) {
      base.status = options.status
    }

    return base
  }, [
    options?.limit,
    options?.propertyId,
    options?.status,
    options?.tenantId,
    options?.timeframe,
    user,
  ])

  const fetchData = useCallback(async () => {
    if (!derivedParams) return
    setLoading(true)
    try {
      const { summary: summaryResponse, applicants: applicantsResponse } =
        await getTenantScreeningWidgetData(derivedParams)

      setSummary(summaryResponse)
      setApplicants(applicantsResponse)
      setError(null)
    } catch (err: unknown) {
      let message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unable to load tenant screening data"

      if (err instanceof ApiError && (err as ApiError).status === 404) {
        message =
          "Tenant screening endpoint not found (404). Ensure OndoREBackend is running and VITE_API_BASE_URL includes /api (e.g. http://localhost:3030/api)."
      } else if (typeof message === "string" && message.includes("<html")) {
        message =
          "Tenant screening service returned an unexpected response. Double-check the proxy URL or backend deployment."
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }, [derivedParams])

  useEffect(() => {
    if ((options?.auto ?? true) && derivedParams) {
      fetchData()
    }
  }, [derivedParams, fetchData, options?.auto])

  const fetchReport = useCallback(async (reportId: string) => {
    if (!reportId) {
      throw new Error("Report ID is required")
    }
    return tenantScreeningApi.getReport(reportId)
  }, [])

  return {
    summary,
    applicants,
    loading,
    error,
    refresh: fetchData,
    fetchReport,
  }
}


