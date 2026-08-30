import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LoginHistory } from "./login-history"

const { mockUser } = vi.hoisted(() => ({
  mockUser: {
    current: null as {
      lastLoginAt?: string | null
      lastLoginIp?: string | null
      lastLoginDevice?: string | null
      lastLoginBrowser?: string | null
    } | null,
  },
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: mockUser.current }),
}))

describe("LoginHistory", () => {
  it("does not invent mock Salt Lake City sessions when last login is unknown", () => {
    mockUser.current = {
      lastLoginAt: null,
      lastLoginIp: null,
      lastLoginDevice: null,
      lastLoginBrowser: null,
    }
    render(<LoginHistory />)
    expect(screen.queryByText(/Salt Lake City/i)).not.toBeInTheDocument()
    expect(screen.getByText(/No login recorded yet/i)).toBeInTheDocument()
  })

  it("renders the authenticated user's last login", () => {
    mockUser.current = {
      lastLoginAt: "2026-08-30T14:00:00.000Z",
      lastLoginIp: "203.0.113.10",
      lastLoginDevice: "Desktop",
      lastLoginBrowser: "Chrome",
    }
    render(<LoginHistory />)
    expect(screen.getByText("Desktop")).toBeInTheDocument()
    expect(screen.getByText("Chrome")).toBeInTheDocument()
    expect(screen.getByText(/203\.0\.113\.10/)).toBeInTheDocument()
    expect(screen.queryByText(/View Login History/i)).not.toBeInTheDocument()
  })
})
