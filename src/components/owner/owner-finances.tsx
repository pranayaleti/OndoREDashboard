import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Loader2,
  Download,
} from "lucide-react"
import { reportsApi, type PnLStatement } from "@/lib/api/clients/reports"
import { getApiBaseUrl } from "@/lib/api/base-url"
import { getAuthHeaders } from "@/lib/api/http"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { DEMO_OWNER_FINANCIAL_SUMMARY, isOwnerDemoUser } from "@/lib/seed-data"

function formatDateRange(start: string, end: string): string {
  return `${start} to ${end}`
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString().slice(0, 10)
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  return { startDate, endDate }
}

const API_BASE_URL = getApiBaseUrl()

type OwnerFinanceTab = "overview" | "income" | "expenses"

function parseOwnerFinanceTab(param: string | null): OwnerFinanceTab {
  if (param === "income" || param === "expenses" || param === "overview") return param
  return "overview"
}

export default function OwnerFinances() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parseOwnerFinanceTab(searchParams.get("tab"))

  const setOwnerFinanceTab = (value: string) => {
    const next = parseOwnerFinanceTab(value)
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === "overview") p.delete("tab")
        else p.set("tab", next)
        return p
      },
      { replace: true }
    )
  }
  const [dateRange, setDateRange] = useState(getDefaultDateRange)
  const [pnl, setPnl] = useState<PnLStatement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchPnL = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportsApi.getPnL(
        { startDate: dateRange.startDate, endDate: dateRange.endDate },
        undefined
      )
      setPnl(data.properties.length > 0 ? data : isOwnerDemoUser(user) ? DEMO_OWNER_FINANCIAL_SUMMARY : data)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load financial summary"
      if (isOwnerDemoUser(user)) {
        setError(null)
        setPnl(DEMO_OWNER_FINANCIAL_SUMMARY)
      } else {
        setError(message)
        setPnl(null)
        toast({ title: "Error", description: message, variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }, [dateRange.startDate, dateRange.endDate, toast, user])

  useEffect(() => {
    fetchPnL()
  }, [fetchPnL])

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const token = getAuthHeaders().Authorization?.replace("Bearer ", "")
      const url = `${API_BASE_URL}/reports/pnl/export?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `pnl-${dateRange.startDate}-to-${dateRange.endDate}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
      toast({ title: "Download started", description: "P&L CSV export" })
    } catch {
      toast({ title: "Export failed", description: "Could not download CSV", variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  const summaryFromPnl = pnl
    ? {
        totalRevenue: pnl.income.total,
        totalExpenses: pnl.expenses.total,
        netIncome: pnl.netIncome,
      }
    : null

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">Finances</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track your investment performance and cash flow</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate" className="text-sm whitespace-nowrap">From</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange((r) => ({ ...r, startDate: e.target.value }))}
                className="w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="endDate" className="text-sm whitespace-nowrap">To</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange((r) => ({ ...r, endDate: e.target.value }))}
                className="w-36"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={exporting || !pnl}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
            </Button>
            <ExportPDFButton
              fileName="financial-overview"
              content={{
                title: "Financial Overview",
                subtitle: pnl ? formatDateRange(pnl.startDate, pnl.endDate) : "Track your investment performance and cash flow",
                summary: summaryFromPnl
                  ? [
                      { label: "Total Revenue", value: summaryFromPnl.totalRevenue },
                      { label: "Total Expenses", value: summaryFromPnl.totalExpenses },
                      { label: "Net Income", value: summaryFromPnl.netIncome },
                    ]
                  : [],
                tables: [],
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchPnL}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {loading ? (
          <Card className="md:col-span-3">
            <CardContent className="pt-6 flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading financial summary…</span>
            </CardContent>
          </Card>
        ) : summaryFromPnl ? (
          <>
            <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                    <p className="text-green-300 text-sm mb-1">Total Revenue</p>
                    <p className="text-white text-2xl font-bold">${summaryFromPnl.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-green-400 text-xs">{pnl ? formatDateRange(pnl.startDate, pnl.endDate) : ""}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-900 to-red-800 dark:from-red-950 dark:to-red-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CreditCard className="w-6 h-6 text-red-400 mb-2" />
                    <p className="text-red-300 text-sm mb-1">Total Expenses</p>
                    <p className="text-white text-2xl font-bold">${summaryFromPnl.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-red-400 text-xs">{pnl ? formatDateRange(pnl.startDate, pnl.endDate) : ""}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <DollarSign className="w-6 h-6 text-green-400 mb-2" />
                    <p className="text-green-300 text-sm mb-1">Net Income (NOI)</p>
                    <p className="text-white text-2xl font-bold">${summaryFromPnl.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-green-400 text-xs">{pnl ? formatDateRange(pnl.startDate, pnl.endDate) : ""}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : !error ? (
          <Card className="md:col-span-3">
            <CardContent className="pt-6 text-gray-500 dark:text-gray-400">No financial data for the selected period.</CardContent>
          </Card>
        ) : null}
      </div>

      <Tabs value={activeTab} onValueChange={setOwnerFinanceTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income">Income Analysis</TabsTrigger>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {pnl && pnl.properties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>By property</CardTitle>
                <CardDescription>Income, expenses, and net income for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Property</th>
                        <th className="text-right py-2">Income</th>
                        <th className="text-right py-2">Expenses</th>
                        <th className="text-right py-2">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pnl.properties.map((p) => (
                        <tr key={p.propertyId} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2">{p.propertyAddress || p.propertyId}</td>
                          <td className="text-right">${p.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="text-right">${p.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="text-right font-medium">${p.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
          {(!pnl || pnl.properties.length === 0) && !loading && (
            <Card>
              <CardContent className="pt-6 text-gray-500 dark:text-gray-400">
                No property breakdown for the selected period. Adjust the date range or add lease and payment data.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Income Analysis</CardTitle>
              <CardDescription>
                {pnl ? formatDateRange(pnl.startDate, pnl.endDate) : "Rental income for the selected period"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pnl ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Rent</span>
                    <span className="text-gray-900 dark:text-white font-bold">${pnl.income.rent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Late fees</span>
                    <span className="text-gray-900 dark:text-white font-bold">${pnl.income.lateFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Other income</span>
                    <span className="text-gray-900 dark:text-white font-bold">${pnl.income.other.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-900 dark:text-white font-medium">Total income</span>
                    <span className="text-green-600 dark:text-green-400 font-bold">${pnl.income.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Select a date range and load the report to see income breakdown.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>
                {pnl ? formatDateRange(pnl.startDate, pnl.endDate) : "Operating expenses by category"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pnl ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Maintenance</span>
                    <span className="text-gray-900 dark:text-white font-bold">${pnl.expenses.maintenance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Utilities</span>
                    <span className="text-gray-900 dark:text-white font-bold">${pnl.expenses.utilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Management</span>
                    <span className="text-gray-900 dark:text-white font-bold">${pnl.expenses.management.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Other</span>
                    <span className="text-gray-900 dark:text-white font-bold">${pnl.expenses.other.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-900 dark:text-white font-medium">Total expenses</span>
                    <span className="text-red-600 dark:text-red-400 font-bold">${pnl.expenses.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Select a date range and load the report to see expense breakdown.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
