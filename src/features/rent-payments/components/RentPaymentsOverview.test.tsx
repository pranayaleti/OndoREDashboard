import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen, waitFor } from "@testing-library/react"
import { RentPaymentsOverview } from "./RentPaymentsOverview"

const { mockRentApi } = vi.hoisted(() => ({
  mockRentApi: { getPortfolioSchedules: vi.fn(), listPayments: vi.fn() },
}))

vi.mock("../api", () => ({ rentPaymentsApi: mockRentApi }))

beforeEach(() => {
  mockRentApi.getPortfolioSchedules.mockReset()
  mockRentApi.listPayments.mockReset()
})

describe("RentPaymentsOverview", () => {
  it("shows the schedule count and earliest unpaid due date once loaded", async () => {
    mockRentApi.getPortfolioSchedules.mockResolvedValue([
      { tenantId: "t1", propertyId: "p1", monthlyAmount: 2000, dueDay: 1, autopayEnabled: false, nextChargeDate: "2026-12-01", upcomingDueDates: [] },
      { tenantId: "t2", propertyId: "p2", monthlyAmount: 1500, dueDay: 5, autopayEnabled: false, nextChargeDate: "2026-11-05", upcomingDueDates: [] },
    ])
    mockRentApi.listPayments.mockResolvedValue([])
    render(<RentPaymentsOverview />)

    const label = screen.getByText("Active Rent Schedules")
    await waitFor(() => expect(label.nextElementSibling).toHaveTextContent("2"))
    expect(screen.getByText(new Date("2026-11-05T12:00:00Z").toLocaleDateString())).toBeInTheDocument()
  })

  it("shows N/A rather than zero when the schedules or payments fail to load", async () => {
    mockRentApi.getPortfolioSchedules.mockRejectedValue(new Error("Token refresh failed"))
    mockRentApi.listPayments.mockRejectedValue(new Error("Token refresh failed"))
    render(<RentPaymentsOverview />)

    await waitFor(() => expect(mockRentApi.listPayments).toHaveBeenCalled())
    // Let both rejections settle so this checks the failed state, not the loading one.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(screen.getByText("Active Rent Schedules").nextElementSibling).toHaveTextContent("N/A")
    expect(screen.getByText("Recent Payments").nextElementSibling).toHaveTextContent("N/A")
    expect(screen.queryByText("No payments recorded yet")).not.toBeInTheDocument()
  })
})
