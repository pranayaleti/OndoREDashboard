import { useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useWelcomeToast } from "@/hooks/use-welcome-toast"
import { BaseDashboard, BaseDashboardProvider } from "../../base"
import { createAdminConfig } from "./admin.config"
import { useBaseDashboard } from "../../base/BaseDashboardContext"
import { formatUSDate } from "@/lib/us-format"
/**
 * New AdminDashboard using BaseDashboard architecture
 * 
 * This is a cleaner implementation that properly integrates with the base dashboard system.
 */
function AdminDashboardContent() {
  const { user: _user } = useAuth()
  const { data, updateData } = useBaseDashboard()

  // Transform fetched data into config format
  const config = useMemo(() => {
    const properties = data.properties || []
    const invitedUsers = data.invitedUsers || []
    const maintenanceRequests = data.maintenanceRequests || []

    return createAdminConfig(properties, invitedUsers, maintenanceRequests, data.financialSummary || null)
  }, [data.properties, data.invitedUsers, data.maintenanceRequests, data.financialSummary])

  // Generate activities from fetched data
  const activities = useMemo(() => {
    const properties = data.properties || []
    const maintenanceRequests = data.maintenanceRequests || []

    return [
      ...properties.slice(0, 3).map((p: any, idx: number) => ({
        id: `prop-${idx}`,
        type: "property" as const,
        message: `Property "${p.title}" ${p.status === 'pending' ? 'submitted for review' : p.status === 'approved' ? 'approved' : 'rejected'}`,
        time: formatUSDate(p.createdAt),
        status: p.status === 'approved' ? 'success' as const : p.status === 'rejected' ? 'error' as const : 'warning' as const,
        href: `/admin/properties`,
      })),
      ...maintenanceRequests.slice(0, 2).map((m: any, idx: number) => ({
        id: `maint-${idx}`,
        type: "maintenance" as const,
        message: `Maintenance request "${m.title}" ${m.status === 'completed' ? 'completed' : 'updated'}`,
        time: formatUSDate(m.updatedAt),
        status: m.status === 'completed' ? 'success' as const : 'warning' as const,
        href: `/admin/maintenance`,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)
  }, [data.properties, data.maintenanceRequests])

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

export default function AdminDashboardNew() {
  useWelcomeToast()

  // Create initial config for provider
  const initialConfig = useMemo(() => {
    return createAdminConfig([], [], [])
  }, [])

  return (
    <BaseDashboardProvider config={initialConfig}>
      <AdminDashboardContent />
    </BaseDashboardProvider>
  )
}

