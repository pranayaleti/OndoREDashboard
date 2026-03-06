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
import { AlertTriangle, RefreshCw, Mail, Phone, Building2, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { dashboardApi, type AtRiskTenant, type CreateRiskInterventionRequest } from "@/lib/api"
import { formatUSDate } from "@/lib/us-format"

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

export default function ManagerAtRisk() {
  const [list, setList] = useState<AtRiskTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [interventionTenant, setInterventionTenant] = useState<AtRiskTenant | null>(null)
  const [interventionType, setInterventionType] = useState<CreateRiskInterventionRequest["interventionType"]>("outreach")
  const [interventionNotes, setInterventionNotes] = useState("")
  const [interventionSubmitting, setInterventionSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchList = async () => {
    try {
      setLoading(true)
      const data = await dashboardApi.getAtRiskTenants()
      setList(data)
    } catch (err) {
      console.error("At-risk fetch error:", err)
      toast({
        title: "Error",
        description: "Failed to load at-risk tenants.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const handleRefreshScores = async () => {
    try {
      setRefreshing(true)
      const res = await dashboardApi.refreshAtRiskScores()
      toast({
        title: "Scores updated",
        description: res.message + ` (${res.tenantsScored} tenants scored).`,
      })
      await fetchList()
    } catch (err) {
      console.error("Refresh error:", err)
      toast({
        title: "Error",
        description: "Failed to run risk scoring.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const openInterventionDialog = (tenant: AtRiskTenant) => {
    setInterventionTenant(tenant)
    setInterventionType("outreach")
    setInterventionNotes("")
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
      toast({
        title: "Intervention recorded",
        description: `${INTERVENTION_LABELS[interventionType]} for ${interventionTenant.tenantFirstName ?? ""} ${interventionTenant.tenantLastName ?? ""}.`,
      })
      setInterventionTenant(null)
    } catch (err) {
      console.error("Create intervention error:", err)
      toast({
        title: "Error",
        description: "Failed to record intervention.",
        variant: "destructive",
      })
    } finally {
      setInterventionSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            At-risk tenants
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tenants flagged by risk score (payment, maintenance, tenure). Record interventions to prevent escalation.
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

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Loading at-risk list…
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No at-risk tenants right now.</p>
            <p className="text-sm mt-1">
              Run &quot;Refresh scores&quot; to compute risk from payment and maintenance data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {list.map((t) => (
            <Card key={t.tenantId} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg">
                      {t.tenantFirstName ?? ""} {t.tenantLastName ?? ""}
                    </CardTitle>
                    <Badge
                      variant={t.band === "high" ? "destructive" : "secondary"}
                      className="shrink-0"
                    >
                      {t.band}
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      score {(t.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openInterventionDialog(t)}
                    className="bg-gradient-to-r from-orange-500 to-red-800 text-white hover:from-orange-600 hover:to-red-900"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add intervention
                  </Button>
                </div>
                <CardDescription>
                  Scored {t.scoredAt ? formatUSDate(t.scoredAt) : "—"}
                  {t.features && typeof t.features === "object" && (
                    <span className="ml-2 text-xs">
                      Failed rent (90d): {(t.features as Record<string, number>).failed_rent_count_90d ?? 0}
                      {" · "}
                      Open maintenance: {(t.features as Record<string, number>).open_maintenance_count ?? 0}
                      {" · "}
                      High-priority: {(t.features as Record<string, number>).high_priority_maintenance_count ?? 0}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex flex-wrap gap-x-6 gap-y-1">
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
          ))}
        </div>
      )}

      <Dialog open={!!interventionTenant} onOpenChange={(open) => { if (!open) setInterventionTenant(null); }}>
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
            <Button variant="outline" onClick={() => setInterventionTenant(null)}>
              Cancel
            </Button>
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
    </div>
  )
}
