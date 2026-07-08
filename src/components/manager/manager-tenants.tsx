// Manager tenants directory.
//
// The list view delegates to SharedTenantsView, which pulls real tenants from
// `authApi.getInvitedUsers` (role filter = "tenant"). This replaces the earlier
// hard-coded `mockTenants` sample so the manager sees the real invite roster.
//
// The invite form ("Add Tenant") is preserved: it wraps `authApi.invite` to
// send the invitation email that populates the same list. Same pattern used
// by SharedOwnersView + AddOwner in manager-owners.tsx.
import { useState } from "react"
import { Routes, Route, Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api"
import { getErrorMessage } from "@/lib/auth-utils"
import { useApi } from "@/hooks/useApi"
import { SharedTenantsView } from "@/components/shared/shared-tenants-view"

function TenantsList() {
  return (
    <SharedTenantsView
      title="Tenants"
      description="Manage tenant invitations and access"
    />
  )
}

function AddTenant() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { loading: isInviting, execute: sendInvitation } = useApi(authApi.invite)

  const [formData, setFormData] = useState({
    email: "",
    role: "tenant" as "owner" | "tenant",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await sendInvitation({ email: formData.email, role: formData.role })
      toast({
        title: "Invitation Sent!",
        description: `Invitation sent to ${formData.email}. They will receive an email with signup instructions.`,
        duration: 3000,
      })
      navigate("/dashboard/tenants")
    } catch (error) {
      toast({
        title: "Invitation Failed",
        description: getErrorMessage(error, "Failed to send invitation. Please try again."),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Add New Tenant</CardTitle>
            <CardDescription>
              Invite a tenant to join the platform and access their tenant portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="tenant@email.com"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Invitation will be sent to this email
                </p>
              </div>

              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "owner" | "tenant") =>
                    setFormData((prev) => ({ ...prev, role: value }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant">Tenant</SelectItem>
                    <SelectItem value="owner">Property Owner</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  The person will be invited as this role
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• An invitation email will be sent to the provided address</li>
                  <li>• The recipient will receive a secure signup link</li>
                  <li>• They'll complete their profile (name, phone, password)</li>
                  <li>• Once registered, they'll have access to their portal</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <Link to="/dashboard/tenants">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isInviting}
                  className="bg-ondo-orange hover:bg-ondo-red transition-colors"
                >
                  {isInviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ManagerTenants() {
  return (
    <Routes>
      <Route path="/" element={<TenantsList />} />
      <Route path="/new" element={<AddTenant />} />
    </Routes>
  )
}
