import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { featureApi } from "@/lib/api"
import { CalendarDays, Send, ChevronRight, AlertTriangle } from "lucide-react"

interface ExpiringLease {
  id: string
  propertyId?: string
  tenantId?: string
  tenantName?: string
  propertyTitle?: string
  startDate?: string
  endDate?: string
  monthlyRent?: number
  rent?: number
  status?: string
  daysUntilExpiry?: number
}

const formatCurrency = (n: number | undefined | null) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
    : "—"

const formatDate = (s: string | undefined | null) =>
  s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"

function bucketByExpiry(leases: ExpiringLease[]) {
  const buckets = { overdue: [] as ExpiringLease[], soon: [] as ExpiringLease[], later: [] as ExpiringLease[] }
  for (const l of leases) {
    const d = l.daysUntilExpiry ?? 999
    if (d < 0) buckets.overdue.push(l)
    else if (d <= 60) buckets.soon.push(l)
    else buckets.later.push(l)
  }
  return buckets
}

export default function ManagerLeases() {
  const [leases, setLeases] = useState<ExpiringLease[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renewLease, setRenewLease] = useState<ExpiringLease | null>(null)
  const [renewForm, setRenewForm] = useState({ leaseEnd: "", monthlyRent: "", securityDeposit: "" })
  const [submitting, setSubmitting] = useState(false)
  const [windowDays, setWindowDays] = useState(90)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    featureApi.leases
      .getExpiringSoon(windowDays)
      .then((rows) => {
        if (cancelled) return
        setLeases(rows as ExpiringLease[])
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message ?? "Failed to load expiring leases")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [windowDays])

  const buckets = useMemo(() => bucketByExpiry(leases), [leases])

  const openRenewal = (lease: ExpiringLease) => {
    setRenewLease(lease)
    const currentEnd = lease.endDate ? new Date(lease.endDate) : new Date()
    const proposedEnd = new Date(currentEnd)
    proposedEnd.setFullYear(proposedEnd.getFullYear() + 1)
    setRenewForm({
      leaseEnd: proposedEnd.toISOString().slice(0, 10),
      monthlyRent: String(lease.monthlyRent ?? lease.rent ?? ""),
      securityDeposit: "",
    })
  }

  const submitRenewal = async () => {
    if (!renewLease) return
    setSubmitting(true)
    try {
      await featureApi.leases.offerRenewal(renewLease.id, {
        leaseEnd: renewForm.leaseEnd,
        monthlyRent: Number(renewForm.monthlyRent),
        securityDeposit: renewForm.securityDeposit ? Number(renewForm.securityDeposit) : undefined,
      })
      setRenewLease(null)
      // refetch
      const rows = (await featureApi.leases.getExpiringSoon(windowDays)) as ExpiringLease[]
      setLeases(rows)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send renewal offer"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const renderRow = (l: ExpiringLease) => (
    <div
      key={l.id}
      className="flex items-center justify-between border-b border-border/40 px-4 py-3 last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{l.tenantName ?? l.tenantId ?? "—"}</div>
        <div className="text-xs text-muted-foreground truncate">
          {l.propertyTitle ?? l.propertyId ?? "—"} · ends {formatDate(l.endDate)} ·{" "}
          {formatCurrency(l.monthlyRent ?? l.rent)}/mo
        </div>
      </div>
      <div className="flex items-center gap-2">
        {typeof l.daysUntilExpiry === "number" && (
          <Badge variant={l.daysUntilExpiry < 0 ? "destructive" : l.daysUntilExpiry <= 60 ? "default" : "secondary"}>
            {l.daysUntilExpiry < 0 ? `${-l.daysUntilExpiry}d overdue` : `${l.daysUntilExpiry}d`}
          </Badge>
        )}
        <Button size="sm" variant="default" onClick={() => openRenewal(l)}>
          <Send className="mr-1 h-3.5 w-3.5" />
          Offer renewal
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5" /> Lease lifecycle
        </h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="window-days" className="text-sm text-muted-foreground">
            Window
          </Label>
          <select
            id="window-days"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
            className="bg-background border rounded px-2 py-1 text-sm"
          >
            <option value={30}>30d</option>
            <option value={60}>60d</option>
            <option value={90}>90d</option>
            <option value={180}>180d</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 text-sm p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Overdue ({buckets.overdue.length})
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : buckets.overdue.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">None — nice.</div>
          ) : (
            buckets.overdue.map(renderRow)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Renewing within 60 days ({buckets.soon.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : buckets.soon.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No leases expiring in this window.</div>
          ) : (
            buckets.soon.map(renderRow)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Later ({buckets.later.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : buckets.later.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No leases in this bucket.</div>
          ) : (
            buckets.later.map(renderRow)
          )}
        </CardContent>
      </Card>

      <Dialog open={!!renewLease} onOpenChange={(open) => !open && setRenewLease(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offer renewal</DialogTitle>
            <DialogDescription>
              {renewLease?.tenantName ?? renewLease?.tenantId} · current end {formatDate(renewLease?.endDate)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="leaseEnd">New end date</Label>
              <Input
                id="leaseEnd"
                type="date"
                value={renewForm.leaseEnd}
                onChange={(e) => setRenewForm((f) => ({ ...f, leaseEnd: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="monthlyRent">Monthly rent (USD)</Label>
              <Input
                id="monthlyRent"
                inputMode="numeric"
                value={renewForm.monthlyRent}
                onChange={(e) => setRenewForm((f) => ({ ...f, monthlyRent: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="securityDeposit">Security deposit (optional)</Label>
              <Input
                id="securityDeposit"
                inputMode="numeric"
                value={renewForm.securityDeposit}
                onChange={(e) => setRenewForm((f) => ({ ...f, securityDeposit: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenewLease(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={submitRenewal} disabled={submitting || !renewForm.leaseEnd || !renewForm.monthlyRent}>
              {submitting ? "Sending…" : "Send offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
