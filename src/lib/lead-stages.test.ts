import { describe, expect, it } from "vitest"
import type { InboxLead } from "@/lib/api/clients/lead"
import { LEAD_STAGES, canMoveLead, getLeadStage, getStageBadgeClass, groupLeadsByStage } from "./lead-stages"

function makeLead(overrides: Partial<InboxLead>): InboxLead {
  return {
    id: "lead-1",
    kind: "website",
    inquiryType: null,
    name: "Jess Example",
    email: "jess@example.com",
    phone: null,
    message: null,
    status: "new",
    source: "website",
    managerId: null,
    claimedAt: null,
    lastActivityAt: "2026-10-28T00:00:00Z",
    overdueTaskCount: 0,
    propertyId: null,
    createdAt: "2026-10-28T00:00:00Z",
    updatedAt: null,
    propertyTitle: null,
    propertyAddress: null,
    propertyCity: null,
    ...overrides,
  }
}

describe("LEAD_STAGES", () => {
  it("matches the lead_status enum order in Supabase", () => {
    expect(LEAD_STAGES.map((s) => s.value)).toEqual([
      "new",
      "prospective",
      "contacted",
      "qualified",
      "converted",
      "closed",
    ])
  })
})

describe("groupLeadsByStage", () => {
  it("buckets leads by status in stage order", () => {
    const leads = [
      makeLead({ id: "a", status: "prospective" }),
      makeLead({ id: "b", status: "new" }),
      makeLead({ id: "c", status: "prospective" }),
    ]
    const grouped = groupLeadsByStage(leads)
    expect([...grouped.keys()]).toEqual(LEAD_STAGES.map((s) => s.value))
    expect(grouped.get("new")!.map((l) => l.id)).toEqual(["b"])
    expect(grouped.get("prospective")!.map((l) => l.id)).toEqual(["a", "c"])
    expect(grouped.get("contacted")).toEqual([])
  })

  it("puts a lead with an unknown status into closed instead of dropping it", () => {
    const grouped = groupLeadsByStage([
      makeLead({ id: "x", status: "archived" as InboxLead["status"] }),
    ])
    expect(grouped.get("closed")!.map((l) => l.id)).toEqual(["x"])
  })
})

describe("canMoveLead", () => {
  it("allows only the owning manager to move a lead", () => {
    const mine = makeLead({ managerId: "mgr-1", claimedAt: "2026-10-28T00:00:00Z" })
    expect(canMoveLead(mine, "mgr-1")).toBe(true)
    expect(canMoveLead(mine, "mgr-2")).toBe(false)
  })

  it("blocks unclaimed leads and signed-out users", () => {
    const unclaimed = makeLead({ managerId: null })
    expect(canMoveLead(unclaimed, "mgr-1")).toBe(false)
    expect(canMoveLead(makeLead({ managerId: "mgr-1" }), undefined)).toBe(false)
  })
})

describe("getLeadStage", () => {
  it("falls back to closed styling for unknown statuses", () => {
    expect(getLeadStage("nonsense").value).toBe("closed")
    expect(getStageBadgeClass("prospective")).toContain("cyan")
  })
})
