import { useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useWelcomeToast } from "@/hooks/use-welcome-toast"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"
import { BaseDashboard, BaseDashboardProvider } from "../../base"
import { createMaintenanceConfig } from "./maintenance.config"
import { useBaseDashboard } from "../../base/BaseDashboardContext"
import { formatUSDate } from "@/lib/us-format"
import type { MaintenanceRequest } from "@/lib/api"
/**
 * New MaintenanceDashboard using BaseDashboard architecture
 */
function MaintenanceDashboardContent() {
  const { user } = useAuth()
  const { data, updateData, refreshData } = useBaseDashboard()

  // Transform fetched data into config format
  const config = useMemo(() => {
    const maintenanceRequests = data.maintenanceRequests || []

    return createMaintenanceConfig(maintenanceRequests)
  }, [data.maintenanceRequests])

  // Generate activities from fetched data
  const activities = useMemo(() => {
    const maintenanceRequests = data.maintenanceRequests || []

    return maintenanceRequests
      .filter((r: MaintenanceRequest) => r.assignedTo)
      .slice(0, 5)
      .map((r: any, idx: number) => ({
        id: `ticket-${idx}`,
        type: "maintenance" as const,
        message: `Ticket "${r.title}" ${r.status === 'completed' ? 'completed' : r.status === 'in_progress' ? 'in progress' : 'pending'}`,
        time: formatUSDate(r.updatedAt),
        status: r.status === 'completed' ? 'success' as const : r.status === 'in_progress' ? 'info' as const : 'warning' as const,
        href: `/maintenance/tickets`,
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

  useRealtimeTable({
    table: "maintenance_requests",
    events: ["INSERT", "UPDATE"],
    enabled: !!user?.id,
    onEvent: () => {
      void refreshData()
    },
  })

  return (
    <BaseDashboard config={config} />
  )
}

export default function MaintenanceDashboardNew() {
  useWelcomeToast()

  // Create initial config for provider
  const initialConfig = useMemo(() => {
    return createMaintenanceConfig([])
  }, [])

  return (
    <BaseDashboardProvider config={initialConfig}>
      <MaintenanceDashboardContent />
    </BaseDashboardProvider>
  )
}
