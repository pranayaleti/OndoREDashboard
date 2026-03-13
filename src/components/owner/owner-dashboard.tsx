import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, DollarSign, Users, FileText, BarChart3, AlertTriangle, Plus, MessageSquare, Wrench, ArrowUp, Calendar, Home, FolderOpen, Loader2, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { propertyApi, type Property } from "@/lib/api"
import { HomeCareRemindersCard } from "@/components/HomeCareRemindersCard"
import { ModernPropertyCard } from "./modern-property-card"
import { PropertyDetailModal } from "@/components/property-detail-modal"
import { useWelcomeToast } from "@/hooks/use-welcome-toast"

// Extended property interface for dashboard
interface DashboardProperty extends Property {
  units?: number;
  occupied?: number;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
  netIncome?: number;
  managementCompany?: string;
  currentValue?: number;
}

// Mock data for features not yet implemented
const mockStaticData = {
  recentActivity: [
    { id: 1, type: "payment", message: "Monthly management report received", time: "2 hours ago", property: "Property Management" },
    { id: 2, type: "maintenance", message: "Maintenance request submitted", time: "1 day ago", property: "Property Management", cost: 350 },
    { id: 3, type: "tenant", message: "New tenant inquiry received", time: "2 days ago", property: "Property Management" },
    { id: 4, type: "financial", message: "Monthly reports available", time: "3 days ago", property: "All Properties" }
  ],
  alerts: [
    { id: 1, type: "financial", message: "Property insurance renewal due", priority: "high", dueDate: "December 1, 2025" },
    { id: 2, type: "maintenance", message: "Property maintenance scheduled", priority: "medium", dueDate: "November 25, 2025" },
    { id: 3, type: "legal", message: "Document review required", priority: "medium", dueDate: "November 30, 2025" }
  ],
  unreadMessages: 3,
  maintenanceRequests: {
    active: 5,
    completedThisMonth: 3
  },
  recentPayments: [
    { id: 1, tenant: "John Smith", date: "May 1, 2023", amount: 1250.00 },
    { id: 2, tenant: "Sarah Johnson", date: "May 1, 2023", amount: 950.00 },
    { id: 3, tenant: "Michael Brown", date: "May 2, 2023", amount: 1100.00 }
  ],
  upcomingEvents: [
    { id: 1, type: "Lease Renewal", property: "123 Main St", date: "May 15, 2023" },
    { id: 2, type: "Property Inspection", property: "456 Oak Ave", date: "May 20, 2023" },
    { id: 3, type: "Insurance Payment Due", property: "All Properties", date: "May 31, 2023" }
  ],
  lastMonthRevenue: 0 // Will be calculated
}

