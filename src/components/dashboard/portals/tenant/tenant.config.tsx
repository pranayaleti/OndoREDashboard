import {
  Wrench,
  CreditCard,
  FileText,
  MessageSquare,
  DollarSign,
  Calendar,
  Building,
  TrendingUp,
  CheckCircle,
  Clock,
  BadgeCheck,
  BarChart3,
  FileSpreadsheet,
  Receipt,
} from "lucide-react"
import { PortalConfig, StatCardConfig, QuickAction, DashboardTab, DashboardWidget } from "../../base/types"
import { propertyApi, maintenanceApi, type Property, type MaintenanceRequest } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { formatUSDate } from "@/lib/us-format"
import type { ActivityItem } from "../../base/types"
import { BookkeepingReportingWidget } from "../../widgets/bookkeeping-reporting"
import { TenantScreeningWidgetContainer } from "@/components/tenant-screening/TenantScreeningWidgetContainer"

/**
 * Tenant Portal Configuration
 */
export function createTenantConfig(
  assignedProperty: Property | null,
  maintenanceRequests: MaintenanceRequest[]
): PortalConfig {
  // Calculate next rent due date
  const getNextRentDueDate = () => {
    if (!assignedProperty) return null
    const moveInDate = new Date(assignedProperty.createdAt)
    const now = new Date()
    const nextDueDate = new Date(moveInDate)
    while (nextDueDate <= now) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)
    }
    return nextDueDate
  }

  const nextRentDue = getNextRentDueDate()
  const formatRentDueDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  // Calculate lease expiration (12 months from property creation)
  const getLeaseExpiration = () => {
    if (!assignedProperty?.createdAt) return null
    const leaseStart = new Date(assignedProperty.createdAt)
    const leaseEnd = new Date(leaseStart)
    leaseEnd.setMonth(leaseEnd.getMonth() + 12)
    return leaseEnd
  }

  const leaseExpiration = getLeaseExpiration()
  const formatLeaseExpiration = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  const getMonthsRemaining = () => {
    if (!leaseExpiration) return 0
    return Math.max(0, Math.ceil((leaseExpiration.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)))
  }

  const activeRequests = maintenanceRequests.filter(r => 
    (r.status === 'in_progress' || r.status === 'pending') && r.assignedTo
  )

  // Calculate maintenance statistics
  const completedMaintenance = maintenanceRequests.filter(r => r.status === 'completed').length
  const totalMaintenance = maintenanceRequests.length
  const maintenanceCompletionRate = totalMaintenance > 0 
    ? Math.round((completedMaintenance / totalMaintenance) * 100) 
    : 0

  // Calculate lease progress
  const getLeaseProgress = () => {
    if (!assignedProperty?.createdAt || !leaseExpiration) return 0
    const leaseStart = new Date(assignedProperty.createdAt)
    const now = new Date()
    const totalDays = (leaseExpiration.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24)
    const daysElapsed = (now.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24)
    return Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)
  }

  const leaseProgress = getLeaseProgress()

  // Calculate days at property
  const getDaysAtProperty = () => {
    if (!assignedProperty?.createdAt) return 0
    const moveInDate = new Date(assignedProperty.createdAt)
    const now = new Date()
    return Math.floor((now.getTime() - moveInDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  const daysAtProperty = getDaysAtProperty()

  // Mock payment statistics (from tenant-payments.tsx mock data)
  const paymentStats = {
    totalPaidThisYear: 9250, // Sum of last 5 payments
    totalPayments: 5,
    onTimePayments: 4,
    onTimeRate: 80, // 4 out of 5
    averagePayment: 1850,
    lastPaymentDate: "2024-01-01"
  }

  // Mock data counts (matching actual component data)
  const unreadMessagesCount = 2
  const documentsCount = 8

  // Stat cards configuration
  const statCards: StatCardConfig[] = [
    {
      id: "next-rent-due",
      title: "Next Rent Due",
      value: `$${assignedProperty?.price?.toLocaleString() || '0'}`,
      subtitle: nextRentDue ? `Due ${formatRentDueDate(nextRentDue)}` : 'N/A',
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      href: "/tenant/payments",
    },
    {
      id: "lease-expires",
      title: "Lease Expires",
      value: leaseExpiration ? formatLeaseExpiration(leaseExpiration) : "N/A",
      subtitle: leaseExpiration ? `${getMonthsRemaining()} months left` : "No lease data",
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
      href: "/tenant/lease-details",
    },
    {
      id: "maintenance-requests",
      title: "Active Requests",
      value: activeRequests.length,
      subtitle: totalMaintenance > 0 ? `${maintenanceCompletionRate}% completed` : "No requests",
      icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
      href: "/tenant/maintenance",
    },
    {
      id: "property-status",
      title: "Property Status",
      value: assignedProperty ? "Active" : "Not Assigned",
      subtitle: assignedProperty ? `${assignedProperty.addressLine1}, ${assignedProperty.city}` : "No property assigned",
      icon: <Building className="h-4 w-4 text-muted-foreground" />,
      href: assignedProperty ? "/tenant/lease-details" : undefined,
    },
    {
      id: "total-paid",
      title: "Total Paid (YTD)",
      value: `$${paymentStats.totalPaidThisYear.toLocaleString()}`,
      subtitle: `${paymentStats.totalPayments} payments`,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      href: "/tenant/payments",
    },
    {
      id: "payment-history",
      title: "Payment History",
      value: `${paymentStats.onTimeRate}%`,
      subtitle: `${paymentStats.onTimePayments}/${paymentStats.totalPayments} on-time`,
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
      href: "/tenant/payments",
    },
    {
      id: "lease-progress",
      title: "Lease Progress",
      value: `${Math.round(leaseProgress)}%`,
      subtitle: `${daysAtProperty} days at property`,
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      href: "/tenant/lease-details",
    },
    {
      id: "maintenance-stats",
      title: "Maintenance Stats",
      value: `${completedMaintenance}/${totalMaintenance}`,
      subtitle: totalMaintenance > 0 ? `${maintenanceCompletionRate}% completion rate` : "No requests yet",
      icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
      href: "/tenant/maintenance",
    },
  ]

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: "maintenance",
      title: "Maintenance",
      description: "Submit Request",
      icon: <Wrench className="h-8 w-8 text-blue-500" />,
      href: "/tenant/maintenance",
    },
    {
      id: "payments",
      title: "Payments",
      description: "View History",
      icon: <CreditCard className="h-8 w-8 text-green-500" />,
      href: "/tenant/payments",
    },
    {
      id: "documents",
      title: "Documents",
      description: `${documentsCount} Documents`,
      icon: <FileText className="h-8 w-8 text-purple-500" />,
      href: "/tenant/documents",
    },
    {
      id: "messages",
      title: "Messages",
      description: unreadMessagesCount > 0 ? `${unreadMessagesCount} New` : "View Messages",
      icon: <MessageSquare className="h-8 w-8 text-orange-500" />,
      href: "/tenant/messages",
    },
  ]

  // Generate activity feed (reserved for future ActivityFeed integration)
  const _activities: ActivityItem[] = [
    // Maintenance activities
    ...maintenanceRequests.slice(0, 2).map((m, idx) => ({
      id: `maint-${idx}`,
      type: "maintenance" as const,
      message: `Maintenance request "${m.title}" ${m.status === 'completed' ? 'completed' : 'updated'}`,
      time: formatUSDate(m.updatedAt),
      status: m.status === 'completed' ? 'success' as const : 'warning' as const,
      href: `/tenant/maintenance`,
    })),
    // Payment activity
    {
      id: "payment-1",
      type: "payment" as const,
      message: "Rent payment processed successfully",
      time: "2 days ago",
      status: "success" as const,
      href: "/tenant/payments",
    },
    // Message activity
    ...(unreadMessagesCount > 0 ? [{
      id: "message-1",
      type: "message" as const,
      message: `You have ${unreadMessagesCount} new message${unreadMessagesCount > 1 ? 's' : ''}`,
      time: "1 day ago",
      status: "info" as const,
      href: "/tenant/messages",
    }] : []),
  ]
  void _activities

  // Dashboard tabs configuration
  const tabs: DashboardTab[] = [
    {
      id: "overview",
      label: "Overview",
      value: "overview",
      content: (
        <div className="space-y-6">
          {assignedProperty ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Your Property</CardTitle>
                  <CardDescription>Current rental property details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-lg font-semibold">
                      {assignedProperty.addressLine1}
                      {assignedProperty.addressLine2 && `, ${assignedProperty.addressLine2}`}
                      {assignedProperty.city && `, ${assignedProperty.city}`}
                      {assignedProperty.state && `, ${assignedProperty.state}`}
                      {assignedProperty.zipcode && ` ${assignedProperty.zipcode}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                      <p className="text-lg font-semibold">${assignedProperty.price?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Days at Property</p>
                      <p className="text-lg font-semibold">{daysAtProperty} days</p>
                    </div>
                  </div>
                  <Link to="/tenant/lease-details">
                    <Button variant="outline" className="w-full">
                      View Lease Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                  <CardDescription>Your payment statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Paid (YTD)</p>
                      <p className="text-xl font-semibold">${paymentStats.totalPaidThisYear.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">On-Time Rate</p>
                      <p className="text-xl font-semibold">{paymentStats.onTimeRate}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                      <p className="text-lg font-semibold">{paymentStats.totalPayments}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Payment</p>
                      <p className="text-lg font-semibold">${paymentStats.averagePayment.toLocaleString()}</p>
                    </div>
                  </div>
                  <Link to="/tenant/payments">
                    <Button variant="outline" className="w-full">
                      View Payment History
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Maintenance Summary */}
              {totalMaintenance > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance Summary</CardTitle>
                    <CardDescription>Your maintenance request statistics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                        <p className="text-xl font-semibold">{totalMaintenance}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                        <p className="text-xl font-semibold text-green-600">{completedMaintenance}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Completion Rate</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${maintenanceCompletionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{maintenanceCompletionRate}%</span>
                      </div>
                    </div>
                    <Link to="/tenant/maintenance">
                      <Button variant="outline" className="w-full">
                        View All Requests
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Lease Progress */}
              {leaseExpiration && (
                <Card>
                  <CardHeader>
                    <CardTitle>Lease Progress</CardTitle>
                    <CardDescription>Your lease timeline</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Lease Completion</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${leaseProgress}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{Math.round(leaseProgress)}%</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Days at Property</p>
                        <p className="font-semibold">{daysAtProperty} days</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Months Remaining</p>
                        <p className="font-semibold">{getMonthsRemaining()} months</p>
                      </div>
                    </div>
                    <Link to="/tenant/lease-details">
                      <Button variant="outline" className="w-full">
                        View Lease Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Property Assigned</CardTitle>
                <CardDescription>You don't have a property assigned yet</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-4">
                  Contact your property manager to get assigned to a property.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: "property",
      label: "Property",
      value: "property",
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
            <CardDescription>View your rental property details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">View detailed property information.</p>
              <Link to="/tenant/lease-details">
                <Button>Go to Lease Details</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "maintenance",
      label: "Maintenance",
      value: "maintenance",
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Requests</CardTitle>
            <CardDescription>Submit and track maintenance requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Manage your maintenance requests.</p>
              <Link to="/tenant/maintenance">
                <Button>Go to Maintenance</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "payments",
      label: "Payments",
      value: "payments",
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View and manage your payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                View your payment history, make payments, and manage payment methods.
              </p>
              <Link to="/tenant/payments">
                <Button>Go to Payments</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ),
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
          ctaHref="/tenant/lease-details"
          ctaLabel="View my screening"
          description="Review your screening status, keep documents up to date, and unlock faster renewals."
          title="Your Screening Status"
          limit={3}
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
          eyebrow="Payments & Reporting"
          title="Stay on top of rent, receipts, and reimbursements."
          subtitle="Centralize rent history, categorize reimbursements, and export statements when you need them."
          ctaLabel="View payments"
          ctaHref="/tenant/payments"
          transactionsHref="/tenant/payments"
          cashFlowHref="/tenant/payments"
          taxPackageCardHref="/tenant/documents"
          features={[
            {
              label: "Auto-categorize transactions",
              icon: <BadgeCheck className="h-4 w-4" />,
              href: "/tenant/payments",
            },
            {
              label: "Monitor income & expenses",
              icon: <BarChart3 className="h-4 w-4" />,
              href: "/tenant/payments",
            },
            {
              label: "Auto-generate reports",
              icon: <FileSpreadsheet className="h-4 w-4" />,
              href: "/tenant/documents",
            },
            {
              label: "Make tax time simple",
              icon: <Receipt className="h-4 w-4" />,
              href: "/tenant/documents",
            },
          ]}
          taxSummary={{
            timePeriod: "Lease Term",
            properties: assignedProperty ? assignedProperty.addressLine1 ?? "Current Property" : "Pending Assignment",
            categorized: paymentStats.totalPayments * 5,
            uncategorized: Math.max(0, paymentStats.totalPayments - paymentStats.onTimePayments),
            attachments: documentsCount,
            ctaLabel: "Download receipts",
            ctaHref: "/tenant/documents",
          }}
        />
      ),
    },
  ]

  return {
    portalId: "tenant",
    role: "tenant",
    title: "Dashboard",
    description: "Your rental property overview",
    
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
      assignedProperty: () => propertyApi.getTenantProperty().catch(() => null),
      maintenanceRequests: () => maintenanceApi.getTenantMaintenanceRequests().catch(() => []),
    },
    
    // Theme
    theme: {
      primaryColor: "#F97316", // Orange for tenant
      accentColor: "#3B82F6",
    },
  } as PortalConfig
}

