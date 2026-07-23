"use client"

import { useState, useEffect, useCallback } from "react"
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

// account_type / transaction_type values match trustAccountingService.
type AccountType = "operating" | "security_deposit" | "reserve" | string
// Deposit-family transaction types increase the balance (see recordTransaction).
const DEPOSIT_TYPES = ["deposit", "rent_payment", "income"]

interface TrustAccount {
  id: string
  accountType: AccountType
  bankName: string | null
  accountNumberLast4: string | null
  currentBalanceCents: number
}

interface TrustTransaction {
  id: string
  accountId: string
  transactionType: string
  amountCents: number
  description: string
  balanceAfterCents: number
  postedDate: string
}

interface OwnerDistribution {
  id: string
  periodStart: string | null
  periodEnd: string | null
  grossIncomeCents: number
  netDistributionCents: number
  status: string
  paidAt: string | null
}

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v
  if (typeof v === "string") { const n = parseFloat(v); return Number.isFinite(n) ? n : 0 }
  return 0
}

function accountLabel(a: TrustAccount): string {
  const type = a.accountType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  return a.bankName ? `${type} — ${a.bankName}${a.accountNumberLast4 ? ` ••${a.accountNumberLast4}` : ""}` : type
}

function accountTypeBadge(type: AccountType) {
  if (type === "operating") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Operating</Badge>
  if (type === "security_deposit") return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Security Deposit</Badge>
  if (type === "reserve") return <Badge variant="secondary">Reserve</Badge>
  return <Badge variant="outline">{type}</Badge>
}

function isDeposit(t: string) { return DEPOSIT_TYPES.includes(t) }

