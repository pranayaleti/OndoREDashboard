import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { organizationsApi } from "@/lib/api"
import { applyBrandColor, clearBrandColor, type OrgBranding } from "@/lib/org-branding"

/**
 * Applies the signed-in user's organization brand color (white-label) app-wide by
 * overriding the --primary design token. No-op when the user has no org or no
 * brand color set. Renders nothing; failures never break the app.
 */
export function OrgBrandingApplier() {
  const { user } = useAuth()

  useEffect(() => {
    let cancelled = false
    if (!user) {
      clearBrandColor()
      return
    }
    organizationsApi
      .list()
      .then((orgs) => {
        if (cancelled) return
        const branded = orgs.find((o) => (o.branding as OrgBranding)?.primaryColor)
        const color = branded ? (branded.branding as OrgBranding).primaryColor : undefined
        if (color) applyBrandColor(color)
        else clearBrandColor()
      })
      .catch(() => {
        /* not fatal — leave the default theme */
      })
    return () => {
      cancelled = true
    }
  }, [user])

  return null
}
