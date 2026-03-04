import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { companyInfo } from "@/constants/companyInfo"

interface TrialFormState {
  name: string
  email: string
  portfolioSize: string
  role: string
  goals: string
}

const initialState: TrialFormState = {
  name: "",
  email: "",
  portfolioSize: "",
  role: "",
  goals: "",
}

export default function FreeTrialPage() {
  const { toast } = useToast()
  const [form, setForm] = useState<TrialFormState>(initialState)

  const handleChange = (field: keyof TrialFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    toast({
      title: "Trial requested",
      description: "We'll provision your workspace and reach out within a few hours.",
    })
    setForm(initialState)
  }

  return (
    <main className="bg-slate-950 px-4 py-16 text-white">
      <div className="container mx-auto grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-orange-300">Free trial</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Spin up Ondo for your team</h1>
          <p className="text-lg text-white/70">
            We’ll configure roles, data seeding, and onboarding checklists so you can invite owners + tenants, run screening, and collect rent inside your trial. No credit card required.
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold">What's included</h2>
            <ul className="mt-4 space-y-2 text-white/80 text-sm">
              <li>✔️ 14-day access to every module</li>
              <li>✔️ Guided configuration call</li>
              <li>✔️ Sample data for owners, tenants, leases, and ledgers</li>
              <li>✔️ Optional integration prep for Stripe, Plaid, DocuSign, SmartMove, Twilio, SendGrid</li>
            </ul>
          </div>
          <p className="text-sm text-white/60">
            Need a custom security review or paper? Email us at {companyInfo.email}.
          </p>
        </div>
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Tell us about your portfolio</CardTitle>
            <CardDescription className="text-white/70">We use this to tailor workflows + data.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="trial-name">Name</Label>
                <Input
                  id="trial-name"
                  placeholder="Taylor Ops"
                  value={form.name}
                  onChange={handleChange("name")}
                  required
                  className="border-white/20 bg-slate-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trial-email">Email</Label>
                <Input
                  id="trial-email"
                  type="email"
                  placeholder="you@portfolio.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  required
                  className="border-white/20 bg-slate-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trial-portfolio">Units under management</Label>
                <Input
                  id="trial-portfolio"
                  placeholder="ex: 18"
                  value={form.portfolioSize}
                  onChange={handleChange("portfolioSize")}
                  required
                  className="border-white/20 bg-slate-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trial-role">Role</Label>
                <Input
                  id="trial-role"
                  placeholder="Owner, operator, tenant success…"
                  value={form.role}
                  onChange={handleChange("role")}
                  required
                  className="border-white/20 bg-slate-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trial-goals">What would make this trial a win?</Label>
                <Textarea
                  id="trial-goals"
                  placeholder="Share the workflows you're replacing or problems you're solving."
                  value={form.goals}
                  onChange={(event) => handleChange("goals")(event)}
                  required
                  className="min-h-[120px] border-white/20 bg-slate-900 text-white"
                />
              </div>
              <Button type="submit" className="w-full bg-orange-500 text-black hover:bg-orange-400">
                Request access
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
