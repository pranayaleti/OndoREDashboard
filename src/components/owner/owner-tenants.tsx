import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { 
  Users, 
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react"
import { propertyApi, type Tenant, type OwnerTenantsSummary } from "@/lib/api"
import { AddTenantDialog } from "@/components/owner/add-tenant-dialog"
import { formatDate } from "@/lib/locale-format"

export default function OwnerTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [summary, setSummary] = useState<OwnerTenantsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await propertyApi.getOwnerTenants()
      setTenants(response.tenants)
      setSummary(response.summary)
    } catch (err) {
      console.error("Error fetching tenants:", err)
      setError("Failed to load tenant data")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Tenants", icon: Users }]} />
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-bold">Tenants</h1>
        <p className="text-gray-600 dark:text-gray-400">View tenant information across your properties</p>
          </div>
        </div>
        <AddTenantDialog />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold">{summary?.totalTenants || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupied Units</p>
                <p className="text-2xl font-bold">{summary?.occupiedUnits || "0/0"}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
                <p className="text-2xl font-bold">{summary?.occupancyRate || "0%"}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rent</p>
                <p className="text-2xl font-bold">{summary?.avgRent || "$0"}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading tenant data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">{error}</div>
          <button 
            onClick={fetchTenants}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tenant List */}
      {!loading && !error && (
        <div>
          {tenants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Tenants Found</h3>
              <p className="text-gray-600 dark:text-gray-400">You don't have any tenants assigned to your properties yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((tenant) => (
                <Card key={tenant.id} className="bg-card border border-gray-700 hover:border-orange-500/80 transition-all">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {(tenant.name || tenant.email || "?")
                            .split(/\s+/)
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{tenant.name || tenant.email || "Tenant"}</div>
                        <div className="text-gray-400 text-sm">{tenant.property} - {tenant.unit}</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rent:</span>
                        <span className="text-white font-medium">
                          ${(Number(tenant.rent) || 0).toLocaleString()}/mo
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                      <Badge
                        className={
                          tenant.paymentStatus === "current"
                            ? "bg-green-600 text-white"
                            : tenant.paymentStatus === "overdue"
                              ? "bg-red-600 text-white"
                              : "bg-yellow-600 text-white"
                        }
                      >
                        {tenant.paymentStatus ?? "pending"}
                      </Badge>
                    </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Move-in:</span>
                        <span className="text-white">
                          {tenant.leaseStart
                            ? formatDate(tenant.leaseStart, { month: "short", year: "numeric" })
                            : "—"}
                        </span>
                    </div>
                  </div>

                    <Button
                      asChild
                      className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-800 hover:opacity-95 text-white shadow-md"
                    >
                      <Link to={`/owner/tenants/${tenant.id}`} state={{ tenant }}>
                        View details
                      </Link>
                    </Button>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
