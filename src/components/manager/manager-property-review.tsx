import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  MapPin,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowDownAZ,
  Filter,
  Search
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { propertyApi, type Property } from "@/lib/api"
import { PropertyImageCarousel } from "@/components/ui/property-image-carousel"
import { formatUSDate } from "@/lib/us-format"
import { CardGridSkeleton } from "@/components/ui/list-skeletons"

export default function ManagerPropertyReview() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOption, setSortOption] = useState<"newest" | "oldest" | "az" | "status">("newest")
  const { toast } = useToast()

  const handleCardClick = (property: Property) => {
    setSelectedProperty(property)
    setIsDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setSelectedProperty(null)
      setReviewComment("")
    }
  }

  // Initialize and update status filter when URL query parameter changes
  useEffect(() => {
    const statusParam = searchParams.get("status")
    if (statusParam && ["all", "pending", "approved", "rejected"].includes(statusParam)) {
      setStatusFilter(statusParam)
    } else if (!statusParam) {
      setStatusFilter("all")
    }
  }, [searchParams])

  // Update URL when status filter changes (but only if user manually changes it)
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    if (value === "all") {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ status: value }, { replace: true })
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      // Get all properties and filter by status
      const res = await propertyApi.getProperties()
      const allProperties = res.properties

      setProperties(allProperties)
    } catch (error) {
      console.error("Error fetching properties:", error)
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (propertyId: string, status: 'approved' | 'rejected') => {
    setIsSubmitting(true)
    try {
      await propertyApi.updatePropertyStatus(propertyId, status, reviewComment)
      
      toast({
        title: "Property Updated",
        description: `Property has been ${status}`,
        duration: 3000,
      })

      // Remove the property from the list
      setProperties(prev => prev.filter(p => p.id !== propertyId))
      setSelectedProperty(null)
      setReviewComment("")
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update property status",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredProperties = properties
    .filter((property) => {
      const matchesStatus = statusFilter === "all" || property.status === statusFilter
      const searchable = [
        property.title,
        property.addressLine1,
        property.addressLine2,
        property.city,
        property.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      const matchesSearch = normalizedSearch.length === 0 || searchable.includes(normalizedSearch)
      return matchesStatus && matchesSearch
    })
    .sort((left, right) => {
      if (sortOption === "oldest") {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      }
      if (sortOption === "az") {
        return (left.title || left.addressLine1).localeCompare(right.title || right.addressLine1)
      }
      if (sortOption === "status") {
        return left.status.localeCompare(right.status)
      }
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })

  const statusPills: Array<{ label: string; value: string }> = [
    { label: "All", value: "all" },
    { label: "Occupied", value: "occupied" },
    { label: "Vacant", value: "vacant" },
    { label: "Pending Review", value: "pending" },
    { label: "Approved", value: "approved" },
  ]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CardGridSkeleton cards={6} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Property Review</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and manage property submissions</p>
      </div>

      {/* Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by property name or address"
              className="pl-10"
              aria-label="Search properties"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-500" />
            <Select value={sortOption} onValueChange={(value: "newest" | "oldest" | "az" | "status") => setSortOption(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="az">A–Z</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All Properties</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusPills.map((pill) => (
            <Button
              key={pill.value}
              type="button"
              variant={statusFilter === pill.value ? "default" : "outline"}
              className="rounded-full"
              onClick={() => handleStatusFilterChange(pill.value)}
              aria-label={`Filter properties by ${pill.label}`}
            >
              {pill.label}
            </Button>
          ))}
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <ArrowDownAZ className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {statusFilter === "all" ? "" : statusFilter} properties
          </h3>
          <p className="text-gray-600">
            {statusFilter === "pending" 
              ? "All properties have been reviewed." 
              : `No properties found with status: ${statusFilter}`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card 
              key={property.id} 
              className="hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/50 transition-all overflow-hidden"
            >
              {/* Property Image Carousel */}
              <div className="relative">
                <PropertyImageCarousel
                  photos={property.photos}
                  propertyTitle={property.title}
                  aspectRatio="video"
                  showControls={true}
                  showIndicators={true}
                  className="h-48"
                />
                {/* Status Badge Overlay */}
                <div className="absolute top-2 right-2">
                  <Badge variant={
                    property.status === "approved" ? "default" : 
                    property.status === "rejected" ? "destructive" : 
                    "secondary"
                  }>
                    {property.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                    {property.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {property.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg dark:text-card-foreground">{property.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.addressLine1}, {property.city}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="capitalize dark:text-gray-300">{property.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Submitted:</span>
                    <span className="dark:text-gray-300">{formatUSDate(property.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Photos:</span>
                    <span className="dark:text-gray-300">{property.photos?.length || 0} {property.photos?.length === 0 && "(Using placeholders)"}</span>
                  </div>
                  {property.description && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Description:</span>
                      <p className="mt-1 text-gray-800 dark:text-gray-300 line-clamp-2">{property.description}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCardClick(property)}
                  >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog - Controlled */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Property: {selectedProperty?.title || ''}</DialogTitle>
            <DialogDescription>
              Review the property details and approve or reject the submission.
            </DialogDescription>
          </DialogHeader>
                        
                        {selectedProperty && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Property Type</Label>
                                <p className="capitalize">{selectedProperty.type}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <Badge variant="secondary">{selectedProperty.status}</Badge>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium">Address</Label>
                              <p>{selectedProperty.addressLine1}</p>
                              {selectedProperty.addressLine2 && <p>{selectedProperty.addressLine2}</p>}
                              <p>{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipcode}</p>
                            </div>
                            
                            {selectedProperty.description && (
                              <div>
                                <Label className="text-sm font-medium">Description</Label>
                                <p className="text-gray-700">{selectedProperty.description}</p>
                              </div>
                            )}
                            
                            <div>
                              <Label htmlFor="comment">Review Comment (Optional)</Label>
                              <Textarea
                                id="comment"
                                placeholder="Add a comment about your decision..."
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                              <Button
                                onClick={() => handleStatusUpdate(selectedProperty.id, 'approved')}
                                disabled={isSubmitting}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleStatusUpdate(selectedProperty.id, 'rejected')}
                                disabled={isSubmitting}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
