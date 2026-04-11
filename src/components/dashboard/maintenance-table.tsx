import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Filter, Clock, AlertTriangle } from "lucide-react"
import { Link } from "react-router-dom"
import { usePagination } from "@/hooks/usePagination"
import { DataPagination } from "@/components/ui/DataPagination"

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
    description: "The kitchen sink faucet has been leaking for the past two days. Water is pooling under the sink.",
    category: "plumbing",
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
    description:
      "The air conditioning unit is making a loud noise and not cooling effectively. Temperature inside is 85°F.",
    category: "hvac",
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
    description:
      "The window in the living room has a crack across the bottom pane. It doesn't appear to be letting air in but should be fixed.",
    category: "windows",
    scheduledDate: "2023-05-02T10:00:00",
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
    description:
      "Dishwasher fills with water but doesn't drain properly. Standing water remains after cycle completes.",
    category: "appliances",
    completedDate: "2023-04-24T13:15:00",
  },
  {
    id: "M-1005",
    tenant: "Robert Wilson",
    property: "567 Oak St, Apt 8",
    issue: "Smoke detector beeping",
    priority: "high",
    status: "open",
    date: "2023-04-21T10:15:00",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=32&width=32`,
    description: "The smoke detector in the hallway is beeping every 30 seconds. Likely needs a battery replacement.",
    category: "electrical",
  },
  {
    id: "M-1006",
    tenant: "Jennifer Lee",
    property: "890 Elm St, Unit 5",
    issue: "Garbage disposal jammed",
    priority: "low",
    status: "in-progress",
    date: "2023-04-20T13:20:00",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=32&width=32`,
    description: "Garbage disposal makes a humming sound but doesn't spin. Something may be stuck inside.",
    category: "plumbing",
  },
  {
    id: "M-1007",
    tenant: "David Miller",
    property: "432 Office Park, Apt 2",
    issue: "Bathroom ceiling leak",
    priority: "high",
    status: "scheduled",
    date: "2023-04-19T15:45:00",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=32&width=32`,
    description: "Water is leaking from the bathroom ceiling when the upstairs neighbor uses their shower.",
    category: "plumbing",
    scheduledDate: "2023-04-26T09:30:00",
  },
  {
    id: "M-1008",
    tenant: "Lisa Anderson",
    property: "765 Pine St, Unit 9",
    issue: "Heater not working",
    priority: "medium",
    status: "completed",
    date: "2023-04-18T09:30:00",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=32&width=32`,
    description:
      "The central heating system isn't turning on. Thermostat shows power but no heat is coming through vents.",
    category: "hvac",
    completedDate: "2023-04-20T11:45:00",
  },
  {
    id: "M-1009",
    tenant: "James Taylor",
    property: "210 Lake View Dr, Apt 6",
    issue: "Broken closet door",
    priority: "low",
    status: "open",
    date: "2023-04-17T11:15:00",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=32&width=32`,
    description: "The sliding closet door in the bedroom is off its track and won't close properly.",
    category: "windows",
  },
  {
    id: "M-1010",
    tenant: "Patricia White",
    property: "543 Maple Ave, Unit 4",
    issue: "Electrical outlet not working",
    priority: "medium",
    status: "scheduled",
    date: "2023-04-16T14:50:00",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=32&width=32`,
    description:
      "The electrical outlet in the living room near the TV isn't working. Other outlets in the room work fine.",
    category: "electrical",
    scheduledDate: "2023-04-28T14:00:00",
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

export function MaintenanceTable({ status }: { status?: string }) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter requests based on search term and status
  const filteredRequests = maintenanceRequests.filter(
    (request) =>
      (status ? request.status === status : true) &&
      (request.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const { items: paginatedRequests, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredRequests, { pageSize: 5 })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.id}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={request.avatar || `${import.meta.env.BASE_URL}placeholder.svg`} alt={request.tenant} />
                    <AvatarFallback>{request.tenant.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span>{request.tenant}</span>
                </div>
              </TableCell>
              <TableCell>{request.property}</TableCell>
              <TableCell>
                <div className="max-w-[200px] truncate" title={request.issue}>
                  {request.issue}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  {getPriorityIcon(request.priority)}
                  <span className="ml-1 capitalize">{request.priority}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`capitalize ${getStatusColor(request.status)} text-white`}>
                  {request.status.replace("-", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(request.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/maintenance/view/${request.id}`}>View details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/maintenance/update/${request.id}`}>Update status</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/maintenance/assign/${request.id}`}>Assign technician</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/maintenance/schedule/${request.id}`}>Schedule service</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        totalItems={totalItems}
        pageSize={pageSize}
      />
    </div>
  )
}
