import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import enCommon from "../../../public/locales/en/common.json"
import { ReferralProgram } from "./referral-program"

const { api } = vi.hoisted(() => ({ api: { getStats: vi.fn(), getHistory: vi.fn() } }))
vi.mock("@/lib/api/clients/referrals", () => ({ referralApi: api }))
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: "u1", role: "owner" } }) }))
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }))
vi.mock("react-i18next", () => {
  function t(key: string, vars?: Record<string, unknown>) {
    let node: unknown = enCommon
    for (const part of key.split(".")) node = (node as Record<string, unknown> | undefined)?.[part]
    if (typeof node !== "string") return key
    return node.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars?.[k] ?? ""))
  }
  return { useTranslation: () => ({ t }) }
})

beforeEach(() => {
  api.getStats.mockResolvedValue({
    code: "K7QH3WMP",
    shareUrl: "https://ondorealestate.com/referral?ref=K7QH3WMP",
    totalReferrals: 2,
    creditsEarned: 2,
    creditsAvailable: 2,
    maxCredits: 10,
    sweepstakesEntries: 1,
    leaderboardPosition: 1,
  })
  api.getHistory.mockResolvedValue({
    referrals: [
      { id: "a", referredEmail: "sam@example.com", status: "converted", creditEarned: true, createdAt: "2027-01-02T00:00:00Z", convertedAt: null },
      { id: "b", referredEmail: "jo@example.com", status: "signed_up", creditEarned: true, createdAt: "2027-01-03T00:00:00Z", convertedAt: null },
      { id: "c", referredEmail: null, status: "clicked", creditEarned: false, createdAt: "2027-01-04T00:00:00Z", convertedAt: null },
    ],
    total: 3,
  })
})

describe("ReferralProgram (owners, managers, admins)", () => {
  it("shares a link and code and counts what happened, with no reward promises", async () => {
    const { container } = render(<ReferralProgram />)
    expect(screen.getByRole("heading", { level: 1, name: "Refer a renter" })).toBeInTheDocument()
    expect(await screen.findByDisplayValue("https://ondorealestate.com/referral?ref=K7QH3WMP")).toBeInTheDocument()
    expect(screen.getByText("K7QH3WMP")).toBeInTheDocument()

    expect(screen.getByText("People you referred")).toBeInTheDocument()
    await screen.findByText("s***@example.com")
    const counts = Object.fromEntries(
      screen.getAllByRole("term").map((term) => [term.textContent, term.nextElementSibling?.textContent]),
    )
    expect(counts).toEqual({ "Used your link": "3", "Created an account": "2", "Signed a lease": "1" })

    expect(screen.getByText("Referral points go to tenants. Your link still gets the renter their welcome bonus.")).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/free month|sweepstake|prize|leaderboard|credit/i)
  })

  it("shows each referral's status without exposing full emails", async () => {
    render(<ReferralProgram />)
    expect(await screen.findByText("s***@example.com")).toBeInTheDocument()
    expect(screen.getByText("No email")).toBeInTheDocument()
    expect(screen.getAllByText("Signed a lease").length).toBeGreaterThan(1)
    expect(screen.getByText("Opened your link")).toBeInTheDocument()
  })
})
