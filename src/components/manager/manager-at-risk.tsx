import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  UserPlus,
  Brain,
  BarChart3,
  List,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  dashboardApi,
  type AtRiskTenant,
  type CreateRiskInterventionRequest,
  type InlineRecommendation,
  type TenantRiskHistory,
} from "@/lib/api"
import { formatUSDate } from "@/lib/us-format"
import { SparklineChart } from "./sparkline-chart"
import RiskAnalytics from "./risk-analytics"

type Tab = "tenants" | "analytics" | "interventions"

const INTERVENTION_TYPES: CreateRiskInterventionRequest["interventionType"][] = [
  "payment_plan",
  "reminder",
  "assistance_referral",
  "outreach",
  "early_renewal",
]

const INTERVENTION_LABELS: Record<CreateRiskInterventionRequest["interventionType"], string> = {
  payment_plan: "Payment plan",
  reminder: "Reminder",
  assistance_referral: "Assistance referral",
  outreach: "Outreach",
  early_renewal: "Early renewal",
}

const RECOMMENDATION_COLORS: Record<CreateRiskInterventionRequest["interventionType"], string> = {
  payment_plan: "bg-red-100 text-red-700 border-red-200",
  reminder: "bg-yellow-100 text-yellow-700 border-yellow-200",
  assistance_referral: "bg-blue-100 text-blue-700 border-blue-200",
  outreach: "bg-purple-100 text-purple-700 border-purple-200",
  early_renewal: "bg-green-100 text-green-700 border-green-200",
}

