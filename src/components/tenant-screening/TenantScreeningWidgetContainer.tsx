import { useCallback, useEffect, useState } from "react"
import { TenantScreeningWidget, type TenantScreeningWidgetProps } from "./TenantScreeningWidget"
import { useTenantScreening } from "@/hooks/useTenantScreening"
import { useAuth } from "@/lib/auth-context"
import { screeningApi, type ScreeningViewResponse } from "@/lib/api/clients/screening"
import type { TenantScreeningApplicantParams } from "@/lib/api"

type ContainerProps = Omit<
  TenantScreeningWidgetProps,
  "summary" | "applicants" | "loading" | "error" | "onRefresh" | "screeningViews" | "allowOwnerNoteEdit"
> & {
  propertyId?: string
  tenantId?: string
  timeframe?: "7d" | "30d" | "90d"
  limit?: number
  status?: TenantScreeningApplicantParams["status"]
  auto?: boolean
  /** Prefer role-shaped /screening list over analytics applicants. Default true. */
  useRoleViews?: boolean
}

const MANAGER_ROLES = new Set(["manager", "admin", "super_admin"])

export function TenantScreeningWidgetContainer({
  propertyId,
  tenantId,
  timeframe,
  limit = 4,
  status,
  auto,
  useRoleViews = true,
  ...widgetProps
}: ContainerProps) {
  const { user } = useAuth()
  const role = user?.role ?? ""
  const allowOwnerNoteEdit = MANAGER_ROLES.has(role)

  const { summary, applicants, loading: analyticsLoading, error: analyticsError, refresh: refreshAnalytics } =
    useTenantScreening({
      propertyId,
      tenantId,
      timeframe,
      limit,
      status,
      auto: useRoleViews ? false : auto,
    })

  const [views, setViews] = useState<ScreeningViewResponse[]>([])
  const [viewsLoading, setViewsLoading] = useState(useRoleViews)
  const [viewsError, setViewsError] = useState<string | null>(null)

  const refreshViews = useCallback(async () => {
    if (!useRoleViews) return
    setViewsLoading(true)
    setViewsError(null)
    try {
      const res = await screeningApi.list({ page: 1, limit })
      let list = res.screenings ?? []
      if (propertyId) {
        list = list.filter((s) => s.view === "status" || s.propertyId === propertyId)
      }
      setViews(list.slice(0, limit))
    } catch (e) {
      setViewsError(e instanceof Error ? e.message : "Failed to load screenings")
      setViews([])
    } finally {
      setViewsLoading(false)
    }
  }, [useRoleViews, limit, propertyId])

  useEffect(() => {
    void refreshViews()
  }, [refreshViews])

  const onRefresh = () => {
    if (useRoleViews) {
      void refreshViews()
    } else {
      void refreshAnalytics()
    }
  }

  return (
    <TenantScreeningWidget
      summary={summary}
      applicants={applicants}
      screeningViews={useRoleViews ? views : undefined}
      loading={useRoleViews ? viewsLoading : analyticsLoading}
      error={useRoleViews ? viewsError : analyticsError}
      onRefresh={onRefresh}
      allowOwnerNoteEdit={allowOwnerNoteEdit}
      {...widgetProps}
    />
  )
}
