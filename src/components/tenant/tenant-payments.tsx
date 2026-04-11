import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Building,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"
import { formatUSD, formatUSDate } from "@/lib/us-format"
import { PaymentMethods } from "@/components/ui/payment-methods"
import { StripePaymentForm } from "@/components/stripe/StripePaymentForm"
import { featureApi, type StripePaymentMethod, type PaymentRecord } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { EmptyState } from "@/components/ui/empty-state"
import { getDemoPaymentHistory } from "@/lib/seed-data"

export default function TenantPayments() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")
  const [paymentAmount, setPaymentAmount] = useState("1850")
  const [selectedMethodId, setSelectedMethodId] = useState("")

  // Real data from API
  const [paymentMethods, setPaymentMethods] = useState<StripePaymentMethod[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [showAllPayments, setShowAllPayments] = useState(false)

  // Stripe payment dialog
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isCreatingIntent, setIsCreatingIntent] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  const paymentAmountNumber = Number(paymentAmount) || 0
  const INITIAL_PAYMENT_DISPLAY = 5

  const loadPaymentMethods = useCallback(async () => {
    try {
      const result = await featureApi.stripe.listPaymentMethods()
      setPaymentMethods(result.data)
      if (result.data.length > 0 && !selectedMethodId) {
        const defaultMethod = result.data.find((m) => m.isDefault) || result.data[0]
        setSelectedMethodId(defaultMethod.id)
      }
    } catch {
      // Will show empty
    }
  }, [selectedMethodId])

  const loadPaymentHistory = useCallback(async () => {
    setIsLoadingHistory(true)
    try {
      const result = await featureApi.stripe.getPaymentHistory(1, 50)
      const fallbackPayments = getDemoPaymentHistory(user)
      setPayments(result.data.length > 0 ? result.data : fallbackPayments)
    } catch {
      setPayments(getDemoPaymentHistory(user))
    } finally {
      setIsLoadingHistory(false)
    }
  }, [user])

  useEffect(() => {
    loadPaymentMethods()
    loadPaymentHistory()
  }, [loadPaymentMethods, loadPaymentHistory])

  const handlePayRent = async () => {
    if (paymentAmountNumber < 0.5) {
      toast({ title: "Invalid Amount", description: "Minimum payment is $0.50", variant: "destructive" })
      return
    }

    setIsCreatingIntent(true)
    try {
      const result = await featureApi.stripe.createPaymentIntent({
        amountCents: Math.round(paymentAmountNumber * 100),
        paymentType: "rent",
        description: "Monthly Rent Payment",
      })
      setClientSecret(result.clientSecret)
      setIsPaymentDialogOpen(true)
    } catch {
      toast({ title: "Error", description: "Failed to create payment. Please try again.", variant: "destructive" })
    } finally {
      setIsCreatingIntent(false)
    }
  }

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false)
    setClientSecret(null)
    toast({
      title: "Payment Successful",
      description: `Payment of ${formatUSD(paymentAmountNumber)} has been processed.`,
    })
    loadPaymentHistory()
  }

  const displayedPayments = showAllPayments
    ? payments
    : payments.slice(0, INITIAL_PAYMENT_DISPLAY)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "failed":
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const getMethodIcon = (type: string) => {
    if (type === "card") return <CreditCard className="h-4 w-4" />
    return <Building className="h-4 w-4" />
  }

  const succeededCount = payments.filter((p) => p.status === "succeeded").length

  const handleExportHistoryCsv = () => {
    if (payments.length === 0) return
    const rows = [
      ["Date", "Description", "Status", "Amount"],
      ...payments.map((payment) => [
        formatUSDate(payment.createdAt),
        payment.description || payment.paymentType || "Payment",
        payment.status,
        (payment.amountCents / 100).toFixed(2),
      ]),
    ]
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "tenant-payment-history.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast({ title: "Download started", description: "Payment history CSV export" })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Payments & Billing
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your rent payments and billing information
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pay">Pay Rent</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Payment Due</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUSD(1850)}</div>
                <p className="text-xs text-muted-foreground">Due on the 1st</p>
                <Button className="w-full mt-3" onClick={() => setActiveTab("pay")}>
                  Pay Now
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUSD(0)}</div>
                <p className="text-xs text-muted-foreground">All caught up!</p>
                <Badge className="mt-3 bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Paid
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment History</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{succeededCount}</div>
                <p className="text-xs text-muted-foreground">Payments made</p>
                <Button variant="outline" className="w-full mt-3" onClick={() => setActiveTab("history")}>
                  View History
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Your last 3 payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.length === 0 ? (
                  <EmptyState
                    icon={<Receipt className="h-10 w-10" />}
                    title="No payments yet"
                    description="Your payment history will appear here after your first successful rent payment."
                    ctaLabel="Go to pay rent"
                    ctaHref="/tenant/payments"
                  />
                ) : (
                  payments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                          {getStatusIcon(payment.status)}
                        </div>
                        <div>
                          <p className="font-medium">{payment.paymentType === "rent" ? "Rent" : payment.description || "Payment"}</p>
                          <p className="text-sm text-gray-500">{formatUSDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatUSD(payment.amountCents / 100)}</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pay Rent Tab */}
        <TabsContent value="pay" className="space-y-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Make a Payment</CardTitle>
                <CardDescription>Pay your rent securely via Stripe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="amount">Payment Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pl-10"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Monthly rent: {formatUSD(1850)}</p>
                </div>

                {paymentMethods.length > 0 && (
                  <div>
                    <Label>Saved Payment Method (optional)</Label>
                    <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => {
                          const brand = method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : method.type === "card" ? "Card" : "Bank"
                          return (
                            <SelectItem key={method.id} value={method.id}>
                              <div className="flex items-center space-x-2">
                                {getMethodIcon(method.type)}
                                <span>{brand} •••• {method.last4}</span>
                                {method.isDefault && <Badge variant="outline" className="ml-2">Default</Badge>}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Payment Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Rent Amount:</span>
                      <span>{formatUSD(paymentAmountNumber)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee:</span>
                      <span>{formatUSD(0)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>{formatUSD(paymentAmountNumber)}</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={handlePayRent} disabled={isCreatingIntent}>
                  {isCreatingIntent ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay {formatUSD(paymentAmountNumber)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Your payment is processed securely via Stripe. You will receive a confirmation once completed.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All your payment transactions</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleExportHistoryCsv} disabled={payments.length === 0}>
                  Export CSV
                </Button>
                <ExportPDFButton
                  fileName="payment-history"
                  size="default"
                  variant="outline"
                  content={{
                    title: "Payment History",
                    subtitle: "All your payment transactions",
                    userEmail: user?.email,
                    summary: [
                      { label: "Total Payments", value: payments.length },
                      { label: "Successful", value: succeededCount },
                    ],
                    tables: [
                      {
                        title: "Payment History",
                        headers: ["Date", "Amount", "Type", "Status"],
                        rows: payments.map((p) => [
                          formatUSDate(p.createdAt),
                          formatUSD(p.amountCents / 100),
                          p.paymentType,
                          p.status,
                        ]),
                      },
                    ],
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              ) : payments.length === 0 ? (
                <EmptyState
                  icon={<Receipt className="h-10 w-10" />}
                  title="No payment history yet"
                  description="Completed rent and fee payments will be listed here once your billing activity starts."
                  ctaLabel="Open payment methods"
                  onCtaClick={() => setActiveTab("methods")}
                />
              ) : (
                <div className="space-y-4">
                  {displayedPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-muted dark:bg-card rounded-full">
                          {getStatusIcon(payment.status)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {payment.paymentType === "rent" ? "Rent" : payment.description || "Payment"}
                          </p>
                          <p className="text-sm text-gray-500">{formatUSDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatUSD(payment.amountCents / 100)}</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {payments.length > INITIAL_PAYMENT_DISPLAY && (
                <div className="mt-6 flex justify-center">
                  <Button variant="outline" onClick={() => setShowAllPayments(!showAllPayments)} className="w-full sm:w-auto">
                    {showAllPayments ? "Show Less" : `View All (${payments.length} transactions)`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <PaymentMethods />
        </TabsContent>
      </Tabs>

      {/* Stripe Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
        if (!open) { setIsPaymentDialogOpen(false); setClientSecret(null) }
      }}>
        <DialogContent className="sm:max-w-lg border-2 border-orange-500">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Pay {formatUSD(paymentAmountNumber)} securely via Stripe
            </DialogDescription>
          </DialogHeader>
          {clientSecret ? (
            <StripePaymentForm
              clientSecret={clientSecret}
              amount={Math.round(paymentAmountNumber * 100)}
              onSuccess={handlePaymentSuccess}
              onError={(msg) => toast({ title: "Payment Failed", description: msg, variant: "destructive" })}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
