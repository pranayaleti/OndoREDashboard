import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import TenantRewards from "./tenant-rewards"
import type { RewardsOverview } from "@/lib/api/clients/rewards"

const api = vi.hoisted(() => ({
  getOverview: vi.fn(),
  redeem: vi.fn(),
  getStats: vi.fn(),
  getHistory: vi.fn(),
}))

vi.mock("@/lib/api/clients/rewards", () => ({
  rewardsApi: { getOverview: api.getOverview, redeem: api.redeem, getHistory: vi.fn() },
}))
vi.mock("@/lib/api/clients/referrals", () => ({
  referralApi: { getStats: api.getStats, getHistory: api.getHistory },
}))

const TIERS = [
  { id: "bronze", name: "Bronze", minPoints: 0, rentMultiplier: 1 },
  { id: "silver", name: "Silver", minPoints: 1000, rentMultiplier: 1.1 },
  { id: "gold", name: "Gold", minPoints: 5000, rentMultiplier: 1.25 },
  { id: "platinum", name: "Platinum", minPoints: 10000, rentMultiplier: 1.5 },
] as const

function overview(over: Partial<RewardsOverview> = {}): RewardsOverview {
  return {
    available: 620,
    lifetime: 1240,
    redeemed: 620,
    tier: TIERS[1],
    nextTier: TIERS[2],
    pointsToNextTier: 3760,
    trailProgress: 0.35,
    earnRates: { onTimeRent: 110, baseOnTimeRent: 100, referral: 500, renewal: 1000, friendBonus: 250 },
    tiers: [...TIERS],
    catalog: [
      { id: "rent-credit-50", title: "$50 off rent", description: "Applied to an upcoming rent charge.", points: 500, kind: "redeemed_credit" },
      { id: "carpet-cleaning", title: "Professional carpet cleaning", description: "One visit.", points: 1500, kind: "redeemed_gift" },
    ],
    earningStartsOn: "2026-12-01",
    canRedeem: true,
    recentActivity: [
      { id: "t1", points: 110, type: "earned_payment", description: "On-time rent for January 2027", createdAt: "2027-01-01T18:00:00Z", status: null },
      { id: "t2", points: -500, type: "redeemed_credit", description: "Redeemed: $50 off rent", createdAt: "2027-01-03T18:00:00Z", status: "pending" },
    ],
    ...over,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/tenant/rewards"]}>
      <TenantRewards />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  api.getOverview.mockResolvedValue(overview())
  api.getStats.mockResolvedValue({
    code: "ABCD2345",
    shareUrl: "https://ondorealestate.com/referral?ref=ABCD2345",
    totalReferrals: 2,
    creditsEarned: 0,
    creditsAvailable: 0,
    maxCredits: 10,
    sweepstakesEntries: 0,
    leaderboardPosition: null,
  })
  api.getHistory.mockResolvedValue({
    referrals: [
      { id: "r1", referredEmail: "sam@example.com", status: "converted", creditEarned: true, createdAt: "2026-12-02T00:00:00Z", convertedAt: null },
      { id: "r2", referredEmail: "jo@example.com", status: "signed_up", creditEarned: true, createdAt: "2026-12-05T00:00:00Z", convertedAt: null },
      { id: "r3", referredEmail: null, status: "clicked", creditEarned: false, createdAt: "2026-12-06T00:00:00Z", convertedAt: null },
    ],
    total: 3,
  })
})

