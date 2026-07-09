// Tenant Rewards portal — points balance, tier progression, and redemption.
//
// Ported from OndoREui/components/tenant/rewards-card.tsx and rewired to
// Dashboard's featureApi.rewards. This is the first tenant experience surface
// wired into the Dashboard (previously only visible on the marketing site).
//
// Backend routes: GET /tenant/rewards, GET /tenant/rewards/history, POST
// /tenant/rewards/redeem — all covered by rewardService.
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { featureApi } from "@/lib/api"

interface RewardData {
  balance: number
  tier?: string
  totalEarned?: number
}

interface HistoryItem {
  id: string
  points: number
  description: string
  createdAt: string
  type: "earned" | "redeemed" | string
}

interface RewardsResponse {
  data?: RewardData
  balance?: number
  tier?: string
  totalEarned?: number
}

const TIERS = [
  { name: "Bronze", min: 0, color: "bg-orange-100 text-orange-700", next: 1000 as number | null },
  { name: "Silver", min: 1000, color: "bg-slate-200 text-slate-700", next: 5000 as number | null },
  { name: "Gold", min: 5000, color: "bg-yellow-100 text-yellow-700", next: 10000 as number | null },
  { name: "Platinum", min: 10000, color: "bg-purple-100 text-purple-700", next: null as number | null },
]

function getTier(balance: number) {
  return [...TIERS].reverse().find((t) => balance >= t.min) ?? TIERS[0]
}

function normalizeRewards(raw: unknown): RewardData | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as RewardsResponse
  const data = r.data ?? (r as RewardData)
  if (typeof data.balance !== "number") return null
  return {
    balance: data.balance,
    tier: data.tier,
    totalEarned: data.totalEarned,
  }
}

export default function TenantRewards() {
  const { toast } = useToast()
  const [rewards, setRewards] = useState<RewardData | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showRedeem, setShowRedeem] = useState(false)
  const [redeemPoints, setRedeemPoints] = useState("")
  const [redeemDesc, setRedeemDesc] = useState("")
  const [redeeming, setRedeeming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [rwRaw, histRaw] = await Promise.all([
        featureApi.rewards.getTenantRewards(),
        featureApi.rewards.history(),
      ])
      setRewards(normalizeRewards(rwRaw))
      setHistory(
        (Array.isArray(histRaw) ? histRaw : []).map((h) => h as HistoryItem),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rewards")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleRedeem = async () => {
    const pts = parseInt(redeemPoints, 10)
    if (!pts || pts <= 0) return
    setRedeeming(true)
    try {
      await featureApi.rewards.redeem({ points: pts, description: redeemDesc })
      toast({ title: "Redemption submitted", description: `${pts} points requested` })
      setShowRedeem(false)
      setRedeemPoints("")
      setRedeemDesc("")
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Redemption failed"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setRedeeming(false)
    }
  }

  const balance = rewards?.balance ?? 0
  const tier = getTier(balance)
  const nextTierPts = tier.next !== null ? tier.next - balance : null
  const progress = tier.next !== null
    ? Math.min(100, ((balance - tier.min) / (tier.next - tier.min)) * 100)
    : 100

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7" />
          Rewards
        </h1>
        <p className="text-muted-foreground">
          Track your points balance, tier status, and redemption history.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading rewards…
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/40">
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Points Balance
                  </p>
                  <p className="text-4xl font-bold">{balance.toLocaleString()}</p>
                </div>
                <Badge className={tier.color}>{tier.name}</Badge>
              </div>

              {nextTierPts !== null ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{tier.name}</span>
                    <span>{nextTierPts.toLocaleString()} pts to next tier</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-purple-600 font-medium">
                  You are at the highest tier!
                </p>
              )}

              <Button
                onClick={() => setShowRedeem((v) => !v)}
                className="bg-ondo-orange hover:bg-ondo-red transition-colors"
              >
                {showRedeem ? "Cancel" : "Redeem Points"}
              </Button>

              {showRedeem && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                  <div>
                    <Label htmlFor="rewards-redeem-points">Points to Redeem</Label>
                    <Input
                      id="rewards-redeem-points"
                      type="number"
                      min={1}
                      max={balance}
                      value={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.value)}
                      placeholder="Enter points"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rewards-redeem-description">Description</Label>
                    <Input
                      id="rewards-redeem-description"
                      type="text"
                      value={redeemDesc}
                      onChange={(e) => setRedeemDesc(e.target.value)}
                      placeholder="What are you redeeming for?"
                    />
                  </div>
                  <Button
                    onClick={handleRedeem}
                    disabled={redeeming || !redeemPoints}
                  >
                    {redeeming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Redeeming…
                      </>
                    ) : (
                      "Confirm Redemption"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Points History</CardTitle>
              <CardDescription>
                {history.length === 0
                  ? "You haven't earned or redeemed any points yet."
                  : `${history.length} recent transactions`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Earn points by paying rent on time, referring friends, and more.
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`font-semibold ${
                          item.type === "redeemed" ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {item.type === "redeemed" ? "-" : "+"}
                        {Math.abs(item.points).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
