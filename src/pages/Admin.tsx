import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"

const AdminDashboard = lazy(() => import("@/components/dashboard/portals/admin/AdminDashboard.new"))
const AdminManagers = lazy(() => import("@/components/admin/admin-managers"))
const AdminOwners = lazy(() => import("@/components/admin/admin-owners"))
const AdminTenants = lazy(() => import("@/components/admin/admin-tenants"))
const AdminMaintenance = lazy(() => import("@/components/admin/admin-maintenance"))
const AdminProperties = lazy(() => import("@/components/admin/admin-properties"))
const AdminFinances = lazy(() => import("@/components/admin/admin-finances"))
const AdminReports = lazy(() => import("@/components/admin/admin-reports"))
const AdminProfile = lazy(() => import("@/components/admin/admin-profile"))
const AdminSettings = lazy(() => import("@/components/admin/admin-settings"))
const AdminDocuments = lazy(() => import("@/components/admin/admin-documents"))
const AdminMessages = lazy(() => import("@/components/admin/admin-messages"))
const AdminCalendar = lazy(() => import("@/components/admin/admin-calendar"))
const AdminEvents = lazy(() => import("@/components/admin/admin-events"))
const AdminNotifications = lazy(() => import("@/components/admin/admin-notifications"))
const ManagerAssistant = lazy(() => import("@/components/manager/manager-assistant"))
const ManagerContentStudio = lazy(() => import("@/components/manager/manager-content-studio"))
const ScreeningListPageWithOwnerFilter = lazy(() => import("@/components/shared/screening-list-page").then((m) => ({ default: m.ScreeningListPageWithOwnerFilter })))
const RentalApplicationsPage = lazy(() => import("@/components/rental/rental-applications-page"))
const LeasingPipelinePage = lazy(() => import("@/components/leasing/leasing-pipeline-page"))
const ReferralProgram = lazy(() => import("@/components/shared/referral-program").then((m) => ({ default: m.ReferralProgram })))
const ManagerAtRisk = lazy(() => import("@/components/manager/manager-at-risk"))
const ManagerTasks = lazy(() => import("@/components/manager/manager-tasks"))
const ManagerWorkflows = lazy(() => import("@/components/manager/manager-workflows"))
const DashboardPaymentHistory = lazy(() => import("@/components/shared/dashboard-payment-history").then((m) => ({ default: m.DashboardPaymentHistory })))

export default function Admin() {
  return (
    <PortalSidebar>
      <div className="min-h-screen">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/at-risk" element={<ManagerAtRisk />} />
            <Route path="/assistant" element={<ManagerAssistant />} />
            <Route path="/content" element={<ManagerContentStudio />} />
            <Route path="/managers/*" element={<AdminManagers />} />
            <Route path="/owners/*" element={<AdminOwners />} />
            <Route path="/tenants/*" element={<AdminTenants />} />
            <Route path="/maintenance/*" element={<AdminMaintenance />} />
            <Route path="/screening" element={<ScreeningListPageWithOwnerFilter title="Tenant screening" />} />
            <Route path="/applications" element={<RentalApplicationsPage />} />
            <Route path="/leasing" element={<LeasingPipelinePage />} />
            <Route path="/properties/*" element={<AdminProperties />} />
            <Route path="/finances/*" element={<AdminFinances />} />
            <Route path="/payments" element={<DashboardPaymentHistory title="Rent collected" emptyMessage="No payments yet." />} />
            <Route path="/reports/*" element={<AdminReports />} />
            <Route path="/messages/*" element={<AdminMessages />} />
            <Route path="/documents" element={<AdminDocuments />} />
            <Route path="/calendar" element={<AdminCalendar />} />
            <Route path="/tasks" element={<ManagerTasks />} />
            <Route path="/automations" element={<ManagerWorkflows />} />
            <Route path="/events" element={<AdminEvents />} />
            <Route path="/notifications" element={<AdminNotifications />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/profile" element={<AdminProfile />} />
            <Route path="/referrals" element={<ReferralProgram />} />
          </Routes>
        </Suspense>
      </div>
    </PortalSidebar>
  )
}
