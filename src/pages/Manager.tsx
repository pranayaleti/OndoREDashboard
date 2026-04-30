import { Suspense, lazy } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"

const ManagerDashboard = lazy(() => import("@/components/dashboard/portals/manager/ManagerDashboard.new"))
const ManagerProperties = lazy(() => import("@/components/manager/manager-property-review"))
const ManagerTenants = lazy(() => import("@/components/manager/manager-tenants"))
const ManagerOwners = lazy(() => import("@/components/manager/manager-owners"))
const ManagerMaintenance = lazy(() => import("@/components/manager/manager-maintenance"))
const ManagerLeads = lazy(() => import("@/components/manager/manager-leads"))
const ScreeningListPage = lazy(() => import("@/components/shared/screening-list-page").then((m) => ({ default: m.ScreeningListPage })))
const ManagerFinances = lazy(() => import("@/components/manager/manager-finances"))
const ManagerReports = lazy(() => import("@/components/manager/manager-reports"))
const ManagerProfile = lazy(() => import("@/components/manager/manager-profile"))
const ManagerDocuments = lazy(() => import("@/components/manager/manager-documents"))
const ManagerMessages = lazy(() => import("@/components/manager/manager-messages"))
const ManagerCalendar = lazy(() => import("@/components/manager/manager-calendar"))
const ManagerNotifications = lazy(() => import("@/components/manager/manager-notifications"))
const ManagerAssistant = lazy(() => import("@/components/manager/manager-assistant"))
const DashboardPaymentHistory = lazy(() => import("@/components/shared/dashboard-payment-history").then((m) => ({ default: m.DashboardPaymentHistory })))
const ReferralProgram = lazy(() => import("@/components/shared/referral-program").then((m) => ({ default: m.ReferralProgram })))
const ManagerAtRisk = lazy(() => import("@/components/manager/manager-at-risk"))

export default function Manager() {
  return (
    <PortalSidebar>
      <div className="min-h-full">
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
            <Route path="/referrals" element={<ReferralProgram />} />
          </Routes>
        </Suspense>
      </div>
    </PortalSidebar>
  )
}
