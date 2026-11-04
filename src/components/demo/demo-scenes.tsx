import type { ReactNode } from "react"
import { AlertTriangle, CheckCircle2, CreditCard, FileText, MessageSquare, ShieldCheck, Sparkles, Wrench } from "lucide-react"

export type DemoRole = "owner" | "tenant"

export interface DemoStep {
  id: string
  title: string
  blurb: string
  scene: ReactNode
}

const Row = ({ left, right, tone }: { left: string; right: string; tone?: "ok" | "warn" }) => (
  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
    <span className="text-white/80">{left}</span>
    <span className={tone === "warn" ? "text-amber-300" : tone === "ok" ? "text-emerald-300" : "text-white"}>{right}</span>
  </div>
)

const Panel = ({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-orange-300">
      {icon}
      <span className="text-sm font-semibold uppercase tracking-wider">{title}</span>
    </div>
    {children}
  </div>
)

export const ownerSteps: DemoStep[] = [
  {
    id: "overview",
    title: "Your portfolio at a glance",
    blurb: "Rent, occupancy and open items for every property in one place.",
    scene: (
      <Panel icon={<CheckCircle2 className="h-5 w-5" />} title="Portfolio overview">
        <Row left="Maple Street duplex" right="Rent paid" tone="ok" />
        <Row left="Cedar Court unit 2" right="Rent due in 3 days" />
        <Row left="Oak Lane house" right="1 open maintenance request" tone="warn" />
      </Panel>
    ),
  },
  {
    id: "screening",
    title: "Screen applicants",
    blurb: "Invite an applicant, run screening, and review the result without leaving the portal.",
    scene: (
      <Panel icon={<ShieldCheck className="h-5 w-5" />} title="Applicant screening">
        <Row left="Invite sent to applicant" right="Done" tone="ok" />
        <Row left="Screening report" right="Ready to review" tone="ok" />
        <Row left="Lease from template" right="Next step" />
      </Panel>
    ),
  },
  {
    id: "rent",
    title: "Collect rent on schedule",
    blurb: "Rent schedules, autopay and receipts, tracked per tenant.",
    scene: (
      <Panel icon={<CreditCard className="h-5 w-5" />} title="Rent collection">
        <Row left="Autopay enrolled" right="2 of 3 tenants" />
        <Row left="Receipts" right="Sent automatically" tone="ok" />
        <Row left="Late fee rule" right="Applied by schedule" />
      </Panel>
    ),
  },
  {
    id: "maintenance",
    title: "Handle maintenance requests",
    blurb: "Tenants submit requests with photos. You see them, assign them and track them to done.",
    scene: (
      <Panel icon={<Wrench className="h-5 w-5" />} title="Maintenance">
        <Row left="Leaking faucet, Oak Lane" right="New with photos" tone="warn" />
        <Row left="Assigned to vendor" right="In progress" />
        <Row left="Tenant notified" right="Done" tone="ok" />
      </Panel>
    ),
  },
  {
    id: "assistant",
    title: "Ask the assistant",
    blurb: "Ask about your portfolio in plain English and get answers from your own data.",
    scene: (
      <Panel icon={<Sparkles className="h-5 w-5" />} title="Assistant">
        <div className="ml-auto max-w-[80%] rounded-xl bg-orange-500/20 px-3 py-2 text-sm text-white">Which tenants have not paid this month?</div>
        <div className="max-w-[85%] rounded-xl bg-white/10 px-3 py-2 text-sm text-white/90">Sample answer: one tenant, with the due date and a draft reminder ready to send.</div>
      </Panel>
    ),
  },
]

export const tenantSteps: DemoStep[] = [
  {
    id: "home",
    title: "Everything about your home",
    blurb: "Rent due, open requests and messages when you sign in.",
    scene: (
      <Panel icon={<CheckCircle2 className="h-5 w-5" />} title="Your home">
        <Row left="Next rent" right="Due on the 1st" />
        <Row left="Open maintenance request" right="1" tone="warn" />
        <Row left="New message from your landlord" right="1" />
      </Panel>
    ),
  },
  {
    id: "pay",
    title: "Pay rent online",
    blurb: "Pay in a few taps, set up autopay, and download receipts.",
    scene: (
      <Panel icon={<CreditCard className="h-5 w-5" />} title="Payments">
        <Row left="Pay this month's rent" right="Pay now" />
        <Row left="Autopay" right="Set up" />
        <Row left="Receipt" right="Download" tone="ok" />
      </Panel>
    ),
  },
  {
    id: "maintenance",
    title: "Report a problem with photos",
    blurb: "Describe the issue, attach photos or video, and follow progress to done.",
    scene: (
      <Panel icon={<AlertTriangle className="h-5 w-5" />} title="Maintenance request">
        <Row left="What is wrong?" right="Leaking faucet" />
        <Row left="Photos attached" right="2" />
        <Row left="Status" right="Submitted" tone="ok" />
      </Panel>
    ),
  },
  {
    id: "messages",
    title: "Message your landlord",
    blurb: "One thread with your landlord, instead of texts and email chains.",
    scene: (
      <Panel icon={<MessageSquare className="h-5 w-5" />} title="Messages">
        <div className="max-w-[80%] rounded-xl bg-white/10 px-3 py-2 text-sm text-white/90">Sample: A plumber is coming Thursday morning.</div>
        <div className="ml-auto max-w-[80%] rounded-xl bg-orange-500/20 px-3 py-2 text-sm text-white">Sample: Thanks, that works.</div>
      </Panel>
    ),
  },
  {
    id: "docs",
    title: "Your lease and documents",
    blurb: "Your lease and other documents are stored where you can find them.",
    scene: (
      <Panel icon={<FileText className="h-5 w-5" />} title="Documents">
        <Row left="Lease agreement" right="View" />
        <Row left="Rent receipts" right="View" />
        <Row left="Move-in checklist" right="View" />
      </Panel>
    ),
  },
]

export const stepsFor = (role: DemoRole) => (role === "owner" ? ownerSteps : tenantSteps)
