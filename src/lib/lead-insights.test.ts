import { describe, expect, it } from "vitest"
import type { InboxLead } from "@/lib/api/clients/lead"
import {
  STALE_AFTER_DAYS,
  daysSince,
  formatSourceLabel,
  isStaleLead,
  summarizeLeads,
} from "./lead-insights"

const NOW = new Date("2026-10-28T12:00:00Z")

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString()
}

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
    managerId: "mgr-1",
    claimedAt: daysAgo(1),
    lastActivityAt: daysAgo(1),
    overdueTaskCount: 0,
    propertyId: null,
    createdAt: daysAgo(1),
    updatedAt: null,
    propertyTitle: null,
    propertyAddress: null,
    propertyCity: null,
    ...overrides,
  }
}

describe("daysSince", () => {
  it("counts whole elapsed days and never goes negative", () => {
    expect(daysSince(daysAgo(3), NOW)).toBe(3)
    expect(daysSince(daysAgo(0.5), NOW)).toBe(0)
    expect(daysSince(daysAgo(-2), NOW)).toBe(0)
  })

  it("returns 0 for unparseable input", () => {
    expect(daysSince("not-a-date", NOW)).toBe(0)
  })
})

describe("isStaleLead", () => {
  it("flags active-stage leads quiet for STALE_AFTER_DAYS or more", () => {
    expect(isStaleLead(makeLead({ lastActivityAt: daysAgo(STALE_AFTER_DAYS) }), NOW)).toBe(true)
    expect(isStaleLead(makeLead({ status: "prospective", lastActivityAt: daysAgo(10) }), NOW)).toBe(true)
    expect(isStaleLead(makeLead({ lastActivityAt: daysAgo(STALE_AFTER_DAYS - 1) }), NOW)).toBe(false)
  })

  it("never flags terminal stages, however quiet", () => {
    expect(isStaleLead(makeLead({ status: "converted", lastActivityAt: daysAgo(30) }), NOW)).toBe(false)
    expect(isStaleLead(makeLead({ status: "closed", lastActivityAt: daysAgo(30) }), NOW)).toBe(false)
  })
})

describe("formatSourceLabel", () => {
  it("prettifies slugs and falls back to Direct", () => {
    expect(formatSourceLabel("rental-application-abandoned")).toBe("Rental application abandoned")
    expect(formatSourceLabel("google_ads")).toBe("Google ads")
    expect(formatSourceLabel(null)).toBe("Direct")
    expect(formatSourceLabel("")).toBe("Direct")
  })
})

describe("summarizeLeads", () => {
  it("computes the headline counts", () => {
    const leads = [
      makeLead({ id: "a", createdAt: daysAgo(1) }),
      makeLead({ id: "b", createdAt: daysAgo(20), lastActivityAt: daysAgo(10) }),
      makeLead({ id: "c", createdAt: daysAgo(20), status: "converted", lastActivityAt: daysAgo(20) }),
      makeLead({ id: "d", createdAt: daysAgo(2), managerId: null, claimedAt: null }),
    ]
    const summary = summarizeLeads(leads, NOW)
    expect(summary.total).toBe(4)
    expect(summary.newThisWeek).toBe(2)
    expect(summary.unclaimed).toBe(1)
    expect(summary.stale).toBe(1)
    expect(summary.converted).toBe(1)
    expect(summary.conversionRate).toBe(25)
  })

  it("ranks sources by count with alphabetical ties and respects the limit", () => {
    const leads = [
      makeLead({ id: "a", source: "popup" }),
      makeLead({ id: "b", source: "popup" }),
      makeLead({ id: "c", source: "zillow" }),
      makeLead({ id: "d", source: "instagram" }),
      makeLead({ id: "e", source: null }),
    ]
    const summary = summarizeLeads(leads, NOW, 2)
    expect(summary.topSources).toEqual([
      { source: "popup", label: "Popup", count: 2 },
      { source: "direct", label: "Direct", count: 1 },
    ])
  })

  it("returns a null conversion rate for an empty pipeline", () => {
    const summary = summarizeLeads([], NOW)
    expect(summary.total).toBe(0)
    expect(summary.conversionRate).toBeNull()
    expect(summary.topSources).toEqual([])
  })
})
