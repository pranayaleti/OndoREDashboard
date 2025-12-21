import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PageBanner } from "@/components/page-banner"

const tenantQuestions = [
  {
    q: "How do tenants receive access?",
    a: "Owners send invites directly from the dashboard. Tenants create a password, optionally add payment methods, and can immediately authorize screening, upload documents, and enable autopay.",
  },
  {
    q: "Can I pay rent with ACH or card?",
    a: "Yes. We prep the UI, schedules, receipts, and late-fee workflows. Once you plug in Stripe or Plaid credentials, tenants can pay via ACH or card and receive receipts automatically.",
  },
  {
    q: "What if I need maintenance support?",
    a: "Open a ticket inside the portal, attach photos/video, and choose a priority. Owners see the same timeline, can assign vendors, and both parties receive notifications via email/SMS placeholders.",
  },
]

const ownerQuestions = [
  {
    q: "Does Ondo replace my PMS?",
    a: "If you're managing 1–20 units, yes. We cover onboarding, screening, rent payments, maintenance, leases, documents, communication, and accounting-lite. Larger portfolios often run Ondo alongside their ERP while migrating.",
  },
  {
    q: "How do integrations work?",
    a: "We scaffold every feature with API hooks and TODOs for SmartMove, Checkr, Stripe, Plaid, DocuSign, HelloSign, SendGrid/Resend, and Twilio. You supply the keys when you're ready.",
  },
  {
    q: "Can I export my financial data?",
    a: "Yes. Every plan includes ledger exports (CSV/PDF), rent statements, and document vault backups organized by property + category.",
  },
]

export default function FAQPage() {
  return (
    <main className="bg-slate-950 text-white">
      <PageBanner
        title="Frequently asked questions"
        subtitle="Everything owners, operators, and tenants ask before launching Ondo."
      />

      <section className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">For tenants</h2>
          <Accordion type="single" collapsible className="mt-6 space-y-4">
            {tenantQuestions.map((item, index) => (
              <AccordionItem key={item.q} value={`tenant-${index}`} className="border border-white/10 bg-white/5">
                <AccordionTrigger className="px-4 text-left text-white">{item.q}</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-white/80">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">For owners & operators</h2>
          <Accordion type="single" collapsible className="mt-6 space-y-4">
            {ownerQuestions.map((item, index) => (
              <AccordionItem key={item.q} value={`owner-${index}`} className="border border-white/10 bg-white/5">
                <AccordionTrigger className="px-4 text-left text-white">{item.q}</AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-white/80">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </main>
  )
}
