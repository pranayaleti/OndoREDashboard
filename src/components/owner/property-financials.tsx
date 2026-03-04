"use client"

import { useState } from "react"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PropertyFinancialsProps {
  property: any
}

export function PropertyFinancials({ property }: PropertyFinancialsProps) {
  const [period, setPeriod] = useState("monthly")

  // Calculate financial metrics
  const financials = property.financials
  const totalExpenses = Object.values(financials?.expenses || {}).reduce((sum: number, expense: any) => sum + (Number(expense) || 0), 0) as number
  const monthlyRent = Number(financials?.monthlyRent) || 0
  const netIncome = monthlyRent - totalExpenses
  const cashFlowPercentage = monthlyRent > 0 ? (netIncome / monthlyRent) * 100 : 0
  const capRate = ((netIncome * 12) / (property.value || 300000)) * 100 // Assuming property value if not provided

  // Generate transaction history
  const currentDate = new Date()
  const transactions = [
    {
      id: "txn1",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
      description: "Rent Payment - Unit 1",
      amount: property.units[0].rent,
      type: "income",
    },
    {
      id: "txn2",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
      description: property.units.length > 1 ? "Rent Payment - Unit 2" : "Security Deposit",
      amount: property.units.length > 1 ? property.units[1].rent : property.units[0].rent * 0.5,
      type: "income",
    },
    {
      id: "txn3",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5).toISOString(),
      description: "Mortgage Payment",
      amount: financials.expenses.mortgage,
      type: "expense",
    },
    {
      id: "txn4",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10).toISOString(),
      description: "Property Insurance",
      amount: financials.expenses.insurance,
      type: "expense",
    },
    {
      id: "txn5",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15).toISOString(),
      description: "Property Management Fee",
      amount: financials.expenses.management,
      type: "expense",
    },
    {
      id: "txn6",
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 20).toISOString(),
      description: "Maintenance - Plumbing Repair",
      amount: 150,
      type: "expense",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financials.monthlyRent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />$
              {(financials.monthlyRent * 12).toLocaleString()} annually
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 text-red-500 mr-1" />${((Number(totalExpenses) || 0) * 12).toLocaleString()}{" "}
              annually
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
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />${(netIncome * 12).toLocaleString()} annually
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income Breakdown</CardTitle>
            <CardDescription>Monthly rental income by unit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {property.units.map((unit: any) => (
                <div key={unit.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{unit.name}</span>
                    <span>${unit.rent.toLocaleString()}</span>
                  </div>
                  <Progress value={(unit.rent / financials.monthlyRent) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Monthly expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(financials.expenses).map(([category, amount]: [string, any]) => (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{category}</span>
                    <span>${amount.toLocaleString()}</span>
                  </div>
                  <Progress value={(Number(totalExpenses) || 0) > 0 ? ((Number(amount) || 0) / (Number(totalExpenses) || 1)) * 100 : 0} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Recent financial transactions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={period} onValueChange={setPeriod} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
              <ExportPDFButton fileName="property-financials" size="sm" variant="outline" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    {transaction.type === "income" ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Income
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                        Expense
                      </span>
                    )}
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Metrics</CardTitle>
          <CardDescription>Key performance indicators for this property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Cash Flow</div>
              <div className="text-2xl font-bold">${netIncome.toLocaleString()}/mo</div>
              <p className="text-sm text-muted-foreground">{cashFlowPercentage.toFixed(1)}% of rental income</p>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Cap Rate</div>
              <div className="text-2xl font-bold">{capRate.toFixed(2)}%</div>
              <p className="text-sm text-muted-foreground">Based on annual net income</p>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">Cash on Cash Return</div>
              <div className="text-2xl font-bold">12.4%</div>
              <p className="text-sm text-muted-foreground">Based on initial investment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
