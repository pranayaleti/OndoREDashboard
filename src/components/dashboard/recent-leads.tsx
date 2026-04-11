"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Phone, Mail } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for recent leads
const recentLeads = [
  {
    id: "L-1001",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    propertyType: "single-family",
    propertyValue: "300k-500k",
    status: "new",
    date: "2023-04-25T09:24:00",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "L-1002",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "(555) 987-6543",
    propertyType: "multi-family",
    propertyValue: "500k-750k",
    status: "contacted",
    date: "2023-04-24T14:12:00",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "L-1003",
    name: "Michael Brown",
    email: "mbrown@example.com",
    phone: "(555) 456-7890",
    propertyType: "commercial",
    propertyValue: "over-1m",
    status: "qualified",
    date: "2023-04-23T11:45:00",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "L-1004",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "(555) 234-5678",
    propertyType: "vacation",
    propertyValue: "750k-1m",
    status: "converted",
    date: "2023-04-22T16:30:00",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "L-1005",
    name: "Robert Wilson",
    email: "rwilson@example.com",
    phone: "(555) 876-5432",
    propertyType: "single-family",
    propertyValue: "under-300k",
    status: "lost",
    date: "2023-04-21T10:15:00",
    avatar: "/placeholder.svg?height=32&width=32",
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
    case "converted":
      return "bg-green-500"
    case "lost":
      return "bg-red-500"
    default:
      return "bg-muted"
  }
}

export function RecentLeads() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead</TableHead>
          <TableHead>Property</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentLeads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="font-medium">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={lead.avatar || `${import.meta.env.BASE_URL}placeholder.svg`} alt={lead.name} />
                  <AvatarFallback>{lead.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div>{lead.name}</div>
                  <div className="text-sm text-muted-foreground">{lead.id}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="capitalize">{lead.propertyType.replace(/-/g, " ")}</div>
              <div className="text-sm text-muted-foreground">
                {lead.propertyValue === "under-300k"
                  ? "Under $300k"
                  : lead.propertyValue === "300k-500k"
                    ? "$300k-$500k"
                    : lead.propertyValue === "500k-750k"
                      ? "$500k-$750k"
                      : lead.propertyValue === "750k-1m"
                        ? "$750k-$1M"
                        : "Over $1M"}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={`capitalize ${getStatusColor(lead.status)} text-white`}>
                {lead.status}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(lead.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button size="icon" variant="ghost">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Mail className="h-4 w-4" />
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
                    <DropdownMenuItem>View details</DropdownMenuItem>
                    <DropdownMenuItem>Update status</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Add note</DropdownMenuItem>
                    <DropdownMenuItem>Schedule follow-up</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
