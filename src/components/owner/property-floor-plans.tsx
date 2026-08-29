import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Map, Plus, Trash2 } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface FloorPlan {
  id: string
  title: string
  imageUrl: string
  representation: string
  notes: string | null
  rooms: Array<{ id: string; name: string; x: number; y: number; width: number; height: number }>
}

interface PropertyFloorPlansProps {
  propertyId: string
}

export function PropertyFloorPlans({ propertyId }: PropertyFloorPlansProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<FloorPlan[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [roomNames, setRoomNames] = useState("")

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await featureApi.floorPlans.list(propertyId)
      setPlans(data as FloorPlan[])
    } catch {
      toast({ title: "Failed to load floor plans", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [propertyId, toast])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    if (!title.trim() || !imageUrl.trim()) return
    try {
      setSaving(true)
      const rooms = roomNames
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name, i) => ({
          id: `room-${i + 1}`,
          name,
          x: i * 12,
          y: 0,
          width: 10,
          height: 8,
        }))
      await featureApi.floorPlans.create(propertyId, {
        title: title.trim(),
        imageUrl: imageUrl.trim(),
        representation: "2d_image",
        notes: notes.trim() || undefined,
        rooms,
      })
      toast({ title: "Floor plan added" })
      setCreateOpen(false)
      setTitle("")
      setImageUrl("")
      setNotes("")
      setRoomNames("")
      await load()
    } catch {
      toast({ title: "Failed to add floor plan", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await featureApi.floorPlans.remove(id)
      toast({ title: "Floor plan removed" })
      await load()
    } catch {
      toast({ title: "Failed to remove floor plan", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Map className="h-4 w-4 text-orange-500" /> Floor plans
        </h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add 2D plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          No floor plans yet. Attach a 2D image of the unit. A 3D viewer is not available.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border bg-card overflow-hidden">
              <img
                src={plan.imageUrl}
                alt={plan.title}
                className="h-40 w-full object-cover bg-muted"
              />
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{plan.title}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {plan.representation === "3d_reserved" ? "3D reserved" : "2D"}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(plan.id)} aria-label="Delete floor plan">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {plan.rooms?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {plan.rooms.map((r) => r.name).join(", ")}
                  </p>
                )}
                {plan.notes && <p className="text-xs text-muted-foreground">{plan.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add 2D floor plan</DialogTitle>
            <DialogDescription>
              Attach a photo or drawing of the unit. Room names are labels on the 2D plan — this is not a 3D model.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fp-title">Title</Label>
              <Input id="fp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Level 1" />
            </div>
            <div>
              <Label htmlFor="fp-url">Image URL</Label>
              <Input
                id="fp-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
            <div>
              <Label htmlFor="fp-rooms">Rooms (comma-separated, optional)</Label>
              <Input
                id="fp-rooms"
                value={roomNames}
                onChange={(e) => setRoomNames(e.target.value)}
                placeholder="Kitchen, Bedroom, Bath"
              />
            </div>
            <div>
              <Label htmlFor="fp-notes">Notes</Label>
              <Textarea id="fp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !title.trim() || !imageUrl.trim()}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
