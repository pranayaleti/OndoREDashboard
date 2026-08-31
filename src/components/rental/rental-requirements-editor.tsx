import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type RequirementsConfig = {
  applicationsOpen: boolean
  whoCanApply: {
    minAge: number
    everyAdultMustApply: boolean
    tourRequiredBeforeApply: boolean
    maxUnrelatedOccupants: number | null
  }
  income: { minIncomeToRentRatio: number | null; payStubMonths: number }
  credit: { minimumScore: number | null }
  rentalHistory: { yearsRequired: number | null; requirePriorLandlord: boolean }
  pets: { allowed: boolean; maxCount: number | null; types?: string[]; extraDepositCents: number | null; monthlyPetRentCents: number | null; notes: string | null }
  rentersInsurance: { required: boolean; additionalInsuredName: string | null }
  applicationFees: { applicationFeeCents: number; screeningFeeCents: number; otherFees: Array<{ label: string; amountCents: number }> }
  otherRequirements: string[]
  customDisclosures: string[]
  internalNotes: string | null
}

function unwrap<T>(raw: unknown): T {
  if (typeof raw === "object" && raw !== null && "data" in raw) {
    return (raw as { data: T }).data
  }
  return raw as T
}

export function RentalRequirementsEditor({ propertyId }: { propertyId: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [published, setPublished] = useState(false)
  const [config, setConfig] = useState<RequirementsConfig | null>(null)

  useEffect(() => {
    let cancelled = false
    void featureApi.rental
      .getRequirements(propertyId)
      .then((raw) => {
        if (cancelled) return
        const data = unwrap<{ published: boolean; config: RequirementsConfig }>(raw)
        setPublished(Boolean(data.published))
        setConfig(data.config)
      })
      .catch(() => {
        if (cancelled) return
        toast({ title: "Could not load rental criteria", variant: "destructive" })
        setPublished(false)
        setConfig({
          applicationsOpen: false,
          whoCanApply: {
            minAge: 18,
            everyAdultMustApply: true,
            tourRequiredBeforeApply: false,
            maxUnrelatedOccupants: null,
          },
          income: { minIncomeToRentRatio: 3, payStubMonths: 2 },
          credit: { minimumScore: null },
          rentalHistory: { yearsRequired: 2, requirePriorLandlord: true },
          pets: { allowed: true, maxCount: null, extraDepositCents: null, monthlyPetRentCents: null, notes: null },
          rentersInsurance: { required: true, additionalInsuredName: "Ondo Real Estate" },
          applicationFees: { applicationFeeCents: 0, screeningFeeCents: 0, otherFees: [] },
          otherRequirements: [],
          customDisclosures: [],
          internalNotes: null,
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [propertyId, toast])

  if (loading || !config) {
    return <p className="text-sm text-muted-foreground">Loading rental criteria…</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental application criteria</CardTitle>
        <CardDescription>
          Property-specific written criteria. Do not collect protected-class information. Assistance animals are not pets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="open">Accept online applications</Label>
          <Switch
            id="open"
            checked={config.applicationsOpen}
            onCheckedChange={(checked) => setConfig({ ...config, applicationsOpen: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="pub">Publish to the listing</Label>
          <Switch id="pub" checked={published} onCheckedChange={setPublished} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="tour">Tour before apply</Label>
          <Switch
            id="tour"
            checked={config.whoCanApply.tourRequiredBeforeApply}
            onCheckedChange={(checked) =>
              setConfig({ ...config, whoCanApply: { ...config.whoCanApply, tourRequiredBeforeApply: checked } })
            }
          />
        </div>
        <div>
          <Label htmlFor="ratio">Income-to-rent ratio</Label>
          <Input
            id="ratio"
            type="number"
            className="mt-1"
            value={config.income.minIncomeToRentRatio ?? ""}
            onChange={(e) =>
              setConfig({
                ...config,
                income: { ...config.income, minIncomeToRentRatio: e.target.value ? Number(e.target.value) : null },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="credit">Minimum credit score (optional)</Label>
          <Input
            id="credit"
            type="number"
            className="mt-1"
            value={config.credit.minimumScore ?? ""}
            onChange={(e) =>
              setConfig({
                ...config,
                credit: { minimumScore: e.target.value ? Number(e.target.value) : null },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="fee">Application fee (USD)</Label>
          <Input
            id="fee"
            type="number"
            className="mt-1"
            value={config.applicationFees.applicationFeeCents / 100 || ""}
            onChange={(e) =>
              setConfig({
                ...config,
                applicationFees: {
                  ...config.applicationFees,
                  applicationFeeCents: Math.max(0, Math.round(Number(e.target.value || 0) * 100)),
                },
              })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="pets">Pets allowed</Label>
          <Switch
            id="pets"
            checked={config.pets.allowed}
            onCheckedChange={(checked) => setConfig({ ...config, pets: { ...config.pets, allowed: checked } })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Assistance animals are not pets and never have extra pet rent or deposits.
        </p>
        <div>
          <Label htmlFor="petcount">Max pets (not counting assistance animals)</Label>
          <Input
            id="petcount"
            type="number"
            className="mt-1"
            value={config.pets.maxCount ?? ""}
            onChange={(e) =>
              setConfig({
                ...config,
                pets: { ...config.pets, maxCount: e.target.value ? Number(e.target.value) : null },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="pettypes">Pet types (comma-separated)</Label>
          <Input
            id="pettypes"
            className="mt-1"
            value={(config.pets.types ?? []).join(", ")}
            onChange={(e) =>
              setConfig({
                ...config,
                pets: {
                  ...config.pets,
                  types: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="petdep">Pet deposit (USD)</Label>
          <Input
            id="petdep"
            type="number"
            className="mt-1"
            value={(config.pets.extraDepositCents ?? 0) / 100 || ""}
            onChange={(e) =>
              setConfig({
                ...config,
                pets: {
                  ...config.pets,
                  extraDepositCents: Math.max(0, Math.round(Number(e.target.value || 0) * 100)),
                },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="petrent">Monthly pet rent (USD)</Label>
          <Input
            id="petrent"
            type="number"
            className="mt-1"
            value={(config.pets.monthlyPetRentCents ?? 0) / 100 || ""}
            onChange={(e) =>
              setConfig({
                ...config,
                pets: {
                  ...config.pets,
                  monthlyPetRentCents: Math.max(0, Math.round(Number(e.target.value || 0) * 100)),
                },
              })
            }
          />
        </div>
        <div>
          <Label htmlFor="screenfee">Screening fee (USD)</Label>
          <Input
            id="screenfee"
            type="number"
            className="mt-1"
            value={config.applicationFees.screeningFeeCents / 100 || ""}
            onChange={(e) =>
              setConfig({
                ...config,
                applicationFees: {
                  ...config.applicationFees,
                  screeningFeeCents: Math.max(0, Math.round(Number(e.target.value || 0) * 100)),
                },
              })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="ins">Renters insurance required</Label>
          <Switch
            id="ins"
            checked={config.rentersInsurance.required}
            onCheckedChange={(checked) =>
              setConfig({ ...config, rentersInsurance: { ...config.rentersInsurance, required: checked } })
            }
          />
        </div>
        <div>
          <Label htmlFor="other">Other property-specific requirements</Label>
          <Textarea
            id="other"
            className="mt-1"
            value={config.otherRequirements.join("\n")}
            onChange={(e) => setConfig({ ...config, otherRequirements: e.target.value.split("\n").filter(Boolean) })}
          />
        </div>
        <div>
          <Label htmlFor="notes">Internal notes (never shown to applicants)</Label>
          <Textarea
            id="notes"
            className="mt-1"
            value={config.internalNotes ?? ""}
            onChange={(e) => setConfig({ ...config, internalNotes: e.target.value })}
          />
        </div>
        <Button
          className="min-h-11"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await featureApi.rental.saveRequirements(propertyId, { published, config })
              toast({ title: "Rental criteria saved" })
            } catch {
              toast({ title: "Save failed", variant: "destructive" })
            } finally {
              setSaving(false)
            }
          }}
        >
          Save criteria
        </Button>
      </CardContent>
    </Card>
  )
}
