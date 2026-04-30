import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Property, MaintenanceRequest } from "@/lib/api"

const STATUS_COLORS = {
  open: "#ef4444",
  in_progress: "#f59e0b",
  completed: "#10b981",
  cancelled: "#6b7280",
} as const

interface KpiChartsProps {
  properties: Property[]
  maintenanceRequests: MaintenanceRequest[]
}

interface MaintenanceLike {
  status?: string
  createdAt?: string
  created_at?: string
  resolvedAt?: string | null
  resolved_at?: string | null
  completedAt?: string | null
  completed_at?: string | null
}

function getDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isFinite(d.getTime()) ? d : null
}

function getMaintenanceTimes(req: MaintenanceLike) {
  const created = getDate(req.createdAt ?? req.created_at)
  const resolved = getDate(req.resolvedAt ?? req.resolved_at ?? req.completedAt ?? req.completed_at)
  return { created, resolved }
}

export function KpiCharts({ properties, maintenanceRequests }: KpiChartsProps) {
  const occupancyData = useMemo(() => {
    const occupied = properties.filter((p) =>
      ["leased", "occupied", "rented"].includes(((p as { status?: string }).status ?? "").toLowerCase())
    ).length
    const vacant = properties.length - occupied
    return [
      { name: "Occupied", value: occupied, color: "#10b981" },
      { name: "Vacant", value: vacant, color: "#f59e0b" },
    ]
  }, [properties])

  const maintenanceByStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of maintenanceRequests) {
      const s = ((r as MaintenanceLike).status ?? "open").toLowerCase()
      counts[s] = (counts[s] ?? 0) + 1
    }
    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? "#6366f1",
    }))
  }, [maintenanceRequests])

  const mttrTrend = useMemo(() => {
    // Bucket by ISO week of completion; report avg resolution hours.
    const buckets = new Map<string, { total: number; n: number }>()
    for (const r of maintenanceRequests) {
      const { created, resolved } = getMaintenanceTimes(r as MaintenanceLike)
      if (!created || !resolved) continue
      const hours = (resolved.getTime() - created.getTime()) / 3_600_000
      if (hours < 0) continue
      const week = `${resolved.getFullYear()}-W${Math.ceil(((resolved.getTime() - new Date(resolved.getFullYear(), 0, 1).getTime()) / 86_400_000 + 1) / 7)}`
      const b = buckets.get(week) ?? { total: 0, n: 0 }
      b.total += hours
      b.n += 1
      buckets.set(week, b)
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, b]) => ({ week, mttr: Math.round((b.total / b.n) * 10) / 10 }))
  }, [maintenanceRequests])

  const occupancyPct = properties.length
    ? Math.round((occupancyData[0]?.value ?? 0) * 100 / properties.length)
    : 0

  const openMaintenance = maintenanceByStatus.find((m) => m.status === "open")?.count ?? 0
  const totalMaintenance = maintenanceRequests.length
  const completionRate = totalMaintenance
    ? Math.round(
        ((maintenanceByStatus.find((m) => m.status === "completed")?.count ?? 0) * 100) /
          totalMaintenance
      )
    : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Occupancy</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{occupancyPct}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Open work orders</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{openMaintenance}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Maintenance completion rate</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{completionRate}%</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Occupancy mix</CardTitle></CardHeader>
          <CardContent style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {occupancyData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Maintenance by status</CardTitle></CardHeader>
          <CardContent style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tickFormatter={(s) => String(s).replace("_", " ")} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count">
                  {maintenanceByStatus.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">MTTR trend (last 12 weeks)</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 220 }}>
          {mttrTrend.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">
              Not enough resolved tickets yet to chart MTTR.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mttrTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis label={{ value: "hours", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Line type="monotone" dataKey="mttr" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
