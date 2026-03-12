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
import { MoreHorizontal, Search, Filter, Building, Calendar } from "lucide-react"
import { Link } from "react-router-dom"
import { usePagination } from "@/hooks/usePagination"
import { DataPagination } from "@/components/ui/DataPagination"

// Sample data for leases
const leases = [
  {
    id: "L-1001",
    tenant: "John Smith",
    property: "123 Main St, Apt 4B",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
    rent: 1500,
    status: "active",
    avatar: "/placeholder.svg?height=32&width=32",
    securityDeposit: 1500,
    leaseType: "12-month",
    renewalOption: true,
    petDeposit: 300,
    lateFee: 50,
  },
  {
    id: "L-1002",
    tenant: "Sarah Johnson",
    property: "456 Park Ave, Unit 7",
    startDate: "2023-02-15",
    endDate: "2024-02-14",
    rent: 1800,
    status: "active",
    avatar: "/placeholder.svg?height=32&width=32",
    securityDeposit: 1800,
    leaseType: "12-month",
    renewalOption: true,
    petDeposit: 0,
    lateFee: 75,
  },
  {
    id: "L-1003",
    tenant: "Michael Brown",
    property: "789 Oak St, Apt 12",
    startDate: "2023-05-01",
    endDate: "2023-10-31",
    rent: 1200,
    status: "active",
    avatar: "/placeholder.svg?height=32&width=32",
    securityDeposit: 1200,
    leaseType: "6-month",
    renewalOption: false,
    petDeposit: 250,
    lateFee: 50,
  },
  {
    id: "L-1004",
    tenant: "Emily Davis",
    property: "321 Pine St, Unit 3",
    startDate: "2023-06-01",
    endDate: "2024-05-31",
    rent: 2100,
    status: "upcoming",
    avatar: "/placeholder.svg?height=32&width=32",
    securityDeposit: 2100,
    leaseType: "12-month",
    renewalOption: true,
    petDeposit: 0,
    lateFee: 100,
  },
  {
    id: "L-1005",
    tenant: "Robert Wilson",
    property: "567 Oak St, Apt 8",
    startDate: "2022-07-01",
    endDate: "2023-06-30",
    rent: 1350,
    status: "expiring",
    avatar: "/placeholder.svg?height=32&width=32",
    securityDeposit: 1350,
    leaseType: "12-month",
    renewalOption: true,
    petDeposit: 0,
    lateFee: 50,
  },
  {
    id: "L-1006",
    tenant: "Jennifer Lee",
    property: "890 Elm St, Unit 5",
    startDate: "2022-05-15",
    endDate: "2023-05-14",
    rent: 1650,
    status: "expired",
    avatar: "/placeholder.svg?height=32&width=32",
    securityDeposit: 1650,
    leaseType: "12-month",
    renewalOption: false,
    petDeposit: 300,
    lateFee: 75,
  },
  {
    id: "L-1007",
    tenant: "David Miller",
    property: "432 Office Park, Apt 2",
    startDate: "2023-08-01",
    endDate: "2024-07-31",
    rent: 1950,
    status: "upcoming",
    avatar: "/placeholder.svg?height=32&width=32",
    securityDeposit: 1950,
    leaseType: "12-month",
    renewalOption: true,
    petDeposit: 350,
    lateFee: 100,
  },
  {
    id: "L-1008",
    tenant: "Lisa Anderson",
    property: "765 Pine St, Unit 9",
    startDate: "2022-09-01",
    endDate: "2023-08-31",
    rent: 1400,
    status: "expiring",
    avatar: "/placeholder.svg?height=32&width=32",
    securityDeposit: 1400,
    leaseType: "12-month",
    renewalOption: true,
    petDeposit: 0,
    lateFee: 50,
  },
  {
    id: "L-1009",
    tenant: "James Taylor",
    property: "210 Lake View Dr, Apt 6",
    startDate: "2022-04-15",
    endDate: "2023-04-14",
    rent: 1750,
    status: "expired",
    avatar: "/placeholder.svg?height=32&width=32",
    securityDeposit: 1750,
    leaseType: "12-month",
    renewalOption: false,
    petDeposit: 300,
    lateFee: 75,
  },
  {
    id: "L-1010",
    tenant: "Patricia White",
    property: "543 Maple Ave, Unit 4",
    startDate: "2023-03-01",
    endDate: "2024-02-29",
    rent: 1600,
    status: "active",
    avatar: "/placeholder.svg?height=32&width=32",
    securityDeposit: 1600,
    leaseType: "12-month",
    renewalOption: true,
    petDeposit: 250,
    lateFee: 75,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500"
    case "upcoming":
      return "bg-blue-500"
    case "expiring":
      return "bg-yellow-500"
    case "expired":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export function LeasesTable({ status }: { status?: string }) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter leases based on search term and status
  const filteredLeases = leases.filter(
    (lease) =>
      (status ? lease.status === status : true) &&
      (lease.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.id.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const { items: paginatedLeases, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredLeases, { pageSize: 5 })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leases..."
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
            <TableHead>Lease ID</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Term</TableHead>
            <TableHead>Monthly Rent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedLeases.map((lease) => (
            <TableRow key={lease.id}>
              <TableCell className="font-medium">{lease.id}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={lease.avatar || `${import.meta.env.BASE_URL}placeholder.svg`} alt={lease.tenant} />
                    <AvatarFallback>{lease.tenant.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span>{lease.tenant}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{lease.property}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div>
                    <div>{new Date(lease.startDate).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">
                      to {new Date(lease.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>${lease.rent.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`capitalize ${getStatusColor(lease.status)} text-white`}>
                  {lease.status}
                </Badge>
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
                      <Link to={`/dashboard/leases/view/${lease.id}`}>View details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/leases/edit/${lease.id}`}>Edit lease</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/leases/renew/${lease.id}`}>Renew lease</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/leases/terminate/${lease.id}`}>Terminate lease</Link>
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
