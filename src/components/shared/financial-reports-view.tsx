/**
 * Shared financial reports view: P&L, rent roll, vacancy.
 * For Owner: ownerId is not passed (backend uses userId).
 * For Manager/Admin/SuperAdmin: pass owners list and selectedOwnerId; backend requires ?ownerId=.
 */

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Loader2,
  Download,
  FileText,
} from "lucide-react"
import { reportsApi, type PnLStatement, type RentRollRow, type VacancyReport } from "@/lib/api/clients/reports"
import { getApiBaseUrl } from "@/lib/api/base-url"
import { getAuthHeaders } from "@/lib/api/http"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = getApiBaseUrl()

function formatDateRange(start: string, end: string): string {
  return `${start} to ${end}`
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString().slice(0, 10)
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  return { startDate, endDate }
}

export interface OwnerOption {
  id: string
  label: string
}

interface FinancialReportsViewProps {
  /** When true, owner selector is shown and ownerId must be set to fetch data. */
  requireOwnerSelection: boolean
  /** List of owners for the dropdown (Manager/Admin). */
  owners?: OwnerOption[]
  /** Currently selected owner id. */
  selectedOwnerId: string | null
  /** Called when user selects an owner. */
  onOwnerIdChange: (ownerId: string | null) => void
  /** Optional title above the section. */
  title?: string
}

