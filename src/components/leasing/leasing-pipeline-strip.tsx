import { Link } from "react-router-dom"
import { GitBranch } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardPath } from "@/lib/auth-utils"
import { useAuth } from "@/lib/auth-context"
import { useLeasingPipeline } from "@/hooks/useLeasingPipeline"
import { cn } from "@/lib/utils"

export function LeasingPipelineStrip() {
  const { user } = useAuth()
  const { data, error, loading } = useLeasingPipeline()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leasing track</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leasing track</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error ?? "Leasing track is unavailable."}</p>
        </CardContent>
      </Card>
    )
  }

  const href = `${getDashboardPath(user.role)}/leasing`
  const inFlight = data.stages
    .filter((stage) => stage.id !== "occupied")
    .reduce((sum, stage) => sum + stage.count, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Leasing track</CardTitle>
          <CardDescription>
            {inFlight === 0
              ? "No open inquiries, applications, or unsigned leases."
              : `${inFlight} open ${inFlight === 1 ? "item" : "items"} from inquiry through move-in.`}
          </CardDescription>
        </div>
        <Link
          to={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          Open board
          <GitBranch className="h-4 w-4" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent>
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {data.stages.map((stage, index) => (
            <li key={stage.id} className="min-w-[4.5rem] flex-1">
              <Link
                to={href}
                className={cn(
                  "block rounded-md border border-border px-2 py-2 text-center hover:bg-muted/60",
                  stage.count > 0 && "border-orange-500/40",
                )}
              >
                <p className="font-mono text-[10px] uppercase tracking-wide text-orange-600">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{stage.label}</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{stage.count}</p>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
