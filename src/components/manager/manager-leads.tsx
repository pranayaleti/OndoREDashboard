import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Mail,
  Phone,
  Building,
  MapPin,
  Search,
  Filter,
  Radio,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  leadApi,
  ApiError,
  type InboxLead,
  type LeadInboxStatus,
  type InboxFilter,
  isUnclaimedLead,
} from "@/lib/api"
import { formatUSDate, formatUSPhone } from "@/lib/us-format"
import { useAuth } from "@/lib/auth-context"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"
import { useDebounce } from "@/hooks/useDebounce"
import { LeadDetailDrawer } from "../leads/lead-detail-drawer"
import { EmptyState } from "@/components/ui/empty-state"

function TemperatureBadge({ temperature }: { temperature?: "HOT" | "WARM" | "COLD" }) {
  if (!temperature) return <span className="text-xs text-gray-400">N/A</span>
  const styles = {
    HOT: "bg-red-100 text-red-700 border border-red-200",
    WARM: "bg-amber-100 text-amber-700 border border-amber-200",
    COLD: "bg-blue-100 text-blue-700 border border-blue-200",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[temperature]}`}>
      {temperature}
    </span>
  )
}

function inboxRowVisible(row: Record<string, unknown> | undefined, userId: string): boolean {
  if (!row) return false
  const managerId = (row.manager_id as string | null | undefined) ?? null
  const claimedAt = (row.claimed_at as string | null | undefined) ?? null
  if (managerId === userId) return true
  return managerId === null && claimedAt === null
}

function getStatusColor(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "contacted":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "qualified":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "converted":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    case "closed":
      return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
    default:
      return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
  }
}

export default function ManagerLeads() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<InboxLead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm.trim(), 300)
  const [statusFilter, setStatusFilter] = useState("all")
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all")
  const [selectedLead, setSelectedLead] = useState<InboxLead | null>(null)
  const { toast } = useToast()

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const res = await leadApi.getInbox({
        page: 1,
        limit: 100,
        filter: inboxFilter,
        status: statusFilter !== "all" ? (statusFilter as LeadInboxStatus) : undefined,
        q: debouncedSearch || undefined,
        include: "score",
      })
      const fetched = res.data ?? []
      setLeads(fetched)
    } catch (error) {
      console.error("Error fetching leads:", error)
      toast({
        title: "Error",
        description: "Failed to load leads. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [inboxFilter, statusFilter, debouncedSearch, toast])

  useEffect(() => {
    void fetchLeads()
  }, [fetchLeads])

  const onRealtime = useCallback(
    (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
      const row = payload.new ?? payload.old
      if (payload.eventType !== "DELETE" && !inboxRowVisible(row, user?.id ?? "")) return
      if (payload.eventType === "INSERT" && inboxRowVisible(payload.new, user?.id ?? "")) {
        const name = String(payload.new.tenant_name ?? payload.new.name ?? "Someone")
        toast({
          title: "New Lead",
          description: `${name} was added to the inbox.`,
          duration: 5000,
        })
      }
      void fetchLeads()
    },
    [fetchLeads, toast, user?.id],
  )

  useRealtimeTable({
    table: "leads",
    events: ["INSERT", "UPDATE", "DELETE"],
    enabled: !!user?.id,
    onEvent: onRealtime,
  })
  useRealtimeTable({
    table: "website_leads",
    events: ["INSERT", "UPDATE", "DELETE"],
    enabled: !!user?.id,
    onEvent: onRealtime,
  })
  useRealtimeTable({
    table: "lead_work_events",
    events: ["INSERT", "UPDATE"],
    enabled: !!user?.id,
    onEvent: () => {
      void fetchLeads()
    },
  })

  const handleLeadStatusUpdate = async (lead: InboxLead, newStatus: LeadInboxStatus) => {
    try {
      await leadApi.updateInboxStatus(lead.kind, lead.id, newStatus)
      toast({
        title: "Success",
        description: "Lead status updated successfully.",
        duration: 3000,
      })
      void fetchLeads()
    } catch (error) {
      console.error("Error updating lead status:", error)
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      })
    }
  }

  const handleClaim = async (lead: InboxLead) => {
    try {
      await leadApi.claimLead(lead.kind, lead.id)
      toast({ title: "Lead claimed", description: `${lead.name} is now in your inbox.` })
      void fetchLeads()
    } catch (error) {
      const already = error instanceof ApiError && error.status === 409
      toast({
        title: already ? "Already claimed" : "Error",
        description: already ? "This lead was claimed by another manager." : "Failed to claim lead.",
        variant: "destructive",
      })
      void fetchLeads()
    }
  }

  const filteredLeads = leads

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400">Your assigned leads and the unclaimed inbox</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-1">
          <Radio className="h-3 w-3 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {(["all", "mine", "unclaimed"] as InboxFilter[]).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={inboxFilter === f ? "default" : "outline"}
                onClick={() => setInboxFilter(f)}
              >
                {f === "all" ? "All" : f === "mine" ? "Mine" : "Unclaimed"}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading leads...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredLeads.length > 0 ? (
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const score = lead.score
            const unclaimed = isUnclaimedLead(lead)
            return (
              <Card
                key={`${lead.kind}:${lead.id}`}
                className="hover:shadow-md transition-shadow cursor-pointer hover:bg-muted dark:hover:bg-card/50"
                onClick={() => setSelectedLead(lead)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{lead.name}</h3>
                        <Badge variant="outline">{lead.kind === "property" ? "Property" : "Website"}</Badge>
                        {lead.inquiryType ? (
                          <Badge variant="outline">{lead.inquiryType.replace("_", " ")}</Badge>
                        ) : null}
                        {lead.overdueTaskCount > 0 ? (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                            {lead.overdueTaskCount} overdue
                          </Badge>
                        ) : null}
                        <TemperatureBadge temperature={score?.temperature} />
                        {score && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{score.score}/100</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{lead.email}</span>
                        </div>
                        {lead.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{formatUSPhone(lead.phone)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <Badge className={getStatusColor(lead.status)}>
                      {unclaimed ? "Unclaimed" : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Badge>
                  </div>

                  {lead.propertyTitle || lead.propertyAddress ? (
                    <div className="bg-muted dark:bg-card rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-5 w-5 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {lead.propertyTitle ?? "Linked property"}
                        </span>
                      </div>
                      {lead.propertyAddress ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {lead.propertyAddress}
                            {lead.propertyCity ? `, ${lead.propertyCity}` : ""}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {lead.message ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Message:</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{lead.message}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>Last activity: {formatUSDate(lead.lastActivityAt)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Source: {lead.source ?? "—"}</span>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                      {unclaimed ? (
                        <Button size="sm" onClick={() => void handleClaim(lead)} className="bg-orange-500 hover:bg-orange-600 text-white">
                          Claim
                        </Button>
                      ) : (
                        <Select
                          value={lead.status}
                          onValueChange={(newStatus) =>
                            void handleLeadStatusUpdate(lead, newStatus as LeadInboxStatus)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Users className="h-16 w-16" />}
              title="No leads found"
              description={
                searchTerm || statusFilter !== "all" || inboxFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Assigned and unclaimed leads will appear here"
              }
            />
          </CardContent>
        </Card>
      )}

      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onChanged={() => {
          void fetchLeads()
        }}
      />
    </div>
  )
}
