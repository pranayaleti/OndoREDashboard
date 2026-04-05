"use client"

import { useState, useEffect } from "react"
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
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type DealStatus = "open" | "closing" | "funded" | "active"

interface InvestmentDeal {
  id: string
  propertyName: string
  dealType: "equity" | "debt" | "preferred_equity"
  totalRaise: number
  fundedAmount: number
  status: DealStatus
  investorCount: number
}

interface Investor {
  id: string
  dealId: string
  name: string
  email: string
  commitment: number
  funded: number
  joinedDate: string
}

interface CapitalCall {
  id: string
  dealId: string
  amount: number
  dueDate: string
  status: "pending" | "collected"
}

interface Distribution {
  id: string
  dealId: string
  amount: number
  date: string
  type: "return_of_capital" | "profit"
}

const MOCK_DEALS: InvestmentDeal[] = [
  { id: "d1", propertyName: "Sunrise Apartments", dealType: "equity", totalRaise: 150000000, fundedAmount: 112500000, status: "active", investorCount: 8 },
  { id: "d2", propertyName: "Oakwood Manor Expansion", dealType: "preferred_equity", totalRaise: 75000000, fundedAmount: 45000000, status: "open", investorCount: 4 },
  { id: "d3", propertyName: "Birchwood Flats Refi", dealType: "debt", totalRaise: 50000000, fundedAmount: 50000000, status: "funded", investorCount: 2 },
]

const MOCK_INVESTORS: Investor[] = [
  { id: "i1", dealId: "d1", name: "Greystone Capital LP", email: "deals@greystonecap.com", commitment: 40000000, funded: 40000000, joinedDate: "2025-06-15" },
  { id: "i2", dealId: "d1", name: "Westfield Family Office", email: "invest@westfield.com", commitment: 30000000, funded: 30000000, joinedDate: "2025-07-01" },
  { id: "i3", dealId: "d2", name: "Pinnacle Advisors", email: "pm@pinnacle.com", commitment: 25000000, funded: 20000000, joinedDate: "2025-11-10" },
]

const MOCK_CALLS: CapitalCall[] = [
  { id: "cc1", dealId: "d2", amount: 15000000, dueDate: "2026-04-01", status: "pending" },
]

const MOCK_DISTRIBUTIONS: Distribution[] = [
  { id: "dist1", dealId: "d1", amount: 6500000, date: "2026-03-01", type: "profit" },
  { id: "dist2", dealId: "d1", amount: 3200000, date: "2025-12-01", type: "return_of_capital" },
]

function fmt(cents: number) { return `$${(cents / 100).toLocaleString()}` }

function dealStatusBadge(status: DealStatus) {
  if (status === "active") return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>
  if (status === "open") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Open</Badge>
  if (status === "closing") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Closing</Badge>
  return <Badge variant="secondary">Funded</Badge>
}

function dealTypeBadge(type: InvestmentDeal["dealType"]) {
  if (type === "equity") return <Badge variant="outline">Equity</Badge>
  if (type === "preferred_equity") return <Badge variant="outline">Pref. Equity</Badge>
  return <Badge variant="outline">Debt</Badge>
}

