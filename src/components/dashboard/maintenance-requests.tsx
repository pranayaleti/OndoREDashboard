import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, AlertTriangle } from "lucide-react"

// Sample data for maintenance requests
const maintenanceRequests = [
  {
    id: "M-1001",
    tenant: "John Smith",
    property: "123 Main St, Apt 4B",
    issue: "Leaking faucet in kitchen",
    priority: "low",
    status: "open",
    date: "2023-04-25T09:24:00",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=32&width=32`,
  },
  {
    id: "M-1002",
    tenant: "Sarah Johnson",
    property: "456 Park Ave, Unit 7",
    issue: "AC not working properly",
    priority: "high",
    status: "in-progress",
    date: "2023-04-24T14:12:00",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=32&width=32`,
  },
  {
    id: "M-1003",
    tenant: "Michael Brown",
    property: "789 Oak St, Apt 12",
    issue: "Broken window in living room",
    priority: "medium",
    status: "scheduled",
    date: "2023-04-23T11:45:00",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=32&width=32`,
  },
  {
    id: "M-1004",
    tenant: "Emily Davis",
    property: "321 Pine St, Unit 3",
    issue: "Dishwasher not draining",
    priority: "medium",
    status: "completed",
    date: "2023-04-22T16:30:00",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=32&width=32`,
  },
]

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "high":
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case "medium":
      return <Clock className="h-4 w-4 text-yellow-500" />
    case "low":
      return <Clock className="h-4 w-4 text-blue-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-blue-500"
    case "in-progress":
      return "bg-yellow-500"
    case "scheduled":
      return "bg-purple-500"
    case "completed":
      return "bg-green-500"
    case "cancelled":
      return "bg-red-500"
    default:
      return "bg-muted"
  }
}

export function MaintenanceRequests() {
  return (
    <div className="space-y-4">
      {maintenanceRequests.map((request) => (
        <Card key={request.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-start p-4">
              <Avatar className="h-9 w-9 mr-3">
                <AvatarImage src={request.avatar || `${import.meta.env.BASE_URL}placeholder.svg`} alt={request.tenant} />
                <AvatarFallback>{request.tenant.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{request.tenant}</p>
                  <Badge variant="outline" className={`capitalize ${getStatusColor(request.status)} text-white`}>
                    {request.status.replace("-", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{request.property}</p>
                <p className="text-sm">{request.issue}</p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getPriorityIcon(request.priority)}
                    <span className="ml-1 capitalize">{request.priority} Priority</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="text-center">
        <Button variant="outline" size="sm">
          View All Maintenance Requests
        </Button>
      </div>
    </div>
  )
}
