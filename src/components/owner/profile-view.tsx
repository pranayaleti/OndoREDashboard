"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, Building, Shield, Upload } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { AddressForm, type AddressFormValues } from "@/components/forms/address-form"
import { parseAddressString, formatAddressFields } from "@/utils/address"
import { ChangePasswordDialog } from "@/components/ui/change-password-dialog"
import { TwoFactorAuthDialog } from "@/components/ui/two-factor-auth-dialog"
import { PaymentMethods } from "@/components/ui/payment-methods"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { US_TIMEZONES } from "@/constants/us"
import { useUserTimezone } from "@/hooks/use-user-timezone"

// Mock user data
const USER = {
  id: "user123",
  name: "Sarah Johnson",
  email: "sarah.johnson@example.com",
  phone: "555-123-4567",
  avatar: `${import.meta.env.BASE_URL}placeholder.svg?key=1g942`,
  company: "Johnson Property Management",
  address: "789 Business Ave, Suite 300, Salt Lake City, UT 84101",
  bio: "Property manager with over 10 years of experience in residential and commercial property management.",
  notifications: {
    email: true,
    sms: true,
    app: true,
  },
  twoFactorEnabled: false,
}

export function ProfileView() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("personal")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userData, setUserData] = useState(USER)
  const [addressFormValue, setAddressFormValue] = useState<AddressFormValues>(() => {
    const parsed = parseAddressString(USER.address)
    return {
      addressType: "home",
      addressLine1: parsed.line1,
      addressLine2: parsed.line2,
      city: parsed.city,
      state: parsed.state,
      postalCode: parsed.postalCode,
    }
  })
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false)
  const [settings, setSettings] = useState({
    security: {
      sessionTimeout: "60",
      loginAlerts: true,
      timezone: "America/Denver",
    },
  })
  const { displayTimezone, storageTimezone } = useUserTimezone()

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddressFormChange = (value: AddressFormValues) => {
    setAddressFormValue(value)
    setUserData((prev) => ({
      ...prev,
      address: formatAddressFields({
        line1: value.addressLine1,
        line2: value.addressLine2,
        city: value.city,
        state: value.state,
        postalCode: value.postalCode,
      }),
    }))
  }

  const handleNotificationChange = (key: string, checked: boolean) => {
    setUserData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: checked,
      },
    }))
  }

  const handleTwoFactorChange = () => {
    setIs2FADialogOpen(true)
  }

  const handleSettingChange = (category: string, setting: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value,
      },
    }))
  }

  const handleToggleChange = (category: string, setting: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [setting]: !(prev[category as keyof typeof prev] as any)[setting],
      },
    }))
  }


  const handleSavePersonalInfo = () => {
    setIsSubmitting(true)

    // In a real app, this would call an API to update the user's profile
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Profile updated",
        description: "Your profile information has been successfully updated.",
        duration: 3000,
      })
    }, 1000)
  }


  const handleDeleteAccount = () => {
    // In a real app, this would call an API to delete the user's account
    toast({
      title: "Account deleted",
      description: "Your account has been successfully deleted.",
    })
    navigate("/auth")
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full md:w-[600px]">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal and business information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData.avatar || `${import.meta.env.BASE_URL}placeholder.svg`} alt={userData.name} />
                    <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          name="name"
                          placeholder="Your full name"
                          className="pl-8"
                          value={userData.name}
                          onChange={handlePersonalInfoChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Your email address"
                          className="pl-8"
                          value={userData.email}
                          onChange={handlePersonalInfoChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="Your phone number"
                          className="pl-8"
                          value={userData.phone}
                          onChange={handlePersonalInfoChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <div className="relative">
                      <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        name="company"
                        placeholder="Your company name"
                        className="pl-8"
                        value={userData.company}
                        onChange={handlePersonalInfoChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-profile-view-address">Address</Label>
                    <AddressForm
                      value={addressFormValue}
                      onChange={handleAddressFormChange}
                      idPrefix="owner-profile-view"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="A brief description about you."
                      rows={5}
                      value={userData.bio}
                      onChange={handlePersonalInfoChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button disabled={isSubmitting} onClick={handleSavePersonalInfo}>
                {isSubmitting ? <>Saving...</> : "Save Changes"}
              </Button>
            </CardFooter>
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
                    <p className="text-sm font-medium leading-none">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                  </div>
                  <Switch id="twoFactor" checked={userData.twoFactorEnabled} onCheckedChange={handleTwoFactorChange} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium leading-none">Login Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                  </div>
                  <Switch
                    checked={settings.security.loginAlerts}
                    onCheckedChange={() => handleToggleChange("security", "loginAlerts")}
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

          <Card>
            <CardHeader>
              <CardTitle>Delete Account</CardTitle>
              <CardDescription>Permanently delete your account</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove your data from
                      our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage your notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates and announcements via email.
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={userData.notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified about urgent matters via SMS.</p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={userData.notifications.sms}
                  onCheckedChange={(checked) => handleNotificationChange("sms", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-none">App Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive in-app notifications for real-time updates.</p>
                </div>
                <Switch
                  id="appNotifications"
                  checked={userData.notifications.app}
                  onCheckedChange={(checked) => handleNotificationChange("app", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <PaymentMethods />

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View your billing history</CardDescription>
            </CardHeader>
            <CardContent>
              <p>No billing history available.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ChangePasswordDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen} />
      <TwoFactorAuthDialog
        open={is2FADialogOpen}
        onOpenChange={setIs2FADialogOpen}
        currentValue={userData.twoFactorEnabled}
        onConfirm={(enabled) => {
          setUserData((prev) => ({
            ...prev,
            twoFactorEnabled: enabled,
          }))
        }}
      />
    </div>
  )
}
