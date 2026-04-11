import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { PageBanner } from "@/components/page-banner"
import { companyInfo } from "@/constants/companyInfo"
import { TenantScreeningSection } from "@/components/tenant-screening/TenantScreeningSection"
import { BarChart3, MessageSquare, ShieldCheck } from "lucide-react"

const values = [
  {
    title: "Owners first",
    copy: "Independent landlords deserve modern workflows. We ship the same automation larger portfolios enjoy without the enterprise overhead.",
    icon: BarChart3,
  },
  {
    title: "Tenant empathy",
    copy: "Residents expect transparent screening, instant receipts, and quick maintenance updates. We design every module with tenants in mind.",
    icon: MessageSquare,
  },
  {
    title: "Trustworthy ops",
    copy: "Background checks, payments, and documents deal with sensitive data. We build auditable, role-aware experiences from day one.",
    icon: ShieldCheck,
  },
]

const milestones = [
  { year: "2022", detail: "Initial landlord + tenant portal launched" },
  { year: "2023", detail: "Micro-feature architecture + maintenance hub" },
  { year: "2024", detail: "Stripe ACH, eSign integrations, and tenant screening workflows launched" },
  { year: "Today", detail: "Full SaaS blueprint for Ondo Property Management" },
  { year: "Roadmap", detail: "Conversational AI assistant (lease review, portfolio insights, marketing, maintenance routing); outbound sales engine and GTM from zero" },
]

export default function AboutPage() {
  return (
    <main className="bg-background text-white">
      <PageBanner
        title={`About ${companyInfo.name}`}
        subtitle="We build the operating system for modern landlords and tenants."
      />

      <section className="container mx-auto px-4 py-12">
        <TenantScreeningSection
          ctaHref={companyInfo.calendlyUrl}
          ctaLabel="Book a platform tour"
          title="Product vision"
          description="A single platform powering onboarding, screening, rent collection, maintenance, communication, and accounting for lean teams managing 1–20 units (and growing). We're building a conversational AI assistant for lease review, portfolio insights, marketing, and auto-routing maintenance — and we build outbound sales from the ground up: prospecting, lead qualification, CRM from zero, and representing Ondo RE as your first point of contact."
        />
      </section>

      <section className="bg-card px-4 py-16">
        <div className="container mx-auto grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-orange-300">mission</p>
            <h2 className="mt-4 text-3xl font-semibold">Keep small portfolios wildly efficient</h2>
            <p className="mt-4 text-white/70">
              {companyInfo.name} started as an internal tool for boutique property operators. Paper leases, missing rent, and phone-tag maintenance made it impossible to grow. We rebuilt every workflow—screening, rent, maintenance, documents, communication, accounting—as modular features so owners and tenants finally share the same truth.
            </p>
            <p className="mt-4 text-white/70">
              Today we deliver the same polish you expect from enterprise PMS suites, but in a lightweight SaaS model that launches within days and scales with your portfolio.
            </p>
          </div>
          <div className="grid gap-4">
            {values.map((value) => (
              <Card key={value.title} className="border-white/10 bg-card/60">
                <CardHeader className="flex items-center gap-3">
                  <value.icon className="h-6 w-6 text-orange-300" />
                  <div>
                    <CardTitle className="text-xl text-white">{value.title}</CardTitle>
                    <CardDescription className="text-white/70">{value.copy}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="container mx-auto grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">timeline</p>
            <h2 className="mt-4 text-3xl font-semibold">Milestones</h2>
            <p className="mt-4 text-white/70">
              We iterate with operators every quarter, folding their playbooks into reusable modules and hooks.
            </p>
          </div>
          <div className="space-y-4">
            {milestones.map((entry) => (
              <div key={entry.year} className="rounded-2xl border border-white/10 bg-card/60 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-orange-200">{entry.year}</p>
                <p className="mt-2 text-lg text-white">{entry.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card px-4 py-16 text-center">
        <div className="container mx-auto">
          <h2 className="text-3xl font-semibold">Join the operators shaping {companyInfo.name}</h2>
          <p className="mt-4 text-white/70">
            Share feedback, request modules, or co-build integrations. We ship weekly and keep you in the loop.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-orange-500 text-black hover:bg-orange-400">
              <Link to="/free-trial">Start free trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-card/75">
              <Link to="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
