import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Building, Plus, Search, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { propertyApi, type Property } from "@/lib/api"
import { ModernPropertyCard } from "./modern-property-card"
import { PropertyDetailModal } from "@/components/property-detail-modal"
import { Breadcrumb } from "@/components/ui/breadcrumb"

export default function OwnerProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showPropertyDetail, setShowPropertyDetail] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchProperties()
  }, [statusFilter])

  useEffect(() => {
    if (search === "") {
      fetchProperties()
    }
  }, [search])

  const fetchProperties = async () => {
    if (!user?.id) return

    try {
      const res = await propertyApi.getProperties()
      const data = res.properties
      // Filter properties based on search and status if needed
      let filteredProperties = data
      
      if (search) {
        filteredProperties = filteredProperties.filter((property: Property) =>
          property.title.toLowerCase().includes(search.toLowerCase()) ||
          property.city.toLowerCase().includes(search.toLowerCase()) ||
          property.addressLine1.toLowerCase().includes(search.toLowerCase())
        )
      }

      if (statusFilter && statusFilter !== "all") {
        filteredProperties = filteredProperties.filter((property: Property) =>
          property.status === statusFilter
        )
      }

      // For owners, only show their own properties
      if (user.role === "owner") {
        filteredProperties = filteredProperties.filter((property: Property) =>
          property.ownerId === user.id
        )
        // When "all" is selected, show all statuses (pending, approved, rejected)
        // No additional filtering needed - let the user see all their properties
      }
      
      setProperties(filteredProperties)
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchProperties()
  }

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property)
    setShowPropertyDetail(true)
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading properties...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Properties", icon: Building }]} />
      </div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Properties</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your real estate investment portfolio</p>
          </div>
          <Button asChild>
            <Link to="/owner/properties/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Link>
          </Button>
        </div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <ModernPropertyCard
            key={property.id}
            property={property}
            onViewDetails={handleViewProperty}
          />
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first property.</p>
          <Button asChild>
            <Link to="/owner/properties/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Link>
          </Button>
        </div>
      )}

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        open={showPropertyDetail}
        onOpenChange={setShowPropertyDetail}
        showActions={false}
      />
    </div>
  )
}
