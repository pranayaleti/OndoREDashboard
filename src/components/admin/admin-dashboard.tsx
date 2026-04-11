import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Shield, Users, Building, Wrench, BarChart3, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { AdminNav } from "./admin-nav"
import { propertyApi, authApi, maintenanceApi, type Property, type InvitedUser, type MaintenanceRequest } from "@/lib/api"
import { useWelcomeToast } from "@/hooks/use-welcome-toast"
import { useToast } from "@/hooks/use-toast"
import { formatUSDate } from "@/lib/us-format"

export default function AdminDashboard() {
  const { user } = useAuth()
  useWelcomeToast()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([])
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([])

  const navItems = [
    { label: "Overview", value: "overview", onClick: () => setActiveTab("overview") },
    { label: "Managers", value: "managers", onClick: () => setActiveTab("managers") },
    { label: "System Stats", value: "stats", onClick: () => setActiveTab("stats") },
    { label: "Activity", value: "activity", onClick: () => setActiveTab("activity") },
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [propertiesData, usersData, maintenanceData] = await Promise.all([
        propertyApi.getProperties().then((r) => r.properties).catch(() => []),
        authApi.getInvitedUsers().then((r) => r.users).catch(() => []),
        maintenanceApi.getManagerMaintenanceRequests().catch(() => []),
      ])
      setProperties(propertiesData)
      setInvitedUsers(usersData)
      setMaintenanceRequests(maintenanceData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from real data
  // Note: Managers are not included in invitedUsers (only owners and tenants)
  const stats = {
    totalManagers: 0, // Managers are managed separately, not through invitations
    totalOwners: invitedUsers.filter(u => u.role === 'owner').length,
    totalTenants: invitedUsers.filter(u => u.role === 'tenant').length,
    totalMaintenance: maintenanceRequests.length,
    totalProperties: properties.length,
    pendingProperties: properties.filter(p => p.status === 'pending').length,
    approvedProperties: properties.filter(p => p.status === 'approved').length,
    rejectedProperties: properties.filter(p => p.status === 'rejected').length,
    activeMaintenance: maintenanceRequests.filter(m => m.status === 'in_progress' || m.status === 'pending').length,
    completedMaintenance: maintenanceRequests.filter(m => m.status === 'completed').length,
    systemHealth: 98.5, // Mock for now
  }

  const recentActivity = [
    ...properties.slice(0, 3).map((p, idx) => ({
      id: `prop-${idx}`,
      type: "property",
      message: `Property "${p.title}" ${p.status === 'pending' ? 'submitted for review' : p.status === 'approved' ? 'approved' : 'rejected'}`,
      time: formatUSDate(p.createdAt),
      status: p.status === 'approved' ? 'success' : p.status === 'rejected' ? 'error' : 'warning',
    })),
    ...maintenanceRequests.slice(0, 2).map((m, idx) => ({
      id: `maint-${idx}`,
      type: "maintenance",
      message: `Maintenance request "${m.title}" ${m.status === 'completed' ? 'completed' : 'updated'}`,
      time: formatUSDate(m.updatedAt),
      status: m.status === 'completed' ? 'success' : 'warning',
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="bg-card dark:bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-600" />
                Admin Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                System-wide management and oversight
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {user?.firstName} {user?.lastName}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-card dark:bg-card border-b">
        <div className="container mx-auto px-4">
          <AdminNav items={navItems} activeTab={activeTab} />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProperties}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingProperties} pending review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Managers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalManagers}</div>
                  <p className="text-xs text-muted-foreground">Active manager accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Owners</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOwners}</div>
                  <p className="text-xs text-muted-foreground">Registered owners</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeMaintenance}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.completedMaintenance} completed this month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
              <Link to="/admin/managers">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center p-4">
                    <Users className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Managers</p>
                      <p className="text-xs text-gray-500">Manage accounts</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/admin/owners">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center p-4">
                    <Building className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Owners</p>
                      <p className="text-xs text-gray-500">View & manage</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/admin/tenants">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center p-4">
                    <Users className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Tenants</p>
                      <p className="text-xs text-gray-500">View & manage</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/admin/maintenance">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center p-4">
                    <Wrench className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Maintenance</p>
                      <p className="text-xs text-gray-500">Staff & requests</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

            </div>

            {/* Overview Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Property Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Status</CardTitle>
                  <CardDescription>Property approval status breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
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
                        <XCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">Rejected</p>
                          <p className="text-xs text-muted-foreground">Rejected submissions</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{stats.rejectedProperties}</div>
                    </div>
                  </div>
                  <Link to="/admin/properties">
                    <Button variant="outline" className="w-full">
                      View All Properties
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* User Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                  <CardDescription>Platform user breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Managers</p>
                          <p className="text-xs text-muted-foreground">Property managers</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{stats.totalManagers}</div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Owners</p>
                          <p className="text-xs text-muted-foreground">Property owners</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{stats.totalOwners}</div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Tenants</p>
                          <p className="text-xs text-muted-foreground">Active tenants</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold">{stats.totalTenants}</div>
                    </div>
                  </div>
                  <Link to="/admin/managers">
                    <Button variant="outline" className="w-full">
                      Manage Users
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
                <CardDescription>Latest administrative actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex items-start gap-3">
                        {activity.type === 'property' && <Building className="h-4 w-4 text-blue-500 mt-0.5" />}
                        {activity.type === 'maintenance' && <Wrench className="h-4 w-4 text-orange-500 mt-0.5" />}
                        <div>
                          <p className="font-medium">{activity.message}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                      <Badge variant={activity.status === "success" ? "default" : activity.status === "error" ? "destructive" : "secondary"}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="managers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manager Management</CardTitle>
                <CardDescription>View and manage all manager accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Managers are managed through the dedicated manager management page.</p>
                  <Link to="/admin/managers">
                    <Button>Go to Manager Management</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Properties</CardTitle>
                  <CardDescription>Property statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Properties</span>
                      <span className="text-2xl font-bold">{stats.totalProperties}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Approved</span>
                      <span className="text-lg font-semibold text-green-600">{stats.approvedProperties}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pending</span>
                      <span className="text-lg font-semibold text-yellow-600">{stats.pendingProperties}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rejected</span>
                      <span className="text-lg font-semibold text-red-600">{stats.rejectedProperties}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>User statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Managers</span>
                      <span className="text-2xl font-bold">{stats.totalManagers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Owners</span>
                      <span className="text-lg font-semibold">{stats.totalOwners}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Tenants</span>
                      <span className="text-lg font-semibold">{stats.totalTenants}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance</CardTitle>
                  <CardDescription>Maintenance statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Requests</span>
                      <span className="text-2xl font-bold">{stats.totalMaintenance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active</span>
                      <span className="text-lg font-semibold text-orange-600">{stats.activeMaintenance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="text-lg font-semibold text-green-600">{stats.completedMaintenance}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Platform performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Uptime</span>
                      <span className="text-2xl font-bold">{stats.systemHealth}%</span>
                    </div>
                    <div className="w-full bg-muted dark:bg-secondary rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${stats.systemHealth}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Complete system activity history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          {activity.type === 'property' && <Building className="h-4 w-4 text-blue-500 mt-0.5" />}
                          {activity.type === 'maintenance' && <Wrench className="h-4 w-4 text-orange-500 mt-0.5" />}
                          <div>
                            <p className="font-medium">{activity.message}</p>
                            <p className="text-sm text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                        <Badge variant={activity.status === "success" ? "default" : activity.status === "error" ? "destructive" : "secondary"}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No activity found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
