import { Breadcrumb } from "@/components/ui/breadcrumb"
import { EmptyState } from "@/components/ui/empty-state"
import { BarChart3, Users } from "lucide-react"

/** Kept for demo PDF tooling only — never render as live portfolio data. */
export const mockOccupancyData = {
  period: "November 2025",
  summary: {
    totalUnits: 6,
    occupiedUnits: 1,
    vacantUnits: 5,
    occupancyRate: 16.7,
    averageRent: 2000,
    totalMonthlyRevenue: 2000,
  },
  tenants: [
    { name: "John Smith", unit: "Unit 101", rent: 2000, moveIn: "Jan 2024", status: "Active", leaseEnd: "Dec 2024" },
    { name: "Sarah Johnson", unit: "Unit 102", rent: 1800, moveIn: "Mar 2024", status: "Active", leaseEnd: "Feb 2025" },
    { name: "Mike Davis", unit: "Unit 103", rent: 2200, moveIn: "Feb 2024", status: "Active", leaseEnd: "Jan 2025" },
  ],
  properties: [
    { name: "Oak Street Apartments", units: 2, occupied: 1, vacant: 1, occupancyRate: 50 },
    { name: "Pine View Complex", units: 2, occupied: 0, vacant: 2, occupancyRate: 0 },
    { name: "Maple Heights", units: 2, occupied: 0, vacant: 2, occupancyRate: 0 },
  ],
  trends: {
    previousMonth: 16.7,
    change: 0,
    averageTenancy: 12,
    turnoverRate: 8.3,
  },
}

export default function OccupancyReport() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Reports", href: "/owner/reports", icon: BarChart3 },
            { label: "Occupancy Report", icon: Users },
          ]}
        />
      </div>
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No occupancy data yet"
        description="Occupancy analytics will appear here once your properties have units and active leases."
        ctaLabel="View properties"
        ctaHref="/owner/properties"
      />
    </div>
  )
}