export default function OwnerDashboard() {
  const { user } = useAuth()
  useWelcomeToast() // Show welcome toast on dashboard visit
  const [activeTab, setActiveTab] = useState("overview")
  const [properties, setProperties] = useState<DashboardProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showPropertyDetail, setShowPropertyDetail] = useState(false)
  const [portfolioStats, setPortfolioStats] = useState({
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netIncome: 0,
    occupancyRate: 0,
    propertyTypeBreakdown: { singleFamily: 0, apartments: 0, other: 0 },
    revenueTrend: 0, // Percentage change from last month
    expenseBreakdown: {
      maintenance: 0,
      utilities: 0,
      propertyManagement: 0,
      insurance: 0
    }
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const res = await propertyApi.getProperties()
      const data = res.properties
      // Filter for owner's properties (all statuses - pending, approved, rejected)
      const ownerProperties = data.filter((property: Property) => 
        property.ownerId === user.id
      )
      
      // Transform properties for dashboard display
      const dashboardProperties: DashboardProperty[] = ownerProperties.map(property => {
        // Each property counts as 1 unit
        const units = 1
        // Occupied if it has a tenant
        const occupied = property.tenantId ? 1 : 0
        // Monthly revenue is the property's price if occupied
        const monthlyRevenue = property.tenantId ? (property.price || 0) : 0
        // Estimate expenses as 20% of revenue (management fees, maintenance, etc.)
        const monthlyExpenses = monthlyRevenue * 0.2
        
        return {
          ...property,
          units,
          occupied,
          monthlyRevenue,
          monthlyExpenses,
          netIncome: monthlyRevenue - monthlyExpenses,
        }
      })
      
      type PortfolioStatsState = {
        totalProperties: number;
        totalUnits: number;
        occupiedUnits: number;
        monthlyRevenue: number;
        monthlyExpenses: number;
        netIncome: number;
        occupancyRate: number;
        propertyTypeBreakdown: { singleFamily: number; apartments: number; other: number };
        revenueTrend: number;
        expenseBreakdown: { maintenance: number; utilities: number; propertyManagement: number; insurance: number };
      };
      const initialState: PortfolioStatsState = {
        totalProperties: 0,
        totalUnits: 0,
        occupiedUnits: 0,
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        netIncome: 0,
        occupancyRate: 0,
        propertyTypeBreakdown: { singleFamily: 0, apartments: 0, other: 0 },
        revenueTrend: 0,
        expenseBreakdown: {
          maintenance: 0,
          utilities: 0,
          propertyManagement: 0,
          insurance: 0
        }
      };
      const stats = dashboardProperties.reduce<PortfolioStatsState>((acc, property) => {
        acc.totalProperties += 1;
        acc.totalUnits += property.units ?? 0;
        acc.occupiedUnits += property.occupied ?? 0;
        acc.monthlyRevenue += property.monthlyRevenue ?? 0;
        acc.monthlyExpenses += property.monthlyExpenses ?? 0;
        acc.netIncome += property.netIncome ?? 0;

        const propertyType = property.type?.toLowerCase() ?? "";
        if (propertyType.includes("single") || propertyType.includes("family") || propertyType.includes("house")) {
          acc.propertyTypeBreakdown.singleFamily += 1;
        } else if (propertyType.includes("apartment") || propertyType.includes("unit")) {
          acc.propertyTypeBreakdown.apartments += 1;
        } else {
          acc.propertyTypeBreakdown.other += 1;
        }

        return acc;
      }, initialState);
      
      // Calculate occupancy rate based on actual occupancy
      stats.occupancyRate = stats.totalProperties > 0 ? (stats.occupiedUnits / stats.totalProperties) * 100 : 0
      
      // Calculate expense breakdown (mock percentages for now)
      stats.expenseBreakdown.maintenance = stats.monthlyExpenses * 0.36 // ~36%
      stats.expenseBreakdown.utilities = stats.monthlyExpenses * 0.26 // ~26%
      stats.expenseBreakdown.propertyManagement = stats.monthlyExpenses * 0.24 // ~24%
      stats.expenseBreakdown.insurance = stats.monthlyExpenses * 0.13 // ~13%
      
      // Calculate revenue trend (mock 4.3% increase for now)
      stats.revenueTrend = 4.3
      
      setProperties(dashboardProperties)
      setPortfolioStats(stats)
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property)
    setShowPropertyDetail(true)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "payment":
      case "financial":
        return <DollarSign className="h-4 w-4 text-green-500" />
      case "maintenance":
        return <Building className="h-4 w-4 text-orange-500" />
      case "tenant":
        return <Users className="h-4 w-4 text-blue-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 md:mt-2">
          Your investment portfolio overview
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioStats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {portfolioStats.propertyTypeBreakdown.singleFamily > 0 && `${portfolioStats.propertyTypeBreakdown.singleFamily} single-family`}
              {portfolioStats.propertyTypeBreakdown.singleFamily > 0 && portfolioStats.propertyTypeBreakdown.apartments > 0 && ", "}
              {portfolioStats.propertyTypeBreakdown.apartments > 0 && `${portfolioStats.propertyTypeBreakdown.apartments} apartments`}
              {portfolioStats.propertyTypeBreakdown.singleFamily === 0 && portfolioStats.propertyTypeBreakdown.apartments === 0 && "Properties in portfolio"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioStats.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">{portfolioStats.revenueTrend}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStaticData.maintenanceRequests.active} Active</div>
            <p className="text-xs text-muted-foreground">
              {mockStaticData.maintenanceRequests.completedThisMonth} completed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(portfolioStats.occupancyRate)}%</div>
            <p className="text-xs text-muted-foreground">
              {portfolioStats.occupiedUnits} of {portfolioStats.totalProperties} units occupied
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
        <Link to="/owner/property-management/add">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-4">
              <Plus className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium">Add Property</p>
                <p className="text-xs text-gray-500">New Investment</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/owner/messages">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-4">
              <MessageSquare className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium">Messages</p>
                <p className="text-xs text-gray-500">{mockStaticData.unreadMessages} Unread</p>
              </div>
            </CardContent>
          </Card>
        </Link>

      

        <Link to="/owner/finances">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-4">
              <DollarSign className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium">Finances</p>
                <p className="text-xs text-gray-500">Track Income</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/owner/tenants">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-4">
              <Users className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm font-medium">Tenants</p>
                <p className="text-xs text-gray-500">Occupancy</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/owner/reports">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-4">
              <BarChart3 className="h-8 w-8 text-indigo-500 mr-3" />
              <div>
                <p className="text-sm font-medium">Reports</p>
                <p className="text-xs text-gray-500">Analytics</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/owner/documents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-4">
              <FolderOpen className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium">Documents</p>
                <p className="text-xs text-gray-500">Files & Records</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs md:text-sm py-2 md:py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="properties" className="text-xs md:text-sm py-2 md:py-1.5">Properties</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs md:text-sm py-2 md:py-1.5">Alerts</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs md:text-sm py-2 md:py-1.5">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          {/* Financial Overview — full width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>Revenue and expenses for the current month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Top row: Revenue + Expenses side-by-side on large screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Total Revenue */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Revenue</span>
                      <span className="text-lg font-bold">${portfolioStats.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Expenses</span>
                      <span className="text-lg font-bold">${portfolioStats.monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((portfolioStats.monthlyExpenses / Math.max(portfolioStats.monthlyRevenue, 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Expense breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Maintenance:</span>
                    <span className="font-medium">${portfolioStats.expenseBreakdown.maintenance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utilities:</span>
                    <span className="font-medium">${portfolioStats.expenseBreakdown.utilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Property Mgmt:</span>
                    <span className="font-medium">${portfolioStats.expenseBreakdown.propertyManagement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Insurance:</span>
                    <span className="font-medium">${portfolioStats.expenseBreakdown.insurance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Net Income */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Net Income</span>
                    <span className="text-2xl font-bold text-green-600">${portfolioStats.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Occupancy — full width with clickable rows */}
          <Card>
            <CardHeader>
              <CardTitle>Property Occupancy</CardTitle>
              <CardDescription>Current occupancy status — click a property to view details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Occupancy Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Occupancy</span>
                  <span className="text-lg font-bold">{Math.round(portfolioStats.occupancyRate)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${portfolioStats.occupancyRate}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {portfolioStats.occupiedUnits} of {portfolioStats.totalProperties} units occupied
                </p>
              </div>

              {/* Individual Properties — clickable rows in a scrollable grid */}
              {properties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No properties found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {properties.map((property) => {
                    const isOccupied = Boolean(property.tenantId)
                    const propertyName = property.addressLine1 || `${property.type} — ${property.id.slice(-4)}`
                    const propertyType = property.type
                      ? property.type.charAt(0).toUpperCase() + property.type.slice(1).replace(/_/g, " ")
                      : "Property"
                    const rent = property.price
                      ? `$${property.price.toLocaleString()}/mo`
                      : null
                    return (
                      <button
                        key={property.id}
                        onClick={() => handleViewProperty(property)}
                        className="w-full text-left group flex items-center justify-between p-3 border rounded-xl hover:border-orange-500/60 hover:bg-orange-500/5 dark:hover:bg-orange-500/10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        aria-label={`View details for ${propertyName}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            isOccupied
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-orange-500/10 text-orange-500"
                          }`}>
                            <Home className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{propertyName}</p>
                            <p className="text-xs text-muted-foreground">
                              {propertyType}{rent ? ` · ${rent}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Badge
                            variant={isOccupied ? "default" : "destructive"}
                            className={isOccupied ? "bg-green-500 hover:bg-green-500" : ""}
                          >
                            {isOccupied ? "Occupied" : "Vacant"}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {/* Home care reminders */}
            <HomeCareRemindersCard />
          </div>

          {/* Bottom Row: Recent Payments, Quick Actions, Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest tenant payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockStaticData.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-2 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{payment.tenant}</p>
                      <p className="text-xs text-muted-foreground">{payment.date}</p>
                    </div>
                    <span className="font-bold">${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
                <Link to="/owner/finances">
                  <Button variant="link" className="w-full text-sm p-0 h-auto">
                    View all payments →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common owner tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/owner/properties">
                  <Button variant="outline" className="w-full justify-start">
                    <Building className="h-4 w-4 mr-2" />
                    Manage Properties
                  </Button>
                </Link>
                <Link to="/owner/maintenance">
                  <Button variant="outline" className="w-full justify-start">
                    <Wrench className="h-4 w-4 mr-2" />
                    View Maintenance Requests
                  </Button>
                </Link>
                <Link to="/owner/tenants">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Tenants
                  </Button>
                </Link>
                <Link to="/owner/documents">
                  <Button variant="outline" className="w-full justify-start">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Documents
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Important dates to remember</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockStaticData.upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-2 border rounded-lg">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.type}</p>
                      <p className="text-xs text-muted-foreground">{event.property}</p>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg md:text-xl">Property Portfolio</CardTitle>
                <CardDescription className="text-sm">Your real estate investments</CardDescription>
              </div>
              <Link to="/owner/properties">
                <Button className="bg-ondo-orange hover:bg-ondo-red transition-colors w-full sm:w-auto text-sm">View All Properties</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {properties.length > 0 ? (
                  properties.map((property) => (
                    <ModernPropertyCard
                      key={property.id}
                      property={property}
                      onViewDetails={handleViewProperty}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first property.</p>
                    <Link to="/owner/properties/add">
                      <Button className="bg-ondo-orange hover:bg-ondo-red transition-colors">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Property
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                All Alerts & Notifications
              </CardTitle>
              <CardDescription>Important items requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStaticData.alerts.map((alert) => (
                  <Card key={alert.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{alert.message}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Type: {alert.type} • Due: {alert.dueDate}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(alert.priority)}>
                            {alert.priority} priority
                          </Badge>
                          <Button size="sm" className="bg-ondo-orange hover:bg-ondo-red transition-colors">Mark Complete</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Portfolio Activity</CardTitle>
              <CardDescription>Latest updates across your properties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockStaticData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="font-medium">{activity.message}</p>
                        <p className="text-sm text-gray-500">{activity.property}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.cost && (
                        <p className="font-semibold text-red-600">-${activity.cost}</p>
                      )}
                      <Badge variant="outline">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        open={showPropertyDetail}
        onOpenChange={setShowPropertyDetail}
        showActions={false}
      />
    </div>
  )
}
