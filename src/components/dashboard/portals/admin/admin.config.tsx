import {
  Shield,
  Users,
  Building,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  BadgeCheck,
  BarChart3,
  FileSpreadsheet,
  Receipt,
} from "lucide-react"
import { PortalConfig, StatCardConfig, QuickAction, DashboardTab, ActivityItem, DashboardWidget } from "../../base/types"
import { propertyApi, authApi, maintenanceApi, type Property, type InvitedUser, type MaintenanceRequest } from "@/lib/api"
import { formatUSDate } from "@/lib/us-format"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { BookkeepingReportingWidget } from "../../widgets/bookkeeping-reporting"
import { TenantScreeningWidgetContainer } from "@/components/tenant-screening/TenantScreeningWidgetContainer"

/**
 * Admin Portal Configuration
 * 
 * This configuration defines the Admin dashboard structure, widgets, and data sources.
 * The BaseDashboard component uses this config to render the portal.
 * 
 * PATTERN FOR OTHER PORTALS:
 * 1. Create similar config function accepting data parameters
 * 2. Calculate stats from provided data
 * 3. Generate statCards, quickActions, tabs arrays
 * 4. Define dataFetchers for BaseDashboardProvider
 * 5. Return PortalConfig object
 */

export function createAdminConfig(
  properties: Property[],
  invitedUsers: InvitedUser[],
  maintenanceRequests: MaintenanceRequest[]
): PortalConfig {
  // Calculate stats from data
  const stats = {
    totalManagers: 0, // Managers managed separately
    totalOwners: invitedUsers.filter(u => u.role === 'owner').length,
    totalTenants: invitedUsers.filter(u => u.role === 'tenant').length,
    totalMaintenance: maintenanceRequests.length,
    totalProperties: properties.length,
    pendingProperties: properties.filter(p => p.status === 'pending').length,
    approvedProperties: properties.filter(p => p.status === 'approved').length,
    rejectedProperties: properties.filter(p => p.status === 'rejected').length,
    activeMaintenance: maintenanceRequests.filter(m => m.status === 'in_progress' || m.status === 'pending').length,
    completedMaintenance: maintenanceRequests.filter(m => m.status === 'completed').length,
  }

  // Generate activity feed (reserved for future ActivityFeed integration)
  const _activities: ActivityItem[] = [
    ...properties.slice(0, 3).map((p, idx) => ({
      id: `prop-${idx}`,
      type: "property" as const,
      message: `Property "${p.title}" ${p.status === 'pending' ? 'submitted for review' : p.status === 'approved' ? 'approved' : 'rejected'}`,
      time: formatUSDate(p.createdAt),
      status: p.status === 'approved' ? 'success' as const : p.status === 'rejected' ? 'error' as const : 'warning' as const,
      href: `/admin/properties`,
    })),
    ...maintenanceRequests.slice(0, 2).map((m, idx) => ({
      id: `maint-${idx}`,
      type: "maintenance" as const,
      message: `Maintenance request "${m.title}" ${m.status === 'completed' ? 'completed' : 'updated'}`,
      time: formatUSDate(m.updatedAt),
      status: m.status === 'completed' ? 'success' as const : 'warning' as const,
      href: `/admin/maintenance`,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)
  void _activities

  // Stat cards configuration
  const statCards: StatCardConfig[] = [
    {
      id: "total-properties",
      title: "Total Properties",
      value: stats.totalProperties,
      subtitle: `${stats.pendingProperties} pending review`,
      icon: <Building className="h-4 w-4 text-muted-foreground" />,
      href: "/admin/properties",
    },
    {
      id: "managers",
      title: "Managers",
      value: stats.totalManagers,
      subtitle: "Active manager accounts",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      href: "/admin/managers",
    },
    {
      id: "owners",
      title: "Owners",
      value: stats.totalOwners,
      subtitle: "Registered owners",
      icon: <Building className="h-4 w-4 text-muted-foreground" />,
      href: "/admin/owners",
    },
    {
      id: "maintenance",
      title: "Maintenance",
      value: stats.activeMaintenance,
      subtitle: `${stats.completedMaintenance} completed this month`,
      icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
      href: "/admin/maintenance",
    },
  ]

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: "managers",
      title: "Managers",
      description: "Manage accounts",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      href: "/admin/managers",
    },
    {
      id: "owners",
      title: "Owners",
      description: "View & manage",
      icon: <Building className="h-8 w-8 text-green-500" />,
      href: "/admin/owners",
    },
    {
      id: "tenants",
      title: "Tenants",
      description: "View & manage",
      icon: <Users className="h-8 w-8 text-purple-500" />,
      href: "/admin/tenants",
    },
    {
      id: "maintenance",
      title: "Maintenance",
      description: "Staff & requests",
      icon: <Wrench className="h-8 w-8 text-orange-500" />,
      href: "/admin/maintenance",
    },
    {
      id: "finances",
      title: "Finances",
      description: "P&L & payments",
      icon: <DollarSign className="h-8 w-8 text-emerald-500" />,
      href: "/admin/finances",
    },
  ]

  // Dashboard tabs configuration
  const tabs: DashboardTab[] = [
    {
      id: "overview",
      label: "Overview",
      value: "overview",
      content: (
        <div className="space-y-6">
          {/* Property Status Overview Widget */}
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

          {/* User Statistics Widget */}
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
              <Link to="/admin/managers">
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
          ctaHref="/admin/tenants"
          ctaLabel="Audit applicants"
          description="Monitor screening volume, fraud prevention, and compliance signals across the organization."
          title="Screening Oversight"
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
          ctaLabel="Open finances"
          ctaHref="/admin/finances"
          transactionsHref="/admin/finances?tab=payments"
          cashFlowHref="/admin/finances?tab=overview"
          taxPackageCardHref="/admin/finances?tab=reports"
          features={[
            {
              label: "Auto-categorize transactions",
              icon: <BadgeCheck className="h-4 w-4" />,
              href: "/admin/finances?tab=payments",
            },
            {
              label: "Monitor income & expenses",
              icon: <BarChart3 className="h-4 w-4" />,
              href: "/admin/finances?tab=overview",
            },
            {
              label: "Auto-generate reports",
              icon: <FileSpreadsheet className="h-4 w-4" />,
              href: "/admin/reports",
            },
            {
              label: "Make tax time simple",
              icon: <Receipt className="h-4 w-4" />,
              href: "/admin/finances?tab=reports",
            },
          ]}
          taxSummary={{
            timePeriod: "Last Month",
            properties: `${stats.totalProperties} Properties`,
            categorized: stats.totalProperties * 5 + stats.totalOwners,
            uncategorized: Math.max(1, stats.pendingProperties),
            attachments: stats.totalMaintenance + 3,
            ctaLabel: "Download tax pack",
            ctaHref: "/admin/finances?tab=reports",
          }}
        />
      ),
    },
  ]

  return {
    portalId: "admin",
    role: "admin",
    title: "Admin Portal",
    description: "System-wide management and oversight",
    headerIcon: <Shield className="h-8 w-8 text-blue-600" />,
    
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
      properties: () => propertyApi.getProperties().then((r) => r.properties).catch(() => []),
      invitedUsers: () => authApi.getInvitedUsers().then((r) => r.users).catch(() => []),
      maintenanceRequests: () => maintenanceApi.getManagerMaintenanceRequests().catch(() => []),
    },
    
    // Theme configuration
    theme: {
      primaryColor: "#3B82F6", // Blue for admin
      accentColor: "#10B981",
    },
    
    // Initial data
    // Note: This will be populated by BaseDashboardProvider
  } as PortalConfig
}

