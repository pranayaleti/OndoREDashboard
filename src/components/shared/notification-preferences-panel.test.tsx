import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { NotificationPreferences } from "@/lib/api/clients/notifications"
import {
  NotificationPreferencesPanel,
  formToPreferencesUpdate,
  preferencesToForm,
} from "./notification-preferences-panel"

const { mockApi, mockToast } = vi.hoisted(() => ({
  mockApi: {
    getPreferences: vi.fn(),
    updatePreferences: vi.fn(),
  },
  mockToast: vi.fn(),
}))

vi.mock("@/lib/api/clients/notifications", () => ({
  notificationsApi: mockApi,
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock("@/components/shared/referral-share-widget", () => ({
  ReferralShareWidget: () => null,
}))

// Shape returned by the Edge GET /notifications/preferences handler.
function serverPrefs(overrides: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return {
    userId: "user-1",
    emailEnabled: true,
    pushEnabled: false,
    smsEnabled: true,
    maintenanceUpdates: true,
    paymentReminders: false,
    leaseAlerts: true,
    newListings: false,
    documentUploads: true,
    vendorUpdates: false,
    financialReports: true,
    communityUpdates: false,
    dailyAiSummary: false,
    quietHoursStart: "21:30:00",
    quietHoursEnd: "06:45:00",
    emailNotifications: true,
    pushNotifications: false,
    maintenanceAlerts: true,
    tenantNotifications: true,
    reportNotifications: true,
    ...overrides,
  }
}

const switchFor = (name: string) => screen.getByRole("switch", { name })

describe("notification preference mapping", () => {
  it("maps the flat server row onto the toggles and trims quiet hours to HH:MM", () => {
    const form = preferencesToForm(serverPrefs())
    expect(form.toggles).toEqual({
      emailEnabled: true,
      pushEnabled: false,
      smsEnabled: true,
      maintenanceUpdates: true,
      paymentReminders: false,
      leaseAlerts: true,
      newListings: false,
      documentUploads: true,
      vendorUpdates: false,
      financialReports: true,
      communityUpdates: false,
    })
    expect(form.quietHours).toEqual({ enabled: true, start: "21:30", end: "06:45" })
  })

  it("treats null quiet hours as disabled and keeps defaults for missing fields", () => {
    const form = preferencesToForm({ emailEnabled: false, quietHoursStart: null, quietHoursEnd: null })
    expect(form.toggles.emailEnabled).toBe(false)
    expect(form.toggles.pushEnabled).toBe(true)
    expect(form.toggles.smsEnabled).toBe(false)
    expect(form.quietHours.enabled).toBe(false)
  })

  it("builds a flat camelCase PUT body and clears quiet hours when disabled", () => {
    const form = preferencesToForm(serverPrefs())
    form.quietHours.enabled = false
    const body = formToPreferencesUpdate(form)
    expect(body).toEqual({ ...form.toggles, quietHoursStart: null, quietHoursEnd: null })
    expect(body).not.toHaveProperty("categories")
    expect(body).not.toHaveProperty("quietHours")
  })
})

describe("NotificationPreferencesPanel", () => {
  beforeEach(() => {
    mockApi.getPreferences.mockReset()
    mockApi.updatePreferences.mockReset()
    mockToast.mockReset()
  })

  it("loads the saved values into the switches", async () => {
    mockApi.getPreferences.mockResolvedValue(serverPrefs())
    render(<NotificationPreferencesPanel />)

    await screen.findByText("Notification Preferences")
    expect(switchFor("Email")).toHaveAttribute("aria-checked", "true")
    expect(switchFor("Push")).toHaveAttribute("aria-checked", "false")
    expect(switchFor("SMS")).toHaveAttribute("aria-checked", "true")
    expect(switchFor("Payment Reminders")).toHaveAttribute("aria-checked", "false")
    expect(switchFor("Lease Alerts")).toHaveAttribute("aria-checked", "true")
    expect(switchFor("Quiet hours")).toHaveAttribute("aria-checked", "true")
    expect(screen.getByLabelText("Start")).toHaveValue("21:30")
    expect(screen.getByLabelText("End")).toHaveValue("06:45")
  })

  it("sends the toggled value in the flat PUT body", async () => {
    mockApi.getPreferences.mockResolvedValue(serverPrefs({ quietHoursStart: null, quietHoursEnd: null }))
    mockApi.updatePreferences.mockImplementation(async (body) => serverPrefs(body))
    render(<NotificationPreferencesPanel />)

    fireEvent.click(await screen.findByRole("switch", { name: "Push" }))
    fireEvent.click(switchFor("Payment Reminders"))
    fireEvent.click(screen.getByRole("button", { name: /save/i }))

    await waitFor(() => expect(mockApi.updatePreferences).toHaveBeenCalledTimes(1))
    expect(mockApi.updatePreferences).toHaveBeenCalledWith({
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: true,
      maintenanceUpdates: true,
      paymentReminders: true,
      leaseAlerts: true,
      newListings: false,
      documentUploads: true,
      vendorUpdates: false,
      financialReports: true,
      communityUpdates: false,
      quietHoursStart: null,
      quietHoursEnd: null,
    })
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith({ title: "Preferences saved" }))
  })

  it("does not offer to save defaults over preferences that failed to load", async () => {
    mockApi.getPreferences.mockRejectedValueOnce(new Error("Service unavailable"))
    mockApi.getPreferences.mockResolvedValueOnce(serverPrefs({ emailEnabled: false }))
    render(<NotificationPreferencesPanel />)

    // Before the fix the defaults (email on) rendered with a live Save button.
    const retry = await screen.findByRole("button", { name: /retry/i })
    expect(screen.queryByRole("switch", { name: "Email" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()

    fireEvent.click(retry)
    expect(await screen.findByRole("switch", { name: "Email" })).toHaveAttribute("aria-checked", "false")
    expect(mockApi.updatePreferences).not.toHaveBeenCalled()
    expect(mockApi.getPreferences).toHaveBeenCalledTimes(2)
  })

  it("shows the server message when saving fails", async () => {
    mockApi.getPreferences.mockResolvedValue(serverPrefs())
    mockApi.updatePreferences.mockRejectedValue(new Error("Invalid preferences"))
    render(<NotificationPreferencesPanel />)

    fireEvent.click(await screen.findByRole("button", { name: /save/i }))

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith({
        title: "Failed to save preferences",
        description: "Invalid preferences",
        variant: "destructive",
      }),
    )
  })
})
