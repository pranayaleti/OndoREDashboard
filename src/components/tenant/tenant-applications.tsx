import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { featureApi } from "@/lib/api"

type AppRow = {
  id: string
  status: string
  statusLabel?: string
  completionPercent: number
  applicantNextAction?: string | null
  submittedAt?: string | null
  completedAdultApplicants?: number
  requiredAdults?: number
  coApplicantSummary?: string
  property?: { title?: string; address?: string }
}

function adultProgress(row: AppRow): string | null {
  if (typeof row.completedAdultApplicants === "number" && typeof row.requiredAdults === "number") {
    return `${row.completedAdultApplicants} of ${row.requiredAdults} applicants completed`
  }
  const summary = row.coApplicantSummary?.trim()
  return summary ? summary : null
}

function unwrapArray(raw: unknown): AppRow[] {
  if (Array.isArray(raw)) return raw as AppRow[]
  if (typeof raw === "object" && raw !== null && "data" in raw && Array.isArray((raw as { data: unknown }).data)) {
    return (raw as { data: AppRow[] }).data
  }
  return []
}

export function TenantApplicationsPage() {
  const [rows, setRows] = useState<AppRow[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void featureApi.rental
      .listMine()
      .then((data) => setRows(unwrapArray(data)))
      .catch(() => setError("Could not load applications."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">My applications</h1>
      {loading ? <p>Loading…</p> : null}
      {error ? <p className="text-destructive">{error}</p> : null}
      {!loading && rows.length === 0 ? (
        <p className="text-muted-foreground">You do not have any rental applications yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const progress = adultProgress(row)
            return (
            <Card key={row.id}>
              <CardHeader>
                <CardTitle className="text-lg">{row.property?.title || "Rental application"}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  {row.statusLabel || row.status} · {row.completionPercent}% complete
                </p>
                {progress ? <p className="text-muted-foreground">{progress}</p> : null}
                <p className="text-muted-foreground">{row.applicantNextAction}</p>
                {row.submittedAt ? <p>Submitted {row.submittedAt.slice(0, 10)}</p> : null}
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Equal Housing Opportunity. Status updates here are not a credit decision. Continue a draft on the public
        site if you started there.
      </p>
    </div>
  )
}

export default TenantApplicationsPage
