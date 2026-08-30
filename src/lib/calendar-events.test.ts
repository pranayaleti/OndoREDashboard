import { describe, expect, it } from "vitest"
import { apiCalendarEventToVM, propertyCalendarHref } from "./calendar-events"

describe("apiCalendarEventToVM", () => {
  it("maps inspection rows to all-day calendar items", () => {
    const vm = apiCalendarEventToVM({
      id: "insp-1",
      title: "Routine inspection: 101 Oak Street",
      eventType: "inspection",
      startDate: "2026-08-29",
      propertyId: "prop-oak",
      relatedType: "property_inspection",
      metadata: { propertyTitle: "101 Oak Street" },
    })
    expect(vm.type).toBe("inspection")
    expect(vm.time).toBe("All day")
    expect(vm.property).toBe("101 Oak Street")
    expect(vm.propertyId).toBe("prop-oak")
    expect(vm.description).toMatch(/Scheduled inspection/)
    expect(vm.date.getFullYear()).toBe(2026)
    expect(vm.date.getMonth()).toBe(7)
    expect(vm.date.getDate()).toBe(29)
  })
})

describe("propertyCalendarHref", () => {
  it("opens the property page from a dashboard base path", () => {
    expect(propertyCalendarHref("/owner", "prop-oak")).toBe("/owner/properties/prop-oak")
    expect(propertyCalendarHref("/dashboard", null)).toBeNull()
    expect(propertyCalendarHref("/owner", "prop-oak", "inspections")).toBe(
      "/owner/properties/prop-oak?tab=inspections",
    )
  })
})
