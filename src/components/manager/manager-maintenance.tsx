import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, CheckCircle, Clock, AlertCircle, Wrench, Calendar, MessageSquare, User, Building, Loader2, Edit, Plus, Radio, Users, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { maintenanceApi, propertyApi, vendorsApi, type MaintenanceRequest, type Property } from "@/lib/api"
import type { Vendor } from "@/lib/api/clients/vendors"
import { NewMaintenanceRequestDialog } from "@/components/maintenance/new-maintenance-request-dialog"
import { useAuth } from "@/lib/auth-context"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"
import { usePagination } from "@/hooks/usePagination"
import { DataPagination } from "@/components/ui/DataPagination"
import { PageSizeSelector } from "@/components/ui/PageSizeSelector"
import { EmptyState } from "@/components/ui/empty-state"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"
import { getDemoMaintenanceTickets } from "@/lib/seed-data"

type BoardStatus = MaintenanceRequest["status"] | "awaiting_parts"

export default function ManagerMaintenance() {
  const { user } = useAuth()
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isNewRequestDialogOpen, setIsNewRequestDialogOpen] = useState(false)
  const [suggestVendorsRequest, setSuggestVendorsRequest] = useState<MaintenanceRequest | null>(null)
  const [suggestedVendors, setSuggestedVendors] = useState<Vendor[]>([])
  const [suggestVendorsLoading, setSuggestVendorsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  const [boardStatusById, setBoardStatusById] = useState<Record<string, BoardStatus>>({})
  const [draggedRequestId, setDraggedRequestId] = useState<string | null>(null)
  const [updateData, setUpdateData] = useState({
    status: "" as MaintenanceRequest["status"] | "",
    assignedTo: "",
    message: ""
  })
  const { toast } = useToast()

  // Fetch maintenance requests and properties from API
  useEffect(() => {
    fetchMaintenanceRequests()
    fetchProperties()
  }, [])

  // Live updates: auto-refresh when a maintenance request is created or updated
  useRealtimeTable({
    table: "maintenance_requests",
    events: ["INSERT", "UPDATE"],
    enabled: !!user?.id,
    onEvent: (payload) => {
      if (payload.eventType === "INSERT") {
        toast({
          title: "New Maintenance Request",
          description: `A new ${(payload.new as Record<string, string>).priority} priority request has been submitted.`,
          duration: 5000,
        })
      }
      fetchMaintenanceRequests()
    },
  })

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const requests = await maintenanceApi.getManagerMaintenanceRequests()
      const fallbackRequests = getDemoMaintenanceTickets(user)
      setMaintenanceRequests(requests.length > 0 ? requests : fallbackRequests)
    } catch (err: unknown) {
      console.error("Error fetching maintenance requests:", err)
      const fallbackRequests = getDemoMaintenanceTickets(user)
      if (fallbackRequests.length > 0) {
        setMaintenanceRequests(fallbackRequests)
        setError(null)
      } else {
        setError("Failed to load maintenance requests")
        toast({
          title: "Error",
          description: "Failed to load maintenance requests. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const res = await propertyApi.getProperties()
      setProperties(res.properties)
    } catch (err: unknown) {
      console.error("Error fetching properties:", err)
    }
  }

  useEffect(() => {
    if (!suggestVendorsRequest) {
      setSuggestedVendors([])
      return
    }
    let cancelled = false
    setSuggestVendorsLoading(true)
    vendorsApi.suggest(suggestVendorsRequest.category)
      .then((res) => { if (!cancelled) setSuggestedVendors(res.data ?? []) })
      .catch(() => { if (!cancelled) toast({ title: "Error", description: "Failed to load vendor suggestions.", variant: "destructive" }) })
      .finally(() => { if (!cancelled) setSuggestVendorsLoading(false) })
    return () => { cancelled = true }
  }, [suggestVendorsRequest?.id, suggestVendorsRequest?.category])

  const getBoardStatus = (request: MaintenanceRequest): BoardStatus =>
    boardStatusById[request.id] ?? request.status

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || getBoardStatus(request) === statusFilter
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const {
    items: pagedRequests,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    changePageSize,
    reset: resetPage,
  } = usePagination(filteredRequests, { pageSize: 10 })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Wrench className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusLabel = (request: MaintenanceRequest) => getBoardStatus(request).replace("_", " ")

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "emergency":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-muted text-gray-800 border-gray-200"
    }
  }

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return

    try {
      await maintenanceApi.updateMaintenanceRequest(selectedRequest.id, {
        status: updateData.status || selectedRequest.status,
        assignedTo: updateData.assignedTo,
        managerNotes: updateData.message
      })

      toast({
        title: "Request Updated",
        description: "Maintenance request has been updated successfully.",
        duration: 3000,
      })

      setIsUpdateDialogOpen(false)
      setUpdateData({ status: "", assignedTo: "", message: "" })
      fetchMaintenanceRequests()
    } catch (error: unknown) {
      console.error("Error updating maintenance request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Failed to update maintenance request.",
        variant: "destructive",
      })
    }
  }

  const handleAssignRequest = async () => {
    if (!selectedRequest) return

    try {
      await maintenanceApi.updateMaintenanceRequest(selectedRequest.id, {
        status: "in_progress",
        assignedTo: updateData.assignedTo,
        managerNotes: `Request assigned to ${updateData.assignedTo}`
      })

      toast({
        title: "Request Assigned",
        description: "Maintenance request has been assigned successfully.",
      })

      setIsAssignDialogOpen(false)
      setUpdateData({ status: "", assignedTo: "", message: "" })
      fetchMaintenanceRequests()
    } catch (error: unknown) {
      console.error("Error assigning maintenance request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Failed to assign maintenance request.",
        variant: "destructive",
      })
    }
  }

  const handleCompleteRequest = async (requestId: string) => {
    try {
      await maintenanceApi.updateMaintenanceRequest(requestId, {
        status: "completed",
        managerNotes: "Maintenance request has been completed."
      })

      toast({
        title: "Request Completed",
        description: "Maintenance request has been marked as completed.",
      })

      fetchMaintenanceRequests()
    } catch (error: unknown) {
      console.error("Error completing maintenance request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Failed to complete maintenance request.",
        variant: "destructive",
      })
    }
  }

  const handleExportCsv = () => {
    if (filteredRequests.length === 0) return
    const rows = [
      ["Title", "Property", "Priority", "Status", "Assigned To", "Created"],
      ...filteredRequests.map((request) => [
        request.title,
        request.propertyTitle || request.propertyAddress || "Property",
        request.priority,
        getBoardStatus(request),
        request.assignedTo || "Not assigned",
        new Date(request.createdAt).toLocaleDateString(),
      ]),
    ]
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "maintenance-requests.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast({ title: "Download started", description: "Maintenance requests CSV export" })
  }

  const handleMoveRequest = async (request: MaintenanceRequest, nextStatus: BoardStatus) => {
    setBoardStatusById((previous) => ({ ...previous, [request.id]: nextStatus }))
    setMaintenanceRequests((previous) =>
      previous.map((item) =>
        item.id === request.id && nextStatus !== "awaiting_parts"
          ? { ...item, status: nextStatus }
          : item
      )
    )

    if (nextStatus === "awaiting_parts") {
      toast({
        title: "Board updated",
        description: `${request.title} moved to Awaiting Parts.`,
      })
      return
    }

    try {
      await maintenanceApi.updateMaintenanceRequest(request.id, { status: nextStatus })
      toast({
        title: "Status updated",
        description: `${request.title} moved to ${nextStatus.replace("_", " ")}.`,
      })
    } catch (error) {
      setBoardStatusById((previous) => {
        const next = { ...previous }
        delete next[request.id]
        return next
      })
      void fetchMaintenanceRequests()
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update the ticket status.",
        variant: "destructive",
      })
    }
  }

  const boardColumns: Array<{ status: BoardStatus; label: string }> = [
    { status: "pending", label: "Pending" },
    { status: "in_progress", label: "In Progress" },
    { status: "awaiting_parts", label: "Awaiting Parts" },
    { status: "completed", label: "Completed" },
  ]

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Maintenance Management</h2>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Live</span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage tenant maintenance requests</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-xl border p-1">
            <Button type="button" variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
              List view
            </Button>
            <Button type="button" variant={viewMode === "kanban" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("kanban")}>
              Kanban view
            </Button>
          </div>
          <Button variant="outline" onClick={handleExportCsv}>
            Export CSV
          </Button>
          <ExportPDFButton
            variant="outline"
            fileName="maintenance-requests"
            content={{
              title: "Maintenance Requests",
              subtitle: "Current manager maintenance queue",
              summary: [
                { label: "Requests", value: filteredRequests.length },
                { label: "In Progress", value: filteredRequests.filter((request) => getBoardStatus(request) === "in_progress").length },
                { label: "Awaiting Parts", value: filteredRequests.filter((request) => getBoardStatus(request) === "awaiting_parts").length },
              ],
              tables: [
                {
                  title: "Maintenance Requests",
                  headers: ["Title", "Property", "Priority", "Status", "Assigned To"],
                  rows: filteredRequests.map((request) => [
                    request.title,
                    request.propertyTitle || request.propertyAddress || "Property",
                    request.priority,
                    getBoardStatus(request),
                    request.assignedTo || "Not assigned",
                  ]),
                },
              ],
            }}
          />
          <Button onClick={() => setIsNewRequestDialogOpen(true)} className="bg-ondo-orange hover:bg-ondo-red">
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
          <Button onClick={fetchMaintenanceRequests} variant="outline">
            <Wrench className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); resetPage() }}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Count + page size */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {totalItems} request{totalItems !== 1 ? "s" : ""} found
        </p>
        <PageSizeSelector pageSize={pageSize} onChange={changePageSize} options={[10, 25, 50]} />
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading maintenance requests...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Requests</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchMaintenanceRequests}>
              Try Again
            </Button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={<Wrench className="h-12 w-12" />}
            title="No maintenance requests"
            description="No maintenance requests found matching your current filters."
            ctaLabel="Create maintenance ticket"
            onCtaClick={() => setIsNewRequestDialogOpen(true)}
          />
        ) : viewMode === "list" ? (
          pagedRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{request.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{request.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Building className="h-4 w-4 mr-1" />
                          {request.propertyTitle || `Property ${request.propertyId?.slice(-8)}`}
                        </span>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {request.tenantFirstName && request.tenantLastName
                            ? `${request.tenantFirstName} ${request.tenantLastName}`
                            : `Tenant ${request.tenantId?.slice(-8)}`
                          }
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority} priority
                    </Badge>
                    <Badge variant="outline">
                      {getStatusLabel(request)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <p className="font-medium capitalize">{request.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Assigned To:</span>
                    <p className="font-medium">{request.assignedTo || "Not assigned"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Scheduled:</span>
                    <p className="font-medium">
                      {request.dateScheduled ? new Date(request.dateScheduled).toLocaleDateString() : "Not scheduled"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <p className="font-medium">
                      {request.dateCompleted ? new Date(request.dateCompleted).toLocaleDateString() : "Not completed"}
                    </p>
                  </div>
                </div>

                {/* Property and Tenant Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 p-4 bg-muted dark:bg-card rounded-lg">
                  <div>
                    <span className="text-gray-500 font-medium">Property Details:</span>
                    <p className="font-medium">{request.propertyTitle || "Property Title N/A"}</p>
                    <p className="text-gray-600 text-xs">
                      {request.propertyAddress && request.propertyCity
                        ? `${request.propertyAddress}, ${request.propertyCity}`
                        : "Address not available"
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Tenant Details:</span>
                    <p className="font-medium">
                      {request.tenantFirstName && request.tenantLastName
                        ? `${request.tenantFirstName} ${request.tenantLastName}`
                        : "Tenant Name N/A"
                      }
                    </p>
                    <p className="text-gray-600 text-xs">
                      {request.tenantEmail || "Email not available"}
                      {request.tenantPhone && ` • ${request.tenantPhone}`}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {(request as { photoUrl?: string }).photoUrl && (
                      <a
                        href={(request as { photoUrl?: string }).photoUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-orange-600 hover:underline"
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        View photo
                      </a>
                    )}
                    {request.photos && request.photos.length > 0 && (
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {request.photos.length} photo(s)
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setUpdateData({
                              status: request.status || "",
                              assignedTo: request.assignedTo || "",
                              message: ""
                            });
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Maintenance Request</DialogTitle>
                          <DialogDescription>
                            Update the status and details of this maintenance request.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <div className="text-xs text-gray-500 mb-2">
                              Current status: {updateData.status || "none"} | Selected request: {selectedRequest?.id || "none"}
                            </div>
                            <Select
                              value={updateData.status}
                              onValueChange={(value) => {
                                setUpdateData((prev) => ({
                                  ...prev,
                                  status: value as MaintenanceRequest["status"],
                                }))
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="assignedTo">Assigned To</Label>
                            <Input
                              id="assignedTo"
                              placeholder="Technician name"
                              value={updateData.assignedTo}
                              onChange={(e) => setUpdateData(prev => ({ ...prev, assignedTo: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="message">Update Message</Label>
                            <Textarea
                              id="message"
                              placeholder="Add an update message..."
                              value={updateData.message}
                              onChange={(e) => setUpdateData(prev => ({ ...prev, message: e.target.value }))}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleUpdateRequest}>
                            Update Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Maintenance Request</DialogTitle>
                          <DialogDescription>
                            Assign this maintenance request to a technician.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="assignedTo">Technician Name</Label>
                            <Input
                              id="assignedTo"
                              placeholder="Enter technician name"
                              value={updateData.assignedTo}
                              onChange={(e) => setUpdateData(prev => ({ ...prev, assignedTo: e.target.value }))}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAssignRequest}>
                            Assign Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSuggestVendorsRequest(request)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Suggest vendors
                    </Button>
                    {request.status !== "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompleteRequest(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="grid gap-4 xl:grid-cols-4">
            {boardColumns.map((column) => {
              const columnRequests = filteredRequests.filter((request) => getBoardStatus(request) === column.status)
              return (
                <div
                  key={column.status}
                  className="rounded-2xl border bg-muted/10 p-4"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const request = filteredRequests.find((item) => item.id === draggedRequestId)
                    if (request) {
                      void handleMoveRequest(request, column.status)
                    }
                    setDraggedRequestId(null)
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">{column.label}</h3>
                    <Badge variant="secondary">{columnRequests.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {columnRequests.map((request) => (
                      <div
                        key={request.id}
                        draggable
                        onDragStart={() => setDraggedRequestId(request.id)}
                        onDragEnd={() => setDraggedRequestId(null)}
                        className="cursor-grab rounded-2xl border bg-background p-4 shadow-sm active:cursor-grabbing"
                      >
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold">{request.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.propertyTitle || request.propertyAddress || "Property"}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
                            <Badge variant="outline">{request.assignedTo || "Unassigned"}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {request.dateScheduled ? `Scheduled ${new Date(request.dateScheduled).toLocaleDateString()}` : "Schedule pending"}
                          </div>
                        </div>
                      </div>
                    ))}
                    {columnRequests.length === 0 && (
                      <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                        Drop a ticket here
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Suggest vendors dialog */}
      <Dialog open={!!suggestVendorsRequest} onOpenChange={(open) => { if (!open) setSuggestVendorsRequest(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Suggest vendors</DialogTitle>
            <DialogDescription>
              {suggestVendorsRequest
                ? `Vendors for ${suggestVendorsRequest.category} — ${suggestVendorsRequest.title}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {suggestVendorsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : suggestedVendors.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No vendors suggested for this category.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {suggestedVendors.map((v) => (
                <li key={v.id} className="flex items-start gap-2 p-2 rounded border text-sm">
                  <div>
                    <p className="font-medium">{v.name}{v.company ? ` · ${v.company}` : ""}</p>
                    <p className="text-gray-500 capitalize">{v.specialty}</p>
                    {(v.phone || v.email) && (
                      <p className="text-xs text-gray-400 mt-0.5">{[v.phone, v.email].filter(Boolean).join(" · ")}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={goToPage}
      />

      {/* New Maintenance Request Dialog */}
      <NewMaintenanceRequestDialog
        open={isNewRequestDialogOpen}
        onOpenChange={setIsNewRequestDialogOpen}
        onSubmit={async (data) => {
          try {
            await maintenanceApi.createMaintenanceRequest({
              title: data.title,
              description: data.description,
              category: data.category as any,
              priority: data.priority as any,
              ...(data.photoUrl && { photoUrl: data.photoUrl }),
            } as Parameters<typeof maintenanceApi.createMaintenanceRequest>[0])

            toast({
              title: "Request Created",
              description: "Maintenance ticket has been created successfully.",
            })

            fetchMaintenanceRequests()
            setIsNewRequestDialogOpen(false)
          } catch (error: unknown) {
            console.error("Error creating maintenance request:", error)
            throw error // Re-throw to let dialog handle the error display
          }
        }}
        showPropertyField={true}
        showTenantField={true}
        properties={properties}
      />
    </div>
  )
}
