import { useState, useEffect } from "react"
import { HomeownerPropertyShell } from "./homeowner-property-shell"
import { ConfirmDeleteDialog } from "./confirm-delete-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { featureApi } from "@/lib/api"
import { Plus, Loader2, MoreVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EquipmentRow {
  id: string
  propertyId: string
  name: string
  category: string
  manufacturer: string | null
  model: string | null
  condition: string
  installDate: string | null
  nextServiceDate: string | null
  warrantyExpiry: string | null
  replacementCostCents: number | null
  photoUrl?: string | null
  lastServiceDate?: string | null
}

const SUGGESTIONS = [
  "Furnace",
  "AC Unit",
  "Heat Pump",
  "Thermostat",
  "Well Pump",
  "Water Softener",
  "Circuit Breaker",
  "Generator",
  "EV Charger",
  "Solar Panels",
  "Washer/Dryer",
  "Dishwasher",
]

const EQUIPMENT_CATEGORIES = [
  "hvac",
  "plumbing",
  "electrical",
  "appliances",
  "outdoor",
  "safety",
  "other",
] as const

const CONDITION_OPTIONS = [
  "excellent",
  "good",
  "fair",
  "poor",
  "critical",
  "replaced",
] as const

const CONDITION_LABEL: Record<string, string> = {
  excellent: "Excellent",
  good: "Working",
  fair: "Fair",
  poor: "Attention",
  critical: "Critical",
  replaced: "Replaced",
}

function inferCategory(label: string): string {
  const lower = label.toLowerCase()
  if (["hvac", "ac", "furnace", "heat pump", "thermostat"].some((k) => lower.includes(k)))
    return "hvac"
  if (["pump", "softener"].some((k) => lower.includes(k)))
    return "plumbing"
  if (["breaker", "ev", "solar", "charger", "generator"].some((k) => lower.includes(k)))
    return "electrical"
  return "appliances"
}

export function EquipmentGridPage() {
  return (
    <HomeownerPropertyShell>
      {({ propertyId }) => <EquipmentGridInner propertyId={propertyId} />}
    </HomeownerPropertyShell>
  )
}

function EquipmentGridInner({ propertyId }: { propertyId: string }) {
  const { toast } = useToast()
  const [items, setItems] = useState<EquipmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EquipmentRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<EquipmentRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: "",
    category: "",
    manufacturer: "",
    model: "",
    condition: "good",
    installDate: "",
    photoUrl: "",
  })

  const resetForm = (eq?: EquipmentRow | null) => {
    if (eq) {
      setForm({
        name: eq.name,
        category: eq.category,
        manufacturer: eq.manufacturer ?? "",
        model: eq.model ?? "",
        condition: eq.condition ?? "good",
        installDate: eq.installDate?.slice(0, 10) ?? "",
        photoUrl: eq.photoUrl ?? "",
      })
    } else {
      setForm({
        name: "",
        category: "",
        manufacturer: "",
        model: "",
        condition: "good",
        installDate: "",
        photoUrl: "",
      })
    }
  }

  const load = async () => {
    try {
      const raw = await featureApi.equipment.list(propertyId)
      setItems(raw as EquipmentRow[])
    } catch {
      toast({ title: "Failed to load equipment", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [propertyId])

  const save = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      toast({ title: "Name and category required", variant: "destructive" })
      return
    }
    try {
      setSaving(true)
      const data: Record<string, unknown> = {
        name: form.name.trim(),
        category: form.category.trim(),
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        condition: form.condition || undefined,
        installDate: form.installDate || undefined,
        photoUrl: form.photoUrl || undefined,
      }
      if (editing) {
        await featureApi.equipment.update(editing.id, data)
        toast({ title: "Equipment updated" })
      } else {
        await featureApi.equipment.add(propertyId, data)
        toast({ title: "Equipment added" })
      }
      setFormOpen(false)
      setEditing(null)
      resetForm()
      void load()
    } catch {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await featureApi.equipment.update(deleteTarget.id, { condition: "replaced" })
      toast({ title: "Equipment marked as replaced" })
      void load()
    } catch {
      toast({ title: "Failed to remove", variant: "destructive" })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            Home equipment
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track warranties, service dates, and maintenance for each item.
          </p>
        </div>
        <Button
          className="bg-emerald-700 hover:bg-emerald-800"
          onClick={() => {
            setEditing(null)
            resetForm()
            setFormOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add equipment
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((label) => (
          <Button
            key={label}
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setEditing(null)
              setForm({
                name: label,
                category: inferCategory(label),
                manufacturer: "",
                model: "",
                condition: "good",
                installDate: "",
                photoUrl: "",
              })
              setFormOpen(true)
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold">
          {loading ? "…" : `${items.length} unit${items.length !== 1 ? "s" : ""}`}
        </p>
        <p className="text-xs text-muted-foreground">
          Track warranties, service dates, and maintenance for each item.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No equipment yet. Use quick-add chips or Add equipment.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((eq) => (
            <Card key={eq.id} className="overflow-hidden border-border/80">
              <CardContent className="flex gap-3 p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  {eq.photoUrl ? (
                    <img
                      src={eq.photoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No photo
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-tight">{eq.name}</h3>
                      <p className="text-xs capitalize text-muted-foreground">
                        {eq.category}
                        {eq.manufacturer ? ` — ${eq.manufacturer}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        className={
                          eq.condition === "good" || eq.condition === "excellent"
                            ? "bg-emerald-100 text-emerald-800"
                            : eq.condition === "poor" || eq.condition === "critical"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-700"
                        }
                      >
                        {CONDITION_LABEL[eq.condition] ?? eq.condition}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditing(eq)
                            resetForm(eq)
                            setFormOpen(true)
                          }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(eq)}
                          >
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last service{" "}
                    {eq.lastServiceDate
                      ? new Date(eq.lastServiceDate).toLocaleDateString()
                      : "—"}
                    {eq.nextServiceDate
                      ? ` · Next ${new Date(eq.nextServiceDate).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Remove equipment?"
        description={`"${deleteTarget?.name ?? ""}" will be marked as replaced.`}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit equipment" : "Add equipment"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editing && (
                <div>
                  <Label>Condition</Label>
                  <Select
                    value={form.condition}
                    onValueChange={(v) => setForm((f) => ({ ...f, condition: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {CONDITION_LABEL[c] ?? c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Brand</Label>
                <Input
                  value={form.manufacturer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, manufacturer: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Model</Label>
                <Input
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Install date</Label>
              <Input
                type="date"
                value={form.installDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, installDate: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Photo URL</Label>
              <Input
                placeholder="https://…"
                value={form.photoUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, photoUrl: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
