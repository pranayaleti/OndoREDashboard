import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { FileText, DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react"

const mockMonthlyData = {
  month: "November 2025",
  revenue: {
    total: 2000,
    breakdown: [
      { source: "Rent Payment - Unit 101", amount: 2000 },
      { source: "Rent Payment - Unit 102", amount: 1800 },
      { source: "Rent Payment - Unit 103", amount: 2200 }
    ]
  },
  expenses: {
    total: 400,
    breakdown: [
      { category: "Maintenance", amount: 250 },
      { category: "Insurance", amount: 100 },
      { category: "Property Tax", amount: 50 }
    ]
  },
  netIncome: 1600,
  previousMonth: {
    revenue: 1950,
    expenses: 380,
    netIncome: 1570
  }
}

export default function MonthlySummaryReport() {
  const revenueChange = ((mockMonthlyData.revenue.total - mockMonthlyData.previousMonth.revenue) / mockMonthlyData.previousMonth.revenue * 100).toFixed(1)
  const expenseChange = ((mockMonthlyData.expenses.total - mockMonthlyData.previousMonth.expenses) / mockMonthlyData.previousMonth.expenses * 100).toFixed(1)
  const netIncomeChange = ((mockMonthlyData.netIncome - mockMonthlyData.previousMonth.netIncome) / mockMonthlyData.previousMonth.netIncome * 100).toFixed(1)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Reports", href: "/owner/reports", icon: BarChart3 },
          { label: "Monthly Summary", icon: BarChart3 }
        ]} />
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold">Monthly Summary Report</h1>
            <p className="text-gray-600 dark:text-gray-400">Income & expenses breakdown for {mockMonthlyData.month}</p>
          </div>
        </div>
        <ExportPDFButton 
          fileName="monthly-summary-report"
          content={{
            title: "Monthly Summary Report",
            subtitle: `Income & expenses breakdown for ${mockMonthlyData.month}`,
            summary: [
              { label: "Total Revenue", value: mockMonthlyData.revenue.total },
              { label: "Total Expenses", value: mockMonthlyData.expenses.total },
              { label: "Net Income", value: mockMonthlyData.netIncome },
              { label: "Profit Margin", value: `${((mockMonthlyData.netIncome / mockMonthlyData.revenue.total) * 100).toFixed(1)}%` },
              { label: "Expense Ratio", value: `${((mockMonthlyData.expenses.total / mockMonthlyData.revenue.total) * 100).toFixed(1)}%` }
            ],
            sections: [
              {
                title: "Revenue Breakdown",
                items: [
                  ...mockMonthlyData.revenue.breakdown.map(item => ({
                    label: item.source,
                    value: item.amount
                  })),
                  { label: "Total Revenue", value: mockMonthlyData.revenue.total }
                ]
              },
              {
                title: "Expense Breakdown",
                items: [
                  ...mockMonthlyData.expenses.breakdown.map(item => ({
                    label: item.category,
                    value: item.amount
                  })),
                  { label: "Total Expenses", value: mockMonthlyData.expenses.total }
                ]
              }
            ]
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              {parseFloat(revenueChange) >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className="text-green-300 text-sm mb-1">Total Revenue</p>
            <p className="text-white text-3xl font-bold">${mockMonthlyData.revenue.total.toLocaleString()}</p>
            <p className="text-green-400 text-xs mt-1">
              {parseFloat(revenueChange) >= 0 ? '+' : ''}{revenueChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900 to-red-800 dark:from-red-950 dark:to-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-6 h-6 text-red-400" />
              {parseFloat(expenseChange) >= 0 ? (
                <TrendingUp className="w-5 h-5 text-red-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-400" />
              )}
            </div>
            <p className="text-red-300 text-sm mb-1">Total Expenses</p>
            <p className="text-white text-3xl font-bold">${mockMonthlyData.expenses.total.toLocaleString()}</p>
            <p className="text-red-400 text-xs mt-1">
              {parseFloat(expenseChange) >= 0 ? '+' : ''}{expenseChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-green-400" />
              {parseFloat(netIncomeChange) >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className="text-green-300 text-sm mb-1">Net Income</p>
            <p className="text-white text-3xl font-bold">${mockMonthlyData.netIncome.toLocaleString()}</p>
            <p className="text-green-400 text-xs mt-1">
              {parseFloat(netIncomeChange) >= 0 ? '+' : ''}{netIncomeChange}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>Income sources for {mockMonthlyData.month}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMonthlyData.revenue.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.source}</p>
                  </div>
                  <p className="text-green-600 dark:text-green-400 font-bold text-lg">${item.amount.toLocaleString()}</p>
                </div>
              ))}
              <div className="flex justify-between items-center p-4 bg-green-100 dark:bg-green-900/40 rounded-lg border-2 border-green-500">
                <p className="font-bold text-gray-900 dark:text-white">Total Revenue</p>
                <p className="text-green-600 dark:text-green-400 font-bold text-xl">${mockMonthlyData.revenue.total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-500" />
              Expense Breakdown
            </CardTitle>
            <CardDescription>Operating expenses for {mockMonthlyData.month}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMonthlyData.expenses.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.category}</p>
                  </div>
                  <p className="text-red-600 dark:text-red-400 font-bold text-lg">${item.amount.toLocaleString()}</p>
                </div>
              ))}
              <div className="flex justify-between items-center p-4 bg-red-100 dark:bg-red-900/40 rounded-lg border-2 border-red-500">
                <p className="font-bold text-gray-900 dark:text-white">Total Expenses</p>
                <p className="text-red-600 dark:text-red-400 font-bold text-xl">${mockMonthlyData.expenses.total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Key insights for {mockMonthlyData.month}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profit Margin</p>
              <p className="text-2xl font-bold text-green-600">
                {((mockMonthlyData.netIncome / mockMonthlyData.revenue.total) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expense Ratio</p>
              <p className="text-2xl font-bold text-yellow-600">
                {((mockMonthlyData.expenses.total / mockMonthlyData.revenue.total) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cash Flow</p>
              <p className="text-2xl font-bold text-green-600">${mockMonthlyData.netIncome.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

