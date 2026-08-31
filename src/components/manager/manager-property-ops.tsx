import { useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Building, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { propertyApi, type Property } from "@/lib/api"
import { ApplicationsDashboard } from "@/components/owner/applications-dashboard"
import { RentalRequirementsEditor } from "@/components/rental/rental-requirements-editor"
import { RentalApplicationsInbox } from "@/components/rental/rental-applications-inbox"
import { LeaseManagement } from "@/components/owner/lease-management"
import { InspectionManager } from "@/components/owner/inspection-manager"
import { PropertyFloorPlans } from "@/components/owner/property-floor-plans"
import { isOpsTab, rewriteInvalidOpsTabSearch, tabFromSearch, type OpsTab } from "@/components/manager/ops-tabs"

export default function ManagerPropertyOps() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = tabFromSearch(searchParams)
  const [activeTab, setActiveTab] = useState<OpsTab>(urlTab)
  const highlightLeaseId = searchParams.get("leaseId") ?? undefined

  useEffect(() => {
    const rewritten = rewriteInvalidOpsTabSearch(searchParams)
    if (rewritten) {
      setSearchParams(rewritten, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    setActiveTab(urlTab)
  }, [urlTab])

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const res = await propertyApi.getProperty(id)
        if (!cancelled) {
          setProperty(res.property)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("You do not have access to this property, or it could not be loaded.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[
          { label: "Properties", href: "/dashboard/properties", icon: Building },
          { label: "Unavailable" },
        ]} />
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <Building className="h-16 w-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Property not available</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link to="/dashboard/properties">Back to properties</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Properties", href: "/dashboard/properties", icon: Building },
          { label: property.title || property.addressLine1 },
        ]} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building className="h-8 w-8 text-orange-500" />
          {property.title || property.addressLine1}
        </h1>
        <Button variant="outline" asChild>
          <Link to="/dashboard/properties">
            <ChevronLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (!isOpsTab(value)) return
          setActiveTab(value)
          const next = new URLSearchParams(searchParams)
          next.set("tab", value)
          if (value !== "leases") next.delete("leaseId")
          setSearchParams(next, { replace: true })
        }}
        className="w-full"
      >
        <TabsList className="flex flex-wrap mb-8 bg-muted/50 dark:bg-card/50 p-1 h-auto gap-1">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="leases">Leases</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="floor-plans">Floor plans</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="space-y-6">
          <RentalRequirementsEditor propertyId={property.id} />
          <RentalApplicationsInbox propertyId={property.id} />
          <ApplicationsDashboard propertyId={property.id} />
        </TabsContent>
        <TabsContent value="leases" className="space-y-6">
          <LeaseManagement propertyId={property.id} highlightLeaseId={highlightLeaseId} />
        </TabsContent>
        <TabsContent value="inspections" className="space-y-6">
          <InspectionManager
            propertyId={property.id}
            propertySnapshot={{
              title: property.title,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              sqft: property.sqft,
            }}
          />
        </TabsContent>
        <TabsContent value="floor-plans" className="space-y-6">
          <PropertyFloorPlans propertyId={property.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
