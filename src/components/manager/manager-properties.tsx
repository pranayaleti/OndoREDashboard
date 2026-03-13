import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Building, Search, Filter, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { propertyApi, type Property } from "@/lib/api"
import { ModernPropertyCard } from "@/components/owner/modern-property-card"
import { PropertyDetailModal } from "@/components/property-detail-modal"
import { usePagination } from "@/hooks/usePagination"
import { DataPagination } from "@/components/ui/DataPagination"
import { PageSizeSelector } from "@/components/ui/PageSizeSelector"
import { useDebounce } from "@/hooks/useDebounce"

type SortOption = "newest" | "price_asc" | "price_desc" | "title_asc"

export default function ManagerProperties() {
  const [allProperties, setAllProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showPropertyDetail, setShowPropertyDetail] = useState(false)
  const [search, setSearch] = useState("")
  const [cityFilter, setCityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [reviewDialog, setReviewDialog] = useState<"approve" | "reject" | null>(null)
  const [reviewComment, setReviewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const debouncedSearch = useDebounce(search, 300)

  // Fetch all properties once
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true)
      const res = await propertyApi.getProperties()
      setAllProperties(res.properties)
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
  }, [toast])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  // Derive available cities from data
  const availableCities = useMemo(() => {
    const cities = new Set<string>()
    allProperties.forEach((p) => {
      if (p.city) cities.add(p.city)
    })
    return Array.from(cities).sort()
  }, [allProperties])

  // Client-side filtering + sorting
  const filteredProperties = useMemo(() => {
    let result = [...allProperties]

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }

    // City filter
    if (cityFilter !== "all") {
      result = result.filter((p) => p.city === cityFilter)
    }

    // Search (debounced)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.addressLine1.toLowerCase().includes(q) ||
          (p.state && p.state.toLowerCase().includes(q)) ||
          (p.zipCode && p.zipCode.includes(q))
      )
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        break
      case "price_asc":
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        break
      case "price_desc":
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
        break
      case "title_asc":
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    return result
  }, [allProperties, statusFilter, cityFilter, debouncedSearch, sortBy])

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
      fetchProperties() // Refresh the list
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

  const {
    items: pagedProperties,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    goToPage,
    changePageSize,
  } = usePagination(filteredProperties, { pageSize: 9 })

  if (loading) {
    return <div className="flex justify-center py-8">Loading properties...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Property Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search, filter, and manage all properties
        </p>
      </div>

      {/* Enhanced Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, address, city, state, or zip..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  id="property-search-input"
                />
              </div>
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" id="property-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* City filter — dynamically populated */}
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-48" id="property-city-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-44" id="property-sort">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low → High</SelectItem>
                <SelectItem value="price_desc">Price: High → Low</SelectItem>
                <SelectItem value="title_asc">Name: A → Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Count + page size */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {filteredProperties.length} propert{filteredProperties.length !== 1 ? "ies" : "y"} found
          {statusFilter !== "all" && ` (${statusFilter})`}
          {cityFilter !== "all" && ` in ${cityFilter}`}
        </p>
        <PageSizeSelector pageSize={pageSize} onChange={changePageSize} options={[9, 18, 36]} />
      </div>

      {/* Properties Grid - Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pagedProperties.map((property) => (
          <ModernPropertyCard
            key={property.id}
            property={property}
            onViewDetails={(prop) => { setSelectedProperty(prop); setShowPropertyDetail(true) }}
          />
        ))}
      </div>

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={goToPage}
        className="mt-4"
      />

      {filteredProperties.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {debouncedSearch || statusFilter !== "all" || cityFilter !== "all"
              ? "No properties match your filters"
              : "No properties found"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {debouncedSearch || statusFilter !== "all" || cityFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Properties will appear here once added."}
          </p>
          {(debouncedSearch || statusFilter !== "all" || cityFilter !== "all") && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => { setSearch(""); setStatusFilter("all"); setCityFilter("all") }}
            >
              Clear Filters
            </Button>
          )}
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