export function FinancialReportsView({
  requireOwnerSelection,
  owners = [],
  selectedOwnerId,
  onOwnerIdChange,
  title = "Financial reports",
}: FinancialReportsViewProps) {
  const { toast } = useToast()
  const [dateRange, setDateRange] = useState(getDefaultDateRange)
  const [pnl, setPnl] = useState<PnLStatement | null>(null)
  const [rentRoll, setRentRoll] = useState<RentRollRow[] | null>(null)
  const [vacancy, setVacancy] = useState<VacancyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportingPnl, setExportingPnl] = useState(false)
  const [exportingRentRoll, setExportingRentRoll] = useState(false)
  const [activeTab, setActiveTab] = useState("pnl")

  const ownerIdForApi = requireOwnerSelection ? selectedOwnerId ?? undefined : undefined
  const canFetch = !requireOwnerSelection || !!selectedOwnerId

  const fetchReports = useCallback(async () => {
    if (!canFetch) return
    setLoading(true)
    setError(null)
    try {
      const [pnlData, rentRollData, vacancyData] = await Promise.all([
        reportsApi.getPnL(
          { startDate: dateRange.startDate, endDate: dateRange.endDate },
          ownerIdForApi
        ),
        reportsApi.getRentRoll(
          {
            month: new Date(dateRange.startDate).getMonth() + 1,
            year: new Date(dateRange.startDate).getFullYear(),
          },
          ownerIdForApi
        ),
        reportsApi.getVacancy(ownerIdForApi),
      ])
      setPnl(pnlData)
      setRentRoll(rentRollData)
      setVacancy(vacancyData)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load reports"
      setError(message)
      setPnl(null)
      setRentRoll(null)
      setVacancy(null)
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [canFetch, dateRange.startDate, dateRange.endDate, ownerIdForApi, toast])

  useEffect(() => {
    if (canFetch) fetchReports()
    else {
      setPnl(null)
      setRentRoll(null)
      setVacancy(null)
      setError(null)
    }
  }, [canFetch, fetchReports])

  const handleExportPnlCsv = async () => {
    setExportingPnl(true)
    try {
      const token = getAuthHeaders().Authorization?.replace("Bearer ", "")
      const url = `${API_BASE_URL}/reports/pnl/export?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}${ownerIdForApi ? `&ownerId=${encodeURIComponent(ownerIdForApi)}` : ""}`
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
      toast({ title: "Export failed", description: "Could not download P&L CSV", variant: "destructive" })
    } finally {
      setExportingPnl(false)
    }
  }

  const handleExportRentRollCsv = async () => {
    setExportingRentRoll(true)
    try {
      const token = getAuthHeaders().Authorization?.replace("Bearer ", "")
      const month = new Date(dateRange.startDate).getMonth() + 1
      const year = new Date(dateRange.startDate).getFullYear()
      const url = `${API_BASE_URL}/reports/rent-roll/export?month=${month}&year=${year}${ownerIdForApi ? `&ownerId=${encodeURIComponent(ownerIdForApi)}` : ""}`
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `rent-roll-${year}-${String(month).padStart(2, "0")}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
      toast({ title: "Download started", description: "Rent roll CSV export" })
    } catch {
      toast({ title: "Export failed", description: "Could not download rent roll CSV", variant: "destructive" })
    } finally {
      setExportingRentRoll(false)
    }
  }

  const summaryFromPnl = pnl
    ? { totalRevenue: pnl.income.total, totalExpenses: pnl.expenses.total, netIncome: pnl.netIncome }
    : null

  return (
    <div className="space-y-6">
      {title && (
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">P&L, rent roll, and vacancy from the reporting API</p>
        </div>
      )}

      {requireOwnerSelection && (
        <div className="flex flex-wrap items-center gap-4">
          <Label htmlFor="financial-owner-select">Owner</Label>
          <Select
            value={selectedOwnerId ?? ""}
            onValueChange={(v) => onOwnerIdChange(v || null)}
          >
            <SelectTrigger id="financial-owner-select" className="w-64">
              <SelectValue placeholder="Select an owner" />
            </SelectTrigger>
            <SelectContent>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {requireOwnerSelection && !selectedOwnerId && owners.length > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-500">Please select an owner to view reports.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="fr-start">From</Label>
          <Input
            id="fr-start"
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange((r) => ({ ...r, startDate: e.target.value }))}
            className="w-36"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="fr-end">To</Label>
          <Input
            id="fr-end"
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange((r) => ({ ...r, endDate: e.target.value }))}
            className="w-36"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports} disabled={!canFetch}>
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPnlCsv}
          disabled={exportingPnl || !pnl}
        >
          {exportingPnl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          P&L CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportRentRollCsv}
          disabled={exportingRentRoll || !canFetch}
        >
          {exportingRentRoll ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Rent roll CSV
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchReports}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!canFetch && requireOwnerSelection && (
        <Card>
          <CardContent className="pt-6 text-muted-foreground">
            Select an owner above to load P&L, rent roll, and vacancy reports.
          </CardContent>
        </Card>
      )}

      {canFetch && loading && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading reports…</span>
          </CardContent>
        </Card>
      )}

      {canFetch && !loading && (
        <>
          {summaryFromPnl && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <TrendingUp className="h-5 w-5 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${summaryFromPnl.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground">{pnl ? formatDateRange(pnl.startDate, pnl.endDate) : ""}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <CreditCard className="h-5 w-5 text-red-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">${summaryFromPnl.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground">{pnl ? formatDateRange(pnl.startDate, pnl.endDate) : ""}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <DollarSign className="h-5 w-5 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Net Income (NOI)</p>
                  <p className="text-2xl font-bold">${summaryFromPnl.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground">{pnl ? formatDateRange(pnl.startDate, pnl.endDate) : ""}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="pnl">P&L</TabsTrigger>
              <TabsTrigger value="rentroll">Rent roll</TabsTrigger>
              <TabsTrigger value="vacancy">Vacancy</TabsTrigger>
            </TabsList>
            <TabsContent value="pnl" className="space-y-4">
              {pnl && pnl.properties.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>By property</CardTitle>
                    <CardDescription>{formatDateRange(pnl.startDate, pnl.endDate)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-separate border-spacing-0">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2.5 px-3">Property</th>
                            <th className="text-right py-2.5 px-3">Income</th>
                            <th className="text-right py-2.5 px-3">Expenses</th>
                            <th className="text-right py-2.5 px-3">Net</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pnl.properties.map((p) => (
                            <tr key={p.propertyId} className="border-b">
                              <td className="py-2.5 px-3">{p.propertyAddress || p.propertyId}</td>
                              <td className="text-right py-2.5 px-3">${p.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="text-right py-2.5 px-3">${p.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="text-right py-2.5 px-3 font-medium">${p.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-muted-foreground">No P&L property breakdown for the selected period.</CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="rentroll" className="space-y-4">
              {rentRoll && rentRoll.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Rent roll</CardTitle>
                    <CardDescription>Units and payment status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-separate border-spacing-0">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2.5 px-3">Property</th>
                            <th className="text-left py-2.5 px-3">Unit</th>
                            <th className="text-left py-2.5 px-3">Tenant</th>
                            <th className="text-right py-2.5 px-3">Rent</th>
                            <th className="text-right py-2.5 px-3 whitespace-nowrap">Balance due</th>
                            <th className="text-left py-2.5 px-3 pl-8 min-w-[8rem]">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rentRoll.map((r, i) => (
                            <tr key={r.propertyId + (r.unitNumber ?? "") + i} className="border-b">
                              <td className="py-2.5 px-3">{r.propertyAddress}</td>
                              <td className="py-2.5 px-3">{r.unitNumber ?? "—"}</td>
                              <td className="py-2.5 px-3">{r.tenantName ?? r.tenantEmail ?? "—"}</td>
                              <td className="text-right py-2.5 px-3 whitespace-nowrap tabular-nums">
                                ${r.monthlyRent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-right py-2.5 px-3 whitespace-nowrap tabular-nums">
                                ${r.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 pl-8">{r.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-muted-foreground">No rent roll data for the selected period.</CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="vacancy" className="space-y-4">
              {vacancy && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vacancy summary</CardTitle>
                    <CardDescription>
                      {vacancy.totalUnits} units, {vacancy.occupiedUnits} occupied, {vacancy.vacantUnits} vacant ({vacancy.vacancyRate.toFixed(1)}% vacancy)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {vacancy.properties.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-separate border-spacing-0">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2.5 px-3">Property</th>
                              <th className="text-left py-2.5 px-3">Status</th>
                              <th className="text-left py-2.5 px-3">Tenant</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vacancy.properties.map((p) => (
                              <tr key={p.propertyId} className="border-b">
                                <td className="py-2.5 px-3">{p.propertyAddress}</td>
                                <td className="py-2.5 px-3">{p.isOccupied ? "Occupied" : "Vacant"}</td>
                                <td className="py-2.5 px-3">{p.tenantName ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No properties in scope.</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