export function TrustAccountingPanel() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<TrustAccount[]>([])
  const [transactions, setTransactions] = useState<TrustTransaction[]>([])
  const [distributions, setDistributions] = useState<OwnerDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [reconciling, setReconciling] = useState(false)

  const [txnOpen, setTxnOpen] = useState(false)
  const [acctOpen, setAcctOpen] = useState(false)
  const [txnForm, setTxnForm] = useState({ transactionType: "deposit", amount: "", description: "", accountId: "" })
  const [acctForm, setAcctForm] = useState({ accountType: "operating", bankName: "", accountNumberLast4: "" })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [accts, dists] = await Promise.all([
        featureApi.trustAccounting.getAccounts(),
        featureApi.ownerDistributions.getDistributions(),
      ])
      const mappedAccounts: TrustAccount[] = (accts as Record<string, unknown>[]).map((r) => ({
        id: String(r.id ?? ""),
        accountType: String(r.accountType ?? "operating"),
        bankName: (r.bankName as string | null) ?? null,
        accountNumberLast4: (r.accountNumberLast4 as string | null) ?? null,
        currentBalanceCents: toNum(r.currentBalanceCents),
      }))
      setAccounts(mappedAccounts)

      setDistributions((dists as Record<string, unknown>[]).map((r) => ({
        id: String(r.id ?? ""),
        periodStart: (r.periodStart as string | null) ?? null,
        periodEnd: (r.periodEnd as string | null) ?? null,
        grossIncomeCents: toNum(r.grossIncomeCents),
        netDistributionCents: toNum(r.netDistributionCents),
        status: String(r.status ?? "pending"),
        paidAt: (r.paidAt as string | null) ?? null,
      })))

      // Transactions are per-account; fetch for every account and merge so the
      // activity table spans the whole trust ledger.
      const txnLists = await Promise.all(
        mappedAccounts.map((a) => featureApi.trustAccounting.getTransactions(a.id).catch(() => [])),
      )
      const allTxns = txnLists.flat().map((r) => {
        const row = r as Record<string, unknown>
        return {
          id: String(row.id ?? ""),
          accountId: String(row.accountId ?? ""),
          transactionType: String(row.transactionType ?? ""),
          amountCents: toNum(row.amountCents),
          description: String(row.description ?? ""),
          balanceAfterCents: toNum(row.balanceAfterCents),
          postedDate: String(row.postedDate ?? ""),
        }
      })
      allTxns.sort((a, b) => (a.postedDate < b.postedDate ? 1 : -1))
      setTransactions(allTxns)
    } catch {
      toast({ title: "Failed to load trust accounts", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadData() }, [loadData])

  const createAccount = async () => {
    setSaving(true)
    try {
      await featureApi.trustAccounting.createAccount({
        accountType: acctForm.accountType,
        ...(acctForm.bankName ? { bankName: acctForm.bankName } : {}),
        ...(acctForm.accountNumberLast4 ? { accountNumberLast4: acctForm.accountNumberLast4 } : {}),
      })
      setAcctForm({ accountType: "operating", bankName: "", accountNumberLast4: "" })
      setAcctOpen(false)
      toast({ title: "Trust account created" })
      await loadData()
    } catch {
      toast({ title: "Failed to create account", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const recordTransaction = async () => {
    if (!txnForm.amount || !txnForm.description || !txnForm.accountId) {
      toast({ title: "Please fill all fields", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await featureApi.trustAccounting.recordTransaction(txnForm.accountId, {
        transactionType: txnForm.transactionType,
        amountCents: Math.round(parseFloat(txnForm.amount) * 100),
        description: txnForm.description,
      })
      setTxnForm({ transactionType: "deposit", amount: "", description: "", accountId: "" })
      setTxnOpen(false)
      toast({ title: "Transaction recorded" })
      await loadData()
    } catch {
      toast({ title: "Failed to record transaction", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const reconcile = async () => {
    if (accounts.length === 0) return
    setReconciling(true)
    try {
      const results = await Promise.all(
        accounts.map((a) => featureApi.trustAccounting.reconcile(a.id, a.currentBalanceCents).catch(() => null)),
      )
      const unbalanced = results.filter((r) => {
        const rec = r as { isReconciled?: boolean } | null
        return rec != null && rec.isReconciled === false
      }).length
      toast({
        title: unbalanced === 0
          ? "Reconciliation complete — all accounts balanced"
          : `Reconciliation complete — ${unbalanced} account(s) show a variance`,
        variant: unbalanced === 0 ? undefined : "destructive",
      })
    } finally {
      setReconciling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setAcctOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />New Trust Account
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading trust accounts…</p>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No trust accounts yet. Create one to start tracking balances and transactions.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((acct) => (
            <Card key={acct.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><Wallet className="h-5 w-5 text-blue-700" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">{accountLabel(acct)}</p>
                    <p className="text-xl font-bold">{fmt(acct.currentBalanceCents)}</p>
                    <div className="mt-1">{accountTypeBadge(acct.accountType)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Trust Activity</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reconcile} disabled={reconciling || accounts.length === 0}>
              <RefreshCw className={`h-4 w-4 mr-1 ${reconciling ? "animate-spin" : ""}`} />
              Reconcile
            </Button>
            <Button size="sm" onClick={() => setTxnOpen(true)} disabled={accounts.length === 0}>
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
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No transactions recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance After</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => {
                      const deposit = isDeposit(txn.transactionType)
                      return (
                        <TableRow key={txn.id}>
                          <TableCell className="text-muted-foreground">{txn.postedDate ? new Date(txn.postedDate).toLocaleDateString() : "—"}</TableCell>
                          <TableCell>
                            {deposit
                              ? <span className="flex items-center gap-1 text-green-600"><ArrowUpRight className="h-3 w-3" />{txn.transactionType}</span>
                              : <span className="flex items-center gap-1 text-red-600"><ArrowDownLeft className="h-3 w-3" />{txn.transactionType}</span>}
                          </TableCell>
                          <TableCell>{txn.description}</TableCell>
                          <TableCell className={`font-semibold ${deposit ? "text-green-600" : "text-red-600"}`}>
                            {deposit ? "+" : "-"}{fmt(txn.amountCents)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{fmt(txn.balanceAfterCents)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="distributions">
              {distributions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No owner distributions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross Income</TableHead>
                      <TableHead>Net Distribution</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-muted-foreground">{d.periodStart ?? "—"}{d.periodEnd ? ` → ${d.periodEnd}` : ""}</TableCell>
                        <TableCell>{fmt(d.grossIncomeCents)}</TableCell>
                        <TableCell className="font-semibold text-green-600">{fmt(d.netDistributionCents)}</TableCell>
                        <TableCell>
                          {d.status === "paid"
                            ? <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                            : <Badge variant="secondary">{d.status}</Badge>}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{d.paidAt ? new Date(d.paidAt).toLocaleDateString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Account Dialog */}
      <Dialog open={acctOpen} onOpenChange={setAcctOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Trust Account</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Account Type</Label>
              <Select value={acctForm.accountType} onValueChange={(v) => setAcctForm((d) => ({ ...d, accountType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operating">Operating</SelectItem>
                  <SelectItem value="security_deposit">Security Deposit</SelectItem>
                  <SelectItem value="reserve">Reserve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Bank Name</Label>
              <Input placeholder="e.g. First National" value={acctForm.bankName} onChange={(e) => setAcctForm((d) => ({ ...d, bankName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Account Number (last 4)</Label>
              <Input maxLength={4} placeholder="1234" value={acctForm.accountNumberLast4} onChange={(e) => setAcctForm((d) => ({ ...d, accountNumberLast4: e.target.value.replace(/\D/g, "").slice(0, 4) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcctOpen(false)}>Cancel</Button>
            <Button onClick={createAccount} disabled={saving}>Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Transaction Dialog */}
      <Dialog open={txnOpen} onOpenChange={setTxnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Record Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Account</Label>
              <Select value={txnForm.accountId} onValueChange={(v) => setTxnForm((d) => ({ ...d, accountId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{accountLabel(a)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={txnForm.transactionType} onValueChange={(v) => setTxnForm((d) => ({ ...d, transactionType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit (incoming)</SelectItem>
                  <SelectItem value="rent_payment">Rent Payment (incoming)</SelectItem>
                  <SelectItem value="income">Income (incoming)</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal (outgoing)</SelectItem>
                  <SelectItem value="expense">Expense (outgoing)</SelectItem>
                  <SelectItem value="distribution">Distribution (outgoing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount ($)</Label>
              <Input type="number" min={0} step={0.01} placeholder="0.00" value={txnForm.amount} onChange={(e) => setTxnForm((d) => ({ ...d, amount: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea placeholder="e.g. March rent collection" value={txnForm.description} onChange={(e) => setTxnForm((d) => ({ ...d, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxnOpen(false)}>Cancel</Button>
            <Button onClick={recordTransaction} disabled={saving}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
