import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import RewardRedemptions from "./reward-redemptions"
import type { RedemptionRequest } from "@/lib/api/clients/rewards"

const { api, toast } = vi.hoisted(() => ({
  api: { listRedemptions: vi.fn(), fulfilRedemption: vi.fn(), cancelRedemption: vi.fn() },
  toast: vi.fn(),
}))
vi.mock("@/lib/api/clients/rewards", () => ({ rewardsApi: api }))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }))

function request(over: Partial<RedemptionRequest> = {}): RedemptionRequest {
  return {
    id: "r1",
    tenantId: "t1",
    tenantName: "Avery Lee",
    propertyId: "p1",
    propertyLabel: "12 Maple St, Lehi",
    title: "$50 off rent",
    points: 500,
    kind: "redeemed_credit",
    status: "pending",
    requestedAt: "2027-01-04T18:00:00Z",
    fulfilledAt: null,
    note: null,
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  api.listRedemptions.mockResolvedValue([
    request(),
    request({ id: "r2", title: "Professional carpet cleaning", points: 1500, kind: "redeemed_gift", tenantName: "Sam Ortiz" }),
  ])
})

describe("RewardRedemptions", () => {
  it("lists waiting redemptions with what to do next", async () => {
    render(<RewardRedemptions />)
    expect(await screen.findByText("Avery Lee, 12 Maple St, Lehi")).toBeInTheDocument()
    expect(api.listRedemptions).toHaveBeenCalledWith("pending")
    expect(screen.getByText("Apply $50 to an upcoming rent charge, then mark it done.")).toBeInTheDocument()
    expect(screen.getByText("Contact the tenant to book it, then mark it done.")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Waiting" })).toHaveAttribute("aria-selected", "true")
  })

  it("marks a redemption done and drops it from the queue", async () => {
    api.fulfilRedemption.mockResolvedValue(request({ status: "fulfilled" }))
    render(<RewardRedemptions />)
    fireEvent.click(await screen.findByRole("button", { name: "Mark $50 off rent for Avery Lee done" }))
    await waitFor(() => expect(api.fulfilRedemption).toHaveBeenCalledWith("r1"))
    await waitFor(() => expect(screen.queryByText("Avery Lee, 12 Maple St, Lehi")).toBeNull())
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Marked done" }))
  })

  it("cancels with a note for the tenant and says the points went back", async () => {
    api.cancelRedemption.mockResolvedValue(request({ status: "cancelled" }))
    render(<RewardRedemptions />)
    await screen.findByText("Avery Lee, 12 Maple St, Lehi")
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel and refund" })[0])
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/500 points go back to their balance/)).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText("Note for the tenant (optional)"), {
      target: { value: "Moving out before the next charge" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel and refund" }))
    await waitFor(() => expect(api.cancelRedemption).toHaveBeenCalledWith("r1", "Moving out before the next charge"))
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cancelled", description: "500 points went back to Avery Lee." }),
    )
  })

  it("switches tabs and shows an empty state", async () => {
    render(<RewardRedemptions />)
    await screen.findByText("Avery Lee, 12 Maple St, Lehi")
    api.listRedemptions.mockResolvedValueOnce([])
    fireEvent.click(screen.getByRole("tab", { name: "Done" }))
    expect(await screen.findByText("No redemptions marked done yet.")).toBeInTheDocument()
    expect(api.listRedemptions).toHaveBeenLastCalledWith("fulfilled")
    expect(screen.getByTestId("mural-vignette")).toBeInTheDocument()
  })

  it("says what failed and retries", async () => {
    api.listRedemptions.mockRejectedValueOnce(new Error("Forbidden"))
    render(<RewardRedemptions />)
    const alert = await screen.findByRole("alert")
    expect(within(alert).getByText("Forbidden")).toBeInTheDocument()
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }))
    expect(await screen.findByText("Avery Lee, 12 Maple St, Lehi")).toBeInTheDocument()
  })
})
