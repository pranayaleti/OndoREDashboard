import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CheckCircle,
  CreditCard,
  FileSignature,
  FileText,
  Key,
  MessageSquare,
  PieChart,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from "lucide-react"

const featureSections = [
  {
    id: "screening",
    badge: "Tenant Screening",
    icon: ShieldCheck,
    color: "text-emerald-400",
    title: "Screen smarter, place better",
    description:
      "Run background checks, identity verification, and fraud signals in one flow. Integrate SmartMove, Checkr, ApplyConnect, or RentPrep — Ondo stores the metadata and surfaces statuses regardless of provider.",
    bullets: [
      "Configurable screening criteria per property",
      "Stored decision audit trails for compliance",
      "Applicant self-serve portal to authorize checks",
      "Instant status updates to owner dashboards",
    ],
  },
  {
    id: "rent-payments",
    badge: "Rent Payments",
    icon: CreditCard,
    color: "text-sky-400",
    title: "Collect rent without the friction",
    description:
      "Stripe + Plaid-ready ACH, autopay enrollment, late-fee automation, and downloadable receipts for every tenant. Landlords see balances in real time — no more chasing payments.",
    bullets: [
      "Autopay enrollment with one-click setup",
      "Late-fee rules configurable per lease",
      "ACH and card rails with Stripe Connect",
      "Downloadable receipts and payment history",
    ],
  },
  {
    id: "lease-management",
    badge: "Lease Management",
    icon: FileSignature,
    color: "text-purple-400",
    title: "Generate, sign, and track leases",
    description:
      "Build leases from reusable templates or upload your own. Trigger DocuSign or HelloSign when you're ready to execute. Every document lives in a role-scoped vault.",
    bullets: [
      "Template library with variable substitution",
      "Upload and store custom lease documents",
      "eSign triggers via DocuSign / HelloSign",
      "Expiry reminders and renewal workflows",
    ],
  },
  {
    id: "maintenance",
    badge: "Maintenance",
    icon: Wrench,
    color: "text-orange-400",
    title: "Close tickets fast",
    description:
      "Tenants submit requests with photos or video. Managers triage and assign vendors. Everyone gets status updates — no request falls through the cracks.",
    bullets: [
      "Tenant self-serve intake with media attachments",
      "Priority triage and vendor assignment",
      "SMS + email status updates via Resend / Twilio",
      "Sub-24h SLA tracking and reporting",
    ],
  },
  {
    id: "communication",
    badge: "Communication",
    icon: MessageSquare,
    color: "text-pink-400",
    title: "One inbox for every conversation",
    description:
      "In-app messaging keeps owners, tenants, and vendors in their own thread. Email and SMS delivery keep updates moving without third-party clutter.",
    bullets: [
      "Role-scoped in-app message threads",
      "Email notifications via Resend / SendGrid",
      "SMS alerts via Twilio integration",
      "Bulk announcements to owners or tenants",
    ],
  },
  {
    id: "accounting",
    badge: "Accounting Lite",
    icon: PieChart,
    color: "text-yellow-400",
    title: "Clean books, less work",
    description:
      "Log income and expenses, view profit/loss snapshots per property, and export ledgers in CSV format. No accounting degree required.",
    bullets: [
      "Income and expense ledger per property",
      "Profit/loss snapshots and cash flow views",
      "Owner statement generation",
      "CSV exports for your accountant",
    ],
  },
  {
    id: "ai-assistant",
    badge: "AI Assistant",
    icon: Sparkles,
    color: "text-violet-400",
    title: "Agentic property intelligence",
    description:
      "Ask the AI about your portfolio, list or create maintenance tickets, get at-risk tenant signals, and pull rent status — all in one conversational layer, role-scoped for managers and owners.",
    bullets: [
      "Portfolio summary and KPI queries in plain English",
      "Create and list maintenance requests by chat",
      "At-risk tenant scoring and intervention suggestions",
      "Rent status checks across all units",
    ],
  },
  {
    id: "notifications",
    badge: "Push Notifications",
    icon: Bell,
    color: "text-teal-400",
    title: "Stay informed everywhere",
    description:
      "Web Push (VAPID) notifications keep owners and tenants in the loop on rent due dates, maintenance updates, and lease expiries — without requiring them to log in.",
    bullets: [
      "Browser push via VAPID (no native app needed)",
      "Per-user notification preference controls",
      "Triggered on payment, maintenance, and lease events",
      "Notification history and read receipts",
    ],
  },
  {
    id: "owner-dashboard",
    badge: "Owner Dashboard",
    icon: BarChart3,
    color: "text-orange-300",
    title: "Portfolio health at a glance",
    description:
      "Owners see rent status, maintenance tickets, expiring leases, and at-risk tenant signals in one screen. Risk scoring uses ML to flag tenants before problems escalate.",
    bullets: [
      "Portfolio KPIs and cash flow snapshots",
      "ML-powered at-risk tenant scoring",
      "Expiring lease calendar and renewal prompts",
      "Maintenance open-ticket summary",
    ],
  },
  {
    id: "documents",
    badge: "Document Vault",
    icon: FileText,
    color: "text-blue-400",
    title: "Every document, role-scoped",
    description:
      "Upload, store, and share leases, IDs, inspection reports, and receipts via Supabase Storage. Signed URLs expire automatically to keep sensitive files private.",
    bullets: [
      "Supabase Storage with signed URL access",
      "Role-scoped visibility per document",
      "Lease, ID, inspection, and receipt categories",
      "Automatic expiry on shared download links",
    ],
  },
  {
    id: "vendor-management",
    badge: "Vendor Management",
    icon: Users,
    color: "text-indigo-400",
    title: "Your trusted vendor network",
    description:
      "Build a vetted vendor directory for plumbers, electricians, cleaners, and more. Assign vendors to maintenance tickets and track performance over time.",
    bullets: [
      "Vendor directory with trade and contact details",
      "Assign vendors directly from maintenance tickets",
      "Activate/deactivate vendors without deleting history",
      "Vendor performance tracking per ticket",
    ],
  },
  {
    id: "property-search",
    badge: "Map Property Search",
    icon: Building2,
    color: "text-green-400",
    title: "Find properties on the map",
    description:
      "Interactive Leaflet map lets tenants and prospects browse available units by location, price, and unit type. Landlords can pin listings in seconds.",
    bullets: [
      "Interactive Leaflet map with property pins",
      "Filter by price, beds, unit type",
      "Link directly to property detail pages",
      "Geocoded from property address on save",
    ],
  },
]

