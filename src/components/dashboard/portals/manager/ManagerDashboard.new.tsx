import { useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useWelcomeToast } from "@/hooks/use-welcome-toast"
import { BaseDashboard, BaseDashboardProvider } from "../../base"
import { createManagerConfig } from "./manager.config"
import { useBaseDashboard } from "../../base/BaseDashboardContext"
import { formatUSDate } from "@/lib/us-format"
/**
 * New ManagerDashboard using BaseDashboard architecture
 */
function ManagerDashboardContent() {
  const { user: _user } = useAuth()
  const { data, updateData } = useBaseDashboard()

  // Transform fetched data into config format
  const config = useMemo(() => {
    const properties = data.properties || []
    const invitedUsers = data.invitedUsers || []
    const leads = data.leads || []

    return createManagerConfig(properties, invitedUsers, leads)
  }, [data.properties, data.invitedUsers, data.leads])

  // Generate activities from fetched data
  const activities = useMemo(() => {
    const properties = data.properties || []
    const leads = data.leads || []

    return [
      ...properties.slice(0, 3).map((p: any, idx: number) => ({
        id: `prop-${idx}`,
        type: "property" as const,
        message: `Property "${p.title}" ${p.status === 'pending' ? 'submitted for review' : p.status === 'approved' ? 'approved' : 'rejected'}`,
        time: formatUSDate(p.createdAt),
        status: p.status === 'approved' ? 'success' as const : p.status === 'rejected' ? 'error' as const : 'warning' as const,
        href: `/dashboard/properties`,
      })),
      ...leads.slice(0, 2).map((l: any, idx: number) => ({
        id: `lead-${idx}`,
        type: "user" as const,
        message: `New lead from ${l.tenantName}`,
        time: formatUSDate(l.createdAt),
        status: 'info' as const,
        href: `/dashboard/leads`,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)
  }, [data.properties, data.leads])

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

export default function ManagerDashboardNew() {
  useWelcomeToast()

  // Create initial config for provider
  const initialConfig = useMemo(() => {
    return createManagerConfig([], [], [])
  }, [])

  return (
    <BaseDashboardProvider config={initialConfig}>
      <ManagerDashboardContent />
    </BaseDashboardProvider>
  )
}

