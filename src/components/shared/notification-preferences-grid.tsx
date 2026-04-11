import { Bell } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export interface NotificationPreferenceValues {
  rentDueReminders: boolean
  maintenanceUpdates: boolean
  leaseExpiryAlerts: boolean
  newMessages: boolean
  paymentConfirmations: boolean
}

interface NotificationPreferencesGridProps {
  title?: string
  description?: string
  values: NotificationPreferenceValues
  onToggle: (key: keyof NotificationPreferenceValues) => void
}

const preferenceLabels: Array<{
  key: keyof NotificationPreferenceValues
  label: string
  description: string
}> = [
  {
    key: "rentDueReminders",
    label: "Rent Due Reminders",
    description: "Upcoming rent due dates and late-payment nudges.",
  },
  {
    key: "maintenanceUpdates",
    label: "Maintenance Updates",
    description: "New tickets, scheduling changes, and resolution updates.",
  },
  {
    key: "leaseExpiryAlerts",
    label: "Lease Expiry Alerts",
    description: "Renewal deadlines and lease-end countdowns.",
  },
  {
    key: "newMessages",
    label: "New Messages",
    description: "Unread inbox activity across the portal.",
  },
  {
    key: "paymentConfirmations",
    label: "Payment Confirmations",
    description: "Successful rent and fee payment confirmations.",
  },
]

export function NotificationPreferencesGrid({
  title = "Notification Preferences",
  description = "Choose which updates should be highlighted in your demo profile settings.",
  values,
  onToggle,
}: NotificationPreferencesGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {preferenceLabels.map((preference) => (
          <div key={preference.key} className="rounded-2xl border p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor={`notification-${preference.key}`} className="font-medium">
                  {preference.label}
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">{preference.description}</p>
              </div>
              <Switch
                id={`notification-${preference.key}`}
                checked={values[preference.key]}
                onCheckedChange={() => onToggle(preference.key)}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
