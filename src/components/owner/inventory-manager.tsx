"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Package, Plus, Minus, RotateCcw, AlertTriangle } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface InventoryItem {
  id: string
  name: string
  sku: string
  quantity: number
  minQuantity: number
  unitCost: number
  location: string
}

const MOCK_ITEMS: InventoryItem[] = [
  { id: "1", name: "HVAC Air Filter 16x20", sku: "HVF-1620", quantity: 12, minQuantity: 5, unitCost: 1200, location: "Storage Unit A" },
  { id: "2", name: "Light Bulb LED 60W", sku: "LB-LED60", quantity: 3, minQuantity: 10, unitCost: 350, location: "Storage Unit A" },
  { id: "3", name: "Caulk Tube (White)", sku: "CLK-WHT", quantity: 8, minQuantity: 4, unitCost: 650, location: "Maintenance Closet" },
  { id: "4", name: "Drain Snake 25ft", sku: "DS-25", quantity: 2, minQuantity: 2, unitCost: 4500, location: "Tool Room" },
  { id: "5", name: "Door Lock Set (Standard)", sku: "DLS-STD", quantity: 1, minQuantity: 3, unitCost: 8900, location: "Storage Unit B" },
]

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}` }

export function InventoryManager() {
  const { toast } = useToast()
  const [items, setItems] = useState<InventoryItem[]>(MOCK_ITEMS)
  const [addOpen, setAddOpen] = useState(false)
  const [usageOpen, setUsageOpen] = useState(false)
  const [restockOpen, setRestockOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [usageForm, setUsageForm] = useState({ qty: "", maintenanceRef: "" })
  const [restockQty, setRestockQty] = useState("")
  const [newItem, setNewItem] = useState({ name: "", sku: "", quantity: "", minQuantity: "", unitCost: "", location: "" })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await featureApi.inventory?.list?.()
      if (Array.isArray(res)) setItems(res as InventoryItem[])
    } catch { /* use mock */ }
  }

  const addItem = async () => {
    const { name, sku, quantity, minQuantity, unitCost, location } = newItem
    if (!name || !sku || !quantity) {
      toast({ title: "Please fill required fields", variant: "destructive" })
      return
    }
    const item: InventoryItem = {
      id: Date.now().toString(),
      name,
      sku,
      quantity: Number(quantity),
      minQuantity: Number(minQuantity) || 1,
      unitCost: Math.round(parseFloat(unitCost || "0") * 100),
      location,
    }
    try { await featureApi.inventory?.add?.(item) } catch { /* noop */ }
    setItems((prev) => [...prev, item])
    setNewItem({ name: "", sku: "", quantity: "", minQuantity: "", unitCost: "", location: "" })
    setAddOpen(false)
    toast({ title: "Item added to inventory" })
  }

  const openUsage = (item: InventoryItem) => {
    setSelectedItem(item)
    setUsageForm({ qty: "", maintenanceRef: "" })
    setUsageOpen(true)
  }

  const recordUsage = async () => {
    if (!selectedItem || !usageForm.qty) return
    const qty = Number(usageForm.qty)
    if (qty > selectedItem.quantity) {
      toast({ title: "Insufficient quantity", variant: "destructive" })
      return
    }
    try { await featureApi.inventory?.recordUsage?.(selectedItem.id, qty, usageForm.maintenanceRef) } catch { /* noop */ }
    setItems((prev) => prev.map((i) => i.id === selectedItem.id ? { ...i, quantity: i.quantity - qty } : i))
    setUsageOpen(false)
    toast({ title: `Used ${qty} × ${selectedItem.name}` })
  }

  const openRestock = (item: InventoryItem) => {
    setSelectedItem(item)
    setRestockQty("")
    setRestockOpen(true)
  }

  const restock = async () => {
    if (!selectedItem || !restockQty) return
    const qty = Number(restockQty)
    try { await featureApi.inventory?.restock?.(selectedItem.id, qty) } catch { /* noop */ }
    setItems((prev) => prev.map((i) => i.id === selectedItem.id ? { ...i, quantity: i.quantity + qty } : i))
    setRestockOpen(false)
    toast({ title: `Restocked ${qty} × ${selectedItem.name}` })
  }

  const lowStockCount = items.filter((i) => i.quantity <= i.minQuantity).length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total SKUs</p>
                <p className="text-xl font-bold text-blue-700">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${lowStockCount > 0 ? "bg-red-100" : "bg-green-100"}`}>
                <AlertTriangle className={`h-5 w-5 ${lowStockCount > 0 ? "text-red-600" : "text-green-600"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                <p className={`text-xl font-bold ${lowStockCount > 0 ? "text-red-600" : "text-green-700"}`}>{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                <p className="text-xl font-bold text-purple-700">
                  {fmt(items.reduce((s, i) => s + i.quantity * i.unitCost, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Parts Inventory</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Min Qty</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.name}
                    {item.quantity <= item.minQuantity && (
                      <Badge variant="destructive" className="ml-2 text-xs">Low Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className={item.quantity <= item.minQuantity ? "text-red-600 font-bold" : ""}>{item.quantity}</TableCell>
                  <TableCell className="text-muted-foreground">{item.minQuantity}</TableCell>
                  <TableCell>{fmt(item.unitCost)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{item.location}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openUsage(item)} title="Record Usage">
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openRestock(item)} title="Restock">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { id: "iname", label: "Item Name *", key: "name", placeholder: "e.g. HVAC Air Filter 16x20" },
              { id: "isku", label: "SKU *", key: "sku", placeholder: "e.g. HVF-1620" },
              { id: "iqty", label: "Quantity *", key: "quantity", placeholder: "0", type: "number" },
              { id: "iminqty", label: "Min Quantity", key: "minQuantity", placeholder: "1", type: "number" },
              { id: "icost", label: "Unit Cost ($)", key: "unitCost", placeholder: "0.00", type: "number" },
              { id: "iloc", label: "Location", key: "location", placeholder: "e.g. Storage Unit A" },
            ].map((f) => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id}>{f.label}</Label>
                <Input
                  id={f.id}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(newItem as any)[f.key]}
                  onChange={(e) => setNewItem((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Usage Dialog */}
      <Dialog open={usageOpen} onOpenChange={setUsageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Record Usage — {selectedItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Available: {selectedItem?.quantity} units</p>
            <div className="space-y-1">
              <Label>Quantity Used</Label>
              <Input type="number" min={1} max={selectedItem?.quantity} value={usageForm.qty} onChange={(e) => setUsageForm((d) => ({ ...d, qty: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Linked Maintenance Request (optional)</Label>
              <Input placeholder="e.g. MR-2048" value={usageForm.maintenanceRef} onChange={(e) => setUsageForm((d) => ({ ...d, maintenanceRef: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsageOpen(false)}>Cancel</Button>
            <Button onClick={recordUsage}>Record Usage</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Restock — {selectedItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Current stock: {selectedItem?.quantity} units</p>
            <div className="space-y-1">
              <Label>Quantity to Add</Label>
              <Input type="number" min={1} value={restockQty} onChange={(e) => setRestockQty(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockOpen(false)}>Cancel</Button>
            <Button onClick={restock}>Restock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
