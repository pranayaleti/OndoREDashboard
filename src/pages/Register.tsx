import { useState } from "react"
import { Building2, CreditCard, FileSignature, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useValidatedForm } from "@/hooks/useValidatedForm"
import type { FormValidationSchema } from "@/utils/validation.utils"
import { sanitize, validators } from "@/utils/validation.utils"
import { ERROR_MESSAGES, REGEX_PATTERNS } from "@/constants/regex.constants"
import { OnboardingLayout } from "@/components/auth/onboarding-layout"
import { OnboardingChecklist } from "@/components/auth/onboarding-checklist"
import { OnboardingCard } from "@/components/auth/onboarding-card"
import { authApi, type OwnerOnboardingRequest } from "@/lib/api"
import { useApi } from "@/hooks/useApi"

interface OwnerOnboardingFormValues extends OwnerOnboardingRequest, Record<string, unknown> {
  goal: string
  portfolioSize: string
}

const checklists = {
  owners: [
    "Invite owners & tenants with branded emails",
    "Run SmartMove / Checkr screening",
    "Schedule rent + autopay",
    "Track maintenance & communication",
  ],
  tenants: [
    "Self-serve onboarding",
    "Submit maintenance with media",
    "Pay rent + download receipts",
    "Chat with owners in the same portal",
  ],
}

const planHighlights = [
  {
    title: "Launch day workflows",
    description: "Screening, rent collection, maintenance, documents, comms, accounting.",
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    title: "Payments ready",
    description: "Stripe + Plaid-ready autopay with late-fee automation.",
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    title: "Lease + eSign",
    description: "Templates, uploads, DocuSign/HelloSign integration points.",
    icon: <FileSignature className="h-6 w-6" />,
  },
]

const portfolioOptions = [
  "1-5 units",
  "6-10 units",
  "11-20 units",
  "21-50 units",
  "51+ units",
]

