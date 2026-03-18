import { useState, useEffect } from "react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TrendingUp, TrendingDown, Minus, Brain, CheckCircle2, XCircle, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { dashboardApi, type RiskAnalytics, type RiskRecommendation } from "@/lib/api"

const BAND_COLORS = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
}

const INTERVENTION_LABELS: Record<string, string> = {
  payment_plan: "Payment plan",
  reminder: "Reminder",
  assistance_referral: "Assistance referral",
  outreach: "Outreach",
  early_renewal: "Early renewal",
}

function TrendIndicator({ values }: { values: number[] }) {
  if (values.length < 2) return <Minus className="h-4 w-4 text-gray-400" />
  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  if (last > prev + 0.01) return <TrendingUp className="h-4 w-4 text-red-500" />
  if (last < prev - 0.01) return <TrendingDown className="h-4 w-4 text-green-500" />
  return <Minus className="h-4 w-4 text-gray-400" />
}

interface RecommendationCardProps {
  rec: RiskRecommendation
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
  loading: boolean
}

function RecommendationCard({ rec, onApprove, onDismiss, loading }: RecommendationCardProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-white dark:bg-gray-900 shadow-sm">
      <Brain className="h-5 w-5 mt-0.5 text-orange-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {rec.tenantName ?? rec.tenantEmail ?? rec.tenantId}
          </span>
          <Badge variant="outline" className="shrink-0 text-xs">
            {INTERVENTION_LABELS[rec.recommendedType] ?? rec.recommendedType}
          </Badge>
          <span className="text-xs text-gray-400 shrink-0">
            {(rec.confidence * 100).toFixed(0)}% confidence
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{rec.reasoning}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-green-600 hover:bg-green-50"
          onClick={() => onApprove(rec.id)}
          disabled={loading}
          title="Approve"
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-gray-400 hover:bg-gray-100"
          onClick={() => onDismiss(rec.id)}
          disabled={loading}
          title="Dismiss"
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function RiskAnalytics() {
  const [analytics, setAnalytics] = useState<RiskAnalytics | null>(null)
  const [recommendations, setRecommendations] = useState<RiskRecommendation[]>([])
  const [windowDays, setWindowDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      const [ana, recs] = await Promise.all([
        dashboardApi.getRiskAnalytics(windowDays),
        dashboardApi.getRecommendations(),
      ])
      setAnalytics(ana)
      setRecommendations(recs)
    } catch (err) {
      console.error("Analytics fetch error:", err)
      toast({ title: "Error", description: "Failed to load analytics.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [windowDays])

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true)
      await dashboardApi.approveRecommendation(id)
      toast({ title: "Intervention created", description: "Recommendation approved and converted to intervention." })
      setRecommendations((prev) => prev.filter((r) => r.id !== id))
    } catch {
      toast({ title: "Error", description: "Failed to approve recommendation.", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      setActionLoading(true)
      await dashboardApi.dismissRecommendation(id)
      setRecommendations((prev) => prev.filter((r) => r.id !== id))
    } catch {
      toast({ title: "Error", description: "Failed to dismiss recommendation.", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="h-40 flex items-center justify-center text-gray-400">
              Loading…
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) return null

  const pieData = [
    { name: "Low", value: analytics.distribution.low, color: BAND_COLORS.low },
    { name: "Medium", value: analytics.distribution.medium, color: BAND_COLORS.medium },
    { name: "High", value: analytics.distribution.high, color: BAND_COLORS.high },
  ].filter((d) => d.value > 0)

  const barData = Object.entries(analytics.interventionsByType).map(([type, stats]) => ({
    name: INTERVENTION_LABELS[type] ?? type,
    Total: stats.total,
    Completed: stats.completed,
    "Avg Rating": stats.avgRating != null ? Math.round(stats.avgRating * 10) / 10 : 0,
  }))

  const trendValues = analytics.trend.map((t) => t.avgScore)
  const activeModel = Object.keys(analytics.modelVersions)[0] ?? "—"

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Risk analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Model: <span className="font-mono text-xs">{activeModel}</span>
          </p>
        </div>
        <Select value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total scored</p>
            <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-gray-100">{analytics.totalScored}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">At-risk</p>
            <p className="text-3xl font-bold mt-1 text-orange-500">{analytics.atRiskCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {analytics.totalScored > 0
                ? `${((analytics.atRiskCount / analytics.totalScored) * 100).toFixed(1)}% of portfolio`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">High risk</p>
            <p className="text-3xl font-bold mt-1 text-red-500">{analytics.distribution.high}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Avg score trend</p>
              <TrendIndicator values={trendValues} />
            </div>
            <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {trendValues.length > 0
                ? `${(trendValues[trendValues.length - 1] * 100).toFixed(0)}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Risk Distribution Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk distribution</CardTitle>
            <CardDescription>Current band breakdown across all tenants</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={40}
                      paddingAngle={2}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} tenants`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                No scoring data yet
              </div>
            )}
            {/* Legend */}
            <div className="flex gap-4 justify-center mt-2">
              {Object.entries(BAND_COLORS).map(([band, color]) => (
                <div key={band} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {band.charAt(0).toUpperCase() + band.slice(1)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Score Trend Line */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Average risk score over time</CardTitle>
            <CardDescription>Daily average across all scored tenants ({windowDays}d)</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.trend.length > 1 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.trend} margin={{ left: -10, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, "Avg risk score"]}
                      labelFormatter={(l: string) => `Date: ${l}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgScore"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                Not enough data points yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Intervention effectiveness */}
      {barData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Intervention effectiveness</CardTitle>
            <CardDescription>Total interventions vs. completed, per type ({windowDays}d)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ left: -10, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Total" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Completed" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations queue */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-orange-500" />
                AI recommendations
              </CardTitle>
              <CardDescription>
                System-generated intervention suggestions — approve or dismiss
              </CardDescription>
            </div>
            {recommendations.length > 0 && (
              <Badge className="bg-orange-500 text-white">{recommendations.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No pending recommendations. Run scoring to generate new ones.
            </p>
          ) : (
            <div className="space-y-2">
              {recommendations.slice(0, 8).map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  rec={rec}
                  onApprove={handleApprove}
                  onDismiss={handleDismiss}
                  loading={actionLoading}
                />
              ))}
              {recommendations.length > 8 && (
                <p className="text-xs text-gray-400 text-center pt-1 flex items-center justify-center gap-1">
                  <ChevronRight className="h-3 w-3" />
                  {recommendations.length - 8} more recommendations
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
