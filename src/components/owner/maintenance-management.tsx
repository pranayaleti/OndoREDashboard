"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NewMaintenanceRequestDialog } from "@/components/maintenance/new-maintenance-request-dialog"
import { UpdateStatusDialog } from "@/components/maintenance/update-status-dialog"
import { AssignTechnicianDialog } from "@/components/maintenance/assign-technician-dialog"
import { ScheduleServiceDialog } from "@/components/maintenance/schedule-service-dialog"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Clock, PenToolIcon as Tool, Search, Calendar, Home, AlertCircle, Wrench, PlusCircle, Info, AlertTriangle, FileText, MoreVertical, LayoutGrid, List, ChevronLeft, ChevronRight, ChevronDown, Filter, X, Loader2 } from "lucide-react"
import { MAINTENANCE_STATUSES, MAINTENANCE_PRIORITIES, MAINTENANCE_CATEGORIES } from "@/constants/maintenance.constants"
import { propertyApi, maintenanceApi, type Property } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { formatDate } from "@/lib/locale-format"

// Display shape for Owner maintenance list (maps from API response for filters/table)
export type OwnerMaintenanceRequest = {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  property: string
  tenant: string
  dateSubmitted: string
  lastUpdated: string
  scheduledDate: string | null
}

type MaintenanceRequest = OwnerMaintenanceRequest

function mapApiToOwnerRequest(api: {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  propertyTitle?: string | null
  propertyAddress?: string | null
  tenantFirstName?: string | null
  tenantLastName?: string | null
  tenantEmail?: string | null
  createdAt: string
}): OwnerMaintenanceRequest {
  const property = (api.propertyTitle ?? api.propertyAddress ?? "").trim() || "—"
  const tenant = [api.tenantFirstName, api.tenantLastName].filter(Boolean).join(" ").trim() || (api.tenantEmail ?? "") || "—"
  const date = api.createdAt ?? ""
  const status = api.status === "in_progress" ? "in-progress" : api.status
  return {
    id: api.id,
    title: api.title,
    description: api.description ?? "",
    category: api.category,
    priority: api.priority,
    status,
    property,
    tenant,
    dateSubmitted: date,
    lastUpdated: date,
    scheduledDate: null,
  }
}

