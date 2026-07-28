/**
 * Tenant screening: list, detail, and initiate.
 * Used by Owner and Manager (and Admin with optional owner filter).
 * Detail rendering follows API `view` discriminator (scorecard / full / status).
 */

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Badge } from "@/components/ui/badge"
import { UserPlus, Loader2, ChevronRight } from "lucide-react"
import {
  screeningApi,
  type ScreeningViewResponse,
} from "@/lib/api/clients/screening"
import { propertyApi, authApi, type Property } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { EmptyState } from "@/components/ui/empty-state"
import {
  ScreeningViewCard,
  recommendationBadge,
} from "@/components/tenant-screening/ScreeningViewCard"

export interface OwnerOption {
  id: string
  label: string
}

export interface ScreeningListPageProps {
  /** For Admin: pass ownerId to list that owner's screenings. Owner/Manager: leave undefined. */
  ownerIdFilter?: string | null
  /** Optional owner dropdown for Admin (options + controlled value/onChange). When set, list uses ownerIdFilter. */
  ownerFilter?: {
    options: OwnerOption[]
    value: string | null
    onChange: (ownerId: string | null) => void
  }
  /** Title for the page header */
  title?: string
}

function listPrimaryLabel(s: ScreeningViewResponse): string {
  if (s.view === "status") return s.id.slice(0, 8)
  return s.tenantEmail
}

function listRecommendation(s: ScreeningViewResponse) {
  if (s.view === "status") return null
  return s.recommendation
}

