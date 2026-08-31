import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { TenantApplicationsPage } from "./tenant-applications"

vi.mock("@/lib/api", () => ({
  featureApi: {
    rental: {
      listMine: vi.fn().mockResolvedValue([
        {
          id: "app-1",
          status: "started",
          statusLabel: "Started",
          completionPercent: 40,
          applicantNextAction: "Continue application",
          completedAdultApplicants: 1,
          requiredAdults: 2,
          coApplicantSummary: "1 of 2 applicants completed",
          property: { title: "Avenues bungalow" },
        },
      ]),
    },
  },
}))

describe("TenantApplicationsPage", () => {
  it("shows N-of-M applicant progress from the list payload", async () => {
    render(<TenantApplicationsPage />)
    await waitFor(() => {
      expect(screen.getByText("Avenues bungalow")).toBeInTheDocument()
    })
    expect(screen.getByText("1 of 2 applicants completed")).toBeInTheDocument()
  })
})
