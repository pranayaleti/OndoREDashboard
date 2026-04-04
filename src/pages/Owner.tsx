import { Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import { PortalSidebar } from "@/components/portal-sidebar"
import Loading from "@/components/loading"
import OwnerDashboard from "@/components/dashboard/portals/owner/OwnerDashboard.new"
import { HomeownerDashboard } from "@/components/homeowner/homeowner-dashboard"
import { MortgageLoansPage } from "@/components/homeowner/mortgage-loans-page"
import { HomeImprovementPage } from "@/components/homeowner/home-improvement-page"
import { EquipmentGridPage } from "@/components/homeowner/equipment-grid"
import { HomeownerSearchResults } from "@/components/homeowner/homeowner-search-results"
import { DocumentsPanel } from "@/components/homeowner/documents-panel"
import { HomeownerSettingsPage } from "@/components/homeowner/homeowner-settings-page"
import OwnerProperties from "@/components/owner/owner-properties"
import OwnerFinances from "@/components/owner/owner-finances"
import OwnerReports from "@/components/owner/owner-reports"
import OwnerTenants from "@/components/owner/owner-tenants"
import OwnerTenantDetail from "@/components/owner/owner-tenant-detail"
import OwnerProfile from "@/components/owner/owner-profile"
import { MessagesView } from "@/components/owner/messages-view"
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
import { ReferralProgram } from "@/components/shared/referral-program"

export default function Owner() {
  return (
    <PortalSidebar>
      <div className="min-h-screen">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomeownerDashboard />} />
            <Route path="/portfolio" element={<OwnerDashboard />} />
            <Route path="/mortgage" element={<MortgageLoansPage />} />
            <Route path="/improvements" element={<HomeImprovementPage />} />
            <Route path="/equipment" element={<EquipmentGridPage />} />
            <Route path="/search" element={<HomeownerSearchResults />} />
            <Route path="/my-documents" element={<DocumentsPanel />} />
            <Route path="/settings" element={<HomeownerSettingsPage />} />
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
