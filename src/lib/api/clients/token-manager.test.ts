import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Who may call POST /auth/refresh. The refresh cookie is HttpOnly on the API's
 * origin, so the token manager cannot see it: a browser that signed in may
 * refresh, a visitor who never did must not (the endpoint can only answer 401).
 *
 * `pageLoad()` re-evaluates the module, dropping in-memory state the way a
 * reload does while localStorage survives.
 */

const fetchMock = vi.fn<typeof fetch>();

async function pageLoad(): Promise<typeof import("./token-manager")> {
  vi.resetModules();
  return import("./token-manager");
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function refreshCalls() {
  return fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/auth/refresh"));
}

beforeEach(() => {
  localStorage.clear();
  // A browser that has already spent its one-time post-deploy probe (see token-manager.ts).
  localStorage.setItem("ondo_session_probe_v1", "1");
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("token-manager refresh", () => {
  it("never calls /auth/refresh for a visitor who has not signed in", async () => {
    const tm = await pageLoad();

    expect(tm.hasSession()).toBe(false);
    await expect(tm.getValidAccessToken()).resolves.toBeNull();
    await expect(tm.refreshAccessToken()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes a signed-in user's expired access token", async () => {
    const tm = await pageLoad();
    tm.setAccessToken("login-token", 900);
    const fifteenMinutesLater = Date.now() + 15 * 60 * 1000;
    vi.spyOn(Date, "now").mockReturnValue(fifteenMinutesLater);
    fetchMock.mockResolvedValueOnce(json(200, { accessToken: "fresh-token", expiresIn: 900 }));

    await expect(tm.getValidAccessToken()).resolves.toBe("fresh-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/auth\/refresh$/);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", credentials: "include" });
  });

  it("restores a signed-in user's session on the next page load", async () => {
    (await pageLoad()).setAccessToken("login-token", 900);

    const tm = await pageLoad();
    fetchMock.mockResolvedValueOnce(json(200, { accessToken: "fresh-token", expiresIn: 900 }));

    expect(tm.getAccessToken()).toBeNull();
    await expect(tm.getValidAccessToken()).resolves.toBe("fresh-token");
    expect(refreshCalls()).toHaveLength(1);
  });

  it("ends the session when the backend rejects the refresh cookie", async () => {
    (await pageLoad()).setAccessToken("login-token", 900);

    const tm = await pageLoad();
    fetchMock.mockResolvedValueOnce(json(401, { code: "REFRESH_TOKEN_INVALID" }));
    await expect(tm.refreshAccessToken()).resolves.toBeNull();
    expect(tm.hasSession()).toBe(false);

    const next = await pageLoad();
    await expect(next.getValidAccessToken()).resolves.toBeNull();
    expect(refreshCalls()).toHaveLength(1);
  });

  it("keeps the session through a refresh failure that is not a 401", async () => {
    (await pageLoad()).setAccessToken("login-token", 900);

    const tm = await pageLoad();
    fetchMock.mockResolvedValueOnce(json(503, { message: "Service unavailable" }));
    await expect(tm.refreshAccessToken()).resolves.toBeNull();

    const next = await pageLoad();
    fetchMock.mockResolvedValueOnce(json(200, { accessToken: "fresh-token", expiresIn: 900 }));
    await expect(next.getValidAccessToken()).resolves.toBe("fresh-token");
    expect(refreshCalls()).toHaveLength(2);
  });

  it("forgets the session on logout", async () => {
    const tm = await pageLoad();
    tm.setAccessToken("login-token", 900);
    tm.endSession();
    expect(tm.hasSession()).toBe(false);

    const next = await pageLoad();
    await expect(next.getValidAccessToken()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not bring the session back when a refresh lands after logout", async () => {
    (await pageLoad()).setAccessToken("login-token", 900);
    const tm = await pageLoad();
    let answer!: (res: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (answer = resolve)));

    // Logout fires while the refresh started by the first API call is still in flight.
    const pending = tm.getValidAccessToken();
    tm.endSession();
    answer(json(200, { accessToken: "late-token", expiresIn: 900 }));

    await expect(pending).resolves.toBeNull();
    expect(tm.getAccessToken()).toBeNull();
    expect(tm.hasSession()).toBe(false);

    const next = await pageLoad();
    await expect(next.getValidAccessToken()).resolves.toBeNull();
    expect(refreshCalls()).toHaveLength(1);
  });

  it("keeps a login that completes while a stale refresh is being rejected", async () => {
    (await pageLoad()).setAccessToken("old-token", 900);
    const tm = await pageLoad();
    let answer!: (res: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => (answer = resolve)));

    // Page load starts a refresh with an expired cookie; the user signs in before it answers.
    const restore = tm.refreshAccessToken();
    tm.setAccessToken("login-token", 900);
    answer(json(401, { code: "REFRESH_TOKEN_INVALID" }));

    await expect(restore).resolves.toBe("login-token");
    expect(tm.getAccessToken()).toBe("login-token");
    expect(tm.hasSession()).toBe(true);

    const next = await pageLoad();
    fetchMock.mockResolvedValueOnce(json(200, { accessToken: "fresh-token", expiresIn: 900 }));
    await expect(next.getValidAccessToken()).resolves.toBe("fresh-token");
  });

  it("still tries the refresh cookie when localStorage cannot be read", async () => {
    const tm = await pageLoad();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    fetchMock.mockResolvedValueOnce(json(200, { accessToken: "fresh-token", expiresIn: 900 }));

    await expect(tm.getValidAccessToken()).resolves.toBe("fresh-token");
    expect(refreshCalls()).toHaveLength(1);
  });
});

describe("token-manager one-time session probe", () => {
  it("tries the refresh cookie once in a browser that signed in before the session flag existed", async () => {
    localStorage.removeItem("ondo_session_probe_v1");
    fetchMock.mockResolvedValue(json(200, { accessToken: "a1", expiresIn: 900 }));

    const tm = await pageLoad();
    expect(await tm.refreshAccessToken()).toBe("a1");
    expect(refreshCalls()).toHaveLength(1);
    expect(localStorage.getItem("ondo_has_session")).toBe("1");
  });

  it("gives a visitor who never signed in a single 401, then no more refresh calls", async () => {
    localStorage.removeItem("ondo_session_probe_v1");
    fetchMock.mockResolvedValue(json(401, { message: "No refresh token" }));

    let tm = await pageLoad();
    expect(await tm.refreshAccessToken()).toBeNull();
    tm = await pageLoad();
    expect(await tm.refreshAccessToken()).toBeNull();
    tm = await pageLoad();
    await tm.getValidAccessToken();
    expect(refreshCalls()).toHaveLength(1);
  });
});
