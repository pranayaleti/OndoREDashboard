import { describe, it, expect } from "vitest"
import { hrefForPipelineCard } from "./leasing-pipeline-href"
import type { PipelineCard } from "@/lib/api/clients/operations"

const card: PipelineCard = {
  id: "c1",
  kind: "application",
  stage: "application",
  title: "Jordan Lee",
  subtitle: "12 Oak",
  status: "submitted",
  propertyId: "prop-1",
  propertyTitle: "12 Oak",
  updatedAt: "2026-08-29T00:00:00.000Z",
}

describe("hrefForPipelineCard", () => {
  it("opens manager property ops on the applications tab", () => {
    expect(hrefForPipelineCard(card, "manager")).toBe("/dashboard/properties/prop-1?tab=applications")
  })

  it("opens owner property detail on the applications tab", () => {
    expect(hrefForPipelineCard(card, "owner")).toBe("/owner/properties/prop-1?tab=applications")
  })

  it("sends manager leads to the inbox, not a second CRM", () => {
    expect(
      hrefForPipelineCard({ ...card, kind: "lead", propertyId: "prop-1" }, "manager"),
    ).toBe("/dashboard/leads")
  })
})
