// Ondo Rewards: the tenant loyalty hub. Points balance and tier (drawn as a
// trail up the Wasatch mural), the referral link, ways to earn, the redemption
// catalog and recent activity, on one page.
//
// Data: rewardsApi (GET /tenant/rewards books any due points first, then
// returns the overview; POST /tenant/rewards/redeem) and referralApi for the
// share link and referred friends. Server logic lives in OndoREBackend
// supabase/functions/_shared/tenant-rewards.ts.
import { useCallback, useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { CalendarCheck, Check, Copy, KeyRound, Loader2, Mail, MessageSquare, Share2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { MuralVignette, OndoMural } from "@/components/art/ondo-mural"
import {
  rewardsApi,
  type RedemptionStatus,
  type RewardCatalogItem,
  type RewardsOverview,
  type RewardTier,
} from "@/lib/api/clients/rewards"
import { referralApi, type ReferralHistoryItem, type ReferralStats } from "@/lib/api/clients/referrals"

const fmt = (n: number) => n.toLocaleString("en-US")

/** Where a redemption stands, shown next to its date. */
const REDEMPTION_STATUS_LABEL: Record<RedemptionStatus, string> = {
  pending: "Waiting for Ondo",
  fulfilled: "Done",
  cancelled: "Cancelled, points returned",
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback
}

export default function TenantRewards() {
  const { toast } = useToast()
  const [overview, setOverview] = useState<RewardsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOverview(await rewardsApi.getOverview())
    } catch (err) {
      setError(errorMessage(err, "Rewards didn't load."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Old referral links arrive as /tenant/rewards#refer; scroll there once the page has content.
  const { hash } = useLocation()
  useEffect(() => {
    if (!loading && hash === "#refer") document.getElementById("refer")?.scrollIntoView({ block: "start" })
  }, [loading, hash])

  const redeem = async (item: RewardCatalogItem) => {
    setRedeemingId(item.id)
    try {
      const result = await rewardsApi.redeem(item.id)
      setOverview(result.overview)
      toast({
        title: `Redeemed: ${item.title}`,
        description:
          item.kind === "redeemed_credit"
            ? "Ondo will apply it to an upcoming rent charge."
            : "Ondo will contact you to book it.",
      })
    } catch (err) {
      toast({ title: "Couldn't redeem", description: errorMessage(err, "Try again in a moment."), variant: "destructive" })
    } finally {
      setRedeemingId(null)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="max-w-2xl space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Rewards</h1>
        <p className="text-muted-foreground">
          Earn points for paying rent on time, renewing your lease and bringing friends to Ondo. Spend them on rent
          credits and home services.
        </p>
      </header>

      {loading ? (
        <RewardsSkeleton />
      ) : error || !overview ? (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6">
          <p className="font-medium">Rewards didn't load.</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <BalanceHero overview={overview} />
          <TierLadder overview={overview} />
          <div className="grid gap-6 lg:grid-cols-5">
            <ReferFriend
              referralPoints={overview.earnRates.referral}
              friendBonus={overview.earnRates.friendBonus}
              className="lg:col-span-3"
            />
            <WaysToEarn overview={overview} className="lg:col-span-2" />
          </div>
          <Catalog overview={overview} redeemingId={redeemingId} onRedeem={redeem} />
          <Activity overview={overview} />
          <p className="max-w-3xl text-xs text-muted-foreground">
            Points have no cash value and can't be transferred. Rent credits apply to rent on your current Ondo home.
            Rent due before {formatDay(`${overview.earningStartsOn}T12:00:00`)} doesn't earn points. Ondo may change
            rewards with notice.
          </p>
        </>
      )}
    </div>
  )
}

function RewardsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading rewards">
      <Skeleton className="h-[300px] w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-xl lg:col-span-3" />
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
      </div>
    </div>
  )
}

function BalanceHero({ overview }: { overview: RewardsOverview }) {
  const { available, tier, nextTier, pointsToNextTier, trailProgress } = overview
  return (
    <section aria-labelledby="rewards-balance" className="overflow-hidden rounded-2xl border bg-card">
      <div className="relative sm:min-h-[340px] lg:min-h-[380px]">
        <div className="relative z-10 p-6 sm:max-w-[24rem] sm:p-8">
          <h2 id="rewards-balance" className="text-sm font-medium text-foreground/80">
            Your points
          </h2>
          <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">{fmt(available)}</p>
          <p className="mt-4 font-semibold">{tier.name} member</p>
          <p className="text-sm text-foreground/80">
            {nextTier && pointsToNextTier !== null
              ? `${fmt(pointsToNextTier)} more points to reach ${nextTier.name}`
              : "You've reached the summit: Platinum is the top tier."}
          </p>
          <div
            role="progressbar"
            aria-label={nextTier ? `Progress to ${nextTier.name}` : "Tier progress"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(trailProgress * 100)}
            className="sr-only"
          />
        </div>
        <div className="aspect-[12/5] sm:absolute sm:inset-0 sm:aspect-auto">
          <OndoMural scene="trail" progress={trailProgress} />
        </div>
      </div>
    </section>
  )
}

function rentPointsAt(overview: RewardsOverview, t: RewardTier) {
  return Math.round(overview.earnRates.baseOnTimeRent * t.rentMultiplier)
}

function TierLadder({ overview }: { overview: RewardsOverview }) {
  return (
    <section aria-labelledby="rewards-tiers">
      <h2 id="rewards-tiers" className="sr-only">
        Tiers
      </h2>
      <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {overview.tiers.map((t) => {
          const current = t.id === overview.tier.id
          const reached = overview.lifetime >= t.minPoints
          return (
            <li
              key={t.id}
              aria-current={current ? "step" : undefined}
              className={cn("bg-card p-4", current && "shadow-[inset_0_3px_0_hsl(var(--primary))]")}
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-3 w-3 rounded-full border-2",
                    reached ? "border-primary bg-primary" : "border-muted-foreground/40",
                  )}
                />
                <span className="font-semibold">{t.name}</span>
                {current && <span className="text-xs font-medium text-primary">You're here</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.minPoints === 0 ? "Where everyone starts" : `From ${fmt(t.minPoints)} lifetime points`}
              </p>
              <p className="mt-1 text-sm">{fmt(rentPointsAt(overview, t))} points per on-time rent</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const SHARE_TEXT = "I rent my home from Ondo Real Estate. If you're looking for a place in Utah, take a look:"

function friendStatus(status: ReferralHistoryItem["status"]) {
  if (status === "converted") return "Signed a lease"
  if (status === "signed_up") return "Created an account"
  return "Opened your link"
}

function maskEmail(email: string | null) {
  if (!email) return "A friend"
  const [local, domain] = email.split("@")
  return domain ? `${local[0]}***@${domain}` : "A friend"
}

function ReferFriend({
  referralPoints,
  friendBonus,
  className,
}: {
  referralPoints: number
  friendBonus: number
  className?: string
}) {
  const { toast } = useToast()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [friends, setFriends] = useState<ReferralHistoryItem[]>([])
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setFailed(false)
    try {
      const [s, h] = await Promise.all([referralApi.getStats(), referralApi.getHistory(1, 50)])
      setStats(s)
      setFriends(h.referrals ?? [])
    } catch {
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const url = stats?.shareUrl ?? ""
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function"
  const signedUp = friends.filter((f) => f.status !== "clicked").length
  const leased = friends.filter((f) => f.status === "converted").length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Couldn't copy", description: "Select the link in the box and copy it." })
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title: "Rent with Ondo", text: SHARE_TEXT, url })
    } catch {
      // Closing the share sheet rejects; nothing to report.
    }
  }

  return (
    <section id="refer" aria-labelledby="rewards-refer" className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <div className="aspect-[12/3.6]">
        <OndoMural scene="neighbors" />
      </div>
      <div className="space-y-4 p-6">
        <div className="space-y-1">
          <h2 id="rewards-refer" className="text-xl font-semibold">
            Refer a friend
          </h2>
          <p className="text-sm text-muted-foreground">
            Know someone looking for a place to rent? Send them your link, or give them your code to type on their
            rental application. When they sign a lease on an Ondo home, you get {fmt(referralPoints)} points and they
            get a {fmt(friendBonus)}-point welcome bonus.
          </p>
        </div>

        {failed ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm">
            <span>Your referral link didn't load.</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        ) : !stats ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                readOnly
                value={url}
                aria-label="Your referral link"
                className="font-mono text-sm"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button onClick={() => void copy()} className="shrink-0">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
            {stats.code && (
              <p className="text-sm text-muted-foreground">
                Your code: <span className="font-mono font-semibold text-foreground">{stats.code}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {canShare && (
                <Button variant="outline" size="sm" onClick={() => void share()}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <a href={`sms:?&body=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Text it
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`mailto:?subject=${encodeURIComponent("A place to rent in Utah")}&body=${encodeURIComponent(
                    `${SHARE_TEXT}\n\n${url}`,
                  )}`}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email it
                </a>
              </Button>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium">
                {friends.length === 0
                  ? "No friends have used your link yet."
                  : `${signedUp} ${signedUp === 1 ? "friend has" : "friends have"} created an account. ${leased} signed a lease.`}
              </p>
              {friends.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">
                  {friends.slice(0, 5).map((f) => (
                    <li key={f.id} className="flex justify-between gap-4">
                      <span className={cn("truncate text-muted-foreground", f.referredEmail && "font-mono")}>
                        {maskEmail(f.referredEmail)}
                      </span>
                      <span className={cn(f.status === "converted" && "font-medium text-primary")}>
                        {friendStatus(f.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function WaysToEarn({ overview, className }: { overview: RewardsOverview; className?: string }) {
  const { earnRates, tier } = overview
  const bonus = earnRates.onTimeRent > earnRates.baseOnTimeRent
  const rows = [
    {
      icon: CalendarCheck,
      label: "Pay rent on time",
      detail: bonus ? `Each month, with your ${tier.name} bonus` : "Each month, paid by the due date",
      points: earnRates.onTimeRent,
    },
    { icon: KeyRound, label: "Renew your lease", detail: "When you sign the renewal", points: earnRates.renewal },
    {
      icon: Users,
      label: "Refer a friend",
      detail: "When they sign a lease on an Ondo home",
      points: earnRates.referral,
    },
  ]
  return (
    <section aria-labelledby="rewards-earn" className={cn("self-start rounded-xl border bg-card p-6", className)}>
      <h2 id="rewards-earn" className="text-xl font-semibold">
        Ways to earn
      </h2>
      <ul className="mt-4 divide-y">
        {rows.map(({ icon: Icon, label, detail, points }) => (
          <li key={label} className="flex items-center gap-4 py-3">
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{label}</p>
              <p className="text-sm text-muted-foreground">{detail}</p>
            </div>
            <span className="shrink-0 font-semibold tabular-nums">+{fmt(points)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Catalog({
  overview,
  redeemingId,
  onRedeem,
}: {
  overview: RewardsOverview
  redeemingId: string | null
  onRedeem: (item: RewardCatalogItem) => Promise<void>
}) {
  const { available, canRedeem } = overview
  return (
    <section aria-labelledby="rewards-spend" className="space-y-3">
      <div>
        <h2 id="rewards-spend" className="text-xl font-semibold">
          Spend your points
        </h2>
        {!canRedeem && (
          <p className="text-sm text-muted-foreground">
            Redeeming opens when you have a current lease at an Ondo home.
          </p>
        )}
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {overview.catalog.map((item) => {
          const short = item.points - available
          const disabled = !canRedeem || short > 0 || redeemingId !== null
          return (
            <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <div className="flex items-center gap-4 sm:justify-end">
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{fmt(item.points)} points</p>
                  {short > 0 && <p className="text-xs text-muted-foreground">{fmt(short)} more needed</p>}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={disabled} aria-label={`Redeem ${item.title}`}>
                      {redeemingId === item.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Redeem
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Redeem {fmt(item.points)} points for {item.title}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {item.kind === "redeemed_credit"
                          ? "Ondo applies the credit to an upcoming rent charge."
                          : "Ondo will contact you to book a time."}{" "}
                        You'll have {fmt(available - item.points)} points left.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void onRedeem(item)}>Redeem</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Activity({ overview }: { overview: RewardsOverview }) {
  const items = overview.recentActivity
  return (
    <section aria-labelledby="rewards-activity" className="space-y-3">
      <h2 id="rewards-activity" className="text-xl font-semibold">
        Recent activity
      </h2>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center">
          <MuralVignette />
          <p className="max-w-sm text-sm text-muted-foreground">
            No points yet. Pay your next rent on time to earn your first {fmt(overview.earnRates.onTimeRent)} points.
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.description}</p>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {formatDay(a.createdAt)}
                  {a.status && (
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5",
                        a.status === "pending" && "border-primary/40 text-foreground",
                      )}
                    >
                      {REDEMPTION_STATUS_LABEL[a.status]}
                    </span>
                  )}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 font-semibold tabular-nums",
                  a.points < 0 ? "text-muted-foreground" : "text-foreground",
                  a.status === "cancelled" && "line-through",
                )}
              >
                {a.points < 0 ? `−${fmt(-a.points)}` : `+${fmt(a.points)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
