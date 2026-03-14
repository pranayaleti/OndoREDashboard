/**
 * Rent schedule for a property: summary + table.
 * Uses rentSchedulesApi.getPropertySchedules and getPropertySummary.
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Loader2, Calendar } from "lucide-react"
import { rentSchedulesApi, type RentSchedule, type RentSummary } from "@/lib/api/clients/rent-schedules"

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

interface PropertyRentScheduleSectionProps {
  propertyId: string
  /** Optional title override */
  title?: string
}

export function PropertyRentScheduleSection({ propertyId, title = "Rent schedule" }: PropertyRentScheduleSectionProps) {
  const [schedules, setSchedules] = useState<RentSchedule[]>([])
  const [summary, setSummary] = useState<RentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      rentSchedulesApi.getPropertySchedules(propertyId),
      rentSchedulesApi.getPropertySummary(propertyId),
    ])
      .then(([schedRes, summaryRes]) => {
        if (cancelled) return
        setSchedules(schedRes.data ?? [])
        setSummary(summaryRes.data ?? null)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Failed to load rent schedule")
        setSchedules([])
        setSummary(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [propertyId])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading rent schedule…</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Summary
            </CardTitle>
            <CardDescription>Rent schedule summary for this property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Expected</p>
                <p className="font-medium">{formatCents(summary.totalExpected)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Collected</p>
                <p className="font-medium text-green-600 dark:text-green-400">{formatCents(summary.totalCollected)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Overdue</p>
                <p className="font-medium text-red-600 dark:text-red-400">{formatCents(summary.totalOverdue)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Paid / Overdue / Upcoming</p>
                <p className="font-medium">{summary.paidCount} / {summary.overdueCount} / {summary.upcomingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {title}
          </CardTitle>
          <CardDescription>Due dates, amounts, and payment status</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rent schedule entries for this property.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Due date</th>
                    <th className="text-right py-2">Amount</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Paid at</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id} className="border-b border-muted/50">
                      <td className="py-2">{s.dueDate}</td>
                      <td className="text-right font-medium">{formatCents(s.amountCents)}</td>
                      <td className="py-2">
                        <span className={s.status === "paid" ? "text-green-600 dark:text-green-400" : s.status === "overdue" ? "text-red-600 dark:text-red-400" : ""}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">{s.paidAt ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
