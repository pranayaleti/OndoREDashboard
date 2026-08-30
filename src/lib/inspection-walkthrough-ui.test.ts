import { describe, expect, it } from "vitest"
import {
  captureHint,
  floorPlanRoomsFromNames,
  groupByArea,
  initialWalkthroughPhase,
  inspectionTypeLabel,
  isAllowedLayoutMime,
  leaseDateRange,
  showApplicationsCta,
  pickCurrentLease,
  resolveLayoutMime,
  roomKind,
} from "./inspection-walkthrough-ui"

describe("captureHint", () => {
  it("tells the inspector what to capture for cabinets", () => {
    expect(captureHint("Kitchen", "Cabinets")).toMatch(/Open doors/i)
  })

  it("falls back to the item and area", () => {
    expect(captureHint("Studio", "Overall condition")).toMatch(/Studio/)
  })
})

describe("roomKind", () => {
  it("maps common rooms", () => {
    expect(roomKind("Entry")).toBe("entry")
    expect(roomKind("Living Room")).toBe("living")
    expect(roomKind("Kitchen")).toBe("kitchen")
    expect(roomKind("Bathroom 2")).toBe("bath")
    expect(roomKind("Bedroom 01")).toBe("bed")
    expect(roomKind("Garage")).toBe("other")
  })
})

describe("groupByArea", () => {
  it("keeps room order of first appearance", () => {
    const grouped = groupByArea([
      { area: "Kitchen", id: "1" },
      { area: "Kitchen", id: "2" },
      { area: "Bedroom", id: "3" },
    ])
    expect(grouped.map((g) => g.area)).toEqual(["Kitchen", "Bedroom"])
    expect(grouped[0]?.items).toHaveLength(2)
  })
})

describe("floorPlanRoomsFromNames", () => {
  it("parses comma-separated rooms", () => {
    expect(floorPlanRoomsFromNames("Kitchen, Studio").map((r) => r.name)).toEqual(["Kitchen", "Studio"])
  })
})

describe("initialWalkthroughPhase", () => {
  it("starts on layout with no items", () => {
    expect(initialWalkthroughPhase({
      itemCount: 0,
      status: "scheduled",
      allHaveCondition: false,
      noneHaveCondition: true,
    })).toBe("layout")
  })

  it("shows the checklist after generate, before any conditions", () => {
    expect(initialWalkthroughPhase({
      itemCount: 6,
      status: "in_progress",
      allHaveCondition: false,
      noneHaveCondition: true,
    })).toBe("checklist")
  })

  it("resumes the item walk when some conditions exist", () => {
    expect(initialWalkthroughPhase({
      itemCount: 6,
      status: "in_progress",
      allHaveCondition: false,
      noneHaveCondition: false,
    })).toBe("item")
  })

  it("opens the report when completed", () => {
    expect(initialWalkthroughPhase({
      itemCount: 6,
      status: "completed",
      allHaveCondition: true,
      noneHaveCondition: false,
    })).toBe("report")
  })
})

describe("pickCurrentLease", () => {
  it("prefers active over draft", () => {
    expect(pickCurrentLease([{ status: "draft" }, { status: "active" }])?.status).toBe("active")
  })
})

describe("leaseDateRange", () => {
  it("reads leaseStart/leaseEnd", () => {
    expect(leaseDateRange({ leaseStart: "2026-08-01", leaseEnd: "2027-07-31" })).toEqual({
      start: "2026-08-01",
      end: "2027-07-31",
    })
  })

  it("falls back to startDate/endDate from older clients", () => {
    expect(leaseDateRange({ startDate: "2026-01-01", endDate: "2026-12-31" })).toEqual({
      start: "2026-01-01",
      end: "2026-12-31",
    })
  })

  it("returns null when a side is missing", () => {
    expect(leaseDateRange({ leaseStart: "2026-08-01" })).toBeNull()
    expect(leaseDateRange(undefined)).toBeNull()
  })
})

describe("inspectionTypeLabel", () => {
  it("labels move-in inspections", () => {
    expect(inspectionTypeLabel("move_in")).toBe("Move-In")
    expect(inspectionTypeLabel("periodic")).toBe("Routine")
  })
})

describe("showApplicationsCta", () => {
  it("is for move-in and pre-lease only", () => {
    expect(showApplicationsCta("move_in")).toBe(true)
    expect(showApplicationsCta("pre_lease")).toBe(true)
    expect(showApplicationsCta("periodic")).toBe(false)
  })
})

describe("layout mime", () => {
  it("accepts pdf and images", () => {
    expect(isAllowedLayoutMime("application/pdf")).toBe(true)
    expect(isAllowedLayoutMime("image/jpeg")).toBe(true)
    expect(isAllowedLayoutMime("text/plain")).toBe(false)
    const pdf = new File(["%PDF"], "plan.pdf", { type: "" })
    expect(resolveLayoutMime(pdf)).toBe("application/pdf")
  })
})
