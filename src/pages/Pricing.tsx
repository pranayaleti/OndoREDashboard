import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

const plans = [
  {
    name: "Starter",
    price: "$89",
    cadence: "/month",
    highlight: "Perfect for independent landlords",
    features: [
      "Up to 20 units",
      "Tenant + owner portals",
      "Tenant screening workflows",
      "Rent schedules & autopay",
      "Maintenance tracker",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "$189",
    cadence: "/month",
    highlight: "Adds advanced automations",
    featured: true,
    features: [
      "Everything in Starter",
      "Unlimited units",
      "Custom lease templates",
      "Vendor management",
      "Automated late fees",
      "Priority support",
    ],
  },
  {
    name: "Portfolio",
    price: "Custom",
    cadence: "",
    highlight: "For operators w/ dedicated teams",
    features: [
      "Everything in Growth",
      "Dedicated success manager",
      "White-label domains",
      "API access",
      "Advanced reporting",
      "Quarterly roadmap reviews",
    ],
  },
]

const addOns = [
  "DocuSign / HelloSign credentials",
  "Stripe + Plaid ACH gateways",
  "SmartMove / Checkr screening",
  "Twilio + SendGrid messaging",
]

export default function PricingPage() {
  return (
    <main className="bg-slate-950 px-4 py-16 text-white">
      <div className="container mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
          <Sparkles className="h-3.5 w-3.5" /> pricing
        </div>
        <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">Transparent pricing for lean teams</h1>
        <p className="mt-4 text-lg text-white/70">
          Every plan includes screening, rent, maintenance, lease tracking, documents, communication, and accounting-lite modules. Flip on the integrations you need when you're ready.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-orange-500 text-black hover:bg-orange-400">
            <Link to="/free-trial">Start free trial</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <Link to="/contact">Talk with sales</Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto mt-16 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.featured ? "border-orange-400 bg-white/10" : "border-white/10 bg-white/5"}
          >
            <CardHeader>
              <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
              <CardDescription className="text-white/70">{plan.highlight}</CardDescription>
              <div className="mt-4 text-left">
                <span className="text-4xl font-semibold text-white">{plan.price}</span>
                <span className="text-sm text-white/70">{plan.cadence}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-white/80">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full bg-orange-500 text-black hover:bg-orange-400">
                <Link to={plan.name === "Portfolio" ? "/contact" : "/free-trial"}>
                  {plan.name === "Portfolio" ? "Contact sales" : "Start now"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="container mx-auto mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">What every plan includes</CardTitle>
            <CardDescription className="text-white/70">
              Screening, rent payments, maintenance, leases, documents, communication, accounting-lite, owner + tenant dashboards, notification placeholders, and React Query-powered hooks.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Popular add-ons</CardTitle>
            <CardDescription className="text-white/70">Bring your own API keys.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-white/80">
              {addOns.map((addOn) => (
                <li key={addOn} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-orange-300" />
                  <span>{addOn}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
