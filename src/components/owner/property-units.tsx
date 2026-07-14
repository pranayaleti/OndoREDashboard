import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, Home } from "lucide-react"
import { AddUnitDialog } from "./add-unit-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency } from "@/lib/locale-format"

/** Minimal property shape for unit display (real API Property or adapted mock). */
export interface PropertyUnitsProperty {
  id: string
  title: string
  type?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  sqft?: number | null
  price?: number | null
  tenantId?: string | null
  status?: string | null
  tenant?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  } | null
}

interface PropertyUnitsProps {
  property: PropertyUnitsProperty
}

function occupancyLabel(property: PropertyUnitsProperty): { label: string; className: string } {
  if (property.tenantId || property.tenant) {
    return {
      label: "Occupied",
      className: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200",
    }
  }
  if (property.status === "occupied") {
    return {
      label: "Occupied",
      className: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200",
    }
  }
  return {
    label: "Vacant",
    className: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-200",
  }
}

function formatBedsBaths(property: PropertyUnitsProperty): string {
  const beds = property.bedrooms
  const baths = property.bathrooms
  const bedLabel = beds == null ? "—" : beds === 0 ? "Studio" : `${beds} bed`
  const bathLabel = baths == null ? "—" : `${baths} bath`
  const sqft =
    property.sqft != null && property.sqft > 0
      ? ` • ${property.sqft.toLocaleString()} sq ft`
      : ""
  return `${bedLabel}, ${bathLabel}${sqft}`
}

function tenantDisplayName(tenant: NonNullable<PropertyUnitsProperty["tenant"]>): string {
  const name = [tenant.firstName, tenant.lastName].filter(Boolean).join(" ").trim()
  return name || tenant.email || "Tenant"
}

export function PropertyUnits({ property }: PropertyUnitsProps) {
  const occupancy = occupancyLabel(property)
  const tenant = property.tenant
  const tenantId = tenant?.id ?? property.tenantId ?? null
  const rentLabel =
    property.price != null && property.price > 0
      ? `${formatCurrency(property.price, "USD")}/month`
      : "Rent not set"

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Units & Tenants</CardTitle>
          <CardDescription>
            This property is managed as one unit. Add another property to track an additional
            dwelling.
          </CardDescription>
        </div>
        <AddUnitDialog />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="units" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
          </TabsList>
          <TabsContent value="units" className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h3 className="font-medium">{property.title || "Primary unit"}</h3>
                  <p className="text-sm text-muted-foreground">{formatBedsBaths(property)}</p>
                  {property.type ? (
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {property.type.replace(/-/g, " ")}
                    </p>
                  ) : null}
                </div>
                <Badge className={occupancy.className}>{occupancy.label}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <p className="text-sm font-medium">{rentLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {tenantId ? "Tenant assigned" : "Available — invite a tenant when ready"}
                  </p>
                </div>
                {tenantId ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/owner/tenants/${encodeURIComponent(tenantId)}`}>
                      <Users className="h-4 w-4 mr-2" />
                      View Tenant
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/owner/tenants">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Tenants
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="tenants" className="space-y-4">
            {tenant || tenantId ? (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-medium">
                      {tenant ? tenantDisplayName(tenant) : "Assigned tenant"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {property.title} • Primary tenant
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200">
                    Active
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    {tenant?.email ? <p className="text-sm">{tenant.email}</p> : null}
                    {tenant?.phone ? <p className="text-sm">{tenant.phone}</p> : null}
                    {!tenant?.email && !tenant?.phone ? (
                      <p className="text-sm text-muted-foreground">
                        Contact details will appear when the tenant profile loads.
                      </p>
                    ) : null}
                  </div>
                  {tenantId ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/owner/tenants/${encodeURIComponent(tenantId)}`}>
                        View Details
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Home className="h-12 w-12" />}
                title="No tenant assigned"
                description="This unit is vacant. Invite or assign a tenant from the Tenants page."
                ctaLabel="Go to Tenants"
                ctaHref="/owner/tenants"
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
