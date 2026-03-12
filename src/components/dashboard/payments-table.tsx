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
import {
  MoreHorizontal,
  Search,
  Filter,
  Building,
  Calendar,
  CreditCard,
  DollarSign,
  Receipt,
} from "lucide-react"
import { Link } from "react-router-dom"
import { usePagination } from "@/hooks/usePagination"
import { DataPagination } from "@/components/ui/DataPagination"

// Sample data for payments
const payments = [
  {
    id: "P-1001",
    tenant: "John Smith",
    property: "123 Main St, Apt 4B",
    amount: 1500,
    date: "2023-04-01",
    dueDate: "2023-04-01",
    status: "received",
    method: "credit-card",
    avatar: "/placeholder.svg?height=32&width=32",
    description: "April 2023 Rent",
    transactionId: "txn_1234567890",
  },
  {
    id: "P-1002",
    tenant: "Sarah Johnson",
    property: "456 Park Ave, Unit 7",
    amount: 1800,
    date: "2023-04-02",
    dueDate: "2023-04-01",
    status: "received",
    method: "bank-transfer",
    avatar: "/placeholder.svg?height=32&width=32",
    description: "April 2023 Rent",
    transactionId: "txn_0987654321",
  },
  {
    id: "P-1003",
    tenant: "Michael Brown",
    property: "789 Oak St, Apt 12",
    amount: 1200,
    date: "2023-04-05",
    dueDate: "2023-04-01",
    status: "received",
    method: "check",
    avatar: "/placeholder.svg?height=32&width=32",
    description: "April 2023 Rent",
    transactionId: "txn_2468101214",
  },
  {
    id: "P-1004",
    tenant: "Emily Davis",
    property: "321 Pine St, Unit 3",
    amount: 2100,
    date: "",
    dueDate: "2023-05-01",
    status: "pending",
    method: "",
    avatar: "/placeholder.svg?height=32&width=32",
    description: "May 2023 Rent",
    transactionId: "",
  },
  {
    id: "P-1005",
    tenant: "Robert Wilson",
    property: "567 Oak St, Apt 8",
    amount: 1350,
    date: "",
    dueDate: "2023-04-01",
    status: "overdue",
    method: "",
    avatar: "/placeholder.svg?height=32&width=32",
    description: "April 2023 Rent",
    transactionId: "",
  },
  {
    id: "P-1006",
    tenant: "Jennifer Lee",
    property: "890 Elm St, Unit 5",
    amount: 1650,
    date: "2023-04-01",
    dueDate: "2023-04-01",
    status: "received",
    method: "credit-card",
    avatar: "/placeholder.svg?height=32&width=32",
    description: "April 2023 Rent",
    transactionId: "txn_1357911131",
  },
  {
    id: "P-1007",
    tenant: "David Miller",
    property: "432 Office Park, Apt 2",
    amount: 1950,
    date: "2023-03-15",
    dueDate: "2023-04-01",
    status: "refunded",
    method: "credit-card",
    avatar: "/placeholder.svg?height=32&width=32",
    description: "Security Deposit Refund",
    transactionId: "txn_9753197531",
  },
  {
    id: "P-1008",
    tenant: "Lisa Anderson",
    property: "765 Pine St, Unit 9",
    amount: 1400,
    date: "",
    dueDate: "2023-05-01",
    status: "pending",
    method: "",
    avatar: "/placeholder.svg?height=32&width=32",
    description: "May 2023 Rent",
    transactionId: "",
  },
  {
    id: "P-1009",
    tenant: "James Taylor",
    property: "210 Lake View Dr, Apt 6",
    amount: 1750,
    date: "2023-04-01",
    dueDate: "2023-04-01",
    status: "received",
    method: "bank-transfer",
    avatar: "/placeholder.svg?height=32&width=32",
    description: "April 2023 Rent",
    transactionId: "txn_8642086420",
  },
  {
    id: "P-1010",
    tenant: "Patricia White",
    property: "543 Maple Ave, Unit 4",
    amount: 1600,
    date: "",
    dueDate: "2023-04-01",
    status: "overdue",
    method: "",
    avatar: "/placeholder.svg?height=32&width=32",
    description: "April 2023 Rent",
    transactionId: "",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "received":
      return "bg-green-500"
    case "pending":
      return "bg-yellow-500"
    case "overdue":
      return "bg-red-500"
    case "refunded":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

const getMethodIcon = (method: string) => {
  switch (method) {
    case "credit-card":
      return <CreditCard className="h-4 w-4 mr-2" />
    case "bank-transfer":
      return <Building className="h-4 w-4 mr-2" />
    case "check":
      return <Receipt className="h-4 w-4 mr-2" />
    case "cash":
      return <DollarSign className="h-4 w-4 mr-2" />
    default:
      return <DollarSign className="h-4 w-4 mr-2" />
  }
}

export function PaymentsTable({ status }: { status?: string }) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter payments based on search term and status
  const filteredPayments = payments.filter(
    (payment) =>
      (status ? payment.status === status : true) &&
      (payment.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const { items: paginatedPayments, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredPayments, { pageSize: 5 })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
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
            <TableHead>Payment ID</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedPayments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.id}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={payment.avatar || `${import.meta.env.BASE_URL}placeholder.svg`} alt={payment.tenant} />
                    <AvatarFallback>{payment.tenant.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span>{payment.tenant}</span>
                </div>
              </TableCell>
              <TableCell>{payment.property}</TableCell>
              <TableCell>${payment.amount.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{new Date(payment.dueDate).toLocaleDateString()}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`capitalize ${getStatusColor(payment.status)} text-white`}>
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell>
                {payment.method ? (
                  <div className="flex items-center">
                    {getMethodIcon(payment.method)}
                    <span className="capitalize">{payment.method.replace("-", " ")}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
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
                      <Link to={`/dashboard/payments/view/${payment.id}`}>View details</Link>
                    </DropdownMenuItem>
                    {payment.status === "pending" && (
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/payments/record/${payment.id}`}>Record payment</Link>
                      </DropdownMenuItem>
                    )}
                    {payment.status === "received" && (
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/payments/receipt/${payment.id}`}>Generate receipt</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/payments/history/${payment.tenant.replace(/\s+/g, "-").toLowerCase()}`}>
                        Payment history
                      </Link>
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
