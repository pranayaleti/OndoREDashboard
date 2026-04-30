import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  User,
  Calendar,
  Building,
  Mail,
  Phone,
  MoreHorizontal,
  FileText,
  MessageSquare,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Link } from "react-router-dom"
import { AddTenantDialog } from "@/components/owner/add-tenant-dialog"
import { useToast } from "@/hooks/use-toast"

// Mock tenants data
const TENANTS = [
  {
    id: "tenant1",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "555-123-4567",
    property: "123 Main Street",
    propertyId: "prop1",
    unit: "Unit 1",
    leaseStart: "2023-01-01",
    leaseEnd: "2023-12-31",
    rent: 1700,
    status: "active",
    avatar: "/javascript-code.png",
  },
  {
    id: "tenant2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "555-987-6543",
    property: "123 Main Street",
    propertyId: "prop1",
    unit: "Unit 2",
    leaseStart: "2023-03-01",
    leaseEnd: "2024-02-29",
    rent: 1700,
    status: "active",
    avatar: "/stylized-letters-sj.png",
  },
  {
    id: "tenant3",
    name: "Michael Brown",
    email: "michael.brown@example.com",
    phone: "555-555-1234",
    property: "456 Oak Avenue",
    propertyId: "prop2",
    unit: "Main House",
    leaseStart: "2022-10-15",
    leaseEnd: "2023-10-15",
    rent: 1850,
    status: "active",
    avatar: "/monogram-mb.png",
  },
  {
    id: "tenant4",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "555-222-3333",
    property: "222 Maple Court",
    propertyId: "prop5",
    unit: "Main House",
    leaseStart: "2023-03-01",
    leaseEnd: "2024-02-28",
    rent: 1950,
    status: "active",
    avatar: "/ed-initials-abstract.png",
  },
  {
    id: "tenant5",
    name: "David Wilson",
    email: "david.wilson@example.com",
    phone: "555-444-5555",
    property: "789 Pine Street",
    propertyId: "prop3",
    unit: "Commercial Space",
    leaseStart: "2022-12-01",
    leaseEnd: "2023-05-31",
    rent: 2500,
    status: "past",
    avatar: "/abstract-dw.png",
  },
]

export function TenantsView() {
  const [tenants, setTenants] = useState(TENANTS)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  // Filter tenants based on search term and active tab
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.property.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    if (activeTab === "active") return matchesSearch && tenant.status === "active"
    if (activeTab === "past") return matchesSearch && tenant.status === "past"

    return matchesSearch
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _handleAddTenant = (data: any) => {
    // In a real app, this would call an API to add the tenant
    const newTenant = {
      id: `tenant${tenants.length + 1}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      property: data.property,
      propertyId: data.propertyId,
      unit: data.unit,
      leaseStart: data.leaseStart,
      leaseEnd: data.leaseEnd,
      rent: Number.parseInt(data.rent),
      status: "active",
      avatar: `${import.meta.env.BASE_URL}placeholder.svg?height=40&width=40&query=${data.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")}`,
    }

    setTenants([newTenant, ...tenants])

    toast({
      title: "Tenant added",
      description: "The tenant has been successfully added.",
    })
  }
  void _handleAddTenant

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <AddTenantDialog />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Tenants</TabsTrigger>
          <TabsTrigger value="active">Active Leases</TabsTrigger>
          <TabsTrigger value="past">Past Tenants</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {filteredTenants.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tenants found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  {searchTerm ? "Try adjusting your search or filters" : "Add your first tenant to get started"}
                </p>
                <AddTenantDialog />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Lease Period</TableHead>
                      <TableHead>Monthly Rent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={tenant.avatar || `${import.meta.env.BASE_URL}placeholder.svg`} alt={tenant.name} />
                              <AvatarFallback>
                                {tenant.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{tenant.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {tenant.email}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {tenant.phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{tenant.property}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            {tenant.unit}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>
                              {new Date(tenant.leaseStart).toLocaleDateString()} -{" "}
                              {new Date(tenant.leaseEnd).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>${tenant.rent.toLocaleString()}</TableCell>
                        <TableCell>
                          {tenant.status === "active" ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-gray-800">
                              Past
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link to={`/owner/tenants/${tenant.id}`}>
                                  <User className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link to={`/owner/tenants/${tenant.id}/lease`}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Manage Lease
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link to={`/owner/messages?tenant=${tenant.id}`}>
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Send Message
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
