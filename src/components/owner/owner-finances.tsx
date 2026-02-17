import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  CreditCard
} from "lucide-react"

const mockFinancialData = {
  summary: {
    totalRevenue: 24000,
    totalExpenses: 4800,
    netIncome: 19200,
    annualROI: 8.5,
    portfolioValue: 8500000
  },
  monthlyBreakdown: [
    { month: "Jan", revenue: 75200, expenses: 22100, netIncome: 53100 },
    { month: "Feb", revenue: 78650, expenses: 23450, netIncome: 55200 },
    { month: "Mar", revenue: 82100, expenses: 24800, netIncome: 57300 }
  ],
  recentTransactions: [
    { type: 'income', desc: 'Rent Payment - Unit 101', amount: '+$2,000', date: 'Nov 15, 2025' },
    { type: 'expense', desc: 'Plumbing Repair', amount: '-$150', date: 'Nov 12, 2025' },
    { type: 'income', desc: 'Rent Payment - Unit 102', amount: '+$1,800', date: 'Nov 10, 2025' },
    { type: 'expense', desc: 'Property Insurance', amount: '-$300', date: 'Nov 5, 2025' },
    { type: 'income', desc: 'Rent Payment - Unit 103', amount: '+$2,200', date: 'Nov 3, 2025' }
  ]
}

export default function OwnerFinances() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Finances", icon: DollarSign }]} />
      </div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Financial Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your investment performance and cash flow</p>
        </div>
        <ExportPDFButton 
          fileName="financial-overview"
          content={{
            title: "Financial Overview",
            subtitle: "Track your investment performance and cash flow",
            summary: [
              { label: "Total Revenue", value: mockFinancialData.summary.totalRevenue },
              { label: "Total Expenses", value: mockFinancialData.summary.totalExpenses },
              { label: "Net Income", value: mockFinancialData.summary.netIncome },
              { label: "Annual ROI", value: `${mockFinancialData.summary.annualROI}%` },
              { label: "Portfolio Value", value: mockFinancialData.summary.portfolioValue }
            ],
            tables: [
              {
                title: "Recent Transactions",
                headers: ["Description", "Type", "Amount", "Date"],
                rows: mockFinancialData.recentTransactions.map(t => [
                  t.desc,
                  t.type === 'income' ? 'Income' : 'Expense',
                  t.amount,
                  t.date
                ])
              },
              {
                title: "Monthly Breakdown",
                headers: ["Month", "Revenue", "Expenses", "Net Income"],
                rows: mockFinancialData.monthlyBreakdown.map(m => [
                  m.month,
                  `$${m.revenue.toLocaleString()}`,
                  `$${m.expenses.toLocaleString()}`,
                  `$${m.netIncome.toLocaleString()}`
                ])
              }
            ]
          }}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                <p className="text-green-300 text-sm mb-1">Total Revenue</p>
                <p className="text-white text-2xl font-bold">${mockFinancialData.summary.totalRevenue.toLocaleString()}</p>
                <p className="text-green-400 text-xs">Year to date</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-900 to-red-800 dark:from-red-950 dark:to-red-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CreditCard className="w-6 h-6 text-red-400 mb-2" />
                <p className="text-red-300 text-sm mb-1">Total Expenses</p>
                <p className="text-white text-2xl font-bold">${mockFinancialData.summary.totalExpenses.toLocaleString()}</p>
                <p className="text-red-400 text-xs">Year to date</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <DollarSign className="w-6 h-6 text-green-400 mb-2" />
                <p className="text-green-300 text-sm mb-1">Net Income</p>
                <p className="text-white text-2xl font-bold">${mockFinancialData.summary.netIncome.toLocaleString()}</p>
                <p className="text-green-400 text-xs">Year to date</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <BarChart3 className="w-6 h-6 text-green-400 mb-2" />
                <p className="text-green-300 text-sm mb-1">ROI</p>
                <p className="text-white text-2xl font-bold">{mockFinancialData.summary.annualROI}%</p>
                <p className="text-green-400 text-xs">Annual return</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income">Income Analysis</TabsTrigger>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest income and expense entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockFinancialData.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div>
                      <div className="text-gray-900 dark:text-white font-medium">{transaction.desc}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">{transaction.date}</div>
                    </div>
                    <div className={`font-bold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Income Analysis</CardTitle>
              <CardDescription>Rental income performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Average</span>
                  <span className="text-gray-900 dark:text-white font-bold">$2,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Highest Month</span>
                  <span className="text-green-400 font-bold">$2,400</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Collection Rate</span>
                  <span className="text-gray-900 dark:text-white font-bold">98.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Monthly operating expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Maintenance</span>
                  <span className="text-gray-900 dark:text-white font-bold">$250</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Insurance</span>
                  <span className="text-gray-900 dark:text-white font-bold">$100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Property Tax</span>
                  <span className="text-gray-900 dark:text-white font-bold">$50</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
