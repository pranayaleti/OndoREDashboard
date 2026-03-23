import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { TrendingUp, Plus, Send, X } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface RentIncrease {
  id: string
  tenantId: string
  currentAmountCents: number
  newAmountCents: number
  effectiveDate: string
  noticePeriodDays: number
  status: string
  noticeSentAt: string | null
  reason: string | null
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  notice_sent: "bg-blue-100 text-blue-700",
  acknowledged: "bg-green-100 text-green-700",
  effective: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
}

interface RentIncreaseManagerProps {
  propertyId: string
}

export function RentIncreaseManager({ propertyId }: RentIncreaseManagerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [increases, setIncreases] = useState<RentIncrease[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [tenantId, setTenantId] = useState("")
  const [currentAmount, setCurrentAmount] = useState("")
  const [newAmount, setNewAmount] = useState("")
  const [effectiveDate, setEffectiveDate] = useState("")
  const [noticeDays, setNoticeDays] = useState("30")
  const [reason, setReason] = useState("")

  useEffect(() => { load() }, [propertyId])

  const load = async () => {
    try {
      setLoading(true)
      const data = await featureApi.rentIncreases.list(propertyId)
      setIncreases(data as RentIncrease[])
    } catch {
      toast({ title: "Failed to load", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      setSaving(true)
      await featureApi.rentIncreases.create(propertyId, {
        tenantId,
        currentAmountCents: Math.round(parseFloat(currentAmount) * 100),
        newAmountCents: Math.round(parseFloat(newAmount) * 100),
        effectiveDate,
        noticePeriodDays: parseInt(noticeDays),
        reason: reason || undefined,
      })
      toast({ title: "Rent increase created" })
      setCreateOpen(false)
      await load()
    } catch {
      toast({ title: "Failed to create", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const sendNotice = async (id: string) => {
    try {
      await featureApi.rentIncreases.sendNotice(id)
      toast({ title: "Notice sent to tenant" })
      await load()
    } catch {
      toast({ title: "Failed to send", variant: "destructive" })
    }
  }

  const cancel = async (id: string) => {
    try {
      await featureApi.rentIncreases.cancel(id)
      toast({ title: "Rent increase cancelled" })
      await load()
    } catch {
      toast({ title: "Failed to cancel", variant: "destructive" })
    }
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`

  if (loading) return <Skeleton className="h-32 w-full" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" /> Rent Increases
        </h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Schedule
        </Button>
      </div>

      {increases.length === 0 ? (
        <p className="text-center text-slate-500 py-6 text-sm">No rent increases scheduled</p>
      ) : (
        <div className="space-y-3">
          {increases.map((ri) => {
            const pct = Math.round(((ri.newAmountCents - ri.currentAmountCents) / ri.currentAmountCents) * 100)
            return (
              <Card key={ri.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {fmt(ri.currentAmountCents)} → {fmt(ri.newAmountCents)}
                        <span className="text-xs text-slate-500 ml-1">(+{pct}%)</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Effective {new Date(ri.effectiveDate).toLocaleDateString()}
                        {ri.reason && ` — ${ri.reason}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[ri.status]}>{ri.status.replace("_", " ")}</Badge>
                      {ri.status === "draft" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => sendNotice(ri.id)}>
                            <Send className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => cancel(ri.id)}>
                            <X className="h-4 w-4 text-red-400" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Rent Increase</DialogTitle>
            <DialogDescription>Create a rent increase with required notice period.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Tenant ID</Label>
              <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="Tenant user ID" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Rent ($)</Label>
                <Input type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
              </div>
              <div>
                <Label>New Rent ($)</Label>
                <Input type="number" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Effective Date</Label>
                <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
              </div>
              <div>
                <Label>Notice Period (days)</Label>
                <Input type="number" value={noticeDays} onChange={(e) => setNoticeDays(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason for increase..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !tenantId || !currentAmount || !newAmount || !effectiveDate}>
                {saving ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
