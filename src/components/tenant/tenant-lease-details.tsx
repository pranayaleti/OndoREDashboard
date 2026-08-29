import { useEffect, useMemo, useState } from "react"
import { CalendarDays, DollarSign, FileText, Home, ShieldCheck, Timer } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { propertyApi, documentsApi, featureApi, type Property, type DocumentListRecord } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency as formatCurrencyLocale } from "@/lib/locale-format"
import { groupLeasePacketDocuments, parseWatchForDescription, disclosureRulesFromUnknown } from "@/lib/lease-packet"

const formatCurrency = (value?: number | null) =>
  formatCurrencyLocale(value || 0, "USD", { maximumFractionDigits: 0 })

const formatDate = (value?: string | number | Date) => {
  if (!value) return "N/A"
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

const addMonths = (date: Date, months: number) => {
  const cloned = new Date(date)
  cloned.setMonth(cloned.getMonth() + months)
  return cloned
}

export default function TenantLeaseDetails() {
  const { toast } = useToast()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState<DocumentListRecord[]>([])
  const [documentsError, setDocumentsError] = useState<string | null>(null)
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [watchForRules, setWatchForRules] = useState<Array<{ id: string; title: string; description: string }>>([])
  const [watchForError, setWatchForError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLease = async () => {
      try {
        setIsLoading(true)
        const res = await propertyApi.getTenantProperty()
        const assignedProperty = res.property
        setProperty(assignedProperty)
      } catch (error) {
        console.error("Failed to load lease details", error)
        toast({
          title: "Unable to load lease details",
          description: "Please try again in a moment.",
          variant: "destructive",
        })
        setProperty(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLease()
  }, [toast])

  useEffect(() => {
    const loadDocuments = async () => {
      setDocumentsLoading(true)
      setDocumentsError(null)
      try {
        const { data } = await documentsApi.list()
        setDocuments(data)
      } catch {
        setDocuments([])
        setDocumentsError("We could not load your lease documents. Try again in a moment.")
      } finally {
        setDocumentsLoading(false)
      }
    }
    void loadDocuments()
  }, [])

  useEffect(() => {
    const stateCode = (property?.state || "UT").trim().toUpperCase()
    const state = /^[A-Z]{2}$/.test(stateCode) ? stateCode : "UT"
    const loadRules = async () => {
      setWatchForError(null)
      try {
        const rows = await featureApi.compliance.getRules(state)
        setWatchForRules(disclosureRulesFromUnknown(rows))
      } catch {
        setWatchForRules([])
        setWatchForError("Watch-for notes are unavailable right now. This is not legal advice.")
      }
    }
    void loadRules()
  }, [property?.state])

  const leaseMeta = useMemo(() => {
    if (!property) return null

    const leaseStart = property.createdAt ? new Date(property.createdAt) : new Date()
    const leaseEnd = addMonths(leaseStart, 12)
    const today = new Date()
    const totalDays = (leaseEnd.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24)
    const daysElapsed = Math.min(Math.max((today.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24), 0), totalDays)
    const progress = totalDays ? Math.round((daysElapsed / totalDays) * 100) : 0
    const nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), 1)
    if (today > nextPaymentDate) {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
    }

    return {
      leaseStart,
      leaseEnd,
      progress,
      nextPaymentDate,
      rent: property.price || 0,
      deposit: property.price || 0,
    }
  }, [property])

  const paymentSchedule = useMemo(() => {
    if (!leaseMeta?.leaseStart || !property?.price) return []
    return Array.from({ length: 6 }).map((_, index) => {
      const dueDate = addMonths(new Date(leaseMeta.leaseStart), index)
      return {
        id: `payment-${index}`,
        dueDate,
        amount: property.price ?? 0,
        status: index === 0 ? "Processing" : "Scheduled",
      }
    })
  }, [leaseMeta, property])

  const leaseEvents = [
    {
      title: "Lease Start",
      description: "Signed lease and moved in",
      date: leaseMeta?.leaseStart,
      status: "completed",
    },
    {
      title: "Mid-Lease Inspection",
      description: "Optional wellness inspection",
      date: leaseMeta ? addMonths(leaseMeta.leaseStart, 6) : undefined,
      status: "scheduled",
    },
    {
      title: "Renewal Window Opens",
      description: "Discuss renewal options 90 days out",
      date: leaseMeta ? addMonths(leaseMeta.leaseEnd, -3) : undefined,
      status: "upcoming",
    },
    {
      title: "Lease End",
      description: "Current agreement expiration",
      date: leaseMeta?.leaseEnd,
      status: "upcoming",
    },
  ]

  const packet = useMemo(() => groupLeasePacketDocuments(documents), [documents])

  const handleOpenDocument = async (id: string) => {
    try {
      const url = await documentsApi.getDownloadUrl(id)
      if (url) window.open(url, "_blank", "noopener,noreferrer")
    } catch {
      toast({
        title: "Unable to open document",
        description: "Please try again in a moment.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="w-fit">
            Active Lease
          </Badge>
          {leaseMeta && (
            <span className="text-sm text-muted-foreground">
              {leaseMeta.progress}% complete · Ends {formatDate(leaseMeta.leaseEnd)}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-semibold">Lease Details</h1>
          <p className="text-muted-foreground">
            Track your lease terms, upcoming payments, documents, and next steps, all in one place.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(leaseMeta?.rent)}</div>
            <p className="text-xs text-muted-foreground">Due on the 1st of each month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(leaseMeta?.nextPaymentDate)}</div>
            <p className="text-xs text-muted-foreground">Autopay enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Deposit</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(leaseMeta?.deposit)}</div>
            <p className="text-xs text-muted-foreground">Held in trust · Fully refundable</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-6">
          <div>
            <CardTitle>Property & Primary Contacts</CardTitle>
            <CardDescription>Core details of your residence and support team.</CardDescription>
          </div>
          <Badge variant="outline">{property?.status ? property.status.replace("_", " ") : "unassigned"}</Badge>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Property</p>
                <p className="font-medium">{property?.title || "No property assigned"}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">
                {property
                  ? `${property.addressLine1}${property.addressLine2 ? `, ${property.addressLine2}` : ""}`
                  : "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">
                {property ? `${property.city}, ${property.state || property.country} ${property.zipcode || ""}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bedrooms</p>
                <p className="font-medium">{property?.bedrooms ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bathrooms</p>
                <p className="font-medium">{property?.bathrooms ?? "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Square Feet</p>
                <p className="font-medium">{property?.sqft ? `${property.sqft} sq ft` : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Property Type</p>
                <p className="font-medium capitalize">{property?.type || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Lease Term</p>
                <p className="font-medium">
                  {formatDate(leaseMeta?.leaseStart)} – {formatDate(leaseMeta?.leaseEnd)}
                </p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Lease ID</p>
                <p className="font-mono text-sm">LS-{property?.id?.slice(0, 6)?.toUpperCase() || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Primary Manager</p>
                <p className="font-medium">
                  {property?.manager ? `${property.manager.firstName} ${property.manager.lastName}` : "Pending"}
                </p>
                <p className="text-xs text-muted-foreground">{property?.manager?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-medium">
                  {property?.owner ? `${property.owner.firstName} ${property.owner.lastName}` : "Assigned by PM"}
                </p>
                <p className="text-xs text-muted-foreground">{property?.owner?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emergency Contact</p>
                <p className="font-medium">{property?.phone || "(555) 867-5309"}</p>
                <p className="text-xs text-muted-foreground">24/7 maintenance desk</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Payments</CardTitle>
          <CardDescription>Keep track of rent payments and their status at a glance.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentSchedule.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.dueDate)}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "Processing" ? "secondary" : "outline"}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
              {!paymentSchedule.length && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    Payment schedule will appear once your lease is assigned.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Lease Timeline</CardTitle>
            <CardDescription>Important dates and reminders for your lease.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {leaseEvents.map((event, index) => (
              <div key={event.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  {index < leaseEvents.length - 1 && <div className="h-full w-px bg-border" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{event.title}</p>
                    <Badge variant={event.status === "completed" ? "default" : "outline"}>{event.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="text-sm font-medium">{formatDate(event.date)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Need to make a change? Start here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="default" className="w-full" disabled={isLoading || !property}>
              Request Renewal
            </Button>
            <Button variant="outline" className="w-full" disabled={isLoading || !property}>
              Schedule Move-out Walkthrough
            </Button>
            <Button variant="ghost" className="w-full" disabled={isLoading || !property}>
              Download Statement
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease Documents</CardTitle>
          <CardDescription>
            Signed agreements plus attached addendums and disclosures. Educational watch-for notes
            are not legal advice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {documentsLoading ? (
            <p className="text-sm text-muted-foreground">Loading documents…</p>
          ) : documentsError ? (
            <p className="text-sm text-destructive" role="alert">{documentsError}</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents are on file yet. When your manager shares the lease packet, it will
              appear here.
            </p>
          ) : (
            <>
              <DocumentGroup
                heading="Lease and other files"
                docs={packet.other}
                onOpen={handleOpenDocument}
              />
              <DocumentGroup
                heading="Addendums"
                docs={packet.addendums}
                empty="No addendums attached to this packet."
                onOpen={handleOpenDocument}
              />
              <DocumentGroup
                heading="Disclosures"
                docs={packet.disclosures}
                empty="No disclosures attached to this packet."
                onOpen={handleOpenDocument}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What to watch for</CardTitle>
          <CardDescription>
            Disclosure topics for {(property?.state || "UT").toUpperCase()} from Ondo&apos;s
            compliance rules. Not legal advice — have a licensed attorney review your packet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {watchForError ? (
            <p className="text-sm text-destructive" role="alert">{watchForError}</p>
          ) : watchForRules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No watch-for notes are published for this state yet.
            </p>
          ) : (
            watchForRules.map((rule) => (
              <div key={rule.id} className="rounded-lg border p-4">
                <p className="font-medium">{rule.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {parseWatchForDescription(rule.description).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DocumentGroup({
  heading,
  docs,
  empty,
  onOpen,
}: {
  heading: string
  docs: DocumentListRecord[]
  empty?: string
  onOpen: (id: string) => void
}) {
  if (docs.length === 0 && empty) {
    return (
      <div>
        <p className="text-sm font-medium">{heading}</p>
        <p className="text-sm text-muted-foreground mt-1">{empty}</p>
      </div>
    )
  }
  if (docs.length === 0) return null
  return (
    <div>
      <p className="text-sm font-medium mb-3">{heading}</p>
      <div className="grid gap-4 md:grid-cols-3">
        {docs.map((doc) => (
          <button
            key={doc.id}
            type="button"
            className="rounded-lg border p-4 text-left hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => onOpen(doc.id)}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <p className="font-medium">{doc.name}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Updated {formatDate(doc.createdAt)}
              {doc.sizeBytes != null ? ` · ${doc.sizeBytes} bytes` : ""}
            </p>
            <Badge variant="outline" className="mt-4 capitalize">
              {doc.docType ?? "document"}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  )
}


