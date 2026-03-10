import { useEffect, useMemo, useState } from "react"
import { CalendarDays, DollarSign, FileText, Home, ShieldCheck, Timer } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { propertyApi, type Property } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0)

const formatDate = (value?: string | number | Date) => {
  if (!value) return "—"
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

  const documents = [
    {
      title: "Master Lease Agreement",
      type: "PDF",
      updatedAt: leaseMeta?.leaseStart,
      size: "2.1 MB",
    },
    {
      title: "Move-in Condition Report",
      type: "PDF",
      updatedAt: leaseMeta ? addMonths(leaseMeta.leaseStart, 0) : undefined,
      size: "860 KB",
    },
    {
      title: "Insurance Certificate",
      type: "PDF",
      updatedAt: leaseMeta ? addMonths(leaseMeta.leaseStart, 0) : undefined,
      size: "430 KB",
    },
  ]

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
            Track your lease terms, upcoming payments, documents, and next steps—all in one place.
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
                  : "—"}
              </p>
              <p className="text-sm text-muted-foreground">
                {property ? `${property.city}, ${property.state || property.country} ${property.zipcode || ""}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bedrooms</p>
                <p className="font-medium">{property?.bedrooms ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bathrooms</p>
                <p className="font-medium">{property?.bathrooms ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Square Feet</p>
                <p className="font-medium">{property?.sqft ? `${property.sqft} sq ft` : "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Property Type</p>
                <p className="font-medium capitalize">{property?.type || "—"}</p>
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
          <CardDescription>Signed agreements, addendums, and insurance records.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {documents.map((doc) => (
            <div key={doc.title} className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <p className="font-medium">{doc.title}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Updated {formatDate(doc.updatedAt)} · {doc.size}
              </p>
              <Badge variant="outline" className="mt-4">
                {doc.type}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}


