import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { companyInfo } from "@/constants/companyInfo"
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  Building2,
  CheckCircle,
  CreditCard,
  FileSignature,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from "lucide-react"

const pillars = [
  {
    icon: ShieldCheck,
    color: "text-emerald-400",
    title: "Acquire better tenants",
    description:
      "Background checks, identity verification, and configurable screening criteria from your preferred provider — SmartMove, Checkr, or RentPrep.",
  },
  {
    icon: CreditCard,
    color: "text-sky-400",
    title: "Collect rent reliably",
    description:
      "Stripe + Plaid ACH rails, autopay enrollment, automated late fees, and real-time ledger updates. Owners see balances without asking.",
  },
  {
    icon: FileSignature,
    color: "text-purple-400",
    title: "Close leases digitally",
    description:
      "Template library, custom document upload, and eSign triggers via DocuSign or HelloSign. Full audit trail stored per lease.",
  },
  {
    icon: Wrench,
    color: "text-orange-400",
    title: "Resolve maintenance fast",
    description:
      "Tenant intake with photos, manager triage, vendor assignment, and automated status notifications — all tracked in one place.",
  },
  {
    icon: MessageSquare,
    color: "text-pink-400",
    title: "Communicate without silos",
    description:
      "Role-scoped in-app threads plus SendGrid/Resend email and Twilio SMS. Bulk announcements for policy changes or reminders.",
  },
  {
    icon: BarChart3,
    color: "text-yellow-400",
    title: "Report with confidence",
    description:
      "Portfolio KPIs, cash-flow snapshots, expense ledgers, and owner statements. CSV-ready for your accountant.",
  },
]

const architecture = [
  {
    layer: "Data layer",
    description: "PostgreSQL via Supabase — row-level security enforces role boundaries at the database level.",
    icon: Layers,
  },
  {
    layer: "API layer",
    description: "Express + TypeScript REST API with Zod-validated payloads, JWT auth, and Stripe webhook handling.",
    icon: Zap,
  },
  {
    layer: "AI layer",
    description: "Claude (claude-sonnet-4-6) agentic loop with 10 tools: portfolio summary, maintenance CRUD, at-risk scoring, rent status.",
    icon: Sparkles,
  },
  {
    layer: "Portal layer",
    description: "Role-aware React dashboards — manager, owner, tenant, and maintenance each land in their own workspace automatically.",
    icon: Users,
  },
]

const comparisonRows = [
  { feature: "Tenant screening integration", ondo: true, spreadsheet: false, generic: "partial" },
  { feature: "Autopay + ACH rails", ondo: true, spreadsheet: false, generic: true },
  { feature: "Maintenance lifecycle tracking", ondo: true, spreadsheet: false, generic: "partial" },
  { feature: "Lease eSign integration", ondo: true, spreadsheet: false, generic: "partial" },
  { feature: "AI portfolio assistant", ondo: true, spreadsheet: false, generic: false },
  { feature: "Role-scoped portals", ondo: true, spreadsheet: false, generic: "partial" },
  { feature: "At-risk tenant ML scoring", ondo: true, spreadsheet: false, generic: false },
  { feature: "Owner financial statements", ondo: true, spreadsheet: "manual", generic: "partial" },
]

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto" />
  if (value === false) return <span className="text-white/30 text-xl mx-auto block text-center">–</span>
  return <span className="text-yellow-400 text-xs mx-auto block text-center">{value}</span>
}

const timeline = [
  { day: "Day 1", action: "Invite your first owner and property — roles auto-configure." },
  { day: "Day 2", action: "Add tenants via secure invite link; they apply in the portal." },
  { day: "Day 3", action: "Run background checks; lease generated from template." },
  { day: "Day 4", action: "Tenant enables autopay; rent schedule created automatically." },
  { day: "Day 5", action: "First maintenance ticket submitted with photos." },
  { day: "Day 7", action: "Owner dashboard live: rent, tickets, and AI assistant." },
]

