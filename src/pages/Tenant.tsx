import { Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"
import TenantDashboard from "@/components/dashboard/portals/tenant/TenantDashboard.new"
import TenantMaintenance from "@/components/tenant/tenant-maintenance"
import TenantPayments from "@/components/tenant/tenant-payments"
import TenantDocuments from "@/components/tenant/tenant-documents"
import TenantMessages from "@/components/tenant/tenant-messages"
import TenantProfile from "@/components/tenant/tenant-profile"
import TenantLeaseDetails from "@/components/tenant/tenant-lease-details"
import ManagerAssistant from "@/components/manager/manager-assistant"
import TenantCalendar from "@/components/tenant/tenant-calendar"
import TenantNotifications from "@/components/tenant/tenant-notifications"
import TenantFinances from "@/components/tenant/tenant-finances"
import { MortgageLoansPage } from "@/components/homeowner/mortgage-loans-page"
import { HomeImprovementPage } from "@/components/homeowner/home-improvement-page"
import { EquipmentGridPage } from "@/components/homeowner/equipment-grid"
import { HomeownerSearchResults } from "@/components/homeowner/homeowner-search-results"
import { DocumentsPanel } from "@/components/homeowner/documents-panel"
import { HomeownerSettingsPage } from "@/components/homeowner/homeowner-settings-page"
import { ReferralProgram } from "@/components/shared/referral-program"

export default function Tenant() {
  return (
    <PortalSidebar>
      <div className="min-h-screen">
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
            <Route path="/settings" element={<HomeownerSettingsPage />} />
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
