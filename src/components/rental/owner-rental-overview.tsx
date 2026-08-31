import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { featureApi } from "@/lib/api"

type PortfolioRow = {
  propertyId: string
  title: string
  address: string
  occupancy: string
  applications: number
  pending: number
  tours: number
  leads: number
  monthlyRentCents?: number | null
  openMaintenance?: number
  missingDocuments?: number
  avgCompletionHours?: number | null
}

function money(cents: number | null | undefined): string {
  if (cents == null) return "—"
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)
}

function unwrap<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (typeof raw === "object" && raw !== null && "data" in raw && Array.isArray((raw as { data: unknown }).data)) {
    return (raw as { data: T[] }).data
  }
  return []
}

export function OwnerRentalOverview() {
  const [rows, setRows] = useState<PortfolioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    void featureApi.rental
      .listPortfolio()
      .then((raw) => {
        if (!cancelled) setRows(unwrap<PortfolioRow>(raw))
      })
      .catch(() => {
        if (!cancelled) setError("Could not load portfolio summary.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="text-sm text-muted-foreground">Loading portfolio…</p>
  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No rental properties in this portfolio yet.</p>
  }

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <Card key={row.propertyId}>
          <CardHeader>
            <CardTitle className="text-base">{row.title}</CardTitle>
            <CardDescription>{row.address}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <p>Occupancy: {row.occupancy}</p>
            <p>Rent: {money(row.monthlyRentCents)}</p>
            <p>Applications: {row.applications}</p>
            <p>Pending: {row.pending}</p>
            <p>Tours: {row.tours}</p>
            <p>Leads: {row.leads}</p>
            <p>Open maintenance: {row.openMaintenance ?? 0}</p>
            <p>Missing documents: {row.missingDocuments ?? 0}</p>
            {row.avgCompletionHours != null ? (
              <p className="col-span-2 text-muted-foreground">
                Average completion {row.avgCompletionHours} hours
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
