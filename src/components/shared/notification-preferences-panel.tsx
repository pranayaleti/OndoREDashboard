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
import { apiGet, apiPut } from "@/lib/api/http"

interface ChannelToggles {
  email: boolean
  push: boolean
  sms: boolean
}

interface QuietHours {
  enabled: boolean
  start: string
  end: string
}

interface NotificationPreferences {
  categories: Record<string, ChannelToggles>
  quietHours: QuietHours
}

const CATEGORY_LABELS: Record<string, string> = {
  maintenance_updates: "Maintenance Updates",
  payment_reminders: "Payment Reminders",
  lease_alerts: "Lease Alerts",
  new_listings: "New Listings",
  document_uploads: "Document Uploads",
  vendor_updates: "Vendor Updates",
  financial_reports: "Financial Reports",
  community_updates: "Community Updates",
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  push: <Smartphone className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
}

function defaultPrefs(): NotificationPreferences {
  const categories: Record<string, ChannelToggles> = {}
  for (const key of Object.keys(CATEGORY_LABELS)) {
    categories[key] = { email: true, push: true, sms: false }
  }
  return { categories, quietHours: { enabled: false, start: "22:00", end: "07:00" } }
}

export function NotificationPreferencesPanel() {
  const { toast } = useToast()
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const data = await apiGet<NotificationPreferences>("/notifications/preferences")
      setPrefs({ ...defaultPrefs(), ...data })
    } catch {
      toast({ title: "Failed to load preferences", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      await apiPut("/notifications/preferences", prefs)
      toast({ title: "Preferences saved" })
    } catch {
      toast({ title: "Failed to save preferences", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const toggleCategory = (category: string, channel: keyof ChannelToggles) => {
    setPrefs((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories[category],
          [channel]: !prev.categories[category]?.[channel],
        },
      },
    }))
  }

  const toggleQuietHours = () => {
    setPrefs((prev) => ({
      ...prev,
      quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled },
    }))
  }

  const setQuietTime = (field: "start" | "end", value: string) => {
    setPrefs((prev) => ({
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

      {/* Channel header legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
          <CardDescription>Toggle channels for each notification category.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-4 pb-2 text-xs font-medium text-muted-foreground">
            <span>Category</span>
            <span className="flex items-center gap-1 justify-center">{CHANNEL_ICONS.email} Email</span>
            <span className="flex items-center gap-1 justify-center">{CHANNEL_ICONS.push} Push</span>
            <span className="flex items-center gap-1 justify-center">{CHANNEL_ICONS.sms} SMS</span>
          </div>
          <Separator />

          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <div key={key} className="grid grid-cols-4 items-center gap-4 py-2">
              <span className="text-sm font-medium">{label}</span>
              {(["email", "push", "sms"] as const).map((ch) => (
                <div key={ch} className="flex justify-center">
                  <Switch
                    checked={prefs.categories[key]?.[ch] ?? false}
                    onCheckedChange={() => toggleCategory(key, ch)}
                  />
                </div>
              ))}
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
            <Switch checked={prefs.quietHours.enabled} onCheckedChange={toggleQuietHours} />
          </div>
        </CardHeader>
        {prefs.quietHours.enabled && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input type="time" value={prefs.quietHours.start} onChange={(e) => setQuietTime("start", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input type="time" value={prefs.quietHours.end} onChange={(e) => setQuietTime("end", e.target.value)} />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <ReferralShareWidget />
    </div>
  )
}
