import { Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"
import OwnerDashboard from "@/components/dashboard/portals/owner/OwnerDashboard.new"
import OwnerProperties from "@/components/owner/owner-properties"
import OwnerFinances from "@/components/owner/owner-finances"
import OwnerReports from "@/components/owner/owner-reports"
import OwnerTenants from "@/components/owner/owner-tenants"
import OwnerProfile from "@/components/owner/owner-profile"
import OwnerMessages from "@/components/owner/owner-messages"
import OwnerDocuments from "@/components/owner/owner-documents"
import OwnerOccupancy from "@/components/owner/owner-occupancy"
import OwnerPropertyDetail from "@/components/owner/owner-property-detail"
import { AddPropertyForm } from "@/components/owner/add-property-form"
import { OwnerMaintenanceManagement } from "@/components/owner/maintenance-management"
import ManagerAtRisk from "@/components/manager/manager-at-risk"
import OwnerCalendar from "@/components/owner/owner-calendar"
import OwnerNotifications from "@/components/owner/owner-notifications"
import ManagerAssistant from "@/components/manager/manager-assistant"
import { DashboardPaymentHistory } from "@/components/shared/dashboard-payment-history"
import { ScreeningListPage } from "@/components/shared/screening-list-page"

export default function Owner() {
  return (
    <PortalSidebar>
      <div className="min-h-screen">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<OwnerDashboard />} />
            <Route path="/assistant" element={<ManagerAssistant />} />
            <Route path="/at-risk" element={<ManagerAtRisk />} />
            {/* Property creation routes - both old and new URLs */}
            <Route path="/properties/add" element={<AddPropertyForm />} />
            <Route path="/property-management/add" element={<AddPropertyForm />} />
            <Route path="/properties/:id" element={<OwnerPropertyDetail />} />
            <Route path="/properties/*" element={<OwnerProperties />} />
            <Route path="/finances/*" element={<OwnerFinances />} />
            <Route path="/reports/*" element={<OwnerReports />} />
            <Route path="/tenants" element={<OwnerTenants />} />
            <Route path="/maintenance/*" element={<OwnerMaintenanceManagement />} />
            <Route path="/messages/*" element={<OwnerMessages />} />
            <Route path="/occupancy/*" element={<OwnerOccupancy />} />
            <Route path="/documents/*" element={<OwnerDocuments />} />
            <Route path="/payments" element={<DashboardPaymentHistory title="Rent payments" emptyMessage="No rent payments received yet." />} />
            <Route path="/screening" element={<ScreeningListPage title="Tenant screening" />} />
            <Route path="/calendar" element={<OwnerCalendar />} />
            <Route path="/notifications" element={<OwnerNotifications />} />
            <Route path="/profile" element={<OwnerProfile />} />
          </Routes>
        </Suspense>
      </div>
    </PortalSidebar>
  )
}
