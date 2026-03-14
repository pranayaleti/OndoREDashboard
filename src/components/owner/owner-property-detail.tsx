import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Check,
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
import { propertyApi, type Property } from "@/lib/api"
import { formatUSDate, formatUSD, formatUSPhone } from "@/lib/us-format"
import { PropertyRentScheduleSection } from "@/components/shared/property-rent-schedule-section"

export default function OwnerPropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (id) {
      loadProperty(id)
    }
  }, [id])

  const loadProperty = async (propertyId: string) => {
    try {
      setLoading(true)
      const res = await propertyApi.getProperty(propertyId)
      setProperty(res.property)
      setError(null)
    } catch (err) {
      console.error("Failed to load property:", err)
      setError("Failed to load property details")
    } finally {
      setLoading(false)
    }
  }

  const nextImage = () => {
    if (property?.photos && property.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.photos!.length)
    }
  }

  const prevImage = () => {
    if (property?.photos && property.photos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.photos!.length) % property.photos!.length)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Breadcrumb items={[
          { label: "Properties", href: "/owner/properties", icon: Building },
          { label: "Loading..." }
        ]} />
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: "Properties", href: "/owner/properties", icon: Building },
          { label: "Error" }
        ]} />
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Building className="h-16 w-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Property Not Found</h2>
          <p className="text-slate-500 mb-6">{error || "The property you're looking for doesn't exist or you don't have access to it."}</p>
          <Button onClick={() => navigate("/owner/properties")}>Back to Properties</Button>
        </div>
      </div>
    )
  }

  const hasImages = property.photos && property.photos.length > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Properties", href: "/owner/properties", icon: Building },
          { label: property.title || property.addressLine1 }
        ]} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
          <Building className="h-8 w-8 text-orange-500" />
          {property.title || property.addressLine1}
        </h1>
        <div className="flex items-center gap-3">
          <Badge variant={
            property.status === "approved" ? "default" : 
            property.status === "rejected" ? "destructive" : 
            "secondary"
          } className="text-sm px-3 py-1">
            {property.status ? property.status.charAt(0).toUpperCase() + property.status.slice(1) : "Unknown"}
          </Badge>
          <Button variant="outline" onClick={() => navigate("/owner/properties")}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      {/* Image Slider */}
      {hasImages ? (
        <div className="relative h-[300px] md:h-[500px] mb-8 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border shadow-sm">
          <img
            src={property.photos?.[currentImageIndex]?.url || `${import.meta.env.BASE_URL}placeholder.svg`}
            alt={`${property.title || 'Property'} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Navigation Arrows */}
          {property.photos && property.photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 rounded-full h-12 w-12 border border-white/20 backdrop-blur-sm transition-all"
                onClick={prevImage}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/40 text-white hover:bg-black/60 rounded-full h-12 w-12 border border-white/20 backdrop-blur-sm transition-all"
                onClick={nextImage}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
              {/* Image Counter */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                {currentImageIndex + 1} / {property.photos?.length || 0}
              </div>
            </>
          )}
          {/* Caption */}
          {property.photos?.[currentImageIndex]?.caption && (
            <div className="absolute bottom-4 left-4 right-4 md:right-auto bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm max-w-xl border border-white/10 shadow-lg">
              {property.photos?.[currentImageIndex]?.caption}
            </div>
          )}
        </div>
      ) : (
        <div className="h-[300px] md:h-[400px] mb-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <Building className="h-20 w-20 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No images available</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-8 bg-slate-100/50 dark:bg-slate-800/50 p-1">
          <TabsTrigger value="details">Property Details</TabsTrigger>
          <TabsTrigger value="rent-schedule">Rent schedule</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="amenities">Amenities</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>
        <TabsContent value="rent-schedule" className="space-y-6">
          {property?.id ? (
            <PropertyRentScheduleSection propertyId={property.id} />
          ) : (
            <p className="text-sm text-muted-foreground">Select a property to view rent schedule.</p>
          )}
        </TabsContent>
        <TabsContent value="details" className="space-y-6">
          {/* Property Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Basic Info Card */}
            <div className="bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-800/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-4 flex items-center text-lg">
                <Home className="h-5 w-5 mr-2 text-blue-500" />
                Basic Information
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-blue-500/10">
                  <span className="text-slate-600 dark:text-slate-400">Type:</span>
                  <span className="font-medium text-slate-900 dark:text-white capitalize bg-blue-500/10 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">{property.type}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-blue-500/10">
                  <span className="text-slate-600 dark:text-slate-400">Submitted:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{property.createdAt ? formatUSDate(property.createdAt) : 'N/A'}</span>
                </div>
                {property.owner && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Owner:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{property.owner.firstName} {property.owner.lastName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Specs Card */}
            <div className="bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-900/10 dark:to-green-800/10 p-5 rounded-xl border border-green-100 dark:border-green-900/30 shadow-sm">
              <h4 className="font-semibold text-green-900 dark:text-green-200 mb-4 flex items-center text-lg">
                <Building className="h-5 w-5 mr-2 text-green-500" />
                Property Specs
              </h4>
              <div className="space-y-3 text-sm">
                {property.price && (
                  <div className="flex justify-between items-center pb-2 border-b border-green-500/10">
                    <span className="text-slate-600 dark:text-slate-400">Price:</span>
                    <span className="font-bold text-green-700 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                      {formatUSD(property.price)} / month
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-3 pt-1">
                  <div className="flex justify-between w-full">
                    {property.bedrooms !== undefined && (
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Beds</span>
                        <span className="font-semibold text-lg text-slate-900 dark:text-white">{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms !== undefined && (
                      <div className="flex flex-col items-center flex-1 border-l border-green-500/20">
                        <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Baths</span>
                        <span className="font-semibold text-lg text-slate-900 dark:text-white">{property.bathrooms}</span>
                      </div>
                    )}
                    {property.sqft !== undefined && (
                      <div className="flex flex-col items-center flex-1 border-l border-green-500/20">
                        <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Sq Ft</span>
                        <span className="font-semibold text-lg text-slate-900 dark:text-white">{property.sqft.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rating & Media Card */}
            <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-900/10 dark:to-purple-800/10 p-5 rounded-xl border border-purple-100 dark:border-purple-900/30 shadow-sm">
              <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-4 flex items-center text-lg">
                <Star className="h-5 w-5 mr-2 text-purple-500" />
                Rating & Media
              </h4>
              <div className="space-y-3 text-sm">
                {property.rating !== undefined && (
                  <div className="flex justify-between items-center pb-2 border-b border-purple-500/10">
                    <span className="text-slate-600 dark:text-slate-400">Rating:</span>
                    <div className="flex items-center bg-yellow-500/10 px-2 py-0.5 rounded text-yellow-700 dark:text-yellow-400 font-medium">
                      <Star className="h-3.5 w-3.5 mr-1 fill-current" />
                      <span>{property.rating}/5</span>
                    </div>
                  </div>
                )}
                {property.reviewCount !== undefined && (
                  <div className="flex justify-between items-center pb-2 border-b border-purple-500/10">
                    <span className="text-slate-600 dark:text-slate-400">Reviews:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{property.reviewCount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Photos:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{property.photos?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          {property.description && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-slate-400" />
                Description
              </h4>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}
          
          {/* Property Categories */}
          {((property.specialties?.length ?? 0) > 0 || (property.services?.length ?? 0) > 0 || (property.valueRanges?.length ?? 0) > 0) && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm">
              <h4 className="text-lg font-semibold mb-5 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-slate-400" />
                Property Categories
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {property.specialties && property.specialties.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 flex items-center text-blue-600 dark:text-blue-400">
                      <Tag className="h-4 w-4 mr-2" />
                      Specialties
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {property.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="capitalize bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {property.services && property.services.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 flex items-center text-emerald-600 dark:text-emerald-400">
                      <Building className="h-4 w-4 mr-2" />
                      Services
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {property.services.map((service, index) => (
                        <Badge key={index} variant="outline" className="capitalize text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {property.valueRanges && property.valueRanges.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 flex items-center text-purple-600 dark:text-purple-400">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Value Ranges
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {property.valueRanges.map((range, index) => (
                        <Badge key={index} variant="default" className="capitalize bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300">
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
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm">
              <h4 className="text-lg font-semibold mb-5 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-slate-400" />
                Lease Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {property.availability && (
                  <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900/20">
                    <h5 className="font-medium mb-2 flex items-center text-orange-600 dark:text-orange-400">
                      <Clock className="h-4 w-4 mr-2" />
                      Availability
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{property.availability}</p>
                  </div>
                )}

                {property.leaseTerms && (
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/20">
                    <h5 className="font-medium mb-2 flex items-center text-blue-600 dark:text-blue-400">
                      <FileText className="h-4 w-4 mr-2" />
                      Lease Terms
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{property.leaseTerms}</p>
                  </div>
                )}

                {property.fees && (
                  <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                    <h5 className="font-medium mb-2 flex items-center text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Management Fees
                    </h5>
                    <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{property.fees}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="location" className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm space-y-6">
            <h4 className="text-lg font-semibold flex items-center border-b pb-4">
              <Building className="h-5 w-5 mr-3 text-slate-400" />
              Location Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-1/3 text-slate-500 font-medium">Address</div>
                  <div className="w-2/3 text-slate-900 dark:text-slate-100">{property.addressLine1}</div>
                </div>
                {property.addressLine2 && (
                  <div className="flex gap-4">
                    <div className="w-1/3 text-slate-500 font-medium">Address 2</div>
                    <div className="w-2/3 text-slate-900 dark:text-slate-100">{property.addressLine2}</div>
                  </div>
                )}
                <div className="flex gap-4">
                  <div className="w-1/3 text-slate-500 font-medium">City</div>
                  <div className="w-2/3 text-slate-900 dark:text-slate-100">{property.city}</div>
                </div>
                {property.state && (
                  <div className="flex gap-4">
                    <div className="w-1/3 text-slate-500 font-medium">State</div>
                    <div className="w-2/3 text-slate-900 dark:text-slate-100">{property.state}</div>
                  </div>
                )}
                {property.zipcode && (
                  <div className="flex gap-4">
                    <div className="w-1/3 text-slate-500 font-medium">ZIP Code</div>
                    <div className="w-2/3 text-slate-900 dark:text-slate-100">{property.zipcode}</div>
                  </div>
                )}
              </div>

              {(property.latitude && property.longitude) && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700">
                  <Globe className="h-10 w-10 text-slate-300 mb-3" />
                  <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-1">Coordinates</h5>
                  <p className="text-primary font-mono bg-white dark:bg-slate-900 px-3 py-1.5 rounded shadow-sm text-sm">
                    {property.latitude}, {property.longitude}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="amenities" className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm">
            <h4 className="text-lg font-semibold mb-6 flex items-center border-b pb-4">
              <Check className="h-5 w-5 mr-3 text-emerald-500" />
              Property Amenities
            </h4>
            {property.amenities && property.amenities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {property.amenities.map((amenityKey, index) => {
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
                    <div key={index} className="flex items-center p-3 sm:p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-100 dark:border-slate-700">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{amenityLabels[amenityKey] || amenityKey}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Check className="h-12 w-12 mb-4 opacity-20" />
                <p>No amenities listed for this property.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm">
            <h4 className="text-lg font-semibold mb-6 flex items-center border-b pb-4">
              <Phone className="h-5 w-5 mr-3 text-blue-500" />
              Contact Information
            </h4>
            
            {/* Owner/Manager Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {property.manager ? (
                <div className="bg-blue-50/50 dark:bg-slate-800 p-5 rounded-lg border border-blue-100 dark:border-slate-700">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                        <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-slate-900 dark:text-white">
                          {property.manager.firstName} {property.manager.lastName}
                        </p>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Property Manager</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-blue-100 dark:border-slate-700 space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-semibold">Email</p>
                          <a 
                            href={`mailto:${property.manager.email}`}
                            className="text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {property.manager.email}
                          </a>
                        </div>
                      </div>
                      
                      {property.manager.phone && (
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 mr-3 text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Phone</p>
                            <a 
                              href={`tel:${property.manager.phone}`}
                              className="text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              {property.manager.phone}
                            </a>
                          </div>
                        </div>
                      )}                    
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                  <UserCheck className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No designated property manager information available</p>
                </div>
              )}

              {/* General Property Contact */}
              {(property.phone || property.website) && (
                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-lg border border-slate-100 dark:border-slate-700">
                  <h5 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Direct Contact</h5>
                  <div className="space-y-4">
                    {property.phone && (
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-3">
                          <Phone className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-semibold">Main Phone</p>
                          <a href={`tel:${property.phone}`} className="text-slate-900 dark:text-white hover:text-blue-600 font-medium">
                            {formatUSPhone(property.phone)}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {property.website && (
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-3">
                          <Globe className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase font-semibold">Website</p>
                          <a href={property.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium truncate max-w-[200px] inline-block">
                            {property.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
