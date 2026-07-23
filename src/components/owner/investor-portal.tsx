"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Plus, Users, DollarSign, ChevronRight, X } from "lucide-react"
import { featureApi, propertyApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

// Values mirror the backend CHECK constraints on investment_deals /
// capital_calls / investor_distributions (see 20260323010000_advanced_features.sql).
type DealType = "syndication" | "joint_venture" | "fund" | "direct"
type DealStatus = "open" | "closed" | "funded" | "exited"
type CapitalCallStatus = "pending" | "sent" | "partially_funded" | "funded"
type DistributionType = "cash_flow" | "return_of_capital" | "profit" | "refinance"

interface InvestmentDeal {
  id: string
  propertyName: string | null
  dealName: string
  dealType: DealType
  targetRaiseCents: number
  totalFundedCents: number
  totalCommittedCents: number
  status: DealStatus
  investorCount: number
}

interface Investor {
  id: string
  investorId: string
  committedCents: number
  fundedCents: number
  ownershipPct: number | null
  status: string
  createdAt: string
}

interface CapitalCall {
  id: string
  callNumber: number
  amountCents: number
  dueDate: string
  purpose: string | null
  status: CapitalCallStatus
}

interface Distribution {
  id: string
  amountCents: number
  distributionType: DistributionType
  paidAt: string | null
  createdAt: string
}

interface PropertyOption {
  id: string
  label: string
}

const DEAL_TYPE_LABEL: Record<DealType, string> = {
  syndication: "Syndication",
  joint_venture: "Joint Venture",
  fund: "Fund",
  direct: "Direct",
}

const DIST_TYPE_LABEL: Record<DistributionType, string> = {
  cash_flow: "Cash Flow",
  return_of_capital: "Return of Capital",
  profit: "Profit",
  refinance: "Refinance",
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function dealStatusBadge(status: DealStatus) {
  if (status === "open") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Open</Badge>
  if (status === "funded") return <Badge className="bg-green-100 text-green-700 border-green-200">Funded</Badge>
  if (status === "exited") return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Exited</Badge>
  return <Badge variant="secondary">Closed</Badge>
}

/** Backend returns dollars-as-cents already; number fields may arrive as string. */
function toNum(v: unknown): number {
  if (typeof v === "number") return v
  if (typeof v === "string") { const n = parseFloat(v); return Number.isFinite(n) ? n : 0 }
  return 0
}

function mapDeal(row: Record<string, unknown>): InvestmentDeal {
  return {
    id: String(row.id ?? ""),
    propertyName: (row.propertyName as string | null) ?? null,
    dealName: String(row.dealName ?? "Untitled deal"),
    dealType: (row.dealType as DealType) ?? "syndication",
    targetRaiseCents: toNum(row.targetRaiseCents),
    totalFundedCents: toNum(row.totalFundedCents),
    totalCommittedCents: toNum(row.totalCommittedCents),
    status: (row.status as DealStatus) ?? "open",
    investorCount: toNum(row.investorCount),
  }
}

export function InvestorPortal() {
  const { toast } = useToast()
  const [deals, setDeals] = useState<InvestmentDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [selectedDeal, setSelectedDeal] = useState<InvestmentDeal | null>(null)
  const [investors, setInvestors] = useState<Investor[]>([])
  const [calls, setCalls] = useState<CapitalCall[]>([])
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const [dealOpen, setDealOpen] = useState(false)
  const [investorOpen, setInvestorOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [distOpen, setDistOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newDeal, setNewDeal] = useState({ propertyId: "", dealName: "", dealType: "syndication" as DealType, totalRaise: "", minInvestment: "" })
  const [newInvestor, setNewInvestor] = useState({ email: "", commitment: "" })
  const [newCall, setNewCall] = useState({ amount: "", dueDate: "", purpose: "" })
  const [newDist, setNewDist] = useState({ amount: "", type: "profit" as DistributionType })

  const loadDeals = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await featureApi.investorPortal.getDeals()
      setDeals(rows.map((r) => mapDeal(r as Record<string, unknown>)))
    } catch {
      toast({ title: "Failed to load deals", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadProperties = useCallback(async () => {
    try {
      const res = await propertyApi.getProperties(1, 100)
      setProperties(res.properties.map((p) => ({ id: p.id, label: p.title || p.addressLine1 || p.id })))
    } catch {
      // Non-fatal: deal creation still works if the owner types is unavailable,
      // but the property dropdown will be empty.
    }
  }, [])

  useEffect(() => { loadDeals(); loadProperties() }, [loadDeals, loadProperties])

  const openDeal = useCallback(async (deal: InvestmentDeal) => {
    setSelectedDeal(deal)
    setDetailLoading(true)
    try {
      const [inv, cc, dist] = await Promise.all([
        featureApi.investorPortal.getInvestors(deal.id),
        featureApi.investorPortal.getCapitalCalls(deal.id),
        featureApi.investorPortal.getDistributions(deal.id),
      ])
      setInvestors((inv as Record<string, unknown>[]).map((r) => ({
        id: String(r.id ?? ""),
        investorId: String(r.investorId ?? ""),
        committedCents: toNum(r.committedCents),
        fundedCents: toNum(r.fundedCents),
        ownershipPct: r.ownershipPct == null ? null : toNum(r.ownershipPct),
        status: String(r.status ?? "committed"),
        createdAt: String(r.createdAt ?? ""),
      })))
      setCalls((cc as Record<string, unknown>[]).map((r) => ({
        id: String(r.id ?? ""),
        callNumber: toNum(r.callNumber),
        amountCents: toNum(r.amountCents),
        dueDate: String(r.dueDate ?? ""),
        purpose: (r.purpose as string | null) ?? null,
        status: (r.status as CapitalCallStatus) ?? "pending",
      })))
      setDistributions((dist as Record<string, unknown>[]).map((r) => ({
        id: String(r.id ?? ""),
        amountCents: toNum(r.amountCents),
        distributionType: (r.distributionType as DistributionType) ?? "profit",
        paidAt: (r.paidAt as string | null) ?? null,
        createdAt: String(r.createdAt ?? ""),
      })))
    } catch {
      toast({ title: "Failed to load deal detail", variant: "destructive" })
    } finally {
      setDetailLoading(false)
    }
  }, [toast])

  const createDeal = async () => {
    if (!newDeal.propertyId || !newDeal.dealName || !newDeal.totalRaise) {
      toast({ title: "Property, deal name and target raise are required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await featureApi.investorPortal.createDeal({
        propertyId: newDeal.propertyId,
        dealName: newDeal.dealName,
        dealType: newDeal.dealType,
        targetRaiseCents: Math.round(parseFloat(newDeal.totalRaise) * 100),
        minimumInvestmentCents: newDeal.minInvestment
          ? Math.round(parseFloat(newDeal.minInvestment) * 100)
          : 100000,
      })
      setNewDeal({ propertyId: "", dealName: "", dealType: "syndication", totalRaise: "", minInvestment: "" })
      setDealOpen(false)
      toast({ title: "Investment deal created" })
      await loadDeals()
    } catch {
      toast({ title: "Failed to create deal", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const addInvestor = async () => {
    if (!selectedDeal || !newInvestor.email || !newInvestor.commitment) {
      toast({ title: "Investor email and commitment are required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await featureApi.investorPortal.addInvestor(selectedDeal.id, {
        investorEmail: newInvestor.email,
        committedCents: Math.round(parseFloat(newInvestor.commitment) * 100),
      })
      setNewInvestor({ email: "", commitment: "" })
      setInvestorOpen(false)
      toast({ title: "Investor added" })
      await openDeal(selectedDeal)
      await loadDeals()
    } catch (e) {
      const msg = e instanceof Error && /404|not found/i.test(e.message)
        ? "No account found for that email — investors must already have an Ondo account."
        : "Failed to add investor"
      toast({ title: msg, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const createCapitalCall = async () => {
    if (!selectedDeal || !newCall.amount || !newCall.dueDate) {
      toast({ title: "Amount and due date are required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await featureApi.investorPortal.createCapitalCall(selectedDeal.id, {
        amountCents: Math.round(parseFloat(newCall.amount) * 100),
        dueDate: newCall.dueDate,
        ...(newCall.purpose ? { purpose: newCall.purpose } : {}),
      })
      setNewCall({ amount: "", dueDate: "", purpose: "" })
      setCallOpen(false)
      toast({ title: "Capital call created" })
      await openDeal(selectedDeal)
    } catch {
      toast({ title: "Failed to create capital call", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const createDistribution = async () => {
    if (!selectedDeal || !newDist.amount) {
      toast({ title: "Amount is required", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await featureApi.investorPortal.createDistribution(selectedDeal.id, {
        distributionType: newDist.type,
        totalAmountCents: Math.round(parseFloat(newDist.amount) * 100),
      })
      setNewDist({ amount: "", type: "profit" })
      setDistOpen(false)
      toast({ title: "Distribution recorded" })
      await openDeal(selectedDeal)
    } catch {
      toast({ title: "Failed to record distribution", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const totalRaised = deals.reduce((s, d) => s + d.totalFundedCents, 0)
  const totalInvestors = deals.reduce((s, d) => s + d.investorCount, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="h-5 w-5 text-green-700" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Capital Funded</p>
                <p className="text-xl font-bold text-green-700">{fmt(totalRaised)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><TrendingUp className="h-5 w-5 text-blue-700" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Deals</p>
                <p className="text-xl font-bold text-blue-700">{deals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><Users className="h-5 w-5 text-purple-700" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Investor Commitments</p>
                <p className="text-xl font-bold text-purple-700">{totalInvestors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Investment Deals</CardTitle>
          <Button size="sm" onClick={() => setDealOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Create Deal
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading deals…</p>
          ) : deals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No investment deals yet. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target Raise</TableHead>
                  <TableHead>Funded %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Investors</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => {
                  const pct = deal.targetRaiseCents > 0 ? Math.round((deal.totalFundedCents / deal.targetRaiseCents) * 100) : 0
                  return (
                    <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDeal(deal)}>
                      <TableCell className="font-medium">{deal.dealName}</TableCell>
                      <TableCell className="text-muted-foreground">{deal.propertyName ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{DEAL_TYPE_LABEL[deal.dealType]}</Badge></TableCell>
                      <TableCell>{fmt(deal.targetRaiseCents)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-sm">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{dealStatusBadge(deal.status)}</TableCell>
                      <TableCell>{deal.investorCount}</TableCell>
                      <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedDeal && (
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{selectedDeal.dealName} — Deal Detail</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setInvestorOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />Add Investor
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCallOpen(true)}>Capital Call</Button>
              <Button size="sm" variant="outline" onClick={() => setDistOpen(true)}>Distribution</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDeal(null)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
            ) : (
              <Tabs defaultValue="investors">
                <TabsList className="mb-4">
                  <TabsTrigger value="investors">Investors ({investors.length})</TabsTrigger>
                  <TabsTrigger value="calls">Capital Calls ({calls.length})</TabsTrigger>
                  <TabsTrigger value="distributions">Distributions ({distributions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="investors">
                  {investors.length === 0
                    ? <p className="text-sm text-muted-foreground text-center py-6">No investors yet.</p>
                    : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Commitment</TableHead>
                            <TableHead>Funded</TableHead>
                            <TableHead>Ownership</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {investors.map((inv) => (
                            <TableRow key={inv.id}>
                              <TableCell className="font-medium">{fmt(inv.committedCents)}</TableCell>
                              <TableCell className={inv.fundedCents >= inv.committedCents && inv.committedCents > 0 ? "text-green-600 font-semibold" : ""}>{fmt(inv.fundedCents)}</TableCell>
                              <TableCell>{inv.ownershipPct != null ? `${(inv.ownershipPct * 100).toFixed(2)}%` : "—"}</TableCell>
                              <TableCell><Badge variant="secondary">{inv.status}</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                </TabsContent>

                <TabsContent value="calls">
                  {calls.length === 0
                    ? <p className="text-sm text-muted-foreground text-center py-6">No capital calls.</p>
                    : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {calls.map((call) => (
                            <TableRow key={call.id}>
                              <TableCell>{call.callNumber}</TableCell>
                              <TableCell className="font-medium">{fmt(call.amountCents)}</TableCell>
                              <TableCell>{call.dueDate}</TableCell>
                              <TableCell className="text-muted-foreground">{call.purpose ?? "—"}</TableCell>
                              <TableCell><Badge variant="secondary">{call.status}</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                </TabsContent>

                <TabsContent value="distributions">
                  {distributions.length === 0
                    ? <p className="text-sm text-muted-foreground text-center py-6">No distributions.</p>
                    : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Amount</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Paid</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {distributions.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-medium text-green-600">{fmt(d.amountCents)}</TableCell>
                              <TableCell><Badge className="bg-blue-100 text-blue-700 border-blue-200">{DIST_TYPE_LABEL[d.distributionType]}</Badge></TableCell>
                              <TableCell className="text-muted-foreground">{d.paidAt ? new Date(d.paidAt).toLocaleDateString() : "Pending"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Deal Dialog */}
      <Dialog open={dealOpen} onOpenChange={setDealOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Investment Deal</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Property *</Label>
              <Select value={newDeal.propertyId} onValueChange={(v) => setNewDeal((d) => ({ ...d, propertyId: v }))}>
                <SelectTrigger><SelectValue placeholder={properties.length ? "Select property" : "No properties available"} /></SelectTrigger>
                <SelectContent>
                  {properties.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Deal Name *</Label>
              <Input placeholder="e.g. Sunrise Syndication" value={newDeal.dealName} onChange={(e) => setNewDeal((d) => ({ ...d, dealName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Deal Type</Label>
              <Select value={newDeal.dealType} onValueChange={(v) => setNewDeal((d) => ({ ...d, dealType: v as DealType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="syndication">Syndication</SelectItem>
                  <SelectItem value="joint_venture">Joint Venture</SelectItem>
                  <SelectItem value="fund">Fund</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Target Raise ($) *</Label>
              <Input type="number" min={0} placeholder="1000000" value={newDeal.totalRaise} onChange={(e) => setNewDeal((d) => ({ ...d, totalRaise: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Minimum Investment ($)</Label>
              <Input type="number" min={0} placeholder="10000" value={newDeal.minInvestment} onChange={(e) => setNewDeal((d) => ({ ...d, minInvestment: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDealOpen(false)}>Cancel</Button>
            <Button onClick={createDeal} disabled={saving}>Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Investor Dialog */}
      <Dialog open={investorOpen} onOpenChange={setInvestorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Investor — {selectedDeal?.dealName}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Investor Email *</Label>
              <Input type="email" placeholder="investor@example.com" value={newInvestor.email} onChange={(e) => setNewInvestor((d) => ({ ...d, email: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Investor must already have an Ondo account.</p>
            </div>
            <div className="space-y-1">
              <Label>Commitment ($) *</Label>
              <Input type="number" min={0} placeholder="500000" value={newInvestor.commitment} onChange={(e) => setNewInvestor((d) => ({ ...d, commitment: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestorOpen(false)}>Cancel</Button>
            <Button onClick={addInvestor} disabled={saving}>Add Investor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Capital Call Dialog */}
      <Dialog open={callOpen} onOpenChange={setCallOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Create Capital Call</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Amount ($)</Label>
              <Input type="number" min={0} placeholder="500000" value={newCall.amount} onChange={(e) => setNewCall((d) => ({ ...d, amount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={newCall.dueDate} onChange={(e) => setNewCall((d) => ({ ...d, dueDate: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Purpose</Label>
              <Input placeholder="e.g. Phase 1 acquisition" value={newCall.purpose} onChange={(e) => setNewCall((d) => ({ ...d, purpose: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCallOpen(false)}>Cancel</Button>
            <Button onClick={createCapitalCall} disabled={saving}>Create Call</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Distribution Dialog */}
      <Dialog open={distOpen} onOpenChange={setDistOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Record Distribution</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Total Amount ($)</Label>
              <Input type="number" min={0} placeholder="100000" value={newDist.amount} onChange={(e) => setNewDist((d) => ({ ...d, amount: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Split across investors by ownership %.</p>
            </div>
            <div className="space-y-1">
              <Label>Distribution Type</Label>
              <Select value={newDist.type} onValueChange={(v) => setNewDist((d) => ({ ...d, type: v as DistributionType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_flow">Cash Flow</SelectItem>
                  <SelectItem value="profit">Profit</SelectItem>
                  <SelectItem value="return_of_capital">Return of Capital</SelectItem>
                  <SelectItem value="refinance">Refinance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistOpen(false)}>Cancel</Button>
            <Button onClick={createDistribution} disabled={saving}>Record Distribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
