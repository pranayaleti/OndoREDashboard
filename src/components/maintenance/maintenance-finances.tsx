import { BarChart3, FileSpreadsheet, Receipt, Wrench } from "lucide-react"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { BookkeepingReportingWidget } from "@/components/dashboard/widgets/bookkeeping-reporting"

export default function MaintenanceFinances() {
  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <Breadcrumb items={[{ label: "Finances", icon: BarChart3 }]} />
      <BookkeepingReportingWidget
        eyebrow="Maintenance Financials"
        title="Know exactly where service dollars go."
        subtitle="Tie labor hours and material costs to properties, then hand back audit-ready summaries without cluttering the main dashboard."
        ctaLabel="Review ticket queue"
        ctaHref="/maintenance/tickets"
        transactionsHref="/maintenance/tickets"
        cashFlowHref="/maintenance/tickets"
        taxPackageCardHref="/maintenance/documents"
        features={[
          {
            label: "Track labor against tickets",
            icon: <Wrench className="h-4 w-4" />,
            href: "/maintenance/tickets",
          },
          {
            label: "Review cost trends",
            icon: <BarChart3 className="h-4 w-4" />,
            href: "/maintenance/tickets",
          },
          {
            label: "Export service summaries",
            icon: <FileSpreadsheet className="h-4 w-4" />,
            href: "/maintenance/documents",
          },
          {
            label: "Package receipts and notes",
            icon: <Receipt className="h-4 w-4" />,
            href: "/maintenance/documents",
          },
        ]}
        taxSummary={{
          timePeriod: "This Week",
          properties: "Service work overview",
          categorized: 14,
          uncategorized: 3,
          attachments: 9,
          ctaLabel: "Open service docs",
          ctaHref: "/maintenance/documents",
        }}
      />
      <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
        The maintenance dashboard now keeps the home screen focused on assigned work. This page is the dedicated place for service-cost reporting and exports.
      </div>
    </div>
  )
}
