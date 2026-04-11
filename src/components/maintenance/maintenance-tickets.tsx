import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wrench, Building, Clock, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { maintenanceApi } from "@/lib/api"
import { EmptyState } from "@/components/ui/empty-state"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"
import { useAuth } from "@/lib/auth-context"
import { getDemoMaintenanceTickets } from "@/lib/seed-data"

export default function MaintenanceTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Array<{
    id: string
    property: string
    issue: string
    priority: string
    status: string
    assignedDate: string
    dueDate: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const list = await maintenanceApi.getManagerMaintenanceRequests()
      const fallbackList = getDemoMaintenanceTickets(user)
      const effectiveList = list.length > 0 ? list : fallbackList
      setTickets(
        effectiveList.map((r) => ({
          id: r.id,
          property: (r.propertyTitle ?? r.propertyAddress ?? "").trim() || "—",
          issue: r.title,
          priority: r.priority,
          status: r.status,
          assignedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—",
          dueDate: "—",
        }))
      )
    } catch {
      const fallbackList = getDemoMaintenanceTickets(user)
      if (fallbackList.length > 0) {
        setError(null)
        setTickets(
          fallbackList.map((r) => ({
            id: r.id,
            property: (r.propertyTitle ?? r.propertyAddress ?? "").trim() || "—",
            issue: r.title,
            priority: r.priority,
            status: r.status,
            assignedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—",
            dueDate: "—",
          }))
        )
      } else {
        setError("Failed to load tickets")
        setTickets([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  useRealtimeTable({
    table: "maintenance_requests",
    events: ["INSERT", "UPDATE"],
    onEvent: () => {
      void fetchTickets()
    },
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "emergency":
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
      case "cancelled":
        return "bg-muted text-gray-600 dark:bg-card dark:text-gray-400"
      default:
        return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            My Maintenance Tickets
          </CardTitle>
          <CardDescription>View and manage all assigned maintenance tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <span className="ml-3 text-gray-600">Loading tickets…</span>
            </div>
          )}

          {error && !loading && (
            <div className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
              <Button onClick={fetchTickets} variant="outline">
                Try again
              </Button>
            </div>
          )}

          {!loading && !error && tickets.length === 0 && (
            <EmptyState
              icon={<Wrench className="h-12 w-12" />}
              title="All clear!"
              description="No maintenance tickets are assigned to you right now. New requests will show up here automatically."
              ctaLabel="Open maintenance finances"
              ctaHref="/maintenance/finances"
            />
          )}

          {!loading && !error && tickets.length > 0 && (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <p className="font-semibold">{ticket.property}</p>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{ticket.issue}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Created: {ticket.assignedDate}</span>
                        </div>
                        {ticket.dueDate !== "—" && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Due: {ticket.dueDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
