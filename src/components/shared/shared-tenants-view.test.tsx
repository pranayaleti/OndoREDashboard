import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { SharedTenantsView } from "./shared-tenants-view"
import type { InvitedUser } from "@/lib/api"

const getInvitedUsers = vi.fn()
const updateUserStatus = vi.fn()

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/lib/api")
  return {
    ...actual,
    authApi: {
      getInvitedUsers: (...args: unknown[]) => getInvitedUsers(...args),
      updateUserStatus: (...args: unknown[]) => updateUserStatus(...args),
    },
  }
})

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

const sampleUsers: InvitedUser[] = [
  {
    id: "u1",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    role: "tenant",
    createdAt: "2026-01-01T00:00:00Z",
    invitedBy: "manager-1",
    propertyCount: 1,
    isActive: true,
  },
  {
    id: "u2",
    firstName: "Bob",
    lastName: "Smith",
    email: "bob@example.com",
    role: "owner",
    createdAt: "2026-01-02T00:00:00Z",
    invitedBy: "manager-1",
    propertyCount: 2,
    isActive: true,
  },
]

describe("SharedTenantsView", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getInvitedUsers.mockResolvedValue({ users: sampleUsers })
  })

  it("filters invited users down to tenants", async () => {
    render(<SharedTenantsView title="Tenants" />)

    await waitFor(() => expect(getInvitedUsers).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeInTheDocument())

    // Owner row must NOT render — role filter is client-side.
    expect(screen.queryByText("Bob Smith")).not.toBeInTheDocument()
  })

  it("shows the loading state while the fetch is pending", () => {
    getInvitedUsers.mockReturnValueOnce(new Promise(() => {}))
    render(<SharedTenantsView title="Tenants" />)
    expect(screen.getByText(/Loading tenants…/)).toBeInTheDocument()
  })
})
