import type React from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MapPin, DollarSign, Calendar, MoreHorizontal } from "lucide-react"
import { formatUSDate, formatUSD } from "@/lib/us-format"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link, useNavigate } from "react-router-dom"
// import Image from "next/image" // Replaced with img tag

interface PropertyCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  property: any
  getPropertyTypeIcon: (type: string) => React.ReactNode
}

export function PropertyCard({ property, getPropertyTypeIcon }: PropertyCardProps) {
  const navigate = useNavigate()
  
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/50 transition-all"
      onClick={() => navigate(`/owner/properties/${property.id}`)}
    >
      <div className="relative h-48">
        <img src={property.image || `${import.meta.env.BASE_URL}placeholder.svg`} alt={property.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to={`/owner/properties/${property.id}`}>View details</Link>
              </DropdownMenuItem>
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
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg">{property.name}</h3>
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span>
                {property.city}, {property.state}
              </span>
            </div>
          </div>
          <Badge className="capitalize flex items-center gap-1">
            {getPropertyTypeIcon(property.type)}
            {property.type.replace("-", " ")}
          </Badge>
        </div>

        <div className="space-y-4 mt-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Occupancy</span>
              <span>{property.occupancyRate}%</span>
            </div>
            <Progress value={property.occupancyRate} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Monthly Income</div>
              <div className="font-medium flex items-center">
                <DollarSign className="h-3.5 w-3.5 mr-1" />
                {formatUSD(property.monthlyIncome)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Units</div>
              <div className="font-medium">
                {property.units} {property.units > 1 ? "units" : "unit"}
              </div>
            </div>
            {property.leaseEnd && (
              <div className="col-span-2">
                <div className="text-muted-foreground">Lease Ends</div>
                <div className="font-medium flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {formatUSDate(property.leaseEnd)}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" asChild>
          <Link to={`/owner/properties/${property.id}`}>View Details</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/owner/properties/${property.id}/tenants`}>Manage</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
