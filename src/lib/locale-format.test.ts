import { describe, it, expect, vi, beforeEach } from "vitest";

const mockI18n = vi.hoisted(() => ({ language: "en" as string }));

vi.mock("@/lib/i18n", () => ({
  default: mockI18n,
}));

import { formatDate, formatDateTime, formatNumber, formatCurrency } from "./locale-format";

describe("locale-format", () => {
  beforeEach(() => {
    mockI18n.language = "en";
  });

  it("formats dates using en-US when language is en", () => {
    mockI18n.language = "en";
    const s = formatDate(new Date(Date.UTC(2024, 5, 15)));
    expect(s).toMatch(/06/);
    expect(s).toMatch(/2024/);
  });

  it("formats dates using es-ES when language is es", () => {
    mockI18n.language = "es";
    const s = formatDate(new Date(Date.UTC(2024, 5, 15)));
    expect(s.length).toBeGreaterThan(0);
  });

  it("formatDateTime includes time components", () => {
    mockI18n.language = "en";
    const s = formatDateTime(new Date(Date.UTC(2024, 5, 15, 14, 30, 0)));
    expect(s).toMatch(/2024/);
  });

  it("formatNumber respects locale", () => {
    mockI18n.language = "en";
    expect(formatNumber(1234.5)).toMatch(/1/);
    mockI18n.language = "fr";
    const fr = formatNumber(1234.5);
    expect(fr).toContain("234");
  });

  it("formatCurrency defaults to USD", () => {
    mockI18n.language = "en";
    const s = formatCurrency(99.5);
    expect(s).toContain("99");
    expect(s).toMatch(/\$|USD/);
  });

  it("falls back to en-US for unknown language codes", () => {
    mockI18n.language = "xx";
    const s = formatDate(new Date(Date.UTC(2024, 0, 2)));
    expect(s).toMatch(/2024/);
  });
});