export default function Product() {
  return (
    <div className="flex flex-col bg-slate-950 text-white min-h-screen">
      {/* Hero */}
      <section className="px-4 py-20 sm:py-28">
        <div className="container mx-auto grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <Badge variant="outline" className="mb-4 border-orange-500/40 text-orange-400 bg-transparent">
              <Building2 className="mr-1 h-3.5 w-3.5" /> Platform overview
            </Badge>
            <h1 className="text-4xl font-semibold sm:text-5xl leading-tight">
              {companyInfo.name}: the operating system for small landlords
            </h1>
            <p className="mt-5 text-lg text-white/70 leading-relaxed">
              One platform replaces the patchwork of spreadsheets, email threads, and disconnected tools that landlords
              with 1–20 units rely on today. Screening, rent, leases, maintenance, comms, and accounting — unified and
              role-aware from day one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-orange-500 text-black hover:bg-orange-400">
                <Link to="/free-trial">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link to="/features">Explore all features <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">What's inside</CardTitle>
              <CardDescription className="text-white/60">
                Every module you need, none of the bloat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Tenant screening (SmartMove / Checkr)",
                "Rent collection via Stripe + ACH",
                "Lease builder + DocuSign / HelloSign eSign",
                "Maintenance intake, triage, vendor assign",
                "In-app messaging + email/SMS",
                "Accounting lite — ledger, P&L, CSV export",
                "AI assistant — agentic, role-scoped",
                "Push notifications (VAPID)",
                "Owner + tenant + manager portals",
                "Map-based property search",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-white/80">
                  <BadgeCheck className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Six pillars */}
      <section className="bg-slate-900 px-4 py-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-400 mb-2">Six pillars</p>
            <h2 className="text-3xl font-semibold">The full property operations loop</h2>
            <p className="mt-3 text-white/70 max-w-xl mx-auto">
              From tenant acquisition to monthly statements — every step is handled in one system.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => {
              const Icon = p.icon
              return (
                <Card key={p.title} className="border-white/10 bg-white/5">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="rounded-full bg-white/10 p-2.5 mt-1 flex-shrink-0">
                      <Icon className={`h-5 w-5 ${p.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{p.title}</CardTitle>
                      <CardDescription className="text-white/60 mt-1">{p.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="px-4 py-20">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-400 mb-2">Architecture</p>
            <h2 className="text-3xl font-semibold">Built to scale with you</h2>
            <p className="mt-3 text-white/70 max-w-xl mx-auto">
              Four layers designed for reliability, security, and developer sanity.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {architecture.map((a) => {
              const Icon = a.icon
              return (
                <Card key={a.layer} className="border-white/10 bg-white/5">
                  <CardHeader>
                    <div className="rounded-full bg-orange-500/20 p-2.5 w-fit mb-2">
                      <Icon className="h-5 w-5 text-orange-400" />
                    </div>
                    <CardTitle className="text-white text-base">{a.layer}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/60">{a.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-slate-900 px-4 py-20">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-400 mb-2">Why Ondo</p>
            <h2 className="text-3xl font-semibold">vs. spreadsheets and generic tools</h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-4 py-3 text-white/60 font-medium">Feature</th>
                  <th className="text-center px-4 py-3 text-orange-400 font-semibold">Ondo</th>
                  <th className="text-center px-4 py-3 text-white/40 font-medium">Spreadsheets</th>
                  <th className="text-center px-4 py-3 text-white/40 font-medium">Generic PM tools</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    <td className="px-4 py-3 text-white/80">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><ComparisonCell value={row.ondo} /></td>
                    <td className="px-4 py-3 text-center"><ComparisonCell value={row.spreadsheet} /></td>
                    <td className="px-4 py-3 text-center"><ComparisonCell value={row.generic} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 7-day timeline */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-400 mb-2">Go-live timeline</p>
            <h2 className="text-3xl font-semibold">Live in under a week</h2>
            <p className="mt-3 text-white/70">No migration, no training sessions. Just invite, configure, and run.</p>
          </div>
          <div className="space-y-4">
            {timeline.map((t) => (
              <div key={t.day} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 text-right">
                  <span className="text-orange-400 font-semibold text-sm">{t.day}</span>
                </div>
                <div className="flex-1 border-l border-white/10 pl-4 pb-4">
                  <p className="text-white/80 text-sm">{t.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 px-4 py-20 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold">One platform. Every role. No spreadsheets.</h2>
          <p className="mt-4 text-white/70">
            Join landlords who replaced cobbled tools with a single workflow for owners, tenants, and managers.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-500 text-black hover:bg-orange-400">
              <Link to="/free-trial">Start free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
