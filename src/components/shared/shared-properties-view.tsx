// src/components/shared/shared-properties-view.tsx
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Building, Search, X, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { propertyApi } from "@/lib/api"
import type { Property } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatUSDate } from "@/lib/us-format"

export interface SharedPropertiesViewProps {
  title: string
  description?: string
  ownerView?: boolean
}

type PropertyStatus = Property["status"]

function statusBadgeVariant(status: PropertyStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "approved") return "default"
  if (status === "pending") return "secondary"
  if (status === "rejected") return "destructive"
  return "outline"
}

function statusLabel(status: PropertyStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const PAGE_SIZE = 20

export function SharedPropertiesView({ title, description, ownerView = false }: SharedPropertiesViewProps) {
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchProperties = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await propertyApi.getProperties(p, PAGE_SIZE)
      setProperties(result.properties)
      setTotal(result.total)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load properties"
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProperties(page)
  }, [fetchProperties, page])

  const filtered = search.trim()
    ? properties.filter((p) => {
        const q = search.toLowerCase()
        return (
          p.addressLine1?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.state?.toLowerCase().includes(q) ||
          p.status?.toLowerCase().includes(q)
        )
      })
    : properties

  const approvedCount = properties.filter((p) => p.status === "approved").length
  const pendingCount = properties.filter((p) => p.status === "pending").length
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    setUpdatingId(propertyId)
    try {
      await propertyApi.updatePropertyStatus(propertyId, newStatus)
      toast({ title: "Status updated", description: `Property marked as ${newStatus}` })
      await fetchProperties(page)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update status"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building className="h-7 w-7" />
          {title}
        </h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: total },
          { label: "Approved", value: approvedCount },
          { label: "Pending", value: pendingCount },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-9"
          placeholder="Search by address, city, or status…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearch("")}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchProperties(page)}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>
            {search ? `Showing ${filtered.length} matching results` : `${total} total properties`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading properties…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Building className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>{search ? "No properties match your search." : "No properties found."}</p>
              {search && (
                <Button variant="link" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Address</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">City / State</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Beds / Baths</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Price / mo</th>
                    <th className="pb-3 font-medium text-muted-foreground">Added</th>
                    {!ownerView && <th className="pb-3 pl-4 font-medium text-muted-foreground">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 font-medium">
                        {p.addressLine1}
                        {p.addressLine2 ? `, ${p.addressLine2}` : ""}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {[p.city, p.state].filter(Boolean).join(", ")}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusBadgeVariant(p.status)}>
                          {statusLabel(p.status)}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {p.bedrooms ?? "—"} bd / {p.bathrooms ?? "—"} ba
                      </td>
                      <td className="py-3 pr-4">
                        {p.price != null ? `$${p.price.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {formatUSDate(p.createdAt)}
                      </td>
                      {!ownerView && (
                        <td className="py-3 pl-4">
                          {p.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === p.id}
                                onClick={() => handleStatusChange(p.id, "approved")}
                              >
                                {updatingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === p.id}
                                onClick={() => handleStatusChange(p.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && !search && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
