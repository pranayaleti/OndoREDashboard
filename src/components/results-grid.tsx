import { useState, useEffect } from "react"
// Image component removed - using standard img tags
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PropertyDetailsModal } from "@/components/property-details-modal"

interface Property {
  id: number
  title: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  type: string
  image: string
  description: string
  features: string[]
}

interface ResultsGridProps {
  properties: Property[]
}

// Add this constant at the top, after the imports
const ZIP_CODE_CACHE_KEY = "property-management-zipcode"

// Mock data for property management companies
const mockCompanies = [
  {
    id: 1,
    name: "Elite Property Management",
    logo: `${import.meta.env.BASE_URL}placeholder.svg?height=80&width=80`,
    rating: 4.8,
    reviewCount: 124,
    address: "123 Main St, Salt Lake City, UT",
    phone: "(801) 555-1234",
    specialties: ["single-family", "multi-family"],
    description:
      "Full-service property management company with over 15 years of experience in the Salt Lake City area.",
    valueRanges: ["300k-500k", "500k-750k", "750k-1m"],
    images: [
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
    ],
    leaseTerms:
      "12-month minimum lease term with option to renew. $50 application fee per adult. Security deposit equal to one month's rent.",
    services: [
      "Tenant screening",
      "Rent collection",
      "Property maintenance",
      "24/7 emergency support",
      "Online owner portal",
    ],
    fees: "Management fee: 8% of monthly rent. Leasing fee: 50% of first month's rent.",
    availability: "Immediate",
    website: "www.elitepropertymanagement.com",
  },
  {
    id: 2,
    name: "Premier Property Solutions",
    logo: `${import.meta.env.BASE_URL}placeholder.svg?height=80&width=80`,
    rating: 4.6,
    reviewCount: 98,
    address: "456 State St, Salt Lake City, UT",
    phone: "(801) 555-5678",
    specialties: ["single-family", "vacation"],
    description: "Specializing in residential and vacation rental management with personalized service.",
    valueRanges: ["under-300k", "300k-500k"],
    images: [
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
    ],
    leaseTerms:
      "6 or 12-month lease terms available. $35 application fee. Security deposit varies based on property value.",
    services: [
      "Professional photography",
      "Marketing",
      "Tenant screening",
      "Maintenance coordination",
      "Monthly financial reporting",
    ],
    fees: "Management fee: 7% of monthly rent. Leasing fee: One month's rent.",
    availability: "30-day notice",
    website: "www.premierpropertysolutions.com",
  },
  {
    id: 3,
    name: "Commercial Property Experts",
    logo: `${import.meta.env.BASE_URL}placeholder.svg?height=80&width=80`,
    rating: 4.9,
    reviewCount: 76,
    address: "789 Business Blvd, Salt Lake City, UT",
    phone: "(801) 555-9012",
    specialties: ["commercial", "association"],
    description: "Focused on commercial property management and HOA management services.",
    valueRanges: ["750k-1m", "over-1m"],
    images: [
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
    ],
    leaseTerms:
      "3-5 year commercial leases with annual increases. $100 application fee. Security deposit equal to two months' rent.",
    services: [
      "Lease negotiation",
      "Tenant improvements",
      "Building maintenance",
      "Financial reporting",
      "Property inspections",
    ],
    fees: "Management fee: 5-6% of gross income. Leasing fee: 4-6% of total lease value.",
    availability: "60-day notice",
    website: "www.commercialpropertyexperts.com",
  },
  {
    id: 4,
    name: "Residential Management Group",
    logo: `${import.meta.env.BASE_URL}placeholder.svg?height=80&width=80`,
    rating: 4.7,
    reviewCount: 112,
    address: "321 Housing Lane, Salt Lake City, UT",
    phone: "(801) 555-3456",
    specialties: ["single-family", "multi-family"],
    description: "Dedicated to providing exceptional management services for residential properties.",
    valueRanges: ["under-300k", "300k-500k", "500k-750k"],
    images: [
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
    ],
    leaseTerms:
      "12-month standard lease. $45 application fee per adult. Security deposit equal to one month's rent plus $500.",
    services: [
      "Tenant placement",
      "Rent collection",
      "Maintenance coordination",
      "Eviction protection",
      "Regular inspections",
    ],
    fees: "Management fee: 8% of monthly rent. Leasing fee: 75% of first month's rent.",
    availability: "Immediate",
    website: "www.residentialmanagementgroup.com",
  },
  {
    id: 5,
    name: "Luxury Property Services",
    logo: `${import.meta.env.BASE_URL}placeholder.svg?height=80&width=80`,
    rating: 4.9,
    reviewCount: 64,
    address: "555 Luxury Ave, Salt Lake City, UT",
    phone: "(801) 555-7890",
    specialties: ["vacation", "single-family"],
    description: "Specializing in high-end properties and vacation rentals with concierge-level service.",
    valueRanges: ["750k-1m", "over-1m"],
    images: [
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
    ],
    leaseTerms:
      "12-month minimum for residential, flexible terms for vacation rentals. $75 application fee. Security deposit varies by property.",
    services: [
      "Concierge services",
      "Professional staging",
      "Premium marketing",
      "Background checks",
      "Property enhancement recommendations",
    ],
    fees: "Management fee: 10% of monthly rent. Leasing fee: One month's rent.",
    availability: "By appointment",
    website: "www.luxurypropertyservices.com",
  },
  {
    id: 6,
    name: "Mountain View Management",
    logo: `${import.meta.env.BASE_URL}placeholder.svg?height=80&width=80`,
    rating: 4.5,
    reviewCount: 87,
    address: "888 Mountain Rd, Salt Lake City, UT",
    phone: "(801) 555-2345",
    specialties: ["single-family", "multi-family", "vacation"],
    description: "Local experts in Utah property management with a focus on customer satisfaction.",
    valueRanges: ["300k-500k", "500k-750k"],
    images: [
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
      `${import.meta.env.BASE_URL}placeholder.svg?height=600&width=800`,
    ],
    leaseTerms: "6 or 12-month lease terms. $40 application fee. Security deposit equal to one month's rent.",
    services: ["Tenant screening", "Rent collection", "Maintenance", "Accounting", "Eviction handling"],
    fees: "Management fee: 7.5% of monthly rent. Leasing fee: 50% of first month's rent.",
    availability: "30-day notice",
    website: "www.mountainviewmanagement.com",
  },
]

