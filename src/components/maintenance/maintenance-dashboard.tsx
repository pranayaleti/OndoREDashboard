import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wrench, Clock, CheckCircle, AlertTriangle, Building } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MaintenanceNav } from "./maintenance-nav"

export default function MaintenanceDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  const navItems = [
    { label: "Overview", value: "overview", onClick: () => setActiveTab("overview") },
    { label: "My Tickets", value: "tickets", onClick: () => setActiveTab("tickets") },
    { label: "Properties", value: "properties", onClick: () => setActiveTab("properties") },
  ]

  // Mock data - replace with API calls
  const mockData = {
    stats: {
      assignedTickets: 8,
      inProgress: 3,
      completedToday: 2,
      pending: 5,
    },
    recentTickets: [
      { id: 1, property: "123 Main St, Apt 2B", issue: "Heating system repair", priority: "high", status: "in_progress", dueDate: "Today" },
      { id: 2, property: "456 Oak Ave, Unit 5", issue: "Plumbing leak", priority: "high", status: "pending", dueDate: "Tomorrow" },
      { id: 3, property: "789 Pine Rd", issue: "AC unit maintenance", priority: "medium", status: "completed", dueDate: "Completed" },
    ],
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="bg-card dark:bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Wrench className="h-8 w-8 text-orange-600" />
                Maintenance Portal
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your assigned maintenance tickets
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
          <MaintenanceNav items={navItems} activeTab={activeTab} />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assigned Tickets</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockData.stats.assignedTickets}</div>
                  <p className="text-xs text-muted-foreground">Total assigned</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockData.stats.inProgress}</div>
                  <p className="text-xs text-muted-foreground">Active work</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockData.stats.completedToday}</div>
                  <p className="text-xs text-muted-foreground">Finished today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockData.stats.pending}</div>
                  <p className="text-xs text-muted-foreground">Awaiting start</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Tickets */}
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
                  {mockData.recentTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <p className="font-medium">{ticket.property}</p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.issue}</p>
                        <p className="text-xs text-gray-500 mt-1">Due: {ticket.dueDate}</p>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "tickets" && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>My Tickets</CardTitle>
                <CardDescription>All assigned maintenance tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/maintenance/tickets">
                  <Button>View All Tickets</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "properties" && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Properties</CardTitle>
                <CardDescription>Properties with assigned tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Properties interface - connect to API to display properties with assigned tickets
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

