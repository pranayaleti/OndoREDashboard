import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Landmark, Loader2 } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const PLAID_LINK_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js"

interface PlaidHandler {
  open: () => void
  exit: () => void
  destroy: () => void
}

interface PlaidLinkSuccessMetadata {
  accounts?: Array<{ id?: string; name?: string }>
}

interface PlaidCreateConfig {
  token: string
  onSuccess: (publicToken: string, metadata: PlaidLinkSuccessMetadata) => void
  onExit?: (err: unknown, metadata: unknown) => void
  onEvent?: (eventName: string, metadata: unknown) => void
}

declare global {
  interface Window {
    Plaid?: { create: (config: PlaidCreateConfig) => PlaidHandler }
  }
}

let plaidScriptPromise: Promise<void> | null = null

function loadPlaidScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"))
  if (window.Plaid) return Promise.resolve()
  if (plaidScriptPromise) return plaidScriptPromise
  plaidScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PLAID_LINK_SRC}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("Failed to load Plaid Link")))
      return
    }
    const s = document.createElement("script")
    s.src = PLAID_LINK_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Failed to load Plaid Link"))
    document.body.appendChild(s)
  })
  return plaidScriptPromise
}

interface PlaidLinkButtonProps {
  onSuccess?: (linkedBankName: string, last4: string) => void
}

/**
 * Plaid Link entry point. Lazy-loads the Plaid CDN script on first click — keeps
 * the bundle size unchanged. If the backend reports Plaid not configured (no
 * PLAID_CLIENT_ID/SECRET), the button hides itself silently so tenants don't
 * see a broken control.
 */
export function PlaidLinkButton({ onSuccess }: PlaidLinkButtonProps) {
  const { toast } = useToast()
  const [available, setAvailable] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const handlerRef = useRef<PlaidHandler | null>(null)

  useEffect(() => {
    let cancelled = false
    featureApi.plaid
      .configured()
      .then((r) => !cancelled && setAvailable(Boolean(r.configured)))
      .catch(() => !cancelled && setAvailable(false))
    return () => {
      cancelled = true
    }
  }, [])

  const linkBank = useCallback(async () => {
    setLoading(true)
    try {
      await loadPlaidScript()
      if (!window.Plaid) throw new Error("Plaid script loaded but Plaid global missing")
      const tokenResp = await featureApi.plaid.createLinkToken()
      const handler = window.Plaid.create({
        token: tokenResp.linkToken,
        onSuccess: async (publicToken, metadata) => {
          try {
            const exchanged = await featureApi.plaid.exchangePublicToken({
              publicToken,
              selectedAccountId: metadata.accounts?.[0]?.id,
            })
            toast({
              title: "Bank linked",
              description: `${exchanged.data.bankName} ••${exchanged.data.last4}`,
            })
            onSuccess?.(exchanged.data.bankName, exchanged.data.last4)
          } catch (err) {
            toast({
              variant: "destructive",
              title: "Couldn't link bank",
              description: err instanceof Error ? err.message : "Try again",
            })
          }
        },
        onExit: (err) => {
          if (err) {
            toast({
              variant: "destructive",
              title: "Plaid Link cancelled",
              description: typeof err === "object" && err && "display_message" in err
                ? String((err as Record<string, unknown>).display_message)
                : "",
            })
          }
        },
      })
      handlerRef.current = handler
      handler.open()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Plaid unavailable",
        description: err instanceof Error ? err.message : "Try the card flow instead",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, onSuccess])

  useEffect(() => {
    return () => {
      handlerRef.current?.destroy()
    }
  }, [])

  if (available === false) return null

  return (
    <Button type="button" variant="outline" onClick={linkBank} disabled={loading || available === null}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Landmark className="mr-2 h-4 w-4" />}
      Link bank with Plaid
    </Button>
  )
}
