import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import type { LeaseDocument } from "../types"

// `leases.lease_end` is a Postgres date. Pin a US zone so a UTC-midnight parse shows the day before.
const originalTz = process.env.TZ
process.env.TZ = "America/Denver"

const { mockLeaseApi } = vi.hoisted(() => ({
  mockLeaseApi: { listLeases: vi.fn(), sendForSignature: vi.fn() },
}))

vi.mock("../api", () => ({ leaseManagementApi: mockLeaseApi }))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }))
vi.mock("@/components/shared/lease-template-picker", () => ({ LeaseTemplatePicker: () => null }))

const { LeaseManagementOverview } = await import("./LeaseManagementOverview")

function lease(overrides: Partial<LeaseDocument>): LeaseDocument {
  return {
    id: "lease-1",
    propertyId: "prop-1",
    tenantId: "tenant-1",
    ownerId: "owner-1",
    status: "active",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

/** Local calendar date `days` from now as "YYYY-MM-DD" (the shape GET /properties/:id/leases returns). */
function localDay(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

beforeEach(() => {
  mockLeaseApi.listLeases.mockReset()
})

afterAll(() => {
  process.env.TZ = originalTz
})

describe("LeaseManagementOverview", () => {
  it("shows the lease end date as the calendar day stored, not the day before", async () => {
    mockLeaseApi.listLeases.mockResolvedValue([lease({ expirationDate: "2026-11-30" })])
    render(<LeaseManagementOverview />)

    expect(await screen.findByText(`· expires ${new Date(2026, 10, 30).toLocaleDateString()}`)).toBeInTheDocument()
  })

  it("counts a lease whose last day is today as expiring soon", async () => {
    mockLeaseApi.listLeases.mockResolvedValue([
      lease({ id: "today", expirationDate: localDay(0) }),
      lease({ id: "later", expirationDate: localDay(90) }),
      lease({ id: "ended", expirationDate: localDay(-1) }),
    ])
    render(<LeaseManagementOverview />)

    const label = await screen.findByText("Expiring < 30 days")
    expect(label.nextElementSibling).toHaveTextContent("1")
  })

  it("shows N/A instead of zero leases when the lease list cannot load", async () => {
    mockLeaseApi.listLeases.mockRejectedValue(new Error("Token refresh failed"))
    render(<LeaseManagementOverview />)

    await vi.waitFor(() => expect(mockLeaseApi.listLeases).toHaveBeenCalled())
    // Let the rejection settle so this checks the failed state, not the loading one.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(screen.getByText("Active Leases").nextElementSibling).toHaveTextContent("N/A")
    expect(screen.getByText("Expiring < 30 days").nextElementSibling).toHaveTextContent("N/A")
  })
})
