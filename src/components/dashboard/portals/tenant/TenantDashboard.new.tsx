import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth-context"
import { useWelcomeToast } from "@/hooks/use-welcome-toast"
import { BaseDashboard, BaseDashboardProvider } from "../../base"
import { createTenantConfig } from "./tenant.config"
import { useBaseDashboard } from "../../base/BaseDashboardContext"
import { formatUSDate } from "@/lib/us-format"
/**
 * New TenantDashboard using BaseDashboard architecture
 */
function TenantDashboardContent() {
  const { user: _user } = useAuth()
  const { t } = useTranslation("tenant")
  const { data, updateData } = useBaseDashboard()

  // Transform fetched data into config format
  const config = useMemo(() => {
    const assignedProperty = data.assignedProperty || null
    const maintenanceRequests = data.maintenanceRequests || []
    const rentSchedule = data.rentSchedule || []

    return createTenantConfig(assignedProperty, maintenanceRequests, rentSchedule, t)
  }, [data.assignedProperty, data.maintenanceRequests, data.rentSchedule, t])

  // Generate activities from fetched data
  const activities = useMemo(() => {
    const maintenanceRequests = data.maintenanceRequests || []

    return maintenanceRequests.slice(0, 3).map((m: any, idx: number) => ({
      id: `maint-${idx}`,
      type: "maintenance" as const,
      message: `Maintenance request "${m.title}" ${m.status === 'completed' ? 'completed' : 'updated'}`,
      time: formatUSDate(m.updatedAt),
      status: m.status === 'completed' ? 'success' as const : 'warning' as const,
      href: `/tenant/maintenance`,
    }))
  }, [data.maintenanceRequests])

  // Update activities in context (useEffect to avoid render-time state updates)
  const prevActivitiesRef = useRef<string>()
  useEffect(() => {
    const activitiesKey = JSON.stringify(activities)
    if (prevActivitiesRef.current !== activitiesKey) {
      prevActivitiesRef.current = activitiesKey
      updateData('activities', activities)
    }
  }, [activities, updateData])

  return (
    <BaseDashboard config={config} />
  )
}

export default function TenantDashboardNew() {
  useWelcomeToast()
  const { t } = useTranslation("tenant")

  // Create initial config for provider
  const initialConfig = useMemo(() => {
    return createTenantConfig(null, [], [], t)
  }, [t])

  return (
    <BaseDashboardProvider config={initialConfig}>
      <TenantDashboardContent />
    </BaseDashboardProvider>
  )
}
