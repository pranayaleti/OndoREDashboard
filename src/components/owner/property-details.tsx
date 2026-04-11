"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Building,
  Calendar,
  DollarSign,
  Edit,
  HomeIcon,
  MapPin,
  Trash2,
  Users,
  Wrench,
  FileText,
  BarChart,
  User,
} from "lucide-react"
import { Link } from "react-router-dom"
// import Image from "next/image" // Replaced with img tag
import { PropertyOverview } from "@/components/owner/property-overview"
import { PropertyUnits } from "@/components/owner/property-units"
import { PropertyFinancials } from "@/components/owner/property-financials"
import { PropertyMaintenance } from "@/components/owner/property-maintenance"
import { PropertyDocuments } from "@/components/owner/property-documents"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface PropertyDetailsProps {
  property: any
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case "single-family":
        return <HomeIcon className="h-4 w-4" />
      case "multi-family":
        return <Users className="h-4 w-4" />
      default:
        return <Building className="h-4 w-4" />
    }
  }

  const handleDeleteProperty = () => {
    // In a real app, this would call an API to delete the property
    toast({
      title: "Property deleted",
      description: "The property has been successfully deleted.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{property.name}</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span>
              {property.address}, {property.city}, {property.state} {property.zipCode}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to={`/owner/properties/${property.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Property
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Property
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the property and all associated data
                  including tenant information, financial records, and maintenance history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProperty}>Delete Property</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <div className="relative h-64 w-full">
            <img
              src={property.image || `${import.meta.env.BASE_URL}placeholder.svg`}
              alt={property.name}
              className="w-full h-full object-cover rounded-t-lg"
            />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="capitalize flex items-center gap-1">
                {getPropertyTypeIcon(property.type)}
                {property.type.replace("-", " ")}
              </Badge>
              <Badge
                variant="outline"
                className={
                  property.status === "active"
                    ? "bg-green-500/10 dark:bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30"
                    : "bg-yellow-500/10 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30"
                }
              >
                {property.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>

            <p className="text-muted-foreground">{property.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Occupancy</div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{property.occupancy}</span>
                <span>{property.occupancyRate}%</span>
              </div>
              <Progress value={property.occupancyRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Monthly Income</div>
                <div className="font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {property.monthlyIncome.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Units</div>
                <div className="font-medium">
                  {property.units.length} {property.units.length > 1 ? "units" : "unit"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Year Built</div>
                <div className="font-medium">{property.yearBuilt}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Square Feet</div>
                <div className="font-medium">{property.squareFeet.toLocaleString()}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Next Lease Expiration</div>
              <div className="font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {property.leaseEnd ? new Date(property.leaseEnd).toLocaleDateString() : "N/A"}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link to={`/owner/properties/${property.id}/tenants`}>
                <User className="h-4 w-4 mr-2" />
                Manage Tenants
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Building className="h-4 w-4" />
            <span className="hidden md:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="flex items-center gap-1">
            <HomeIcon className="h-4 w-4" />
            <span className="hidden md:inline">Units</span>
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex items-center gap-1">
            <BarChart className="h-4 w-4" />
            <span className="hidden md:inline">Financials</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1">
            <Wrench className="h-4 w-4" />
            <span className="hidden md:inline">Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Documents</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PropertyOverview property={property} />
        </TabsContent>

        <TabsContent value="units">
          <PropertyUnits />
        </TabsContent>

        <TabsContent value="financials">
          <PropertyFinancials property={property} />
        </TabsContent>

        <TabsContent value="maintenance">
          <PropertyMaintenance property={property} />
        </TabsContent>

        <TabsContent value="documents">
          <PropertyDocuments />
        </TabsContent>
      </Tabs>
    </div>
  )
}
