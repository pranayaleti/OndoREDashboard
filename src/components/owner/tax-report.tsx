import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { DollarSign, FileText, Calendar, Building, Receipt, BarChart3 } from "lucide-react"

const mockTaxData = {
  year: "2025",
  summary: {
    totalRevenue: 24000,
    totalExpenses: 4800,
    netIncome: 19200,
    depreciation: 3600,
    taxableIncome: 15600,
    estimatedTax: 3900
  },
  revenue: {
    rental: 24000,
    other: 0,
    total: 24000
  },
  deductions: [
    { category: "Property Management Fees", amount: 2400, deductible: true },
    { category: "Maintenance & Repairs", amount: 1500, deductible: true },
    { category: "Insurance", amount: 600, deductible: true },
    { category: "Property Taxes", amount: 300, deductible: true },
    { category: "Depreciation (25% of property value)", amount: 3600, deductible: true }
  ],
  depreciation: {
    total: 3600,
    method: "Straight-line",
    usefulLife: 27.5,
    basis: 99000
  },
  quarterly: [
    { quarter: "Q1", revenue: 6000, expenses: 1200, netIncome: 4800, tax: 975 },
    { quarter: "Q2", revenue: 6000, expenses: 1200, netIncome: 4800, tax: 975 },
    { quarter: "Q3", revenue: 6000, expenses: 1200, netIncome: 4800, tax: 975 },
    { quarter: "Q4", revenue: 6000, expenses: 1200, netIncome: 4800, tax: 975 }
  ]
}

