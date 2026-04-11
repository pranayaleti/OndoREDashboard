import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building, 
  Users, 
  Wrench, 
  Mail, 
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Activity
} from "lucide-react"
import { propertyApi, authApi, leadApi, maintenanceApi, type Property, type InvitedUser, type Lead, type MaintenanceRequest } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { FinancialReportsView, type OwnerOption } from "@/components/shared/financial-reports-view"
import { Button } from "@/components/ui/button"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"

export default function ManagerReports() {
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([])
  const [financialOwnerId, setFinancialOwnerId] = useState<string | null>(null)
  const { toast } = useToast()

  const ownerOptions: OwnerOption[] = invitedUsers
    .filter((u) => u.role === "owner" && u.isActive)
    .map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [propsRes, usersRes, leadsData, maintenance] = await Promise.all([
        propertyApi.getProperties().then((r) => r.properties).catch(() => []),
        authApi.getInvitedUsers().then((r) => r.users).catch(() => []),
        leadApi.getManagerLeads().catch(() => []),
        maintenanceApi.getManagerMaintenanceRequests().catch(() => [])
      ])
      setProperties(propsRes)
      setInvitedUsers(usersRes)
      setLeads(leadsData)
      setMaintenanceRequests(maintenance)
    } catch (error) {
      console.error("Error fetching reports data:", error)
      toast({
        title: "Error",
        description: "Failed to load reports data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate all statistics
  const stats = {
    // Property stats
    totalProperties: properties.length,
    approvedProperties: properties.filter(p => p.status === "approved").length,
    pendingProperties: properties.filter(p => p.status === "pending").length,
    rejectedProperties: properties.filter(p => p.status === "rejected").length,
    approvalRate: properties.length > 0 
      ? Math.round((properties.filter(p => p.status === "approved").length / properties.length) * 100)
      : 0,
    
    // User stats
    totalOwners: invitedUsers.filter(u => u.role === 'owner' && u.isActive).length,
    totalTenants: invitedUsers.filter(u => u.role === 'tenant' && u.isActive).length,
    pendingInvites: invitedUsers.filter(u => !u.isActive).length,
    
    // Lead stats
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === 'new').length,
    contactedLeads: leads.filter(l => l.status === 'contacted').length,
    qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
    convertedLeads: leads.filter(l => l.status === 'converted').length,
    conversionRate: leads.length > 0
      ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)
      : 0,
    
    // Maintenance stats
    totalMaintenance: maintenanceRequests.length,
    pendingMaintenance: maintenanceRequests.filter(m => m.status === 'pending').length,
    inProgressMaintenance: maintenanceRequests.filter(m => m.status === 'in_progress').length,
    completedMaintenance: maintenanceRequests.filter(m => m.status === 'completed').length,
    emergencyMaintenance: maintenanceRequests.filter(m => m.priority === 'emergency').length,
    highPriorityMaintenance: maintenanceRequests.filter(m => m.priority === 'high').length,
  }

  // Property type breakdown
  const propertyTypes = properties.reduce((acc, prop) => {
    acc[prop.type] = (acc[prop.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Maintenance by category
  const maintenanceByCategory = maintenanceRequests.reduce((acc, req) => {
    acc[req.category] = (acc[req.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Maintenance by priority
  const maintenanceByPriority = maintenanceRequests.reduce((acc, req) => {
    acc[req.priority] = (acc[req.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Properties by city
  const propertiesByCity = properties.reduce((acc, prop) => {
    acc[prop.city] = (acc[prop.city] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recentProperties = properties.filter(p => new Date(p.createdAt) >= thirtyDaysAgo)
  const recentLeads = leads.filter(l => new Date(l.createdAt) >= thirtyDaysAgo)
  const recentMaintenance = maintenanceRequests.filter(m => new Date(m.createdAt) >= thirtyDaysAgo)

  const handleExportCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Properties", stats.totalProperties],
      ["Approved Properties", stats.approvedProperties],
      ["Pending Properties", stats.pendingProperties],
      ["Rejected Properties", stats.rejectedProperties],
      ["Total Owners", stats.totalOwners],
      ["Total Tenants", stats.totalTenants],
      ["Total Leads", stats.totalLeads],
      ["Converted Leads", stats.convertedLeads],
      ["Total Maintenance", stats.totalMaintenance],
      ["Completed Maintenance", stats.completedMaintenance],
      ["Emergency Maintenance", stats.emergencyMaintenance],
    ]
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "manager-reports-summary.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast({ title: "Download started", description: "Manager reports CSV export" })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive insights into your property management operations
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              Export CSV
            </Button>
            <ExportPDFButton
              variant="outline"
              fileName="manager-reports"
              content={{
                title: "Manager Reports",
                subtitle: "Portfolio analytics summary",
                summary: [
                  { label: "Properties", value: stats.totalProperties },
                  { label: "Owners", value: stats.totalOwners },
                  { label: "Tenants", value: stats.totalTenants },
                  { label: "Maintenance", value: stats.totalMaintenance },
                ],
                tables: [
                  {
                    title: "Operations Overview",
                    headers: ["Metric", "Value"],
                    rows: [
                      ["Approval Rate", `${stats.approvalRate}%`],
                      ["Lead Conversion", `${stats.conversionRate}%`],
                      ["Recent Properties", String(recentProperties.length)],
                      ["Recent Leads", String(recentLeads.length)],
                      ["Recent Maintenance", String(recentMaintenance.length)],
                    ],
                  },
                ],
              }}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-6">
          <FinancialReportsView
            requireOwnerSelection
            owners={ownerOptions}
            selectedOwnerId={financialOwnerId}
            onOwnerIdChange={setFinancialOwnerId}
            title="Financial reports (by owner)"
          />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProperties}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.approvedProperties} approved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalOwners + stats.totalTenants}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalOwners} owners, {stats.totalTenants} tenants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLeads}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.conversionRate}% conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance Tickets</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMaintenance}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completedMaintenance} completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Property Approval Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold">{stats.approvalRate}%</div>
                  <div className="flex-1">
                    <div className="w-full bg-muted dark:bg-secondary rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${stats.approvalRate}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.approvedProperties} of {stats.totalProperties} properties
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lead Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold">{stats.conversionRate}%</div>
                  <div className="flex-1">
                    <div className="w-full bg-muted dark:bg-secondary rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${stats.conversionRate}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.convertedLeads} of {stats.totalLeads} leads
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Maintenance Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold">
                    {stats.totalMaintenance > 0 
                      ? Math.round((stats.completedMaintenance / stats.totalMaintenance) * 100)
                      : 0}%
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-muted dark:bg-secondary rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.totalMaintenance > 0 
                            ? (stats.completedMaintenance / stats.totalMaintenance) * 100
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.completedMaintenance} of {stats.totalMaintenance} tickets
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity (30 Days) */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Summary (Last 30 Days)</CardTitle>
              <CardDescription>Recent activity across all areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Properties</p>
                    <p className="text-2xl font-bold">{recentProperties.length}</p>
                  </div>
                  <Building className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Leads</p>
                    <p className="text-2xl font-bold">{recentLeads.length}</p>
                  </div>
                  <Mail className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Tickets</p>
                    <p className="text-2xl font-bold">{recentMaintenance.length}</p>
                  </div>
                  <Wrench className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Property Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Property Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Approved</p>
                      <p className="text-xs text-muted-foreground">Active properties</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.approvedProperties}</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Pending Review</p>
                      <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.pendingProperties}</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Rejected</p>
                      <p className="text-xs text-muted-foreground">Not approved</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.rejectedProperties}</div>
                </div>
              </CardContent>
            </Card>

            {/* Property Types */}
            <Card>
              <CardHeader>
                <CardTitle>Properties by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(propertyTypes).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(propertyTypes)
                      .sort(([, a]: [string, unknown], [, b]: [string, unknown]) => (b as number) - (a as number))
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{type}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-muted dark:bg-secondary rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${((count as number) / stats.totalProperties) * 100}%`
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold w-8 text-right">{String(count)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No properties yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Properties by City */}
          {Object.keys(propertiesByCity).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Properties by City</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(propertiesByCity)
                    .sort(([, a]: [string, unknown], [, b]: [string, unknown]) => (b as number) - (a as number))
                    .slice(0, 8)
                    .map(([city, count]) => (
                      <div key={city} className="text-center p-3 border rounded-lg">
                        <p className="text-2xl font-bold">{String(count)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{city}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Owners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats.totalOwners}</div>
                <p className="text-sm text-muted-foreground">Active property owners</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>With Properties</span>
                    <span className="font-medium">
                      {invitedUsers.filter(u => u.role === 'owner' && u.propertyCount > 0).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Pending Invites</span>
                    <span className="font-medium">
                      {invitedUsers.filter(u => u.role === 'owner' && !u.isActive).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Tenants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats.totalTenants}</div>
                <p className="text-sm text-muted-foreground">Active tenants</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Assigned Properties</span>
                    <span className="font-medium">
                      {properties.filter(p => p.tenantId).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Pending Invites</span>
                    <span className="font-medium">
                      {invitedUsers.filter(u => u.role === 'tenant' && !u.isActive).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  Invitations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{stats.pendingInvites}</div>
                <p className="text-sm text-muted-foreground">Pending invitations</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Owner Invites</span>
                    <span className="font-medium">
                      {invitedUsers.filter(u => u.role === 'owner' && !u.isActive).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Tenant Invites</span>
                    <span className="font-medium">
                      {invitedUsers.filter(u => u.role === 'tenant' && !u.isActive).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lead Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Status Breakdown</CardTitle>
              <CardDescription>Track lead progression through the funnel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium">New</p>
                      <p className="text-xs text-muted-foreground">Initial inquiries</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.newLeads}</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div>
                      <p className="font-medium">Contacted</p>
                      <p className="text-xs text-muted-foreground">In communication</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.contactedLeads}</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <div>
                      <p className="font-medium">Qualified</p>
                      <p className="text-xs text-muted-foreground">Qualified prospects</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.qualifiedLeads}</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    <div>
                      <p className="font-medium">Converted</p>
                      <p className="text-xs text-muted-foreground">Successfully converted</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.convertedLeads}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Maintenance Status */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Pending</p>
                      <p className="text-xs text-muted-foreground">Awaiting action</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.pendingMaintenance}</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">In Progress</p>
                      <p className="text-xs text-muted-foreground">Being worked on</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.inProgressMaintenance}</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Completed</p>
                      <p className="text-xs text-muted-foreground">Resolved tickets</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.completedMaintenance}</div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(maintenanceByPriority).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(maintenanceByPriority)
                      .map(([priority, count]) => {
                        const colors: Record<string, string> = {
                          emergency: 'bg-red-500',
                          high: 'bg-orange-500',
                          medium: 'bg-yellow-500',
                          low: 'bg-blue-500'
                        }
                        return (
                          <div key={priority} className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">{priority}</span>
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-muted dark:bg-secondary rounded-full h-2">
                                <div 
                                  className={`${colors[priority] || 'bg-muted'} h-2 rounded-full`}
                                  style={{ 
                                    width: `${(count / stats.totalMaintenance) * 100}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold w-8 text-right">{count}</span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No maintenance requests yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Maintenance by Category */}
          {Object.keys(maintenanceByCategory).length > 0 && (
      <Card>
        <CardHeader>
                <CardTitle>Maintenance by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(maintenanceByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => (
                      <div key={category} className="text-center p-3 border rounded-lg">
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {category.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency & High Priority Alerts */}
          {(stats.emergencyMaintenance > 0 || stats.highPriorityMaintenance > 0) && (
            <Card className="border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  Priority Alerts
                </CardTitle>
        </CardHeader>
        <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.emergencyMaintenance > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-red-900 dark:text-red-100">Emergency</p>
                          <p className="text-xs text-red-700 dark:text-red-300">Requires immediate attention</p>
                        </div>
                        <div className="text-3xl font-bold text-red-600">{stats.emergencyMaintenance}</div>
                      </div>
                    </div>
                  )}
                  {stats.highPriorityMaintenance > 0 && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-orange-900 dark:text-orange-100">High Priority</p>
                          <p className="text-xs text-orange-700 dark:text-orange-300">Needs prompt action</p>
                        </div>
                        <div className="text-3xl font-bold text-orange-600">{stats.highPriorityMaintenance}</div>
                      </div>
                    </div>
                  )}
                </div>
        </CardContent>
      </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
