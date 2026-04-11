import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building,
  ArrowRight,
} from "lucide-react"
import { PortalConfig, StatCardConfig, QuickAction, DashboardTab, DashboardWidget } from "../../base/types"
import { maintenanceApi, type MaintenanceRequest } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { formatUSDate } from "@/lib/us-format"
import type { ActivityItem } from "../../base/types"
import { TenantScreeningWidgetContainer } from "@/components/tenant-screening/TenantScreeningWidgetContainer"
import { getDemoMaintenanceTickets } from "@/lib/seed-data"

/**
 * Maintenance Portal Configuration
 */
export function createMaintenanceConfig(
  maintenanceRequests: MaintenanceRequest[]
): PortalConfig {
  // Filter requests assigned to current technician (would need user ID in real implementation)
  // For now, we'll show all requests that have an assignedTo field
  const assignedRequests = maintenanceRequests.filter(r => r.assignedTo)
  
  // Calculate stats
  const stats = {
    assignedTickets: assignedRequests.length,
    inProgress: assignedRequests.filter(r => r.status === 'in_progress').length,
    completedToday: assignedRequests.filter(r => {
      if (r.status === 'completed' && r.dateCompleted) {
        const completedDate = new Date(r.dateCompleted)
        const today = new Date()
        return completedDate.toDateString() === today.toDateString()
      }
      return false
    }).length,
    pending: assignedRequests.filter(r => r.status === 'pending').length,
  }

  // Generate activity feed (reserved for future ActivityFeed integration)
  const _activities: ActivityItem[] = assignedRequests.slice(0, 5).map((r, idx) => ({
    id: `ticket-${idx}`,
    type: "maintenance" as const,
    message: `Ticket "${r.title}" ${r.status === 'completed' ? 'completed' : r.status === 'in_progress' ? 'in progress' : 'pending'}`,
    time: formatUSDate(r.updatedAt),
    status: r.status === 'completed' ? 'success' as const : r.status === 'in_progress' ? 'info' as const : 'warning' as const,
    href: `/maintenance/tickets`,
  }))
  void _activities

  // Stat cards configuration
  const statCards: StatCardConfig[] = [
    {
      id: "assigned-tickets",
      title: "Assigned Tickets",
      value: stats.assignedTickets,
      subtitle: "Total assigned",
      icon: <Wrench className="h-4 w-4 text-muted-foreground" />,
      href: "/maintenance/tickets",
    },
    {
      id: "in-progress",
      title: "In Progress",
      value: stats.inProgress,
      subtitle: "Active work",
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      href: "/maintenance/tickets",
    },
    {
      id: "completed-today",
      title: "Completed Today",
      value: stats.completedToday,
      subtitle: "Finished today",
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
      href: "/maintenance/tickets",
    },
    {
      id: "pending",
      title: "Pending",
      value: stats.pending,
      subtitle: "Awaiting start",
      icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" />,
      href: "/maintenance/tickets",
    },
  ]

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: "tickets",
      title: "My Tickets",
      description: "View all tickets",
      icon: <Wrench className="h-8 w-8 text-blue-500" />,
      href: "/maintenance/tickets",
    },
    {
      id: "properties",
      title: "Properties",
      description: "View properties",
      icon: <Building className="h-8 w-8 text-green-500" />,
      href: "/maintenance/tickets",
    },
  ]

  // Dashboard tabs configuration
  const tabs: DashboardTab[] = [
    {
      id: "overview",
      label: "Overview",
      value: "overview",
      content: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Tickets</CardTitle>
                <CardDescription>Your assigned maintenance tickets</CardDescription>
              </div>
              <Link to="/maintenance/tickets">
                <Button>View All Tickets</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedRequests.slice(0, 5).map((ticket) => {
                const getPriorityColor = (priority: string) => {
                  switch (priority) {
                    case "high": case "emergency":
                      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    case "medium":
                      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    default:
                      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  }
                }
                
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "completed":
                      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    case "in_progress":
                      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    default:
                      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }
                }

                return (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <p className="font-medium">{ticket.propertyAddress || ticket.propertyTitle || 'Property'}</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {ticket.dateScheduled ? formatUSDate(ticket.dateScheduled) : 'Not scheduled'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
              {assignedRequests.length === 0 && (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No assigned tickets</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "tickets",
      label: "My Tickets",
      value: "tickets",
      content: (
        <Card>
          <CardHeader>
            <CardTitle>All Assigned Tickets</CardTitle>
            <CardDescription>View and manage all your assigned maintenance tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">View all your assigned tickets.</p>
              <Link to="/maintenance/tickets">
                <Button>Go to Tickets</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "properties",
      label: "Properties",
      value: "properties",
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
            <CardDescription>Properties with assigned tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Properties interface - connect to API to display properties with assigned tickets</p>
            </div>
          </CardContent>
        </Card>
      ),
    },
  ]

  const widgets: DashboardWidget[] = [
    {
      id: "my-assigned-tickets",
      title: "My Assigned Tickets",
      gridCols: 2,
      priority: 0,
      component: (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>My Assigned Tickets</CardTitle>
                <CardDescription>Up to 5 active tickets currently on your board</CardDescription>
              </div>
              <Link to="/maintenance/tickets">
                <Button variant="outline" size="sm">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {assignedRequests.length > 0 ? (
              <div className="space-y-3">
                {assignedRequests
                  .filter((ticket) => ticket.status !== "completed")
                  .slice(0, 5)
                  .map((ticket) => {
                    const priorityTone =
                      ticket.priority === "emergency" || ticket.priority === "high"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                        : ticket.priority === "medium"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"

                    const statusTone =
                      ticket.status === "in_progress"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                        : ticket.status === "completed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"

                    return (
                      <div key={ticket.id} className="rounded-2xl border p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold">{ticket.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {ticket.propertyAddress || ticket.propertyTitle || "Property"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.dateScheduled ? `Scheduled ${formatUSDate(ticket.dateScheduled)}` : "Schedule pending"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={priorityTone}>{ticket.priority}</Badge>
                            <Badge className={statusTone}>{ticket.status.replace("_", " ")}</Badge>
                            <Button asChild variant="outline" size="sm">
                              <Link to="/maintenance/tickets">View</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No active tickets are assigned right now.
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: "tenant-screening",
      title: "Tenant Screening",
      gridCols: 2,
      priority: 5,
      component: (
        <TenantScreeningWidgetContainer
          ctaHref="/maintenance/tickets"
          ctaLabel="View flagged tickets"
          description="Surface fraud risk tied to maintenance requests and keep technicians looped in on verified residents."
          title="Fraud & Screening Alerts"
          limit={3}
        />
      ),
    },
  ]

  return {
    portalId: "maintenance",
    role: "maintenance",
    title: "Maintenance Portal",
    description: "Manage your assigned maintenance tickets",
    headerIcon: <Wrench className="h-8 w-8 text-orange-600" />,
    
    // Layout configuration
    showHeader: false,
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
      maintenanceRequests: async () => {
        try {
          const data = await maintenanceApi.getManagerMaintenanceRequests()
          return data.length > 0 ? data : getDemoMaintenanceTickets({ role: "maintenance", email: "maintenance@ondorealestate.com" })
        } catch {
          return getDemoMaintenanceTickets({ role: "maintenance", email: "maintenance@ondorealestate.com" })
        }
      },
    },
    
    // Theme
    theme: {
      primaryColor: "#F97316", // Orange for maintenance
      accentColor: "#3B82F6",
    },
  } as PortalConfig
}
