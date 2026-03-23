"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, AlertTriangle, Wrench } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Equipment {
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
  expectedLifespanYears: number | null
  replacementCostCents: number | null
}

interface EquipmentTrackerProps {
  propertyId: string
}

const conditionColors: Record<string, string> = {
  excellent: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
}

function fmtDate(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString()
}

export function EquipmentTracker({ propertyId }: EquipmentTrackerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [atRisk, setAtRisk] = useState<Equipment[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    category: "",
    manufacturer: "",
    model: "",
    installDate: "",
    expectedLifespanYears: "",
    replacementCostCents: "",
  })

  useEffect(() => { load() }, [propertyId])

  const load = async () => {
    try {
      setLoading(true)
      const [eq, risk] = await Promise.all([
        featureApi.equipment.list(propertyId),
        featureApi.equipment.atRisk(propertyId),
      ])
      setEquipment(eq as Equipment[])
      setAtRisk(risk as Equipment[])
    } catch {
      toast({ title: "Failed to load equipment", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!form.name || !form.category) return
    try {
      setSaving(true)
      await featureApi.equipment.add(propertyId, {
        name: form.name,
        category: form.category,
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        installDate: form.installDate || undefined,
        expectedLifespanYears: form.expectedLifespanYears ? Number(form.expectedLifespanYears) : undefined,
        replacementCostCents: form.replacementCostCents ? Number(form.replacementCostCents) * 100 : undefined,
      })
      toast({ title: "Equipment added" })
      setAddOpen(false)
      setForm({ name: "", category: "", manufacturer: "", model: "", installDate: "", expectedLifespanYears: "", replacementCostCents: "" })
      load()
    } catch {
      toast({ title: "Failed to add equipment", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* At-Risk Alert */}
      {atRisk.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-700 text-base">
              <AlertTriangle className="h-5 w-5" />
              At-Risk Equipment ({atRisk.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {atRisk.map((eq) => (
                <div key={eq.id} className="bg-white border border-red-200 rounded px-3 py-1.5 text-sm">
                  <span className="font-medium text-red-700">{eq.name}</span>
                  <span className="text-muted-foreground ml-2">{eq.category}</span>
                  <Badge className="ml-2 bg-red-100 text-red-700 text-xs">{eq.condition}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Equipment Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Equipment Inventory
          </CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Equipment
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : equipment.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No equipment tracked yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Installed</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Warranty Expiry</TableHead>
                  <TableHead>Replacement Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{eq.name}</p>
                        {(eq.manufacturer || eq.model) && (
                          <p className="text-xs text-muted-foreground">
                            {[eq.manufacturer, eq.model].filter(Boolean).join(" ")}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{eq.category}</TableCell>
                    <TableCell>
                      <Badge className={conditionColors[eq.condition] ?? "bg-slate-100 text-slate-600"}>
                        {eq.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{fmtDate(eq.installDate)}</TableCell>
                    <TableCell className="text-sm">{fmtDate(eq.nextServiceDate)}</TableCell>
                    <TableCell className="text-sm">{fmtDate(eq.warrantyExpiry)}</TableCell>
                    <TableCell className="text-sm">
                      {eq.replacementCostCents
                        ? `$${(eq.replacementCostCents / 100).toLocaleString()}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input
                  placeholder="e.g. HVAC Unit"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Category *</Label>
                <Input
                  placeholder="e.g. HVAC, Plumbing"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Manufacturer</Label>
                <Input
                  placeholder="e.g. Carrier"
                  value={form.manufacturer}
                  onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Model</Label>
                <Input
                  placeholder="e.g. XR15"
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Install Date</Label>
                <Input
                  type="date"
                  value={form.installDate}
                  onChange={(e) => setForm((f) => ({ ...f, installDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Expected Lifespan (years)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 15"
                  value={form.expectedLifespanYears}
                  onChange={(e) => setForm((f) => ({ ...f, expectedLifespanYears: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Replacement Cost ($)</Label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={form.replacementCostCents}
                onChange={(e) => setForm((f) => ({ ...f, replacementCostCents: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? "Adding…" : "Add Equipment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
