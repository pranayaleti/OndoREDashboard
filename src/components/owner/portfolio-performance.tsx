"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { BarChart3, ExternalLink } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface PropertyMetric {
  propertyId: string
  propertyName: string
  monthlyRevenue: number
  occupancyRate: number
  expenseRatio: number
  maintenanceCostPerMonth: number
}

interface PortfolioData {
  properties: PropertyMetric[]
  averages: {
    monthlyRevenue: number
    occupancyRate: number
    expenseRatio: number
    maintenanceCostPerMonth: number
  }
}

function fmt(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`
}

function pct(val: number): string {
  return `${(val * 100).toFixed(1)}%`
}

type MetricKey = "monthlyRevenue" | "occupancyRate" | "expenseRatio" | "maintenanceCostPerMonth"

function findWorst(rows: PropertyMetric[], key: MetricKey): string {
  if (rows.length === 0) return ""
  // For occupancyRate: lower is worse. For expenseRatio & maintenanceCost: higher is worse. For revenue: lower is worse.
  const higherIsBad: MetricKey[] = ["expenseRatio", "maintenanceCostPerMonth"]
  if (higherIsBad.includes(key)) {
    const max = Math.max(...rows.map((r) => r[key]))
    return rows.find((r) => r[key] === max)?.propertyId ?? ""
  } else {
    const min = Math.min(...rows.map((r) => r[key]))
    return rows.find((r) => r[key] === min)?.propertyId ?? ""
  }
}

function cellClass(propertyId: string, worstId: string): string {
  return propertyId === worstId ? "bg-amber-50 text-amber-800 font-semibold" : ""
}

export function PortfolioPerformance() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PortfolioData | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const raw = await featureApi.performance.portfolio()
      setData(raw as PortfolioData)
    } catch {
      toast({ title: "Failed to load portfolio performance", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const rows = data?.properties ?? []
  const avg = data?.averages

  const worstRevenue = findWorst(rows, "monthlyRevenue")
  const worstOccupancy = findWorst(rows, "occupancyRate")
  const worstExpense = findWorst(rows, "expenseRatio")
  const worstMaint = findWorst(rows, "maintenanceCostPerMonth")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Portfolio Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No portfolio data available.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Monthly Revenue</TableHead>
                <TableHead>Occupancy Rate</TableHead>
                <TableHead>Expense Ratio</TableHead>
                <TableHead>Maintenance $/mo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.propertyId}>
                  <TableCell className="font-medium text-sm">{row.propertyName}</TableCell>
                  <TableCell className={cellClass(row.propertyId, worstRevenue)}>
                    {fmt(row.monthlyRevenue)}
                  </TableCell>
                  <TableCell className={cellClass(row.propertyId, worstOccupancy)}>
                    <div className="flex items-center gap-2">
                      {pct(row.occupancyRate)}
                      {row.occupancyRate < 0.7 && (
                        <Badge className="bg-red-100 text-red-700 text-xs">Low</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={cellClass(row.propertyId, worstExpense)}>
                    {pct(row.expenseRatio)}
                  </TableCell>
                  <TableCell className={cellClass(row.propertyId, worstMaint)}>
                    {fmt(row.maintenanceCostPerMonth)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <a href={`/properties/${row.propertyId}`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Portfolio Average Row */}
              {avg && (
                <TableRow className="bg-muted font-semibold border-t-2">
                  <TableCell className="text-slate-700">Portfolio Average</TableCell>
                  <TableCell className="text-slate-700">{fmt(avg.monthlyRevenue)}</TableCell>
                  <TableCell className="text-slate-700">{pct(avg.occupancyRate)}</TableCell>
                  <TableCell className="text-slate-700">{pct(avg.expenseRatio)}</TableCell>
                  <TableCell className="text-slate-700">{fmt(avg.maintenanceCostPerMonth)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          Highlighted cells indicate the worst-performing property in that metric.
        </p>
      </CardContent>
    </Card>
  )
}
