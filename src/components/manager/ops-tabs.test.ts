import { describe, expect, it } from "vitest"
import { rewriteInvalidOpsTabSearch, tabFromSearch } from "./ops-tabs"

describe("tabFromSearch", () => {
  it("defaults missing and invalid tabs to inspections", () => {
    expect(tabFromSearch(new URLSearchParams())).toBe("inspections")
    expect(tabFromSearch(new URLSearchParams("tab=not-a-real-tab"))).toBe("inspections")
  })

  it("keeps a valid tab", () => {
    expect(tabFromSearch(new URLSearchParams("tab=floor-plans"))).toBe("floor-plans")
  })
})

describe("rewriteInvalidOpsTabSearch", () => {
  it("does not rewrite a missing tab (inspections is the default)", () => {
    expect(rewriteInvalidOpsTabSearch(new URLSearchParams())).toBeNull()
  })

  it("does not rewrite a valid tab", () => {
    expect(rewriteInvalidOpsTabSearch(new URLSearchParams("tab=leases&leaseId=abc"))).toBeNull()
  })

  it("replaces an invalid tab with inspections and preserves leaseId", () => {
    const rewritten = rewriteInvalidOpsTabSearch(
      new URLSearchParams("tab=not-a-real-tab&leaseId=lease-1"),
    )
    expect(rewritten).not.toBeNull()
    expect(rewritten?.get("tab")).toBe("inspections")
    expect(rewritten?.get("leaseId")).toBe("lease-1")
  })
})
