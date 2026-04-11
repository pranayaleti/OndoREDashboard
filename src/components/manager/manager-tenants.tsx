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
import { getErrorMessage } from "@/lib/auth-utils"
import { useApi } from "@/hooks/useApi"
import { usePagination } from "@/hooks/usePagination"
import { DataPagination } from "@/components/ui/DataPagination"
import { PageSizeSelector } from "@/components/ui/PageSizeSelector"

// Mock tenants data
const mockTenants = [
  {
    id: 1,
    name: "Megan Carter",
    email: "megan.carter@email.com",
    phone: "(801) 555-7712",
    property: "Liberty Park Townhome",
    unit: "A",
    rent: 2400,
    leaseStart: "2025-06-01",
    leaseEnd: "2026-05-31",
    status: "active",
    paymentStatus: "current"
  },
  {
    id: 2,
    name: "Jason Reeves",
    email: "jason.reeves@email.com",
    phone: "(801) 555-3390",
    property: "BYU Campus Edge Townhome",
    unit: "A",
    rent: 1800,
    leaseStart: "2025-08-15",
    leaseEnd: "2026-08-14",
    status: "active",
    paymentStatus: "current"
  },
  {
    id: 3,
    name: "Ashley Kimball",
    email: "ashley.kimball@email.com",
    phone: "(385) 555-6021",
    property: "Historic 25th Street Loft",
    unit: "A",
    rent: 1650,
    leaseStart: "2025-07-01",
    leaseEnd: "2026-06-30",
    status: "active",
    paymentStatus: "overdue"
  },
  {
    id: 4,
    name: "Nathan Briggs",
    email: "nathan.briggs@email.com",
    phone: "(435) 555-2845",
    property: "Park City Ski-In Chalet",
    unit: "A",
    rent: 8500,
    leaseStart: "2025-12-01",
    leaseEnd: "2026-11-30",
    status: "active",
    paymentStatus: "current"
  },
  {
    id: 5,
    name: "Sophia Lund",
    email: "sophia.lund@email.com",
    phone: "(801) 555-9154",
    property: "Logan Canyon Craftsman",
    unit: "A",
    rent: 1600,
    leaseStart: "2025-05-01",
    leaseEnd: "2026-04-30",
    status: "active",
    paymentStatus: "current"
  },
  {
    id: 6,
    name: "Carlos Vega",
    email: "carlos.vega@email.com",
    phone: "(801) 555-4407",
    property: "Red Rock Vista Home",
    unit: "A",
    rent: 3500,
    leaseStart: "2025-03-01",
    leaseEnd: "2026-02-28",
    status: "active",
    paymentStatus: "overdue"
  },
  {
    id: 7,
    name: "Olivia Park",
    email: "olivia.park@email.com",
    phone: "(385) 555-8833",
    property: "Sugar House Modern Condo",
    unit: "A",
    rent: 1850,
    leaseStart: "2025-09-01",
    leaseEnd: "2026-08-31",
    status: "active",
    paymentStatus: "current"
  },
  {
    id: 8,
    name: "Ethan Frost",
    email: "ethan.frost@email.com",
    phone: "(801) 555-1268",
    property: "Provo River Trail Condo",
    unit: "A",
    rent: 1550,
    leaseStart: "2025-11-01",
    leaseEnd: "2026-10-31",
    status: "active",
    paymentStatus: "current"
  }
]

function TenantsList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [cardFilter, setCardFilter] = useState<string | null>(null)
  const [selectedTenantIds, setSelectedTenantIds] = useState<number[]>([])
  const { toast } = useToast()

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

  const {
    items: pagedTenants,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    changePageSize,
    reset: resetPage,
  } = usePagination(filteredTenants, { pageSize: 10 })

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
    resetPage()
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
        return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
    }
  }

  const selectedTenants = filteredTenants.filter((tenant) => selectedTenantIds.includes(tenant.id))

  const toggleTenant = (tenantId: number, checked: boolean) => {
    setSelectedTenantIds((previous) =>
      checked ? [...new Set([...previous, tenantId])] : previous.filter((id) => id !== tenantId)
    )
  }

  const toggleAllVisible = (checked: boolean) => {
    setSelectedTenantIds((previous) => {
      const visibleIds = pagedTenants.map((tenant) => tenant.id)
      if (!checked) {
        return previous.filter((id) => !visibleIds.includes(id))
      }
      return [...new Set([...previous, ...visibleIds])]
    })
  }

  const handleExportSelected = () => {
    if (selectedTenants.length === 0) return
    const rows = [
      ["Name", "Email", "Property", "Rent", "Payment Status"],
      ...selectedTenants.map((tenant) => [
        tenant.name,
        tenant.email,
        tenant.property,
        String(tenant.rent),
        tenant.paymentStatus,
      ]),
    ]
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "selected-tenants.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast({ title: "Download started", description: "Selected tenants export" })
  }

  const handleBulkMessage = () => {
    toast({
      title: "Message draft ready",
      description: `We prepared a bulk message for ${selectedTenants.length} tenant${selectedTenants.length !== 1 ? "s" : ""}.`,
      duration: 3000,
    })
  }

  const handleMarkReviewed = () => {
    toast({
      title: "Rent review updated",
      description: `Marked ${selectedTenants.length} tenant${selectedTenants.length !== 1 ? "s" : ""} as reviewed.`,
      duration: 3000,
    })
    setSelectedTenantIds([])
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
                onChange={(e) => { setSearchTerm(e.target.value); resetPage() }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage() }}>
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
                resetPage()
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {filteredTenants.length} tenant{filteredTenants.length !== 1 ? "s" : ""} found
        </p>
        <PageSizeSelector pageSize={pageSize} onChange={changePageSize} options={[5, 10, 25]} />
      </div>
      {selectedTenantIds.length > 0 && (
        <Card className="mb-4 border-orange-200 bg-orange-50/70 dark:border-orange-500/20 dark:bg-orange-500/10">
          <CardContent className="flex flex-col gap-3 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold">{selectedTenantIds.length} tenant{selectedTenantIds.length !== 1 ? "s" : ""} selected</p>
              <p className="text-sm text-muted-foreground">Use a bulk action to message, export, or review this group.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleBulkMessage}>
                Send Message
              </Button>
              <Button variant="outline" onClick={handleExportSelected}>
                Export Selected
              </Button>
              <Button onClick={handleMarkReviewed} className="bg-orange-500 text-black hover:bg-orange-400">
                Mark Rent as Reviewed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        {pagedTenants.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={pagedTenants.every((tenant) => selectedTenantIds.includes(tenant.id))}
              onChange={(event) => toggleAllVisible(event.target.checked)}
              aria-label="Select all visible tenants"
            />
            <span>Select all visible tenants</span>
          </div>
        )}
        {pagedTenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedTenantIds.includes(tenant.id)}
                    onChange={(event) => toggleTenant(tenant.id, event.target.checked)}
                    aria-label={`Select ${tenant.name}`}
                  />
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

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={goToPage}
        className="mt-4"
      />

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
      await sendInvitation({
        email: formData.email,
        role: formData.role
      })
      
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
