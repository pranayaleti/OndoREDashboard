import { Link } from "react-router-dom"
import { AlertTriangle, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { TenantScreeningApplicant, TenantScreeningSummary } from "@/lib/api"

const statusStyles: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  flagged: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  in_review: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  pending: "bg-muted text-slate-600 dark:bg-muted/10 dark:text-slate-300",
}

export interface TenantScreeningWidgetProps {
  summary: TenantScreeningSummary | null
  applicants: TenantScreeningApplicant[]
  loading?: boolean
  error?: string | null
  title?: string
  description?: string
  ctaHref?: string
  ctaLabel?: string
  onRefresh?: () => void
}

export function TenantScreeningWidget({
  summary,
  applicants,
  loading = false,
  error = null,
  title = "Tenant Screening",
  description = "Monitor applications, fraud signals, and verification progress in real time.",
  ctaHref,
  ctaLabel = "View all reports",
  onRefresh,
}: TenantScreeningWidgetProps) {
  const metrics = [
    {
      label: "Approved",
      value: summary?.approvedCount ?? 0,
      helper: "this period",
    },
    {
      label: "Flagged",
      value: summary?.flaggedCount ?? 0,
      helper: "requires review",
    },
    {
      label: "Fraud prevented",
      value: summary?.fraudPrevented ?? 0,
      helper: "auto detected",
    },
  ]

  const averageScore = summary?.averageScore ?? 0
  const verificationRate = summary?.verificationRate ?? 0

  const renderApplicants = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[0, 1, 2].map((idx) => (
            <Skeleton key={idx} className="h-16 w-full" />
          ))}
        </div>
      )
    }

    if (!applicants.length) {
      return <p className="text-sm text-muted-foreground">No screening data yet.</p>
    }

    return (
      <div className="space-y-4">
        {applicants.map((applicant) => (
          <div
            key={applicant.id}
            className="rounded-2xl border border-border/60 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{applicant.applicantName}</p>
                <p className="text-xs text-muted-foreground">
                  {applicant.propertyName || "General application"} • {applicant.submittedAt ? new Date(applicant.submittedAt).toLocaleDateString() : "—"}
                </p>
              </div>
              <Badge className={cn("capitalize", statusStyles[applicant.status] ?? statusStyles.pending)}>
                {applicant.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{applicant.verifiedIds ?? 0} verifications</span>
              </div>
              <div className="text-muted-foreground">Score {applicant.score ?? "—"}</div>
              {applicant.fraudFlags?.length ? (
                <div className="flex items-center gap-1 text-rose-500">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{applicant.fraudFlags.length} flag{applicant.fraudFlags.length > 1 ? "s" : ""}</span>
                </div>
              ) : (
                <div className="text-muted-foreground">No fraud flags</div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={applicant.progress ?? 0} className="h-2 flex-1" />
              <span className="text-xs font-semibold text-muted-foreground">{Math.round(applicant.progress ?? 0)}%</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", { "animate-spin": loading })} />
              </Button>
            )}
            {ctaHref && (
              <Button variant="outline" size="sm" asChild>
                <Link to={ctaHref} className="flex items-center gap-1">
                  {ctaLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-500/10 dark:text-rose-300">
            <p>{error}</p>
            {onRefresh && (
              <Button variant="link" className="mt-2 px-0 text-rose-600 dark:text-rose-300" onClick={onRefresh}>
                Try again
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border bg-gradient-to-br from-card via-muted to-card p-6 text-white shadow-inner">
                <p className="text-sm text-white/70">Average applicant score</p>
                <div className="mt-3 text-4xl font-semibold">{averageScore || "—"}</div>
                <div className="mt-4">
                  <Progress value={averageScore ? Math.min(averageScore / 8, 100) : 0} className="h-2 bg-card/70" indicatorClassName="bg-card" />
                </div>
                <p className="mt-4 text-xs text-white/70">Timeframe • {summary?.timeframe || "30d"}</p>
              </div>
              <div className="space-y-4 rounded-3xl border border-dashed p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification rate</span>
                  <span className="text-lg font-semibold">{verificationRate}%</span>
                </div>
                <Progress value={verificationRate} className="h-2" />
                <div className="grid grid-cols-3 gap-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl bg-muted/60 p-3 text-center">
                      <p className="text-2xl font-semibold">{metric.value}</p>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className="text-[10px] text-muted-foreground">{metric.helper}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent applicants</p>
              </div>
              {renderApplicants()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}


