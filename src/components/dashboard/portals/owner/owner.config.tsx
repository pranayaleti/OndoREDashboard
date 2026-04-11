import {
  Building,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  Wrench,
  Plus,
  MessageSquare,
  FolderOpen,
  BadgeCheck,
  FileSpreadsheet,
  Receipt,
} from "lucide-react"
import { PortalConfig, StatCardConfig, QuickAction, DashboardTab, DashboardWidget } from "../../base/types"
import { propertyApi, type Property } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { formatUSDate } from "@/lib/us-format"
import type { ActivityItem } from "../../base/types"
import { BookkeepingReportingWidget } from "../../widgets/bookkeeping-reporting"
import { TenantScreeningWidgetContainer } from "@/components/tenant-screening/TenantScreeningWidgetContainer"

/**
 * Owner Portal Configuration
 * 
 * This configuration defines the Owner dashboard structure, widgets, and data sources.
 */
export function createOwnerConfig(properties: Property[]): PortalConfig {
  // Calculate portfolio stats from properties
  const portfolioStats = properties.reduce((acc, property) => {
    acc.totalProperties += 1
    acc.totalUnits += 1 // Each property counts as 1 unit
    acc.occupiedUnits += property.tenantId ? 1 : 0
    const monthlyRevenue = property.tenantId ? (property.price || 0) : 0
    acc.monthlyRevenue += monthlyRevenue
    acc.monthlyExpenses += monthlyRevenue * 0.2 // Estimate 20% expenses
    acc.netIncome += monthlyRevenue - (monthlyRevenue * 0.2)
    
    // Count property types
    const propertyType = property.type?.toLowerCase() || ""
    if (propertyType.includes("single") || propertyType.includes("family") || propertyType.includes("house")) {
      acc.propertyTypeBreakdown.singleFamily += 1
    } else if (propertyType.includes("apartment") || propertyType.includes("unit")) {
      acc.propertyTypeBreakdown.apartments += 1
    } else {
      acc.propertyTypeBreakdown.other += 1
    }
    
    return acc
  }, {
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netIncome: 0,
    occupancyRate: 0,
    propertyTypeBreakdown: { singleFamily: 0, apartments: 0, other: 0 },
    revenueTrend: 4.3, // Mock trend
    expenseBreakdown: {
      maintenance: 0,
      utilities: 0,
      propertyManagement: 0,
      insurance: 0
    }
  })

  portfolioStats.occupancyRate = portfolioStats.totalProperties > 0 
    ? (portfolioStats.occupiedUnits / portfolioStats.totalProperties) * 100 
    : 0

  portfolioStats.expenseBreakdown.maintenance = portfolioStats.monthlyExpenses * 0.36
  portfolioStats.expenseBreakdown.utilities = portfolioStats.monthlyExpenses * 0.26
  portfolioStats.expenseBreakdown.propertyManagement = portfolioStats.monthlyExpenses * 0.24
  portfolioStats.expenseBreakdown.insurance = portfolioStats.monthlyExpenses * 0.13

  // Generate activity feed (reserved for future ActivityFeed integration)
  const _activities: ActivityItem[] = properties.slice(0, 5).map((p, idx) => ({
    id: `prop-${idx}`,
    type: "property" as const,
    message: `Property "${p.title}" ${p.status === 'approved' ? 'approved' : p.status === 'pending' ? 'pending review' : 'rejected'}`,
    time: formatUSDate(p.createdAt),
    status: p.status === 'approved' ? 'success' as const : p.status === 'rejected' ? 'error' as const : 'warning' as const,
    href: `/owner/properties`,
  }))
  void _activities

  // Stat cards configuration
  const statCards: StatCardConfig[] = [
    {
      id: "total-properties",
      title: "Total Properties",
      value: portfolioStats.totalProperties,
      subtitle: `${portfolioStats.propertyTypeBreakdown.singleFamily} single-family, ${portfolioStats.propertyTypeBreakdown.apartments} apartments`,
      icon: <Building className="h-4 w-4 text-muted-foreground" />,
      href: "/owner/properties",
    },
    {
      id: "monthly-revenue",
      title: "Monthly Revenue",
      value: `$${portfolioStats.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${portfolioStats.revenueTrend}% from last month`,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      trend: {
        value: portfolioStats.revenueTrend,
        label: "from last month",
        isPositive: true,
      },
      href: "/owner/finances",
    },
    {
      id: "maintenance-requests",
      title: "Maintenance Requests",
      value: "5 Active", // Mock data - would come from maintenance API
      subtitle: "3 completed this month",
      icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
      href: "/owner/maintenance",
    },
    {
      id: "occupancy-rate",
      title: "Occupancy Rate",
      value: `${Math.round(portfolioStats.occupancyRate)}%`,
      subtitle: `${portfolioStats.occupiedUnits} of ${portfolioStats.totalProperties} units occupied`,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      href: "/owner/tenants",
    },
  ]

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: "add-property",
      title: "Add Property",
      description: "New Investment",
      icon: <Plus className="h-8 w-8 text-green-500" />,
      href: "/owner/property-management/add",
    },
    {
      id: "messages",
      title: "Messages",
      description: "3 Unread", // Mock
      icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
      href: "/owner/messages",
    },
    {
      id: "finances",
      title: "Finances",
      description: "Track Income",
      icon: <DollarSign className="h-8 w-8 text-green-500" />,
      href: "/owner/finances",
    },
    {
      id: "tenants",
      title: "Tenants",
      description: "Occupancy",
      icon: <Users className="h-8 w-8 text-orange-500" />,
      href: "/owner/tenants",
    },
    {
      id: "reports",
      title: "Reports",
      description: "Analytics",
      icon: <BarChart3 className="h-8 w-8 text-indigo-500" />,
      href: "/owner/reports",
    },
    {
      id: "documents",
      title: "Documents",
      description: "Files & Records",
      icon: <FolderOpen className="h-8 w-8 text-purple-500" />,
      href: "/owner/documents",
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
          {/* Financial Overview Widget */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Revenue and expenses for the current month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Revenue</span>
                  <span className="text-lg font-bold">
                    ${portfolioStats.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-muted dark:bg-secondary rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Expenses</span>
                  <span className="text-lg font-bold">
                    ${portfolioStats.monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-muted dark:bg-secondary rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(portfolioStats.monthlyExpenses / portfolioStats.monthlyRevenue) * 100}%` }}></div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Net Income</span>
                  <span className="text-xl font-bold text-green-600">
                    ${portfolioStats.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Portfolio Widget */}
          <Card>
            <CardHeader>
              <CardTitle>Property Portfolio</CardTitle>
              <CardDescription>Your investment breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Total Properties</p>
                      <p className="text-xs text-muted-foreground">All properties</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{portfolioStats.totalProperties}</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Occupied Units</p>
                      <p className="text-xs text-muted-foreground">Currently rented</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{portfolioStats.occupiedUnits}</div>
                </div>
              </div>
              <Link to="/owner/properties">
                <Button variant="outline" className="w-full">
                  View All Properties
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
            <CardTitle>Your Properties</CardTitle>
            <CardDescription>Manage your property portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">View and manage all your properties.</p>
              <Link to="/owner/properties">
                <Button>Go to Properties</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "alerts",
      label: "Alerts",
      value: "alerts",
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>Important updates and reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active alerts</p>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "activity",
      label: "Recent Activity",
      value: "activity",
      content: null, // Activity feed will be shown via showActivityFeed
    },
  ]

  const widgets: DashboardWidget[] = [
    {
      id: "tenant-screening",
      title: "Tenant Screening",
      gridCols: 2,
      priority: 10,
      component: (
        <TenantScreeningWidgetContainer
          ctaHref="/owner/tenants"
          ctaLabel="View applicants"
          description="See every applicant's status, fraud signals, and verification progress."
          title="Tenant Screening Pipeline"
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
          ctaLabel="Review finances"
          ctaHref="/owner/finances"
          subtitle="Track NOI, cash flow, and export accountant-ready statements."
          transactionsHref="/owner/finances?tab=overview"
          cashFlowHref="/owner/finances?tab=income"
          taxPackageCardHref="/owner/reports"
          features={[
            {
              label: "Auto-categorize transactions",
              icon: <BadgeCheck className="h-4 w-4" />,
              href: "/owner/finances?tab=overview",
            },
            {
              label: "Monitor income & expenses",
              icon: <BarChart3 className="h-4 w-4" />,
              href: "/owner/finances?tab=income",
            },
            {
              label: "Auto-generate reports",
              icon: <FileSpreadsheet className="h-4 w-4" />,
              href: "/owner/reports",
            },
            {
              label: "Make tax time simple",
              icon: <Receipt className="h-4 w-4" />,
              href: "/owner/reports",
            },
          ]}
          cashFlow={{
            netCashFlow: `$${portfolioStats.netIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            cashInflow: `$${portfolioStats.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            cashOutflow: `$${portfolioStats.monthlyExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            months: ["Apr", "May", "Jun", "Jul"],
          }}
          taxSummary={{
            timePeriod: "Current Year",
            properties: `${portfolioStats.totalProperties} Properties`,
            categorized: portfolioStats.totalProperties * 40,
            uncategorized: Math.max(1, portfolioStats.totalProperties - portfolioStats.occupiedUnits),
            attachments: portfolioStats.totalProperties * 2,
            ctaLabel: "Download owner pack",
            ctaHref: "/owner/reports",
          }}
        />
      ),
    },
  ]

  return {
    portalId: "owner",
    role: "owner",
    title: "Dashboard",
    description: "Your investment portfolio overview",
    
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
    },
    
    // Theme
    theme: {
      primaryColor: "#10B981", // Green for owner
      accentColor: "#3B82F6",
    },
  } as PortalConfig
}

