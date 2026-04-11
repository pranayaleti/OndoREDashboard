import { Link } from "react-router-dom"
import { Clock3, CreditCard, ReceiptText } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/locale-format"
import type { RentSchedule } from "@/lib/api"

interface TenantQuickPayCardProps {
  schedule: RentSchedule | null
}

export function TenantQuickPayCard({ schedule }: TenantQuickPayCardProps) {
  const { t } = useTranslation("tenant")
  const dueDate = schedule?.nextChargeDate ?? schedule?.upcomingDueDates?.[0] ?? null

  return (
    <Card className="h-full" data-tour-target="tenant-quick-pay">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{t("dashboard.quickPayTitle")}</CardTitle>
            <CardDescription>{t("dashboard.quickPayDescription")}</CardDescription>
          </div>
          <CreditCard className="h-5 w-5 text-emerald-500" />
        </div>
      </CardHeader>
      <CardContent>
        {schedule ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-500/10 dark:bg-emerald-500/5">
              <p className="text-sm text-muted-foreground">{t("dashboard.quickPayDueLabel")}</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold">{formatCurrency(schedule.monthlyAmount)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dueDate ? formatDate(dueDate, { month: "long", day: "numeric", year: "numeric" }) : "—"}
                  </p>
                </div>
                <Badge variant={schedule.autopayEnabled ? "default" : "secondary"}>
                  {schedule.autopayEnabled
                    ? t("dashboard.quickPayAutopayOn")
                    : t("dashboard.quickPayAutopayOff")}
                </Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock3 className="h-4 w-4 text-orange-500" />
                  {t("rent.nextDue")}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {dueDate ? formatDate(dueDate, { weekday: "long", month: "short", day: "numeric" }) : "—"}
                </p>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ReceiptText className="h-4 w-4 text-blue-500" />
                  {t("dashboard.quickPayAutopayLabel")}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {schedule.autopayEnabled
                    ? t("dashboard.quickPayOpen")
                    : t("dashboard.quickPaySetup")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-gradient-to-r from-orange-500 to-red-700 text-white hover:from-orange-600 hover:to-red-800">
                <Link to="/tenant/payments">{t("rent.payNow")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/tenant/payments">{t("dashboard.quickPayOpen")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<CreditCard className="h-10 w-10" />}
            title={t("dashboard.quickPayEmptyTitle")}
            description={t("dashboard.quickPayEmptyDescription")}
            action={
              <Button asChild variant="outline">
                <Link to="/tenant/payments">{t("dashboard.quickPayOpen")}</Link>
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
