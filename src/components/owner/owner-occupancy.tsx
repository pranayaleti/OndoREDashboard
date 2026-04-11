import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Users, Home, Loader2, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { propertyApi, type Property } from "@/lib/api"

// Extended property interface for dashboard stats
interface DashboardProperty extends Property {
  units?: number;
  occupied?: number;
}

export default function OwnerOccupancy() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [properties, setProperties] = useState<DashboardProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [portfolioStats, setPortfolioStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0,
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const res = await propertyApi.getProperties()
      const data = res.properties
      // Filter for owner's properties (all statuses - pending, approved, rejected)
      const ownerProperties = data.filter((property: Property) => 
        property.ownerId === user.id
      )
      
      // Transform properties for dashboard display
      const dashboardProperties: DashboardProperty[] = ownerProperties.map(property => {
        // Each property counts as 1 unit
        const units = 1
        // Occupied if it has a tenant
        const occupied = property.tenantId ? 1 : 0
        
        return {
          ...property,
          units,
          occupied,
        }
      })
      
      const stats = dashboardProperties.reduce((acc, property) => {
        acc.totalProperties += 1;
        acc.totalUnits += property.units ?? 0;
        acc.occupiedUnits += property.occupied ?? 0;
        return acc;
      }, {
        totalProperties: 0,
        totalUnits: 0,
        occupiedUnits: 0,
        occupancyRate: 0,
      });
      
      // Calculate occupancy rate based on actual occupancy
      stats.occupancyRate = stats.totalProperties > 0 ? (stats.occupiedUnits / stats.totalProperties) * 100 : 0
      
      setProperties(dashboardProperties)
      setPortfolioStats(stats)
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProperty = (property: Property) => {
    // Navigate to PDP instead of modal
    navigate(`/owner/properties/${property.id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading occupancy data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Occupancy", icon: Users }]} />
      </div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Property Occupancy</h1>
          <p className="text-gray-600 dark:text-gray-400">Current occupancy status across your portfolio</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm relative overflow-hidden bg-gradient-to-br from-card via-card to-card">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Home className="w-48 h-48 text-white transform rotate-12" />
        </div>
        <CardContent className="pt-8 pb-8 relative z-10">
          {/* Overall Occupancy Bar */}
          <div className="space-y-4 max-w-3xl">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-sm font-medium text-slate-300 uppercase tracking-wider">Overall Occupancy</span>
                <div className="text-sm text-slate-400 mt-1">
                  {portfolioStats.occupiedUnits} of {portfolioStats.totalProperties} units occupied
                </div>
              </div>
              <span className="text-4xl font-bold text-white leading-none">{Math.round(portfolioStats.occupancyRate)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-400 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${portfolioStats.occupancyRate}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Home className="w-5 h-5 text-slate-500" />
          All Properties
        </h2>

        {/* Individual Properties */}
        {properties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Home className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg text-gray-500 font-medium">No properties found</p>
              <p className="text-sm text-gray-400">You don't have any properties in your portfolio yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((property) => {
              const isOccupied = Boolean(property.tenantId)
              const propertyName = property.addressLine1 || `${property.type} — ${property.id.slice(-4)}`
              const propertyType = property.type
                ? property.type.charAt(0).toUpperCase() + property.type.slice(1).replace(/_/g, " ")
                : "Property"
              const rent = property.price
                ? `$${property.price.toLocaleString()}/mo`
                : null
              return (
                <button
                  key={property.id}
                  onClick={() => handleViewProperty(property)}
                  className="w-full text-left group flex items-center justify-between p-4 bg-card dark:bg-card border border-slate-200 dark:border-slate-800 rounded-xl hover:border-orange-500/60 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  aria-label={`View details for ${propertyName}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-3 rounded-xl flex-shrink-0 transition-colors duration-200 ${
                      isOccupied
                        ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                        : "bg-orange-50 text-orange-500 dark:bg-orange-500/10"
                    }`}>
                      <Home className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-orange-500 transition-colors">{propertyName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {propertyType}{rent ? ` · ${rent}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <Badge
                      variant={isOccupied ? "default" : "secondary"}
                      className={isOccupied 
                        ? "bg-green-500 hover:bg-green-600 text-white border-transparent" 
                        : "bg-muted dark:bg-card text-slate-600 dark:text-slate-300 border-transparent"}
                    >
                      {isOccupied ? "Occupied" : "Vacant"}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
