"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Send, FileText } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface LeaseRenewal {
  id: string
  tenantId: string
  propertyId: string
  currentRent: number
  proposedRent: number
  proposedStart: string
  proposedEnd: string
  status: string
  deadline: string | null
  notes: string | null
  createdAt: string
}

interface LeaseRenewalManagerProps {
  propertyId: string
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
}

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return "—"
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0) return "Expired"
  return `${diff}d`
}

function pctChange(current: number, proposed: number): string {
  if (!current) return "—"
  const pct = ((proposed - current) / current) * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

export function LeaseRenewalManager({ propertyId }: LeaseRenewalManagerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [renewals, setRenewals] = useState<LeaseRenewal[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    proposedStart: "",
    proposedEnd: "",
    proposedRent: "",
    notes: "",
  })

  useEffect(() => { load() }, [propertyId])

  const load = async () => {
    try {
      setLoading(true)
      const data = await featureApi.leaseRenewals.list(propertyId)
      setRenewals(data as LeaseRenewal[])
    } catch {
      toast({ title: "Failed to load lease renewals", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.proposedStart || !form.proposedEnd || !form.proposedRent) return
    try {
      setSaving(true)
      await featureApi.leaseRenewals.create({
        propertyId,
        proposedStart: form.proposedStart,
        proposedEnd: form.proposedEnd,
        proposedRent: Number(form.proposedRent),
        notes: form.notes || undefined,
      })
      toast({ title: "Renewal offer created" })
      setCreateOpen(false)
      setForm({ proposedStart: "", proposedEnd: "", proposedRent: "", notes: "" })
      load()
    } catch {
      toast({ title: "Failed to create renewal offer", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async (id: string) => {
    try {
      setSendingId(id)
      await featureApi.leaseRenewals.send(id)
      toast({ title: "Notice sent to tenant" })
      load()
    } catch {
      toast({ title: "Failed to send notice", variant: "destructive" })
    } finally {
      setSendingId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Lease Renewals
        </CardTitle>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Renewal Offer
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : renewals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No lease renewals found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Proposed Term</TableHead>
                <TableHead>Current Rent</TableHead>
                <TableHead>Proposed Rent</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renewals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.tenantId.slice(0, 8)}…</TableCell>
                  <TableCell className="text-xs">
                    {r.proposedStart ? new Date(r.proposedStart).toLocaleDateString() : "—"}
                    {" – "}
                    {r.proposedEnd ? new Date(r.proposedEnd).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>${(r.currentRent / 100).toLocaleString()}</TableCell>
                  <TableCell>${(r.proposedRent / 100).toLocaleString()}</TableCell>
                  <TableCell className={r.proposedRent >= r.currentRent ? "text-green-600" : "text-red-600"}>
                    {pctChange(r.currentRent, r.proposedRent)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[r.status] ?? "bg-slate-100 text-slate-600"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{daysUntil(r.deadline)}</TableCell>
                  <TableCell>
                    {r.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={sendingId === r.id}
                        onClick={() => handleSend(r.id)}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        {sendingId === r.id ? "Sending…" : "Send Notice"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Renewal Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Proposed Start</Label>
                <Input
                  type="date"
                  value={form.proposedStart}
                  onChange={(e) => setForm((f) => ({ ...f, proposedStart: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Proposed End</Label>
                <Input
                  type="date"
                  value={form.proposedEnd}
                  onChange={(e) => setForm((f) => ({ ...f, proposedEnd: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Proposed Monthly Rent ($)</Label>
              <Input
                type="number"
                placeholder="e.g. 2500"
                value={form.proposedRent}
                onChange={(e) => setForm((f) => ({ ...f, proposedRent: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes for the tenant…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Create Offer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
