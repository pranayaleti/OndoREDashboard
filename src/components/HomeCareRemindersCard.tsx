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
import { Checkbox } from "@/components/ui/checkbox"
import { Modal } from "@/components/ui/modal"

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
  const [isTriageOpen, setIsTriageOpen] = useState(false)
  const [selectedReminderKeys, setSelectedReminderKeys] = useState<string[]>([])

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

  const completeTargets = async (targets: PropertyReminderItem[]) => {
    if (targets.length === 0) return

    setCompleting("__bulk__")
    setReminders((prev) =>
      prev.filter(
        (r) => !targets.some((target) => target.propertyId === r.propertyId && target.reminderType === r.reminderType)
      )
    )

    try {
      await Promise.all(
        targets.map((target) =>
          dashboardApi.completeReminder(target.propertyId, target.reminderType)
        )
      )
      toast.success("Reminder completed", {
        description: "Next due date has been updated.",
      })
      void fetchReminders()
    } catch (err) {
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

  const overdueCount = reminders.filter((r) => r.overdue).length
  const displayReminders = overdueCount > 0 ? reminders.filter((r) => r.overdue) : reminders
  const visible = displayReminders.slice(0, MAX_VISIBLE)
  const groupedReminderEntries = displayReminders.reduce<Record<string, PropertyReminderItem[]>>((accumulator, reminder) => {
    const groupLabel = reminder.propertyAddress || reminder.propertyTitle || "Property"
    accumulator[groupLabel] = [...(accumulator[groupLabel] ?? []), reminder]
    return accumulator
  }, {})

  const handleOpenTriage = () => {
    setSelectedReminderKeys(displayReminders.map((reminder) => `${reminder.propertyId}:${reminder.reminderType}`))
    setIsTriageOpen(true)
  }

  const handleToggleReminder = (key: string, checked: boolean) => {
    setSelectedReminderKeys((previous) =>
      checked ? [...new Set([...previous, key])] : previous.filter((item) => item !== key)
    )
  }

  const handleCompleteSelected = async () => {
    const targets = displayReminders.filter((reminder) =>
      selectedReminderKeys.includes(`${reminder.propertyId}:${reminder.reminderType}`)
    )
    await completeTargets(targets)
    setIsTriageOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell aria-hidden="true" className="h-4 w-4 text-ondo-orange" />
            Home care reminders
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueCount} overdue
              </Badge>
            )}
          </CardTitle>
          {displayReminders.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-ondo-orange text-ondo-orange hover:bg-ondo-orange hover:text-white"
              onClick={handleOpenTriage}
              disabled={completing === "__bulk__"}
              aria-label="Open overdue reminder triage"
            >
              {completing === "__bulk__" ? (
                <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <CheckCircle aria-hidden="true" className="h-3 w-3 mr-1" />
                  Triage All
                </>
              )}
            </Button>
          )}
        </div>
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
                  disabled={isCompleting || completing === "__bulk__"}
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
        {displayReminders.length > MAX_VISIBLE && (
          <p className="text-xs text-muted-foreground pt-1">
            +{displayReminders.length - MAX_VISIBLE} more reminder{displayReminders.length - MAX_VISIBLE !== 1 ? "s" : ""}
          </p>
        )}
      </CardContent>
      <Modal
        open={isTriageOpen}
        onOpenChange={setIsTriageOpen}
        title="Overdue reminders triage"
        description="Review overdue reminders by property, then mark the completed items in one pass."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsTriageOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={handleCompleteSelected}
              disabled={selectedReminderKeys.length === 0 || completing === "__bulk__"}
              className="bg-orange-500 text-black hover:bg-orange-400"
            >
              {completing === "__bulk__" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark Selected as Done
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {Object.entries(groupedReminderEntries).map(([propertyLabel, propertyReminders]) => (
            <div key={propertyLabel} className="rounded-2xl border p-4">
              <div className="mb-3">
                <p className="font-semibold">{propertyLabel}</p>
                <p className="text-xs text-muted-foreground">{propertyReminders.length} overdue item{propertyReminders.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="space-y-3">
                {propertyReminders.map((reminder) => {
                  const key = `${reminder.propertyId}:${reminder.reminderType}`
                  const checked = selectedReminderKeys.includes(key)
                  return (
                    <label key={key} className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => handleToggleReminder(key, value === true)}
                        aria-label={`Select ${reminder.title}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{reminder.title}</p>
                        <p className="text-sm text-muted-foreground">{reminder.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Due {formatUSDate(reminder.nextDue)}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </Card>
  )
}
