import { Routes, Route, Link } from "react-router-dom"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  BarChart3, 
  TrendingUp,
  DollarSign,
  FileText,
  ExternalLink,
  ArrowRight,
  Percent
} from "lucide-react"
import MonthlySummaryReport from "./monthly-summary-report"
import OccupancyReport from "./occupancy-report"
import TaxReport from "./tax-report"
import PDFPreview from "./pdf-preview"
import { mockOccupancyData } from "./occupancy-report"
import { OccupancyReportData } from "@/utils/pdf-generator"

function ReportsList() {
  const [incomeModalOpen, setIncomeModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [occupancyModalOpen, setOccupancyModalOpen] = useState(false)
  const [revenueModalOpen, setRevenueModalOpen] = useState(false)

  const handleViewPDF = () => {
    // Generate report data
    const reportData: OccupancyReportData = {
      propertyName: "Oak Street Apartments",
      period: mockOccupancyData.period,
      summary: {
        totalUnits: mockOccupancyData.summary.totalUnits,
        occupiedUnits: mockOccupancyData.summary.occupiedUnits,
        vacantUnits: mockOccupancyData.summary.vacantUnits,
        occupancyRate: mockOccupancyData.summary.occupancyRate,
        averageRent: mockOccupancyData.summary.averageRent,
        totalMonthlyRevenue: mockOccupancyData.summary.totalMonthlyRevenue,
        averageTenancy: mockOccupancyData.trends.averageTenancy
      },
      tenants: mockOccupancyData.tenants,
      properties: mockOccupancyData.properties,
      trends: mockOccupancyData.trends
    }

    // Store data in sessionStorage first
    sessionStorage.setItem('pdfPreviewData', JSON.stringify(reportData))
    
    // Get base URL and construct full path
    const baseUrl = import.meta.env.BASE_URL || '/ondorealestateui/'
    // Remove trailing slash from baseUrl and ensure proper path construction
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    // Use window.location.origin to get the full URL
    const fullUrl = `${window.location.origin}${cleanBase}/owner/reports/pdf-preview`
    
    // Open in new tab with correct base URL
    window.open(fullUrl, '_blank')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Reports", icon: BarChart3 }]} />
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-gray-600 dark:text-gray-400" />
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate comprehensive investment performance reports</p>
        </div>
      </div>
        <Button
          onClick={handleViewPDF}
          className="bg-ondo-orange hover:bg-ondo-red text-white flex items-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          View and Download PDF (HTML)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setIncomeModalOpen(true)}
        >
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center justify-between">
              Cash on Cash Return
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Annual Return</span>
                <span className="text-gray-900 dark:text-white font-bold text-2xl">12.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Annual Cash Flow</span>
                <span className="text-green-400 font-bold">$19,200</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Invested</span>
                <span className="text-gray-900 dark:text-white font-bold">$153,600</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setExpenseModalOpen(true)}
        >
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center justify-between">
              Cap Rate
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Capitalization Rate</span>
                <span className="text-gray-900 dark:text-white font-bold text-2xl">6.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">NOI (Annual)</span>
                <span className="text-green-400 font-bold">$19,200</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Property Value</span>
                <span className="text-gray-900 dark:text-white font-bold">$282,353</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setOccupancyModalOpen(true)}
        >
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center justify-between">
              Operating Expense Ratio
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">OER</span>
                <span className="text-gray-900 dark:text-white font-bold text-2xl">20.0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Operating Expenses</span>
                <span className="text-orange-400 font-bold">$4,800</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Gross Revenue</span>
                <span className="text-gray-900 dark:text-white font-bold">$24,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setRevenueModalOpen(true)}
        >
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center justify-between">
              Gross Rent Multiplier
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">GRM</span>
                <span className="text-gray-900 dark:text-white font-bold text-2xl">11.8x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Property Value</span>
                <span className="text-green-400 font-bold">$282,353</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Annual Gross Rent</span>
                <span className="text-gray-900 dark:text-white font-bold">$24,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-ondo-orange" />
              Gross Rent Multiplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">11.8</div>
            <p className="text-sm text-gray-500 mt-1">GRM Ratio</p>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Property Value</span>
                <span className="font-semibold">$282,353</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Annual Gross Rent</span>
                <span className="font-semibold">$24,000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-ondo-orange" />
              Equity Multiple
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">1.25x</div>
            <p className="text-sm text-gray-500 mt-1">5-Year Projection</p>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Return</span>
                <span className="font-semibold">$192,000</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Initial Equity</span>
                <span className="font-semibold">$153,600</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-ondo-orange" />
              IRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">14.2%</div>
            <p className="text-sm text-gray-500 mt-1">Internal Rate of Return</p>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">5-Year Projection</span>
                <span className="font-semibold">14.2%</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">10-Year Projection</span>
                <span className="font-semibold">16.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Percent className="w-5 h-5 text-ondo-orange" />
              Operating Expense Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">20%</div>
            <p className="text-sm text-gray-500 mt-1">OER</p>
            <div className="mt-3 pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Operating Expenses</span>
                <span className="font-semibold">$4,800</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Gross Income</span>
                <span className="font-semibold">$24,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Investment Performance</CardTitle>
            <CardDescription>Key investment metrics and returns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cash on Cash Return</div>
                  <div className="text-2xl font-bold mt-1">12.5%</div>
                  <div className="text-xs text-gray-500 mt-1">Annual return on investment</div>
                </div>
                <Percent className="w-8 h-8 text-blue-500" />
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cap Rate</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">6.8%</div>
                  <div className="text-xs text-gray-500 mt-1">Capitalization rate</div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Gross Rent Multiplier</div>
                  <div className="text-2xl font-bold text-orange-600 mt-1">11.8x</div>
                  <div className="text-xs text-gray-500 mt-1">Property value to rent ratio</div>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Operating Metrics</CardTitle>
            <CardDescription>Property operations and efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Operating Expense Ratio</div>
                  <div className="text-2xl font-bold mt-1">20.0%</div>
                  <div className="text-xs text-gray-500 mt-1">Expenses to revenue ratio</div>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-500" />
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Debt Service Coverage</div>
                  <div className="text-2xl font-bold mt-1">1.6x</div>
                  <div className="text-xs text-gray-500 mt-1">DSCR ratio</div>
                </div>
                <DollarSign className="w-8 h-8 text-gray-500" />
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Profit Margin</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">80.0%</div>
                  <div className="text-xs text-gray-500 mt-1">Net profit margin</div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
          <CardHeader>
          <CardTitle className="text-xl font-semibold">Available Reports</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/owner/reports/monthly-summary">
              <Button className="bg-gray-800 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-700 p-6 rounded-lg text-left transition-all w-full h-auto">
                <div className="flex items-center gap-4">
                  <FileText className="w-8 h-8 text-gray-300 flex-shrink-0" />
                  <div>
                    <div className="text-white font-semibold text-lg">Monthly Summary</div>
                    <div className="text-gray-400 text-sm">Income & expenses</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/owner/reports/occupancy">
              <Button className="bg-gray-800 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-700 p-6 rounded-lg text-left transition-all w-full h-auto">
                <div className="flex items-center gap-4">
                  <TrendingUp className="w-8 h-8 text-gray-300 flex-shrink-0" />
                  <div>
                    <div className="text-white font-semibold text-lg">Occupancy Report</div>
                    <div className="text-gray-400 text-sm">Tenant analytics</div>
                  </div>
                </div>
              </Button>
            </Link>

            <Link to="/owner/reports/tax">
              <Button className="bg-gray-800 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-700 p-6 rounded-lg text-left transition-all w-full h-auto">
                <div className="flex items-center gap-4">
                  <DollarSign className="w-8 h-8 text-gray-300 flex-shrink-0" />
                  <div>
                    <div className="text-white font-semibold text-lg">Tax Report</div>
                    <div className="text-gray-400 text-sm">Annual summary</div>
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Income Analysis Modal */}
      <Dialog open={incomeModalOpen} onOpenChange={setIncomeModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Cash on Cash Return - Detailed Report
            </DialogTitle>
            <DialogDescription>Comprehensive cash on cash return analysis and investment performance</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Cash on Cash Return</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">12.5%</div>
                  <p className="text-sm text-gray-500 mt-1">Annual return</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Annual Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">$19,200</div>
                  <p className="text-sm text-gray-500 mt-1">Net annual income</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cash Invested</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$153,600</div>
                  <p className="text-sm text-gray-500 mt-1">Initial investment</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Calculation Breakdown</h3>
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Annual Gross Revenue</span>
                  <span className="font-bold">$24,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Annual Operating Expenses</span>
                  <span className="font-bold text-red-600">-$4,800</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Annual Net Cash Flow</span>
                    <span className="font-bold text-green-600 text-lg">$19,200</span>
                  </div>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Cash Invested</span>
                    <span className="font-bold">$153,600</span>
                  </div>
                </div>
                <div className="border-t-2 border-ondo-orange pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Cash on Cash Return</span>
                    <span className="font-bold text-2xl text-ondo-orange">12.5%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">($19,200 ÷ $153,600) × 100</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Investment Comparison</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Your Return</div>
                  <div className="text-2xl font-bold mt-1">12.5%</div>
                  <div className="text-xs text-gray-500 mt-1">Cash on cash</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Market Average</div>
                  <div className="text-2xl font-bold mt-1">8-10%</div>
                  <div className="text-xs text-gray-500 mt-1">Typical range</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expense Breakdown Modal */}
      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Cap Rate - Detailed Report
            </DialogTitle>
            <DialogDescription>Capitalization rate analysis and property valuation metrics</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Cap Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">6.8%</div>
                  <p className="text-sm text-gray-500 mt-1">Capitalization rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">NOI (Annual)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">$19,200</div>
                  <p className="text-sm text-gray-500 mt-1">Net operating income</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Property Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$282,353</div>
                  <p className="text-sm text-gray-500 mt-1">Estimated value</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cap Rate Calculation</h3>
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Annual Gross Revenue</span>
                  <span className="font-bold">$24,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Annual Operating Expenses</span>
                  <span className="font-bold text-red-600">-$4,800</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Net Operating Income (NOI)</span>
                    <span className="font-bold text-green-600 text-lg">$19,200</span>
                  </div>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Property Value</span>
                    <span className="font-bold">$282,353</span>
                  </div>
                </div>
                <div className="border-t-2 border-ondo-orange pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Cap Rate</span>
                    <span className="font-bold text-2xl text-ondo-orange">6.8%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">($19,200 ÷ $282,353) × 100</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cap Rate Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Your Cap Rate</div>
                  <div className="text-2xl font-bold mt-1">6.8%</div>
                  <div className="text-xs text-gray-500 mt-1">Current rate</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Market Range</div>
                  <div className="text-2xl font-bold mt-1">4-8%</div>
                  <div className="text-xs text-gray-500 mt-1">Typical range</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Operating Expense Ratio Modal */}
      <Dialog open={occupancyModalOpen} onOpenChange={setOccupancyModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Operating Expense Ratio - Detailed Report
            </DialogTitle>
            <DialogDescription>Comprehensive operating expense analysis and efficiency metrics</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">OER</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">20.0%</div>
                  <p className="text-sm text-gray-500 mt-1">Operating expense ratio</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Operating Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">$4,800</div>
                  <p className="text-sm text-gray-500 mt-1">Annual expenses</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Gross Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$24,000</div>
                  <p className="text-sm text-gray-500 mt-1">Annual revenue</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">OER Calculation</h3>
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Annual Operating Expenses</span>
                  <span className="font-bold">$4,800</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Annual Gross Revenue</span>
                  <span className="font-bold">$24,000</span>
                </div>
                <div className="border-t-2 border-ondo-orange pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Operating Expense Ratio</span>
                    <span className="font-bold text-2xl text-ondo-orange">20.0%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">($4,800 ÷ $24,000) × 100</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Expense Breakdown</h3>
              <div className="space-y-2">
                {[
                  { category: 'Maintenance & Repairs', amount: 3000, percentage: 62.5 },
                  { category: 'Insurance', amount: 1200, percentage: 25 },
                  { category: 'Property Tax', amount: 600, percentage: 12.5 }
                ].map((item) => (
                  <div key={item.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.category}</span>
                      <span className="font-bold">${item.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-ondo-orange h-2 rounded-full" 
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">OER Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Your OER</div>
                  <div className="text-2xl font-bold mt-1">20.0%</div>
                  <div className="text-xs text-gray-500 mt-1">Current ratio</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Industry Standard</div>
                  <div className="text-2xl font-bold mt-1">35-45%</div>
                  <div className="text-xs text-gray-500 mt-1">Typical range</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gross Rent Multiplier Modal */}
      <Dialog open={revenueModalOpen} onOpenChange={setRevenueModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Gross Rent Multiplier - Detailed Report
            </DialogTitle>
            <DialogDescription>Property valuation and rent multiplier analysis</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">GRM</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">11.8x</div>
                  <p className="text-sm text-gray-500 mt-1">Gross rent multiplier</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Property Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">$282,353</div>
                  <p className="text-sm text-gray-500 mt-1">Estimated value</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Annual Gross Rent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$24,000</div>
                  <p className="text-sm text-gray-500 mt-1">Total annual rent</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">GRM Calculation</h3>
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Property Value</span>
                  <span className="font-bold">$282,353</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Annual Gross Rent</span>
                  <span className="font-bold">$24,000</span>
                </div>
                <div className="border-t-2 border-ondo-orange pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Gross Rent Multiplier</span>
                    <span className="font-bold text-2xl text-ondo-orange">11.8x</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">$282,353 ÷ $24,000</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">GRM Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Your GRM</div>
                  <div className="text-2xl font-bold mt-1">11.8x</div>
                  <div className="text-xs text-gray-500 mt-1">Current multiplier</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Market Range</div>
                  <div className="text-2xl font-bold mt-1">8-15x</div>
                  <div className="text-xs text-gray-500 mt-1">Typical range</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Property Valuation</h3>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Estimated Property Value</div>
                <div className="text-3xl font-bold">$282,353</div>
                <p className="text-xs text-gray-500 mt-2">Based on annual gross rent of $24,000 and GRM of 11.8x</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function OwnerReports() {
  return (
    <Routes>
      <Route path="/" element={<ReportsList />} />
      <Route path="/monthly-summary" element={<MonthlySummaryReport />} />
      <Route path="/occupancy" element={<OccupancyReport />} />
      <Route path="/tax" element={<TaxReport />} />
      <Route path="/pdf-preview" element={<PDFPreview />} />
    </Routes>
  )
}
