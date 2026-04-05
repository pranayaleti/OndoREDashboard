"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/dashboard/date-picker-with-range"
import type { DateRange } from "react-day-picker"
import { format, subMonths } from "date-fns"
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
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { IncomeExpenseChart } from "@/components/owner/income-expense-chart"
import { PropertyPerformanceChart } from "@/components/owner/property-performance-chart"
import { AddTransactionDialog } from "@/components/owner/add-transaction-dialog"
import { useToast } from "@/hooks/use-toast"

// Mock financial data
const FINANCIAL_SUMMARY = {
  currentMonth: {
    income: 8750,
    expenses: 3450,
    netIncome: 5300,
    occupancyRate: 85,
  },
  previousMonth: {
    income: 8400,
    expenses: 3200,
    netIncome: 5200,
    occupancyRate: 80,
  },
  ytd: {
    income: 52500,
    expenses: 20700,
    netIncome: 31800,
  },
}

// Mock transactions
const TRANSACTIONS = [
  {
    id: "txn1",
    date: "2023-05-01",
    property: "123 Main Street",
    category: "Rent",
    description: "May 2023 Rent - Unit 1",
    amount: 1700,
    type: "income",
    status: "completed",
  },
  {
    id: "txn2",
    date: "2023-05-01",
    property: "123 Main Street",
    category: "Rent",
    description: "May 2023 Rent - Unit 2",
    amount: 1700,
    type: "income",
    status: "completed",
  },
  {
    id: "txn3",
    date: "2023-05-01",
    property: "456 Oak Avenue",
    category: "Rent",
    description: "May 2023 Rent",
    amount: 1850,
    type: "income",
    status: "completed",
  },
  {
    id: "txn4",
    date: "2023-05-05",
    property: "123 Main Street",
    category: "Mortgage",
    description: "Monthly Mortgage Payment",
    amount: 1800,
    type: "expense",
    status: "completed",
  },
  {
    id: "txn5",
    date: "2023-05-10",
    property: "456 Oak Avenue",
    category: "Utilities",
    description: "Water Bill",
    amount: 120,
    type: "expense",
    status: "completed",
  },
  {
    id: "txn6",
    date: "2023-05-15",
    property: "123 Main Street",
    category: "Maintenance",
    description: "Plumbing Repair",
    amount: 350,
    type: "expense",
    status: "completed",
  },
  {
    id: "txn7",
    date: "2023-05-15",
    property: "All Properties",
    category: "Insurance",
    description: "Property Insurance Premium",
    amount: 450,
    type: "expense",
    status: "completed",
  },
  {
    id: "txn8",
    date: "2023-05-20",
    property: "456 Oak Avenue",
    category: "Maintenance",
    description: "Lawn Care Service",
    amount: 150,
    type: "expense",
    status: "completed",
  },
  {
    id: "txn9",
    date: "2023-05-25",
    property: "All Properties",
    category: "Property Management",
    description: "Property Management Fee",
    amount: 580,
    type: "expense",
    status: "completed",
  },
  {
    id: "txn10",
    date: "2023-06-01",
    property: "123 Main Street",
    category: "Rent",
    description: "June 2023 Rent - Unit 1",
    amount: 1700,
    type: "income",
    status: "pending",
  },
]

// Mock properties
const PROPERTIES = [
  {
    id: "prop1",
    name: "123 Main Street",
    income: 3400,
    expenses: 2100,
    netIncome: 1300,
    roi: 8.2,
  },
  {
    id: "prop2",
    name: "456 Oak Avenue",
    income: 1850,
    expenses: 950,
    netIncome: 900,
    roi: 7.5,
  },
  {
    id: "prop3",
    name: "789 Pine Street",
    income: 0,
    expenses: 400,
    netIncome: -400,
    roi: -2.1,
  },
]

