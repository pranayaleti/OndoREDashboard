import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  RefreshCw, Loader2, ChevronRight, TrendingUp, AlertTriangle, CheckCircle2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiGet } from "@/lib/api/http"

interface PropertyScore {
  propertyId: string
  propertyName: string
  address: string
  score: number
  lastUpdated: string
}

interface QualityInsight {
  area: string
  score: number
  recommendation: string
}

function scoreColor(score: number): string {
  if (score < 40) return "text-red-600"
  if (score <= 70) return "text-yellow-600"
  return "text-green-600"
}

function scoreProgressColor(score: number): string {
  if (score < 40) return "[&>div]:bg-red-500"
  if (score <= 70) return "[&>div]:bg-yellow-500"
  return "[&>div]:bg-green-500"
}

function scoreBadge(score: number) {
  if (score < 40) return <Badge variant="destructive">Poor</Badge>
  if (score <= 70) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>
  return <Badge className="bg-green-100 text-green-800">Good</Badge>
}

export function QualityDashboard() {
  const { toast } = useToast()
  const [properties, setProperties] = useState<PropertyScore[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [insights, setInsights] = useState<QualityInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await apiGet<{ properties: PropertyScore[] }>("/quality/portfolio")
      setProperties(data.properties ?? [])
    } catch {
      toast({ title: "Failed to load quality scores", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
    toast({ title: "Scores refreshed" })
  }

  const selectProperty = async (id: string) => {
    setSelectedId(id)
    setInsightsLoading(true)
    try {
      const data = await apiGet<{ insights: QualityInsight[] }>(`/quality/property/${id}/insights`)
      setInsights(data.insights ?? [])
    } catch {
      setInsights([])
      toast({ title: "Failed to load insights", variant: "destructive" })
    } finally {
      setInsightsLoading(false)
    }
  }

  const avgScore = properties.length
    ? Math.round(properties.reduce((s, p) => s + p.score, 0) / properties.length)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Property Quality</h2>
          <p className="text-sm text-muted-foreground">Portfolio average: <span className={`font-semibold ${scoreColor(avgScore)}`}>{avgScore}</span>/100</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh Scores
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Property list */}
        <div className="space-y-3 lg:col-span-2">
          {properties.map((p) => (
            <button
              type="button"
              key={p.propertyId}
              onClick={() => selectProperty(p.propertyId)}
              className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent ${
                selectedId === p.propertyId ? "border-primary bg-accent" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.propertyName}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.address}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xl font-bold ${scoreColor(p.score)}`}>{p.score}</span>
                  {scoreBadge(p.score)}
                </div>
              </div>
              <Progress value={p.score} className={`mt-2 h-1.5 ${scoreProgressColor(p.score)}`} />
            </button>
          ))}
          {properties.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No properties found.</p>
          )}
        </div>

        {/* Insights panel */}
        <div className="lg:col-span-3">
          {selectedId ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Improvement Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : insights.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
                    <p className="text-sm">No improvement areas — this property is in great shape!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight, i) => (
                      <div key={i} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {insight.score < 40 ? (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            ) : (
                              <TrendingUp className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="font-medium">{insight.area}</span>
                          </div>
                          <span className={`text-sm font-semibold ${scoreColor(insight.score)}`}>
                            {insight.score}/100
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{insight.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
              <ChevronRight className="mb-2 h-8 w-8" />
              <p className="text-sm">Select a property to view insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
