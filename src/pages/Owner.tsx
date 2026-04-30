import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"

const OwnerDashboard = lazy(() => import("@/components/dashboard/portals/owner/OwnerDashboard.new"))
const HomeownerDashboard = lazy(() => import("@/components/homeowner/homeowner-dashboard").then((m) => ({ default: m.HomeownerDashboard })))
const MortgageLoansPage = lazy(() => import("@/components/homeowner/mortgage-loans-page").then((m) => ({ default: m.MortgageLoansPage })))
const HomeImprovementPage = lazy(() => import("@/components/homeowner/home-improvement-page").then((m) => ({ default: m.HomeImprovementPage })))
const EquipmentGridPage = lazy(() => import("@/components/homeowner/equipment-grid").then((m) => ({ default: m.EquipmentGridPage })))
const HomeownerSearchResults = lazy(() => import("@/components/homeowner/homeowner-search-results").then((m) => ({ default: m.HomeownerSearchResults })))
const DocumentsPanel = lazy(() => import("@/components/homeowner/documents-panel").then((m) => ({ default: m.DocumentsPanel })))
const OwnerSettings = lazy(() => import("@/components/owner/owner-settings"))
const OwnerProperties = lazy(() => import("@/components/owner/owner-properties"))
const OwnerFinances = lazy(() => import("@/components/owner/owner-finances"))
const OwnerReports = lazy(() => import("@/components/owner/owner-reports"))
const OwnerTenants = lazy(() => import("@/components/owner/owner-tenants"))
const OwnerTenantDetail = lazy(() => import("@/components/owner/owner-tenant-detail"))
const OwnerProfile = lazy(() => import("@/components/owner/owner-profile"))
const MessagesView = lazy(() => import("@/components/owner/messages-view").then((m) => ({ default: m.MessagesView })))
const OwnerDocuments = lazy(() => import("@/components/owner/owner-documents"))
const OwnerOccupancy = lazy(() => import("@/components/owner/owner-occupancy"))
const OwnerPropertyDetail = lazy(() => import("@/components/owner/owner-property-detail"))
const AddPropertyForm = lazy(() => import("@/components/owner/add-property-form").then((m) => ({ default: m.AddPropertyForm })))
const OwnerMaintenanceManagement = lazy(() => import("@/components/owner/maintenance-management").then((m) => ({ default: m.OwnerMaintenanceManagement })))
const OwnerCalendar = lazy(() => import("@/components/owner/owner-calendar"))
const OwnerNotifications = lazy(() => import("@/components/owner/owner-notifications"))
const ManagerAssistant = lazy(() => import("@/components/manager/manager-assistant"))
const DashboardPaymentHistory = lazy(() => import("@/components/shared/dashboard-payment-history").then((m) => ({ default: m.DashboardPaymentHistory })))
const ScreeningListPage = lazy(() => import("@/components/shared/screening-list-page").then((m) => ({ default: m.ScreeningListPage })))
const ReferralProgram = lazy(() => import("@/components/shared/referral-program").then((m) => ({ default: m.ReferralProgram })))
const ManagerAtRisk = lazy(() => import("@/components/manager/manager-at-risk"))

export default function Owner() {
  return (
    <PortalSidebar>
      <div className="min-h-full">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomeownerDashboard />} />
            <Route path="/portfolio" element={<OwnerDashboard />} />
            <Route path="/mortgage" element={<MortgageLoansPage />} />
            <Route path="/improvements" element={<HomeImprovementPage />} />
            <Route path="/equipment" element={<EquipmentGridPage />} />
            <Route path="/search" element={<HomeownerSearchResults />} />
            <Route path="/my-documents" element={<DocumentsPanel />} />
            <Route path="/settings" element={<OwnerSettings />} />
            <Route path="/assistant" element={<ManagerAssistant />} />
            <Route path="/at-risk" element={<ManagerAtRisk />} />
            {/* Property creation routes - both old and new URLs */}
            <Route path="/properties/add" element={<AddPropertyForm />} />
            <Route path="/property-management/add" element={<AddPropertyForm />} />
            <Route path="/properties/:id" element={<OwnerPropertyDetail />} />
            <Route path="/properties/*" element={<OwnerProperties />} />
            <Route path="/finances/*" element={<OwnerFinances />} />
            <Route path="/reports/*" element={<OwnerReports />} />
            <Route path="/tenants/:tenantId" element={<OwnerTenantDetail />} />
            <Route path="/tenants" element={<OwnerTenants />} />
            <Route path="/maintenance/*" element={<OwnerMaintenanceManagement />} />
            <Route path="/messages/*" element={<MessagesView />} />
            <Route path="/occupancy/*" element={<OwnerOccupancy />} />
            <Route path="/documents/*" element={<OwnerDocuments />} />
            <Route path="/payments" element={<DashboardPaymentHistory title="Rent payments" emptyMessage="No rent payments received yet." />} />
            <Route path="/screening" element={<ScreeningListPage title="Tenant screening" />} />
            <Route path="/calendar" element={<OwnerCalendar />} />
            <Route path="/notifications" element={<OwnerNotifications />} />
            <Route path="/profile" element={<OwnerProfile />} />
            <Route path="/referrals" element={<ReferralProgram />} />
          </Routes>
        </Suspense>
      </div>
    </PortalSidebar>
  )
}
