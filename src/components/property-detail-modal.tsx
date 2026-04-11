import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Check,
  X,
  Building,
  Phone,
  Mail,
  DollarSign,
  Star,
  Globe,
  FileText,
  Clock,
  Tag,
  UserCheck,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { type Property } from "@/lib/api"
import { formatUSDate, formatUSD, formatUSPhone } from "@/lib/us-format"
import { PropertyRentScheduleSection } from "@/components/shared/property-rent-schedule-section"

interface PropertyDetailModalProps {
  property: Property | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove?: (propertyId: string) => void
  onReject?: (propertyId: string) => void
  showActions?: boolean
}

export function PropertyDetailModal({
  property,
  open,
  onOpenChange,
  onApprove,
  onReject,
  showActions = false,
}: PropertyDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!property) return null

  const nextImage = () => {
    if (property.photos && property.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.photos!.length)
    }
  }

  const prevImage = () => {
    if (property.photos && property.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.photos!.length) % property.photos!.length)
    }
  }

  const hasImages = property.photos && property.photos.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6" />
            {property.title}
          </DialogTitle>
          <DialogDescription>View detailed information about this property</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Image Slider */}
          {hasImages ? (
            <div className="relative h-[300px] md:h-[400px] mb-6 rounded-lg overflow-hidden bg-muted">
              <img
                src={property.photos?.[currentImageIndex]?.url || `${import.meta.env.BASE_URL}placeholder.svg`}
                alt={`${property.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Navigation Arrows */}
              {property.photos && property.photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/30 text-white hover:bg-background/50 rounded-full h-10 w-10"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/30 text-white hover:bg-background/50 rounded-full h-10 w-10"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-background/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {property.photos?.length || 0}
                  </div>
                </>
              )}
              {/* Caption */}
              {property.photos?.[currentImageIndex]?.caption && (
                <div className="absolute bottom-4 left-4 bg-background/50 text-white px-3 py-1 rounded-md text-sm max-w-xs">
                  {property.photos?.[currentImageIndex]?.caption}
                </div>
              )}
            </div>
          ) : (
            <div className="h-[300px] md:h-[400px] mb-6 rounded-lg bg-muted flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No images available</p>
              </div>
            </div>
          )}
          {/* Property Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <Badge variant={
              property.status === "approved" ? "default" : 
              property.status === "rejected" ? "destructive" : 
              "secondary"
            } className="text-sm">
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </Badge>
            
            {/* Action Buttons for Managers */}
            {showActions && property.status === 'pending' && onApprove && onReject && (
              <div className="flex gap-2">
                <Button
                  onClick={() => onApprove(property.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onReject(property.id)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="details">Property Details</TabsTrigger>
              <TabsTrigger value="rent-schedule">Rent schedule</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>
            <TabsContent value="rent-schedule" className="space-y-4">
              <PropertyRentScheduleSection propertyId={property.id} />
            </TabsContent>
            <TabsContent value="details" className="space-y-6">
              {/* Property Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Basic Info Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                    <Home className="h-4 w-4 mr-2" />
                    Basic Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{property.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span className="font-medium">{formatUSDate(property.createdAt)}</span>
                    </div>
                    {property.owner && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Owner:</span>
                        <span className="font-medium">{property.owner.firstName} {property.owner.lastName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Specs Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Property Specs
                  </h4>
                  <div className="space-y-2 text-sm">
                    {property.price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium text-green-700">
                          {formatUSD(property.price)} / month
                        </span>
                      </div>
                    )}
                    {property.bedrooms && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bedrooms:</span>
                        <span className="font-medium">{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bathrooms:</span>
                        <span className="font-medium">{property.bathrooms}</span>
                      </div>
                    )}
                    {property.sqft && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Square Feet:</span>
                        <span className="font-medium">{property.sqft.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating & Media Card */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center">
                    <Star className="h-4 w-4 mr-2" />
                    Rating & Media
                  </h4>
                  <div className="space-y-2 text-sm">
                    {property.rating && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Rating:</span>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          <span className="font-medium">{property.rating}/5</span>
                        </div>
                      </div>
                    )}
                    {property.reviewCount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reviews:</span>
                        <span className="font-medium">{property.reviewCount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Photos:</span>
                      <span className="font-medium">{property.photos?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Description */}
              {property.description && (
                <div className="bg-card dark:bg-card p-6 rounded-lg border">
                  <h4 className="text-lg font-semibold mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-gray-500" />
                    Description
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {property.description}
                  </p>
                </div>
              )}
              {/* Property Categories */}
              {((property.specialties?.length ?? 0) > 0 || (property.services?.length ?? 0) > 0 || (property.valueRanges?.length ?? 0) > 0) && (
                <div className="bg-card dark:bg-card p-6 rounded-lg border">
                  <h4 className="text-lg font-semibold mb-4">Property Categories</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {property.specialties && property.specialties.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-3 flex items-center text-blue-600">
                          <Tag className="h-4 w-4 mr-2" />
                          Specialties
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {property.specialties.map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="capitalize">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {property.services && property.services.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-3 flex items-center text-green-600">
                          <Building className="h-4 w-4 mr-2" />
                          Services
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {property.services.map((service, index) => (
                            <Badge key={index} variant="outline" className="capitalize">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {property.valueRanges && property.valueRanges.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-3 flex items-center text-purple-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Value Ranges
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {property.valueRanges.map((range, index) => (
                            <Badge key={index} variant="default" className="capitalize">
                              {range}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Lease Information */}
              {(property.leaseTerms || property.fees || property.availability) && (
                <div className="bg-card dark:bg-card p-6 rounded-lg border">
                  <h4 className="text-lg font-semibold mb-4">Lease Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {property.availability && (
                      <div>
                        <h5 className="font-medium mb-2 flex items-center text-orange-600">
                          <Clock className="h-4 w-4 mr-2" />
                          Availability
                        </h5>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{property.availability}</p>
                      </div>
                    )}

                    {property.leaseTerms && (
                      <div>
                        <h5 className="font-medium mb-2 flex items-center text-blue-600">
                          <FileText className="h-4 w-4 mr-2" />
                          Lease Terms
                        </h5>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{property.leaseTerms}</p>
                      </div>
                    )}

                    {property.fees && (
                      <div>
                        <h5 className="font-medium mb-2 flex items-center text-green-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Management Fees
                        </h5>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">{property.fees}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Contact Information */}
              {property.phone && (
                <div className="bg-card dark:bg-card p-6 rounded-lg border">
                  <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <a href={`tel:${property.phone}`} className="text-blue-600 hover:underline font-medium">
                          {formatUSPhone(property.phone)}
                        </a>
                      </div>
                    </div>
                    {property.website && (
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 mr-3 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Website</p>
                          <a href={property.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                            {property.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="location" className="space-y-4">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Location Details</h4>
                
                <div className="bg-muted dark:bg-card p-4 rounded-lg">
                  <div className="space-y-2">
                    <p><strong>Address:</strong> {property.addressLine1}</p>
                    {property.addressLine2 && <p><strong>Address Line 2:</strong> {property.addressLine2}</p>}
                    <p><strong>City:</strong> {property.city}</p>
                    {property.state && <p><strong>State:</strong> {property.state}</p>}
                    {property.zipcode && <p><strong>ZIP Code:</strong> {property.zipcode}</p>}
                  </div>
                </div>

                {(property.latitude && property.longitude) && (
                  <div>
                    <h5 className="font-medium mb-2">Coordinates</h5>
                    <p className="text-sm text-gray-600">
                      Latitude: {property.latitude}, Longitude: {property.longitude}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="amenities" className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-4">Property Amenities</h4>
                {property.amenities && property.amenities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {property.amenities.map((amenityKey, index) => {
                      // Map amenity keys to readable labels
                      const amenityLabels: Record<string, string> = {
                        parking: "Parking",
                        gym: "Gym/Fitness Center",
                        pool: "Swimming Pool",
                        laundry: "Laundry Facilities",
                        elevator: "Elevator",
                        balcony: "Balcony/Terrace",
                        air_conditioning: "Air Conditioning",
                        heating: "Heating",
                        dishwasher: "Dishwasher",
                        microwave: "Microwave",
                        refrigerator: "Refrigerator",
                        washer_dryer: "Washer/Dryer",
                        internet: "Internet/WiFi",
                        cable_tv: "Cable TV",
                        security: "Security System",
                        doorman: "Doorman/Concierge",
                        pet_friendly: "Pet Friendly",
                        garden: "Garden/Yard",
                        fireplace: "Fireplace",
                        storage: "Storage Space",
                      };
                      
                      return (
                        <div key={index} className="flex items-center p-3 bg-muted dark:bg-card rounded-lg">
                          <Check className="h-4 w-4 mr-3 text-green-500" />
                          <span>{amenityLabels[amenityKey] || amenityKey}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No amenities listed for this property</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="contact" className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold mb-4">Property Manager Contact</h4>
                {property.manager ? (
                  <div className="bg-muted dark:bg-card p-6 rounded-lg">
                    <div className="space-y-4">
                      {/* Manager Name */}
                      <div className="flex items-center">
                        <UserCheck className="h-5 w-5 mr-3 text-blue-500" />
                        <div>
                          <p className="font-medium text-lg">
                            {property.manager.firstName} {property.manager.lastName}
                          </p>
                          <p className="text-sm text-gray-600">Property Manager</p>
                        </div>
                      </div>
                      {/* Manager Email */}
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-gray-500" />
                        <div>
                          <p className="font-medium">Email</p>
                          <a 
                            href={`mailto:${property.manager.email}`}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {property.manager.email}
                          </a>
                        </div>
                      </div>
                      {/* Manager Phone */}
                      {property.manager.phone && (
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 mr-3 text-gray-500" />
                          <div>
                            <p className="font-medium">Phone</p>
                            <a 
                              href={`tel:${property.manager.phone}`}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {property.manager.phone}
                            </a>
                          </div>
                        </div>
                      )}                    
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No manager contact information available</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
