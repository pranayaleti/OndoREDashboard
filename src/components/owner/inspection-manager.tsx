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
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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
}

interface InspectionItem {
  id: string
  area: string
  itemName: string
  condition?: string
  notes?: string
}

interface InspectionDetail {
  id: string
  inspectionType: string
  status: string
  scheduledDate: string
  overallCondition?: string | null
  notes?: string | null
  items?: InspectionItem[]
}

const typeLabels: Record<string, string> = {
  move_in: "Move-In",
  move_out: "Move-Out",
  periodic: "Routine",
  emergency: "Emergency",
  annual: "Annual",
  pre_lease: "Pre-Lease",
  post_maintenance: "Post-Maintenance",
  custom: "Custom",
}

const ISSUE_CONDITIONS = new Set(["poor", "damaged", "missing"])

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-muted text-slate-500",
}

export function InspectionManager({ propertyId }: InspectionManagerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<InspectionDetail | null>(null)

  // Create form
  const [inspType, setInspType] = useState("periodic")
  const [schedDate, setSchedDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [itemArea, setItemArea] = useState("")
  const [itemName, setItemName] = useState("")
  const [itemCondition, setItemCondition] = useState("good")
  const [convertingId, setConvertingId] = useState<string | null>(null)

  useEffect(() => { load() }, [propertyId])

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

  const completeInspection = async (id: string, condition: string) => {
    try {
      await featureApi.inspections.update(id, {
        status: "completed",
        overallCondition: condition,
        completedDate: new Date().toISOString().slice(0, 10),
      })
      toast({ title: "Inspection completed" })
      setDetailId(null)
      await load()
    } catch {
      toast({ title: "Failed to update", variant: "destructive" })
    }
  }

  const addItem = async () => {
    if (!detailId || !itemArea.trim() || !itemName.trim()) return
    try {
      await featureApi.inspections.addItems(detailId, [
        { area: itemArea.trim(), itemName: itemName.trim(), condition: itemCondition },
      ])
      toast({ title: "Checklist item added" })
      setItemArea("")
      setItemName("")
      await loadDetail(detailId)
    } catch {
      toast({ title: "Failed to add item", variant: "destructive" })
    }
  }

  const convertItem = async (itemId: string) => {
    if (!detailId) return
    try {
      setConvertingId(itemId)
      await featureApi.inspections.convertItemToMaintenance(detailId, itemId)
      toast({ title: "Maintenance request opened" })
    } catch {
      toast({ title: "Failed to open maintenance", variant: "destructive" })
    } finally {
      setConvertingId(null)
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
                <p className="font-medium text-sm">{typeLabels[insp.inspectionType] || insp.inspectionType} Inspection</p>
                <p className="text-xs text-slate-500">
                  {new Date(insp.scheduledDate).toLocaleDateString()}
                  {insp.overallCondition && `: ${insp.overallCondition}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[insp.status] || statusColors.scheduled}>
                  {insp.status.replace("_", " ")}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => loadDetail(insp.id)}>
                  <Eye className="h-4 w-4" />
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
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inspection Details</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Type:</span> {typeLabels[detail.inspectionType]}</div>
                <div><span className="text-slate-500">Status:</span> {detail.status}</div>
                <div><span className="text-slate-500">Scheduled:</span> {new Date(detail.scheduledDate).toLocaleDateString()}</div>
                {detail.overallCondition && <div><span className="text-slate-500">Condition:</span> {detail.overallCondition}</div>}
              </div>
              {detail.notes && <p className="text-sm bg-muted dark:bg-card p-3 rounded">{detail.notes}</p>}

              {detail.items && detail.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Checklist Items</p>
                  {detail.items.map((item: InspectionItem) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-sm p-2 bg-muted dark:bg-card rounded">
                      <span>{item.area}: {item.itemName}</span>
                      <div className="flex items-center gap-2">
                        {item.condition && (
                          <Badge variant="secondary" className="text-xs capitalize">{item.condition}</Badge>
                        )}
                        {ISSUE_CONDITIONS.has(item.condition ?? "") && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={convertingId === item.id}
                            onClick={() => convertItem(item.id)}
                          >
                            {convertingId === item.id ? "Opening..." : "Open ticket"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 border-t pt-3">
                <p className="text-sm font-medium">Add checklist item</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Area" value={itemArea} onChange={(e) => setItemArea(e.target.value)} />
                  <Input placeholder="Item" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                </div>
                <Select value={itemCondition} onValueChange={setItemCondition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={addItem} disabled={!itemArea.trim() || !itemName.trim()}>
                  Add item
                </Button>
              </div>

              {detail.status !== "completed" && detail.status !== "cancelled" && (
                <div className="flex gap-2">
                  {["excellent", "good", "fair", "poor"].map((cond) => (
                    <Button key={cond} variant="outline" size="sm" className="capitalize" onClick={() => completeInspection(detail.id, cond)}>
                      {cond}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
