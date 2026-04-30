import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Home,
  Bath,
  BedDouble,
  Wifi,
  Droplets,
  Snowflake,
  ParkingMeterIcon as Parking,
  TreesIcon as Tree,
} from "lucide-react"

interface PropertyOverviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  property: any
}

export function PropertyOverview({ property }: PropertyOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
          <CardDescription>Basic information about the property</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Property Type</div>
              <div className="font-medium capitalize">{property.type.replace("-", " ")}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Year Built</div>
              <div className="font-medium">{property.yearBuilt}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Square Feet</div>
              <div className="font-medium">{property.squareFeet.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Units</div>
              <div className="font-medium">{property.units.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Bedrooms</div>
              <div className="font-medium">{property.bedrooms}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Bathrooms</div>
              <div className="font-medium">{property.bathrooms}</div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium mb-2">Amenities</div>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((amenity: string, index: number) => (
                <Badge key={index} variant="secondary" className="capitalize">
                  {getAmenityIcon(amenity)}
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Occupancy Status</CardTitle>
          <CardDescription>Current occupancy information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium">{property.occupancy}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Occupancy Rate</div>
              <div className="font-medium">{property.occupancyRate}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Tenants</div>
              <div className="font-medium">{property.tenants}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Next Lease Expiration</div>
              <div className="font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {property.leaseEnd ? new Date(property.leaseEnd).toLocaleDateString() : "N/A"}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium mb-2">Current Tenants</div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {property.units.map((unit: any) => (
              <div key={unit.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <div className="font-medium">{unit.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {unit.bedrooms} bed, {unit.bathrooms} bath
                  </div>
                </div>
                {unit.status === "occupied" ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Occupied</Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Vacant
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Property Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{property.description}</p>
        </CardContent>
      </Card>
    </div>
  )
}

function getAmenityIcon(amenity: string) {
  const amenityLower = amenity.toLowerCase()

  if (amenityLower.includes("washer") || amenityLower.includes("dryer")) {
    return <Droplets className="h-3.5 w-3.5 mr-1" />
  } else if (amenityLower.includes("air") || amenityLower.includes("ac") || amenityLower.includes("hvac")) {
    return <Snowflake className="h-3.5 w-3.5 mr-1" />
  } else if (amenityLower.includes("wifi") || amenityLower.includes("internet")) {
    return <Wifi className="h-3.5 w-3.5 mr-1" />
  } else if (amenityLower.includes("parking") || amenityLower.includes("garage")) {
    return <Parking className="h-3.5 w-3.5 mr-1" />
  } else if (amenityLower.includes("yard") || amenityLower.includes("garden") || amenityLower.includes("backyard")) {
    return <Tree className="h-3.5 w-3.5 mr-1" />
  } else if (amenityLower.includes("bed")) {
    return <BedDouble className="h-3.5 w-3.5 mr-1" />
  } else if (amenityLower.includes("bath")) {
    return <Bath className="h-3.5 w-3.5 mr-1" />
  } else {
    return <Home className="h-3.5 w-3.5 mr-1" />
  }
}
