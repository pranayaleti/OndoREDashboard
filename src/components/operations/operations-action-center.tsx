import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  CalendarClock,
  ClipboardList,
  FileWarning,
  Home,
  Target,
  Users,
  Wrench,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { operationsApi, type ActionCenter, type ActionItem, type ActionKind } from "@/lib/api/clients/operations"
import { getDashboardPath, type UserRole } from "@/lib/auth-utils"
import { useAuth } from "@/lib/auth-context"
import { formatUSD } from "@/lib/us-format"
import { cn } from "@/lib/utils"

const KIND_ICON: Record<ActionKind, typeof Wrench> = {
  emergency_maintenance: AlertTriangle,
  overdue_maintenance: Wrench,
  open_maintenance: Wrench,
  outstanding_rent: FileWarning,
  expiring_leases: CalendarClock,
  upcoming_move_ins: Home,
  upcoming_move_outs: Home,
  pending_applications: ClipboardList,
  new_leads: Target,
  overdue_tasks: ClipboardList,
  vacancy: Users,
}

function hrefFor(kind: ActionKind, role: UserRole): string {
  const base = getDashboardPath(role)
  switch (kind) {
    case "emergency_maintenance":
    case "overdue_maintenance":
    case "open_maintenance":
      return `${base}/maintenance`
    case "outstanding_rent":
      return `${base}/payments`
    case "expiring_leases":
    case "upcoming_move_ins":
    case "upcoming_move_outs":
      return role === "owner" ? `${base}/occupancy` : `${base}/tenants`
    case "pending_applications":
    case "new_leads":
      return `${base}/leasing`
    case "overdue_tasks":
      return `${base}/tasks`
    case "vacancy":
      return `${base}/properties`
    default: {
      const _exhaustive: never = kind
      return `${base}${_exhaustive}`
    }
  }
}

function severityVariant(severity: ActionItem["severity"]): "destructive" | "default" | "secondary" {
  if (severity === "high") return "destructive"
  if (severity === "medium") return "default"
  return "secondary"
}

export function OperationsActionCenter() {
  const { user } = useAuth()
  const [data, setData] = useState<ActionCenter | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    operationsApi
      .getActionCenter()
      .then((center) => {
        if (!cancelled) {
          setData(center)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load operations")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>Live queue from rent, leases, maintenance, and applications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data || !user) return null

  const health = [
    { label: "Occupancy", value: `${data.portfolio.occupancyRate}%` },
    { label: "Rent collected MTD", value: formatUSD(data.today.rentCollectedCents / 100) },
    { label: "Outstanding rent", value: formatUSD(data.today.outstandingRentCents / 100) },
    { label: "Open maintenance", value: String(data.portfolio.openMaintenance) },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>
          Work that moves the portfolio today — not a gallery of charts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {health.map((item) => (
            <div key={item.label} className="rounded-md border border-border bg-muted/40 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-base font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        {data.actions.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="Nothing waiting on you"
            description="Rent, maintenance, leases, and applications are current for this portfolio."
          />
        ) : (
          <ul className="space-y-2">
            {data.actions.map((item) => {
              const Icon = KIND_ICON[item.kind]
              const href = hrefFor(item.kind, user.role)
              return (
                <li key={item.id}>
                  <Link
                    to={href}
                    className={cn(
                      "flex items-start gap-3 rounded-md border border-border px-3 py-3 transition-colors",
                      "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <Badge variant={severityVariant(item.severity)}>{item.severity}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
