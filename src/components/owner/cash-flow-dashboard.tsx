"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CashFlowRow {
  month: string
  expectedIncome?: number
  actualIncome?: number
  expectedExpenses?: number
  actualExpenses?: number
  netCashFlow?: number
  netActual?: number
}

function fmt(cents: number | undefined): string {
  if (cents === undefined || cents === null) return "—"
  return `$${(cents / 100).toLocaleString()}`
}

function NetCell({ value }: { value: number | undefined }) {
  if (value === undefined || value === null) return <TableCell>—</TableCell>
  const positive = value >= 0
  return (
    <TableCell className={`font-semibold ${positive ? "text-green-600" : "text-red-600"}`}>
      {positive ? "+" : ""}{fmt(value)}
    </TableCell>
  )
}

export function CashFlowDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [forecastRows, setForecastRows] = useState<CashFlowRow[]>([])
  const [historicalRows, setHistoricalRows] = useState<CashFlowRow[]>([])

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const [forecast, historical] = await Promise.all([
        featureApi.cashFlow.forecast(6),
        featureApi.cashFlow.historical(6),
      ])

      const fRows = Array.isArray((forecast as any)?.months)
        ? (forecast as any).months
        : Array.isArray(forecast) ? forecast : []
      const hRows = Array.isArray((historical as any)?.months)
        ? (historical as any).months
        : Array.isArray(historical) ? historical : []

      setForecastRows(fRows)
      setHistoricalRows(hRows)
    } catch {
      toast({ title: "Failed to load cash flow data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const totalForecastIncome = forecastRows.reduce((s, r) => s + (r.expectedIncome ?? 0), 0)
  const totalForecastExpenses = forecastRows.reduce((s, r) => s + (r.expectedExpenses ?? 0), 0)
  const netPosition = totalForecastIncome - totalForecastExpenses

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projected Income (6mo)</p>
                <p className="text-xl font-bold text-green-700">{fmt(totalForecastIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projected Expenses (6mo)</p>
                <p className="text-xl font-bold text-red-600">{fmt(totalForecastExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${netPosition >= 0 ? "bg-blue-100" : "bg-orange-100"}`}>
                <TrendingUp className={`h-5 w-5 ${netPosition >= 0 ? "text-blue-700" : "text-orange-700"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Position (6mo)</p>
                <p className={`text-xl font-bold ${netPosition >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                  {netPosition >= 0 ? "+" : ""}{fmt(netPosition)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Tabs defaultValue="forecast">
              <TabsList className="mb-4">
                <TabsTrigger value="forecast">Forecast</TabsTrigger>
                <TabsTrigger value="historical">Historical</TabsTrigger>
              </TabsList>

              <TabsContent value="forecast">
                {forecastRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No forecast data available.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Expected Income</TableHead>
                        <TableHead>Expected Expenses</TableHead>
                        <TableHead>Net Cash Flow</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecastRows.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.month}</TableCell>
                          <TableCell className="text-green-600">{fmt(row.expectedIncome)}</TableCell>
                          <TableCell className="text-red-600">{fmt(row.expectedExpenses)}</TableCell>
                          <NetCell value={
                            row.netCashFlow ??
                            ((row.expectedIncome ?? 0) - (row.expectedExpenses ?? 0))
                          } />
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="historical">
                {historicalRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No historical data available.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Actual Income</TableHead>
                        <TableHead>Actual Expenses</TableHead>
                        <TableHead>Net Cash Flow</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicalRows.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.month}</TableCell>
                          <TableCell className="text-green-600">{fmt(row.actualIncome)}</TableCell>
                          <TableCell className="text-red-600">{fmt(row.actualExpenses)}</TableCell>
                          <NetCell value={
                            row.netActual ??
                            ((row.actualIncome ?? 0) - (row.actualExpenses ?? 0))
                          } />
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
