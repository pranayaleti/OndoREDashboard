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
import { MoreHorizontal, Phone, Mail, Search, Filter } from "lucide-react"
import { Link } from "react-router-dom"
import { usePagination } from "@/hooks/usePagination"
import { DataPagination } from "@/components/ui/DataPagination"
import { formatDate } from "@/lib/locale-format"

// Mock data for tenant applications
const applications = [
  {
    id: "A-1001",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    propertyType: "apartment",
    bedrooms: "2",
    moveInDate: "2023-06-01",
    status: "new",
    date: "2023-04-25T09:24:00",
    avatar: "/placeholder.svg?height=32&width=32",
    address: "123 Main St, Salt Lake City, UT",
    source: "Website",
    income: "$65,000",
    creditScore: "720",
  },
  {
    id: "A-1002",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "(555) 987-6543",
    propertyType: "single-family",
    bedrooms: "3",
    moveInDate: "2023-05-15",
    status: "contacted",
    date: "2023-04-24T14:12:00",
    avatar: "/placeholder.svg?height=32&width=32",
    address: "456 Park Ave, Salt Lake City, UT",
    source: "Referral",
    income: "$78,000",
    creditScore: "680",
  },
  {
    id: "A-1003",
    name: "Michael Brown",
    email: "mbrown@example.com",
    phone: "(555) 456-7890",
    propertyType: "condo",
    bedrooms: "1",
    moveInDate: "2023-06-15",
    status: "qualified",
    date: "2023-04-23T11:45:00",
    avatar: "/placeholder.svg?height=32&width=32",
    address: "789 Business Blvd, Salt Lake City, UT",
    source: "Social Media",
    income: "$92,000",
    creditScore: "750",
  },
  {
    id: "A-1004",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "(555) 234-5678",
    propertyType: "townhouse",
    bedrooms: "2",
    moveInDate: "2023-05-01",
    status: "approved",
    date: "2023-04-22T16:30:00",
    avatar: "/placeholder.svg?height=32&width=32",
    address: "321 Beach Rd, Salt Lake City, UT",
    source: "Email",
    income: "$85,000",
    creditScore: "790",
  },
  {
    id: "A-1005",
    name: "Robert Wilson",
    email: "rwilson@example.com",
    phone: "(555) 876-5432",
    propertyType: "apartment",
    bedrooms: "1",
    moveInDate: "2023-06-01",
    status: "rejected",
    date: "2023-04-21T10:15:00",
    avatar: "/placeholder.svg?height=32&width=32",
    address: "567 Oak St, Salt Lake City, UT",
    source: "Website",
    income: "$45,000",
    creditScore: "580",
  },
  {
    id: "A-1006",
    name: "Jennifer Lee",
    email: "jlee@example.com",
    phone: "(555) 345-6789",
    propertyType: "single-family",
    bedrooms: "3",
    moveInDate: "2023-07-01",
    status: "new",
    date: "2023-04-20T13:20:00",
    avatar: "/placeholder.svg?height=32&width=32",
    address: "890 Elm St, Salt Lake City, UT",
    source: "Referral",
    income: "$72,000",
    creditScore: "710",
  },
  {
    id: "A-1007",
    name: "David Miller",
    email: "dmiller@example.com",
    phone: "(555) 567-8901",
    propertyType: "apartment",
    bedrooms: "2",
    moveInDate: "2023-06-15",
    status: "contacted",
    date: "2023-04-19T15:45:00",
    avatar: "/placeholder.svg?height=32&width=32",
    address: "432 Office Park, Salt Lake City, UT",
    source: "Website",
    income: "$68,000",
    creditScore: "700",
  },
  {
    id: "A-1008",
    name: "Lisa Anderson",
    email: "landerson@example.com",
    phone: "(555) 678-9012",
    propertyType: "townhouse",
    bedrooms: "2",
    moveInDate: "2023-05-15",
    status: "qualified",
    date: "2023-04-18T09:30:00",
    avatar: "/placeholder.svg?height=32&width=32",
    address: "765 Pine St, Salt Lake City, UT",
    source: "Social Media",
    income: "$79,000",
    creditScore: "730",
  },
  {
    id: "A-1009",
    name: "James Taylor",
    email: "jtaylor@example.com",
    phone: "(555) 789-0123",
    propertyType: "condo",
    bedrooms: "1",
    moveInDate: "2023-06-01",
    status: "approved",
    date: "2023-04-17T11:15:00",
    avatar: "/placeholder.svg?height=32&width=32",
    address: "210 Lake View Dr, Salt Lake City, UT",
    source: "Email",
    income: "$88,000",
    creditScore: "760",
  },
  {
    id: "A-1010",
    name: "Patricia White",
    email: "pwhite@example.com",
    phone: "(555) 890-1234",
    propertyType: "apartment",
    bedrooms: "2",
    moveInDate: "2023-05-01",
    status: "rejected",
    date: "2023-04-16T14:50:00",
    avatar: "/placeholder.svg?height=32&width=32",
    address: "543 Maple Ave, Salt Lake City, UT",
    source: "Website",
    income: "$52,000",
    creditScore: "600",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "new":
      return "bg-blue-500"
    case "contacted":
      return "bg-yellow-500"
    case "qualified":
      return "bg-purple-500"
    case "approved":
      return "bg-green-500"
    case "rejected":
      return "bg-red-500"
    default:
      return "bg-muted"
  }
}

export function LeadsTable() {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter applications based on search term
  const filteredApplications = applications.filter(
    (application) =>
      application.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const { items: paginatedApplications, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredApplications, { pageSize: 5 })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
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
            <TableHead>Applicant</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Property Preferences</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Financial</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedApplications.map((application) => (
            <TableRow key={application.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={application.avatar || `${import.meta.env.BASE_URL}placeholder.svg`} alt={application.name} />
                    <AvatarFallback>{application.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div>{application.name}</div>
                    <div className="text-sm text-muted-foreground">{application.id}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>{application.email}</div>
                <div className="text-sm text-muted-foreground">{application.phone}</div>
              </TableCell>
              <TableCell>
                <div className="capitalize">{application.propertyType.replace(/-/g, " ")}</div>
                <div className="text-sm text-muted-foreground">
                  {application.bedrooms} BR • Move-in: {new Date(application.moveInDate).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`capitalize ${getStatusColor(application.status)} text-white`}>
                  {application.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div>Income: {application.income}</div>
                <div className="text-sm text-muted-foreground">Credit: {application.creditScore}</div>
              </TableCell>
              <TableCell>
                {formatDate(application.date, { month: "short", day: "numeric", year: "numeric" })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost" aria-label="Call applicant">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Email applicant">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  </Button>
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
                        <Link to={`/dashboard/applications/view/${application.id}`}>View details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/applications/update/${application.id}`}>Update status</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/applications/notes/${application.id}`}>Add note</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/applications/schedule/${application.id}`}>Schedule viewing</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
