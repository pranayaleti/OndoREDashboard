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
import { Zap, Plus, DivideCircle } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface UtilityAccount {
  id: string
  type: "electricity" | "gas" | "water" | "trash"
  provider: string
  accountNumber: string
}

interface UtilityBill {
  id: string
  accountId: string
  period: string
  totalAmount: number
  allocated: boolean
  allocations?: { tenantName: string; amount: number }[]
}

const MOCK_ACCOUNTS: UtilityAccount[] = [
  { id: "1", type: "electricity", provider: "Pacific Gas & Electric", accountNumber: "4521-8800" },
  { id: "2", type: "water", provider: "City Water Authority", accountNumber: "W-003421" },
  { id: "3", type: "trash", provider: "GreenWaste Solutions", accountNumber: "GW-1192" },
]

const MOCK_BILLS: UtilityBill[] = [
  { id: "b1", accountId: "1", period: "Feb 2026", totalAmount: 42000, allocated: true, allocations: [{ tenantName: "Alice Johnson", amount: 14000 }, { tenantName: "Marcus Lee", amount: 14000 }, { tenantName: "Sara Kim", amount: 14000 }] },
  { id: "b2", accountId: "2", period: "Feb 2026", totalAmount: 18500, allocated: false },
  { id: "b3", accountId: "3", period: "Feb 2026", totalAmount: 9000, allocated: false },
]

const UTILITY_ICONS: Record<string, string> = { electricity: "⚡", gas: "🔥", water: "💧", trash: "🗑️" }

function fmt(cents: number) { return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}` }

export function UtilityBillingManager() {
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<UtilityAccount[]>(MOCK_ACCOUNTS)
  const [bills, setBills] = useState<UtilityBill[]>(MOCK_BILLS)
  const [addOpen, setAddOpen] = useState(false)
  const [allocatingId, setAllocatingId] = useState<string | null>(null)
  const [newAccount, setNewAccount] = useState({ type: "electricity", provider: "", accountNumber: "" })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [acctRes, billRes] = await Promise.allSettled([
        featureApi.utilities?.listAccounts?.(),
        featureApi.utilities?.listBills?.(),
      ])
      if (acctRes.status === "fulfilled" && Array.isArray(acctRes.value)) setAccounts(acctRes.value as UtilityAccount[])
      if (billRes.status === "fulfilled" && Array.isArray(billRes.value)) setBills(billRes.value as UtilityBill[])
    } catch { /* use mock */ }
  }

  const addAccount = async () => {
    if (!newAccount.provider || !newAccount.accountNumber) {
      toast({ title: "Please fill all fields", variant: "destructive" })
      return
    }
    const created: UtilityAccount = { id: Date.now().toString(), ...newAccount } as UtilityAccount
    try {
      await featureApi.utilities?.addAccount?.(newAccount)
    } catch { /* noop */ }
    setAccounts((prev) => [...prev, created])
    setNewAccount({ type: "electricity", provider: "", accountNumber: "" })
    setAddOpen(false)
    toast({ title: "Utility account added" })
  }

  const allocateBill = async (billId: string) => {
    setAllocatingId(billId)
    try {
      await featureApi.utilities?.allocateBill?.(billId)
    } catch { /* noop */ }
    setTimeout(() => {
      setBills((prev) => prev.map((b) =>
        b.id === billId
          ? { ...b, allocated: true, allocations: [{ tenantName: "Alice Johnson", amount: Math.floor(b.totalAmount / 3) }, { tenantName: "Marcus Lee", amount: Math.floor(b.totalAmount / 3) }, { tenantName: "Sara Kim", amount: Math.floor(b.totalAmount / 3) }] }
          : b
      ))
      setAllocatingId(null)
      toast({ title: "Bill allocated to tenants" })
    }, 800)
  }

  const accountName = (id: string) => {
    const a = accounts.find((a) => a.id === id)
    return a ? `${UTILITY_ICONS[a.type] ?? ""} ${a.type.charAt(0).toUpperCase() + a.type.slice(1)}` : id
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />Utility Accounts
          </CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />Add Account
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map((a) => (
              <div key={a.id} className="p-3 border rounded-lg space-y-1">
                <p className="font-semibold text-sm">{UTILITY_ICONS[a.type]} {a.type.charAt(0).toUpperCase() + a.type.slice(1)}</p>
                <p className="text-xs text-muted-foreground">{a.provider}</p>
                <p className="text-xs font-mono text-muted-foreground">#{a.accountNumber}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utility</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <>
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{accountName(bill.accountId)}</TableCell>
                    <TableCell>{bill.period}</TableCell>
                    <TableCell>{fmt(bill.totalAmount)}</TableCell>
                    <TableCell>
                      {bill.allocated
                        ? <Badge className="bg-green-100 text-green-700 border-green-200">Allocated</Badge>
                        : <Badge variant="secondary">Pending</Badge>}
                    </TableCell>
                    <TableCell>
                      {!bill.allocated && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={allocatingId === bill.id}
                          onClick={() => allocateBill(bill.id)}
                        >
                          <DivideCircle className="h-4 w-4 mr-1" />
                          {allocatingId === bill.id ? "Allocating..." : "Allocate"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {bill.allocated && bill.allocations && bill.allocations.map((alloc, i) => (
                    <TableRow key={`${bill.id}-alloc-${i}`} className="bg-muted/30 text-xs">
                      <TableCell />
                      <TableCell colSpan={2} className="text-muted-foreground pl-6">
                        {alloc.tenantName}
                      </TableCell>
                      <TableCell colSpan={2} className="text-muted-foreground">{fmt(alloc.amount)}</TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Utility Account</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Utility Type</Label>
              <Select value={newAccount.type} onValueChange={(v) => setNewAccount((d) => ({ ...d, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="water">Water</SelectItem>
                  <SelectItem value="trash">Trash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Provider Name</Label>
              <Input placeholder="e.g. Pacific Gas & Electric" value={newAccount.provider} onChange={(e) => setNewAccount((d) => ({ ...d, provider: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Account Number</Label>
              <Input placeholder="e.g. 4521-8800" value={newAccount.accountNumber} onChange={(e) => setNewAccount((d) => ({ ...d, accountNumber: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addAccount}>Add Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
