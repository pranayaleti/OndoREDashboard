import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bell, CheckCircle, Calendar, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { dashboardApi, type PropertyReminderItem } from "@/lib/api"
import { formatUSDate } from "@/lib/us-format"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/auth-context"

const MAX_VISIBLE = 6

function reminderDetailHref(role: UserRole | undefined, propertyId: string): string {
  switch (role) {
    case "owner":
      return `/owner/properties/${propertyId}`
    case "manager":
      return "/dashboard/maintenance"
    case "admin":
      return "/admin/maintenance"
    case "super_admin":
      return "/super-admin/maintenance"
    case "tenant":
      return "/tenant/maintenance"
    default:
      return "/dashboard/maintenance"
  }
}

export function HomeCareRemindersCard() {
  const { user } = useAuth()
  const role = user?.role
  const [reminders, setReminders] = useState<PropertyReminderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [completing, setCompleting] = useState<string | null>(null)

  const fetchReminders = async (cancelled?: { current: boolean }) => {
    setFetchError(false)
    try {
      const data = await dashboardApi.getReminders()
      if (!cancelled?.current) setReminders(data)
    } catch {
      if (!cancelled?.current) setFetchError(true)
    } finally {
      if (!cancelled?.current) setLoading(false)
    }
  }

  useEffect(() => {
    const cancelled = { current: false }
    fetchReminders(cancelled)
    return () => { cancelled.current = true }
  }, [])

  const handleComplete = async (propertyId: string, reminderType: string) => {
    const key = `${propertyId}:${reminderType}`
    setCompleting(key)
    // Optimistic update: remove from list immediately
    setReminders((prev) => prev.filter((r) => `${r.propertyId}:${r.reminderType}` !== key))
    try {
      await dashboardApi.completeReminder(propertyId, reminderType)
      toast.success("Reminder completed", {
        description: "Next due date has been updated.",
      })
      // Background sync to get updated due dates
      void fetchReminders()
    } catch (err) {
      // Revert optimistic update on failure
      void fetchReminders()
      toast.error("Could not mark complete", {
        description: err instanceof Error ? err.message : "Please try again.",
      })
    } finally {
      setCompleting(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell aria-hidden="true" className="h-4 w-4 text-ondo-orange" />
            Home care reminders
          </CardTitle>
          <CardDescription>HVAC, air filters, winterize lawn, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6" role="status" aria-label="Loading reminders">
            <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (fetchError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell aria-hidden="true" className="h-4 w-4 text-ondo-orange" />
            Home care reminders
          </CardTitle>
          <CardDescription>HVAC, air filters, winterize lawn, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-4" role="alert">
            <AlertCircle aria-hidden="true" className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">
              Could not load reminders. Please try again.
            </p>
            <Button size="sm" variant="outline" onClick={() => { setLoading(true); void fetchReminders() }}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell aria-hidden="true" className="h-4 w-4 text-ondo-orange" />
            Home care reminders
          </CardTitle>
          <CardDescription>HVAC, air filters, winterize lawn, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4">
            No property reminders right now. Reminders will appear here for HVAC cleanup, air filter replacement, winterize lawn (single-family), and other routine tasks.
          </p>
        </CardContent>
      </Card>
    )
  }

  const visible = reminders.slice(0, MAX_VISIBLE)
  const overdueCount = reminders.filter((r) => r.overdue).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell aria-hidden="true" className="h-4 w-4 text-ondo-orange" />
          Home care reminders
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {overdueCount} overdue
            </Badge>
          )}
        </CardTitle>
        <CardDescription>HVAC, air filters, winterize lawn, and more</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {visible.map((r) => {
            const key = `${r.propertyId}:${r.reminderType}`
            const isCompleting = completing === key
            const detailTo = reminderDetailHref(role, r.propertyId)
            const locationLabel = (r.propertyAddress || r.propertyTitle || "").trim()
            const detailLabel = locationLabel
              ? `View ${r.title} for ${locationLabel}`
              : `View details for ${r.title}`

            return (
              <li
                key={key}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 rounded-lg border bg-muted/30"
              >
                <Link
                  to={detailTo}
                  className="min-w-0 flex-1 rounded-md -m-1 p-1 text-left ring-offset-background transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={detailLabel}
                >
                  <div className="font-medium text-sm">{r.title}</div>
                  {r.propertyTitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {r.propertyAddress || r.propertyTitle}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Calendar aria-hidden="true" className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="text-xs">
                      Due {formatUSDate(r.nextDue)}
                      {r.overdue && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">
                          Overdue
                        </Badge>
                      )}
                    </span>
                  </div>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-ondo-orange text-ondo-orange hover:bg-ondo-orange hover:text-white"
                  onClick={() => handleComplete(r.propertyId, r.reminderType)}
                  disabled={isCompleting}
                  aria-label={isCompleting ? `Marking "${r.title}" as done…` : `Mark "${r.title}" as done`}
                >
                  {isCompleting ? (
                    <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle aria-hidden="true" className="h-3 w-3 mr-1" />
                      Mark done
                    </>
                  )}
                </Button>
              </li>
            )
          })}
        </ul>
        {reminders.length > MAX_VISIBLE && (
          <p className="text-xs text-muted-foreground pt-1">
            +{reminders.length - MAX_VISIBLE} more reminder{reminders.length - MAX_VISIBLE !== 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
