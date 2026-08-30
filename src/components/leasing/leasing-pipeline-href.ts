import { getDashboardPath, type UserRole } from "@/lib/auth-utils"
import type { PipelineCard } from "@/lib/api/clients/operations"

export function hrefForPipelineCard(card: PipelineCard, role: UserRole): string {
  const base = getDashboardPath(role)

  switch (card.kind) {
    case "lead":
    case "website_lead":
      if (role === "manager") return `${base}/leads`
      if (card.propertyId) return propertyHref(role, card.propertyId, "applications")
      return `${base}/leasing`
    case "application":
      if (card.propertyId) return propertyHref(role, card.propertyId, "applications")
      return `${base}/screening`
    case "lease":
      if (card.propertyId) return propertyHref(role, card.propertyId, "leases")
      return role === "owner" ? `${base}/occupancy` : `${base}/tenants`
    default: {
      const _exhaustive: never = card.kind
      return `${base}${_exhaustive}`
    }
  }
}

function propertyHref(role: UserRole, propertyId: string, tab: "applications" | "leases"): string {
  const base = getDashboardPath(role)
  if (role === "owner" || role === "manager") {
    return `${base}/properties/${propertyId}?tab=${tab}`
  }
  return `${base}/properties/${propertyId}`
}
