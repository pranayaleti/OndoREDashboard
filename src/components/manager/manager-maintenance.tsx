import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, CheckCircle, Clock, AlertCircle, Wrench, Calendar, MessageSquare, User, Building, Loader2, Edit, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { maintenanceApi, propertyApi, type MaintenanceRequest, type Property } from "@/lib/api"
import { NewMaintenanceRequestDialog } from "@/components/maintenance/new-maintenance-request-dialog"
import { useAuth } from "@/lib/auth-context"

export default function ManagerMaintenance() {
  const { user: _user } = useAuth()
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
  const [updateData, setUpdateData] = useState({
    status: "",
    assignedTo: "",
    message: ""
  })
  const { toast } = useToast()

  // Fetch maintenance requests and properties from API
  useEffect(() => {
    fetchMaintenanceRequests()
    fetchProperties()
  }, [])

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const requests = await maintenanceApi.getManagerMaintenanceRequests()
      setMaintenanceRequests(requests)
    } catch (err: any) {
      console.error("Error fetching maintenance requests:", err)
      setError("Failed to load maintenance requests")
      toast({
        title: "Error",
        description: "Failed to load maintenance requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const allProperties = await propertyApi.getProperties()
      // Managers see all properties
      setProperties(allProperties)
    } catch (err: any) {
      console.error("Error fetching properties:", err)
    }
  }

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

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
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return

    try {
      await maintenanceApi.updateMaintenanceRequest(selectedRequest.id, {
        status: updateData.status as any,
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
    } catch (error: any) {
      console.error("Error updating maintenance request:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update maintenance request.",
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
    } catch (error: any) {
      console.error("Error assigning maintenance request:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to assign maintenance request.",
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
    } catch (error: any) {
      console.error("Error completing maintenance request:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to complete maintenance request.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage tenant maintenance requests</p>
        </div>
        <div className="flex gap-2">
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
                  onChange={(e) => setSearchTerm(e.target.value)}
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
          <div className="text-center py-8">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Maintenance Requests</h3>
            <p className="text-gray-600">No maintenance requests found matching your criteria.</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
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
                      {request.status.replace('_', ' ')}
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
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                            console.log("Opening update dialog for request:", request);
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
                                console.log("Status changed to:", value);
                                setUpdateData(prev => ({ ...prev, status: value }));
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
        )}
      </div>

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
              photos: [] // ROADMAP: Handle photo uploads (Q2 2026 - document management).
            })

            toast({
              title: "Request Created",
              description: "Maintenance ticket has been created successfully.",
            })

            fetchMaintenanceRequests()
            setIsNewRequestDialogOpen(false)
          } catch (error: any) {
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
