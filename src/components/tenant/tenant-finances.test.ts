import { describe, it, expect } from "vitest"

function calcYtdTotal(payments: Array<{ amountCents: number; status: string; createdAt: string }>): number {
  const year = new Date().getFullYear()
  return payments
    .filter((p) => p.status === "succeeded" && new Date(p.createdAt).getFullYear() === year)
    .reduce((sum, p) => sum + p.amountCents / 100, 0)
}

function calcOnTimeRate(payments: Array<{ status: string }>): number {
  if (payments.length === 0) return 0
  const succeeded = payments.filter((p) => p.status === "succeeded").length
  return Math.round((succeeded / payments.length) * 100)
}

function getNextDueDate(moveInDateIso: string): Date {
  const moveIn = new Date(moveInDateIso)
  const now = new Date()
  const next = new Date(moveIn)
  while (next <= now) {
    next.setMonth(next.getMonth() + 1)
  }
  return next
}

describe("tenant-finances derived metrics", () => {
  const thisYear = new Date().getFullYear()

  it("calcYtdTotal sums only succeeded payments in current year", () => {
    const payments = [
      { amountCents: 185000, status: "succeeded", createdAt: `${thisYear}-01-15T00:00:00Z` },
      { amountCents: 185000, status: "failed", createdAt: `${thisYear}-02-15T00:00:00Z` },
      { amountCents: 185000, status: "succeeded", createdAt: `${thisYear - 1}-12-15T00:00:00Z` },
    ]
    expect(calcYtdTotal(payments)).toBe(1850)
  })

  it("calcYtdTotal returns 0 for empty list", () => {
    expect(calcYtdTotal([])).toBe(0)
  })

  it("calcOnTimeRate returns 0 for empty list", () => {
    expect(calcOnTimeRate([])).toBe(0)
  })

  it("calcOnTimeRate rounds correctly", () => {
    const payments = [
      { status: "succeeded" },
      { status: "succeeded" },
      { status: "failed" },
    ]
    expect(calcOnTimeRate(payments)).toBe(67)
  })

  it("getNextDueDate returns a future date", () => {
    const pastDate = new Date()
    pastDate.setFullYear(pastDate.getFullYear() - 1)
    const next = getNextDueDate(pastDate.toISOString())
    expect(next > new Date()).toBe(true)
  })
})
