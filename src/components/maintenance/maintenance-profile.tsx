import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, User, Mail, Phone, Bell, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ProfileShell, ProfileSummaryCard } from "@/components/portal/profile"
import { AddressForm, type AddressFormValues } from "@/components/forms/address-form"
import { parseAddressString, formatAddressFields } from "@/utils/address"
import { ChangePasswordDialog } from "@/components/ui/change-password-dialog"
import { TwoFactorAuthDialog } from "@/components/ui/two-factor-auth-dialog"
import { US_TIMEZONES } from "@/constants/us"
import { useUserTimezone } from "@/hooks/use-user-timezone"
import { authApi, ApiError } from "@/lib/api"
import { LoginHistory } from "@/components/shared/login-history"

const buildAddressFormValue = (address?: string | null): AddressFormValues => {
  const parsed = parseAddressString(address)
  return {
    addressType: "home",
    addressLine1: parsed.line1,
    addressLine2: parsed.line2,
    city: parsed.city,
    state: parsed.state,
    postalCode: parsed.postalCode,
  }
}

const formatAddressFromForm = (value: AddressFormValues) => {
  return formatAddressFields({
    line1: value.addressLine1,
    line2: value.addressLine2,
    city: value.city,
    state: value.state,
    postalCode: value.postalCode,
  })
}

export default function MaintenanceProfile() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("personal")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  })
  
  const [addressFormValue, setAddressFormValue] = useState<AddressFormValues>(() => buildAddressFormValue(user?.address))
  
  const [settings, setSettings] = useState({
    notifications: {
      email: {
        newTickets: true,
        ticketUpdates: true,
        urgentTickets: true,
        scheduleChanges: true,
      },
      push: {
        urgentTickets: true,
        newAssignments: true,
        scheduleReminders: true,
      },
    },
    security: {
      twoFactor: false,
      sessionTimeout: "60",
      loginAlerts: true,
      timezone: "America/Denver",
    },
    preferences: {
      defaultResponseTime: "24",
      workHours: "standard",
      autoAccept: false,
    },
  })
  
  const { displayTimezone, storageTimezone } = useUserTimezone()

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
      })
      setAddressFormValue(buildAddressFormValue(user.address))
    }
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddressFormChange = (nextValue: AddressFormValues) => {
    setAddressFormValue(nextValue)
  }

  const handleToggleChange = (category: string, subcategory: string, setting: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [subcategory]: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(prev[category as keyof typeof prev] as any)[subcategory],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          [setting]: !(prev[category as keyof typeof prev] as any)[subcategory][setting],
        },
      },
    }))
  }

  const handleSettingChange = (category: string, subcategory: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [subcategory]: value,
      },
    }))
  }

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (First Name, Last Name).",
        variant: "destructive",
      })
      return
    }

    setIsSavingProfile(true)
    try {
      await authApi.updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
        address: formatAddressFromForm(addressFormValue) || undefined,
      })

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
        duration: 3000,
      })
      
      await refreshUser()
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : "Failed to update profile. Please try again."
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <ProfileShell
      title="Maintenance Profile"
      description="Manage your maintenance account"
      summary={<ProfileSummaryCard roleLabel="Maintenance" />}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="personal" className="py-2.5">Personal Info</TabsTrigger>
          <TabsTrigger value="notifications" className="py-2.5">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="py-2.5">Security</TabsTrigger>
          <TabsTrigger value="preferences" className="py-2.5">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="pl-9 h-10"
                      placeholder="First name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="pl-9 h-10"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled={true}
                      className="pl-9 h-10 bg-muted/50 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="pl-9 h-10"
                      placeholder="555-123-4567"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance-profile-address">Address</Label>
                <AddressForm
                  value={addressFormValue}
                  onChange={handleAddressFormChange}
                  disabled={isSavingProfile}
                  idPrefix="maintenance-profile"
                  className="bg-muted/30 shadow-none border border-border/60"
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={isSavingProfile} className="shadow-sm">
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
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
                <Link to="/maintenance/notifications">
                  <Button size="lg" className="gap-2">
                    Go to Notifications
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4 text-base">Notification Preferences</h4>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-4 text-base">Email Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Tickets</Label>
                      <p className="text-sm text-gray-500">Get notified when new tickets are assigned to you</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email.newTickets}
                      onCheckedChange={() => handleToggleChange("notifications", "email", "newTickets")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ticket Updates</Label>
                      <p className="text-sm text-gray-500">Receive updates on ticket status changes</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email.ticketUpdates}
                      onCheckedChange={() => handleToggleChange("notifications", "email", "ticketUpdates")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Urgent Tickets</Label>
                      <p className="text-sm text-gray-500">Emergency and urgent ticket notifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email.urgentTickets}
                      onCheckedChange={() => handleToggleChange("notifications", "email", "urgentTickets")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Schedule Changes</Label>
                      <p className="text-sm text-gray-500">Notifications about schedule modifications</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email.scheduleChanges}
                      onCheckedChange={() => handleToggleChange("notifications", "email", "scheduleChanges")}
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4 text-base">Push Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Urgent Tickets</Label>
                      <p className="text-sm text-gray-500">Push notifications for urgent tickets</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push.urgentTickets}
                      onCheckedChange={() => handleToggleChange("notifications", "push", "urgentTickets")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Assignments</Label>
                      <p className="text-sm text-gray-500">Get notified when assigned to new tickets</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push.newAssignments}
                      onCheckedChange={() => handleToggleChange("notifications", "push", "newAssignments")}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Schedule Reminders</Label>
                      <p className="text-sm text-gray-500">Reminders for upcoming scheduled work</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push.scheduleReminders}
                      onCheckedChange={() => handleToggleChange("notifications", "push", "scheduleReminders")}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={isSavingProfile} className="shadow-sm">
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Security Settings</CardTitle>
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
                <Separator />
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
                <Separator />
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

        <TabsContent value="preferences" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Work Preferences</CardTitle>
              <CardDescription>Configure your work preferences and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Default Response Time (hours)</Label>
                  <Select
                    value={settings.preferences.defaultResponseTime}
                    onValueChange={(value) => handleSettingChange("preferences", "defaultResponseTime", value)}
                  >
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Default time to respond to new tickets</p>
                </div>

                <Separator />

                <div>
                  <Label>Work Hours</Label>
                  <Select
                    value={settings.preferences.workHours}
                    onValueChange={(value) => handleSettingChange("preferences", "workHours", value)}
                  >
                    <SelectTrigger className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (9 AM - 5 PM)</SelectItem>
                      <SelectItem value="extended">Extended (7 AM - 7 PM)</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                      <SelectItem value="24/7">24/7</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Your preferred work schedule</p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Accept Assignments</Label>
                    <p className="text-sm text-gray-500">Automatically accept new ticket assignments</p>
                  </div>
                  <Switch
                    checked={settings.preferences.autoAccept}
                    onCheckedChange={() => handleToggleChange("preferences", "autoAccept", "true")}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={isSavingProfile} className="shadow-sm">
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
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
