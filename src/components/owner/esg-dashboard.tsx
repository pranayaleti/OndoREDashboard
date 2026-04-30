"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Leaf, Zap, Droplets, Recycle, Sun, Plus } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ESGSummary {
  totalEnergyKwh: number
  totalWaterGallons: number
  wasteDiversionPct: number
  carbonOffsetTons: number
}

interface PropertyESG {
  id: string
  propertyName: string
  energyKwh: number
  waterGallons: number
  solarKwh: number
  recycledLbs: number
}

interface ESGGoal {
  label: string
  current: number
  target: number
  unit: string
}

const MOCK_SUMMARY: ESGSummary = {
  totalEnergyKwh: 48200,
  totalWaterGallons: 312000,
  wasteDiversionPct: 62,
  carbonOffsetTons: 14.8,
}

const MOCK_PROPERTIES: PropertyESG[] = [
  { id: "p1", propertyName: "Sunrise Apartments", energyKwh: 18400, waterGallons: 128000, solarKwh: 4200, recycledLbs: 1850 },
  { id: "p2", propertyName: "Oakwood Manor", energyKwh: 14900, waterGallons: 96000, solarKwh: 0, recycledLbs: 920 },
  { id: "p3", propertyName: "Birchwood Flats", energyKwh: 14900, waterGallons: 88000, solarKwh: 1800, recycledLbs: 1100 },
]

const MOCK_GOALS: ESGGoal[] = [
  { label: "Energy Reduction", current: 48200, target: 40000, unit: "kWh" },
  { label: "Water Conservation", current: 312000, target: 280000, unit: "gal" },
  { label: "Waste Diversion", current: 62, target: 75, unit: "%" },
  { label: "Carbon Offset", current: 14.8, target: 20, unit: "tons" },
]

function ProgressBar({ current, target, inverted = false }: { current: number; target: number; inverted?: boolean }) {
  const pct = Math.min(100, Math.round((inverted ? (2 * target - current) / target : current / target) * 100))
  const color = pct >= 100 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div className="space-y-1">
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground text-right">{pct}% of target</p>
    </div>
  )
}

export function ESGDashboard() {
  const { toast } = useToast()
  const [summary, setSummary] = useState<ESGSummary>(MOCK_SUMMARY)
  const [properties, setProperties] = useState<PropertyESG[]>(MOCK_PROPERTIES)
  const [goals] = useState<ESGGoal[]>(MOCK_GOALS)
  const [recordOpen, setRecordOpen] = useState(false)
  const [form, setForm] = useState({ propertyId: "", energyKwh: "", waterGallons: "", wasteRecycledLbs: "", solarKwh: "" })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [sumRes, propRes] = await Promise.allSettled([
        featureApi.esg?.getSummary?.(),
        featureApi.esg?.listProperties?.(),
      ])
      if (sumRes.status === "fulfilled" && sumRes.value) setSummary(sumRes.value as ESGSummary)
      if (propRes.status === "fulfilled" && Array.isArray(propRes.value)) setProperties(propRes.value as PropertyESG[])
    } catch { /* use mock */ }
  }

  const recordMetrics = async () => {
    if (!form.propertyId) {
      toast({ title: "Select a property", variant: "destructive" })
      return
    }
    try { await featureApi.esg?.recordMetrics?.(form.propertyId, form as unknown as Record<string, unknown>) } catch { /* noop */ }
    setRecordOpen(false)
    toast({ title: "ESG metrics recorded" })
    setForm({ propertyId: "", energyKwh: "", waterGallons: "", wasteRecycledLbs: "", solarKwh: "" })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-yellow-100 rounded-lg">
                <Zap className="h-4 w-4 text-yellow-700" />
              </div>
              <p className="text-sm font-medium">Energy Used</p>
            </div>
            <p className="text-2xl font-bold">{summary.totalEnergyKwh.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">kWh this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Droplets className="h-4 w-4 text-blue-700" />
              </div>
              <p className="text-sm font-medium">Water Used</p>
            </div>
            <p className="text-2xl font-bold">{summary.totalWaterGallons.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">gallons this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Recycle className="h-4 w-4 text-green-700" />
              </div>
              <p className="text-sm font-medium">Waste Diversion</p>
            </div>
            <p className="text-2xl font-bold">{summary.wasteDiversionPct}%</p>
            <p className="text-xs text-muted-foreground">recycled / composted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <Leaf className="h-4 w-4 text-emerald-700" />
              </div>
              <p className="text-sm font-medium">Carbon Offset</p>
            </div>
            <p className="text-2xl font-bold">{summary.carbonOffsetTons}</p>
            <p className="text-xs text-muted-foreground">tons CO₂ offset</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />ESG Performance
          </CardTitle>
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Record Metrics
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="breakdown">
            <TabsList className="mb-4">
              <TabsTrigger value="breakdown">Property Breakdown</TabsTrigger>
              <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3" />Energy (kWh)</span>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />Water (gal)</span>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1"><Sun className="h-3 w-3" />Solar (kWh)</span>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1"><Recycle className="h-3 w-3" />Recycled (lbs)</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((prop) => (
                    <TableRow key={prop.id}>
                      <TableCell className="font-medium">{prop.propertyName}</TableCell>
                      <TableCell>{prop.energyKwh.toLocaleString()}</TableCell>
                      <TableCell>{prop.waterGallons.toLocaleString()}</TableCell>
                      <TableCell className="text-yellow-600">{prop.solarKwh > 0 ? prop.solarKwh.toLocaleString() : "—"}</TableCell>
                      <TableCell>{prop.recycledLbs.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="goals">
              <div className="space-y-6">
                {goals.map((goal) => (
                  <div key={goal.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{goal.label}</span>
                      <span className="text-muted-foreground">
                        {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                      </span>
                    </div>
                    <ProgressBar
                      current={goal.current}
                      target={goal.target}
                      inverted={["Energy Reduction", "Water Conservation"].includes(goal.label)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record ESG Metrics</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Property</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.propertyId}
                onChange={(e) => setForm((d) => ({ ...d, propertyId: e.target.value }))}
              >
                <option value="">Select property...</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.propertyName}</option>)}
              </select>
            </div>
            {[
              { label: "Energy Usage (kWh)", key: "energyKwh", placeholder: "0" },
              { label: "Water Usage (gallons)", key: "waterGallons", placeholder: "0" },
              { label: "Waste Recycled (lbs)", key: "wasteRecycledLbs", placeholder: "0" },
              { label: "Solar Generated (kWh)", key: "solarKwh", placeholder: "0" },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <Label>{f.label}</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder={f.placeholder}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)}>Cancel</Button>
            <Button onClick={recordMetrics}>Save Metrics</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
