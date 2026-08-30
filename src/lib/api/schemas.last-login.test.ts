import { describe, expect, it } from "vitest"
import { UserSchema } from "./schemas"

const baseUser = {
  id: "u1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  role: "owner",
}

describe("UserSchema last login fields", () => {
  it("accepts a user payload without last login (older API)", () => {
    const parsed = UserSchema.parse(baseUser)
    expect(parsed.lastLoginAt).toBeUndefined()
  })

  it("keeps last login snapshot fields from GET /auth/me", () => {
    const parsed = UserSchema.parse({
      ...baseUser,
      lastLoginAt: "2026-08-30T14:00:00.000Z",
      lastLoginIp: "203.0.113.10",
      lastLoginDevice: "Desktop",
      lastLoginBrowser: "Chrome",
    })
    expect(parsed.lastLoginAt).toBe("2026-08-30T14:00:00.000Z")
    expect(parsed.lastLoginDevice).toBe("Desktop")
    expect(parsed.lastLoginBrowser).toBe("Chrome")
    expect(parsed.lastLoginIp).toBe("203.0.113.10")
  })
})
