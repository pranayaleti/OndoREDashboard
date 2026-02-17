import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportPDFButton } from "@/components/ui/export-pdf-button"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { TrendingUp, Users, Building, BarChart3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const mockOccupancyData = {
  period: "November 2025",
  summary: {
    totalUnits: 6,
    occupiedUnits: 1,
    vacantUnits: 5,
    occupancyRate: 16.7,
    averageRent: 2000,
    totalMonthlyRevenue: 2000
  },
  tenants: [
    { name: "John Smith", unit: "Unit 101", rent: 2000, moveIn: "Jan 2024", status: "Active", leaseEnd: "Dec 2024" },
    { name: "Sarah Johnson", unit: "Unit 102", rent: 1800, moveIn: "Mar 2024", status: "Active", leaseEnd: "Feb 2025" },
    { name: "Mike Davis", unit: "Unit 103", rent: 2200, moveIn: "Feb 2024", status: "Active", leaseEnd: "Jan 2025" }
  ],
  properties: [
    { name: "Oak Street Apartments", units: 2, occupied: 1, vacant: 1, occupancyRate: 50 },
    { name: "Pine View Complex", units: 2, occupied: 0, vacant: 2, occupancyRate: 0 },
    { name: "Maple Heights", units: 2, occupied: 0, vacant: 2, occupancyRate: 0 }
  ],
  trends: {
    previousMonth: 16.7,
    change: 0,
    averageTenancy: 12,
    turnoverRate: 8.3
  }
}

export default function OccupancyReport() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Reports", href: "/owner/reports", icon: BarChart3 },
          { label: "Occupancy Report", icon: Users }
        ]} />
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold">Occupancy Report</h1>
            <p className="text-gray-600 dark:text-gray-400">Tenant analytics and occupancy metrics for {mockOccupancyData.period}</p>
          </div>
        </div>
        <ExportPDFButton 
            fileName="occupancy-report"
            content={{
            title: "Occupancy Report",
            subtitle: `Tenant analytics and occupancy metrics for ${mockOccupancyData.period}`,
            summary: [
              { label: "Total Units", value: mockOccupancyData.summary.totalUnits },
              { label: "Occupied Units", value: mockOccupancyData.summary.occupiedUnits },
              { label: "Vacant Units", value: mockOccupancyData.summary.vacantUnits },
              { label: "Occupancy Rate", value: `${mockOccupancyData.summary.occupancyRate}%` },
              { label: "Average Rent", value: mockOccupancyData.summary.averageRent },
              { label: "Monthly Revenue", value: mockOccupancyData.summary.totalMonthlyRevenue }
            ],
            tables: [
              {
                title: "Current Tenants",
                headers: ["Name", "Unit", "Rent", "Move-in", "Lease End", "Status"],
                rows: mockOccupancyData.tenants.map(t => [
                  t.name,
                  t.unit,
                  `$${t.rent.toLocaleString()}`,
                  t.moveIn,
                  t.leaseEnd,
                  t.status
                ])
              },
              {
                title: "Property Breakdown",
                headers: ["Property", "Total Units", "Occupied", "Vacant", "Occupancy Rate"],
                rows: mockOccupancyData.properties.map(p => [
                  p.name,
                  p.units.toString(),
                  p.occupied.toString(),
                  p.vacant.toString(),
                  `${p.occupancyRate}%`
                ])
              }
            ],
            sections: [
              {
                title: "Occupancy Trends",
                items: [
                  { label: "Current Rate", value: `${mockOccupancyData.summary.occupancyRate}%` },
                  { label: "Previous Month", value: `${mockOccupancyData.trends.previousMonth}%` },
                  { label: "Change", value: `${mockOccupancyData.trends.change >= 0 ? '+' : ''}${mockOccupancyData.trends.change}%` },
                  { label: "Average Tenancy", value: `${mockOccupancyData.trends.averageTenancy} months` },
                  { label: "Turnover Rate", value: `${mockOccupancyData.trends.turnoverRate}%` }
                ]
              }
            ]
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <Users className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Units</p>
            <p className="text-gray-900 dark:text-white text-3xl font-bold">{mockOccupancyData.summary.totalUnits}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <Building className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-green-300 text-sm mb-1">Occupied Units</p>
            <p className="text-white text-3xl font-bold">{mockOccupancyData.summary.occupiedUnits}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 dark:from-yellow-950 dark:to-yellow-900">
          <CardContent className="pt-6">
            <Building className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-yellow-300 text-sm mb-1">Vacant Units</p>
            <p className="text-white text-3xl font-bold">{mockOccupancyData.summary.vacantUnits}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-800 dark:from-green-950 dark:to-green-900">
          <CardContent className="pt-6">
            <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-green-300 text-sm mb-1">Occupancy Rate</p>
            <p className="text-white text-3xl font-bold">{mockOccupancyData.summary.occupancyRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Current Tenants
            </CardTitle>
            <CardDescription>Active tenant information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockOccupancyData.tenants.map((tenant, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-lg">{tenant.name}</p>
                      <p className="text-sm text-gray-500">{tenant.unit}</p>
                    </div>
                    <Badge className="bg-green-600 text-white">{tenant.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-500">Monthly Rent</p>
                      <p className="font-semibold">${tenant.rent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Move-in Date</p>
                      <p className="font-semibold">{tenant.moveIn}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lease End</p>
                      <p className="font-semibold">{tenant.leaseEnd}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tenancy Duration</p>
                      <p className="font-semibold">{mockOccupancyData.trends.averageTenancy} months</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Property Breakdown
            </CardTitle>
            <CardDescription>Occupancy by property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockOccupancyData.properties.map((property, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg">{property.name}</p>
                      <p className="text-sm text-gray-500">{property.units} total units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{property.occupancyRate}%</p>
                      <p className="text-xs text-gray-500">Occupancy</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <p className="text-gray-500 text-xs">Occupied</p>
                      <p className="font-semibold text-green-600">{property.occupied}</p>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                      <p className="text-gray-500 text-xs">Vacant</p>
                      <p className="font-semibold text-orange-600">{property.vacant}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Occupancy Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current Rate</span>
                <span className="font-bold">{mockOccupancyData.summary.occupancyRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Previous Month</span>
                <span className="font-bold">{mockOccupancyData.trends.previousMonth}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Change</span>
                <span className={`font-bold ${mockOccupancyData.trends.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {mockOccupancyData.trends.change >= 0 ? '+' : ''}{mockOccupancyData.trends.change}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Average Rent</span>
                <span className="font-bold">${mockOccupancyData.summary.averageRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Monthly Revenue</span>
                <span className="font-bold">${mockOccupancyData.summary.totalMonthlyRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Potential Revenue</span>
                <span className="font-bold text-green-600">
                  ${(mockOccupancyData.summary.averageRent * mockOccupancyData.summary.totalUnits).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tenancy Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Avg Tenancy</span>
                <span className="font-bold">{mockOccupancyData.trends.averageTenancy} months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Turnover Rate</span>
                <span className="font-bold">{mockOccupancyData.trends.turnoverRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Lease Renewals</span>
                <span className="font-bold text-green-600">85%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

