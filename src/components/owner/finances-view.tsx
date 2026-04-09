"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/dashboard/date-picker-with-range"
import type { DateRange } from "react-day-picker"
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns"
import {
  DollarSign,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Calendar,
  Building,
  Search,
  Download,
  Loader2,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { IncomeExpenseChart } from "@/components/owner/income-expense-chart"
import { PropertyPerformanceChart } from "@/components/owner/property-performance-chart"
import { AddTransactionDialog } from "@/components/owner/add-transaction-dialog"
import { useToast } from "@/hooks/use-toast"
import { reportsApi, ownerStatementsApi } from "@/lib/api"
import type { PnLStatement, VacancyReport } from "@/lib/api/clients/reports"
import type { OwnerStatement } from "@/lib/api/clients/owner-statements"

interface Transaction {
  id: string
  date: string
  property: string
  category: string
  description: string
  amount: number
  type: "income" | "expense"
  status: "completed" | "pending"
}

function pctChange(prev: number, cur: number): string {
  if (prev === 0) return "—"
  const pct = ((cur - prev) / Math.abs(prev)) * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

function isPctPositive(prev: number, cur: number): boolean {
  return cur >= prev
}

function stmtToTransactions(
  stmt: OwnerStatement,
  propMap: Map<string, string>
): Transaction[] {
  return stmt.lineItems.map((item, i) => ({
    id: `${stmt.id}-${i}`,
    date: item.date,
    property: propMap.get(item.propertyId) ?? "Unknown Property",
    category: item.type === "income" ? "Rent" : "Expense",
    description: item.description,
    amount: Math.round(Math.abs(item.amountCents)) / 100,
    type: item.type as "income" | "expense",
    status: "completed" as const,
  }))
}

export function FinancesView() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [transactionType, setTransactionType] = useState("all")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const now = new Date()
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(now),
    to: endOfMonth(now),
  })

  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [pnlCurrent, setPnlCurrent] = useState<PnLStatement | null>(null)
  const [pnlPrevious, setPnlPrevious] = useState<PnLStatement | null>(null)
  const [pnlYtd, setPnlYtd] = useState<PnLStatement | null>(null)
  const [vacancy, setVacancy] = useState<VacancyReport | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const propMap = useMemo(
    () => new Map((pnlCurrent?.properties ?? []).map((p) => [p.propertyId, p.propertyAddress])),
    [pnlCurrent]
  )

  useEffect(() => {
    async function loadSummary() {
      setLoading(true)
      try {
        const today = new Date()
        const curStart = format(startOfMonth(today), "yyyy-MM-dd")
        const curEnd = format(endOfMonth(today), "yyyy-MM-dd")
        const prevStart = format(startOfMonth(subMonths(today, 1)), "yyyy-MM-dd")
        const prevEnd = format(endOfMonth(subMonths(today, 1)), "yyyy-MM-dd")
        const ytdStart = format(startOfYear(today), "yyyy-MM-dd")
        const ytdEnd = format(today, "yyyy-MM-dd")

        const [cur, prev, ytd, vac] = await Promise.all([
          reportsApi.getPnL({ startDate: curStart, endDate: curEnd }),
          reportsApi.getPnL({ startDate: prevStart, endDate: prevEnd }),
          reportsApi.getPnL({ startDate: ytdStart, endDate: ytdEnd }),
          reportsApi.getVacancy(),
        ])
        setPnlCurrent(cur)
        setPnlPrevious(prev)
        setPnlYtd(ytd)
        setVacancy(vac)
      } catch {
        toast({ title: "Error", description: "Failed to load financial data", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [])

  const loadTransactions = useCallback(
    async (from: Date, to: Date) => {
      setTxLoading(true)
      try {
        const stmt = await ownerStatementsApi.generate(
          format(from, "yyyy-MM-dd"),
          format(to, "yyyy-MM-dd")
        )
        setTransactions(stmtToTransactions(stmt, propMap))
      } catch {
        toast({ title: "Error", description: "Failed to load transactions", variant: "destructive" })
      } finally {
        setTxLoading(false)
      }
    },
    [propMap]
  )

  useEffect(() => {
    if (date?.from && date?.to) {
      loadTransactions(date.from, date.to)
    }
  }, [date, propMap])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = transactionType === "all" || tx.type === transactionType
      const matchesProperty = propertyFilter === "all" || tx.property === propertyFilter
      const matchesCategory = categoryFilter === "all" || tx.category === categoryFilter
      return matchesSearch && matchesType && matchesProperty && matchesCategory
    })
  }, [transactions, searchTerm, transactionType, propertyFilter, categoryFilter])

  const filteredTotals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        if (tx.type === "income") acc.income += tx.amount
        else acc.expenses += tx.amount
        return acc
      },
      { income: 0, expenses: 0 }
    )
  }, [filteredTransactions])

  const handleAddTransaction = (data: any) => {
    const newTx: Transaction = {
      id: `local-${Date.now()}`,
      date: format(new Date(), "yyyy-MM-dd"),
      property: data.property,
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
      type: data.type,
      status: "completed",
    }
    setTransactions((prev) => [newTx, ...prev])
    toast({ title: "Transaction added", description: "The transaction has been successfully recorded." })
  }

  const incomeTotal = pnlCurrent?.income.total ?? 0
  const expensesTotal = pnlCurrent?.expenses.total ?? 0
  const netIncome = pnlCurrent?.netIncome ?? 0
  const prevIncomeTotal = pnlPrevious?.income.total ?? 0
  const prevExpensesTotal = pnlPrevious?.expenses.total ?? 0
  const prevNetIncome = pnlPrevious?.netIncome ?? 0
  const occupancyRate = vacancy
    ? Math.round(((vacancy.totalUnits - vacancy.vacantUnits) / Math.max(vacancy.totalUnits, 1)) * 100)
    : 0
  const properties = pnlCurrent?.properties ?? []
  const maxNetIncome = Math.max(...properties.map((p) => p.netIncome), 1)
  const maxNegativeNet = Math.abs(Math.min(...properties.map((p) => p.netIncome), 0))

  const expenseChartData = pnlCurrent
    ? [
        { name: "Maintenance", value: pnlCurrent.expenses.maintenance, color: "#22c55e" },
        { name: "Utilities", value: pnlCurrent.expenses.utilities, color: "#a855f7" },
        { name: "Management", value: pnlCurrent.expenses.management, color: "#3b82f6" },
        { name: "Other", value: pnlCurrent.expenses.other, color: "#94a3b8" },
      ].filter((d) => d.value > 0)
    : []

  const uniqueProperties = Array.from(new Set(transactions.map((tx) => tx.property)))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${incomeTotal.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {isPctPositive(prevIncomeTotal, incomeTotal) ? (
                    <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="inline h-3 w-3 text-red-500 mr-1" />
                  )}
                  {pctChange(prevIncomeTotal, incomeTotal)} from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${expensesTotal.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {!isPctPositive(prevExpensesTotal, expensesTotal) ? (
                    <TrendingDown className="inline h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingUp className="inline h-3 w-3 text-red-500 mr-1" />
                  )}
                  {pctChange(prevExpensesTotal, expensesTotal)} from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${netIncome.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {isPctPositive(prevNetIncome, netIncome) ? (
                    <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="inline h-3 w-3 text-red-500 mr-1" />
                  )}
                  {pctChange(prevNetIncome, netIncome)} from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Income vs. Expenses</CardTitle>
                <CardDescription>Monthly financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <IncomeExpenseChart />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Performance</CardTitle>
                <CardDescription>Monthly net income by property</CardDescription>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No properties found</p>
                ) : (
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <div key={property.propertyId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="truncate max-w-[200px]" title={property.propertyAddress}>
                            {property.propertyAddress}
                          </span>
                          <span className={property.netIncome >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            ${property.netIncome.toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={property.netIncome >= 0 ? (property.netIncome / maxNetIncome) * 100 : 0}
                          className={`h-2 ${property.netIncome < 0 ? "bg-red-200" : ""}`}
                        />
                        {property.netIncome < 0 && (
                          <Progress
                            value={maxNegativeNet > 0 ? (Math.abs(property.netIncome) / maxNegativeNet) * 100 : 0}
                            className="h-2 bg-transparent"
                            indicatorClassName="bg-red-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Where your money is going</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <PropertyPerformanceChart data={expenseChartData.length > 0 ? expenseChartData : undefined} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 5).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No transactions for this period
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.slice(0, 5).map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              {new Date(tx.date + "T00:00:00").toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell>{tx.property}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              tx.type === "income"
                                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                                : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                            }`}>
                              {tx.category}
                            </span>
                          </TableCell>
                          <TableCell className={`text-right ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                            {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => setActiveTab("transactions")}>
                View All Transactions
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {uniqueProperties.map((prop) => (
                      <SelectItem key={prop} value={prop}>{prop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Rent">Rent</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <DatePickerWithRange date={date} setDate={setDate} />
              <AddTransactionDialog onAddTransaction={handleAddTransaction} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    {filteredTransactions.length} transactions found • ${filteredTotals.income.toLocaleString()} income
                    • ${filteredTotals.expenses.toLocaleString()} expenses
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          <div className="flex flex-col items-center justify-center text-muted-foreground/60">
                            <Filter className="h-10 w-10 mb-3" />
                            <p className="text-base font-medium text-foreground">No transactions found</p>
                            <p className="text-sm mt-1">Try adjusting your date range or filters to see results.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              {new Date(tx.date + "T00:00:00").toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>{tx.description}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                              {tx.property}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              tx.type === "income"
                                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                                : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                            }`}>
                              {tx.category}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                              {tx.status === "completed" ? "Completed" : "Pending"}
                            </span>
                          </TableCell>
                          <TableCell className={`text-right ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                            {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium">Financial Reports</h3>
              <p className="text-sm text-muted-foreground">Generate and view financial reports</p>
            </div>
            <div className="flex gap-2">
              <DatePickerWithRange date={date} setDate={setDate} />
              <ExportPDFButton fileName="financial-report" size="default" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Income Statement</CardTitle>
                    <CardDescription>Current month summary</CardDescription>
                  </div>
                  <BarChart className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Income</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Rental Income</span>
                        <span>${(pnlCurrent?.income.rent ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Late Fees</span>
                        <span>${(pnlCurrent?.income.lateFees ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Income</span>
                        <span>${(pnlCurrent?.income.other ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Total Income</span>
                        <span>${(pnlCurrent?.income.total ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Expenses</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Maintenance</span>
                        <span>${(pnlCurrent?.expenses.maintenance ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilities</span>
                        <span>${(pnlCurrent?.expenses.utilities ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Management</span>
                        <span>${(pnlCurrent?.expenses.management ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other</span>
                        <span>${(pnlCurrent?.expenses.other ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Total Expenses</span>
                        <span>${(pnlCurrent?.expenses.total ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium text-lg">
                      <span>Net Income</span>
                      <span className={netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                        ${netIncome.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Detailed Report
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Year-to-Date Summary</CardTitle>
                    <CardDescription>Portfolio performance since Jan 1</CardDescription>
                  </div>
                  <PieChart className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">YTD Income</span>
                    <span className="text-green-600 font-bold">${(pnlYtd?.income.total ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">YTD Expenses</span>
                    <span className="text-red-600 font-bold">${(pnlYtd?.expenses.total ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">YTD Net Income</span>
                    <span className={`font-bold ${(pnlYtd?.netIncome ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${(pnlYtd?.netIncome ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Occupancy Rate</span>
                    <span className="font-bold">{occupancyRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