export function FinancesView() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [transactionType, setTransactionType] = useState("all")
  const [propertyFilter, setPropertyFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [transactions, setTransactions] = useState(TRANSACTIONS)
  const [date, setDate] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })

  // Filter transactions based on search term, type, property, and category
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = transactionType === "all" || transaction.type === transactionType
    const matchesProperty = propertyFilter === "all" || transaction.property === propertyFilter
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter

    return matchesSearch && matchesType && matchesProperty && matchesCategory
  })

  // Calculate totals for filtered transactions
  const filteredTotals = filteredTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.income += transaction.amount
      } else {
        acc.expenses += transaction.amount
      }
      return acc
    },
    { income: 0, expenses: 0 },
  )

  const handleAddTransaction = (data: any) => {
    // In a real app, this would call an API to add the transaction
    const newTransaction = {
      id: `txn${transactions.length + 1}`,
      date: format(new Date(), "yyyy-MM-dd"),
      property: data.property,
      category: data.category,
      description: data.description,
      amount: Number.parseFloat(data.amount),
      type: data.type,
      status: "completed",
    }

    setTransactions([newTransaction, ...transactions])

    toast({
      title: "Transaction added",
      description: "The transaction has been successfully recorded.",
    })
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
                <div className="text-2xl font-bold">${FINANCIAL_SUMMARY.currentMonth.income.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
                  {(
                    ((FINANCIAL_SUMMARY.currentMonth.income - FINANCIAL_SUMMARY.previousMonth.income) /
                      FINANCIAL_SUMMARY.previousMonth.income) *
                    100
                  ).toFixed(1)}
                  % from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${FINANCIAL_SUMMARY.currentMonth.expenses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="inline h-3 w-3 text-red-500 mr-1" />
                  {(
                    ((FINANCIAL_SUMMARY.currentMonth.expenses - FINANCIAL_SUMMARY.previousMonth.expenses) /
                      FINANCIAL_SUMMARY.previousMonth.expenses) *
                    100
                  ).toFixed(1)}
                  % from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${FINANCIAL_SUMMARY.currentMonth.netIncome.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
                  {(
                    ((FINANCIAL_SUMMARY.currentMonth.netIncome - FINANCIAL_SUMMARY.previousMonth.netIncome) /
                      FINANCIAL_SUMMARY.previousMonth.netIncome) *
                    100
                  ).toFixed(1)}
                  % from last month
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
                <div className="space-y-4">
                  {PROPERTIES.map((property) => (
                    <div key={property.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{property.name}</span>
                        <span
                          className={
                            property.netIncome >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"
                          }
                        >
                          ${property.netIncome.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={
                          property.netIncome >= 0
                            ? (property.netIncome / Math.max(...PROPERTIES.map((p) => p.netIncome))) * 100
                            : 0
                        }
                        className={`h-2 ${property.netIncome < 0 ? "bg-red-200" : ""}`}
                      />
                      {property.netIncome < 0 && (
                        <Progress
                          value={
                            (Math.abs(property.netIncome) /
                              Math.max(
                                ...PROPERTIES.filter((p) => p.netIncome < 0).map((p) => Math.abs(p.netIncome)),
                              )) *
                            100
                          }
                          className="h-2 bg-transparent"
                          indicatorClassName="bg-red-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Where your money is going</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <PropertyPerformanceChart />
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
                  {transactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.property}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            transaction.type === "income"
                              ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                              : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                          }`}
                        >
                          {transaction.category}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`text-right ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    <SelectItem value="123 Main Street">123 Main Street</SelectItem>
                    <SelectItem value="456 Oak Avenue">456 Oak Avenue</SelectItem>
                    <SelectItem value="789 Pine Street">789 Pine Street</SelectItem>
                    <SelectItem value="All Properties">Shared Expenses</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Rent">Rent</SelectItem>
                    <SelectItem value="Mortgage">Mortgage</SelectItem>
                    <SelectItem value="Utilities">Utilities</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Insurance">Insurance</SelectItem>
                    <SelectItem value="Property Management">Property Management</SelectItem>
                    <SelectItem value="Taxes">Taxes</SelectItem>
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
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                            {transaction.property}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              transaction.type === "income"
                                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
                                : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                            }`}
                          >
                            {transaction.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              transaction.status === "completed"
                                ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20"
                                : "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20"
                            }`}
                          >
                            {transaction.status === "completed" ? "Completed" : "Pending"}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`text-right ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                        >
                          {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
                    <CardDescription>Summary of income and expenses</CardDescription>
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
                        <span>${(FINANCIAL_SUMMARY.currentMonth.income * 0.95).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Late Fees</span>
                        <span>${(FINANCIAL_SUMMARY.currentMonth.income * 0.03).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Income</span>
                        <span>${(FINANCIAL_SUMMARY.currentMonth.income * 0.02).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Total Income</span>
                        <span>${FINANCIAL_SUMMARY.currentMonth.income.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Expenses</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Mortgage</span>
                        <span>${(FINANCIAL_SUMMARY.currentMonth.expenses * 0.52).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Property Management</span>
                        <span>${(FINANCIAL_SUMMARY.currentMonth.expenses * 0.17).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Insurance</span>
                        <span>${(FINANCIAL_SUMMARY.currentMonth.expenses * 0.13).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maintenance</span>
                        <span>${(FINANCIAL_SUMMARY.currentMonth.expenses * 0.1).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilities</span>
                        <span>${(FINANCIAL_SUMMARY.currentMonth.expenses * 0.08).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>Total Expenses</span>
                        <span>${FINANCIAL_SUMMARY.currentMonth.expenses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium text-lg">
                      <span>Net Income</span>
                      <span className="text-green-600">
                        ${FINANCIAL_SUMMARY.currentMonth.netIncome.toLocaleString()}
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
                    <CardTitle>Cash Flow Analysis</CardTitle>
                    <CardDescription>Monthly cash flow trends</CardDescription>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <IncomeExpenseChart />
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
                    <CardTitle>Expense Distribution</CardTitle>
                    <CardDescription>Breakdown of expenses by category</CardDescription>
                  </div>
                  <PieChart className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <PropertyPerformanceChart />
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
                    <CardTitle>Property Performance</CardTitle>
                    <CardDescription>Financial metrics by property</CardDescription>
                  </div>
                  <Building className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net Income</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PROPERTIES.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.name}</TableCell>
                        <TableCell className="text-right">${property.income.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${property.expenses.toLocaleString()}</TableCell>
                        <TableCell
                          className={`text-right ${property.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          ${property.netIncome.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${property.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {property.roi.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Detailed Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
