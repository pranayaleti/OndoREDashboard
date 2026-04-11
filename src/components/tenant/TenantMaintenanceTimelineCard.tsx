import { Link } from "react-router-dom"
import { CalendarClock, CheckCircle2, Circle, Wrench } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/locale-format"
import { cn } from "@/lib/utils"
import type { MaintenanceRequest } from "@/lib/api"

interface TenantMaintenanceTimelineCardProps {
  request: MaintenanceRequest | null
  totalRequests: number
}

interface TimelineStep {
  key: string
  completed: boolean
}

export function TenantMaintenanceTimelineCard({
  request,
  totalRequests,
}: TenantMaintenanceTimelineCardProps) {
  const { t } = useTranslation("tenant")
  const statusLabels: Record<NonNullable<MaintenanceRequest["status"]>, string> = {
    pending: t("maintenance.status.pending"),
    in_progress: t("maintenance.status.inProgress"),
    completed: t("maintenance.status.completed"),
    cancelled: t("maintenance.status.cancelled"),
  }

  const timeline: TimelineStep[] = request
    ? [
        { key: "maintenanceStageSubmitted", completed: true },
        {
          key: "maintenanceStageReviewed",
          completed: Boolean(request.assignedTo) || request.status !== "pending",
        },
        {
          key: "maintenanceStageScheduled",
          completed: request.status === "in_progress" || request.status === "completed",
        },
        { key: "maintenanceStageResolved", completed: request.status === "completed" },
      ]
    : []

  return (
    <Card className="h-full" data-tour-target="tenant-maintenance-timeline">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{t("dashboard.maintenanceTimelineTitle")}</CardTitle>
            <CardDescription>{t("dashboard.maintenanceTimelineDescription")}</CardDescription>
          </div>
          <Wrench className="h-5 w-5 text-orange-500" />
        </div>
      </CardHeader>
      <CardContent>
        {request ? (
          <div className="space-y-5">
            <div className="rounded-2xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{request.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("dashboard.maintenanceLastUpdated", {
                      date: formatDate(request.updatedAt, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }),
                    })}
                  </p>
                </div>
                <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-800 dark:bg-orange-500/10 dark:text-orange-300">
                  {statusLabels[request.status]}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {timeline.map((step, index) => (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-0.5">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                    {index < timeline.length - 1 ? (
                      <div
                        className={cn(
                          "mt-1 h-8 w-px",
                          step.completed ? "bg-emerald-300" : "bg-border",
                        )}
                      />
                    ) : null}
                  </div>
                  <div className="pt-0.5">
                    <p className={cn("font-medium", step.completed ? "text-foreground" : "text-muted-foreground")}>
                      {t(`dashboard.${step.key}`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed p-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                {t("dashboard.maintenanceOpenCount", { count: totalRequests })}
              </div>
              <Button asChild variant="outline">
                <Link to="/tenant/maintenance">{t("dashboard.maintenanceOpen")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Wrench className="h-10 w-10" />}
            title={t("dashboard.maintenanceEmptyTitle")}
            description={t("dashboard.maintenanceEmptyDescription")}
            action={
              <Button asChild>
                <Link to="/tenant/maintenance">{t("dashboard.maintenanceSubmit")}</Link>
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
