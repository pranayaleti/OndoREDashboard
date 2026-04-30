import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Edit, Save, Loader2, DollarSign, Home, Shield, Bell, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { propertyApi, authApi, type Property } from "@/lib/api"
import { ProfileShell, ProfileSummaryCard, type SummaryMetric } from "@/components/portal/profile"
import { AddressForm, type AddressFormValues } from "@/components/forms/address-form"
import { parseAddressString, formatAddressFields } from "@/utils/address"
import { ChangePasswordDialog } from "@/components/ui/change-password-dialog"
import { PaymentMethods } from "@/components/ui/payment-methods"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TwoFactorAuthDialog } from "@/components/ui/two-factor-auth-dialog"
import { US_TIMEZONES } from "@/constants"
import { useUserTimezone } from "@/hooks/use-user-timezone"
import { LoginHistory } from "@/components/shared/login-history"

// Mock tenant profile data - will be replaced with real data from API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getInitialProfileData = (user: any) => ({
  personalInfo: {
    firstName: user?.firstName || "John",
    lastName: user?.lastName || "Smith",
    email: user?.email || "john.smith@email.com",
    phone: user?.phone || "(555) 123-4567",
    address: user?.address || "",
    dateOfBirth: "1990-05-15",
    emergencyContact: {
      name: "Jane Smith",
      relationship: "Spouse",
      phone: "(555) 987-6543"
    }
  },
  leaseInfo: {
    propertyAddress: "123 Oak Street, Apt 2B",
    city: "Salt Lake City, UT 84101",
    leaseStart: "2023-09-16",
    leaseEnd: "2024-12-31",
    monthlyRent: 1850,
    securityDeposit: 1850,
    petDeposit: 200
  },
  preferences: {
    emailNotifications: true,
    smsNotifications: false,
    maintenanceReminders: true,
    rentReminders: true,
    marketingEmails: false
  }
})

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

const formatAddressFromForm = (value: AddressFormValues) =>
  formatAddressFields({
    line1: value.addressLine1,
    line2: value.addressLine2,
    city: value.city,
    state: value.state,
    postalCode: value.postalCode,
  })

