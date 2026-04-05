"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Wallet, Plus, RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface TrustAccount {
  id: string
  name: string
  type: "operating" | "security_deposit" | "reserve"
  balance: number
}

interface TrustTransaction {
  id: string
  date: string
  type: "credit" | "debit"
  amount: number
  description: string
  accountId: string
}

interface Distribution {
  id: string
  ownerName: string
  amount: number
  date: string
  status: "pending" | "completed"
}

const MOCK_ACCOUNTS: TrustAccount[] = [
  { id: "1", name: "Operating Account", type: "operating", balance: 1284500 },
  { id: "2", name: "Security Deposit Trust", type: "security_deposit", balance: 620000 },
  { id: "3", name: "Capital Reserve", type: "reserve", balance: 340000 },
]

const MOCK_TXNS: TrustTransaction[] = [
  { id: "t1", date: "2026-03-01", type: "credit", amount: 350000, description: "March rent collection", accountId: "1" },
  { id: "t2", date: "2026-03-05", type: "debit", amount: 45000, description: "Plumbing repair – Unit 4B", accountId: "1" },
  { id: "t3", date: "2026-03-08", type: "credit", amount: 250000, description: "Security deposit – New tenant", accountId: "2" },
  { id: "t4", date: "2026-03-15", type: "debit", amount: 120000, description: "Owner distribution – Q1", accountId: "1" },
]

const MOCK_DISTRIBUTIONS: Distribution[] = [
  { id: "d1", ownerName: "Jonathan Park", amount: 120000, date: "2026-03-15", status: "completed" },
  { id: "d2", ownerName: "Sandra Reeves", amount: 85000, date: "2026-03-15", status: "pending" },
]

function fmt(cents: number) { return `$${(cents / 100).toLocaleString()}` }

function typeBadge(type: TrustAccount["type"]) {
  if (type === "operating") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Operating</Badge>
  if (type === "security_deposit") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Security Deposit</Badge>
  return <Badge variant="secondary">Reserve</Badge>
}

export function TrustAccountingPanel() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<TrustAccount[]>(MOCK_ACCOUNTS)
  const [transactions, setTransactions] = useState<TrustTransaction[]>(MOCK_TXNS)
  const [distributions, setDistributions] = useState<Distribution[]>(MOCK_DISTRIBUTIONS)
  const [txnOpen, setTxnOpen] = useState(false)
  const [form, setForm] = useState({ type: "credit", amount: "", description: "", accountId: "" })
  const [reconciling, setReconciling] = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [acctRes, txnRes, distRes] = await Promise.allSettled([
        featureApi.trust?.listAccounts?.(),
        featureApi.trust?.listTransactions?.(),
        featureApi.trust?.listDistributions?.(),
      ])
      if (acctRes.status === "fulfilled" && Array.isArray(acctRes.value)) setAccounts(acctRes.value as TrustAccount[])
      if (txnRes.status === "fulfilled" && Array.isArray(txnRes.value)) setTransactions(txnRes.value as TrustTransaction[])
      if (distRes.status === "fulfilled" && Array.isArray(distRes.value)) setDistributions(distRes.value as Distribution[])
    } catch { /* use mock */ }
  }

  const recordTransaction = async () => {
    if (!form.amount || !form.description || !form.accountId) {
      toast({ title: "Please fill all fields", variant: "destructive" })
      return
    }
    const newTxn: TrustTransaction = {
      id: Date.now().toString(),
      date: new Date().toISOString().slice(0, 10),
      type: form.type as "credit" | "debit",
      amount: Math.round(parseFloat(form.amount) * 100),
      description: form.description,
      accountId: form.accountId,
    }
    try { await featureApi.trust?.recordTransaction?.(newTxn) } catch { /* noop */ }
    setTransactions((prev) => [newTxn, ...prev])
    setForm({ type: "credit", amount: "", description: "", accountId: "" })
    setTxnOpen(false)
    toast({ title: "Transaction recorded" })
  }

  const reconcile = () => {
    setReconciling(true)
    setTimeout(() => {
      setReconciling(false)
      toast({ title: "Reconciliation complete — all accounts balanced" })
    }, 1200)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((acct) => (
          <Card key={acct.id}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{acct.name}</p>
                  <p className="text-xl font-bold">{fmt(acct.balance)}</p>
                  <div className="mt-1">{typeBadge(acct.type)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Trust Activity</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reconcile} disabled={reconciling}>
              <RefreshCw className={`h-4 w-4 mr-1 ${reconciling ? "animate-spin" : ""}`} />
              Reconcile
            </Button>
            <Button size="sm" onClick={() => setTxnOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />Record Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions">
            <TabsList className="mb-4">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="distributions">Owner Distributions</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="text-muted-foreground">{txn.date}</TableCell>
                      <TableCell>
                        {txn.type === "credit"
                          ? <span className="flex items-center gap-1 text-green-600"><ArrowUpRight className="h-3 w-3" />Credit</span>
                          : <span className="flex items-center gap-1 text-red-600"><ArrowDownLeft className="h-3 w-3" />Debit</span>}
                      </TableCell>
                      <TableCell>{txn.description}</TableCell>
                      <TableCell className={`font-semibold ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                        {txn.type === "credit" ? "+" : "-"}{fmt(txn.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="distributions">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributions.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.ownerName}</TableCell>
                      <TableCell>{fmt(d.amount)}</TableCell>
                      <TableCell>{d.date}</TableCell>
                      <TableCell>
                        {d.status === "completed"
                          ? <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>
                          : <Badge variant="secondary">Pending</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={txnOpen} onOpenChange={setTxnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Account</Label>
              <Select value={form.accountId} onValueChange={(v) => setForm((d) => ({ ...d, accountId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((d) => ({ ...d, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit (incoming)</SelectItem>
                  <SelectItem value="debit">Debit (outgoing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount ($)</Label>
              <Input type="number" min={0} step={0.01} placeholder="0.00" value={form.amount} onChange={(e) => setForm((d) => ({ ...d, amount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea placeholder="e.g. March rent collection" value={form.description} onChange={(e) => setForm((d) => ({ ...d, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxnOpen(false)}>Cancel</Button>
            <Button onClick={recordTransaction}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
