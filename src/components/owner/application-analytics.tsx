import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Users, FileText, ArrowRight } from "lucide-react"
import { featureApi } from "@/lib/api"

interface FunnelMetrics {
  propertyId: string
  propertyTitle: string
  linksCreated: number
  applicationsTotal: number
  submitted: number
  screening: number
  approved: number
  rejected: number
  withdrawn: number
  waitlisted: number
  leasesCreated: number
  leasesActive: number
  conversionRate: number
}

export function ApplicationAnalytics() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<FunnelMetrics[]>([])

  useEffect(() => {
    featureApi.analytics
      .getApplicationFunnel()
      .then((data) => setMetrics(data as FunnelMetrics[]))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  // Aggregate totals
  const totals = metrics.reduce(
    (acc, m) => ({
      links: acc.links + m.linksCreated,
      apps: acc.apps + m.applicationsTotal,
      approved: acc.approved + m.approved,
      leases: acc.leases + m.leasesActive,
    }),
    { links: 0, apps: 0, approved: 0, leases: 0 }
  )

  const overallConversion = totals.apps > 0 ? Math.round((totals.approved / totals.apps) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Links Created" value={totals.links} icon={<ArrowRight className="h-4 w-4" />} />
        <MetricCard label="Applications" value={totals.apps} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Approved" value={totals.approved} icon={<TrendingUp className="h-4 w-4" />} />
        <MetricCard label="Active Leases" value={totals.leases} icon={<FileText className="h-4 w-4" />} />
      </div>

      {/* Overall conversion */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            Overall Conversion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={overallConversion} className="flex-1 h-3" />
            <span className="text-lg font-bold text-blue-600">{overallConversion}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Per-property breakdown */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Per Property</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.map((m) => (
                <div key={m.propertyId} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">{m.propertyTitle || "Untitled"}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {m.conversionRate}% conversion
                    </Badge>
                  </div>
                  {/* Funnel visualization */}
                  <div className="flex items-center gap-1 text-xs">
                    <FunnelStep label="Links" value={m.linksCreated} />
                    <ArrowRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
                    <FunnelStep label="Applied" value={m.applicationsTotal} />
                    <ArrowRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
                    <FunnelStep label="Screened" value={m.screening} />
                    <ArrowRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
                    <FunnelStep label="Approved" value={m.approved} color="text-emerald-600" />
                    <ArrowRight className="h-3 w-3 text-slate-300 flex-shrink-0" />
                    <FunnelStep label="Leased" value={m.leasesActive} color="text-green-600" />
                  </div>
                  {m.rejected > 0 && (
                    <p className="text-xs text-slate-400 mt-1">{m.rejected} rejected, {m.withdrawn} withdrawn</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function FunnelStep({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center px-2">
      <p className={`text-sm font-bold ${color || ""}`}>{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  )
}
