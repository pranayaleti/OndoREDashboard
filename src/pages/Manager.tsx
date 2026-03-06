import { Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"
import ManagerDashboard from "@/components/dashboard/portals/manager/ManagerDashboard.new"
import ManagerProperties from "@/components/manager/manager-property-review"
import ManagerTenants from "@/components/manager/manager-tenants"
import ManagerOwners from "@/components/manager/manager-owners"
import ManagerMaintenance from "@/components/manager/manager-maintenance"
import ManagerLeads from "@/components/manager/manager-leads"
import ManagerFinances from "@/components/manager/manager-finances"
import ManagerReports from "@/components/manager/manager-reports"
import ManagerProfile from "@/components/manager/manager-profile"
import ManagerDocuments from "@/components/manager/manager-documents"
import ManagerMessages from "@/components/manager/manager-messages"
import ManagerCalendar from "@/components/manager/manager-calendar"
import ManagerNotifications from "@/components/manager/manager-notifications"
import ManagerAtRisk from "@/components/manager/manager-at-risk"
import ManagerAssistant from "@/components/manager/manager-assistant"

export default function Manager() {
  return (
    <PortalSidebar>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<ManagerDashboard />} />
            <Route path="/at-risk" element={<ManagerAtRisk />} />
            <Route path="/assistant" element={<ManagerAssistant />} />
            <Route path="/properties/*" element={<ManagerProperties />} />
            <Route path="/leads" element={<ManagerLeads />} />
            <Route path="/owners/*" element={<ManagerOwners />} />
            <Route path="/tenants/*" element={<ManagerTenants />} />
            <Route path="/maintenance/*" element={<ManagerMaintenance />} />
            <Route path="/finances/*" element={<ManagerFinances />} />
            <Route path="/reports" element={<ManagerReports />} />
            <Route path="/messages/*" element={<ManagerMessages />} />
            <Route path="/documents" element={<ManagerDocuments />} />
            <Route path="/calendar" element={<ManagerCalendar />} />
            <Route path="/notifications" element={<ManagerNotifications />} />
            <Route path="/profile" element={<ManagerProfile />} />
          </Routes>
        </Suspense>
      </div>
    </PortalSidebar>
  )
}

