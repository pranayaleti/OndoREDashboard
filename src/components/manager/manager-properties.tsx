import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Building, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { propertyApi, type Property } from "@/lib/api"
import { ModernPropertyCard } from "@/components/owner/modern-property-card"
import { PropertyDetailModal } from "@/components/property-detail-modal"

export default function ManagerProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showPropertyDetail, setShowPropertyDetail] = useState(false)
  const [search, setSearch] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [reviewDialog, setReviewDialog] = useState<"approve" | "reject" | null>(null)
  const [reviewComment, setReviewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchReviewQueue()
  }, [cityFilter])

  const fetchReviewQueue = async () => {
    try {
      const res = await propertyApi.getProperties()
      const allProperties = res.properties
      const data = allProperties.filter((p: { status: string }) => p.status === "pending")
      let filteredProperties = data
      
      // Apply client-side filtering
      if (search) {
        filteredProperties = filteredProperties.filter(property => 
          property.title.toLowerCase().includes(search.toLowerCase()) ||
          property.city.toLowerCase().includes(search.toLowerCase()) ||
          property.addressLine1.toLowerCase().includes(search.toLowerCase())
        )
      }
      
      if (cityFilter && cityFilter !== "all") {
        filteredProperties = filteredProperties.filter(property => 
          property.city === cityFilter
        )
      }
      
      setProperties(filteredProperties)
    } catch (error) {
      console.error("Error fetching review queue:", error)
      toast({
        title: "Error",
        description: "Failed to load pending properties",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (propertyId: string, action: "approve" | "reject") => {
    if (action === "reject" && !reviewComment.trim()) {
      toast({
        title: "Comment required",
        description: "Please provide a comment for rejection.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const status = action === "approve" ? "approved" : "rejected"
      await propertyApi.updatePropertyStatus(propertyId, status, reviewComment)

      toast({
        title: `Property ${action}d`,
        description: `The property has been ${action}d successfully.`,
      })
      setReviewDialog(null)
      setReviewComment("")
      fetchReviewQueue() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} property. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading review queue...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Property Review Queue</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and approve properties submitted by owners</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Salt Lake City">Salt Lake City</SelectItem>
                <SelectItem value="Provo">Provo</SelectItem>
                <SelectItem value="Ogden">Ogden</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchReviewQueue}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid - Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <ModernPropertyCard
            key={property.id}
            property={property}
            onViewDetails={(prop) => { setSelectedProperty(prop); setShowPropertyDetail(true) }}
          />
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties to review</h3>
          <p className="text-gray-600">All pending properties have been reviewed.</p>
        </div>
      )}

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        open={showPropertyDetail}
        onOpenChange={setShowPropertyDetail}
        showActions={false}
      />

      {/* Review Dialog */}
      <Dialog open={reviewDialog !== null} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog === "approve" ? "Approve Property" : "Reject Property"}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog === "approve"
                ? "Are you sure you want to approve this property? It will become visible to tenants."
                : "Please provide a reason for rejecting this property. The owner will be notified."
              }
            </DialogDescription>
          </DialogHeader>
          {reviewDialog === "reject" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="comment">Rejection Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Explain why this property is being rejected..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReviewDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedProperty && handleReview(selectedProperty.id, reviewDialog!)}
              disabled={submitting || (reviewDialog === "reject" && !reviewComment.trim())}
            >
              {submitting ? "Processing..." : reviewDialog === "approve" ? "Approve" : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