function FeaturePill({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
      warn ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    }`}>
      {label}: <strong>{value}</strong>
    </span>
  )
}

function ScoreBar({ score, band }: { score: number; band: string }) {
  const color = band === "high" ? "bg-red-500" : band === "medium" ? "bg-amber-500" : "bg-green-500"
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score * 100}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{(score * 100).toFixed(0)}%</span>
    </div>
  )
}

interface TenantCardProps {
  t: AtRiskTenant
  onIntervention: (tenant: AtRiskTenant) => void
  onViewHistory: (tenantId: string) => void
}

function TenantCard({ t, onIntervention, onViewHistory }: TenantCardProps) {
  const [recommendation, setRecommendation] = useState<InlineRecommendation | null>(null)
  const features = (t.features ?? {}) as Record<string, number>

  useEffect(() => {
    dashboardApi.getInlineRecommendation(t.tenantId)
      .then(setRecommendation)
      .catch(() => { /* silently ignore if no score yet */ })
  }, [t.tenantId])

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">
                {t.tenantFirstName ?? ""} {t.tenantLastName ?? ""}
              </CardTitle>
              <Badge
                variant={t.band === "high" ? "destructive" : "secondary"}
                className="shrink-0 capitalize"
              >
                {t.band}
              </Badge>
            </div>
            <ScoreBar score={t.score} band={t.band} />
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewHistory(t.tenantId)}
              className="text-gray-500 text-xs"
            >
              History
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onIntervention(t)}
              className="bg-gradient-to-r from-orange-500 to-red-800 text-white hover:from-orange-600 hover:to-red-900"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Intervene
            </Button>
          </div>
        </div>

        {/* AI Recommendation badge */}
        {recommendation && (
          <div className={`mt-2 flex items-start gap-1.5 text-xs px-2.5 py-1.5 rounded-md border ${
            RECOMMENDATION_COLORS[recommendation.recommended_type]
          }`}>
            <Brain className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>Suggested:</strong> {INTERVENTION_LABELS[recommendation.recommended_type]}
              {" — "}
              <span className="opacity-80">{recommendation.reasoning.slice(0, 100)}{recommendation.reasoning.length > 100 ? "…" : ""}</span>
            </span>
          </div>
        )}

        <CardDescription className="mt-1.5 text-xs">
          Scored {t.scoredAt ? formatUSDate(t.scoredAt) : "—"}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5">
          <FeaturePill
            label="Failed rent (90d)"
            value={features.failed_rent_count_90d ?? 0}
            warn={(features.failed_rent_count_90d ?? 0) > 0}
          />
          <FeaturePill
            label="Open maint."
            value={features.open_maintenance_count ?? 0}
            warn={(features.open_maintenance_count ?? 0) >= 3}
          />
          <FeaturePill
            label="High priority"
            value={features.high_priority_maintenance_count ?? 0}
            warn={(features.high_priority_maintenance_count ?? 0) > 0}
          />
          {features.days_since_last_payment != null && features.days_since_last_payment < 999 && (
            <FeaturePill
              label="Days since payment"
              value={features.days_since_last_payment}
              warn={features.days_since_last_payment > 30}
            />
          )}
          {features.payment_success_rate != null && (
            <FeaturePill
              label="Payment rate"
              value={`${(features.payment_success_rate * 100).toFixed(0)}%`}
              warn={features.payment_success_rate < 0.7}
            />
          )}
          {features.maintenance_text_urgency != null && features.maintenance_text_urgency > 0 && (
            <FeaturePill
              label="Urgency"
              value={`${(features.maintenance_text_urgency * 100).toFixed(0)}%`}
              warn={features.maintenance_text_urgency >= 0.7}
            />
          )}
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400 pt-0.5">
          {t.tenantEmail && (
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {t.tenantEmail}
            </span>
          )}
          {t.tenantPhone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {t.tenantPhone}
            </span>
          )}
          {(t.propertyTitle || t.propertyAddress) && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {t.propertyTitle ?? t.propertyAddress ?? ""}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface HistoryDialogProps {
  tenantId: string | null
  onClose: () => void
}

function HistoryDialog({ tenantId, onClose }: HistoryDialogProps) {
  const [history, setHistory] = useState<TenantRiskHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    dashboardApi.getTenantRiskHistory(tenantId)
      .then(setHistory)
      .catch(() => toast({ title: "Error", description: "Failed to load history.", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [tenantId])

  const scores = history?.scoreHistory ?? []
  const sparklineData = [...scores].reverse().map((s) => ({ value: s.score }))

  const trendIcon = (() => {
    if (scores.length < 2) return <Minus className="h-4 w-4 text-gray-400" />
    const latest = scores[0].score
    const prev = scores[1].score
    if (latest > prev + 0.02) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (latest < prev - 0.02) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  })()

  return (
    <Dialog open={!!tenantId} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Risk history
            {trendIcon}
          </DialogTitle>
          <DialogDescription>Score timeline and past interventions</DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-center py-8 text-gray-400">Loading…</p>
        ) : history ? (
          <div className="space-y-4">
            {/* Sparkline */}
            {sparklineData.length > 1 && (
              <div className="h-20">
                <SparklineChart data={sparklineData} />
              </div>
            )}

            {/* Score history */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Scores</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {scores.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400 w-24 shrink-0">{formatUSDate(s.scoredAt)}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.band === "high" ? "bg-red-500" : s.band === "medium" ? "bg-amber-500" : "bg-green-500"}`}
                        style={{ width: `${s.score * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-gray-600 dark:text-gray-400">{(s.score * 100).toFixed(0)}%</span>
                    <span className="font-mono text-gray-400 text-[10px] w-12 text-right">{s.modelVersion}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interventions */}
            {history.interventions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Interventions</h4>
                <div className="space-y-2">
                  {history.interventions.map((i) => (
                    <div key={i.id} className="text-xs rounded-md border p-2 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium capitalize">{(i.type ?? "").replace(/_/g, " ")}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] py-0">{i.status}</Badge>
                          {i.effectivenessRating != null && (
                            <span className="flex items-center gap-0.5 text-amber-500">
                              <Star className="h-3 w-3 fill-current" />
                              {i.effectivenessRating}/5
                            </span>
                          )}
                        </div>
                      </div>
                      {i.notes && <p className="text-gray-500 line-clamp-2">{i.notes}</p>}
                      {i.outcome && <p className="text-gray-500 italic">Outcome: {i.outcome}</p>}
                      <p className="text-gray-400">{formatUSDate(i.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ManagerAtRisk() {
  const [activeTab, setActiveTab] = useState<Tab>("tenants")
  const [list, setList] = useState<AtRiskTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [interventionTenant, setInterventionTenant] = useState<AtRiskTenant | null>(null)
  const [interventionType, setInterventionType] = useState<CreateRiskInterventionRequest["interventionType"]>("outreach")
  const [interventionNotes, setInterventionNotes] = useState("")
  const [interventionSubmitting, setInterventionSubmitting] = useState(false)
  const [historyTenantId, setHistoryTenantId] = useState<string | null>(null)
  const [bandFilter, setBandFilter] = useState<"all" | "high" | "medium">("all")
  const { toast } = useToast()

  const fetchList = async () => {
    try {
      setLoading(true)
      const data = await dashboardApi.getAtRiskTenants()
      setList(data)
    } catch (err) {
      console.error("At-risk fetch error:", err)
      toast({ title: "Error", description: "Failed to load at-risk tenants.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [])

  const handleRefreshScores = async () => {
    try {
      setRefreshing(true)
      const res = await dashboardApi.refreshAtRiskScores()
      toast({ title: "Scores updated", description: `${res.message} (${res.tenantsScored} tenants scored).` })
      await fetchList()
    } catch {
      toast({ title: "Error", description: "Failed to run risk scoring.", variant: "destructive" })
    } finally {
      setRefreshing(false)
    }
  }

  const handleCreateIntervention = async () => {
    if (!interventionTenant) return
    try {
      setInterventionSubmitting(true)
      await dashboardApi.createRiskIntervention({
        tenantId: interventionTenant.tenantId,
        interventionType,
        propertyId: interventionTenant.propertyId ?? undefined,
        notes: interventionNotes || undefined,
      })
      toast({ title: "Intervention recorded", description: `${INTERVENTION_LABELS[interventionType]} for ${interventionTenant.tenantFirstName ?? ""} ${interventionTenant.tenantLastName ?? ""}.` })
      setInterventionTenant(null)
    } catch {
      toast({ title: "Error", description: "Failed to record intervention.", variant: "destructive" })
    } finally {
      setInterventionSubmitting(false)
    }
  }

  const filteredList = list.filter((t) => bandFilter === "all" || t.band === bandFilter)
  const highCount = list.filter((t) => t.band === "high").length
  const mediumCount = list.filter((t) => t.band === "medium").length

  const tabs = [
    { id: "tenants" as Tab, label: "Tenants", icon: List, count: list.length },
    { id: "analytics" as Tab, label: "Analytics", icon: BarChart3 },
    { id: "interventions" as Tab, label: "Recommendations", icon: ClipboardList },
  ]

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            At-risk tenants
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Predictive ML scoring · {list.length} flagged
            {highCount > 0 && <span className="text-red-500 ml-1">· {highCount} high risk</span>}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshScores}
          disabled={refreshing}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh scores
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-0.5 text-xs bg-orange-500 text-white rounded-full px-1.5 py-0 leading-4">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Tenants */}
      {activeTab === "tenants" && (
        <div className="space-y-4">
          {/* Band filter */}
          {list.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {(["all", "high", "medium"] as const).map((band) => (
                <button
                  key={band}
                  onClick={() => setBandFilter(band)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                    bandFilter === band
                      ? band === "high"
                        ? "bg-red-500 text-white border-red-500"
                        : band === "medium"
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-gray-800"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400"
                  }`}
                >
                  {band === "all" ? `All (${list.length})` : band === "high" ? `High (${highCount})` : `Medium (${mediumCount})`}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-400">Loading…</CardContent>
            </Card>
          ) : filteredList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>{list.length === 0 ? "No at-risk tenants right now." : "No tenants match this filter."}</p>
                {list.length === 0 && (
                  <p className="text-sm mt-1">Run "Refresh scores" to compute risk from payment and maintenance data.</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredList.map((t) => (
                <TenantCard
                  key={t.tenantId}
                  t={t}
                  onIntervention={(tenant) => {
                    setInterventionTenant(tenant)
                    setInterventionType("outreach")
                    setInterventionNotes("")
                  }}
                  onViewHistory={setHistoryTenantId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Analytics */}
      {activeTab === "analytics" && <RiskAnalytics />}

      {/* Tab: Recommendations — rendered via analytics tab for now, reuse RiskAnalytics */}
      {activeTab === "interventions" && <RiskAnalytics />}

      {/* Intervention dialog */}
      <Dialog open={!!interventionTenant} onOpenChange={(open) => { if (!open) setInterventionTenant(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record intervention</DialogTitle>
            <DialogDescription>
              {interventionTenant
                ? `${interventionTenant.tenantFirstName ?? ""} ${interventionTenant.tenantLastName ?? ""} — ${interventionTenant.tenantEmail ?? "No email"}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select
                value={interventionType}
                onValueChange={(v) => setInterventionType(v as CreateRiskInterventionRequest["interventionType"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVENTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {INTERVENTION_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="e.g. Offered payment plan; tenant agreed to pay by Friday"
                value={interventionNotes}
                onChange={(e) => setInterventionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterventionTenant(null)}>Cancel</Button>
            <Button
              onClick={handleCreateIntervention}
              disabled={interventionSubmitting}
              className="bg-gradient-to-r from-orange-500 to-red-800 text-white"
            >
              {interventionSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <HistoryDialog tenantId={historyTenantId} onClose={() => setHistoryTenantId(null)} />
    </div>
  )
}
