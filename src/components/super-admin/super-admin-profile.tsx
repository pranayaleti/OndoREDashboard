import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ProfileShell, ProfileSummaryCard } from "@/components/portal/profile"
import { PaymentMethods } from "@/components/ui/payment-methods"
import { ChangePasswordDialog } from "@/components/ui/change-password-dialog"
import { TwoFactorAuthDialog } from "@/components/ui/two-factor-auth-dialog"
import { Shield, Bell, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"
import { US_TIMEZONES } from "@/constants"
import { useUserTimezone } from "@/hooks/use-user-timezone"
import { LoginHistory } from "@/components/shared/login-history"

export default function SuperAdminProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false)
  const [settings, setSettings] = useState({
    security: {
      twoFactor: false,
      sessionTimeout: "60",
      loginAlerts: true,
      timezone: "America/Denver",
    },
  })
  const { displayTimezone, storageTimezone } = useUserTimezone()

  const handleSettingChange = (category: string, subcategory: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [subcategory]: value,
      },
    }))
  }

  const handleToggleChange = (category: string, subcategory: string, setting: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [subcategory]: {
          ...(prev[category as keyof typeof prev] as any)[subcategory],
          [setting]: !(prev[category as keyof typeof prev] as any)[subcategory][setting],
        },
      },
    }))
  }

  return (
    <ProfileShell
      title="Super Admin Profile"
      description="Manage your super admin account"
      summary={<ProfileSummaryCard roleLabel="Super Admin" />}
    >
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Core information about your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium">Super Admin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <PaymentMethods
            paymentMethods={[
              {
                id: "pm1",
                type: "credit_card",
                brand: "Visa",
                last4: "4242",
                expMonth: 12,
                expYear: 2026,
                isDefault: true,
              },
              {
                id: "pm2",
                type: "credit_card",
                brand: "Mastercard",
                last4: "1881",
                expMonth: 5,
                expYear: 2025,
                isDefault: false,
              },
              {
                id: "pm3",
                type: "ach",
                bank: "US Treasury",
                last4: "1100",
                isDefault: false,
              },
            ]}
            onAddPaymentMethod={() => {
              toast({
                title: "Add Payment Method",
                description: "Payment method dialog would open here.",
              })
            }}
            onSetDefault={(_id) => {
              toast({
                title: "Default Updated",
                description: "Payment method set as default.",
                duration: 3000,
              })
            }}
            onEdit={(id) => {
              toast({
                title: "Edit Payment Method",
                description: `Edit dialog would open for payment method ${id}.`,
              })
            }}
            onRemove={(_id) => {
              toast({
                title: "Payment Method Removed",
                description: "Payment method has been removed.",
              })
            }}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>View and manage all your notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">View All Notifications</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Access your detailed notifications page to see all alerts, updates, and important messages
                </p>
                <Link to="/super-admin/notifications">
                  <Button size="lg" className="gap-2">
                    Go to Notifications
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactor}
                    onCheckedChange={() => setIs2FADialogOpen(true)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Login Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                  </div>
                  <Switch
                    checked={settings.security.loginAlerts}
                    onCheckedChange={() => handleToggleChange("security", "loginAlerts", "true")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Session Timeout (minutes)</Label>
                    <Select
                      value={settings.security.sessionTimeout}
                      onValueChange={(value) => handleSettingChange("security", "sessionTimeout", value)}
                    >
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={settings.security.timezone}
                      onValueChange={(value) => handleSettingChange("security", "timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={displayTimezone.display} />
                      </SelectTrigger>
                      <SelectContent>
                        {US_TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Showing local time as {displayTimezone.display}. Records are saved using {storageTimezone.display}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Password & Access</h4>
                <div className="space-y-4">
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login History */}
          <LoginHistory />
        </TabsContent>
      </Tabs>
      <ChangePasswordDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
      <TwoFactorAuthDialog
        open={is2FADialogOpen}
        onOpenChange={setIs2FADialogOpen}
        currentValue={settings.security.twoFactor}
        onConfirm={(enabled) => {
          setSettings((prev) => ({
            ...prev,
            security: {
              ...prev.security,
              twoFactor: enabled,
            },
          }))
        }}
      />
    </ProfileShell>
  )
}

