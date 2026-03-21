import { Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"
import ManagerDashboard from "@/components/dashboard/portals/manager/ManagerDashboard.new"
import ManagerProperties from "@/components/manager/manager-property-review"
import ManagerTenants from "@/components/manager/manager-tenants"
import ManagerOwners from "@/components/manager/manager-owners"
import ManagerMaintenance from "@/components/manager/manager-maintenance"
import ManagerLeads from "@/components/manager/manager-leads"
import { ScreeningListPage } from "@/components/shared/screening-list-page"
import ManagerFinances from "@/components/manager/manager-finances"
import ManagerReports from "@/components/manager/manager-reports"
import ManagerProfile from "@/components/manager/manager-profile"
import ManagerDocuments from "@/components/manager/manager-documents"
import ManagerMessages from "@/components/manager/manager-messages"
import ManagerCalendar from "@/components/manager/manager-calendar"
import ManagerNotifications from "@/components/manager/manager-notifications"
import ManagerAtRisk from "@/components/manager/manager-at-risk"
import ManagerAssistant from "@/components/manager/manager-assistant"
import { DashboardPaymentHistory } from "@/components/shared/dashboard-payment-history"

export default function Manager() {
  return (
    <PortalSidebar>
      <div className="min-h-screen">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<ManagerDashboard />} />
            <Route path="/at-risk" element={<ManagerAtRisk />} />
            <Route path="/assistant" element={<ManagerAssistant />} />
            <Route path="/properties/*" element={<ManagerProperties />} />
            <Route path="/leads" element={<ManagerLeads />} />
            <Route path="/screening" element={<ScreeningListPage title="Tenant screening" />} />
            <Route path="/owners/*" element={<ManagerOwners />} />
            <Route path="/tenants/*" element={<ManagerTenants />} />
            <Route path="/maintenance/*" element={<ManagerMaintenance />} />
            <Route path="/finances/*" element={<ManagerFinances />} />
            <Route
              path="/transactions"
              element={<Navigate to="/dashboard/finances?tab=payments" replace />}
            />
            <Route
              path="/cash-flow"
              element={<Navigate to="/dashboard/finances?tab=overview" replace />}
            />
            <Route
              path="/taxes"
              element={<Navigate to="/dashboard/finances?tab=reports" replace />}
            />
            <Route path="/reports" element={<ManagerReports />} />
            <Route path="/messages/*" element={<ManagerMessages />} />
            <Route path="/documents" element={<ManagerDocuments />} />
            <Route path="/payments" element={<DashboardPaymentHistory title="Rent collected" emptyMessage="No payments in your portfolio yet." />} />
            <Route path="/calendar" element={<ManagerCalendar />} />
            <Route path="/notifications" element={<ManagerNotifications />} />
            <Route path="/profile" element={<ManagerProfile />} />
          </Routes>
        </Suspense>
      </div>
    </PortalSidebar>
  )
}