export function OwnerMaintenanceManagement() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [requests, setRequests] = useState<OwnerMaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProperty, setFilterProperty] = useState<string[]>([])
  const [filterCategory, setFilterCategory] = useState("")
  const [filterTenant, setFilterTenant] = useState("")
  const [filterIssue, setFilterIssue] = useState("")
  const [filterPriority, setFilterPriority] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string[]>([])
  const [filterDate, setFilterDate] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false)
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false)
  const [isAssignTechnicianDialogOpen, setIsAssignTechnicianDialogOpen] = useState(false)
  const [isScheduleServiceDialogOpen, setIsScheduleServiceDialogOpen] = useState(false)
  const [actionRequest, setActionRequest] = useState<MaintenanceRequest | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const itemsPerPage = 5

  useEffect(() => {
    fetchProperties()
    fetchMaintenanceRequests()
  }, [])

  const fetchMaintenanceRequests = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      setError(null)
      const list = await maintenanceApi.getManagerMaintenanceRequests()
      setRequests(list.map((r) => mapApiToOwnerRequest({
        id: r.id,
        title: r.title,
        description: r.description ?? "",
        category: r.category,
        priority: r.priority,
        status: r.status,
        propertyTitle: r.propertyTitle ?? null,
        propertyAddress: r.propertyAddress ?? null,
        tenantFirstName: r.tenantFirstName ?? null,
        tenantLastName: r.tenantLastName ?? null,
        tenantEmail: r.tenantEmail ?? null,
        createdAt: r.createdAt ?? "",
      })))
    } catch (err: unknown) {
      console.error("Error fetching maintenance requests:", err)
      setError("Failed to load maintenance requests")
      setRequests([])
      toast({
        title: "Error",
        description: "Failed to load maintenance requests. Try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    if (!user?.id) return
    try {
      const res = await propertyApi.getProperties()
      const allProperties = res.properties
      const ownerProperties = allProperties.filter((p: { ownerId: string }) => p.ownerId === user.id)
      setProperties(ownerProperties)
    } catch (err: unknown) {
      console.error("Error fetching properties:", err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "in-progress":
        return <Tool className="h-5 w-5 text-blue-500" />
      case "scheduled":
        return <Calendar className="h-5 w-5 text-purple-500" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            Open
          </Badge>
        )
      case "in-progress":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
            In Progress
          </Badge>
        )
      case "scheduled":
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
            Scheduled
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "emergency":
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "emergency":
        return "Emergency"
      case "high":
        return "High"
      case "medium":
        return "Medium"
      case "low":
        return "Low"
      default:
        return priority
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "emergency":
        return <Badge className="bg-red-500">Emergency</Badge>
      case "high":
        return <Badge className="bg-orange-500">High</Badge>
      case "medium":
        return <Badge className="bg-blue-500">Medium</Badge>
      case "low":
        return <Badge className="bg-muted">Low</Badge>
      default:
        return <Badge className="bg-muted">Unknown</Badge>
    }
  }

  const filterRequestsByStatus = (status: string | null) => {
    // Start with all requests
    let filtered = [...requests]
    
    // If no requests exist, return empty array
    if (requests.length === 0) {
      return []
    }

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply property filter (multi-select)
    if (filterProperty.length > 0) {
      filtered = filtered.filter((req) => filterProperty.includes(req.property))
    }

    // Apply category filter
    if (filterCategory && filterCategory !== "all") {
      filtered = filtered.filter((req) => req.category === filterCategory)
    }

    // Apply column-specific filters
    if (filterTenant) {
      filtered = filtered.filter((req) => 
        req.tenant.toLowerCase().includes(filterTenant.toLowerCase())
      )
    }

    if (filterIssue) {
      filtered = filtered.filter((req) => 
        req.title.toLowerCase().includes(filterIssue.toLowerCase())
      )
    }

    // Apply priority filter (multi-select)
    if (filterPriority.length > 0) {
      filtered = filtered.filter((req) => filterPriority.includes(req.priority))
    }

    // Apply status filter (from tabs) - this is the primary filter
    if (status && status !== "all") {
      if (status === "pending") {
        filtered = filtered.filter((req) => req.status === "pending")
      } else {
        filtered = filtered.filter((req) => req.status === status)
      }
    }

    // Apply additional status filter (multi-select from column)
    // When viewing "all", use column status filter to narrow down
    // When viewing a specific tab, column status filter should include the tab status to be effective
    if (filterStatus.length > 0) {
      if (status === "all") {
        // When viewing all, use column status filter
        filtered = filtered.filter((req) => filterStatus.includes(req.status))
      } else {
        // When viewing a specific tab, only apply column filter if it includes the current tab status
        // Otherwise, ignore column status filter (tab takes precedence)
        if (status !== null && filterStatus.includes(status)) {
          filtered = filtered.filter((req) => filterStatus.includes(req.status))
        }
        // If column filter doesn't include tab status, it would filter everything out
        // So we ignore it and let the tab filter work
      }
    }

    if (filterDate) {
      filtered = filtered.filter((req) => {
        const requestDate = formatDate(req.dateSubmitted, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        return requestDate.toLowerCase().includes(filterDate.toLowerCase())
      })
    }

    return filtered
  }

  // Pagination logic
  const getPaginatedRequests = (filteredRequests: MaintenanceRequest[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredRequests.slice(startIndex, endIndex)
  }

  const getTotalPages = (filteredRequests: MaintenanceRequest[]) => {
    return Math.ceil(filteredRequests.length / itemsPerPage)
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSelectRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request)
  }

  const handleUpdateStatus = async (requestId: string, data: { status: string; notes?: string }) => {
    const request = requests.find((r) => r.id === requestId)
    if (!request) return

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: data.status as MaintenanceRequest["status"],
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : r
      )
    )

    toast({
      title: "Status Updated",
      description: `Status updated to ${data.status}.`,
      duration: 3000,
    })
  }

  const handleAssignTechnician = async (
    requestId: string,
    data: {
      technicianId: string
      technicianName: string
      dueDate?: string
      costRange?: { min: number; max: number }
      notes?: string
    }
  ) => {
    const request = requests.find((r) => r.id === requestId)
    if (!request) return

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "in-progress" as MaintenanceRequest["status"],
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : r
      )
    )

    const costRangeText = data.costRange
      ? ` ($${data.costRange.min} - $${data.costRange.max})`
      : ""
    const dueDateText = data.dueDate
      ? ` Due: ${new Date(data.dueDate).toLocaleDateString()}`
      : ""

    toast({
      title: "Technician Assigned",
      description: `Request assigned to ${data.technicianName}${costRangeText}${dueDateText}.`,
    })
  }

  const handleScheduleService = async (
    requestId: string,
    data: {
      scheduledDate: string
      scheduledTime?: string
      timeWindow?: { start: string; end: string }
      timezone?: string
      notes?: string
    }
  ) => {
    const request = requests.find((r) => r.id === requestId)
    if (!request) return

    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "scheduled" as MaintenanceRequest["status"],
              scheduledDate: data.scheduledDate,
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : r
      )
    )

    const timeStr = data.scheduledTime
      ? ` at ${data.scheduledTime}${data.timeWindow ? ` (${data.timeWindow.start} - ${data.timeWindow.end})` : ""}`
      : ""
    const tzStr = data.timezone ? ` [${data.timezone}]` : ""

    toast({
      title: "Service Scheduled",
      description: `Service scheduled for ${new Date(data.scheduledDate).toLocaleDateString()}${timeStr}${tzStr}.`,
    })
  }

  const handleNewRequestSubmit = async (data: {
    title: string
    description: string
    category: string
    priority: string
    property?: string
    tenant?: string
    photos: File[]
  }) => {
    const today = new Date().toISOString().split("T")[0]
    const newId = `M-${String(requests.length + 1001).padStart(4, "0")}`
    
    // Map priority values
    const priorityMap: Record<string, MaintenanceRequest["priority"]> = {
      low: "low",
      normal: "medium",
      medium: "medium",
      urgent: "high",
      high: "high",
      emergency: "emergency",
    }

    const createdRequest: MaintenanceRequest = {
      id: newId,
      title: data.title.trim(),
      property: data.property || "Unknown Property",
      tenant: data.tenant || "Unknown Tenant",
      dateSubmitted: today,
      status: "pending",
      priority: priorityMap[data.priority] || "medium",
      category: data.category as MaintenanceRequest["category"],
      lastUpdated: today,
      scheduledDate: null,
      description: data.description.trim(),
    }

    setRequests((prev) => [createdRequest, ...prev])
    setSelectedRequest(createdRequest)
    
    toast({
      title: "Maintenance ticket created",
      description: `${createdRequest.title} has been added to your queue.`,
    })
  }

  // Get unique values for filters
  const uniqueProperties = [...new Set(requests.map((req) => req.property))]

  const clearAllFilters = () => {
    setFilterTenant("")
    setFilterIssue("")
    setFilterPriority([])
    setFilterStatus([])
    setFilterDate("")
    setFilterProperty([])
    setFilterCategory("")
    setSearchTerm("")
    setCurrentPage(1)
  }

  const removeFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case "tenant":
        setFilterTenant("")
        break
      case "issue":
        setFilterIssue("")
        break
      case "priority":
        if (value) {
          setFilterPriority(filterPriority.filter((p) => p !== value))
        } else {
          setFilterPriority([])
        }
        break
      case "status":
        if (value) {
          setFilterStatus(filterStatus.filter((s) => s !== value))
        } else {
          setFilterStatus([])
        }
        break
      case "date":
        setFilterDate("")
        break
      case "property":
        if (value) {
          setFilterProperty(filterProperty.filter((p) => p !== value))
        } else {
          setFilterProperty([])
        }
        break
      case "category":
        setFilterCategory("")
        break
      case "search":
        setSearchTerm("")
        break
    }
    setCurrentPage(1)
  }

  const getActiveFilters = () => {
    const active: Array<{ type: string; label: string; value?: string }> = []
    
    if (searchTerm) {
      active.push({
        type: "search",
        label: `Search: ${searchTerm}`,
      })
    }
    
    if (filterTenant) {
      active.push({
        type: "tenant",
        label: `Tenant: ${filterTenant}`,
      })
    }
    
    if (filterIssue) {
      active.push({
        type: "issue",
        label: `Issue: ${filterIssue}`,
      })
    }
    
    if (filterProperty.length > 0) {
      filterProperty.forEach((prop) => {
        active.push({
          type: "property",
          label: prop,
          value: prop,
        })
      })
    }
    
    if (filterPriority.length > 0) {
      filterPriority.forEach((priority) => {
        const priorityLabel = MAINTENANCE_PRIORITIES.find((p) => p.value === priority)?.label || priority
        active.push({
          type: "priority",
          label: priorityLabel,
          value: priority,
        })
      })
    }
    
    if (filterStatus.length > 0) {
      filterStatus.forEach((status) => {
        const statusLabel = MAINTENANCE_STATUSES.find((s) => s.value === status)?.label || status
        active.push({
          type: "status",
          label: statusLabel,
          value: status,
        })
      })
    }
    
    if (filterDate) {
      active.push({
        type: "date",
        label: `Date: ${filterDate}`,
      })
    }
    
    if (filterCategory && filterCategory !== "all") {
      const categoryLabel = MAINTENANCE_CATEGORIES.find((c) => c.value === filterCategory)?.label || filterCategory
      active.push({
        type: "category",
        label: `Category: ${categoryLabel}`,
      })
    }
    
    return active
  }

  const hasActiveFilters = filterTenant || filterIssue || filterPriority.length > 0 || filterStatus.length > 0 || filterDate || filterProperty.length > 0 || filterCategory || searchTerm
  const activeFilters = getActiveFilters()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Maintenance", icon: Wrench }]} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wrench className="w-8 h-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-bold">Maintenance</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage and track maintenance requests</p>
          </div>
        </div>
        <Button onClick={() => setIsNewRequestDialogOpen(true)} className="bg-card text-card-foreground hover:bg-muted">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {loading && (
        <Card className="w-full shadow-md mb-6">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-3 text-gray-600">Loading maintenance requests…</span>
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card className="w-full shadow-md mb-6">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
            <Button onClick={fetchMaintenanceRequests} variant="outline">
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
      <>
      {/* Main Content Card */}
      <Card className="w-full shadow-md mb-6">
        <CardHeader className="bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Maintenance Requests</CardTitle>
              <CardDescription>View and manage all maintenance requests</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => {
                    setViewMode("table")
                    setCurrentPage(1)
                  }}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => {
                    setViewMode("cards")
                    setCurrentPage(1)
                  }}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search requests..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          <Tabs value={activeFilter} onValueChange={(value) => {
            setActiveFilter(value)
            setCurrentPage(1)
            // Clear column status filter if it conflicts with the selected tab
            if (value !== "all" && filterStatus.length > 0 && !filterStatus.includes(value)) {
              setFilterStatus([])
            }
          }} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 mb-6">
              <TabsTrigger value="all">All Requests</TabsTrigger>
              <TabsTrigger value="pending">Open</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

            {["all", "pending", "in-progress", "scheduled", "completed"].map((status) => {
              // Only show content for the active tab
              if (status !== activeFilter) return null

              const filteredRequests = filterRequestsByStatus(status)
              const paginatedRequests = getPaginatedRequests(filteredRequests)
              const totalPages = getTotalPages(filteredRequests)
              const startItem = (currentPage - 1) * itemsPerPage + 1
              const endItem = Math.min(currentPage * itemsPerPage, filteredRequests.length)

              return (
            <TabsContent key={status} value={status} className="space-y-4">
                  {filteredRequests.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium text-muted-foreground">No maintenance requests found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasActiveFilters
                      ? "Try adjusting your filters or clear all filters to see more results"
                      : status === "all"
                      ? "No maintenance requests available"
                      : `No ${status === "pending" ? "open" : status === "in-progress" ? "in progress" : status} maintenance requests`}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="mt-4"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear all filters
                    </Button>
                  )}
                </div>
                  ) : viewMode === "table" ? (
                    <>
                      <div className="rounded-md border">
                        {hasActiveFilters && (
                          <div className="p-2 bg-muted/50 border-b">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Filter className="h-4 w-4" />
                                <span>Filters active</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="h-7 text-xs"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Clear all
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {activeFilters.map((filter, index) => (
                                <Badge
                                  key={`${filter.type}-${filter.value || index}`}
                                  variant="secondary"
                                  className="gap-1.5 px-2.5 py-1 pr-1.5 text-sm"
                                >
                                  <span>{filter.label}</span>
                                  <button
                                    onClick={() => removeFilter(filter.type, filter.value)}
                                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                                    aria-label={`Remove ${filter.label} filter`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead 
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col gap-1">
                                  <span>Tenant</span>
                                  <Input
                                    placeholder="Filter tenant..."
                                    value={filterTenant}
                                    onChange={(e) => {
                                      setFilterTenant(e.target.value)
                                      setCurrentPage(1)
                                    }}
                                    className="h-7 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </TableHead>
                              <TableHead 
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col gap-1">
                                  <span>Property</span>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="h-7 text-xs justify-between font-normal"
                                        onClick={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        <span className="truncate">
                                          {filterProperty.length === 0
                                            ? "All Properties"
                                            : filterProperty.length === 1
                                            ? filterProperty[0]
                                            : `${filterProperty.length} selected`}
                                        </span>
                                        <ChevronDown className="h-3 w-3 opacity-50 ml-1 shrink-0" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-2 z-[110]" align="start" onClick={(e) => e.stopPropagation()}>
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2 px-2 py-1.5">
                                          <Checkbox
                                            id="property-all"
                                            checked={filterProperty.length === 0}
                                            onCheckedChange={(_checked) => {
                                              setFilterProperty([])
                                              setCurrentPage(1)
                                            }}
                                          />
                                          <label
                                            htmlFor="property-all"
                                            className="text-sm font-medium leading-none cursor-pointer"
                                          >
                                            All Properties
                                          </label>
                                        </div>
                                        {uniqueProperties.map((prop) => (
                                          <div key={prop} className="flex items-center space-x-2 px-2 py-1.5">
                                            <Checkbox
                                              id={`property-${prop}`}
                                              checked={filterProperty.includes(prop)}
                                              onCheckedChange={(checked) => {
                                                if (checked === true) {
                                                  setFilterProperty([...filterProperty, prop])
                                                } else {
                                                  setFilterProperty(filterProperty.filter((p) => p !== prop))
                                                }
                                                setCurrentPage(1)
                                              }}
                                            />
                                            <label
                                              htmlFor={`property-${prop}`}
                                              className="text-sm leading-none cursor-pointer flex-1 truncate"
                                            >
                                              {prop}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </TableHead>
                              <TableHead 
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col gap-1">
                                  <span>Issue</span>
                                  <Input
                                    placeholder="Filter issue..."
                                    value={filterIssue}
                                    onChange={(e) => {
                                      setFilterIssue(e.target.value)
                                      setCurrentPage(1)
                                    }}
                                    className="h-7 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </TableHead>
                              <TableHead 
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col gap-1">
                                  <span>Priority</span>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="h-7 text-xs justify-between font-normal"
                                        onClick={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        <span className="truncate">
                                          {filterPriority.length === 0
                                            ? "All Priorities"
                                            : filterPriority.length === 1
                                            ? MAINTENANCE_PRIORITIES.find((p) => p.value === filterPriority[0])?.label || filterPriority[0]
                                            : `${filterPriority.length} selected`}
                                        </span>
                                        <ChevronDown className="h-3 w-3 opacity-50 ml-1 shrink-0" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-2 z-[110]" align="start" onClick={(e) => e.stopPropagation()}>
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2 px-2 py-1.5">
                                          <Checkbox
                                            id="priority-all"
                                            checked={filterPriority.length === 0}
                                            onCheckedChange={(_checked) => {
                                              setFilterPriority([])
                                              setCurrentPage(1)
                                            }}
                                          />
                                          <label
                                            htmlFor="priority-all"
                                            className="text-sm font-medium leading-none cursor-pointer"
                                          >
                                            All Priorities
                                          </label>
                                        </div>
                                        {MAINTENANCE_PRIORITIES.map((priority) => (
                                          <div key={priority.value} className="flex items-center space-x-2 px-2 py-1.5">
                                            <Checkbox
                                              id={`priority-${priority.value}`}
                                              checked={filterPriority.includes(priority.value)}
                                              onCheckedChange={(checked) => {
                                                if (checked === true) {
                                                  setFilterPriority([...filterPriority, priority.value])
                                                } else {
                                                  setFilterPriority(filterPriority.filter((p) => p !== priority.value))
                                                }
                                                setCurrentPage(1)
                                              }}
                                            />
                                            <label
                                              htmlFor={`priority-${priority.value}`}
                                              className="text-sm leading-none cursor-pointer flex-1"
                                            >
                                              {priority.label}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </TableHead>
                              <TableHead 
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col gap-1">
                                  <span>Status</span>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="h-7 text-xs justify-between font-normal"
                                        onClick={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        <span className="truncate">
                                          {filterStatus.length === 0
                                            ? "All Statuses"
                                            : filterStatus.length === 1
                                            ? MAINTENANCE_STATUSES.find((s) => s.value === filterStatus[0])?.label || filterStatus[0]
                                            : `${filterStatus.length} selected`}
                                        </span>
                                        <ChevronDown className="h-3 w-3 opacity-50 ml-1 shrink-0" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-2 z-[110]" align="start" onClick={(e) => e.stopPropagation()}>
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2 px-2 py-1.5">
                                          <Checkbox
                                            id="status-all"
                                            checked={filterStatus.length === 0}
                                            onCheckedChange={(_checked) => {
                                              setFilterStatus([])
                                              setCurrentPage(1)
                                            }}
                                          />
                                          <label
                                            htmlFor="status-all"
                                            className="text-sm font-medium leading-none cursor-pointer"
                                          >
                                            All Statuses
                                          </label>
                                        </div>
                                        {MAINTENANCE_STATUSES.map((status) => (
                                          <div key={status.value} className="flex items-center space-x-2 px-2 py-1.5">
                                            <Checkbox
                                              id={`status-${status.value}`}
                                              checked={filterStatus.includes(status.value)}
                                              onCheckedChange={(checked) => {
                                                if (checked === true) {
                                                  setFilterStatus([...filterStatus, status.value])
                                                } else {
                                                  setFilterStatus(filterStatus.filter((s) => s !== status.value))
                                                }
                                                setCurrentPage(1)
                                              }}
                                            />
                                            <label
                                              htmlFor={`status-${status.value}`}
                                              className="text-sm leading-none cursor-pointer flex-1"
                                            >
                                              {status.label}
                                            </label>
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </TableHead>
                              <TableHead 
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <div className="flex flex-col gap-1">
                                  <span>Date</span>
                                  <Input
                                    placeholder="Filter date..."
                                    value={filterDate}
                                    onChange={(e) => {
                                      setFilterDate(e.target.value)
                                      setCurrentPage(1)
                                    }}
                                    className="h-7 text-xs"
                                    onClick={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedRequests.map((request) => (
                              <TableRow
                                key={request.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSelectRequest(request)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-muted text-white text-xs">
                                        {getInitials(request.tenant)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{request.tenant}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{request.property}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{request.title}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {getPriorityIcon(request.priority)}
                                    <span className="text-sm">{getPriorityLabel(request.priority)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(request.status)}</TableCell>
                                <TableCell>
                                  {formatDate(request.dateSubmitted, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        handleSelectRequest(request)
                                      }}>
                                        <Info className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        setActionRequest(request)
                                        setIsUpdateStatusDialogOpen(true)
                                      }}>
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        setActionRequest(request)
                                        setIsAssignTechnicianDialogOpen(true)
                                      }}>
                                        Assign Technician
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        setActionRequest(request)
                                        setIsScheduleServiceDialogOpen(true)
                                      }}>
                                        Schedule Service
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Showing {startItem} to {endItem} of {filteredRequests.length} requests
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm">
                              Page {currentPage} of {totalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedRequests.map((request) => (
                          <Card
                            key={request.id}
                            className="cursor-pointer hover:shadow-lg transition-all border hover:border-primary"
                            onClick={() => handleSelectRequest(request)}
                          >
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="p-2 rounded-lg bg-muted">{getStatusIcon(request.status)}</div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg truncate">{request.title}</h3>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span className="text-muted-foreground truncate">{request.property}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-muted text-white text-xs">
                                      {getInitials(request.tenant)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{request.tenant}</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                            {getStatusBadge(request.status)}
                                  <div className="flex items-center gap-1">
                                    {getPriorityIcon(request.priority)}
                                    <span className="text-xs">{getPriorityLabel(request.priority)}</span>
                                  </div>
                                </div>

                                <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t">
                                  <div className="flex justify-between">
                                    <span>Submitted:</span>
                                    <span className="font-medium">
                                      {new Date(request.dateSubmitted).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {request.scheduledDate && (
                                    <div className="flex justify-between">
                                      <span>Scheduled:</span>
                                      <span className="font-medium">
                                        {new Date(request.scheduledDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-2">
                                  <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                className="w-full mt-4"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectRequest(request)
                                }}
                              >
                                <Info className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Showing {startItem} to {endItem} of {filteredRequests.length} requests
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm">
                              Page {currentPage} of {totalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      <NewMaintenanceRequestDialog
        open={isNewRequestDialogOpen}
        onOpenChange={setIsNewRequestDialogOpen}
        onSubmit={handleNewRequestSubmit}
        showPropertyField={true}
        showTenantField={true}
        properties={properties}
      />

      {/* Update Status Dialog */}
      <UpdateStatusDialog
        open={isUpdateStatusDialogOpen}
        onOpenChange={setIsUpdateStatusDialogOpen}
        request={actionRequest ? { id: actionRequest.id, status: actionRequest.status, title: actionRequest.title } : null}
        onUpdate={handleUpdateStatus}
      />

      {/* Assign Technician Dialog */}
      <AssignTechnicianDialog
        open={isAssignTechnicianDialogOpen}
        onOpenChange={setIsAssignTechnicianDialogOpen}
        request={actionRequest ? { id: actionRequest.id, title: actionRequest.title, assignedTo: undefined } : null}
        onAssign={handleAssignTechnician}
      />

      {/* Schedule Service Dialog */}
      <ScheduleServiceDialog
        open={isScheduleServiceDialogOpen}
        onOpenChange={setIsScheduleServiceDialogOpen}
        request={actionRequest ? { id: actionRequest.id, title: actionRequest.title, scheduledDate: actionRequest.scheduledDate } : null}
        onSchedule={handleScheduleService}
      />

      {/* Request Details Dialog */}
      <Dialog open={selectedRequest !== null} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedRequest.title}</DialogTitle>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">{getStatusIcon(selectedRequest.status)}</div>
                </div>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedRequest.status)}
                  {getPriorityBadge(selectedRequest.priority)}
                  <Badge variant="outline" className="capitalize">
                    {selectedRequest.category}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Property</p>
                        <p className="font-semibold">{selectedRequest.property}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Tenant</p>
                        <p className="font-semibold">{selectedRequest.tenant}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="font-semibold">{formatDate(selectedRequest.dateSubmitted, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="font-semibold">{formatDate(selectedRequest.lastUpdated, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                    </div>
                    {selectedRequest.scheduledDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Scheduled Date</p>
                        <p className="font-semibold">{formatDate(selectedRequest.scheduledDate, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Description
                  </h4>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedRequest.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  )
}