export default function TenantProfile() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("personal")
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(() => getInitialProfileData(user))
  const [addressFormValue, setAddressFormValue] = useState<AddressFormValues>(() => buildAddressFormValue(user?.address))
  const [assignedProperty, setAssignedProperty] = useState<Property | null>(null)
  const [loadingProperty, setLoadingProperty] = useState(true)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [settings, setSettings] = useState({
    notifications: {
      email: {
        maintenance: true,
        payments: true,
        leaseUpdates: true,
        announcements: false,
      },
      push: {
        urgentMaintenance: true,
        paymentReminders: true,
        leaseReminders: true,
      },
    },
    security: {
      twoFactor: false,
      sessionTimeout: "60",
      timezone: "America/Denver",
    },
  })
  const { displayTimezone, storageTimezone } = useUserTimezone()

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

  useEffect(() => {
    setProfileData(getInitialProfileData(user))
    setAddressFormValue(buildAddressFormValue(user?.address))
  }, [user])

  // Fetch assigned property data
  useEffect(() => {
    const fetchAssignedProperty = async () => {
      try {
        setLoadingProperty(true)
        const res = await propertyApi.getTenantProperty()
        const property = res.property
        setAssignedProperty(property)
      } catch (error) {
        console.error("Error fetching assigned property:", error)
        setAssignedProperty(null)
      } finally {
        setLoadingProperty(false)
      }
    }

    if (user?.role === "tenant") {
      fetchAssignedProperty()
    }
  }, [user])

  const handleSave = async () => {
    if (!profileData.personalInfo.firstName.trim() || !profileData.personalInfo.lastName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (First Name, Last Name).",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSavingProfile(true)
      await authApi.updateProfile({
        firstName: profileData.personalInfo.firstName,
        lastName: profileData.personalInfo.lastName,
        phone: profileData.personalInfo.phone,
        address: profileData.personalInfo.address
      })
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
        duration: 3000,
      })
      setIsEditing(false)
    } catch (error: unknown) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Failed to update profile.",
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleCancel = () => {
    setProfileData(getInitialProfileData(user))
    setAddressFormValue(buildAddressFormValue(user?.address))
    setIsEditing(false)
  }
  const handleAddressFormChange = (nextValue: AddressFormValues) => {
    setAddressFormValue(nextValue)
    setProfileData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        address: formatAddressFromForm(nextValue),
      },
    }))
  }

  const handleProfilePictureUpdate = async (profilePictureUrl: string) => {
    try {
      setIsSavingProfile(true)
      
      await authApi.updateProfile({
        firstName: profileData.personalInfo.firstName,
        lastName: profileData.personalInfo.lastName,
        phone: profileData.personalInfo.phone,
        address: profileData.personalInfo.address,
        profilePicture: profilePictureUrl,
      })

      await refreshUser()
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
        duration: 3000,
      })
    } catch (error: unknown) {
      console.error('Error updating profile picture:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Failed to update profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }


  const summaryMetrics: SummaryMetric[] = [
    {
      id: "property",
      label: "Property",
      value: loadingProperty ? "Loading..." : assignedProperty ? assignedProperty.title : "No property assigned",
      icon: <Home className="h-4 w-4" />,
      loading: loadingProperty,
    },
    {
      id: "lease",
      label: "Lease Status",
      value: loadingProperty ? "..." : assignedProperty ? "Active" : "No Property",
      icon: <Calendar className="h-4 w-4" />,
      loading: loadingProperty,
    },
    {
      id: "rent",
      label: "Monthly Rent",
      value: loadingProperty ? "..." : assignedProperty ? `$${assignedProperty.price || 0}` : "$0",
      icon: <DollarSign className="h-4 w-4" />,
      loading: loadingProperty,
    },
  ]

  return (
    <ProfileShell
      title="Profile Settings"
      description="Manage your personal information and preferences"
      summary={
        <ProfileSummaryCard
          roleLabel="Tenant"
          metrics={summaryMetrics}
          onAvatarChange={handleProfilePictureUpdate}
          isAvatarUpdating={isSavingProfile}
        />
      }
    >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="space-x-2">
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isSavingProfile}>
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.personalInfo.firstName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                        }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.personalInfo.lastName}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                        }))}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.personalInfo.email}
                        disabled={true}
                        className="bg-muted dark:bg-card"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.personalInfo.phone}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tenant-profile-address">Address</Label>
                    <AddressForm
                      value={addressFormValue}
                      onChange={handleAddressFormChange}
                      disabled={!isEditing || isSavingProfile}
                      idPrefix="tenant-profile"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profileData.personalInfo.dateOfBirth}
                      onChange={(e) => setProfileData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
                      }))}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <PaymentMethods />
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
                    <Link to="/tenant/notifications">
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
              
              <Card>
                <CardHeader>
                  <CardTitle>Email Notifications</CardTitle>
                  <CardDescription>Choose what emails you'd like to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Maintenance Updates</Label>
                        <p className="text-sm text-gray-500">Receive notifications about maintenance requests and updates</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email.maintenance}
                        onCheckedChange={() => handleToggleChange("notifications", "email", "maintenance")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Payment Reminders</Label>
                        <p className="text-sm text-gray-500">Get reminded when rent payments are due</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email.payments}
                        onCheckedChange={() => handleToggleChange("notifications", "email", "payments")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Lease Updates</Label>
                        <p className="text-sm text-gray-500">Important updates about your lease agreement</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email.leaseUpdates}
                        onCheckedChange={() => handleToggleChange("notifications", "email", "leaseUpdates")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Property Announcements</Label>
                        <p className="text-sm text-gray-500">News and announcements from property management</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email.announcements}
                        onCheckedChange={() => handleToggleChange("notifications", "email", "announcements")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Push Notifications</CardTitle>
                  <CardDescription>Configure push notifications for your devices</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Urgent Maintenance</Label>
                        <p className="text-sm text-gray-500">Emergency maintenance notifications</p>
                      </div>
                      <Switch
                        checked={settings.notifications.push.urgentMaintenance}
                        onCheckedChange={() => handleToggleChange("notifications", "push", "urgentMaintenance")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Payment Due Reminders</Label>
                        <p className="text-sm text-gray-500">Notifications when rent is almost due</p>
                      </div>
                      <Switch
                        checked={settings.notifications.push.paymentReminders}
                        onCheckedChange={() => handleToggleChange("notifications", "push", "paymentReminders")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Lease Reminders</Label>
                        <p className="text-sm text-gray-500">Important lease-related notifications</p>
                      </div>
                      <Switch
                        checked={settings.notifications.push.leaseReminders}
                        onCheckedChange={() => handleToggleChange("notifications", "push", "leaseReminders")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Preferences</CardTitle>
                  <CardDescription>Configure your general application preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">No preferences available at this time.</p>
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
                          Viewing times in {displayTimezone.display}. We store the canonical timezone as {storageTimezone.display}.
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
