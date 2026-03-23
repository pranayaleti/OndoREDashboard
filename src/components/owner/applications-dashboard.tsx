import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  Users,
  Eye,
  RefreshCw,
  UserPlus,
} from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { InviteTenantDialog } from "./invite-tenant-dialog"
import { BulkInviteDialog } from "./bulk-invite-dialog"
import { ApplicationDetailView } from "./application-detail-view"
import { ApplicationComparisonView } from "./application-comparison-view"

interface Application {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  status: string
  recommendationScore: number | null
  submittedAt: string | null
  reviewedAt: string | null
  createdAt: string
}

interface ApplicationsDashboardProps {
  propertyId: string
}

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  screening: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  passed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  withdrawn: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-400"
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 60) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

export function ApplicationsDashboard({ propertyId }: ApplicationsDashboardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [bulkInviteOpen, setBulkInviteOpen] = useState(false)
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [propertyId, statusFilter])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const status = statusFilter === "all" ? undefined : statusFilter
      const data = await featureApi.applications.listForProperty(propertyId, status)
      setApplications(data as Application[])
    } catch {
      toast({ title: "Failed to load applications", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 10) next.add(id)
      return next
    })
  }

  if (showComparison && compareIds.size >= 2) {
    return (
      <ApplicationComparisonView
        propertyId={propertyId}
        applicationIds={Array.from(compareIds)}
        onBack={() => setShowComparison(false)}
      />
    )
  }

  if (selectedAppId) {
    return (
      <ApplicationDetailView
        applicationId={selectedAppId}
        propertyId={propertyId}
        onBack={() => {
          setSelectedAppId(null)
          loadApplications()
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Applications
              </CardTitle>
              <CardDescription>
                {applications.length} application{applications.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              {compareIds.size >= 2 && (
                <Button
                  variant="outline"
                  onClick={() => setShowComparison(true)}
                >
                  Compare ({compareIds.size})
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={loadApplications}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setBulkInviteOpen(true)}>
                <Users className="h-4 w-4 mr-1.5" /> Bulk Invite
              </Button>
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1.5" /> Invite
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No applications yet</p>
              <p className="text-sm mt-1">Invite tenants to apply for this property</p>
              <Button className="mt-4" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1.5" /> Invite Tenant
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Applicant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={compareIds.has(app.id)}
                          onCheckedChange={() => toggleCompare(app.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {app.firstName} {app.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{app.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusStyles[app.status] ?? statusStyles.draft}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${scoreColor(app.recommendationScore)}`}>
                          {app.recommendationScore !== null ? app.recommendationScore : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAppId(app.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <InviteTenantDialog
        propertyId={propertyId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />

      <BulkInviteDialog
        propertyId={propertyId}
        open={bulkInviteOpen}
        onOpenChange={setBulkInviteOpen}
      />
    </div>
  )
}
