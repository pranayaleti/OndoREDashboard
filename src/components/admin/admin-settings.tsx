import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Settings, Shield, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserTimezone } from "@/hooks/use-user-timezone"

export default function AdminSettings() {
  const { toast } = useToast()
  const { storageTimezone } = useUserTimezone()
  const [settings, setSettings] = useState({
    notifications: {
      propertyAlerts: true,
      userUpdates: true,
      systemAlerts: true,
    },
    security: {
      twoFactor: false,
      sessionTimeout: "60",
      loginAlerts: true,
      timezone: storageTimezone?.iana || "America/Denver",
    }
  })

  const handleToggleChange = (category: string, setting: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [setting]: !(prev[category as keyof typeof prev] as any)[setting],
      },
    }))
    toast({
      title: "Settings Updated",
      description: "Your settings have been saved successfully.",
      duration: 3000,
    })
  }

  const handleSettingChange = (category: string, setting: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }))
    toast({
      title: "Settings Updated",
      description: "Your settings have been saved successfully.",
      duration: 3000,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Settings", icon: Settings }]} />
      </div>
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-8 h-8 text-blue-400" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Administrative preferences and configuration</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Property Alerts</Label>
                <p className="text-sm text-gray-500">Receive alerts about property submissions</p>
              </div>
              <Switch
                checked={settings.notifications.propertyAlerts}
                onCheckedChange={() => handleToggleChange("notifications", "propertyAlerts")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>User Updates</Label>
                <p className="text-sm text-gray-500">Notifications about user activities</p>
              </div>
              <Switch
                checked={settings.notifications.userUpdates}
                onCheckedChange={() => handleToggleChange("notifications", "userUpdates")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>System Alerts</Label>
                <p className="text-sm text-gray-500">Important system notifications</p>
              </div>
              <Switch
                checked={settings.notifications.systemAlerts}
                onCheckedChange={() => handleToggleChange("notifications", "systemAlerts")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Manage your account security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <Switch
                checked={settings.security.twoFactor}
                onCheckedChange={() => handleToggleChange("security", "twoFactor")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Login Alerts</Label>
                <p className="text-sm text-gray-500">Get notified of new login attempts</p>
              </div>
              <Switch
                checked={settings.security.loginAlerts}
                onCheckedChange={() => handleToggleChange("security", "loginAlerts")}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Session Timeout (minutes)</Label>
                <Select
                  value={settings.security.sessionTimeout}
                  onValueChange={(value) => handleSettingChange("security", "sessionTimeout", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select
                  value={settings.security.timezone}
                  onValueChange={(value) => handleSettingChange("security", "timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

