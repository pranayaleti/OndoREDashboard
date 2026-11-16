import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, useLocation } from "react-router-dom"
import { AuthProvider, useAuth } from "./auth-context"
import { clearAccessToken, endSession } from "@/lib/api/clients/token-manager"

vi.mock("@/lib/i18n", () => ({ default: { changeLanguage: vi.fn() } }))

const OWNER = {
  id: "owner-1",
  firstName: "Olive",
  lastName: "Owner",
  email: "owner@example.com",
  role: "owner",
}

const fetchMock = vi.fn<typeof fetch>()

/** Stands in for the API: login sets the HttpOnly refresh cookie, logout clears it. */
let refreshCookie = false

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function callsTo(path: string) {
  return fetchMock.mock.calls.filter(([url]) => String(url).endsWith(path))
}

function Probe() {
  const { user, isLoading, login, logout } = useAuth()
  const location = useLocation()
  if (isLoading) return <p>Checking session</p>
  return (
    <>
      <p>{user ? `Signed in as ${user.email}` : "Signed out"}</p>
      <p data-testid="location">{`${location.pathname}${location.search}`}</p>
      <button onClick={() => void login(OWNER.email, "correct-horse")}>Log in</button>
      <button onClick={logout}>Log out</button>
    </>
  )
}

/** Mount the app as a page load does: the in-memory access token is gone, localStorage is not. */
function pageLoad() {
  clearAccessToken()
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function logIn() {
  fireEvent.click(await screen.findByRole("button", { name: "Log in" }))
  await screen.findByText(`Signed in as ${OWNER.email}`)
}

beforeEach(() => {
  endSession()
  localStorage.clear()
  // A browser that has already spent its one-time post-deploy probe (see token-manager.ts).
  localStorage.setItem("ondo_session_probe_v1", "1")
  refreshCookie = false
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input) => {
    const url = String(input)
    if (url.endsWith("/auth/login")) {
      refreshCookie = true
      return json(200, { message: "Login successful", accessToken: "login-token", expiresIn: 900, user: OWNER })
    }
    if (url.endsWith("/auth/refresh")) {
      return refreshCookie
        ? json(200, { accessToken: "fresh-token", expiresIn: 900 })
        : json(401, { message: "Refresh token required", code: "REFRESH_TOKEN_MISSING" })
    }
    if (url.endsWith("/auth/me")) return json(200, OWNER)
    if (url.endsWith("/auth/logout")) {
      refreshCookie = false
      return json(200, { message: "Logged out successfully" })
    }
    return json(404, { message: `Unexpected request ${url}` })
  })
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("AuthProvider session restore", () => {
  it("makes no /auth/refresh call for a visitor who never signed in", async () => {
    pageLoad()

    expect(await screen.findByText("Signed out")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("restores a signed-in user on the next page load through /auth/refresh", async () => {
    const firstPage = pageLoad()
    await logIn()
    expect(callsTo("/auth/refresh")).toHaveLength(0)
    firstPage.unmount()

    pageLoad()

    expect(await screen.findByText(`Signed in as ${OWNER.email}`)).toBeInTheDocument()
    expect(callsTo("/auth/refresh")).toHaveLength(1)
    expect(callsTo("/auth/refresh")[0][1]).toMatchObject({ method: "POST", credentials: "include" })
  })

  it("stops refreshing on page load after the user logs out", async () => {
    const firstPage = pageLoad()
    await logIn()
    fireEvent.click(screen.getByRole("button", { name: "Log out" }))
    await screen.findByText("Signed out")
    firstPage.unmount()

    pageLoad()

    expect(await screen.findByText("Signed out")).toBeInTheDocument()
    expect(callsTo("/auth/refresh")).toHaveLength(0)
  })
})

describe("AuthProvider proactive refresh", () => {
  it("does not report an expired session when logout lands during the 12-minute refresh", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    pageLoad()
    await logIn()

    let answerRefresh!: (res: Response) => void
    const defaultFetch = fetchMock.getMockImplementation()!
    fetchMock.mockImplementation((input, init) =>
      String(input).endsWith("/auth/refresh")
        ? new Promise<Response>((resolve) => (answerRefresh = resolve))
        : defaultFetch(input, init),
    )

    await act(async () => {
      vi.advanceTimersByTime(12 * 60 * 1000)
    })
    expect(callsTo("/auth/refresh")).toHaveLength(1)

    fireEvent.click(screen.getByRole("button", { name: "Log out" }))
    await screen.findByText("Signed out")
    await act(async () => {
      answerRefresh(json(200, { accessToken: "late-token", expiresIn: 900 }))
    })

    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/)
  })
})
