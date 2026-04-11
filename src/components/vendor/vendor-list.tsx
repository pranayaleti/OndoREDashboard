import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Star,
  Phone,
  Mail,
  MapPin,
  HardHat,
  Edit2,
  Trash2,
  PlusCircle,
} from "lucide-react"
import { featureApi, type Vendor, type VendorSpecialty } from "@/lib/api"
import { AddVendorDialog } from "./add-vendor-dialog"

const SPECIALTIES: { value: VendorSpecialty; label: string }[] = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" },
  { value: "appliances", label: "Appliances" },
  { value: "flooring", label: "Flooring" },
  { value: "windows", label: "Windows" },
  { value: "structural", label: "Structural" },
  { value: "pest_control", label: "Pest Control" },
  { value: "cleaning", label: "Cleaning" },
  { value: "general", label: "General" },
  { value: "landscaping", label: "Landscaping" },
  { value: "roofing", label: "Roofing" },
  { value: "painting", label: "Painting" },
]

const SPECIALTY_COLORS: Record<VendorSpecialty, string> = {
  plumbing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  electrical: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  hvac: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  appliances: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  flooring: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  windows: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  structural: "bg-muted text-stone-800 dark:bg-card dark:text-stone-200",
  pest_control: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cleaning: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  general: "bg-muted text-gray-800 dark:bg-card dark:text-gray-200",
  landscaping: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  roofing: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  painting: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
}

const STATUS_COLORS = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-muted text-gray-800 dark:bg-card dark:text-gray-200",
  suspended: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [search, setSearch] = useState("")
  const [filterSpecialty, setFilterSpecialty] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [addOpen, setAddOpen] = useState(false)
  const [editVendor, setEditVendor] = useState<Vendor | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await featureApi.vendors.list({
        specialty: filterSpecialty !== "all" ? (filterSpecialty as VendorSpecialty) : undefined,
        status: filterStatus !== "all" ? (filterStatus as "active" | "inactive" | "suspended") : undefined,
      })
      setVendors(data)
    } catch {
      setError("Failed to load vendors.")
    } finally {
      setLoading(false)
    }
  }, [filterSpecialty, filterStatus])

  useEffect(() => { load() }, [load])

  const filtered = vendors.filter((v) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      v.name.toLowerCase().includes(q) ||
      v.company?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q) ||
      v.specialty.toLowerCase().includes(q)
    )
  })

  async function handleDeactivate(vendor: Vendor) {
    if (!confirm(`Deactivate ${vendor.name}?`)) return
    try {
      await featureApi.vendors.deactivate(vendor.id)
      setVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, status: "inactive" as const } : v))
      )
    } catch {
      alert("Failed to deactivate vendor.")
    }
  }

  function handleVendorSaved(vendor: Vendor) {
    setVendors((prev) => {
      const exists = prev.find((v) => v.id === vendor.id)
      return exists ? prev.map((v) => (v.id === vendor.id ? vendor : v)) : [vendor, ...prev]
    })
    setAddOpen(false)
    setEditVendor(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendors & Contractors</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your approved contractor network
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{vendors.filter((v) => v.status === "active").length}</p>
            <p className="text-sm text-muted-foreground">Active Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">
              {vendors.length > 0
                ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1)
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{new Set(vendors.map((v) => v.specialty)).size}</p>
            <p className="text-sm text-muted-foreground">Specialties Covered</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HardHat className="h-4 w-4" />
            Vendor Directory
          </CardTitle>
          <CardDescription>
            {filtered.length} vendor{filtered.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, company, city..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Loading vendors...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-sm">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No vendors found. Add your first vendor.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                          {vendor.company && (
                            <p className="text-xs text-gray-500">{vendor.company}</p>
                          )}
                          {vendor.license_number && (
                            <p className="text-xs text-gray-400">Lic: {vendor.license_number}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SPECIALTY_COLORS[vendor.specialty]}`}
                        >
                          {vendor.specialty.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {vendor.phone && (
                            <div className="flex items-center gap-1 text-xs">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {vendor.phone}
                            </div>
                          )}
                          {vendor.email && (
                            <div className="flex items-center gap-1 text-xs">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {vendor.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(vendor.city || vendor.state) && (
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                            {vendor.service_radius_miles ? (
                              <span className="text-gray-400">({vendor.service_radius_miles}mi)</span>
                            ) : null}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {vendor.hourly_rate ? (
                          <span className="text-sm">${vendor.hourly_rate}/hr</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vendor.review_count > 0 ? (
                          <StarRating rating={vendor.rating} />
                        ) : (
                          <span className="text-xs text-gray-400">No reviews</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[vendor.status]}>
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditVendor(vendor)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {vendor.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeactivate(vendor)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddVendorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={handleVendorSaved}
      />
      <AddVendorDialog
        open={!!editVendor}
        onOpenChange={(open) => !open && setEditVendor(null)}
        vendor={editVendor ?? undefined}
        onSaved={handleVendorSaved}
      />
    </div>
  )
}
