import { useState, useEffect, useCallback, useMemo } from "react"
import { Link } from "react-router-dom"
import { formatDate } from "@/lib/locale-format"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  Loader2,
  Receipt,
  FileText,
  AlertCircle,
} from "lucide-react"
import { featureApi, propertyApi } from "@/lib/api"
import type { PaymentRecord, Property } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatUSDate, formatUSD } from "@/lib/us-format"

// ─── Derived metric helpers ────────────────────────────────────────────────────

function calcYtdTotal(payments: PaymentRecord[]): number {
  const year = new Date().getFullYear()
  return payments
    .filter((p) => p.status === "succeeded" && new Date(p.createdAt).getFullYear() === year)
    .reduce((sum, p) => sum + p.amountCents / 100, 0)
}

function calcOnTimeRate(payments: PaymentRecord[]): number {
  if (payments.length === 0) return 0
  const succeeded = payments.filter((p) => p.status === "succeeded").length
  return Math.round((succeeded / payments.length) * 100)
}

function getNextDueDate(moveInDateIso: string): Date {
  const moveIn = new Date(moveInDateIso)
  const now = new Date()
  const next = new Date(moveIn)
  while (next <= now) {
    next.setMonth(next.getMonth() + 1)
  }
  return next
}

function formatMonthDay(date: Date): string {
  return formatDate(date, { month: "long", day: "numeric", year: "numeric" })
}

const INITIAL_LIMIT = 10

export default function TenantFinances() {
  const { toast } = useToast()
  const [property, setProperty] = useState<Property | null>(null)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loadingProperty, setLoadingProperty] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [errorProperty, setErrorProperty] = useState<string | null>(null)
  const [errorPayments, setErrorPayments] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const fetchProperty = useCallback(async () => {
    setLoadingProperty(true)
    setErrorProperty(null)
    try {
      const p = await propertyApi.getTenantProperty()
      // getTenantProperty returns GetPropertyResponse which wraps in { property }
      const prop = (p as { property?: Property }).property ?? (p as unknown as Property)
      setProperty(prop)
    } catch (e) {
      setErrorProperty(e instanceof Error ? e.message : "Failed to load property")
    } finally {
      setLoadingProperty(false)
    }
  }, [])

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true)
    setErrorPayments(null)
    try {
      const result = await featureApi.stripe.getPaymentHistory(1, 100)
      setPayments(result.data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load payment history"
      setErrorPayments(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoadingPayments(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProperty()
    fetchPayments()
  }, [fetchProperty, fetchPayments])

  const ytdTotal = useMemo(() => calcYtdTotal(payments), [payments])
  const onTimeRate = useMemo(() => calcOnTimeRate(payments), [payments])
  const nextDueDate = useMemo(
    () => (property?.createdAt ? getNextDueDate(property.createdAt) : null),
    [property]
  )
  const monthlyRent = property?.price ?? null
  const displayedPayments = showAll ? payments : payments.slice(0, INITIAL_LIMIT)

  const loading = loadingProperty || loadingPayments

  if (!loading && !property && !errorProperty) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-semibold mb-2">No lease found</h2>
        <p className="text-muted-foreground">
          You don&apos;t have an active lease yet. Contact your property manager to get set up.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Overview</h1>
        <p className="text-muted-foreground mt-1">
          Your rent history, upcoming payments, and lease cost breakdown
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Monthly Rent",
            value: loading ? "Loading…" : monthlyRent != null ? formatUSD(monthlyRent) : "—",
            icon: DollarSign,
            detail: property ? `${property.addressLine1 ?? ""}` : "No property assigned",
          },
          {
            label: "Next Due Date",
            value: loading ? "Loading…" : nextDueDate ? formatMonthDay(nextDueDate) : "—",
            icon: Calendar,
            detail: monthlyRent != null ? `${formatUSD(monthlyRent)} due` : "",
          },
          {
            label: "Total Paid (YTD)",
            value: loading ? "Loading…" : formatUSD(ytdTotal),
            icon: TrendingUp,
            detail: `${payments.filter((p) => p.status === "succeeded" && new Date(p.createdAt).getFullYear() === new Date().getFullYear()).length} payments this year`,
          },
          {
            label: "On-Time Rate",
            value: loading ? "Loading…" : `${onTimeRate}%`,
            icon: CheckCircle,
            detail: `${payments.filter((p) => p.status === "succeeded").length} of ${payments.length} payments succeeded`,
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.detail}</p>
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

      {/* Upcoming payment callout */}
      {nextDueDate && monthlyRent != null && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium">Upcoming payment</p>
              <p className="text-sm text-muted-foreground">
                {formatUSD(monthlyRent)} due {formatMonthDay(nextDueDate)}
              </p>
            </div>
            <Link to="/tenant/payments">
              <Button size="sm">Make a payment →</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="lease">Lease Cost</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-4">
          {errorProperty && (
            <Card className="border-destructive/40">
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive">{errorProperty}</p>
                <Button variant="outline" size="sm" onClick={fetchProperty}>Retry</Button>
              </CardContent>
            </Card>
          )}
          {property && (
            <Card>
              <CardHeader>
                <CardTitle>Your property</CardTitle>
                <CardDescription>Current rental address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {property.addressLine1}
                    {property.addressLine2 ? `, ${property.addressLine2}` : ""}
                    {property.city ? `, ${property.city}` : ""}
                    {property.state ? `, ${property.state}` : ""}
                    {property.zipcode ? ` ${property.zipcode}` : ""}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly rent</p>
                    <p className="text-xl font-semibold">{monthlyRent != null ? formatUSD(monthlyRent) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">On-time rate</p>
                    <p className="text-xl font-semibold">{onTimeRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All rent and payment records</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading payments…
                </div>
              ) : errorPayments ? (
                <div className="flex items-center gap-3 py-4">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{errorPayments}</p>
                  <Button variant="outline" size="sm" onClick={fetchPayments}>Retry</Button>
                </div>
              ) : payments.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Receipt className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No payment history yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedPayments.map((p) => (
                    <div key={p.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-sm">{p.description || p.paymentType || "Payment"}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatUSDate(p.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={p.status === "succeeded" ? "default" : "secondary"}>
                            {p.status}
                          </Badge>
                          <span className="font-semibold">{formatUSD(p.amountCents / 100)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!showAll && payments.length > INITIAL_LIMIT && (
                    <Button variant="outline" className="w-full" onClick={() => setShowAll(true)}>
                      Load more ({payments.length - INITIAL_LIMIT} remaining)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lease Cost tab */}
        <TabsContent value="lease" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lease Cost Breakdown</CardTitle>
              <CardDescription>Your monthly rent and lease timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingProperty ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading lease info…
                </div>
              ) : property ? (
                <>
                  <div className="rounded-lg bg-muted/40 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Monthly rent</span>
                    <span className="font-semibold">{monthlyRent != null ? formatUSD(monthlyRent) : "—"}</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Lease start</span>
                    <span className="font-semibold">{property.createdAt ? formatUSDate(property.createdAt) : "—"}</span>
                  </div>
                  <div className="rounded-lg bg-muted/40 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Next payment due</span>
                    <span className="font-semibold">{nextDueDate ? formatMonthDay(nextDueDate) : "—"}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">No lease information available.</p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to="/tenant/lease-details" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    View full lease details
                  </Button>
                </Link>
                <Link to="/tenant/documents" className="flex-1">
                  <Button variant="outline" className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    View documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
