import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Banknote, ExternalLink } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "react-router-dom"

type ConnectStatus = Awaited<ReturnType<typeof featureApi.connect.getStatus>>

/**
 * Owner Stripe Connect onboarding CTA — Express account + Account Link.
 * Rent settles on the platform; owner share is Transferred after payment succeeds.
 */
export function OwnerConnectPayouts() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<ConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const handledConnectFlag = useRef<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await featureApi.connect.getStatus()
      setStatus(data)
      return data
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Try again later"
      setLoadError(msg)
      setStatus(null)
      toast({
        title: "Could not load payout status",
        description: msg,
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const flag = searchParams.get("connect")
    if (!flag || (flag !== "return" && flag !== "refresh")) return
    if (handledConnectFlag.current === flag) return
    handledConnectFlag.current = flag

    const clearFlag = () => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.delete("connect")
          return p
        },
        { replace: true },
      )
    }

    const run = async () => {
      if (flag === "refresh") {
        clearFlag()
        setBusy(true)
        try {
          const { url } = await featureApi.connect.createOnboardingLink()
          window.location.assign(url)
        } catch (e) {
          toast({
            title: "Could not resume Connect onboarding",
            description: e instanceof Error ? e.message : "Try again later",
            variant: "destructive",
          })
          setBusy(false)
        }
        return
      }

      // connect=return — short poll until payoutsReady or attempts exhausted
      clearFlag()
      toast({
        title: "Connect onboarding",
        description: "Refreshing your payout account status…",
      })
      let ready = false
      for (let i = 0; i < 5; i++) {
        const data = await load()
        if (data?.payoutsReady) {
          ready = true
          break
        }
        await new Promise((r) => setTimeout(r, 1500))
      }
      if (ready) {
        toast({
          title: "Payouts ready",
          description: "Your Stripe Express account can receive rent transfers.",
        })
      }
    }

    void run()
  }, [searchParams, setSearchParams, load, toast])

  const startOnboarding = async () => {
    setBusy(true)
    try {
      const { url } = await featureApi.connect.createOnboardingLink()
      window.location.assign(url)
    } catch (e) {
      toast({
        title: "Could not start Connect onboarding",
        description: e instanceof Error ? e.message : "Try again later",
        variant: "destructive",
      })
      setBusy(false)
    }
  }

  const openExpressDashboard = async () => {
    setBusy(true)
    try {
      const { url } = await featureApi.connect.createLoginLink()
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      toast({
        title: "Could not open Express Dashboard",
        description: e instanceof Error ? e.message : "Finish onboarding first",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Banknote className="h-5 w-5 text-orange-600" aria-hidden />
          Rent payouts
        </CardTitle>
        <CardDescription>
          Connect a Stripe Express account to receive your share of tenant rent after each successful
          payment. Ondo retains the platform management fee and transfers the rest.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading payout account…
          </div>
        ) : loadError || !status ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive" role="alert">
              {loadError || "Could not load payout status."}
            </p>
            <Button type="button" variant="outline" onClick={() => void load()} disabled={busy}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {!status.connected && <Badge variant="secondary">Not connected</Badge>}
              {status.connected && !status.payoutsReady && (
                <Badge variant="outline">Onboarding incomplete</Badge>
              )}
              {status.payoutsReady && <Badge className="bg-emerald-600 hover:bg-emerald-600">Ready for payouts</Badge>}
              {status.requirementsDueCount > 0 && (
                <Badge variant="destructive">{status.requirementsDueCount} requirements due</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {!status.payoutsReady ? (
                <Button type="button" onClick={startOnboarding} disabled={busy}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {status.connected ? "Continue Connect setup" : "Set up payouts with Stripe"}
                </Button>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={openExpressDashboard} disabled={busy}>
                    <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
                    Open Express Dashboard
                  </Button>
                  <Button type="button" variant="ghost" onClick={startOnboarding} disabled={busy}>
                    Update account details
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
