import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Check, Eye } from "lucide-react"
import { PropertyImageCarousel } from "@/components/ui/property-image-carousel"
import { Property } from "@/lib/api"

interface ModernPropertyCardProps {
  property: Property
  onViewDetails?: (property: Property) => void
}

export function ModernPropertyCard({ property, onViewDetails }: ModernPropertyCardProps) {
  // Calculate monthly income from API data
  const monthlyIncome = property.price ? property.price : 0
  
  // Format currency (show exact amount, no rounding/abbreviation)
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { label: "Approved", className: "bg-green-500 text-white" },
      pending: { label: "Pending", className: "bg-yellow-500 text-white" },
      rejected: { label: "Rejected", className: "bg-red-500 text-white" },
      occupied: { label: "Occupied", className: "bg-blue-500 text-white" },
    } as const
    
    const normalized = (status || "").toLowerCase() as keyof typeof statusConfig
    const config = statusConfig[normalized] || statusConfig.pending
    
    return (
      <Badge className={`${config.className} flex items-center gap-1 px-2 py-1`}>
        <Check className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => onViewDetails?.(property)}
    >
      {/* Property Image with Status Badge */}
      <div className="relative">
        <PropertyImageCarousel
          photos={property.photos}
          propertyTitle={property.title}
          aspectRatio="video"
          showControls={true}
          showIndicators={true}
          className="h-48 w-full"
        />
        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3">
          {getStatusBadge(property.status)}
        </div>
      </div>

      {/* Property Details */}
      <CardContent className="p-4">
        {/* Property Title */}
        <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">{property.title}</h3>
        
        {/* Address */}
        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{property.addressLine1}, {property.city}</span>
        </div>
        
        {/* Added Date */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Added: {new Date(property.createdAt).toLocaleDateString()}
        </div>

        {/* Key Metrics - Single Column Layout */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-center gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(monthlyIncome)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Income</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails?.(property)
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
