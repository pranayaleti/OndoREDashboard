import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { companyInfo } from "@/constants/companyInfo"
import { TenantScreeningSection } from "@/components/tenant-screening/TenantScreeningSection"
import {
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  CreditCard,
  FileSignature,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const featureHighlights = [
  {
    title: "Screen smarter",
    description: "Background checks, identity verification, and fraud signals from SmartMove or Checkr in one flow.",
    icon: ShieldCheck,
  },
  {
    title: "Collect rent anywhere",
    description: "Stripe + Plaid-ready ACH, autopay, late-fee automation, and downloadable receipts for every tenant.",
    icon: CreditCard,
  },
  {
    title: "Close tickets fast",
    description: "Intake, triage, vendor assignment, and notifications so maintenance never falls through the cracks.",
    icon: MessageSquare,
  },
  {
    title: "Lease + eSign",
    description: "Generate from templates, upload your own docs, and trigger DocuSign/HelloSign when you're ready to execute.",
    icon: FileSignature,
  },
]

const workflowTracks = [
  {
    title: "Owner workflow",
    description: "Consolidate onboarding, screening, rent, and accounting across as few as 1 unit or as many as 500.",
    steps: [
      "Invite or onboard owners with a branded experience",
      "Automate background checks + lease creation",
      "Monitor rent, expenses, and maintenance in one dashboard",
      "Send statements and export-ready ledgers",
    ],
  },
  {
    title: "Tenant workflow",
    description: "Make move-ins friendly with instant invites, digital payments, and self-serve maintenance.",
    steps: [
      "Receive secure invitations + apply in minutes",
      "Authorize screening + upload documents in the portal",
      "Enable autopay, download receipts, and view leases",
      "Submit maintenance with photos or video and receive status alerts",
    ],
  },
]

const moduleCards = [
  {
    title: "Tenant Screening",
    description: "SmartMove / Checkr hooks, configurable criteria, and stored decision audit trails.",
    tag: "features/screening",
  },
  {
    title: "Rent Payments",
    description: "Schedules, autopay, ACH rail readiness, and landlord statements for clean books.",
    tag: "features/rent-payments",
  },
  {
    title: "Lease Management",
    description: "Template builder, document vault, doc status, and eSign triggers.",
    tag: "features/lease-management",
  },
  {
    title: "Maintenance",
    description: "Full lifecycle tracking, vendor assignment, and SMS/email notifications.",
    tag: "features/maintenance",
  },
  {
    title: "Communication",
    description: "In-app messaging plus SendGrid/Resend + Twilio placeholders for omni-channel alerts.",
    tag: "features/communication",
  },
  {
    title: "Accounting lite",
    description: "Ledger entries, expense logging, profit/loss snapshots, and CSV exports.",
    tag: "features/accounting",
  },
]

const stats = [
  { label: "Units automated", value: "4K+" },
  { label: "Screenings per month", value: "1,200" },
  { label: "Avg. time-to-rent", value: "23 days" },
  { label: "Maintenance SLA", value: "<24h" },
]

const testimonials = [
  {
    quote:
      "We launched autopay + screening in a weekend. Owners finally see real-time rent + maintenance, and tenants love the portal.",
    author: "Taylor M.",
    role: "Portfolio owner, 38 doors",
  },
  {
    quote: "Our leasing team cut onboarding time in half. The lease + eSign module keeps our templates and doc audit trail in sync.",
    author: "Priya G.",
    role: "Director of Operations, boutique PM",
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-slate-950 text-white">
      <section id="product" className="relative overflow-hidden px-4 py-20 sm:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/70 to-slate-950" />
        <div className="container relative z-10 mx-auto grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
              <Sparkles className="h-3.5 w-3.5" /> Purpose-built for landlords with 1–20 units
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              {companyInfo.name}: Modern property operations for owners & tenants
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/70">
              Launch onboarding, background checks, rent collection, maintenance, communication, and accounting from a single SaaS platform. No cobbled spreadsheets, no missed rent, just a clean workflow for everyone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-orange-500 text-black hover:bg-orange-400">
                <Link to="/free-trial">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link to="/register">Owner sign up</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white/70 hover:text-white">
                <Link to="/login">Tenant / staff login</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6 text-left text-white/70 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <p className="text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Unified owner & tenant portal</CardTitle>
              <CardDescription className="text-white/70">
                Role-aware dashboards for owners, tenants, admins, and maintenance teams.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-white/70">
              <div className="flex items-start gap-3">
                <BadgeCheck className="mt-1 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-medium text-white">Role-based routing</p>
                  <p className="text-sm">Owners, tenants, and vendors land in the right workspace automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="mt-1 h-5 w-5 text-sky-300" />
                <div>
                  <p className="font-medium text-white">Micro-feature architecture</p>
                  <p className="text-sm">Screening, rent payments, leases, maintenance, documents, comms, accounting.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BarChart3 className="mt-1 h-5 w-5 text-orange-300" />
                <div>
                  <p className="font-medium text-white">Insights</p>
                  <p className="text-sm">Portfolio KPIs, cash flow snapshots, expiring leases, open tickets.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-slate-900 px-4 py-16" id="features">
        <div className="container mx-auto space-y-10">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-400">Feature deep dive</p>
            <h2 className="mt-2 text-3xl font-semibold">Everything owners and tenants expect, shipped day one</h2>
            <p className="mt-3 text-white/70">Launch background checks, rent, maintenance, lease tracking, communication, and accounting from one platform.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featureHighlights.map((feature) => (
              <Card key={feature.title} className="border-white/10 bg-white/5">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-full bg-white/10 p-3">
                    <feature.icon className="h-6 w-6 text-orange-300" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                    <CardDescription className="text-white/70">{feature.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16" id="workflows">
        <div className="container mx-auto grid gap-8 lg:grid-cols-2">
          {workflowTracks.map((track) => (
            <Card key={track.title} className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">{track.title}</CardTitle>
                <CardDescription className="text-white/70">{track.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4 text-white/80">
                  {track.steps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/80 text-sm font-semibold text-black">
                        {index + 1}
                      </div>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 px-4 py-16" id="modules">
        <div className="container mx-auto">
          <div className="flex flex-col gap-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Micro-feature architecture</p>
            <h2 className="text-3xl font-semibold text-white">Plug-and-play modules aligned with your roadmap</h2>
            <p className="text-white/70">Every feature has APIs, UI, hooks, and state ready for future backend wiring.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {moduleCards.map((module) => (
              <Card key={module.title} className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-white">{module.title}</CardTitle>
                  <CardDescription className="text-orange-300">{module.tag}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/70">{module.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16">
        <div className="container mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Why operators switch to {companyInfo.name}</CardTitle>
              <CardDescription className="text-white/70">Purpose-built for lean teams running 1–20 units (and scaling).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testimonials.map((testimonial) => (
                <blockquote key={testimonial.author} className="rounded-xl bg-white/5 p-5 text-white/80">
                  “{testimonial.quote}”
                  <footer className="mt-3 text-sm text-white/60">
                    {testimonial.author} · {testimonial.role}
                  </footer>
                </blockquote>
              ))}
            </CardContent>
          </Card>
          <div className="space-y-8">
            <TenantScreeningSection
              title="Tenant screening built for SaaS"
              description="Plug into the screening provider you choose. We store the metadata, surface statuses, and leave the API key wiring flexible for SmartMove, ApplyConnect, RentPrep, or Checkr."
              ctaLabel="Book screening prep"
              ctaHref="/contact"
            />
            <Card className="border-white/10 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Building2 className="h-5 w-5" /> Pricing snapshot
                </CardTitle>
                <CardDescription className="text-white/70">Transparent monthly pricing with unlimited tenants + owners.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-white/80">
                <p className="text-3xl font-semibold text-white">Starting at $89/mo</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Unlimited tenant invites</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Screening + rent modules included</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Maintenance + communication center</li>
                </ul>
                <Button asChild className="w-full bg-orange-500 text-black hover:bg-orange-400">
                  <Link to="/pricing">See detailed pricing</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-4 py-16" id="cta">
        <div className="container mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Ready when you are</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Launch Ondo Property Management in under a week</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">
            Owners, tenants, vendors, and admins finally share a single workspace. Start a free trial, invite a tenant, run a screening, and collect your next rent payment without leaving the platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-500 text-black hover:bg-orange-400">
              <Link to="/free-trial">Start free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Link to="/contact">Talk to our team</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
