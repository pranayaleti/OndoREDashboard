import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/locale-format"
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
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Expense {
  id: string
  category: string
  description: string
  amountCents: number
  expenseDate: string
  taxDeductible: boolean
}

interface PnL {
  totalIncomeCents: number
  totalExpenseCents: number
  netIncomeCents: number
  taxDeductibleCents: number
  expensesByCategory: Record<string, number>
}

const categories = [
  { value: "repairs", label: "Repairs" },
  { value: "maintenance", label: "Maintenance" },
  { value: "taxes", label: "Taxes" },
  { value: "insurance", label: "Insurance" },
  { value: "hoa", label: "HOA" },
  { value: "utilities", label: "Utilities" },
  { value: "management_fee", label: "Management Fee" },
  { value: "advertising", label: "Advertising" },
  { value: "legal", label: "Legal" },
  { value: "other", label: "Other" },
]

interface ExpenseTrackerProps {
  propertyId: string
}

export function ExpenseTracker({ propertyId }: ExpenseTrackerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [pnl, setPnl] = useState<PnL | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [catFilter, setCatFilter] = useState("all")

  // Form state
  const [category, setCategory] = useState("repairs")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [taxDeductible, setTaxDeductible] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [propertyId, catFilter])

  const load = async () => {
    try {
      setLoading(true)
      const filters: Record<string, string> = {}
      if (catFilter !== "all") filters.category = catFilter
      const [expData, pnlData] = await Promise.all([
        featureApi.expenses.list(propertyId, filters),
        featureApi.expenses.getPnL(propertyId),
      ])
      setExpenses(expData as Expense[])
      const pnlResult = (pnlData as { data?: PnL })?.data ?? pnlData
      setPnl(pnlResult as PnL)
    } catch {
      toast({ title: "Failed to load expenses", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!description || !amount) return
    try {
      setSaving(true)
      await featureApi.expenses.create(propertyId, {
        category,
        description,
        amountCents: Math.round(parseFloat(amount) * 100),
        expenseDate,
        taxDeductible,
      })
      toast({ title: "Expense added" })
      setAddOpen(false)
      setDescription("")
      setAmount("")
      await load()
    } catch {
      toast({ title: "Failed to add expense", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await featureApi.expenses.remove(id)
    toast({ title: "Expense deleted" })
    load()
  }

  const fmt = (cents: number) => formatCurrency(cents / 100, "USD", { minimumFractionDigits: 2 })

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>
  }

  return (
    <div className="space-y-6">
      {/* P&L Summary */}
      {pnl && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" /> Income
              </div>
              <p className="text-xl font-bold text-green-600">{fmt(pnl.totalIncomeCents)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <TrendingDown className="h-4 w-4 text-red-500" /> Expenses
              </div>
              <p className="text-xl font-bold text-red-600">{fmt(pnl.totalExpenseCents)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <DollarSign className="h-4 w-4 text-blue-500" /> Net Income
              </div>
              <p className={`text-xl font-bold ${pnl.netIncomeCents >= 0 ? "text-green-600" : "text-red-600"}`}>
                {fmt(pnl.netIncomeCents)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <DollarSign className="h-4 w-4 text-purple-500" /> Tax Deductible
              </div>
              <p className="text-xl font-bold text-purple-600">{fmt(pnl.taxDeductibleCents)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-amber-500" /> Expenses
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No expenses recorded</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Tax Ded.</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{new Date(e.expenseDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {e.category.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{e.description}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(e.amountCents)}</TableCell>
                      <TableCell className="text-center">{e.taxDeductible ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
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

      {/* Add Expense Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a property expense for tracking and tax purposes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this expense for?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={taxDeductible} onChange={(e) => setTaxDeductible(e.target.checked)} className="rounded" />
                  <span className="text-sm">Tax Deductible</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving || !description || !amount}>
                {saving ? "Saving..." : "Add Expense"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