export default function Register() {
  const { toast } = useToast()
  const { execute: submitOnboarding, loading } = useApi(authApi.requestOwnerOnboarding)
  const [submitted, setSubmitted] = useState(false)

  const schema: FormValidationSchema<OwnerOnboardingFormValues> = {
    firstName: {
      required: true,
      formatter: sanitize.trim,
      maxLength: 50,
      rules: [],
    },
    lastName: {
      required: true,
      formatter: sanitize.trim,
      maxLength: 50,
      rules: [],
    },
    email: {
      required: true,
      formatter: sanitize.trim,
      rules: [
        {
          validator: validators.email,
          message: ERROR_MESSAGES.EMAIL,
        },
      ],
      maxLength: 120,
    },
    phone: {
      formatter: sanitize.trim,
      rules: [
        {
          validator: (value) => !value || REGEX_PATTERNS.PHONE_US_STRICT.test(value),
          message: ERROR_MESSAGES.PHONE,
        },
      ],
      maxLength: 20,
    },
    companyName: {
      formatter: sanitize.trim,
      maxLength: 80,
      rules: [],
    },
    portfolioSize: {
      formatter: sanitize.trim,
      required: true,
      maxLength: 40,
      rules: [],
    },
    goal: {
      required: true,
      formatter: sanitize.trim,
      maxLength: 280,
      rules: [],
    },
    referredBy: {
      formatter: sanitize.trim,
      maxLength: 120,
      rules: [],
    },
  }

  const initialValues: OwnerOnboardingFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    portfolioSize: "1-5 units",
    goal: "",
    referredBy: "",
  }

  const { values, errors, touched, handleChange, handleBlur, validateForm, resetForm } = useValidatedForm<OwnerOnboardingFormValues>({
    initialValues,
    schema,
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateForm()) {
      toast({
        title: "Double-check the form",
        description: "Highlighted fields need attention.",
        variant: "destructive",
      })
      return
    }

    try {
      const payload: OwnerOnboardingRequest = {
        firstName: sanitize.trim(values.firstName),
        lastName: sanitize.trim(values.lastName),
        email: sanitize.trim(values.email).toLowerCase(),
        phone: values.phone?.replace(/\D/g, "") || undefined,
        companyName: sanitize.trim(values.companyName || ""),
        portfolioSize: values.portfolioSize,
        goal: values.goal,
        referredBy: values.referredBy,
      }

      await submitOnboarding(payload)
      setSubmitted(true)
      toast({
        title: "Request received",
        description: "We’ll configure your workspace and send next steps shortly.",
      })
      resetForm()
    } catch (error: unknown) {
      toast({
        title: "Unable to submit",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    }
  }

  return (
    <OnboardingLayout
      title="Owner & operator sign up"
      subtitle="Tell us about your portfolio and the workflows you need. We’ll provision a workspace, configure roles, and help you invite tenants."
      hero={
        <div className="grid gap-4 md:grid-cols-2">
          <OnboardingChecklist title="Owners" items={checklists.owners} />
          <OnboardingChecklist title="Tenants" items={checklists.tenants} />
        </div>
      }
      sidebar={
        <div className="grid gap-4">
          {planHighlights.map((highlight) => (
            <OnboardingCard
              key={highlight.title}
              title={highlight.title}
              description={highlight.description}
              icon={highlight.icon}
            />
          ))}
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {submitted && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Thanks! Check your email for onboarding instructions. We’re prepping sample data and screening flows.
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name *</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              value={values.firstName}
              maxLength={50}
              onChange={handleChange("firstName")}
              onBlur={handleBlur("firstName")}
              aria-invalid={touched.firstName && !!errors.firstName}
            />
            {touched.firstName && errors.firstName && <p className="text-xs text-red-400">{errors.firstName}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name *</Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              value={values.lastName}
              maxLength={50}
              onChange={handleChange("lastName")}
              onBlur={handleBlur("lastName")}
              aria-invalid={touched.lastName && !!errors.lastName}
            />
            {touched.lastName && errors.lastName && <p className="text-xs text-red-400">{errors.lastName}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email *</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            maxLength={120}
            placeholder="you@portfolio.com"
            onChange={handleChange("email")}
            onBlur={handleBlur("email")}
            aria-invalid={touched.email && !!errors.email}
          />
          {touched.email && errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              maxLength={20}
              placeholder="Optional"
              onChange={handleChange("phone")}
              onBlur={handleBlur("phone")}
              aria-invalid={touched.phone && !!errors.phone}
            />
            {touched.phone && errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company / portfolio name</Label>
            <Input
              id="companyName"
              autoComplete="organization"
              value={values.companyName}
              maxLength={80}
              placeholder="Optional"
              onChange={handleChange("companyName")}
              onBlur={handleBlur("companyName")}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="portfolioSize">Units under management *</Label>
          <select
            id="portfolioSize"
            value={values.portfolioSize}
            onChange={handleChange("portfolioSize")}
            onBlur={handleBlur("portfolioSize")}
            className="w-full rounded-xl border border-white/20 bg-card p-3 text-sm"
          >
            {portfolioOptions.map((option) => (
              <option key={option} value={option} className="bg-card">
                {option}
              </option>
            ))}
          </select>
          {touched.portfolioSize && errors.portfolioSize && <p className="text-xs text-red-400">{errors.portfolioSize}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal">What are you hoping to solve? *</Label>
          <Textarea
            id="goal"
            value={values.goal}
            maxLength={280}
            rows={4}
            placeholder="e.g. reduce rent collection time, centralize maintenance, prep for audits..."
            onChange={handleChange("goal")}
            onBlur={handleBlur("goal")}
            aria-invalid={touched.goal && !!errors.goal}
          />
          {touched.goal && errors.goal && <p className="text-xs text-red-400">{errors.goal}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="referredBy">How did you hear about us?</Label>
          <Input
            id="referredBy"
            value={values.referredBy}
            maxLength={120}
            placeholder="Optional"
            onChange={handleChange("referredBy")}
            onBlur={handleBlur("referredBy")}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-orange-500 py-4 text-lg font-semibold text-black hover:bg-orange-400"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Sending...
            </span>
          ) : (
            "Request onboarding"
          )}
        </Button>
      </form>
    </OnboardingLayout>
  )
}
