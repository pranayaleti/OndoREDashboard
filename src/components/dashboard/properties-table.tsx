"use client"

import { useState } from "react"
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
  Home,
  Hotel,
  Store,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"
import { usePagination } from "@/hooks/usePagination"
import { DataPagination } from "@/components/ui/DataPagination"

// Mock data for properties
const properties = [
  {
    id: "P-1001",
    address: "123 Main St",
    city: "Salt Lake City",
    state: "UT",
    zipCode: "84101",
    type: "single-family",
    value: "300k-500k",
    status: "active",
    owner: "John Smith",
    dateAdded: "2023-04-25T09:24:00",
  },
  {
    id: "P-1002",
    address: "456 Park Ave",
    city: "Salt Lake City",
    state: "UT",
    zipCode: "84108",
    type: "multi-family",
    value: "500k-750k",
    status: "active",
    owner: "Sarah Johnson",
    dateAdded: "2023-04-24T14:12:00",
  },
  {
    id: "P-1003",
    address: "789 Business Blvd",
    city: "Salt Lake City",
    state: "UT",
    zipCode: "84111",
    type: "commercial",
    value: "over-1m",
    status: "pending",
    owner: "Michael Brown",
    dateAdded: "2023-04-23T11:45:00",
  },
  {
    id: "P-1004",
    address: "321 Beach Rd",
    city: "Salt Lake City",
    state: "UT",
    zipCode: "84103",
    type: "vacation",
    value: "750k-1m",
    status: "active",
    owner: "Emily Davis",
    dateAdded: "2023-04-22T16:30:00",
  },
  {
    id: "P-1005",
    address: "567 Oak St",
    city: "Salt Lake City",
    state: "UT",
    zipCode: "84102",
    type: "single-family",
    value: "under-300k",
    status: "inactive",
    owner: "Robert Wilson",
    dateAdded: "2023-04-21T10:15:00",
  },
  {
    id: "P-1006",
    address: "890 Elm St",
    city: "Salt Lake City",
    state: "UT",
    zipCode: "84106",
    type: "multi-family",
    value: "500k-750k",
    status: "active",
    owner: "Jennifer Lee",
    dateAdded: "2023-04-20T13:20:00",
  },
  {
    id: "P-1007",
    address: "432 Office Park",
    city: "Salt Lake City",
    state: "UT",
    zipCode: "84111",
    type: "commercial",
    value: "over-1m",
    status: "pending",
    owner: "David Miller",
    dateAdded: "2023-04-19T15:45:00",
  },
  {
    id: "P-1008",
    address: "765 Pine St",
    city: "Salt Lake City",
    state: "UT",
    zipCode: "84103",
    type: "single-family",
    value: "300k-500k",
    status: "active",
    owner: "Lisa Anderson",
    dateAdded: "2023-04-18T09:30:00",
  },
  {
    id: "P-1009",
    address: "210 Lake View Dr",
    city: "Salt Lake City",
    state: "UT",
    zipCode: "84109",
    type: "vacation",
    value: "750k-1m",
    status: "active",
    owner: "James Taylor",
    dateAdded: "2023-04-17T11:15:00",
  },
  {
    id: "P-1010",
    address: "543 Maple Ave",
    city: "Salt Lake City",
    state: "UT",
    zipCode: "84105",
    type: "single-family",
    value: "under-300k",
    status: "inactive",
    owner: "Patricia White",
    dateAdded: "2023-04-16T14:50:00",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500"
    case "pending":
      return "bg-yellow-500"
    case "inactive":
      return "bg-muted"
    default:
      return "bg-muted"
  }
}

const getPropertyTypeIcon = (type: string) => {
  switch (type) {
    case "single-family":
      return <Home className="h-4 w-4 mr-2" />
    case "multi-family":
      return <Users className="h-4 w-4 mr-2" />
    case "commercial":
      return <Store className="h-4 w-4 mr-2" />
    case "vacation":
      return <Hotel className="h-4 w-4 mr-2" />
    case "association":
      return <Building className="h-4 w-4 mr-2" />
    default:
      return <Building className="h-4 w-4 mr-2" />
  }
}

export function PropertiesTable() {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter properties based on search term
  const filteredProperties = properties.filter(
    (property) =>
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owner.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const { items: paginatedProperties, currentPage, totalPages, totalItems, pageSize, goToPage } = usePagination(filteredProperties, { pageSize: 5 })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
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
            <TableHead>Property</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProperties.map((property) => (
            <TableRow key={property.id}>
              <TableCell className="font-medium">
                <div>{property.address}</div>
                <div className="text-sm text-muted-foreground">{property.id}</div>
              </TableCell>
              <TableCell>
                {property.city}, {property.state} {property.zipCode}
              </TableCell>
              <TableCell>
                <div className="flex items-center capitalize">
                  {getPropertyTypeIcon(property.type)}
                  {property.type.replace(/-/g, " ")}
                </div>
              </TableCell>
              <TableCell>
                {property.value === "under-300k"
                  ? "Under $300k"
                  : property.value === "300k-500k"
                    ? "$300k-$500k"
                    : property.value === "500k-750k"
                      ? "$500k-$750k"
                      : property.value === "750k-1m"
                        ? "$750k-$1M"
                        : "Over $1M"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`capitalize ${getStatusColor(property.status)} text-white`}>
                  {property.status}
                </Badge>
              </TableCell>
              <TableCell>{property.owner}</TableCell>
              <TableCell>
                {new Date(property.dateAdded).toLocaleDateString("en-US", {
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
                      <Link to={`/dashboard/properties/view/${property.id}`}>View details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/properties/edit/${property.id}`}>Edit property</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/properties/status/${property.id}`}>Change status</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/dashboard/properties/assign/${property.id}`}>Assign manager</Link>
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
