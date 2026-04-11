import { useState } from "react"
// Image component removed - using standard img tags
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Star,
  MapPin,
  Phone,
  Globe,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Clock,
  Wrench,
  Heart,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PropertyLeadForm } from "@/components/property-lead-form"

interface PropertyDetailsModalProps {
  company: {
    id: number
    name: string
    logo: string
    rating: number
    reviewCount: number
    address: string
    phone: string
    specialties: string[]
    description: string
    valueRanges: string[]
    images: string[]
    leaseTerms: string
    services: string[]
    fees: string
    availability: string
    website: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PropertyDetailsModal({ company, open, onOpenChange }: PropertyDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showLeadForm, setShowLeadForm] = useState(false)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % company.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + company.images.length) % company.images.length)
  }

  const handleInterested = () => {
    setShowLeadForm(true)
  }

  const handleFormClose = () => {
    setShowLeadForm(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 9000 }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{company.name}</DialogTitle>
            <DialogDescription>View detailed information about this property</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {/* Image Slider */}
            <div className="relative h-[300px] md:h-[400px] mb-6 rounded-lg overflow-hidden">
              <img
                src={company.images[currentImageIndex] || `${import.meta.env.BASE_URL}placeholder.svg`}
                alt={`${company.name} property image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Navigation Arrows */}
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
                {currentImageIndex + 1} / {company.images.length}
              </div>
            </div>

            {/* Company Info */}
            <div className="flex items-center mb-6">
              <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted mr-4">
                <img
                  src={company.logo || `${import.meta.env.BASE_URL}placeholder.svg`}
                  alt={`${company.name} logo`}
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <div>
                <h3 className="font-bold text-xl">{company.name}</h3>
                <div className="flex items-center">
                  <div className="flex items-center text-yellow-500 mr-2">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="ml-1 text-base font-medium">{company.rating}</span>
                  </div>
                  <span className="text-gray-500">({company.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="terms">Terms & Fees</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-2">About</h4>
                  <p className="text-gray-700 dark:text-gray-300">{company.description}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {company.specialties.map((specialty) => (
                      <Badge key={specialty} className="capitalize">
                        {specialty.replace("-", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">Property Value Ranges</h4>
                  <div className="flex flex-wrap gap-2">
                    {company.valueRanges.map((value) => (
                      <Badge key={value} variant="outline" className="capitalize">
                        {value === "under-300k"
                          ? "Under $300k"
                          : value === "300k-500k"
                            ? "$300k-$500k"
                            : value === "500k-750k"
                              ? "$500k-$750k"
                              : value === "750k-1m"
                                ? "$750k-$1M"
                                : "Over $1M"}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Services Offered</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {company.services.map((service, index) => (
                      <li key={index} className="flex items-center">
                        <Wrench className="h-4 w-4 mr-2 text-primary" />
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="terms" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-3 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-lg font-semibold">Lease Terms</h4>
                      <p className="text-gray-700 dark:text-gray-300">{company.leaseTerms}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 mr-3 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-lg font-semibold">Management Fees</h4>
                      <p className="text-gray-700 dark:text-gray-300">{company.fees}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-3 text-primary mt-0.5" />
                    <div>
                      <h4 className="text-lg font-semibold">Availability</h4>
                      <p className="text-gray-700 dark:text-gray-300">{company.availability}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-3 text-primary" />
                    <span>{company.address}</span>
                  </div>

                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3 text-primary" />
                    <span>{company.phone}</span>
                  </div>

                  <div className="flex items-center">
                    <Globe className="h-5 w-5 mr-3 text-primary" />
                    <a
                      href={`https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>

                  <div className="pt-4">
                    <Button className="w-full" onClick={handleInterested}>
                      <Heart className="h-4 w-4 mr-2" />
                      I'm Interested
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Form Dialog */}
      {showLeadForm && <PropertyLeadForm open={showLeadForm} onClose={handleFormClose} propertyName={company.name} />}
    </>
  )
}
