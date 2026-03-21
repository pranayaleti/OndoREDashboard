import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FinancialReportsView, type OwnerOption } from "@/components/shared/financial-reports-view"
import { authApi, dashboardApi, reportsApi, type DashboardPaymentItem, type InvitedUser } from "@/lib/api"
import type { PnLStatement, VacancyReport } from "@/lib/api/clients/reports"
import { formatUSDate, formatUSD } from "@/lib/us-format"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Building2, CreditCard, DollarSign, Loader2, Receipt, RefreshCw, TrendingUp } from "lucide-react"

function getDefaultDateRange() {
  const now = new Date()
  const endDate = now.toISOString().slice(0, 10)
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  return { startDate, endDate }
}

interface RoleFinancesViewProps {
  title: string
  description: string
  requireOwnerSelection?: boolean
  ownerPickerTitle?: string
}

type FinanceTab = "overview" | "payments" | "reports"

function parseFinanceTab(param: string | null): FinanceTab {
  if (param === "payments" || param === "reports" || param === "overview") return param
  return "overview"
}

export function RoleFinancesView({
  title,
  description,
  requireOwnerSelection = false,
  ownerPickerTitle = "Financial reports",
}: RoleFinancesViewProps) {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parseFinanceTab(searchParams.get("tab"))

  const setFinanceTab = (value: string) => {
    const next = parseFinanceTab(value)
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
  const [loading, setLoading] = useState(true)
  const [ownersLoading, setOwnersLoading] = useState(requireOwnerSelection)
  const [error, setError] = useState<string | null>(null)
  const [pnl, setPnl] = useState<PnLStatement | null>(null)
  const [vacancy, setVacancy] = useState<VacancyReport | null>(null)
  const [payments, setPayments] = useState<DashboardPaymentItem[]>([])
  const [owners, setOwners] = useState<OwnerOption[]>([])
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)

  const fetchOwners = useCallback(async () => {
    if (!requireOwnerSelection) return

    setOwnersLoading(true)
    try {
      const response = await authApi.getInvitedUsers(1, 500)
      const users = (response as { users?: InvitedUser[] }).users ?? []
      const ownerOptions = users
        .filter((user) => user.role === "owner" && user.isActive)
        .map((user) => ({
          id: user.id,
          label: `${user.firstName} ${user.lastName} (${user.email})`,
        }))

      setOwners(ownerOptions)
      setSelectedOwnerId((current) => current ?? ownerOptions[0]?.id ?? null)
    } catch (fetchError) {
      console.error("Failed to load owners for finance view:", fetchError)
      setOwners([])
      toast({
        title: "Could not load owners",
        description: "Owner-specific report filters are unavailable right now.",
        variant: "destructive",
      })
    } finally {
      setOwnersLoading(false)
    }
  }, [requireOwnerSelection, toast])

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [pnlData, vacancyData, paymentsData] = await Promise.all([
        reportsApi.getPnL({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
        reportsApi.getVacancy(),
        dashboardApi.getDashboardPayments(1, 8),
      ])

      setPnl(pnlData)
      setVacancy(vacancyData)
      setPayments(paymentsData.data ?? [])
    } catch (fetchError) {
      console.error("Failed to load finance overview:", fetchError)
      const message = fetchError instanceof Error ? fetchError.message : "Failed to load finance data"
      setError(message)
      setPnl(null)
      setVacancy(null)
      setPayments([])
      toast({
        title: "Finance data unavailable",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [dateRange.endDate, dateRange.startDate, toast])

  useEffect(() => {
    fetchOwners()
  }, [fetchOwners])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  const paymentSummary = useMemo(() => {
    return payments.reduce(
      (summary, payment) => {
        const amount = (payment.amountCents ?? 0) / 100
        summary.total += amount
        summary.count += 1
        if (payment.status?.toLowerCase() === "succeeded") {
          summary.succeeded += amount
        }
        return summary
      },
      { total: 0, succeeded: 0, count: 0 }
    )
  }, [payments])

  const summaryCards = [
    {
      label: "Revenue",
      value: formatUSD(pnl?.income.total),
      detail: `${dateRange.startDate} to ${dateRange.endDate}`,
      icon: TrendingUp,
    },
    {
      label: "Expenses",
      value: formatUSD(pnl?.expenses.total),
      detail: "Operating costs in selected range",
      icon: CreditCard,
    },
    {
      label: "Net income",
      value: formatUSD(pnl?.netIncome),
      detail: `${pnl?.properties.length ?? 0} properties contributing`,
      icon: DollarSign,
    },
    {
      label: "Vacancy rate",
      value: vacancy ? `${vacancy.vacancyRate.toFixed(1)}%` : "0.0%",
      detail: vacancy ? `${vacancy.vacantUnits} vacant of ${vacancy.totalUnits} units` : "No unit data yet",
      icon: Building2,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="role-finance-start">From</Label>
            <Input
              id="role-finance-start"
              type="date"
              value={dateRange.startDate}
              onChange={(event) => setDateRange((current) => ({ ...current, startDate: event.target.value }))}
              className="w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="role-finance-end">To</Label>
            <Input
              id="role-finance-end"
              type="date"
              value={dateRange.endDate}
              onChange={(event) => setDateRange((current) => ({ ...current, endDate: event.target.value }))}
              className="w-36"
            />
          </div>
          <Button variant="outline" onClick={fetchOverview} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">We couldn&apos;t load the finance overview.</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{loading ? "Loading..." : card.value}</p>
                    <p className="text-xs text-muted-foreground mt-2">{card.detail}</p>
                  </div>
                  <div className="rounded-full bg-muted p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setFinanceTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Recent payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio snapshot</CardTitle>
                <CardDescription>High-level finance health for the current scope</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Units occupied</p>
                    <p className="text-2xl font-semibold">{vacancy?.occupiedUnits ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {vacancy?.totalUnits ?? 0} total tracked units
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Payments in view</p>
                    <p className="text-2xl font-semibold">{paymentSummary.count}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatUSD(paymentSummary.total)} across recent entries
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Collected successfully</span>
                    <span className="font-medium">{formatUSD(paymentSummary.succeeded)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Other income</span>
                    <span className="font-medium">{formatUSD(pnl?.income.other)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Maintenance expense</span>
                    <span className="font-medium">{formatUSD(pnl?.expenses.maintenance)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Management expense</span>
                    <span className="font-medium">{formatUSD(pnl?.expenses.management)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property contribution</CardTitle>
                <CardDescription>Net operating income by property for the selected range</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading property contribution...
                  </div>
                ) : pnl?.properties.length ? (
                  <div className="space-y-3">
                    {pnl.properties.map((property) => (
                      <div key={property.propertyId} className="rounded-lg border p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium">{property.propertyAddress || property.propertyId}</p>
                            <p className="text-xs text-muted-foreground">Income {formatUSD(property.income)} | Expenses {formatUSD(property.expenses)}</p>
                          </div>
                          <Badge variant={property.netIncome >= 0 ? "default" : "destructive"}>
                            NOI {formatUSD(property.netIncome)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-sm text-muted-foreground">
                    No property-level finance rows are available for this date range yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Recent payments</CardTitle>
              <CardDescription>Latest rent and payment activity visible to this login</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading payments...
                </div>
              ) : payments.length ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{payment.description || payment.paymentType || "Payment"}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {payment.propertyAddress || payment.propertyTitle || "Property not linked"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.payerEmail || "No payer email"} | {formatUSDate(payment.createdAt ?? undefined)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={payment.status?.toLowerCase() === "succeeded" ? "default" : "secondary"}>
                            {payment.status || "unknown"}
                          </Badge>
                          <span className="font-semibold">{formatUSD((payment.amountCents ?? 0) / 100)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-sm text-muted-foreground">
                  No recent payments are available for this dashboard scope yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {ownersLoading ? (
            <Card>
              <CardContent className="pt-6 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading owner filters...
              </CardContent>
            </Card>
          ) : (
            <FinancialReportsView
              requireOwnerSelection={requireOwnerSelection}
              owners={owners}
              selectedOwnerId={selectedOwnerId}
              onOwnerIdChange={setSelectedOwnerId}
              title={ownerPickerTitle}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
