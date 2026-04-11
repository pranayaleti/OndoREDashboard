import { useState, useEffect } from "react"
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
  Calendar,
  DollarSign,
  Heart,
  UserPlus,
  Search,
  Filter,
  Radio
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { leadApi, authApi, type Lead } from "@/lib/api"
import { type LeadScore } from "@/lib/api/clients/lead"
import { formatUSDate, formatUSD, formatUSPhone } from "@/lib/us-format"
import { useAuth } from "@/lib/auth-context"
import { useRealtimeTable } from "@/hooks/useRealtimeTable"
import { LeadDetailDrawer } from "../leads/lead-detail-drawer"
import { EmptyState } from "@/components/ui/empty-state"

function TemperatureBadge({ temperature }: { temperature?: "HOT" | "WARM" | "COLD" }) {
  if (!temperature) return <span className="text-xs text-gray-400">—</span>;
  const styles = {
    HOT: "bg-red-100 text-red-700 border border-red-200",
    WARM: "bg-amber-100 text-amber-700 border border-amber-200",
    COLD: "bg-blue-100 text-blue-700 border border-blue-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${styles[temperature]}`}>
      {temperature}
    </span>
  );
}

export default function ManagerLeads() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [scoreMap, setScoreMap] = useState<Map<string, LeadScore | null>>(new Map())
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchLeads()
  }, [])

  // Live updates: auto-refresh when a lead is inserted or updated for this manager
  useRealtimeTable({
    table: "leads",
    events: ["INSERT", "UPDATE"],
    filterColumn: "manager_id",
    filterValue: user?.id,
    enabled: !!user?.id,
    onEvent: (payload) => {
      if (payload.eventType === "INSERT") {
        toast({
          title: "New Lead",
          description: `${(payload.new as Record<string, string>).tenant_name} submitted interest in a property.`,
          duration: 5000,
        })
      }
      fetchLeads()
    },
  })

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const fetchedLeads = await leadApi.getManagerLeads()
      setLeads(fetchedLeads)
      // Fetch scores in parallel after leads load
      const scores = await Promise.all(
        fetchedLeads.map((lead) => leadApi.getLeadScore(lead.id))
      )
      const newScoreMap = new Map(fetchedLeads.map((lead, i) => [lead.id, scores[i]]))
      setScoreMap(newScoreMap)
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
  }

  const handleLeadStatusUpdate = async (leadId: string, newStatus: Lead['status']) => {
    try {
      await leadApi.updateLeadStatus(leadId, newStatus)
      toast({
        title: "Success",
        description: "Lead status updated successfully.",
        duration: 3000,
      })
      fetchLeads()
    } catch (error) {
      console.error("Error updating lead status:", error)
      toast({
        title: "Error",
        description: "Failed to update lead status.",
        variant: "destructive",
      })
    }
  }

  const handleInviteFromLead = async (lead: Lead) => {
    try {
      await authApi.invite({ 
        email: lead.tenantEmail, 
        role: "tenant" 
      })
      toast({
        title: "Invitation Sent",
        duration: 3000,
        description: `Invitation sent to ${lead.tenantEmail}.`,
      })
    } catch (error: unknown) {
      console.error("Error sending invitation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Failed to send invitation.",
        variant: "destructive",
      })
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.tenantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Property Leads
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage tenant inquiries and leads from your properties
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-1">
          <Radio className="h-3 w-3 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, property..."
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

      {/* Leads List */}
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
            const score = scoreMap.get(lead.id)
            return (
            <Card
              key={lead.id}
              className="hover:shadow-md transition-shadow cursor-pointer hover:bg-muted dark:hover:bg-card/50"
              onClick={() => setSelectedLead(lead)}
            >
              <CardContent className="pt-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {lead.tenantName}
                      </h3>
                      <TemperatureBadge temperature={score?.temperature} />
                      {score && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{score.score}/100</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{lead.tenantEmail}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{formatUSPhone(lead.tenantPhone)}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </Badge>
                </div>

                {/* Property Information */}
                <div className="bg-muted dark:bg-card rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {lead.propertyTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>{lead.propertyAddress}, {lead.propertyCity}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {lead.propertyType} • Owner: {lead.ownerFirstName} {lead.ownerLastName}
                  </div>
                </div>

                {/* Rental Details */}
                {(lead.moveInDate || lead.monthlyBudget || lead.occupants !== undefined || lead.hasPets !== undefined) && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">
                      Rental Preferences
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {lead.moveInDate && (
                        <div className="text-center">
                          <Calendar className="h-5 w-5 text-green-600 mx-auto mb-2" />
                          <p className="text-xs text-green-600 font-medium mb-1">Move-in Date</p>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            {formatUSDate(lead.moveInDate)}
                          </p>
                        </div>
                      )}
                      {lead.monthlyBudget && (
                        <div className="text-center">
                          <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-2" />
                          <p className="text-xs text-green-600 font-medium mb-1">Monthly Budget</p>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            {formatUSD(lead.monthlyBudget)} / mo
                          </p>
                        </div>
                      )}
                      {lead.occupants !== undefined && (
                        <div className="text-center">
                          <Users className="h-5 w-5 text-green-600 mx-auto mb-2" />
                          <p className="text-xs text-green-600 font-medium mb-1">Occupants</p>
                          <p className="text-sm text-green-800 dark:text-green-200">{lead.occupants}</p>
                        </div>
                      )}
                      {lead.hasPets !== undefined && (
                        <div className="text-center">
                          <Heart className="h-5 w-5 text-green-600 mx-auto mb-2" />
                          <p className="text-xs text-green-600 font-medium mb-1">Pets</p>
                          <p className="text-sm text-green-800 dark:text-green-200">
                            {lead.hasPets ? 'Yes' : 'No'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Message */}
                {lead.message && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Message:
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{lead.message}</p>
                  </div>
                )}

                {/* Footer and Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>Submitted: {formatUSDate(lead.createdAt)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Source: {lead.source}</span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={lead.status}
                      onValueChange={(newStatus) => handleLeadStatusUpdate(lead.id, newStatus as Lead['status'])}
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

                    <Button
                      size="sm"
                      onClick={() => handleInviteFromLead(lead)}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Tenant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<Users className="h-16 w-16" />}
              title="No leads found"
              description={
                searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Tenant inquiries from your properties will appear here"
              }
              ctaLabel="Review properties"
              ctaHref="/dashboard/properties"
            />
          </CardContent>
        </Card>
      )}

      <LeadDetailDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  )
}
