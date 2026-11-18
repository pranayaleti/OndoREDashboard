// Owner and manager queue for Ondo Rewards redemptions. Tenants redeem points
// for rent credits and services; each request waits here until someone applies
// it and marks it done, or cancels it (which returns the tenant's points).
// Scoped server-side to the caller's properties (GET /rewards/redemptions).
import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
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
import { MuralVignette } from "@/components/art/ondo-mural"
import { rewardsApi, type RedemptionRequest, type RedemptionStatus } from "@/lib/api/clients/rewards"

const fmt = (n: number) => n.toLocaleString("en-US")
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

const TABS: { status: RedemptionStatus; label: string; empty: string }[] = [
  {
    status: "pending",
    label: "Waiting",
    empty: "Nothing to do. When a tenant redeems points, the request shows up here.",
  },
  { status: "fulfilled", label: "Done", empty: "No redemptions marked done yet." },
  { status: "cancelled", label: "Cancelled", empty: "No cancelled redemptions." },
]

function nextStep(r: RedemptionRequest) {
  return r.kind === "redeemed_credit"
    ? `Apply ${r.title.replace(/ off rent$/, "")} to an upcoming rent charge, then mark it done.`
    : "Contact the tenant to book it, then mark it done."
}

export default function RewardRedemptions() {
  const { toast } = useToast()
  const [tab, setTab] = useState<RedemptionStatus>("pending")
  const [rows, setRows] = useState<RedemptionRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const load = useCallback(async (status: RedemptionStatus) => {
    setRows(null)
    setError(null)
    try {
      setRows(await rewardsApi.listRedemptions(status))
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Redemptions didn't load.")
    }
  }, [])

  useEffect(() => {
    void load(tab)
  }, [load, tab])

  const act = async (r: RedemptionRequest, action: "fulfil" | "cancel") => {
    setBusyId(r.id)
    try {
      if (action === "fulfil") {
        await rewardsApi.fulfilRedemption(r.id)
        toast({ title: "Marked done", description: `${r.tenantName} has been told.` })
      } else {
        await rewardsApi.cancelRedemption(r.id, note.trim() || undefined)
        toast({ title: "Cancelled", description: `${fmt(r.points)} points went back to ${r.tenantName}.` })
      }
      setRows((current) => current?.filter((x) => x.id !== r.id) ?? null)
    } catch (err) {
      toast({
        title: action === "fulfil" ? "Couldn't mark it done" : "Couldn't cancel",
        description: err instanceof Error ? err.message : "Try again in a moment.",
        variant: "destructive",
      })
      void load(tab)
    } finally {
      setBusyId(null)
      setNote("")
    }
  }

  const current = TABS.find((t) => t.status === tab)!

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="max-w-2xl space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Tenant rewards</h1>
        <p className="text-muted-foreground">
          Tenants spend Ondo Rewards points on rent credits and home services. Apply each request, then mark it done
          so the tenant knows. Cancelling returns their points.
        </p>
      </header>

      <div role="tablist" aria-label="Redemption status" className="inline-flex rounded-lg border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.status}
            role="tab"
            type="button"
            aria-selected={tab === t.status}
            onClick={() => setTab(t.status)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              tab === t.status ? "bg-foreground/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section role="tabpanel" aria-label={current.label}>
        {error ? (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-card p-6">
            <p className="font-medium">Redemptions didn't load.</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void load(tab)}>
              Try again
            </Button>
          </div>
        ) : rows === null ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading redemptions">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center">
            <MuralVignette />
            <p className="max-w-sm text-sm text-muted-foreground">{current.empty}</p>
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-semibold">
                    {r.title} <span className="font-normal text-muted-foreground">for {fmt(r.points)} points</span>
                  </p>
                  <p className="text-sm">
                    {r.tenantName}, {r.propertyLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Requested {day(r.requestedAt)}
                    {r.fulfilledAt && `. ${r.status === "fulfilled" ? "Done" : "Cancelled"} ${day(r.fulfilledAt)}.`}
                  </p>
                  {r.status === "pending" && <p className="text-sm">{nextStep(r)}</p>}
                  {r.note && <p className="text-sm text-muted-foreground">Note: {r.note}</p>}
                </div>
                {r.status === "pending" && (
                  <div className="flex shrink-0 gap-2">
                    {/* Outline, not solid orange: a queue repeats this action on every row. */}
                    <Button
                      variant="outline"
                      onClick={() => void act(r, "fulfil")}
                      disabled={busyId !== null}
                      aria-label={`Mark ${r.title} for ${r.tenantName} done`}
                    >
                      {busyId === r.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Mark done
                    </Button>
                    <AlertDialog onOpenChange={(open) => !open && setNote("")}>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" disabled={busyId !== null}>
                          Cancel and refund
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel {r.title} for {r.tenantName}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {fmt(r.points)} points go back to their balance and they get a notification.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor={`cancel-note-${r.id}`}>Note for the tenant (optional)</Label>
                          <Textarea
                            id={`cancel-note-${r.id}`}
                            value={note}
                            maxLength={500}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Say why, so they know what to do next"
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep it</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void act(r, "cancel")}>Cancel and refund</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
