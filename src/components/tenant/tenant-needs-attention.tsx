import { Link } from "react-router-dom"
import { AlertCircle, CheckCircle2, CreditCard, Wrench } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/locale-format"

interface TenantNeedsAttentionProps {
  nextChargeDate?: string
  monthlyAmount?: number
  openMaintenanceCount: number
}

export function TenantNeedsAttention({
  nextChargeDate,
  monthlyAmount,
  openMaintenanceCount,
}: TenantNeedsAttentionProps) {
  const items: { href: string; title: string; subtitle: string; icon: typeof CreditCard }[] = []

  if (nextChargeDate) {
    const due = new Date(nextChargeDate)
    items.push({
      href: "/tenant/payments",
      title: monthlyAmount ? `Rent due ${formatDate(due, { month: "short", day: "numeric" })}` : "Upcoming rent",
      subtitle: monthlyAmount
        ? `$${monthlyAmount.toLocaleString()} — pay from your portal when you are ready.`
        : "Review your next charge and payment methods.",
      icon: CreditCard,
    })
  }

  if (openMaintenanceCount > 0) {
    items.push({
      href: "/tenant/maintenance",
      title: `${openMaintenanceCount} open maintenance ${openMaintenanceCount === 1 ? "request" : "requests"}`,
      subtitle: "Track status, add photos, or message your manager.",
      icon: Wrench,
    })
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Needs your attention</CardTitle>
          <CardDescription>Rent, maintenance, and messages that need a response.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
          <p>You are all caught up. No rent charge or open maintenance is waiting on you right now.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs your attention</CardTitle>
        <CardDescription>What to handle next in your home.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.href} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                </div>
              </div>
              <Link to={item.href}>
                <Button size="sm" variant="outline">
                  <Icon className="mr-1 h-3.5 w-3.5" />
                  Open
                </Button>
              </Link>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