describe("TenantRewards", () => {
  it("shows the balance, tier, distance to the next tier and the trail mural", async () => {
    renderPage()
    const hero = await screen.findByRole("region", { name: "Your points" })
    expect(within(hero).getByText("620")).toBeInTheDocument()
    expect(within(hero).getByText("Silver member")).toBeInTheDocument()
    expect(within(hero).getByText("3,760 more points to reach Gold")).toBeInTheDocument()
    expect(within(hero).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "35")
    expect(screen.getByTestId("mural-trail")).toBeInTheDocument()

    const current = screen.getByRole("listitem", { current: "step" })
    expect(within(current).getByText("Silver")).toBeInTheDocument()
    expect(within(current).getByText("110 points per on-time rent")).toBeInTheDocument()
  })

  it("lists ways to earn with the tier bonus applied", async () => {
    renderPage()
    const earn = await screen.findByRole("region", { name: "Ways to earn" })
    expect(within(earn).getByText("Each month, with your Silver bonus")).toBeInTheDocument()
    expect(within(earn).getByText("+110")).toBeInTheDocument()
    expect(within(earn).getByText("+1,000")).toBeInTheDocument()
  })

  it("gives the referral link with copy and share options, and counts friends", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })

    renderPage()
    const refer = await screen.findByRole("region", { name: "Refer a friend" })
    expect(within(refer).getByText(/you get 500 points and they get a 250-point welcome bonus/)).toBeInTheDocument()
    expect(within(refer).getByText("ABCD2345")).toBeInTheDocument()
    const link = await within(refer).findByLabelText("Your referral link")
    expect(link).toHaveValue("https://ondorealestate.com/referral?ref=ABCD2345")
    expect(within(refer).getByText("2 friends have created an account. 1 signed a lease.")).toBeInTheDocument()
    expect(within(refer).getByText("s***@example.com")).toBeInTheDocument()
    expect(within(refer).getByRole("link", { name: /text it/i }).getAttribute("href")).toMatch(/^sms:/)

    fireEvent.click(within(refer).getByRole("button", { name: /copy link/i }))
    expect(writeText).toHaveBeenCalledWith("https://ondorealestate.com/referral?ref=ABCD2345")
    expect(await within(refer).findByRole("button", { name: /copied/i })).toBeInTheDocument()
  })

  it("redeems an affordable reward after confirming and shows the new balance", async () => {
    api.redeem.mockResolvedValue({
      transaction: { id: "t3", points: -500, type: "redeemed_credit", description: "Redeemed: $50 off rent", createdAt: "2027-01-04T00:00:00Z", status: "pending" },
      overview: overview({ available: 120, redeemed: 1120 }),
    })
    renderPage()

    const carpet = await screen.findByRole("button", { name: "Redeem Professional carpet cleaning" })
    expect(carpet).toBeDisabled()
    expect(screen.getByText("880 more needed")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Redeem $50 off rent" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Redeem 500 points for $50 off rent?")).toBeInTheDocument()
    expect(within(dialog).getByText(/You'll have 120 points left/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("button", { name: "Redeem" }))

    await waitFor(() => expect(api.redeem).toHaveBeenCalledWith("rent-credit-50"))
    const hero = screen.getByRole("region", { name: "Your points" })
    await waitFor(() => expect(within(hero).getByText("120")).toBeInTheDocument())
  })

  it("explains why redeeming is closed without a current lease", async () => {
    api.getOverview.mockResolvedValue(overview({ canRedeem: false }))
    renderPage()
    expect(await screen.findByText("Redeeming opens when you have a current lease at an Ondo home.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Redeem $50 off rent" })).toBeDisabled()
  })

  it("shows an empty state with the first thing to do", async () => {
    api.getOverview.mockResolvedValue(
      overview({ available: 0, lifetime: 0, redeemed: 0, tier: TIERS[0], recentActivity: [], earnRates: { onTimeRent: 100, baseOnTimeRent: 100, referral: 500, renewal: 1000, friendBonus: 250 } }),
    )
    renderPage()
    expect(await screen.findByText("No points yet. Pay your next rent on time to earn your first 100 points.")).toBeInTheDocument()
    expect(screen.getByTestId("mural-vignette")).toBeInTheDocument()
  })

  it("says what failed and retries", async () => {
    api.getOverview.mockRejectedValueOnce(new Error("Network error. Please check your connection."))
    renderPage()
    const alert = await screen.findByRole("alert")
    expect(within(alert).getByText("Network error. Please check your connection.")).toBeInTheDocument()
    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }))
    expect(await screen.findByRole("region", { name: "Your points" })).toBeInTheDocument()
    expect(api.getOverview).toHaveBeenCalledTimes(2)
  })

  it("shows where each redemption stands", async () => {
    api.getOverview.mockResolvedValue(
      overview({
        recentActivity: [
          { id: "p", points: -250, type: "redeemed_credit", description: "Redeemed: $25 off rent", createdAt: "2027-01-05T00:00:00Z", status: "pending" },
          { id: "f", points: -500, type: "redeemed_credit", description: "Redeemed: $50 off rent", createdAt: "2027-01-04T00:00:00Z", status: "fulfilled" },
          { id: "c", points: -1500, type: "redeemed_gift", description: "Redeemed: Professional carpet cleaning", createdAt: "2027-01-03T00:00:00Z", status: "cancelled" },
        ],
      }),
    )
    renderPage()
    const activity = await screen.findByRole("region", { name: "Recent activity" })
    expect(within(activity).getByText("Waiting for Ondo")).toBeInTheDocument()
    expect(within(activity).getByText("Done")).toBeInTheDocument()
    expect(within(activity).getByText("Cancelled, points returned")).toBeInTheDocument()
  })
})