export function ScreeningListPage({ ownerIdFilter, ownerFilter, title = "Tenant screening" }: ScreeningListPageProps) {
  const { toast } = useToast()
  const [screenings, setScreenings] = useState<ScreeningViewResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ScreeningViewResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [initiateOpen, setInitiateOpen] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ tenantEmail: "", tenantName: "", propertyId: "" })

  const effectiveOwnerId = ownerFilter ? ownerFilter.value : ownerIdFilter

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await screeningApi.list({
        ownerId: effectiveOwnerId ?? undefined,
        page: 1,
        limit: 100,
      })
      setScreenings(res.screenings ?? [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load screenings"
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [effectiveOwnerId, toast])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    propertyApi
      .getProperties(1, 200)
      .then((r) => setProperties(r.properties ?? []))
      .catch(() => setProperties([]))
  }, [])

  const openDetail = useCallback(async (id: string) => {
    setSelectedId(id)
    setDetailLoading(true)
    setDetail(null)
    try {
      const s = await screeningApi.get(id)
      setDetail(s)
    } catch (_e) {
      toast({ title: "Error", description: "Could not load screening details", variant: "destructive" })
      setSelectedId(null)
    } finally {
      setDetailLoading(false)
    }
  }, [toast])

  const closeDetail = useCallback(() => {
    setSelectedId(null)
    setDetail(null)
  }, [])

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.tenantEmail.trim() || !form.tenantName.trim() || !form.propertyId) {
      toast({ title: "Validation", description: "Email, name, and property are required.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await screeningApi.initiate({
        tenantEmail: form.tenantEmail.trim(),
        tenantName: form.tenantName.trim(),
        propertyId: form.propertyId,
      })
      const inviteHint = res.inviteUrl ? ` Invite link: ${res.inviteUrl}` : ""
      const payHint = res.needsPayment ? " Fee payment is required before the provider invite is sent." : ""
      toast({
        title: "Invitation sent",
        description: `Screening started for ${form.tenantEmail}.${payHint}${inviteHint}`,
      })
      setInitiateOpen(false)
      setForm({ tenantEmail: "", tenantName: "", propertyId: "" })
      fetchList()
      openDetail(res.screeningId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to initiate screening"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
          <p className="text-muted-foreground">View screening results and send new invitations.</p>
        </div>
        <Button onClick={() => setInitiateOpen(true)} className="bg-ondo-orange hover:bg-ondo-red">
          <UserPlus className="h-4 w-4 mr-2" />
          New screening
        </Button>
      </div>

      {ownerFilter && ownerFilter.options.length > 0 && (
        <div className="flex items-center gap-2">
          <Label htmlFor="screening-owner">Owner</Label>
          <Select
            value={ownerFilter.value ?? ""}
            onValueChange={(v) => ownerFilter.onChange(v || null)}
          >
            <SelectTrigger id="screening-owner" className="w-64">
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              {ownerFilter.options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!ownerFilter.value && (
            <span className="text-sm text-muted-foreground">Select an owner to view their screenings.</span>
          )}
        </div>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchList}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading screenings…</span>
          </CardContent>
        </Card>
      ) : screenings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<UserPlus className="h-12 w-12" />}
              title="No screenings yet"
              description='Click "New screening" to send an invitation to a prospective tenant.'
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Screenings</CardTitle>
            <CardDescription>Click a row to view details and recommendation.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {screenings.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openDetail(s.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 text-left transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{listPrimaryLabel(s)}</span>
                    <Badge variant="outline">{s.status}</Badge>
                    {s.view !== "status" && s.view === "scorecard" && (
                      <Badge variant="secondary">{s.creditScoreBand}</Badge>
                    )}
                    {recommendationBadge(listRecommendation(s))}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedId} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Screening details</DialogTitle>
            <DialogDescription>
              {detail && detail.view !== "status" ? detail.tenantEmail : "Loading…"}
            </DialogDescription>
          </DialogHeader>
          {detailLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {detail && !detailLoading && (
            <div className="space-y-4">
              {detail.view !== "status" && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Property ID</span>
                  <span className="truncate">{detail.propertyId}</span>
                </div>
              )}
              <ScreeningViewCard
                key={detail.id + detail.view + (detail.view !== "status" ? detail.ownerNote ?? "" : "")}
                view={detail}
                allowOwnerNoteEdit={detail.view === "full"}
                onUpdated={(next) => {
                  setDetail(next)
                  fetchList()
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Initiate dialog */}
      <Dialog open={initiateOpen} onOpenChange={setInitiateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New screening</DialogTitle>
            <DialogDescription>Send a screening invitation to a prospective tenant. They will receive a link to complete the application.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInitiate} className="space-y-4">
            <div>
              <Label htmlFor="tenantName">Tenant name</Label>
              <Input
                id="tenantName"
                value={form.tenantName}
                onChange={(e) => setForm((f) => ({ ...f, tenantName: e.target.value }))}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="tenantEmail">Tenant email</Label>
              <Input
                id="tenantEmail"
                type="email"
                value={form.tenantEmail}
                onChange={(e) => setForm((f) => ({ ...f, tenantEmail: e.target.value }))}
                placeholder="jane@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="propertyId">Property</Label>
              <Select
                value={form.propertyId}
                onValueChange={(v) => setForm((f) => ({ ...f, propertyId: v }))}
                required
              >
                <SelectTrigger id="propertyId">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title || [p.addressLine1, p.city].filter(Boolean).join(", ") || p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInitiateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** For Admin/SuperAdmin: fetches owners and shows owner filter, then ScreeningListPage. */
export function ScreeningListPageWithOwnerFilter(props: { title?: string }) {
  const [owners, setOwners] = useState<OwnerOption[]>([])
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)

  useEffect(() => {
    authApi
      .getInvitedUsers(1, 500)
      .then((res) => {
        const users = (res as { users: { id: string; role: string; isActive: boolean; firstName: string; lastName: string; email: string }[] }).users ?? []
        const list = users
          .filter((u) => u.role === "owner" && u.isActive)
          .map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName} (${u.email})` }))
        setOwners(list)
        if (list.length > 0) setSelectedOwnerId(list[0].id)
      })
      .catch(() => setOwners([]))
  }, [])

  return (
    <ScreeningListPage
      title={props.title ?? "Tenant screening"}
      ownerFilter={
        owners.length > 0
          ? { options: owners, value: selectedOwnerId, onChange: setSelectedOwnerId }
          : undefined
      }
    />
  )
}
