import { Shield, Users, Building, Wrench, Clock, CheckCircle, XCircle } from "lucide-react"
import { PortalConfig, StatCardConfig, QuickAction, DashboardTab, DashboardWidget } from "../../base/types"
import { propertyApi, authApi, maintenanceApi, type Property, type InvitedUser, type MaintenanceRequest } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { formatUSDate } from "@/lib/us-format"
import type { ActivityItem } from "../../base/types"
import { BookkeepingReportingWidget } from "../../widgets/bookkeeping-reporting"
import { TenantScreeningWidgetContainer } from "@/components/tenant-screening/TenantScreeningWidgetContainer"

/**
 * Super Admin Portal Configuration
 * Similar to Admin but with additional manager management capabilities
 */
export function createSuperAdminConfig(
  properties: Property[],
  invitedUsers: InvitedUser[],
  maintenanceRequests: MaintenanceRequest[]
): PortalConfig {
  // Calculate stats from data
  const stats = {
    totalManagers: 0, // Managers are managed separately
    totalOwners: invitedUsers.filter(u => u.role === 'owner').length,
    totalTenants: invitedUsers.filter(u => u.role === 'tenant').length,
    totalMaintenance: maintenanceRequests.length,
    totalProperties: properties.length,
    pendingProperties: properties.filter(p => p.status === 'pending').length,
    approvedProperties: properties.filter(p => p.status === 'approved').length,
    rejectedProperties: properties.filter(p => p.status === 'rejected').length,
    activeMaintenance: maintenanceRequests.filter(m => m.status === 'in_progress' || m.status === 'pending').length,
    completedMaintenance: maintenanceRequests.filter(m => m.status === 'completed').length,
    systemHealth: 98.5, // Mock
  }

  // Generate activity feed (reserved for future ActivityFeed integration)
  const _activities: ActivityItem[] = [
    ...properties.slice(0, 3).map((p, idx) => ({
      id: `prop-${idx}`,
      type: "property" as const,
      message: `Property "${p.title}" ${p.status === 'pending' ? 'submitted for review' : p.status === 'approved' ? 'approved' : 'rejected'}`,
      time: formatUSDate(p.createdAt),
      status: p.status === 'approved' ? 'success' as const : p.status === 'rejected' ? 'error' as const : 'warning' as const,
      href: `/super-admin/properties`,
    })),
    ...maintenanceRequests.slice(0, 2).map((m, idx) => ({
      id: `maint-${idx}`,
      type: "maintenance" as const,
      message: `Maintenance request "${m.title}" ${m.status === 'completed' ? 'completed' : 'updated'}`,
      time: formatUSDate(m.updatedAt),
      status: m.status === 'completed' ? 'success' as const : 'warning' as const,
      href: `/super-admin/maintenance`,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)

  // Stat cards configuration
  const statCards: StatCardConfig[] = [
    {
      id: "total-properties",
      title: "Total Properties",
      value: stats.totalProperties,
      subtitle: `${stats.pendingProperties} pending review`,
      icon: <Building className="h-4 w-4 text-muted-foreground" />,
      href: "/super-admin/properties",
    },
    {
      id: "managers",
      title: "Managers",
      value: stats.totalManagers,
      subtitle: "Active manager accounts",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      href: "/super-admin/managers",
    },
    {
      id: "owners",
      title: "Owners",
      value: stats.totalOwners,
      subtitle: "Registered owners",
      icon: <Building className="h-4 w-4 text-muted-foreground" />,
      href: "/super-admin/owners",
    },
    {
      id: "maintenance",
      title: "Maintenance",
      value: stats.activeMaintenance,
      subtitle: `${stats.completedMaintenance} completed this month`,
      icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
      href: "/super-admin/maintenance",
    },
  ]

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: "managers",
      title: "Managers",
      description: "Manage accounts",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      href: "/super-admin/managers",
    },
    {
      id: "admins",
      title: "Admins",
      description: "View & manage",
      icon: <Shield className="h-8 w-8 text-purple-500" />,
      href: "/super-admin/admins",
    },
    {
      id: "owners",
      title: "Owners",
      description: "View & manage",
      icon: <Building className="h-8 w-8 text-green-500" />,
      href: "/super-admin/owners",
    },
    {
      id: "tenants",
      title: "Tenants",
      description: "View & manage",
      icon: <Users className="h-8 w-8 text-purple-500" />,
      href: "/super-admin/tenants",
    },
    {
      id: "maintenance",
      title: "Maintenance",
      description: "Staff & requests",
      icon: <Wrench className="h-8 w-8 text-orange-500" />,
      href: "/super-admin/maintenance",
    },
  ]

  // Dashboard tabs configuration
  const tabs: DashboardTab[] = [
    {
      id: "overview",
      label: "Overview",
      value: "overview",
      content: (
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
              <Link to="/super-admin/properties">
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
              <Link to="/super-admin/managers">
                <Button variant="outline" className="w-full">
                  Manage Users
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "managers",
      label: "Managers",
      value: "managers",
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Manager Management</CardTitle>
            <CardDescription>View and manage all manager accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Managers are managed through the dedicated manager management page.</p>
              <Link to="/super-admin/managers">
                <Button>Go to Manager Management</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "stats",
      label: "System Stats",
      value: "stats",
      content: (
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
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-2xl font-bold">{stats.systemHealth}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats.systemHealth}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "activity",
      label: "Activity",
      value: "activity",
      content: null, // Activity feed will be shown via showActivityFeed
    },
  ]

  const widgets: DashboardWidget[] = [
    {
      id: "tenant-screening",
      title: "Tenant Screening",
      gridCols: 2,
      priority: 5,
      component: (
        <TenantScreeningWidgetContainer
          ctaHref="/super-admin/tenants"
          ctaLabel="View screening analytics"
          description="Organization-wide visibility into applications, fraud signals, and verification speed."
          title="Screening Intelligence"
        />
      ),
    },
    {
      id: "bookkeeping-reporting",
      title: "Bookkeeping & Reporting",
      gridCols: 2,
      priority: 50,
      component: (
        <BookkeepingReportingWidget
          ctaLabel="Audit finances"
          ctaHref="/super-admin/finances"
          subtitle="Roll-up company-wide books, approvals, and tax packages."
          taxSummary={{
            timePeriod: "Quarter to Date",
            properties: `${stats.totalProperties} Properties`,
            categorized: stats.totalProperties * 30,
            uncategorized: Math.max(1, stats.pendingProperties),
            attachments: stats.totalManagers + stats.totalMaintenance,
            ctaLabel: "Download compliance pack",
            ctaHref: "/super-admin/reports",
          }}
        />
      ),
    },
  ]

  return {
    portalId: "super_admin",
    role: "super_admin",
    title: "Super Admin Portal",
    description: "System-wide management and oversight",
    headerIcon: <Shield className="h-8 w-8 text-purple-600" />,
    
    // Layout configuration
    showHeader: true,
    showTabs: false,
    showQuickActions: true,
    showStats: true,
    showActivityFeed: true,
    
    // Content
    tabs,
    statCards,
    quickActions,
    widgets,
    
    // Data configuration
    dataFetchers: {
      properties: () => propertyApi.getProperties().catch(() => []),
      invitedUsers: () => authApi.getInvitedUsers().catch(() => []),
      maintenanceRequests: () => maintenanceApi.getManagerMaintenanceRequests().catch(() => []),
    },
    
    // Theme
    theme: {
      primaryColor: "#9333EA", // Purple for super admin
      accentColor: "#3B82F6",
    },
  } as PortalConfig
}

