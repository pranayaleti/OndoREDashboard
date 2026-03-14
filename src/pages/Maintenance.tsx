import { Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"
import MaintenanceDashboard from "@/components/dashboard/portals/maintenance/MaintenanceDashboard.new"
import MaintenanceTickets from "@/components/maintenance/maintenance-tickets"
import MaintenanceProfile from "@/components/maintenance/maintenance-profile"
import MaintenanceDocuments from "@/components/maintenance/maintenance-documents"
import MaintenanceCalendar from "@/components/maintenance/maintenance-calendar"
import MaintenanceNotifications from "@/components/maintenance/maintenance-notifications"
import VendorList from "@/components/vendor/vendor-list"

export default function Maintenance() {
  return (
    <PortalSidebar>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<MaintenanceDashboard />} />
            <Route path="/tickets/*" element={<MaintenanceTickets />} />
            <Route path="/vendors" element={<VendorList />} />
            <Route path="/documents" element={<MaintenanceDocuments />} />
            <Route path="/calendar" element={<MaintenanceCalendar />} />
            <Route path="/notifications" element={<MaintenanceNotifications />} />
            <Route path="/profile" element={<MaintenanceProfile />} />
          </Routes>
        </Suspense>
      </div>
    </PortalSidebar>
  )
}

