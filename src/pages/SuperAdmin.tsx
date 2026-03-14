import { Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"
import SuperAdminDashboard from "@/components/dashboard/portals/super-admin/SuperAdminDashboard.new"
import SuperAdminManagers from "@/components/super-admin/super-admin-managers"
import SuperAdminAdmins from "@/components/super-admin/super-admin-admins"
import SuperAdminOwners from "@/components/super-admin/super-admin-owners"
import SuperAdminTenants from "@/components/super-admin/super-admin-tenants"
import SuperAdminMaintenance from "@/components/super-admin/super-admin-maintenance"
import SuperAdminProperties from "@/components/super-admin/super-admin-properties"
import SuperAdminFinances from "@/components/super-admin/super-admin-finances"
import SuperAdminReports from "@/components/super-admin/super-admin-reports"
import SuperAdminProfile from "@/components/super-admin/super-admin-profile"
import SuperAdminDocuments from "@/components/super-admin/super-admin-documents"
import SuperAdminMessages from "@/components/super-admin/super-admin-messages"
import SuperAdminCalendar from "@/components/super-admin/super-admin-calendar"
import SuperAdminNotifications from "@/components/super-admin/super-admin-notifications"
import ManagerAtRisk from "@/components/manager/manager-at-risk"
import ManagerAssistant from "@/components/manager/manager-assistant"
import { ScreeningListPageWithOwnerFilter } from "@/components/shared/screening-list-page"

export default function SuperAdmin() {
  return (
    <PortalSidebar>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<SuperAdminDashboard />} />
            <Route path="/at-risk" element={<ManagerAtRisk />} />
            <Route path="/assistant" element={<ManagerAssistant />} />
            <Route path="/managers/*" element={<SuperAdminManagers />} />
            <Route path="/admins/*" element={<SuperAdminAdmins />} />
            <Route path="/owners/*" element={<SuperAdminOwners />} />
            <Route path="/tenants/*" element={<SuperAdminTenants />} />
            <Route path="/maintenance/*" element={<SuperAdminMaintenance />} />
            <Route path="/screening" element={<ScreeningListPageWithOwnerFilter title="Tenant screening" />} />
            <Route path="/properties/*" element={<SuperAdminProperties />} />
            <Route path="/finances/*" element={<SuperAdminFinances />} />
            <Route path="/reports/*" element={<SuperAdminReports />} />
            <Route path="/messages/*" element={<SuperAdminMessages />} />
            <Route path="/documents" element={<SuperAdminDocuments />} />
            <Route path="/calendar" element={<SuperAdminCalendar />} />
            <Route path="/notifications" element={<SuperAdminNotifications />} />
            <Route path="/profile" element={<SuperAdminProfile />} />
          </Routes>
        </Suspense>
      </div>
    </PortalSidebar>
  )
}

