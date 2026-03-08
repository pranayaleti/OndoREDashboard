import { useState } from "react"
import { Routes, Route, Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, Search, Mail, Phone, MapPin, Calendar, DollarSign, AlertTriangle, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api"
import { useApi } from "@/hooks/useApi"

// Mock tenants data
const mockTenants = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "(555) 123-4567",
    property: "Oak Street Apartments",
    unit: "2B",
    rent: 1850,
    leaseStart: "2023-09-16",
    leaseEnd: "2024-12-31",
    status: "active",
    paymentStatus: "current"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "(555) 987-6543",
    property: "Pine View Complex",
    unit: "1A",
    rent: 1650,
    leaseStart: "2023-08-01",
    leaseEnd: "2024-07-31",
    status: "active",
    paymentStatus: "overdue"
  },
  {
    id: 3,
    name: "Mike Davis",
    email: "mike.davis@email.com",
    phone: "(555) 456-7890",
    property: "Maple Heights",
    unit: "3C",
    rent: 2100,
    leaseStart: "2023-10-01",
    leaseEnd: "2024-09-30",
    status: "active",
    paymentStatus: "current"
  }
]

function TenantsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [cardFilter, setCardFilter] = useState<string | null>(null)

  // Helper function to check if lease is expiring soon (within 60 days)
  const isLeaseExpiring = (leaseEnd: string) => {
    const endDate = new Date(leaseEnd)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 60
  }

  const filteredTenants = mockTenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.property.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter
    const matchesPayment = paymentFilter === "all" || tenant.paymentStatus === paymentFilter
    
    // Apply card filter
    let matchesCard = true
    if (cardFilter === "current") {
      matchesCard = tenant.paymentStatus === "current"
    } else if (cardFilter === "overdue") {
      matchesCard = tenant.paymentStatus === "overdue"
    } else if (cardFilter === "expiring") {
      matchesCard = isLeaseExpiring(tenant.leaseEnd)
    } else if (cardFilter === "total") {
      matchesCard = true // Show all for total
    }
    
    return matchesSearch && matchesStatus && matchesPayment && matchesCard
  })

  const handleCardClick = (filter: string) => {
    if (cardFilter === filter) {
      // If clicking the same card, clear the filter
      setCardFilter(null)
      if (filter === "current" || filter === "overdue") {
        setPaymentFilter("all")
      }
    } else {
      setCardFilter(filter)
      // Sync payment filter when clicking payment-related cards
      if (filter === "current") {
        setPaymentFilter("current")
      } else if (filter === "overdue") {
        setPaymentFilter("overdue")
      } else if (filter === "total") {
        setPaymentFilter("all")
      }
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "current":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "late":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tenants</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your tenant relationships</p>
        </div>
        <Link to="/dashboard/tenants/new">
          <Button className="bg-ondo-orange hover:bg-ondo-red transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            cardFilter === "total" ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950" : ""
          }`}
          onClick={() => handleCardClick("total")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold">{mockTenants.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            cardFilter === "current" ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-950" : ""
          }`}
          onClick={() => handleCardClick("current")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Payments</p>
                <p className="text-2xl font-bold">{mockTenants.filter(t => t.paymentStatus === "current").length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            cardFilter === "overdue" ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-950" : ""
          }`}
          onClick={() => handleCardClick("overdue")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Payments</p>
                <p className="text-2xl font-bold">{mockTenants.filter(t => t.paymentStatus === "overdue").length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            cardFilter === "expiring" ? "ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950" : ""
          }`}
          onClick={() => handleCardClick("expiring")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Leases</p>
                <p className="text-2xl font-bold">{mockTenants.filter(t => isLeaseExpiring(t.leaseEnd)).length}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={paymentFilter} 
              onValueChange={(value) => {
                setPaymentFilter(value)
                // Sync card filter when payment filter changes
                if (value === "current") {
                  setCardFilter("current")
                } else if (value === "overdue") {
                  setCardFilter("overdue")
                } else if (value === "all") {
                  if (cardFilter === "current" || cardFilter === "overdue") {
                    setCardFilter(null)
                  }
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      <div className="space-y-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`/placeholder-avatar-${tenant.id}.jpg`} />
                    <AvatarFallback>
                      {tenant.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{tenant.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{tenant.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{tenant.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Badge className={getPaymentStatusColor(tenant.paymentStatus)}>
                      {tenant.paymentStatus}
                    </Badge>
                    <Badge variant="outline" className="ml-2">
                      {tenant.status}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                <div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>Property</span>
                  </div>
                  <p className="font-medium">{tenant.property}</p>
                  <p className="text-sm text-gray-500">Unit {tenant.unit}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Monthly Rent</span>
                  </div>
                  <p className="font-medium">${tenant.rent}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Lease Start</span>
                  </div>
                  <p className="font-medium">{tenant.leaseStart}</p>
                </div>
                <div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Lease End</span>
                  </div>
                  <p className="font-medium">{tenant.leaseEnd}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tenants found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== "all" || paymentFilter !== "all" 
                ? "Try adjusting your filters" 
                : "No tenants have been added yet"}
            </p>
            <Link to="/dashboard/tenants/new">
              <Button className="bg-ondo-orange hover:bg-ondo-red transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add First Tenant
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AddTenant() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { loading: isInviting, execute: sendInvitation } = useApi(authApi.invite)
  
  const [formData, setFormData] = useState({
    email: "",
    role: "tenant" as "owner" | "tenant"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await sendInvitation({
        email: formData.email,
        role: formData.role
      })
      
      toast({
        title: "Invitation Sent!",
        description: `Invitation sent to ${formData.email}. They will receive an email with signup instructions.`,
        duration: 3000,
      })
      
      if (response) {
        console.log("Invitation URL:", response.inviteUrl)
      }
      navigate("/dashboard/tenants")
    } catch (error: any) {
      toast({
        title: "Invitation Failed",
        description: error.message || "Failed to send invitation. Please try again.",
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
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                  onValueChange={(value: "owner" | "tenant") => setFormData(prev => ({ ...prev, role: value }))}
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
                <Button type="submit" disabled={isInviting} className="bg-ondo-orange hover:bg-ondo-red transition-colors">
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
