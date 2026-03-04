import { useState, useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wrench, CreditCard, FileText, MessageSquare, Calendar, DollarSign, Clock, MapPin, Building } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { propertyApi, maintenanceApi, type Property, type MaintenanceRequest } from "@/lib/api"
import { useWelcomeToast } from "@/hooks/use-welcome-toast"
import { formatUSDate } from "@/lib/us-format"

export default function TenantDashboard() {
  const { user: _user } = useAuth()
  useWelcomeToast() // Show welcome toast on dashboard visit
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("overview")
  const [assignedProperty, setAssignedProperty] = useState<Property | null>(null)
  const [loadingProperty, setLoadingProperty] = useState(true)
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([])
  const [loadingMaintenance, setLoadingMaintenance] = useState(true)

  useEffect(() => {
    fetchAssignedProperty()
    fetchMaintenanceRequests()
  }, [])

  const fetchAssignedProperty = async () => {
    try {
      setLoadingProperty(true)
      const property = await propertyApi.getTenantProperty()
      setAssignedProperty(property)
    } catch (error) {
      console.error("Error fetching assigned property:", error)
      // Property might not be assigned yet
      setAssignedProperty(null)
    } finally {
      setLoadingProperty(false)
    }
  }

  const fetchMaintenanceRequests = async () => {
    try {
      setLoadingMaintenance(true)
      const requests = await maintenanceApi.getTenantMaintenanceRequests()
      setMaintenanceRequests(requests)
    } catch (error) {
      console.error("Error fetching maintenance requests:", error)
      setMaintenanceRequests([])
    } finally {
      setLoadingMaintenance(false)
    }
  }

  // Filter active requests (in_progress and pending with assignedTo)
  const getActiveRequests = () => {
    return maintenanceRequests.filter(request => 
      (request.status === 'in_progress' || request.status === 'pending') && 
      request.assignedTo
    )
  }

  // Filter recent maintenance (unassigned and completed)
  const getRecentMaintenance = () => {
    return maintenanceRequests.filter(request => 
      !request.assignedTo || request.status === 'completed'
    )
  }

  // Calculate next rent due date (one month from move-in date, recurring monthly)
  const getNextRentDueDate = () => {
    if (!assignedProperty) return null
    
    const moveInDate = new Date(assignedProperty.createdAt)
    const now = new Date()
    
    // Start from move-in date
    const nextDueDate = new Date(moveInDate)
    
    // Keep adding months until we get a date in the future
    while (nextDueDate <= now) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)
    }
    
    return nextDueDate
  }

  // Format date for display
  const formatRentDueDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Calculate lease expiration (12 months from property creation)
  const getLeaseExpiration = useMemo(() => {
    if (!assignedProperty?.createdAt) return null
    
    const leaseStart = new Date(assignedProperty.createdAt)
    const leaseEnd = new Date(leaseStart)
    leaseEnd.setMonth(leaseEnd.getMonth() + 12)
    
    return {
      date: leaseEnd,
      monthsRemaining: Math.max(0, Math.ceil((leaseEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)))
    }
  }, [assignedProperty])

  // Mock data for messages and documents (matching the actual components)
  const unreadMessagesCount = 2 // From tenant-messages.tsx mock data
  const documentsCount = 8 // From tenant-documents.tsx mock data
  const recentPaymentsCount = 5 // From tenant-payments.tsx mock data

  // Calculate additional statistics
  const completedMaintenance = maintenanceRequests.filter(r => r.status === 'completed').length
  const totalMaintenance = maintenanceRequests.length
  const maintenanceCompletionRate = totalMaintenance > 0 
    ? Math.round((completedMaintenance / totalMaintenance) * 100) 
    : 0

  // Calculate lease progress
  const leaseProgress = useMemo(() => {
    if (!assignedProperty?.createdAt || !getLeaseExpiration) return 0
    const leaseStart = new Date(assignedProperty.createdAt)
    const leaseEnd = getLeaseExpiration.date
    const now = new Date()
    const totalDays = (leaseEnd.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24)
    const daysElapsed = (now.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24)
    return Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)
  }, [assignedProperty, getLeaseExpiration])

  // Calculate days at property
  const daysAtProperty = useMemo(() => {
    if (!assignedProperty?.createdAt) return 0
    const moveInDate = new Date(assignedProperty.createdAt)
    const now = new Date()
    return Math.floor((now.getTime() - moveInDate.getTime()) / (1000 * 60 * 60 * 24))
  }, [assignedProperty])

  // Payment statistics (from mock data in tenant-payments.tsx)
  const paymentStats = {
    totalPaidThisYear: 9250,
    totalPayments: 5,
    onTimePayments: 4,
    onTimeRate: 80,
    averagePayment: 1850
  }

  // Generate recent activity from available data
  const recentActivity = useMemo(() => {
    const activities: Array<{
      id: string
      type: 'maintenance' | 'payment' | 'message' | 'document'
      message: string
      time: string
      href: string
    }> = []

    // Add maintenance activities
    maintenanceRequests.slice(0, 3).forEach((request) => {
      activities.push({
        id: `maint-${request.id}`,
        type: 'maintenance',
        message: `Maintenance request "${request.title}" ${request.status === 'completed' ? 'completed' : 'updated'}`,
        time: formatUSDate(request.updatedAt),
        href: '/tenant/maintenance/'
      })
    })

    // Add mock payment activity
    if (recentPaymentsCount > 0) {
      activities.push({
        id: 'payment-1',
        type: 'payment',
        message: 'Rent payment processed successfully',
        time: '2 days ago',
        href: '/tenant/payments'
      })
    }

    // Add mock message activity
    if (unreadMessagesCount > 0) {
      activities.push({
        id: 'message-1',
        type: 'message',
        message: `You have ${unreadMessagesCount} new message${unreadMessagesCount > 1 ? 's' : ''}`,
        time: '1 day ago',
        href: '/tenant/messages'
      })
    }

    // Sort by time (most recent first) - simplified for mock data
    return activities.slice(0, 5)
  }, [maintenanceRequests, unreadMessagesCount, recentPaymentsCount])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Your rental property overview
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/tenant/maintenance/">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-4">
              <Wrench className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium">Maintenance</p>
                <p className="text-xs text-gray-500">Submit Request</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/tenant/payments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-4">
              <CreditCard className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium">Payments</p>
                <p className="text-xs text-gray-500">View History</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/tenant/documents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-4">
              <FileText className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium">Documents</p>
                <p className="text-xs text-gray-500">{documentsCount} Documents</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/tenant/messages">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center p-4">
              <MessageSquare className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm font-medium">Messages</p>
                <p className="text-xs text-gray-500">
                  {unreadMessagesCount > 0 ? `${unreadMessagesCount} New` : 'View Messages'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="property">Property</TabsTrigger>
          <TabsTrigger value="maintenance" onClick={() => navigate('/tenant/maintenance/')}>Maintenance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {/* Rent Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Rent Due</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${assignedProperty?.price?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Due {getNextRentDueDate() ? formatRentDueDate(getNextRentDueDate()!) : 'N/A'}
                </p>
                <Link to="/tenant/payments">
                  <Button className="w-full mt-3 bg-ondo-orange hover:bg-ondo-red transition-colors" size="sm">
                    Pay Now
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Lease Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lease Expires</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {getLeaseExpiration ? (
                  <>
                    <div className="text-2xl font-bold">
                      {getLeaseExpiration.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getLeaseExpiration.date.toLocaleDateString('en-US', { year: 'numeric' })}
                    </p>
                    <Badge variant="outline" className="mt-3">
                      {getLeaseExpiration.monthsRemaining} {getLeaseExpiration.monthsRemaining === 1 ? 'month' : 'months'} left
                    </Badge>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">N/A</div>
                    <p className="text-xs text-muted-foreground">No lease data</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Active Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingMaintenance ? "..." : getActiveRequests().length}
                </div>
                <p className="text-xs text-muted-foreground">Assigned maintenance requests</p>
                {getActiveRequests().length > 0 && (
                  <div className="mt-3 space-y-2">
                    {getActiveRequests().slice(0, 2).map((request) => (
                      <div key={request.id} className="flex items-center justify-between text-xs">
                        <span className="truncate">{request.title}</span>
                        <Badge variant={request.status === 'in_progress' ? 'default' : 'secondary'}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                    {getActiveRequests().length > 2 && (
                      <p className="text-xs text-muted-foreground">+{getActiveRequests().length - 2} more</p>
                    )}
                  </div>
                )}
                <Link to="/tenant/maintenance/">
                  <Button variant="outline" className="w-full mt-3 border-ondo-orange text-ondo-orange hover:bg-ondo-orange hover:text-white" size="sm">
                    View All
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Property Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Property Status</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assignedProperty ? 'Occupied' : 'None'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {assignedProperty 
                    ? assignedProperty.addressLine1 
                      ? `${assignedProperty.addressLine1}${assignedProperty.city ? `, ${assignedProperty.city}` : ''}`
                      : `${assignedProperty.type}`
                    : 'No property assigned'}
                </p>
                {assignedProperty && (
                  <Link to="/tenant/property">
                    <Button variant="outline" className="w-full mt-3 border-ondo-orange text-ondo-orange hover:bg-ondo-orange hover:text-white" size="sm">
                      View Property
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Overview Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Property Overview */}
            {assignedProperty && (
              <Card>
                <CardHeader>
                  <CardTitle>Property Overview</CardTitle>
                  <CardDescription>Your rental property details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Monthly Rent</p>
                        <p className="text-xs text-muted-foreground">Current rate</p>
                      </div>
                      <div className="text-xl font-bold">${assignedProperty.price?.toLocaleString() || '0'}</div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Property Type</p>
                        <p className="text-xs text-muted-foreground">Unit type</p>
                      </div>
                      <div className="text-lg font-semibold capitalize">{assignedProperty.type || 'N/A'}</div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Bedrooms</p>
                        <p className="text-xs text-muted-foreground">Unit size</p>
                      </div>
                      <div className="text-lg font-semibold">{assignedProperty.bedrooms || 'N/A'} bed</div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Days at Property</p>
                        <p className="text-xs text-muted-foreground">Since move-in</p>
                      </div>
                      <div className="text-lg font-semibold">{daysAtProperty} days</div>
                    </div>
                  </div>
                  <Link to="/tenant/property">
                    <Button variant="outline" className="w-full">
                      View Full Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>Your payment statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Paid (YTD)</p>
                    <p className="text-xl font-semibold">${paymentStats.totalPaidThisYear.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">On-Time Rate</p>
                    <p className="text-xl font-semibold">{paymentStats.onTimeRate}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                    <p className="text-lg font-semibold">{paymentStats.totalPayments}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Payment</p>
                    <p className="text-lg font-semibold">${paymentStats.averagePayment.toLocaleString()}</p>
                  </div>
                </div>
                <Link to="/tenant/payments">
                  <Button variant="outline" className="w-full">
                    View Payment History
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Maintenance Summary */}
            {totalMaintenance > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Summary</CardTitle>
                  <CardDescription>Your maintenance request statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                      <p className="text-xl font-semibold">{totalMaintenance}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-xl font-semibold text-green-600">{completedMaintenance}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Completion Rate</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${maintenanceCompletionRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{maintenanceCompletionRate}%</span>
                    </div>
                  </div>
                  <Link to="/tenant/maintenance/">
                    <Button variant="outline" className="w-full">
                      View All Requests
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Lease Progress */}
            {getLeaseExpiration && (
              <Card>
                <CardHeader>
                  <CardTitle>Lease Progress</CardTitle>
                  <CardDescription>Your lease timeline</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Lease Completion</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${leaseProgress}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{Math.round(leaseProgress)}%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Days at Property</p>
                      <p className="font-semibold">{daysAtProperty} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Months Remaining</p>
                      <p className="font-semibold">{getLeaseExpiration.monthsRemaining} months</p>
                    </div>
                  </div>
                  <Link to="/tenant/lease-details">
                    <Button variant="outline" className="w-full">
                      View Lease Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tenant tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/tenant/maintenance/">
                  <Button variant="outline" className="w-full justify-start">
                    <Wrench className="h-4 w-4 mr-2" />
                    Submit Maintenance Request
                  </Button>
                </Link>
                <Link to="/tenant/payments">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Make Payment
                  </Button>
                </Link>
                <Link to="/tenant/messages">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Messages
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Maintenance</CardTitle>
                <CardDescription>Your latest maintenance requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingMaintenance ? (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-gray-500">Loading...</p>
                  </div>
                ) : getRecentMaintenance().length === 0 ? (
                  <div className="text-center py-4">
                    <Wrench className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No maintenance requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getRecentMaintenance().slice(0, 3).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{request.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={
                              request.status === 'completed' ? 'default' : 
                              request.status === 'in_progress' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {request.status.replace('_', ' ')}
                          </Badge>
                          {request.assignedTo && (
                            <span className="text-xs text-gray-500">Assigned</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {getRecentMaintenance().length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{getRecentMaintenance().length - 3} more requests
                      </p>
                    )}
                  </div>
                )}
                <Link to="/tenant/maintenance/">
                  <Button variant="outline" className="w-full border-ondo-orange text-ondo-orange hover:bg-ondo-orange hover:text-white">
                    {getRecentMaintenance().length === 0 ? 'Submit New Request' : 'View All Requests'}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <Link key={activity.id} to={activity.href}>
                        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.message}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                          <Badge 
                            variant={
                              activity.type === 'maintenance' ? 'secondary' :
                              activity.type === 'payment' ? 'default' :
                              activity.type === 'message' ? 'outline' : 'outline'
                            }
                            className="ml-2"
                          >
                            {activity.type}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Link to="/tenant/messages" className="flex-1">
                    <Button variant="outline" className="w-full border-ondo-orange text-ondo-orange hover:bg-ondo-orange hover:text-white">
                      View Messages
                    </Button>
                  </Link>
                  <Link to="/tenant/payments" className="flex-1">
                    <Button variant="outline" className="w-full border-ondo-orange text-ondo-orange hover:bg-ondo-orange hover:text-white">
                      View Payments
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="property" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{assignedProperty?.title || 'Property Details'}</CardTitle>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <CardDescription>
                  {assignedProperty?.addressLine1 && assignedProperty?.city 
                    ? `${assignedProperty.addressLine1}, ${assignedProperty.city}`
                    : loadingProperty ? 'Loading property details...' : 'No property assigned'
                  }
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingProperty ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading property...</p>
                </div>
              ) : assignedProperty ? (
                <div className="space-y-6">
                  {/* Property Status Badge */}
                  <div className="flex justify-end">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Building className="h-3 w-3 mr-1" />
                      Occupied
                    </Badge>
                  </div>

                  {/* Property Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Monthly Rent</label>
                      <p className="text-lg font-semibold">${assignedProperty.price?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Property Type</label>
                      <p className="text-lg capitalize">{assignedProperty?.type || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Bedrooms</label>
                      <p className="text-lg">{assignedProperty?.bedrooms || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Bathrooms</label>
                      <p className="text-lg">{assignedProperty?.bathrooms || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Square Footage</label>
                      <p className="text-lg">{assignedProperty?.sqft?.toLocaleString() || 'N/A'} sq ft</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <p className="text-lg capitalize">{assignedProperty?.status || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Property Description */}
                  {assignedProperty?.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-gray-700 mt-1">{assignedProperty.description}</p>
                    </div>
                  )}

                  {/* Amenities */}
                  {assignedProperty?.amenities && assignedProperty.amenities.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Amenities</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {assignedProperty.amenities.map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Owner Information
                  {assignedProperty?.owner && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Property Owner</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium">{assignedProperty.owner.firstName} {assignedProperty.owner.lastName}</p>
                        <p className="text-sm text-gray-600">{assignedProperty.owner.email}</p>
                      </div>
                    </div>
                  )} */}

                  {/* Property Photos */}
                  {assignedProperty?.photos && assignedProperty.photos.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Property Photos</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {assignedProperty.photos.map((photo) => (
                          <img
                            key={photo.id}
                            src={photo.url}
                            alt={photo.caption || 'Property photo'}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Property Assigned</h3>
                  <p className="text-gray-600">You haven't been assigned to a property yet. Contact your property manager for more information.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your recent rent payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Payment Management</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    View your payment history, make payments, and manage payment methods.
                  </p>
                  <Link to="/tenant/payments">
                    <Button className="bg-ondo-orange hover:bg-ondo-red text-white">
                      Go to Payments
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
