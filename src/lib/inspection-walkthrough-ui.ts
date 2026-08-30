export type WalkthroughPhase = "layout" | "checklist" | "item" | "summary" | "report"

export type RoomKind = "entry" | "living" | "kitchen" | "bath" | "bed" | "other"

export const INSPECTION_LEGAL_DISCLAIMER =
  "This report records the unit's condition as observed during the inspection. Sign to confirm its accuracy. Photos were taken on site for the inspection date. This is an operational condition record, not a legal appraisal."

export const LAYOUT_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"

const LAYOUT_MIME = new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"])

export function resolveLayoutMime(file: File): string {
  if (file.type && LAYOUT_MIME.has(file.type)) return file.type === "image/jpg" ? "image/jpeg" : file.type
  const name = file.name.toLowerCase()
  if (name.endsWith(".pdf")) return "application/pdf"
  if (name.endsWith(".png")) return "image/png"
  if (name.endsWith(".webp")) return "image/webp"
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg"
  return file.type
}

export function isAllowedLayoutMime(mime: string): boolean {
  return LAYOUT_MIME.has(mime === "image/jpg" ? "image/jpeg" : mime)
}

export function captureHint(area: string, itemName: string): string {
  const name = itemName.toLowerCase()
  if (name.includes("cabinet")) return "Open doors and drawers. Photograph interiors and hardware."
  if (name.includes("appliance") || name.includes("dishwasher") || name.includes("fridge") || name.includes("oven")) {
    return "Check doors, seals, and controls. Photograph labels if damaged."
  }
  if (name.includes("counter")) return "Check seams and stains. Photograph the full run and any chips."
  if (name.includes("sink") || name.includes("faucet")) return "Run water, check for leaks, photograph the basin and supply lines."
  if (name.includes("toilet")) return "Flush, check the base for leaks, photograph the bowl and tank."
  if (name.includes("shower") || name.includes("tub")) return "Check caulk, drain, and fixtures. Photograph cracks or mold."
  if (name.includes("window")) return "Open and close, check locks and screens. Photograph glass and frames."
  if (name.includes("outlet") || name.includes("light")) return "Test switches and outlets. Photograph covers and any scorching."
  if (name.includes("floor")) return "Walk the surface, check transitions. Photograph stains, gaps, or damage."
  if (name.includes("wall")) return "Look for holes, cracks, and stains. Photograph each wall if needed."
  if (name.includes("door")) return "Open, close, and lock. Photograph the slab, frame, and hardware."
  if (name.includes("closet")) return "Check doors, rods, and shelves. Photograph interiors."
  if (name.includes("exhaust")) return "Turn the fan on. Photograph the grille and any moisture."
  return `Inspect ${itemName} in ${area}. Photograph anything that is not in good condition.`
}

export function roomKind(area: string): RoomKind {
  const lower = area.toLowerCase()
  if (lower.includes("kitchen")) return "kitchen"
  if (lower.includes("bath")) return "bath"
  if (lower.includes("bed")) return "bed"
  if (lower.includes("living")) return "living"
  if (lower.includes("hall") || lower.includes("entry") || lower.includes("foyer") || lower.includes("door")) {
    return "entry"
  }
  return "other"
}

export function groupByArea<T extends { area: string }>(items: T[]): Array<{ area: string; items: T[] }> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const list = map.get(item.area) ?? []
    list.push(item)
    map.set(item.area, list)
  }
  return [...map.entries()].map(([area, grouped]) => ({ area, items: grouped }))
}

export function floorPlanRoomsFromNames(roomNames: string): Array<{
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
}> {
  return roomNames
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name, i) => ({
      id: `room-${i + 1}`,
      name,
      x: i * 12,
      y: 0,
      width: 10,
      height: 8,
    }))
}

export function initialWalkthroughPhase(input: {
  itemCount: number
  status: string
  allHaveCondition: boolean
  noneHaveCondition: boolean
}): WalkthroughPhase {
  if (input.itemCount === 0) return "layout"
  if (input.status === "completed") return "report"
  if (input.allHaveCondition) return "summary"
  if (input.noneHaveCondition) return "checklist"
  return "item"
}

export function pickCurrentLease<T extends { status?: string }>(leases: T[]): T | undefined {
  const rank = ["active", "signed", "partially_signed", "pending_signature"]
  for (const status of rank) {
    const found = leases.find((lease) => lease.status === status)
    if (found) return found
  }
  return leases[0]
}

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  move_in: "Move-In",
  move_out: "Move-Out",
  periodic: "Routine",
  emergency: "Emergency",
  annual: "Annual",
  pre_lease: "Pre-Lease",
  post_maintenance: "Post-Maintenance",
  custom: "Custom",
}

export function inspectionTypeLabel(type: string): string {
  return INSPECTION_TYPE_LABELS[type] ?? type.replace(/_/g, " ")
}

/** Move-In / pre-lease walkthroughs surface applications instead of a leasing “Move in” CTA. */
export function showApplicationsCta(inspectionType: string): boolean {
  return inspectionType === "move_in" || inspectionType === "pre_lease"
}

/** API leases use leaseStart/leaseEnd; some clients still send startDate/endDate. */
export function leaseDateRange(lease: {
  leaseStart?: string | null
  leaseEnd?: string | null
  startDate?: string | null
  endDate?: string | null
} | null | undefined): { start: string; end: string } | null {
  const start = lease?.leaseStart || lease?.startDate || null
  const end = lease?.leaseEnd || lease?.endDate || null
  if (!start || !end) return null
  return { start, end }
}
