import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import Referrals from "./Referrals"
import { getReferralsPath } from "@/lib/auth-utils"

const auth = vi.hoisted(() => ({ value: { user: null as null | { role: string }, isLoading: false } }))
vi.mock("@/lib/auth-context", () => ({ useAuth: () => auth.value }))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/owner/referrals" element={<p>Owner referral page</p>} />
        <Route path="/maintenance" element={<p>Maintenance dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("/referrals", () => {
  beforeEach(() => {
    auth.value = { user: null, isLoading: false }
  })

  it("explains the program and offers log in and sign up when signed out", () => {
    renderAt("/referrals")
    expect(screen.getByRole("heading", { level: 1, name: /referral program/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /log in to get your link/i })).toHaveAttribute("href", "/login")
    expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute("href", "/register")
  })

  it("sends a signed-in user to their own portal's referral page", () => {
    auth.value = { user: { role: "owner" }, isLoading: false }
    renderAt("/referrals")
    expect(screen.getByText("Owner referral page")).toBeInTheDocument()
  })
})

describe("getReferralsPath", () => {
  it("points each portal at its referral page, and maintenance at its dashboard", () => {
    expect(getReferralsPath("owner")).toBe("/owner/referrals")
    expect(getReferralsPath("tenant")).toBe("/tenant/referrals")
    expect(getReferralsPath("manager")).toBe("/dashboard/referrals")
    expect(getReferralsPath("super_admin")).toBe("/super-admin/referrals")
    expect(getReferralsPath("maintenance")).toBe("/maintenance")
  })
})