const roleHighlights = [
  {
    role: "Property Managers",
    icon: Key,
    features: ["Dashboard with all portfolios", "Tenant + owner onboarding", "Full maintenance lifecycle", "Bulk comms and statements"],
  },
  {
    role: "Owners",
    icon: Building2,
    features: ["Real-time rent visibility", "AI-powered risk alerts", "Expense and P&L view", "Maintenance ticket status"],
  },
  {
    role: "Tenants",
    icon: Users,
    features: ["Online rent payment + autopay", "Maintenance submission with media", "Lease and document access", "In-app messaging"],
  },
  {
    role: "Maintenance Teams",
    icon: Wrench,
    features: ["Assigned ticket queue", "Status update tools", "Vendor coordination", "Media attachment review"],
  },
]

export default function Features() {
  return (
    <div className="flex flex-col bg-slate-950 text-white min-h-screen">
      {/* Hero */}
      <section className="px-4 py-20 sm:py-28 text-center">
        <div className="container mx-auto max-w-3xl">
          <Badge variant="outline" className="mb-4 border-orange-500/40 text-orange-400 bg-transparent">
            <Zap className="mr-1 h-3.5 w-3.5" /> All features
          </Badge>
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Everything shipped, nothing missing
          </h1>
          <p className="mt-4 text-lg text-white/70">
            12 purpose-built modules covering every touchpoint between owners, tenants, vendors, and managers —
            all wired together in one platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-500 text-black hover:bg-orange-400">
              <Link to="/free-trial">Start free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature sections */}
      <section className="px-4 pb-20">
        <div className="container mx-auto space-y-20">
          {featureSections.map((f, i) => {
            const Icon = f.icon
            const isEven = i % 2 === 0
            return (
              <div
                key={f.id}
                className={`grid gap-10 lg:grid-cols-2 items-center ${isEven ? "" : "lg:[&>*:first-child]:order-last"}`}
              >
                {/* Text */}
                <div>
                  <Badge variant="outline" className="mb-3 border-white/20 bg-transparent text-white/60 text-xs uppercase tracking-wider">
                    {f.badge}
                  </Badge>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-full bg-white/10 p-2.5">
                      <Icon className={`h-5 w-5 ${f.color}`} />
                    </div>
                    <h2 className="text-2xl font-semibold">{f.title}</h2>
                  </div>
                  <p className="text-white/70 leading-relaxed mb-6">{f.description}</p>
                  <ul className="space-y-2">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-white/80 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Card visual */}
                <Card className="border-white/10 bg-white/5 backdrop-blur">
                  <CardHeader>
                    <div className={`mb-2 rounded-full bg-white/10 p-3 w-fit`}>
                      <Icon className={`h-8 w-8 ${f.color}`} />
                    </div>
                    <CardTitle className="text-white">{f.badge}</CardTitle>
                    <CardDescription className="text-white/60">{f.description.slice(0, 80)}…</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm text-white/70">
                          <BadgeCheck className="h-4 w-4 text-orange-400 flex-shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </section>

      {/* Role highlights */}
      <section className="bg-slate-900 px-4 py-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-400 mb-2">Role-aware platform</p>
            <h2 className="text-3xl font-semibold">The right tools for every role</h2>
            <p className="mt-3 text-white/70 max-w-xl mx-auto">
              One platform, four role-scoped workspaces. Everyone lands where they need to be.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {roleHighlights.map((r) => {
              const Icon = r.icon
              return (
                <Card key={r.role} className="border-white/10 bg-white/5">
                  <CardHeader>
                    <div className="rounded-full bg-orange-500/20 p-2.5 w-fit mb-2">
                      <Icon className="h-5 w-5 text-orange-400" />
                    </div>
                    <CardTitle className="text-white text-lg">{r.role}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {r.features.map((feat) => (
                        <li key={feat} className="flex items-center gap-2 text-sm text-white/70">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold">Ready to see it in action?</h2>
          <p className="mt-3 text-white/70">
            Start a free trial and explore every feature with your own data.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-500 text-black hover:bg-orange-400">
              <Link to="/free-trial">Start free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link to="/contact">Talk to the team</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
