import { Link } from "react-router-dom"
import { ArrowRight, FileText, MessageSquare, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useWelcomeToast } from "@/hooks/use-welcome-toast"
import {
  ownerDashboardFeature,
  screeningFeature,
  rentPaymentsFeature,
  leaseManagementFeature,
  maintenanceFeature,
  documentsFeature,
  communicationFeature,
  accountingFeature,
} from "@/features"

const quickActions = [
  {
    label: "Invite tenant",
    description: "Send onboarding + screening links in one step.",
    href: "/dashboard?tab=my-users",
    icon: <PlusCircle className="h-5 w-5" />,
  },
  {
    label: "Upload lease",
    description: "Drop PDFs or start from a template.",
    href: "/owner/documents",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: "Message tenants",
    description: "Send announcements or follow up on maintenance.",
    href: "/owner/messages",
    icon: <MessageSquare className="h-5 w-5" />,
  },
]

export default function OwnerDashboardNew() {
  useWelcomeToast()

  return (
    <div className="space-y-8 p-6 lg:p-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-orange-400">Owner workspace</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Portfolio command center</h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Screening, rent, leases, maintenance, communication, documents, and accounting-lite are wired into this dashboard.
          Click any card to dive deeper.
        </p>
      </header>

      <section>
        <ownerDashboardFeature.OwnerDashboardOverview />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <Card key={action.label} className="border border-white/10 bg-white/5 dark:bg-slate-900">
            <CardContent className="flex flex-col gap-2 p-5 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900 dark:text-white">{action.label}</p>
                <span className="text-orange-400">{action.icon}</span>
              </div>
              <p>{action.description}</p>
              <Button asChild variant="ghost" className="self-start p-0 text-orange-500 hover:text-orange-400">
                <Link to={action.href} className="inline-flex items-center gap-1 text-sm font-semibold">
                  Open <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <screeningFeature.ScreeningOverview />
        <rentPaymentsFeature.RentPaymentsOverview />
        <leaseManagementFeature.LeaseManagementOverview />
        <maintenanceFeature.MaintenanceOverview />
        <documentsFeature.DocumentVaultPreview />
        <communicationFeature.CommunicationCenterPreview />
        <accountingFeature.AccountingOverview />
      </section>
    </div>
  )
}

