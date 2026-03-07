import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Bell, CheckCircle, Calendar } from "lucide-react"
import { dashboardApi, type PropertyReminderItem } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { formatUSDate } from "@/lib/us-format"

const MAX_VISIBLE = 6

export function HomeCareRemindersCard() {
  const [reminders, setReminders] = useState<PropertyReminderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    async function fetchReminders() {
      try {
        const data = await dashboardApi.getReminders()
        if (!cancelled) setReminders(data)
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch reminders:", err)
          setReminders([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchReminders()
    return () => { cancelled = true }
  }, [])

  const handleComplete = async (propertyId: string, reminderType: string) => {
    const key = `${propertyId}:${reminderType}`
    setCompleting(key)
    try {
      await dashboardApi.completeReminder(propertyId, reminderType)
      const data = await dashboardApi.getReminders()
      setReminders(data)
      toast({
        title: "Reminder completed",
        description: "Next due date has been updated.",
      })
    } catch (err) {
      toast({
        title: "Could not mark complete",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
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
            <Bell className="h-4 w-4 text-ondo-orange" />
            Home care reminders
          </CardTitle>
          <CardDescription>HVAC, air filters, winterize lawn, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
            <Bell className="h-4 w-4 text-ondo-orange" />
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
          <Bell className="h-4 w-4 text-ondo-orange" />
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
            return (
              <li
                key={key}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 rounded-lg border bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{r.title}</div>
                  {r.propertyTitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {r.propertyAddress || r.propertyTitle}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">
                      Due {formatUSDate(r.nextDue)}
                      {r.overdue && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">
                          Overdue
                        </Badge>
                      )}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-ondo-orange text-ondo-orange hover:bg-ondo-orange hover:text-white"
                  onClick={() => handleComplete(r.propertyId, r.reminderType)}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
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