export default function TaxReport() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Reports", href: "/owner/reports", icon: BarChart3 },
          { label: "Tax Report", icon: DollarSign }
        ]} />
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-400" />
          <div>
            <h1 className="text-3xl font-bold">Tax Report</h1>
            <p className="text-gray-600 dark:text-gray-400">Annual summary for tax year {mockTaxData.year}</p>
          </div>
        </div>
        <ExportPDFButton 
          fileName="tax-report-2025"
          content={{
            title: "Tax Report",
            subtitle: `Annual summary for tax year ${mockTaxData.year}`,
            summary: [
              { label: "Total Revenue", value: mockTaxData.summary.totalRevenue },
              { label: "Total Deductions", value: mockTaxData.summary.totalExpenses },
              { label: "Net Income", value: mockTaxData.summary.netIncome },
              { label: "Depreciation", value: mockTaxData.summary.depreciation },
              { label: "Taxable Income", value: mockTaxData.summary.taxableIncome },
              { label: "Estimated Tax", value: mockTaxData.summary.estimatedTax }
            ],
            sections: [
              {
                title: "Revenue Summary",
                items: [
                  { label: "Rental Income", value: mockTaxData.revenue.rental },
                  { label: "Other Income", value: mockTaxData.revenue.other },
                  { label: "Total Revenue", value: mockTaxData.revenue.total }
                ]
              },
              {
                title: "Deductions & Expenses",
                items: mockTaxData.deductions.map(d => ({
                  label: d.category,
                  value: d.amount
                }))
              },
              {
                title: "Depreciation Schedule",
                items: [
                  { label: "Depreciation Method", value: mockTaxData.depreciation.method },
                  { label: "Useful Life", value: `${mockTaxData.depreciation.usefulLife} years` },
                  { label: "Basis", value: mockTaxData.depreciation.basis },
                  { label: "Annual Depreciation", value: mockTaxData.depreciation.total }
                ]
              }
            ],
            tables: [
              {
                title: "Quarterly Breakdown",
                headers: ["Quarter", "Revenue", "Expenses", "Net Income", "Tax"],
                rows: mockTaxData.quarterly.map(q => [
                  q.quarter,
                  `$${q.revenue.toLocaleString()}`,
                  `$${q.expenses.toLocaleString()}`,
                  `$${q.netIncome.toLocaleString()}`,
                  `$${q.tax.toLocaleString()}`
                ])
              }
            ]
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <DollarSign className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-green-300 text-sm mb-1">Total Revenue</p>
            <p className="text-white text-2xl font-bold">${mockTaxData.summary.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900 to-red-800 dark:from-red-950 dark:to-red-900">
          <CardContent className="pt-6">
            <Receipt className="w-6 h-6 text-red-400 mb-2" />
            <p className="text-red-300 text-sm mb-1">Total Deductions</p>
            <p className="text-white text-2xl font-bold">${mockTaxData.summary.totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <FileText className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-green-300 text-sm mb-1">Taxable Income</p>
            <p className="text-white text-2xl font-bold">${mockTaxData.summary.taxableIncome.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 dark:from-yellow-950 dark:to-yellow-900">
          <CardContent className="pt-6">
            <DollarSign className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-yellow-300 text-sm mb-1">Estimated Tax</p>
            <p className="text-white text-2xl font-bold">${mockTaxData.summary.estimatedTax.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Revenue Summary
            </CardTitle>
            <CardDescription>Income sources for tax year {mockTaxData.year}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Rental Income</p>
                  <p className="text-sm text-gray-500">From all properties</p>
                </div>
                <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                  ${mockTaxData.revenue.rental.toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted dark:bg-card rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Other Income</p>
                  <p className="text-sm text-gray-500">Fees, penalties, etc.</p>
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-bold text-lg">
                  ${mockTaxData.revenue.other.toLocaleString()}
                </p>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-100 dark:bg-green-900/40 rounded-lg border-2 border-green-500">
                <p className="font-bold text-gray-900 dark:text-white">Total Revenue</p>
                <p className="text-green-600 dark:text-green-400 font-bold text-xl">
                  ${mockTaxData.revenue.total.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-red-500" />
              Deductions & Expenses
            </CardTitle>
            <CardDescription>Tax-deductible expenses for {mockTaxData.year}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTaxData.deductions.map((deduction, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{deduction.category}</p>
                    {deduction.deductible && (
                      <p className="text-xs text-green-600 dark:text-green-400">✓ Fully deductible</p>
                    )}
                  </div>
                  <p className="text-red-600 dark:text-red-400 font-bold">
                    ${deduction.amount.toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center p-4 bg-red-100 dark:bg-red-900/40 rounded-lg border-2 border-red-500 mt-4">
                <p className="font-bold text-gray-900 dark:text-white">Total Deductions</p>
                <p className="text-red-600 dark:text-red-400 font-bold text-xl">
                  ${mockTaxData.summary.totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Depreciation Schedule
            </CardTitle>
            <CardDescription>Property depreciation for {mockTaxData.year}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted dark:bg-card rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Depreciation Method</span>
                  <span className="font-semibold">{mockTaxData.depreciation.method}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Useful Life</span>
                  <span className="font-semibold">{mockTaxData.depreciation.usefulLife} years</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Basis</span>
                  <span className="font-semibold">${mockTaxData.depreciation.basis.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-900 dark:text-white font-bold">Annual Depreciation</span>
                  <span className="text-gray-900 dark:text-white font-bold text-lg">
                    ${mockTaxData.depreciation.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Quarterly Breakdown
            </CardTitle>
            <CardDescription>Tax estimates by quarter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTaxData.quarterly.map((q, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold">{q.quarter}</p>
                    <p className="text-yellow-600 dark:text-yellow-400 font-bold">Tax: ${q.tax.toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Revenue</p>
                      <p className="font-semibold">${q.revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Expenses</p>
                      <p className="font-semibold">${q.expenses.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Net Income</p>
                      <p className="font-semibold text-green-600">${q.netIncome.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Calculation Summary</CardTitle>
          <CardDescription>Final tax figures for {mockTaxData.year}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted dark:bg-card rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                <p className="text-xl font-bold">${mockTaxData.summary.totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Deductions</p>
                <p className="text-xl font-bold text-red-600">-${mockTaxData.summary.totalExpenses.toLocaleString()}</p>
              </div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Taxable Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${mockTaxData.summary.taxableIncome.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Estimated Tax (25%)</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    ${mockTaxData.summary.estimatedTax.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                <strong>Note:</strong> This is an estimated calculation. Please consult with a tax professional for accurate tax filing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

