import {
  Building,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  Mail,
  AlertTriangle,
  DollarSign,
  BadgeCheck,
  BarChart3,
  FileSpreadsheet,
  Receipt,
  TrendingUp,
  CreditCard,
} from "lucide-react"
import { PortalConfig, StatCardConfig, QuickAction, DashboardTab, DashboardWidget } from "../../base/types"
import { propertyApi, authApi, leadApi, type Property, type InvitedUser, type Lead } from "@/lib/api"
import { reportsApi, type PnLStatement } from "@/lib/api/clients/reports"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { formatUSDate, formatUSD } from "@/lib/us-format"
import type { ActivityItem } from "../../base/types"
import { BookkeepingReportingWidget } from "../../widgets/bookkeeping-reporting"
import { TenantScreeningWidgetContainer } from "@/components/tenant-screening/TenantScreeningWidgetContainer"
import { HomeCareRemindersCard } from "@/components/HomeCareRemindersCard"

/**
 * Manager Portal Configuration
 */
export function createManagerConfig(
  properties: Property[],
  invitedUsers: InvitedUser[],
  leads: Lead[],
  financialSummary: PnLStatement | null = null
): PortalConfig {
  const pendingProperties = properties.filter(p => p.status === "pending")
  
  // Calculate stats from data
  const stats = {
    totalProperties: properties.length,
    pendingReview: pendingProperties.length,
    approvedProperties: properties.filter(p => p.status === "approved").length,
    rejectedProperties: properties.filter(p => p.status === "rejected").length,
    totalOwners: invitedUsers.filter(u => u.role === 'owner').length,
    totalTenants: invitedUsers.filter(u => u.role === 'tenant').length,
    activeLeads: leads.filter(l => l.status === 'new' || l.status === 'contacted' || l.status === 'qualified').length,
  }

  // Generate activity feed (reserved for future ActivityFeed integration)
  const _activities: ActivityItem[] = [
    ...properties.slice(0, 3).map((p, idx) => ({
      id: `prop-${idx}`,
      type: "property" as const,
      message: `Property "${p.title}" ${p.status === 'pending' ? 'submitted for review' : p.status === 'approved' ? 'approved' : 'rejected'}`,
      time: formatUSDate(p.createdAt),
      status: p.status === 'approved' ? 'success' as const : p.status === 'rejected' ? 'error' as const : 'warning' as const,
      href: `/dashboard/properties`,
    })),
    ...leads.slice(0, 2).map((l, idx) => ({
      id: `lead-${idx}`,
      type: "user" as const,
      message: `New lead from ${l.tenantName}`,
      time: formatUSDate(l.createdAt),
      status: 'info' as const,
      href: `/dashboard/leads`,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)
  void _activities

  // Stat cards configuration
  const statCards: StatCardConfig[] = [
    {
      id: "total-properties",
      title: "Total Properties",
      value: stats.totalProperties,
      subtitle: `${stats.pendingReview} pending review`,
      icon: <Building className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard/properties",
    },
    {
      id: "pending-review",
      title: "Pending Review",
      value: stats.pendingReview,
      subtitle: "Awaiting approval",
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard/properties",
    },
    {
      id: "approved-properties",
      title: "Approved",
      value: stats.approvedProperties,
      subtitle: "Active properties",
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard/properties",
    },
    {
      id: "active-leads",
      title: "Active Leads",
      value: stats.activeLeads,
      subtitle: "New inquiries",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard/leads",
    },
    {
      id: "revenue-mtd",
      title: "Revenue (MTD)",
      value: financialSummary ? formatUSD(financialSummary.income.total) : "—",
      subtitle: "Month-to-date income",
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard/finances",
    },
    {
      id: "expenses-mtd",
      title: "Expenses (MTD)",
      value: financialSummary ? formatUSD(financialSummary.expenses.total) : "—",
      subtitle: "Month-to-date expenses",
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard/finances",
    },
    {
      id: "net-income-mtd",
      title: "Net Income (MTD)",
      value: financialSummary ? formatUSD(financialSummary.netIncome) : "—",
      subtitle: "Month-to-date net income",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      href: "/dashboard/finances",
    },
  ]

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: "properties",
      title: "Properties",
      description: "Review & manage",
      icon: <Building className="h-8 w-8 text-blue-500" />,
      href: "/dashboard/properties",
    },
    {
      id: "owners",
      title: "Owners",
      description: "View & manage",
      icon: <Users className="h-8 w-8 text-green-500" />,
      href: "/dashboard/owners",
    },
    {
      id: "tenants",
      title: "Tenants",
      description: "View & manage",
      icon: <Users className="h-8 w-8 text-purple-500" />,
      href: "/dashboard/tenants",
    },
    {
      id: "maintenance",
      title: "Maintenance",
      description: "Requests & staff",
      icon: <AlertTriangle className="h-8 w-8 text-orange-500" />,
      href: "/dashboard/maintenance",
    },
    {
      id: "finances",
      title: "Finances",
      description: "P&L & payments",
      icon: <DollarSign className="h-8 w-8 text-emerald-500" />,
      href: "/dashboard/finances",
    },
    {
      id: "invite",
      title: "Invite User",
      description: "Add owner/tenant",
      icon: <UserPlus className="h-8 w-8 text-indigo-500" />,
      href: "/dashboard/owners/new",
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
                  <div className="text-2xl font-bold">{stats.pendingReview}</div>
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
              <Link to="/dashboard/properties">
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
                    <Users className="h-5 w-5 text-green-500" />
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
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Active Leads</p>
                      <p className="text-xs text-muted-foreground">New inquiries</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stats.activeLeads}</div>
                </div>
              </div>
              <Link to="/dashboard/owners">
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
      id: "properties",
      label: "Properties",
      value: "properties",
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Property Management</CardTitle>
            <CardDescription>Review and manage all properties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">View and manage all properties.</p>
              <Link to="/dashboard/properties">
                <Button>Go to Properties</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "leads",
      label: "Leads",
      value: "leads",
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Lead Management</CardTitle>
            <CardDescription>Manage property inquiries and leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">View and manage all leads.</p>
              <Link to="/dashboard/leads">
                <Button>Go to Leads</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
      id: "home-care-reminders",
      title: "Home care reminders",
      gridCols: 2,
      priority: 0,
      component: <HomeCareRemindersCard />,
    },
    {
      id: "tenant-screening",
      title: "Tenant Screening",
      gridCols: 2,
      priority: 5,
      component: (
        <TenantScreeningWidgetContainer
          ctaHref="/dashboard/tenants"
          ctaLabel="Manage applicants"
          description="Track every applicant across properties, flag fraud faster, and move qualified renters forward."
          title="Screening Control Center"
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
          ctaLabel="Go to finances"
          ctaHref="/dashboard/finances"
          subtitle="Keep every property ledger synchronized automatically."
          transactionsHref="/dashboard/transactions"
          cashFlowHref="/dashboard/cash-flow"
          taxPackageCardHref="/dashboard/taxes"
          features={[
            {
              label: "Auto-categorize transactions",
              icon: <BadgeCheck className="h-4 w-4" />,
              href: "/dashboard/transactions",
            },
            {
              label: "Monitor income & expenses",
              icon: <BarChart3 className="h-4 w-4" />,
              href: "/dashboard/cash-flow",
            },
            {
              label: "Auto-generate reports",
              icon: <FileSpreadsheet className="h-4 w-4" />,
              href: "/dashboard/reports",
            },
            {
              label: "Make tax time simple",
              icon: <Receipt className="h-4 w-4" />,
              href: "/dashboard/taxes",
            },
          ]}
          taxSummary={{
            timePeriod: "Month to Date",
            properties: `${stats.totalProperties} Properties`,
            categorized: stats.approvedProperties * 12 + stats.totalOwners,
            uncategorized: Math.max(1, stats.pendingReview),
            attachments: stats.totalTenants + stats.activeLeads,
            ctaLabel: "Export manager pack",
            ctaHref: "/dashboard/taxes",
          }}
        />
      ),
    },
  ]

  return {
    portalId: "manager",
    role: "manager",
    title: "Manager Portal",
    description: "Property management and oversight",
    headerIcon: <Building className="h-8 w-8 text-blue-600" />,
    
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
      leads: () => leadApi.getManagerLeads().catch(() => []),
      financialSummary: async () => {
        const now = new Date()
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
        const endDate = now.toISOString().slice(0, 10)
        try {
          const res = await authApi.getInvitedUsers(1, 500)
          const ownerIds = (res.users ?? [])
            .filter((u) => u.role === "owner" && u.isActive)
            .map((u) => u.id)
          return await reportsApi.getAggregatedPnLForStaff({ startDate, endDate }, ownerIds)
        } catch {
          return null
        }
      },
    },
    
    // Theme
    theme: {
      primaryColor: "#3B82F6", // Blue for manager
      accentColor: "#10B981",
    },
  } as PortalConfig
}

