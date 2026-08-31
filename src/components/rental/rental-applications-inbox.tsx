import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { featureApi, propertyApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { ManagerReviewPanel, type ReviewBundle } from "@/components/rental/manager-review-panel"

type InboxRow = {
  id: string
  firstName: string
  lastName: string
  email: string
  status: string
  statusLabel?: string
  completionPercent: number
  missingDocs?: number
  missingDocuments?: string[]
  verificationStatus?: string
  verificationLabel?: string
  completedAdultApplicants?: number
  requiredAdults?: number
  coApplicantSummary?: string
  lastActivity?: string
  assignedReviewerId?: string | null
  assignedReviewerName?: string | null
  property?: { id?: string; title?: string; address?: string }
  propertyId?: string
}

function unwrap<T>(raw: unknown): T {
  if (typeof raw === "object" && raw !== null && "data" in raw) return (raw as { data: T }).data
  return raw as T
}

function adultProgress(row: InboxRow): string | null {
  if (typeof row.completedAdultApplicants === "number" && typeof row.requiredAdults === "number") {
    return `${row.completedAdultApplicants} of ${row.requiredAdults} applicants completed`
  }
  const summary = row.coApplicantSummary?.trim()
  return summary ? summary : null
}

const STATUSES = [
  "started",
  "submitted",
  "documents_required",
  "under_review",
  "additional_information_required",
  "conditionally_approved",
  "approved",
  "denied",
  "withdrawn",
]

export function RentalApplicationsInbox({ propertyId }: { propertyId?: string }) {
  const { toast } = useToast()
  const [rows, setRows] = useState<InboxRow[]>([])
  const [status, setStatus] = useState("all")
  const [propertyFilter, setPropertyFilter] = useState(propertyId ?? "all")
  const [applicant, setApplicant] = useState("")
  const [reviewer, setReviewer] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selected, setSelected] = useState<ReviewBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [properties, setProperties] = useState<Array<{ id: string; title: string }>>([])

  useEffect(() => {
    if (propertyId) return
    let cancelled = false
    void propertyApi
      .getProperties(1, 100)
      .then((res) => {
        if (cancelled) return
        setProperties(
          (res.properties ?? []).map((p) => ({
            id: p.id,
            title: p.title || p.addressLine1 || p.id,
          })),
        )
      })
      .catch(() => {
        /* inbox still works without the property catalog */
      })
    return () => {
      cancelled = true
    }
  }, [propertyId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await featureApi.rental.listInbox({
          propertyId: propertyId || (propertyFilter === "all" ? undefined : propertyFilter),
          status: status === "all" ? undefined : status,
          applicant: applicant.trim() || undefined,
          assignedReviewerId: reviewer === "all" ? undefined : reviewer,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
        if (!cancelled) setRows(data as InboxRow[])
      } catch {
        if (!cancelled) {
          setError("Could not load applications.")
          toast({ title: "Could not load applications", variant: "destructive" })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [propertyId, propertyFilter, status, applicant, reviewer, dateFrom, dateTo, toast, refreshKey])

  const reviewerOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of rows) {
      if (row.assignedReviewerId) {
        map.set(row.assignedReviewerId, row.assignedReviewerName || row.assignedReviewerId)
      }
    }
    return [...map.entries()]
  }, [rows])

  const open = async (id: string) => {
    try {
      const raw = await featureApi.rental.get(id)
      setSelected(unwrap<ReviewBundle>(raw))
    } catch {
      toast({ title: "Could not open application", variant: "destructive" })
    }
  }

  if (selected) {
    return (
      <ManagerReviewPanel
        bundle={selected}
        onBack={() => setSelected(null)}
        onRefresh={async () => {
          const raw = await featureApi.rental.get(selected.application.id)
          setSelected(unwrap<ReviewBundle>(raw))
          setRefreshKey((n) => n + 1)
        }}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental applications</CardTitle>
        <CardDescription>
          Filter by property, status, date, applicant, or assigned manager. Internal notes stay off applicant views.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault()
            setRefreshKey((n) => n + 1)
          }}
        >
          {propertyId ? null : (
            <div>
              <Label>Property</Label>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All properties</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="applicant">Applicant</Label>
            <Input
              id="applicant"
              className="mt-1"
              value={applicant}
              onChange={(e) => setApplicant(e.target.value)}
              placeholder="Name or email"
            />
          </div>
          <div>
            <Label>Assigned manager</Label>
            <Select value={reviewer} onValueChange={setReviewer}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Anyone</SelectItem>
                {reviewerOptions.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" className="mt-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" className="mt-1" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="outline">
              Refresh
            </Button>
          </div>
        </form>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications match these filters.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Complete</TableHead>
                <TableHead>Applicants</TableHead>
                <TableHead>Missing documents</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">
                      {row.firstName} {row.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </TableCell>
                  <TableCell>{row.property?.title || "Property"}</TableCell>
                  <TableCell>{row.statusLabel || row.status.replace(/_/g, " ")}</TableCell>
                  <TableCell>{row.completionPercent}%</TableCell>
                  <TableCell>{adultProgress(row) || "—"}</TableCell>
                  <TableCell>
                    {row.missingDocs ?? 0}
                    {row.missingDocuments?.length ? (
                      <p className="text-xs text-muted-foreground">{row.missingDocuments.join(", ")}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.verificationLabel || "None"}</TableCell>
                  <TableCell>{row.assignedReviewerName || "Unassigned"}</TableCell>
                  <TableCell>{(row.lastActivity || "").slice(0, 16).replace("T", " ")}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => void open(row.id)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
