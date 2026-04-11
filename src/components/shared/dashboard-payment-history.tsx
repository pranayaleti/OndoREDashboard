import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, AlertCircle } from "lucide-react"
import { dashboardApi, type DashboardPaymentItem } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { getDemoDashboardPayments } from "@/lib/seed-data"
import { ListRowsSkeleton } from "@/components/ui/list-skeletons"
import { EmptyState } from "@/components/ui/empty-state"

function formatUSD(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface DashboardPaymentHistoryProps {
  title?: string
  emptyMessage?: string
}

export function DashboardPaymentHistory({
  title = "Rent payments",
  emptyMessage = "No payments yet.",
}: DashboardPaymentHistoryProps) {
  const { user } = useAuth()
  const [items, setItems] = useState<DashboardPaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await dashboardApi.getDashboardPayments(page, limit)
      const fallbackItems = getDemoDashboardPayments(user)
      const nextItems = res.data.length === 0 && fallbackItems.length > 0 ? fallbackItems : res.data
      setItems(nextItems)
      setTotal(nextItems.length === fallbackItems.length ? nextItems.length : res.pagination.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments")
      const fallbackItems = getDemoDashboardPayments(user)
      setItems(fallbackItems)
      setTotal(fallbackItems.length)
    } finally {
      setLoading(false)
    }
  }, [page, user])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  if (loading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ListRowsSkeleton rows={4} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertCircle className="h-10 w-10 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Could not load payments</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchPayments}>
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-orange-600 dark:text-orange-500" />
          {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Rent and other payments received for your properties
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <EmptyState
              icon={<DollarSign className="h-12 w-12" />}
              title="No payments found"
              description={emptyMessage}
              ctaLabel="Open finances"
              ctaHref={user?.role === "owner" ? "/owner/finances" : "/dashboard/finances"}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <Card key={p.id}>
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-lg">{formatUSD(p.amountCents)}</p>
                    <p className="text-sm text-muted-foreground capitalize">{p.paymentType}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      {p.payerEmail && <span>{p.payerEmail}</span>}
                      {p.propertyAddress && <span>{p.propertyAddress}</span>}
                      {p.createdAt && <span>{formatDate(p.createdAt)}</span>}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded ${
                      p.status === "succeeded"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                        : p.status === "pending"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          {total > limit && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