export default function ResultsGrid({ properties }: ResultsGridProps) {
  // State to track which property details modal is open
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null)

  // Add this useEffect inside the ResultsGrid component, before the return statement
  useEffect(() => {
    // If we're viewing search results, we want to make sure the zip code is cached
    // This handles the case where someone navigates directly to the search page
    const urlParams = new URLSearchParams(window.location.search)
    const zipFromUrl = urlParams.get("zip")

    if (zipFromUrl && zipFromUrl.length === 5 && /^\d+$/.test(zipFromUrl)) {
      localStorage.setItem(ZIP_CODE_CACHE_KEY, zipFromUrl)
    }
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.length > 0 ? (
        properties.map((property) => (
          <Card 
            key={property.id} 
            className="overflow-hidden cursor-pointer hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/50 transition-all"
            onClick={() => setSelectedCompany(property.id)}
          >
            <div className="relative h-48 w-full">
              <img
                src={property.image || `${import.meta.env.BASE_URL}placeholder.svg?height=300&width=400`}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/70 to-transparent p-4">
                <h3 className="font-bold text-lg text-white">{property.title}</h3>
                <p className="text-white/90 text-sm">{property.address}</p>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold dark:text-gray-100">${property.price}/mo</span>
                <div className="flex space-x-2">
                  <Badge variant="outline">
                    {property.bedrooms} {property.bedrooms === 0 ? "Studio" : property.bedrooms === 1 ? "Bed" : "Beds"}
                  </Badge>
                  <Badge variant="outline">
                    {property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}
                  </Badge>
                </div>
              </div>

              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{property.description}</p>

              <div className="flex flex-wrap gap-2 mb-2">
                {property.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {property.features.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{property.features.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>

            <CardFooter className="bg-muted dark:bg-card px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <Button className="w-full" onClick={() => setSelectedCompany(property.id)}>
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No properties found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your search criteria to see more results.</p>
        </div>
      )}

      {/* Property Details Modal */}
      {selectedCompany && (
        <PropertyDetailsModal
          company={mockCompanies.find((c) => c.id === selectedCompany)!}
          open={selectedCompany !== null}
          onOpenChange={() => setSelectedCompany(null)}
        />
      )}
    </div>
  )
}
