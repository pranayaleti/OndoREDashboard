import { Suspense, lazy } from "react"
import { Routes, Route } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"

const TenantDashboard = lazy(() => import("@/components/dashboard/portals/tenant/TenantDashboard.new"))
const TenantMaintenance = lazy(() => import("@/components/tenant/tenant-maintenance"))
const TenantPayments = lazy(() => import("@/components/tenant/tenant-payments"))
const TenantDocuments = lazy(() => import("@/components/tenant/tenant-documents"))
const TenantMessages = lazy(() => import("@/components/tenant/tenant-messages"))
const TenantProfile = lazy(() => import("@/components/tenant/tenant-profile"))
const TenantLeaseDetails = lazy(() => import("@/components/tenant/tenant-lease-details"))
const ManagerAssistant = lazy(() => import("@/components/manager/manager-assistant"))
const TenantCalendar = lazy(() => import("@/components/tenant/tenant-calendar"))
const TenantNotifications = lazy(() => import("@/components/tenant/tenant-notifications"))
const TenantFinances = lazy(() => import("@/components/tenant/tenant-finances"))
const MortgageLoansPage = lazy(() => import("@/components/homeowner/mortgage-loans-page").then((m) => ({ default: m.MortgageLoansPage })))
const HomeImprovementPage = lazy(() => import("@/components/homeowner/home-improvement-page").then((m) => ({ default: m.HomeImprovementPage })))
const EquipmentGridPage = lazy(() => import("@/components/homeowner/equipment-grid").then((m) => ({ default: m.EquipmentGridPage })))
const HomeownerSearchResults = lazy(() => import("@/components/homeowner/homeowner-search-results").then((m) => ({ default: m.HomeownerSearchResults })))
const DocumentsPanel = lazy(() => import("@/components/homeowner/documents-panel").then((m) => ({ default: m.DocumentsPanel })))
const TenantSettings = lazy(() => import("@/components/tenant/tenant-settings"))
const ReferralProgram = lazy(() => import("@/components/shared/referral-program").then((m) => ({ default: m.ReferralProgram })))

export default function Tenant() {
  return (
    <PortalSidebar>
      <div className="min-h-full">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<TenantDashboard />} />
            <Route path="/assistant" element={<ManagerAssistant />} />
            <Route path="/lease-details" element={<TenantLeaseDetails />} />
            <Route path="/maintenance/*" element={<TenantMaintenance />} />
            <Route path="/payments" element={<TenantPayments />} />
            <Route path="/finances" element={<TenantFinances />} />
            <Route path="/mortgage" element={<MortgageLoansPage />} />
            <Route path="/improvements" element={<HomeImprovementPage />} />
            <Route path="/equipment" element={<EquipmentGridPage />} />
            <Route path="/search" element={<HomeownerSearchResults />} />
            <Route path="/my-documents" element={<DocumentsPanel />} />
            <Route path="/settings" element={<TenantSettings />} />
            <Route path="/documents" element={<TenantDocuments />} />
            <Route path="/messages" element={<TenantMessages />} />
            <Route path="/calendar" element={<TenantCalendar />} />
            <Route path="/notifications" element={<TenantNotifications />} />
            <Route path="/profile" element={<TenantProfile />} />
            <Route path="/referrals" element={<ReferralProgram />} />
          </Routes>
        </Suspense>
      </div>
    </PortalSidebar>
  )
}
