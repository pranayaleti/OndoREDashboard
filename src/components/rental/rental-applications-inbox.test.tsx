import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { RentalApplicationsInbox } from "./rental-applications-inbox"

vi.mock("@/lib/api", () => ({
  featureApi: {
    rental: {
      listInbox: vi.fn().mockResolvedValue([
        {
          id: "app-1",
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          status: "started",
          statusLabel: "Started",
          completionPercent: 40,
          completedAdultApplicants: 1,
          requiredAdults: 3,
          coApplicantSummary: "1 of 3 applicants completed",
          property: { title: "Avenues bungalow" },
        },
      ]),
    },
  },
  propertyApi: {
    getProperties: vi.fn().mockResolvedValue({ properties: [] }),
  },
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

describe("RentalApplicationsInbox", () => {
  it("shows N-of-M from required adults, not invited count", async () => {
    render(<RentalApplicationsInbox />)
    await waitFor(() => {
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument()
    })
    expect(screen.getByText("1 of 3 applicants completed")).toBeInTheDocument()
  })
})
