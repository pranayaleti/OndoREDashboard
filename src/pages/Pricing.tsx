import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, Sparkles, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { StripePaymentForm } from "@/components/stripe/StripePaymentForm"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const plans = [
  {
    name: "Starter",
    price: "$89",
    cadence: "/month",
    highlight: "Perfect for independent landlords",
    planKey: "starter" as const,
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
    planKey: "growth" as const,
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
    planKey: "portfolio" as const,
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
  const { toast } = useToast()
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSubscribe = async (planKey: string) => {
    if (planKey === "portfolio") return // Portfolio goes to contact sales

    setIsSubscribing(true)
    setSelectedPlan(planKey)
    try {
      const result = await featureApi.subscriptions.create(planKey)
      setClientSecret(result.clientSecret)
      setIsDialogOpen(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start subscription."
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSubscriptionSuccess = () => {
    setIsDialogOpen(false)
    setClientSecret(null)
    setSelectedPlan(null)
    toast({
      title: "Subscription Active!",
      description: "Welcome to OnDo Real Estate. Your subscription is now active.",
    })
  }

  const selectedPlanDetails = plans.find((p) => p.planKey === selectedPlan)

  return (
    <main className="bg-background px-4 py-16 text-white">
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
          <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-card/75">
            <Link to="/contact">Talk with sales</Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto mt-16 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.featured ? "border-orange-400 bg-card/75" : "border-white/10 bg-card/60"}
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
              {plan.planKey === "portfolio" ? (
                <Button asChild className="w-full bg-orange-500 text-black hover:bg-orange-400">
                  <Link to="/contact">Contact sales</Link>
                </Button>
              ) : (
                <Button
                  className="w-full bg-orange-500 text-black hover:bg-orange-400"
                  onClick={() => handleSubscribe(plan.planKey)}
                  disabled={isSubscribing && selectedPlan === plan.planKey}
                >
                  {isSubscribing && selectedPlan === plan.planKey ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    "Start now"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="container mx-auto mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-card/60">
          <CardHeader>
            <CardTitle className="text-white">What every plan includes</CardTitle>
            <CardDescription className="text-white/70">
              Screening, rent payments, maintenance, leases, documents, communication, accounting-lite, owner + tenant dashboards, and notification workflows.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-card/60">
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

      {/* Subscription Payment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) { setIsDialogOpen(false); setClientSecret(null); setSelectedPlan(null) }
      }}>
        <DialogContent className="sm:max-w-lg border-2 border-orange-500 bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>
              Subscribe to {selectedPlanDetails?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedPlanDetails?.price}{selectedPlanDetails?.cadence} — Enter your payment details below
            </DialogDescription>
          </DialogHeader>
          {clientSecret ? (
            <StripePaymentForm
              clientSecret={clientSecret}
              onSuccess={handleSubscriptionSuccess}
              onError={(msg) => toast({ title: "Payment Failed", description: msg, variant: "destructive" })}
              submitLabel={`Subscribe — ${selectedPlanDetails?.price}/mo`}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
