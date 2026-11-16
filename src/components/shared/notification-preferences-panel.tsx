import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, Mail, Smartphone, MessageSquare } from "lucide-react"
import { ReferralShareWidget } from "@/components/shared/referral-share-widget"
import { useToast } from "@/hooks/use-toast"
import {
  notificationsApi,
  type NotificationPreferences,
  type NotificationPreferencesUpdate,
} from "@/lib/api/clients/notifications"

// Each toggle is one boolean column of `notification_preferences` (flat camelCase on the wire).
// Channels are global on/off switches; categories are not per-channel in the schema.
type ChannelKey = "emailEnabled" | "pushEnabled" | "smsEnabled"
type CategoryKey =
  | "maintenanceUpdates"
  | "paymentReminders"
  | "leaseAlerts"
  | "newListings"
  | "documentUploads"
  | "vendorUpdates"
  | "financialReports"
  | "communityUpdates"

const CHANNELS: { key: ChannelKey; label: string; icon: React.ReactNode }[] = [
  { key: "emailEnabled", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { key: "pushEnabled", label: "Push", icon: <Smartphone className="h-4 w-4" /> },
  { key: "smsEnabled", label: "SMS", icon: <MessageSquare className="h-4 w-4" /> },
]

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "maintenanceUpdates", label: "Maintenance Updates" },
  { key: "paymentReminders", label: "Payment Reminders" },
  { key: "leaseAlerts", label: "Lease Alerts" },
  { key: "newListings", label: "New Listings" },
  { key: "documentUploads", label: "Document Uploads" },
  { key: "vendorUpdates", label: "Vendor Updates" },
  { key: "financialReports", label: "Financial Reports" },
  { key: "communityUpdates", label: "Community Updates" },
]

interface QuietHours {
  enabled: boolean
  start: string
  end: string
}

export type PreferenceToggles = Record<ChannelKey | CategoryKey, boolean>

export interface PreferencesForm {
  toggles: PreferenceToggles
  quietHours: QuietHours
}

const DEFAULT_QUIET_START = "22:00"
const DEFAULT_QUIET_END = "07:00"

// Mirrors PREFERENCE_DEFAULTS in the Edge notifications route (used until the first load lands).
function defaultForm(): PreferencesForm {
  return {
    toggles: {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      maintenanceUpdates: true,
      paymentReminders: true,
      leaseAlerts: true,
      newListings: true,
      documentUploads: true,
      vendorUpdates: true,
      financialReports: true,
      communityUpdates: true,
    },
    quietHours: { enabled: false, start: DEFAULT_QUIET_START, end: DEFAULT_QUIET_END },
  }
}

/** Postgres `time` comes back as "HH:MM:SS"; <input type="time"> wants "HH:MM". */
function toInputTime(value: string | null | undefined): string | null {
  return typeof value === "string" && value.length >= 5 ? value.slice(0, 5) : null
}

/** GET /notifications/preferences → form state. Missing fields keep the server defaults. */
export function preferencesToForm(prefs: Partial<NotificationPreferences>): PreferencesForm {
  const form = defaultForm()
  for (const key of Object.keys(form.toggles) as (keyof PreferenceToggles)[]) {
    const value = prefs[key]
    if (typeof value === "boolean") form.toggles[key] = value
  }
  const start = toInputTime(prefs.quietHoursStart)
  const end = toInputTime(prefs.quietHoursEnd)
  // No `quiet_hours_enabled` column: quiet hours are on when both ends are set.
  form.quietHours = {
    enabled: start !== null && end !== null,
    start: start ?? DEFAULT_QUIET_START,
    end: end ?? DEFAULT_QUIET_END,
  }
  return form
}

/** Form state → PUT /notifications/preferences body. Disabled quiet hours clear both columns. */
export function formToPreferencesUpdate(form: PreferencesForm): NotificationPreferencesUpdate {
  return {
    ...form.toggles,
    quietHoursStart: form.quietHours.enabled ? form.quietHours.start : null,
    quietHoursEnd: form.quietHours.enabled ? form.quietHours.end : null,
  }
}

export function NotificationPreferencesPanel() {
  const { toast } = useToast()
  const [form, setForm] = useState<PreferencesForm>(defaultForm())
  const [loading, setLoading] = useState(true)
  // Without the saved values the form would show defaults, and saving them would
  // overwrite the user's real choices, so a failed load offers a retry instead.
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      setLoadFailed(false)
      const data = await notificationsApi.getPreferences()
      setForm(preferencesToForm(data))
    } catch (error) {
      setLoadFailed(true)
      toast({
        title: "Failed to load preferences",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (form.quietHours.enabled && (!form.quietHours.start || !form.quietHours.end)) {
      toast({ title: "Set both a start and end time for quiet hours", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const saved = await notificationsApi.updatePreferences(formToPreferencesUpdate(form))
      setForm(preferencesToForm(saved))
      toast({ title: "Preferences saved" })
    } catch (error) {
      toast({
        title: "Failed to save preferences",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key: keyof PreferenceToggles) => {
    setForm((prev) => ({
      ...prev,
      toggles: { ...prev.toggles, [key]: !prev.toggles[key] },
    }))
  }

  const toggleQuietHours = () => {
    setForm((prev) => ({
      ...prev,
      quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled },
    }))
  }

  const setQuietTime = (field: "start" | "end", value: string) => {
    setForm((prev) => ({
      ...prev,
      quietHours: { ...prev.quietHours, [field]: value },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadFailed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Preferences</CardTitle>
          <CardDescription>Your saved preferences could not be loaded.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={load}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Preferences</h2>
          <p className="text-sm text-muted-foreground">Choose what you get notified about and how.</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Channels</CardTitle>
          <CardDescription>Turn each delivery channel on or off.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {CHANNELS.map(({ key, label, icon }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <Label htmlFor={`pref-${key}`} className="flex items-center gap-2 text-sm font-medium">
                {icon} {label}
              </Label>
              <Switch id={`pref-${key}`} checked={form.toggles[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
          <CardDescription>Choose which kinds of notifications you receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {CATEGORIES.map(({ key, label }, index) => (
            <div key={key}>
              {index > 0 && <Separator />}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor={`pref-${key}`} className="text-sm font-medium">{label}</Label>
                <Switch id={`pref-${key}`} checked={form.toggles[key]} onCheckedChange={() => toggle(key)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quiet hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Quiet Hours</CardTitle>
              <CardDescription>Suppress push and SMS during these hours.</CardDescription>
            </div>
            <Switch
              aria-label="Quiet hours"
              checked={form.quietHours.enabled}
              onCheckedChange={toggleQuietHours}
            />
          </div>
        </CardHeader>
        {form.quietHours.enabled && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-hours-start">Start</Label>
                <Input
                  id="quiet-hours-start"
                  type="time"
                  value={form.quietHours.start}
                  onChange={(e) => setQuietTime("start", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-hours-end">End</Label>
                <Input
                  id="quiet-hours-end"
                  type="time"
                  value={form.quietHours.end}
                  onChange={(e) => setQuietTime("end", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <ReferralShareWidget />
    </div>
  )
}
