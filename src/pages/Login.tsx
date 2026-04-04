import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { EyeIcon, EyeOffIcon, Loader2, ArrowRight, KeyRound, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useValidatedForm } from "@/hooks/useValidatedForm"
import type { FormValidationSchema } from "@/utils/validation.utils"
import { sanitize, validators } from "@/utils/validation.utils"
import { ERROR_MESSAGES, REGEX_PATTERNS } from "@/constants/regex.constants"
import { OnboardingLayout } from "@/components/auth/onboarding-layout"
import { OnboardingChecklist } from "@/components/auth/onboarding-checklist"
import { OnboardingCard } from "@/components/auth/onboarding-card"
import { companyInfo } from "@/constants/companyInfo"

/** Seeded test users (npm run seed in OndoREBackend) — dev only */
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? ""

const REFERRAL_SESSION_KEY = "ondo_referral_code"

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get("ref")?.trim()
    if (ref) {
      try {
        sessionStorage.setItem(REFERRAL_SESSION_KEY, ref)
      } catch {
        /* ignore */
      }
    }
  }, [searchParams])
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showTestAccounts, setShowTestAccounts] = useState(false)

  const ownerSteps = [
    t('login.ownerStep1'),
    t('login.ownerStep2'),
    t('login.ownerStep3'),
    t('login.ownerStep4'),
  ]

  const tenantSteps = [
    t('login.tenantStep1'),
    t('login.tenantStep2'),
    t('login.tenantStep3'),
    t('login.tenantStep4'),
  ]

  const validationSchema: FormValidationSchema<{ email: string; password: string }> = {
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
    password: {
      required: true,
      formatter: sanitize.trim,
      rules: [
        {
          regex: REGEX_PATTERNS.PASSWORD_WEAK,
          message: ERROR_MESSAGES.PASSWORD_WEAK,
        },
      ],
      maxLength: 128,
    },
  }

  const { values, errors, touched, handleChange, handleBlur, validateForm, setValues } = useValidatedForm({
    initialValues: {
      email: "",
      password: "",
    },
    schema: validationSchema,
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = validateForm()
    if (!isValid) {
      toast({
        title: t('login.checkFields'),
        description: t('login.resolveErrors'),
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)

    try {
      const sanitizedEmail = sanitize.trim(values.email).toLowerCase()
      const result = await login(sanitizedEmail, values.password)

      if (result.success && result.redirectPath) {
        navigate(result.redirectPath, { replace: true })
      } else if (!result.success) {
        toast({
          title: t('login.loginFailed'),
          description: result.message || t('login.invalidCredentials'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t('login.error'),
        description: t('login.unexpectedError'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFillCredentials = (testEmail: string, testPassword: string) => {
    setValues({ email: testEmail, password: testPassword })
    setShowTestAccounts(false)
  }

  return (
    <OnboardingLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      hero={
        <div className="grid gap-4 md:grid-cols-2">
          <OnboardingChecklist title={t('login.owners')} items={ownerSteps} />
          <OnboardingChecklist title={t('login.tenants')} items={tenantSteps} />
        </div>
      }
      sidebar={
        <div className="grid gap-4">
          <OnboardingCard
            eyebrow={t('login.security')}
            title={t('login.securityTitle')}
            description={t('login.securityDesc')}
            icon={<ShieldCheck className="h-6 w-6" />}
          />
          <OnboardingCard
            eyebrow={t('login.fastAccess')}
            title={t('login.needCredentials')}
            description={t('login.credentialsDesc')}
            icon={<KeyRound className="h-6 w-6" />}
          >
            <div className="mt-3 space-y-2 text-sm text-white/80">
              <p>
                {t('login.noAccount')}{" "}
                <Link to="/register" className="text-orange-300 hover:text-orange-200">{t('login.ownerSignup')}</Link>
              </p>
              <p>
                {t('login.tenantInvite')}{" "}
                <Link to="/contact" className="text-orange-300 hover:text-orange-200">{t('login.contactSupport')}</Link>
              </p>
            </div>
          </OnboardingCard>
        </div>
      }
    >
      <div className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={values.email}
              maxLength={120}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={touched.email && errors.email ? "email-error" : undefined}
              className="rounded-xl border-white/15 bg-slate-900 text-white"
            />
            {touched.email && errors.email && (
              <p id="email-error" role="alert" className="text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('login.passwordLabel')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={values.password}
                maxLength={128}
                onChange={handleChange("password")}
                onBlur={handleBlur("password")}
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={touched.password && errors.password ? "password-error" : undefined}
                className="rounded-xl border-white/15 bg-slate-900 pr-11 text-white"
              />
              <button
                type="button"
                aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon aria-hidden="true" className="h-4 w-4" /> : <EyeIcon aria-hidden="true" className="h-4 w-4" />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p id="password-error" role="alert" className="text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-orange-500 py-4 text-lg font-semibold text-black hover:bg-orange-400"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> {t('login.signingIn')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {t('login.continue')} <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </Button>
        </form>

        <div className="text-sm text-white/60">
          <p>
            {t('login.forgotPassword')}{" "}
            <Link to="/forgot-password" className="text-orange-300 hover:text-orange-200">
              {t('login.resetHere')}
            </Link>
          </p>
          <p className="mt-2">
            {t('login.needInvite')}{" "}
            <Link to="/contact" className="text-orange-300 hover:text-orange-200">{t('login.contactSupport')}</Link>
          </p>
        </div>

        {import.meta.env.DEV && (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white/80">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left font-semibold text-white"
              onClick={() => setShowTestAccounts((prev) => !prev)}
            >
              <span>{t('login.testingDemo')}</span>
              <span>{showTestAccounts ? t('login.hide') : t('login.show')}</span>
            </button>
            {showTestAccounts && (
              <div className="mt-3 space-y-2">
                <CredentialButton label="Manager/Admin" email={`admin@${companyInfo.social.twitterDomain}`} password={DEMO_PASSWORD} onFill={handleFillCredentials} />
                <CredentialButton label="Owner" email={`owner@${companyInfo.social.twitterDomain}`} password={DEMO_PASSWORD} onFill={handleFillCredentials} />
                <CredentialButton label="Tenant" email={`tenant@${companyInfo.social.twitterDomain}`} password={DEMO_PASSWORD} onFill={handleFillCredentials} />
              </div>
            )}
          </div>
        )}
      </div>
    </OnboardingLayout>
  )
}

function CredentialButton({ label, email, password, onFill }: { label: string; email: string; password: string; onFill: (email: string, password: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onFill(email, password)}
      className="flex w-full flex-col rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-left text-xs text-white/80 transition hover:border-orange-400"
    >
      <span className="text-sm font-semibold text-white">{label}</span>
      <span>{email}</span>
      <span className="text-white/60">{password}</span>
    </button>
  )
}
