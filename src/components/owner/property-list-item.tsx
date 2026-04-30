import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MapPin, DollarSign, Calendar, MoreHorizontal, ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link } from "react-router-dom"
// import Image from "next/image" // Replaced with img tag

interface PropertyListItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  property: any
  getPropertyTypeIcon: (type: string) => React.ReactNode
}

export function PropertyListItem({ property, getPropertyTypeIcon }: PropertyListItemProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-48 h-32">
            <img src={property.image || `${import.meta.env.BASE_URL}placeholder.svg`} alt={property.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg">{property.name}</h3>
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>
                    {property.address}, {property.city}, {property.state} {property.zipCode}
                  </span>
                </div>
              </div>
              <Badge className="capitalize flex items-center gap-1 w-fit">
                {getPropertyTypeIcon(property.type)}
                {property.type.replace("-", " ")}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <div className="text-muted-foreground text-sm">Occupancy</div>
                <div className="mt-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{property.occupancy}</span>
                    <span>{property.occupancyRate}%</span>
                  </div>
                  <Progress value={property.occupancyRate} className="h-2" />
                </div>
              </div>

              <div>
                <div className="text-muted-foreground text-sm">Monthly Income</div>
                <div className="font-medium flex items-center mt-1">
                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                  {property.monthlyIncome.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground text-sm">Units</div>
                <div className="font-medium mt-1">
                  {property.units} {property.units > 1 ? "units" : "unit"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground text-sm">Lease Ends</div>
                <div className="font-medium flex items-center mt-1">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {property.leaseEnd ? new Date(property.leaseEnd).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col justify-between items-center p-4 border-t sm:border-t-0 sm:border-l">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/owner/properties/${property.id}`}>
                <span className="mr-1">Details</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to={`/owner/properties/${property.id}/edit`}>Edit property</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/owner/properties/${property.id}/tenants`}>Manage tenants</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/owner/properties/${property.id}/finances`}>Financial details</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
