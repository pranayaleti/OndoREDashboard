import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  Lock,
  Building2,
  Users,
  DollarSign,
  Loader2,
  Bell,
  ExternalLink
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { authApi, ApiError, type ManagerPortfolioStats, type InvitedUser } from "@/lib/api"
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

export default function ManagerProfile() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const initialAddress = parseAddressString(user?.address)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    addressLine1: initialAddress.line1,
    addressLine2: initialAddress.line2,
    city: initialAddress.city,
    state: initialAddress.state,
    postalCode: initialAddress.postalCode,
  })

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [settings, setSettings] = useState({
    notifications: {
      email: {
        propertyAlerts: true,
        maintenanceRequests: true,
        tenantIssues: true,
        financialReports: true,
        leaseRenewals: true,
        ownerCommunications: true,
      },
      push: {
        urgentMaintenance: true,
        tenantPayments: true,
        leaseExpirations: false,
        ownerMessages: true,
      },
    },
    security: {
      twoFactor: false,
      sessionTimeout: "60",
      loginAlerts: true,
      timezone: "America/Denver",
    },
    business: {
      defaultLeaseTerm: "12",
      maintenanceResponseTime: "24",
      autoBackup: true,
      dataRetention: "7",
    },
  })
  const { displayTimezone, storageTimezone } = useUserTimezone()

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

  const handleSettingChange = (category: string, subcategory: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [subcategory]: value,
      },
    }))
  }
  const [portfolioStats, setPortfolioStats] = useState<ManagerPortfolioStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([])
  const [isLoadingInvited, setIsLoadingInvited] = useState(false)
  

  // Update form data when user data changes (only when not editing to avoid overwriting user input)
  useEffect(() => {
    if (user && !isEditing) {
      const parsedAddress = parseAddressString(user.address)
      setFormData(prev => {
        // Only update if values actually changed to prevent unnecessary re-renders
        const newFirstName = user.firstName || ""
        const newLastName = user.lastName || ""
        const newEmail = user.email || ""
        const newPhone = user.phone || ""
        
        if (
          prev.firstName === newFirstName &&
          prev.lastName === newLastName &&
          prev.email === newEmail &&
          prev.phone === newPhone &&
          prev.addressLine1 === parsedAddress.line1 &&
          prev.addressLine2 === parsedAddress.line2 &&
          prev.city === parsedAddress.city &&
          prev.state === parsedAddress.state &&
          prev.postalCode === parsedAddress.postalCode
        ) {
          return prev // No changes, return previous state
        }
        
        return {
          ...prev,
          firstName: newFirstName,
          lastName: newLastName,
          email: newEmail,
          phone: newPhone,
          addressLine1: parsedAddress.line1,
          addressLine2: parsedAddress.line2,
          city: parsedAddress.city,
          state: parsedAddress.state,
          postalCode: parsedAddress.postalCode,
        }
      })
    }
  }, [user?.firstName, user?.lastName, user?.email, user?.phone, user?.address, isEditing])

  // Fetch portfolio statistics
  useEffect(() => {
    const fetchPortfolioStats = async () => {
      if (!user || user.role !== "manager") return

      try {
        setIsLoadingStats(true)
        const stats = await authApi.getPortfolioStats()
        if (!("propertiesManaged" in stats)) {
          throw new Error("Expected manager portfolio stats from API")
        }
        setPortfolioStats(stats)
      } catch (error) {
        console.error("Error fetching manager portfolio stats:", error)
        // Set default values if API fails
        setPortfolioStats({
          propertiesManaged: 0,
          totalUnits: 0,
          activeTenants: 0,
          monthlyRevenue: 0,
          formattedMonthlyRevenue: "$0K",
          occupancyRate: 0
        })
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchPortfolioStats()
  }, [user])

  // Fetch invited users to compute active owners count
  useEffect(() => {
    const fetchInvited = async () => {
      if (!user || user.role !== "manager") return
      try {
        setIsLoadingInvited(true)
        const usersRes = await authApi.getInvitedUsers()
        setInvitedUsers(usersRes.users)
      } catch (error) {
        console.error("Error fetching invited users:", error)
        setInvitedUsers([])
      } finally {
        setIsLoadingInvited(false)
      }
    }
    fetchInvited()
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddressFormChange = (nextAddress: AddressFormValues) => {
    setFormData(prev => ({
      ...prev,
      addressLine1: nextAddress.addressLine1,
      addressLine2: nextAddress.addressLine2,
      city: nextAddress.city,
      state: nextAddress.state,
      postalCode: nextAddress.postalCode,
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
        address: formatAddressFields({
          line1: formData.addressLine1,
          line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
        }) || undefined,
      })

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
        duration: 3000, // Show for 3 seconds
      })
      
      await refreshUser()
      setIsEditing(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof ApiError
        ? err.message
        : err instanceof Error ? err.message : "Failed to update profile. Please try again."
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleCancel = () => {
    const parsedAddress = parseAddressString(user?.address)
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      addressLine1: parsedAddress.line1,
      addressLine2: parsedAddress.line2,
      city: parsedAddress.city,
      state: parsedAddress.state,
      postalCode: parsedAddress.postalCode,
    })
    setIsEditing(false)
  }

  const handleProfilePictureUpdate = async (profilePictureUrl: string) => {
    try {
      setIsSavingProfile(true)
      
      await authApi.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formatAddressFields({
          line1: formData.addressLine1,
          line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
        }),
        profilePicture: profilePictureUrl,
      })

      await refreshUser()
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
        duration: 3000,
      })
    } catch (error: any) {
      console.error('Error updating profile picture:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingProfile(false)
    }
  }



  const ownerCount = invitedUsers.filter(u => u.role === "owner" && u.isActive).length
  const tenantCount = invitedUsers.filter(u => u.role === "tenant" && u.isActive).length

  const summaryMetrics: SummaryMetric[] = [
    {
      id: "properties",
      label: "Properties Managed",
      value: portfolioStats?.propertiesManaged || 0,
      icon: <Building2 className="h-4 w-4" />,
      href: "/dashboard/properties",
      loading: isLoadingStats,
    },
    {
      id: "owners",
      label: "Active Owners",
      value: ownerCount,
      icon: <Users className="h-4 w-4" />,
      href: "/dashboard/owners",
      loading: isLoadingInvited || isLoadingStats,
    },
    {
      id: "tenants",
      label: "Active Tenants",
      value: tenantCount,
      icon: <Users className="h-4 w-4" />,
      href: "/dashboard/tenants",
      loading: isLoadingInvited || isLoadingStats,
    },
    {
      id: "revenue",
      label: "Monthly Revenue",
      value: (
        <span className="text-primary">
          {portfolioStats?.formattedMonthlyRevenue || "$0K"}
        </span>
      ),
      icon: <DollarSign className="h-4 w-4" />,
      href: "/dashboard/finances",
      loading: isLoadingStats,
    },
  ]

  return (
    <ProfileShell
      title="Manager Profile"
      description="Manage your account and property management preferences"
      summary={
        <ProfileSummaryCard
          roleLabel="Property Manager"
          metrics={summaryMetrics}
          onAvatarChange={handleProfilePictureUpdate}
          isAvatarUpdating={isSavingProfile}
        />
      }
    >
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-11">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Info
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                  <div>
                    <CardTitle className="text-2xl mb-1">Personal Information</CardTitle>
                    <CardDescription>Update your personal details and contact information</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleCancel} 
                        disabled={isSavingProfile}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={isSavingProfile}
                        className="gap-2"
                      >
                        {isSavingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        disabled={!isEditing || isSavingProfile}
                        className={!isEditing ? "bg-muted" : ""}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        disabled={!isEditing || isSavingProfile}
                        className={!isEditing ? "bg-muted" : ""}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled={true}
                        className="bg-muted text-muted-foreground cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Lock className="h-3 w-3" />
                        Email cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        disabled={!isEditing || isSavingProfile}
                        className={!isEditing ? "bg-muted" : ""}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      Address
                    </Label>
                    <AddressForm
                      value={{
                        addressLine1: formData.addressLine1 || "",
                        addressLine2: formData.addressLine2 || "",
                        city: formData.city || "",
                        state: formData.state || "",
                        postalCode: formData.postalCode || "",
                      }}
                      onChange={handleAddressFormChange}
                      hideTypeToggle
                      disabled={!isEditing || isSavingProfile}
                      idPrefix="manager"
                      className="border border-dashed bg-muted/30 p-4 shadow-none"
                    />
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
                    brand: "American Express",
                    last4: "3005",
                    expMonth: 8,
                    expYear: 2027,
                    isDefault: false,
                  },
                  {
                    id: "pm3",
                    type: "bank_account",
                    bank: "Wells Fargo Business",
                    last4: "9934",
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
                    <Link to="/manager/notifications">
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
                        <Label>Property Alerts</Label>
                        <p className="text-sm text-gray-500">New property listings and updates</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email.propertyAlerts}
                        onCheckedChange={() => handleToggleChange("notifications", "email", "propertyAlerts")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Maintenance Requests</Label>
                        <p className="text-sm text-gray-500">New maintenance requests from tenants</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email.maintenanceRequests}
                        onCheckedChange={() => handleToggleChange("notifications", "email", "maintenanceRequests")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Tenant Issues</Label>
                        <p className="text-sm text-gray-500">Urgent tenant-related issues</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email.tenantIssues}
                        onCheckedChange={() => handleToggleChange("notifications", "email", "tenantIssues")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Financial Reports</Label>
                        <p className="text-sm text-gray-500">Monthly and quarterly financial reports</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email.financialReports}
                        onCheckedChange={() => handleToggleChange("notifications", "email", "financialReports")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Lease Renewals</Label>
                        <p className="text-sm text-gray-500">Lease renewal reminders and updates</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email.leaseRenewals}
                        onCheckedChange={() => handleToggleChange("notifications", "email", "leaseRenewals")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Owner Communications</Label>
                        <p className="text-sm text-gray-500">Messages and updates from owners</p>
                      </div>
                      <Switch
                        checked={settings.notifications.email.ownerCommunications}
                        onCheckedChange={() => handleToggleChange("notifications", "email", "ownerCommunications")}
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
                        <p className="text-sm text-gray-500">Emergency maintenance requests</p>
                      </div>
                      <Switch
                        checked={settings.notifications.push.urgentMaintenance}
                        onCheckedChange={() => handleToggleChange("notifications", "push", "urgentMaintenance")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Tenant Payments</Label>
                        <p className="text-sm text-gray-500">Payment received notifications</p>
                      </div>
                      <Switch
                        checked={settings.notifications.push.tenantPayments}
                        onCheckedChange={() => handleToggleChange("notifications", "push", "tenantPayments")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Lease Expirations</Label>
                        <p className="text-sm text-gray-500">Lease expiration warnings</p>
                      </div>
                      <Switch
                        checked={settings.notifications.push.leaseExpirations}
                        onCheckedChange={() => handleToggleChange("notifications", "push", "leaseExpirations")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Owner Messages</Label>
                        <p className="text-sm text-gray-500">Messages from property owners</p>
                      </div>
                      <Switch
                        checked={settings.notifications.push.ownerMessages}
                        onCheckedChange={() => handleToggleChange("notifications", "push", "ownerMessages")}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Settings</CardTitle>
                  <CardDescription>Configure your business preferences and defaults</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Default Lease Term (months)</Label>
                      <Select
                        value={settings.business.defaultLeaseTerm}
                        onValueChange={(value) => handleSettingChange("business", "defaultLeaseTerm", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
                          <SelectItem value="18">18 months</SelectItem>
                          <SelectItem value="24">24 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Maintenance Response Time (hours)</Label>
                      <Select
                        value={settings.business.maintenanceResponseTime}
                        onValueChange={(value) => handleSettingChange("business", "maintenanceResponseTime", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 hours</SelectItem>
                          <SelectItem value="12">12 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                          <SelectItem value="48">48 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Data Retention (years)</Label>
                      <Select
                        value={settings.business.dataRetention}
                        onValueChange={(value) => handleSettingChange("business", "dataRetention", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 years</SelectItem>
                          <SelectItem value="5">5 years</SelectItem>
                          <SelectItem value="7">7 years</SelectItem>
                          <SelectItem value="10">10 years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Automatic Data Backup</Label>
                      <p className="text-sm text-gray-500">Automatically backup your data daily</p>
                    </div>
                    <Switch
                      checked={settings.business.autoBackup}
                      onCheckedChange={() => handleToggleChange("business", "autoBackup", "true")}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl mb-1 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>Manage your account security preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
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

                  <Separator />

                  <div>
                    <h4 className="font-semibold text-lg mb-1 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password & Access
                    </h4>
                    <p className="text-sm text-muted-foreground mb-6">
                      Update your password to keep your account secure. Use a strong password with at least 6 characters.
                    </p>
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
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