export function InvestorPortal() {
  const { toast } = useToast()
  const [deals, setDeals] = useState<InvestmentDeal[]>(MOCK_DEALS)
  const [investors, setInvestors] = useState<Investor[]>(MOCK_INVESTORS)
  const [calls, setCalls] = useState<CapitalCall[]>(MOCK_CALLS)
  const [distributions, setDistributions] = useState<Distribution[]>(MOCK_DISTRIBUTIONS)
  const [selectedDeal, setSelectedDeal] = useState<InvestmentDeal | null>(null)
  const [dealOpen, setDealOpen] = useState(false)
  const [investorOpen, setInvestorOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [distOpen, setDistOpen] = useState(false)
  const [newDeal, setNewDeal] = useState({ propertyName: "", dealType: "equity", totalRaise: "" })
  const [newInvestor, setNewInvestor] = useState({ name: "", email: "", commitment: "" })
  const [newCall, setNewCall] = useState({ amount: "", dueDate: "" })
  const [newDist, setNewDist] = useState({ amount: "", type: "profit" })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [dealsRes] = await Promise.allSettled([
        featureApi.investor?.listDeals?.(),
      ])
      if (dealsRes.status === "fulfilled" && Array.isArray(dealsRes.value)) setDeals(dealsRes.value as InvestmentDeal[])
    } catch { /* use mock */ }
  }

  const createDeal = async () => {
    if (!newDeal.propertyName || !newDeal.totalRaise) {
      toast({ title: "Fill all required fields", variant: "destructive" })
      return
    }
    const deal: InvestmentDeal = {
      id: Date.now().toString(),
      propertyName: newDeal.propertyName,
      dealType: newDeal.dealType as InvestmentDeal["dealType"],
      totalRaise: Math.round(parseFloat(newDeal.totalRaise) * 100),
      fundedAmount: 0,
      status: "open",
      investorCount: 0,
    }
    try { await featureApi.investor?.createDeal?.(deal) } catch { /* noop */ }
    setDeals((prev) => [...prev, deal])
    setNewDeal({ propertyName: "", dealType: "equity", totalRaise: "" })
    setDealOpen(false)
    toast({ title: "Investment deal created" })
  }

  const addInvestor = async () => {
    if (!selectedDeal || !newInvestor.name || !newInvestor.commitment) return
    const inv: Investor = {
      id: Date.now().toString(),
      dealId: selectedDeal.id,
      name: newInvestor.name,
      email: newInvestor.email,
      commitment: Math.round(parseFloat(newInvestor.commitment) * 100),
      funded: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
    }
    try { await featureApi.investor?.addInvestor?.(inv) } catch { /* noop */ }
    setInvestors((prev) => [...prev, inv])
    setNewInvestor({ name: "", email: "", commitment: "" })
    setInvestorOpen(false)
    toast({ title: `${inv.name} added to deal` })
  }

  const createCapitalCall = async () => {
    if (!selectedDeal || !newCall.amount || !newCall.dueDate) return
    const call: CapitalCall = {
      id: Date.now().toString(),
      dealId: selectedDeal.id,
      amount: Math.round(parseFloat(newCall.amount) * 100),
      dueDate: newCall.dueDate,
      status: "pending",
    }
    try { await featureApi.investor?.createCapitalCall?.(call) } catch { /* noop */ }
    setCalls((prev) => [...prev, call])
    setNewCall({ amount: "", dueDate: "" })
    setCallOpen(false)
    toast({ title: "Capital call created" })
  }

  const createDistribution = async () => {
    if (!selectedDeal || !newDist.amount) return
    const dist: Distribution = {
      id: Date.now().toString(),
      dealId: selectedDeal.id,
      amount: Math.round(parseFloat(newDist.amount) * 100),
      date: new Date().toISOString().slice(0, 10),
      type: newDist.type as Distribution["type"],
    }
    try { await featureApi.investor?.createDistribution?.(dist) } catch { /* noop */ }
    setDistributions((prev) => [...prev, dist])
    setNewDist({ amount: "", type: "profit" })
    setDistOpen(false)
    toast({ title: "Distribution recorded" })
  }

  const dealInvestors = selectedDeal ? investors.filter((i) => i.dealId === selectedDeal.id) : []
  const dealCalls = selectedDeal ? calls.filter((c) => c.dealId === selectedDeal.id) : []
  const dealDists = selectedDeal ? distributions.filter((d) => d.dealId === selectedDeal.id) : []

  const totalRaised = deals.reduce((s, d) => s + d.fundedAmount, 0)
  const totalInvestors = new Set(investors.map((i) => i.name)).size

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Capital Raised</p>
                <p className="text-xl font-bold text-green-700">{fmt(totalRaised)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Deals</p>
                <p className="text-xl font-bold text-blue-700">{deals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Investors</p>
                <p className="text-xl font-bold text-purple-700">{totalInvestors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Investment Deals</CardTitle>
          <Button size="sm" onClick={() => setDealOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Create Deal
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Raise</TableHead>
                <TableHead>Funded %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Investors</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => {
                const pct = deal.totalRaise > 0 ? Math.round((deal.fundedAmount / deal.totalRaise) * 100) : 0
                return (
                  <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDeal(deal)}>
                    <TableCell className="font-medium">{deal.propertyName}</TableCell>
                    <TableCell>{dealTypeBadge(deal.dealType)}</TableCell>
                    <TableCell>{fmt(deal.totalRaise)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{dealStatusBadge(deal.status)}</TableCell>
                    <TableCell>{deal.investorCount}</TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deal Detail Drawer */}
      {selectedDeal && (
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{selectedDeal.propertyName} — Deal Detail</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setInvestorOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />Add Investor
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCallOpen(true)}>Capital Call</Button>
              <Button size="sm" variant="outline" onClick={() => setDistOpen(true)}>Distribution</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDeal(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="investors">
              <TabsList className="mb-4">
                <TabsTrigger value="investors">Investors ({dealInvestors.length})</TabsTrigger>
                <TabsTrigger value="calls">Capital Calls ({dealCalls.length})</TabsTrigger>
                <TabsTrigger value="distributions">Distributions ({dealDists.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="investors">
                {dealInvestors.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-6">No investors yet.</p>
                  : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Investor</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Commitment</TableHead>
                          <TableHead>Funded</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dealInvestors.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-medium">{inv.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{inv.email}</TableCell>
                            <TableCell>{fmt(inv.commitment)}</TableCell>
                            <TableCell className={inv.funded >= inv.commitment ? "text-green-600 font-semibold" : ""}>{fmt(inv.funded)}</TableCell>
                            <TableCell className="text-muted-foreground">{inv.joinedDate}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
              </TabsContent>

              <TabsContent value="calls">
                {dealCalls.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-6">No capital calls.</p>
                  : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dealCalls.map((call) => (
                          <TableRow key={call.id}>
                            <TableCell className="font-medium">{fmt(call.amount)}</TableCell>
                            <TableCell>{call.dueDate}</TableCell>
                            <TableCell>
                              {call.status === "collected"
                                ? <Badge className="bg-green-100 text-green-700 border-green-200">Collected</Badge>
                                : <Badge variant="secondary">Pending</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
              </TabsContent>

              <TabsContent value="distributions">
                {dealDists.length === 0
                  ? <p className="text-sm text-muted-foreground text-center py-6">No distributions.</p>
                  : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dealDists.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium text-green-600">{fmt(d.amount)}</TableCell>
                            <TableCell>{d.date}</TableCell>
                            <TableCell>
                              {d.type === "profit"
                                ? <Badge className="bg-blue-100 text-blue-700 border-blue-200">Profit</Badge>
                                : <Badge variant="secondary">Return of Capital</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Create Deal Dialog */}
      <Dialog open={dealOpen} onOpenChange={setDealOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Create Investment Deal</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Property Name *</Label>
              <Input placeholder="e.g. Sunrise Apartments" value={newDeal.propertyName} onChange={(e) => setNewDeal((d) => ({ ...d, propertyName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Deal Type</Label>
              <Select value={newDeal.dealType} onValueChange={(v) => setNewDeal((d) => ({ ...d, dealType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="preferred_equity">Preferred Equity</SelectItem>
                  <SelectItem value="debt">Debt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Total Raise ($) *</Label>
              <Input type="number" min={0} placeholder="1000000" value={newDeal.totalRaise} onChange={(e) => setNewDeal((d) => ({ ...d, totalRaise: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDealOpen(false)}>Cancel</Button>
            <Button onClick={createDeal}>Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Investor Dialog */}
      <Dialog open={investorOpen} onOpenChange={setInvestorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Investor — {selectedDeal?.propertyName}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Investor / Entity Name *</Label>
              <Input placeholder="e.g. Greystone Capital LP" value={newInvestor.name} onChange={(e) => setNewInvestor((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" placeholder="deals@example.com" value={newInvestor.email} onChange={(e) => setNewInvestor((d) => ({ ...d, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Commitment ($) *</Label>
              <Input type="number" min={0} placeholder="500000" value={newInvestor.commitment} onChange={(e) => setNewInvestor((d) => ({ ...d, commitment: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestorOpen(false)}>Cancel</Button>
            <Button onClick={addInvestor}>Add Investor</Button>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCallOpen(false)}>Cancel</Button>
            <Button onClick={createCapitalCall}>Create Call</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Distribution Dialog */}
      <Dialog open={distOpen} onOpenChange={setDistOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Record Distribution</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Amount ($)</Label>
              <Input type="number" min={0} placeholder="100000" value={newDist.amount} onChange={(e) => setNewDist((d) => ({ ...d, amount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Distribution Type</Label>
              <Select value={newDist.type} onValueChange={(v) => setNewDist((d) => ({ ...d, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Profit</SelectItem>
                  <SelectItem value="return_of_capital">Return of Capital</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistOpen(false)}>Cancel</Button>
            <Button onClick={createDistribution}>Record Distribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
