import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Home, CalendarClock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiGet } from "@/lib/api/http"

interface SuggestedRent {
  currentRent: number
  suggestedRent: number
  comparablesCount: number
  percentile: number
  confidence: string
}

interface VacancyCost {
  dailyCost: number
  monthlyLoss: number
  avgDaysVacant: number
  annualizedCost: number
}

interface RenewalRecommendation {
  recommendation: "renew" | "increase" | "decrease" | "let_expire"
  suggestedNewRent: number
  reasoning: string
  retentionProbability: number
}

interface RentPricingPanelProps {
  propertyId: string
}

function fmt(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function RentPricingPanel({ propertyId }: RentPricingPanelProps) {
  const { toast } = useToast()
  const [pricing, setPricing] = useState<SuggestedRent | null>(null)
  const [vacancy, setVacancy] = useState<VacancyCost | null>(null)
  const [renewal, setRenewal] = useState<RenewalRecommendation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!propertyId) return
    loadAll()
  }, [propertyId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [p, v, r] = await Promise.all([
        apiGet<SuggestedRent>(`/pricing/suggested/${propertyId}`),
        apiGet<VacancyCost>(`/pricing/vacancy-cost/${propertyId}`),
        apiGet<RenewalRecommendation>(`/pricing/renewal/${propertyId}`),
      ])
      setPricing(p)
      setVacancy(v)
      setRenewal(r)
    } catch {
      toast({ title: "Failed to load pricing data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
        <Skeleton className="h-40" />
      </div>
    )
  }

  const rentDiff = pricing ? pricing.suggestedRent - pricing.currentRent : 0
  const rentUp = rentDiff > 0

  const recommendationLabel: Record<string, string> = {
    renew: "Renew at Current",
    increase: "Renew with Increase",
    decrease: "Renew with Decrease",
    let_expire: "Let Expire",
  }

  const recommendationColor: Record<string, string> = {
    renew: "bg-green-100 text-green-800",
    increase: "bg-blue-100 text-blue-800",
    decrease: "bg-yellow-100 text-yellow-800",
    let_expire: "bg-red-100 text-red-800",
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Rent Pricing</h2>

      {/* Suggested rent vs current */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Rent</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pricing ? fmt(pricing.currentRent) : "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suggested Rent</CardTitle>
            {rentUp ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pricing ? fmt(pricing.suggestedRent) : "—"}</div>
            {pricing && (
              <p className={`text-xs ${rentUp ? "text-green-600" : "text-red-600"}`}>
                {rentUp ? "+" : ""}{fmt(rentDiff)} ({rentUp ? "+" : ""}{((rentDiff / (pricing.currentRent || 1)) * 100).toFixed(1)}%)
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparables + Percentile */}
      {pricing && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comparables</CardTitle>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pricing.comparablesCount}</div>
              <p className="text-xs text-muted-foreground">properties analyzed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Market Percentile</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pricing.percentile}th</div>
              <p className="text-xs text-muted-foreground">Confidence: {pricing.confidence}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vacancy cost */}
      {vacancy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-4 w-4" /> Vacancy Cost Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Daily Cost</p>
                <p className="text-lg font-semibold text-red-600">{fmt(vacancy.dailyCost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Days Vacant</p>
                <p className="text-lg font-semibold">{vacancy.avgDaysVacant}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annualized Loss</p>
                <p className="text-lg font-semibold text-red-600">{fmt(vacancy.annualizedCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Renewal recommendation */}
      {renewal && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" /> Renewal Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className={recommendationColor[renewal.recommendation] ?? ""}>
                {recommendationLabel[renewal.recommendation] ?? renewal.recommendation}
              </Badge>
              {renewal.suggestedNewRent > 0 && (
                <span className="text-sm font-medium">→ {fmt(renewal.suggestedNewRent)}/mo</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{renewal.reasoning}</p>
            <p className="text-xs text-muted-foreground">
              Retention probability: <span className="font-medium">{(renewal.retentionProbability * 100).toFixed(0)}%</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
