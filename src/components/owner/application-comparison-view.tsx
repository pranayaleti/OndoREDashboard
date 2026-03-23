import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GitCompareArrows, X } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ComparisonApp {
  id: string
  firstName: string
  lastName: string
  email: string
  annualIncome: number | null
  employer: string | null
  status: string
  recommendationScore: number | null
  scoreBreakdown: Record<string, { earned: number; max: number }> | null
}

interface ApplicationComparisonViewProps {
  propertyId: string
  applicationIds: string[]
  onBack: () => void
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-400"
  if (score >= 80) return "text-emerald-600"
  if (score >= 60) return "text-amber-600"
  return "text-red-600"
}

export function ApplicationComparisonView({
  propertyId,
  applicationIds,
  onBack,
}: ApplicationComparisonViewProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState<ComparisonApp[]>([])

  useEffect(() => {
    featureApi.applicationActions
      .compare(propertyId, applicationIds)
      .then((data) => {
        setApps(data as ComparisonApp[])
        setLoading(false)
      })
      .catch(() => {
        toast({ title: "Failed to load comparison", variant: "destructive" })
        setLoading(false)
      })
  }, [propertyId, applicationIds])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Collect all breakdown keys across all apps
  const allBreakdownKeys = new Set<string>()
  apps.forEach((app) => {
    if (app.scoreBreakdown) {
      Object.keys(app.scoreBreakdown).forEach((k) => allBreakdownKeys.add(k))
    }
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-purple-500" />
            Application Comparison
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onBack}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Criteria</TableHead>
                {apps.map((app) => (
                  <TableHead key={app.id} className="text-center min-w-[140px]">
                    {app.firstName} {app.lastName}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Status</TableCell>
                {apps.map((app) => (
                  <TableCell key={app.id} className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Overall Score</TableCell>
                {apps.map((app) => (
                  <TableCell key={app.id} className="text-center">
                    <span className={`text-lg font-bold ${scoreColor(app.recommendationScore)}`}>
                      {app.recommendationScore ?? "—"}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Annual Income</TableCell>
                {apps.map((app) => (
                  <TableCell key={app.id} className="text-center">
                    {app.annualIncome ? `$${app.annualIncome.toLocaleString()}` : "—"}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Employer</TableCell>
                {apps.map((app) => (
                  <TableCell key={app.id} className="text-center text-sm">
                    {app.employer || "—"}
                  </TableCell>
                ))}
              </TableRow>
              {/* Score breakdown rows */}
              {Array.from(allBreakdownKeys).map((key) => (
                <TableRow key={key}>
                  <TableCell className="font-medium capitalize text-sm">
                    {key.replace("_", " ")}
                  </TableCell>
                  {apps.map((app) => {
                    const val = app.scoreBreakdown?.[key]
                    return (
                      <TableCell key={app.id} className="text-center text-sm">
                        {val ? (
                          <span className={val.earned === val.max ? "text-emerald-600" : "text-red-500"}>
                            {val.earned}/{val.max}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
