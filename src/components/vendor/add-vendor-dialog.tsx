import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { featureApi, type Vendor, type VendorSpecialty, type CreateVendorPayload } from "@/lib/api"

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

const EMPTY: CreateVendorPayload = {
  name: "",
  company: "",
  email: "",
  phone: "",
  specialty: "general",
  license_number: "",
  insurance_info: "",
  hourly_rate: undefined,
  notes: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  service_radius_miles: 25,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor
  onSaved: (vendor: Vendor) => void
}

export function AddVendorDialog({ open, onOpenChange, vendor, onSaved }: Props) {
  const [form, setForm] = useState<CreateVendorPayload>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (open) {
      setForm(vendor ? { ...EMPTY, ...vendor } : EMPTY)
      setError(undefined)
    }
  }, [open, vendor])

  function set<K extends keyof CreateVendorPayload>(key: K, value: CreateVendorPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(undefined)
    try {
      let saved: Vendor
      if (vendor) {
        saved = await featureApi.vendors.update(vendor.id, form)
      } else {
        saved = await featureApi.vendors.create(form)
      }
      onSaved(saved)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save vendor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vendor ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          <DialogDescription>
            {vendor ? "Update contractor details." : "Add a contractor to your network."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={form.company ?? ""}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Smith Plumbing LLC"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(555) 000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Specialty *</Label>
              <Select
                value={form.specialty}
                onValueChange={(v) => set("specialty", v as VendorSpecialty)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                min={0}
                step={0.01}
                value={form.hourly_rate ?? ""}
                onChange={(e) =>
                  set("hourly_rate", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="75.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="license_number">License Number</Label>
              <Input
                id="license_number"
                value={form.license_number ?? ""}
                onChange={(e) => set("license_number", e.target.value)}
                placeholder="LIC-123456"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service_radius_miles">Service Radius (miles)</Label>
              <Input
                id="service_radius_miles"
                type="number"
                min={1}
                value={form.service_radius_miles ?? 25}
                onChange={(e) => set("service_radius_miles", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Salt Lake City"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state ?? ""}
                onChange={(e) => set("state", e.target.value)}
                placeholder="UT"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={form.zip ?? ""}
                onChange={(e) => set("zip", e.target.value)}
                placeholder="84101"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="insurance_info">Insurance Info</Label>
            <Input
              id="insurance_info"
              value={form.insurance_info ?? ""}
              onChange={(e) => set("insurance_info", e.target.value)}
              placeholder="Policy #, carrier, expiry..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Any additional notes..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : vendor ? "Update Vendor" : "Add Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
