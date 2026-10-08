import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { EyeIcon, EyeOffIcon, Loader2, ArrowRight, KeyRound, ShieldCheck, Building2, Home, Wrench } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useValidatedForm } from "@/hooks/useValidatedForm"
import type { FormValidationSchema } from "@/utils/validation.utils"
import { sanitize, validators } from "@/utils/validation.utils"
import { REGEX_PATTERNS } from "@/constants/regex.constants"
import { OnboardingChecklist } from "@/components/auth/onboarding-checklist"
import { OnboardingCard } from "@/components/auth/onboarding-card"
import { companyInfo } from "@/constants/companyInfo"
import { cn } from "@/lib/utils"

/** Seeded demo users (npm run seed in OndoREBackend). Shown only in dev or demo deployments. */
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? ""
const ENABLE_PUBLIC_DEMO = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PUBLIC_DEMO === "true"

const REFERRAL_SESSION_KEY = "ondo_referral_code"
type LoginRole = "manager" | "owner" | "tenant" | "maintenance"

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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
  const [rememberMe, setRememberMe] = useState(true)
  const [showTestAccounts, setShowTestAccounts] = useState(false)
  const [selectedRole, setSelectedRole] = useState<LoginRole>("manager")
  const [lastDemoRole, setLastDemoRole] = useState<LoginRole | null>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const credentialStepRef = useRef<HTMLDivElement>(null)

  const managerSteps = [
    t('login.managerStep1'),
    t('login.managerStep2'),
    t('login.managerStep3'),
    t('login.managerStep4'),
  ]

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

  const maintenanceSteps = [
    t('login.maintenanceStep1'),
    t('login.maintenanceStep2'),
    t('login.maintenanceStep3'),
    t('login.maintenanceStep4'),
  ]

  const roleOptions: Array<{
    role: LoginRole
    label: string
    hint: string
    steps: string[]
    icon: React.ReactNode
  }> = [
    {
      role: "manager",
      label: t('login.managerAdmins'),
      hint: t('login.managerAccessHint'),
      steps: managerSteps,
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      role: "owner",
      label: t('login.owners'),
      hint: t('login.ownerAccessHint'),
      steps: ownerSteps,
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      role: "tenant",
      label: t('login.tenants'),
      hint: t('login.tenantAccessHint'),
      steps: tenantSteps,
      icon: <Home className="h-5 w-5" />,
    },
    {
      role: "maintenance",
      label: t('login.maintenanceTeams'),
      hint: t('login.maintenanceAccessHint'),
      steps: maintenanceSteps,
      icon: <Wrench className="h-5 w-5" />,
    },
  ]

  const selectedRoleConfig = roleOptions.find((option) => option.role === selectedRole) ?? roleOptions[0]

  const demoAccounts: Array<{
    role: LoginRole
    label: string
    email: string
  }> = [
    {
      role: "manager",
      label: t('login.demoManagerLabel'),
      email: `admin@${companyInfo.social.twitterDomain}`,
    },
    {
      role: "owner",
      label: t('login.demoOwnerLabel'),
      email: `owner@${companyInfo.social.twitterDomain}`,
    },
    {
      role: "tenant",
      label: t('login.demoTenantLabel'),
      email: `tenant@${companyInfo.social.twitterDomain}`,
    },
    {
      role: "maintenance",
      label: t('login.demoMaintenanceLabel'),
      email: `maintenance@${companyInfo.social.twitterDomain}`,
    },
  ]

  const validationSchema: FormValidationSchema<{ email: string; password: string }> = {
    email: {
      required: true,
      formatter: sanitize.trim,
      rules: [
        {
          validator: validators.email,
          message: t('validation.emailInvalid'),
        },
      ],
      maxLength: 120,
    },
    password: {
      required: true,
      rules: [
        {
          regex: REGEX_PATTERNS.PASSWORD_WEAK,
          message: t('validation.passwordMinLength'),
        },
      ],
      maxLength: 128,
    },
  }

  const { values, touched, handleChange, handleBlur, validateForm, setValues } = useValidatedForm({
    initialValues: {
      email: "",
      password: "",
    },
    schema: validationSchema,
  })
  const normalizedEmail = sanitize.trim(values.email).toLowerCase()
  const emailHasValue = normalizedEmail.length > 0
  const emailIsValid = emailHasValue && validators.email(normalizedEmail)
  const passwordHasValue = values.password.length > 0
  const passwordIsValid = passwordHasValue && REGEX_PATTERNS.PASSWORD_WEAK.test(values.password)
  const emailErrorMessage =
    touched.email || emailHasValue
      ? !emailHasValue
        ? t('validation.emailRequired')
        : !emailIsValid
          ? t('validation.emailInvalid')
          : undefined
      : undefined
  const passwordErrorMessage =
    touched.password || passwordHasValue
      ? !passwordHasValue
        ? t('validation.passwordRequired')
        : !passwordIsValid
          ? t('validation.passwordMinLength')
          : undefined
      : undefined
  const isSubmitDisabled = !emailIsValid || !passwordIsValid || isLoading
  const selectedRoleHint = selectedRoleConfig.hint
  const redirectTo =
    (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from
      ? `${(location.state as { from: { pathname?: string; search?: string; hash?: string } }).from.pathname ?? ""}${(location.state as { from: { pathname?: string; search?: string; hash?: string } }).from.search ?? ""}${(location.state as { from: { pathname?: string; search?: string; hash?: string } }).from.hash ?? ""}`
      : searchParams.get("returnTo") ?? undefined

  useEffect(() => {
    const syncAutofilledValues = () => {
      const nextEmail = emailInputRef.current?.value ?? ""
      const nextPassword = passwordInputRef.current?.value ?? ""
      if (nextEmail === values.email && nextPassword === values.password) {
        return
      }
      setValues({
        email: nextEmail,
        password: nextPassword,
      })
    }

    const rafOne = requestAnimationFrame(syncAutofilledValues)
    const rafTwo = requestAnimationFrame(() => requestAnimationFrame(syncAutofilledValues))
    const timeoutId = window.setTimeout(syncAutofilledValues, 250)

    window.addEventListener("focus", syncAutofilledValues)

    return () => {
      cancelAnimationFrame(rafOne)
      cancelAnimationFrame(rafTwo)
      window.clearTimeout(timeoutId)
      window.removeEventListener("focus", syncAutofilledValues)
    }
  }, [setValues, values.email, values.password])

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
      const result = await login(normalizedEmail, values.password, {
        rememberMe,
        redirectTo,
      })

      if (result.success && result.redirectPath) {
        navigate(result.redirectPath, { replace: true })
      } else if (!result.success) {
        toast({
          title: t('login.loginFailed'),
          description: result.message || t('login.invalidCredentials'),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: t('login.error'),
        description: t('login.unexpectedError'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleSelect = (role: LoginRole) => {
    setSelectedRole(role)
    setLastDemoRole(null)
  }

  const handleFillCredentials = (role: LoginRole, testEmail: string, testPassword: string) => {
    setSelectedRole(role)
    setLastDemoRole(role)
    setValues({ email: testEmail, password: testPassword })
    requestAnimationFrame(() => {
      credentialStepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      emailInputRef.current?.focus()
      emailInputRef.current?.select()
    })
  }

  return (
    <div className="relative h-screen overflow-hidden bg-background text-white">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 bg-background" />
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative grid h-full lg:grid-cols-[1fr_1.2fr]">
        {/* ── LEFT PANEL ── */}
        <div className="hidden lg:flex flex-col justify-center overflow-y-auto border-r border-white/8 px-10 py-10">
          <div className="max-w-sm">
            <h1 className="text-3xl font-semibold leading-tight">{t('login.title')}</h1>
            <p className="mt-2 text-sm text-white/65">{t('login.subtitle')}</p>

            <div className="mt-7">
              <OnboardingChecklist title={selectedRoleConfig.label} items={selectedRoleConfig.steps} />
            </div>

            <div className="mt-4 grid gap-3">
              <OnboardingCard
                eyebrow={t('login.security')}
                title={t('login.securityTitle')}
                description={t('login.securityDesc')}
                icon={<ShieldCheck className="h-5 w-5" />}
              />
              <OnboardingCard
                eyebrow={t('login.fastAccess')}
                title={t('login.needCredentials')}
                description={t('login.credentialsDesc')}
                icon={<KeyRound className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex flex-col justify-center overflow-y-auto px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-md">

            {/* Mobile-only header */}
            <div className="mb-6 text-center lg:hidden">
              <h1 className="text-2xl font-semibold">{t('login.title')}</h1>
              <p className="mt-1 text-sm text-white/65">{t('login.subtitle')}</p>
            </div>

            {/* ── STEPPER ── */}
            <div>

              {/* Step 1 */}
              <div className="flex gap-4">
                {/* Spine */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-orange-400 bg-orange-500/15 text-sm font-semibold text-orange-200">
                    1
                  </div>
                  <div className="mt-1 w-px flex-1 bg-white/12" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pb-5">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-orange-300">{t('login.stepOne')}</p>
                  <h2 className="mt-0.5 text-base font-semibold text-white">{t('login.roleSelectorLabel')}</h2>
                  <p className="mt-1 text-xs text-white/55">{t('login.roleSelectorIntro')}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {roleOptions.map((option) => (
                      <button
                        key={option.role}
                        type="button"
                        aria-pressed={selectedRole === option.role}
                        data-role={option.role}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
                          selectedRole === option.role
                            ? "border-orange-400/70 bg-orange-500/15 text-white"
                            : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                        )}
                        onClick={() => handleRoleSelect(option.role)}
                      >
                        <span className={cn(
                          "rounded-lg p-1.5",
                          selectedRole === option.role ? "bg-orange-500/15 text-orange-200" : "bg-white/5 text-white/50"
                        )}>
                          {option.icon}
                        </span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-white/50">{selectedRoleHint}</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                {/* Spine */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-orange-400 bg-orange-500/15 text-sm font-semibold text-orange-200">
                    2
                  </div>
                </div>

                {/* Content */}
                <div ref={credentialStepRef} className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="rounded-xl bg-orange-500/10 p-2 text-orange-300">
                      {selectedRoleConfig.icon}
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-orange-300">{t('login.stepTwo')}</p>
                      <h2 className="text-base font-semibold text-white">{selectedRoleConfig.label}</h2>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-sm">{t('login.emailLabel')}</Label>
                      <Input
                        ref={emailInputRef}
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        placeholder={t('login.emailPlaceholder')}
                        value={values.email}
                        maxLength={120}
                        onChange={handleChange("email")}
                        onBlur={handleBlur("email")}
                        onInputCapture={() => {
                          if (!emailInputRef.current || !passwordInputRef.current) return
                          setValues({
                            email: emailInputRef.current.value,
                            password: passwordInputRef.current.value,
                          })
                        }}
                        aria-invalid={!!emailErrorMessage}
                        aria-describedby={emailErrorMessage ? "email-error" : undefined}
                        className="h-10 rounded-xl border-white/15 bg-white/5 text-white"
                      />
                      {emailErrorMessage && (
                        <p id="email-error" role="alert" className="text-xs text-red-400">{emailErrorMessage}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-sm">{t('login.passwordLabel')}</Label>
                      <div className="relative">
                        <Input
                          ref={passwordInputRef}
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          value={values.password}
                          maxLength={128}
                          onChange={handleChange("password")}
                          onBlur={handleBlur("password")}
                          onInputCapture={() => {
                            if (!emailInputRef.current || !passwordInputRef.current) return
                            setValues({
                              email: emailInputRef.current.value,
                              password: passwordInputRef.current.value,
                            })
                          }}
                          aria-invalid={!!passwordErrorMessage}
                          aria-describedby={passwordErrorMessage ? "password-error" : undefined}
                          className="h-10 rounded-xl border-white/15 bg-white/5 pr-11 text-white"
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                          title={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/5 p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOffIcon aria-hidden="true" className="h-4 w-4" /> : <EyeIcon aria-hidden="true" className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrorMessage && (
                        <p id="password-error" role="alert" className="text-xs text-red-400">{passwordErrorMessage}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                      <label htmlFor="remember-me" className="flex items-center gap-2.5 text-sm text-white/75">
                        <Checkbox
                          id="remember-me"
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked === true)}
                          aria-label="Remember me for 30 days"
                        />
                        <span>Remember me for 30 days</span>
                      </label>
                      <span className="text-xs text-white/40">Optional</span>
                    </div>

                    <Button
                      id="login-submit"
                      type="submit"
                      data-testid="login-submit"
                      data-role={selectedRole}
                      disabled={isSubmitDisabled}
                      className="w-full rounded-xl bg-orange-500 py-2.5 text-base font-semibold text-black hover:bg-orange-400"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> {t('login.signingIn')}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {t('login.continue')} <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        asChild
                        variant="outline"
                        className="h-9 rounded-xl border-white/15 bg-white/5 text-sm text-white hover:bg-white/10 hover:text-white"
                      >
                        <Link to="/register">{t('login.ownerSignup')}</Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="h-9 rounded-xl border-white/15 bg-white/5 text-sm text-white hover:bg-white/10 hover:text-white"
                      >
                        <Link to="/contact">{t('login.contactSupport')}</Link>
                      </Button>
                    </div>
                  </form>

                  <p className="mt-3 text-xs text-white/45">
                    {t('login.forgotPassword')}{" "}
                    <Link to="/forgot-password" className="text-orange-300 hover:text-orange-200">
                      {t('login.resetHere')}
                    </Link>
                  </p>

                  {ENABLE_PUBLIC_DEMO && DEMO_PASSWORD && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/75">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between text-left font-semibold text-white"
                        onClick={() => setShowTestAccounts((prev) => !prev)}
                      >
                        <span>{t('login.testingDemo')}</span>
                        <span className="text-xs font-normal text-white/50">{showTestAccounts ? t('login.hide') : t('login.show')}</span>
                      </button>
                      {showTestAccounts && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-white/55">{t('login.demoHelperDesc')}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {demoAccounts.map((account) => (
                              <CredentialButton
                                key={account.role}
                                role={account.role}
                                label={account.label}
                                email={account.email}
                                hint={roleOptions.find((option) => option.role === account.role)?.hint ?? ""}
                                badgeLabel={t('login.demoAutofillLabel')}
                                selected={lastDemoRole === account.role}
                                onFill={() => handleFillCredentials(account.role, account.email, DEMO_PASSWORD)}
                              />
                            ))}
                          </div>
                          {lastDemoRole && (
                            <p aria-live="polite" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-200">
                              {t('login.demoReadyMessage', {
                                role: demoAccounts.find((account) => account.role === lastDemoRole)?.label ?? selectedRoleConfig.label,
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CredentialButton({
  role,
  label,
  email,
  hint,
  badgeLabel,
  selected,
  onFill,
}: {
  role: LoginRole
  label: string
  email: string
  hint: string
  badgeLabel: string
  selected: boolean
  onFill: () => void
}) {
  const descriptionId = `demo-${role}-description`

  return (
    <button
      type="button"
      data-demo-role={role}
      data-testid={`demo-role-${role}`}
      aria-pressed={selected}
      aria-describedby={descriptionId}
      onClick={onFill}
      className={`flex w-full flex-col rounded-2xl border px-4 py-3 text-left text-xs text-white/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
        selected
          ? "border-orange-400/70 bg-orange-500/10"
          : "border-white/10 bg-card hover:border-orange-400"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white">{label}</span>
        <span className="rounded-full border border-white/10 bg-card/60 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55">
          {badgeLabel}
        </span>
      </div>
      <p id={descriptionId} className="mt-2 text-xs text-white/65">{hint}</p>
      <p aria-hidden="true" className="mt-3 font-mono text-[11px] text-white/35">{email}</p>
    </button>
  )
}
