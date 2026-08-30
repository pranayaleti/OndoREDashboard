import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ClipboardCheck, Plus, Eye } from "lucide-react"
import { featureApi, propertyApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { getDashboardPath } from "@/lib/auth-utils"
import { InspectionWalkthrough, type PropertySnapshot, type WalkthroughInspection } from "@/components/owner/inspection-walkthrough"
import { formatDate } from "@/lib/locale-format"
import { inspectionTypeLabel, leaseDateRange, pickCurrentLease } from "@/lib/inspection-walkthrough-ui"

interface Inspection {
  id: string
  inspectionType: string
  status: string
  scheduledDate: string
  completedDate: string | null
  overallCondition: string | null
  notes: string | null
}

interface InspectionManagerProps {
  propertyId: string
  propertySnapshot?: PropertySnapshot
}

interface InspectionDetail {
  id: string
  inspectionType: string
  status: string
  scheduledDate: string
  overallCondition?: string | null
  notes?: string | null
  ownerSignatureName?: string | null
  ownerSignedAt?: string | null
  tenantSignatureName?: string | null
  tenantSignedAt?: string | null
  items?: WalkthroughInspection["items"]
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-muted text-slate-500",
}

export function InspectionManager({ propertyId, propertySnapshot }: InspectionManagerProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const maintenanceHref = `${getDashboardPath(user?.role ?? "owner")}/maintenance`
  const [loading, setLoading] = useState(true)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<InspectionDetail | null>(null)
  const [snapshot, setSnapshot] = useState<PropertySnapshot>(propertySnapshot ?? {})

  // Create form
  const [inspType, setInspType] = useState("periodic")
  const [schedDate, setSchedDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [propertyId])

  useEffect(() => {
    let cancelled = false
    async function loadSnapshot() {
      let next: PropertySnapshot = { ...(propertySnapshot ?? {}) }
      if (!propertySnapshot) {
        try {
          const res = await propertyApi.getProperty(propertyId)
          next = {
            title: res.property.title,
            bedrooms: res.property.bedrooms,
            bathrooms: res.property.bathrooms,
            sqft: res.property.sqft,
          }
        } catch {
          /* property summary is optional for the walkthrough */
        }
      }
      try {
        const leases = await featureApi.leases.listForProperty(propertyId) as Array<{
          status?: string
          leaseStart?: string
          leaseEnd?: string
          startDate?: string
          endDate?: string
        }>
        const range = leaseDateRange(pickCurrentLease(leases))
        if (range) {
          next = { ...next, leaseStart: range.start, leaseEnd: range.end }
        }
      } catch {
        /* lease dates are optional on the start card */
      }
      const base = getDashboardPath(user?.role ?? "owner")
      next = {
        ...next,
        leaseHref: `${base}/properties/${propertyId}?tab=leases`,
        applicationsHref: `${base}/properties/${propertyId}?tab=applications`,
        calendarHref: `${base}/calendar`,
      }
      if (!cancelled) setSnapshot(next)
    }
    void loadSnapshot()
    return () => { cancelled = true }
  }, [propertyId, propertySnapshot, user?.role])

  const load = async () => {
    try {
      setLoading(true)
      const data = await featureApi.inspections.list(propertyId)
      setInspections(data as Inspection[])
    } catch {
      toast({ title: "Failed to load inspections", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!schedDate) return
    try {
      setSaving(true)
      await featureApi.inspections.create(propertyId, {
        inspectionType: inspType,
        scheduledDate: schedDate,
        notes: notes || undefined,
      })
      toast({ title: "Inspection scheduled" })
      setCreateOpen(false)
      setSchedDate("")
      setNotes("")
      await load()
    } catch {
      toast({ title: "Failed to create inspection", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const loadDetail = async (id: string) => {
    try {
      const data = await featureApi.inspections.get(id)
      const raw = data as { data?: InspectionDetail } | InspectionDetail
      setDetail((raw as { data?: InspectionDetail }).data ?? (raw as InspectionDetail))
      setDetailId(id)
    } catch {
      toast({ title: "Failed to load inspection", variant: "destructive" })
    }
  }

  if (loading) {
    return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-blue-500" /> Property Inspections
        </h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Schedule
        </Button>
      </div>

      {inspections.length === 0 ? (
        <p className="text-center text-slate-500 py-6 text-sm">No inspections scheduled</p>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => (
            <div key={insp.id} className="flex items-center justify-between p-3 bg-muted dark:bg-card rounded-lg border">
              <div>
                <p className="font-medium text-sm">{inspectionTypeLabel(insp.inspectionType)} Inspection</p>
                <p className="text-xs text-slate-500">
                  {formatDate(insp.scheduledDate)}
                  {insp.overallCondition && `: ${insp.overallCondition}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[insp.status] || statusColors.scheduled}>
                  {insp.status.replace("_", " ")}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => loadDetail(insp.id)}
                  aria-label="View inspection"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Inspection</DialogTitle>
            <DialogDescription>Create a new property inspection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Type</Label>
              <Select value={inspType} onValueChange={setInspType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="move_in">Move-In</SelectItem>
                  <SelectItem value="move_out">Move-Out</SelectItem>
                  <SelectItem value="periodic">Routine</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="pre_lease">Pre-Lease</SelectItem>
                  <SelectItem value="post_maintenance">Post-Maintenance</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any notes..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !schedDate}>
                {saving ? "Creating..." : "Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={(open) => { if (!open) setDetailId(null) }}>
        <DialogContent
          className="flex h-[100dvh] max-h-[100dvh] max-w-none flex-col overflow-hidden rounded-none data-[state=closed]:animate-none data-[state=open]:animate-none sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-lg"
          overlayClassName="data-[state=closed]:animate-none data-[state=open]:animate-none"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {detail ? `${inspectionTypeLabel(detail.inspectionType)} walkthrough` : "Inspection walkthrough"}
              </DialogTitle>
              <DialogDescription>
                Capture each item, then finish, sign, and open work orders.
              </DialogDescription>
            </DialogHeader>
            {detail && (
              <InspectionWalkthrough
                key={`${detail.id}-${detail.items?.length ?? 0}`}
                inspection={detail as WalkthroughInspection}
                propertyId={propertyId}
                property={snapshot}
                maintenanceHref={maintenanceHref}
                onReload={async () => {
                  await loadDetail(detail.id)
                  await load()
                }}
                onClose={() => setDetailId(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
