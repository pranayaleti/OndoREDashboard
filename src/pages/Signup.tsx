import { useState, useEffect } from "react"
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, EyeIcon, EyeOffIcon, CheckCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import Loading from "@/components/loading"
import { Logo } from "@/components/logo"
import { useValidatedForm } from "@/hooks/useValidatedForm"
import type { FormValidationSchema } from "@/utils/validation.utils"
import { getErrorMessage } from "@/lib/auth-utils"
import { formatters, sanitize, validators } from "@/utils/validation.utils"
import { ERROR_MESSAGES, REGEX_PATTERNS, validationPresets } from "@/constants"
import { AddressForm, type AddressFormValues } from "@/components/forms/address-form"
import { parseAddressString, formatAddressFields } from "@/utils/address"
import { companyInfo } from "@/constants/companyInfo"
import { OnboardingLayout } from "@/components/auth/onboarding-layout"
import { OnboardingChecklist } from "@/components/auth/onboarding-checklist"
import { OnboardingCard } from "@/components/auth/onboarding-card"

const roleFlows: Record<string, { title: string; subtitle: string; steps: string[] }> = {
  owner: {
    title: "Owner onboarding",
    subtitle: "Confirm contact details, enable screening, and finish lease + rent setup.",
    steps: [
      "Verify your profile + security settings",
      "Upload lease templates or generate new ones",
      "Invite tenants, trigger screening, and collect rent",
      "Monitor maintenance + statements in one dashboard",
    ],
  },
  tenant: {
    title: "Tenant onboarding",
    subtitle: "We’ll verify your details, background checks, and get your portal ready.",
    steps: [
      "Confirm your contact information",
      "Authorize screening + upload documents",
      "Enable autopay + download receipts",
      "Submit maintenance + chat with your landlord",
    ],
  },
  maintenance: {
    title: "Maintenance onboarding",
    subtitle: "Get access to ticket queues, vendor notes, and communication tools.",
    steps: [
      "Set up your contact preferences",
      "Review open tickets assigned to you",
      "Upload before/after media for every job",
      "Close work orders and notify tenants",
    ],
  },
}

export default function Signup() {
  const { t } = useTranslation('auth')
  const { token } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { authenticateUser } = useAuth()

  const schema: FormValidationSchema<{
    firstName: string
    lastName: string
    phone: string
    address: string
    profilePicture: string
    password: string
    confirmPassword: string
  }> = {
    firstName: validationPresets.firstName,
    lastName: validationPresets.lastName,
    phone: {
      formatter: formatters.phone,
      rules: [
        {
          validator: (value) => !value || validators.phone(value),
          message: ERROR_MESSAGES.PHONE,
        },
      ],
      maxLength: 14,
    },
    address: {
      formatter: sanitize.trim,
      rules: [
        {
          regex: REGEX_PATTERNS.STREET_ADDRESS,
          message: ERROR_MESSAGES.INVALID_FORMAT,
        },
      ],
      maxLength: 120,
    },
    profilePicture: {
      formatter: sanitize.trim,
      rules: [
        {
          validator: (value) => !value || REGEX_PATTERNS.URL_STRICT.test(value),
          message: ERROR_MESSAGES.INVALID_FORMAT,
        },
      ],
      maxLength: 2048,
    },
    password: validationPresets.passwordStrong,
    confirmPassword: {
      required: true,
      rules: [
        {
          regex: REGEX_PATTERNS.PASSWORD_STRONG,
          message: ERROR_MESSAGES.PASSWORD_STRONG,
        },
        {
          validator: (value, values) => value === values?.password,
          message: t('signup.mismatch'),
        },
      ],
      maxLength: 128,
    },
  }

  const { values, errors, touched, handleChange, handleBlur, validateForm, setFieldValue } = useValidatedForm({
    initialValues: {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      profilePicture: "",
      password: "",
      confirmPassword: "",
    },
    schema,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [addressValue, setAddressValue] = useState<AddressFormValues>(() => {
    const parsed = parseAddressString("")
    return {
      addressType: "home",
      addressLine1: parsed.line1,
      addressLine2: parsed.line2,
      city: parsed.city,
      state: parsed.state,
      postalCode: parsed.postalCode,
    }
  })
  const updateFormattedAddress = (nextValue: AddressFormValues) => {
    const formatted = formatAddressFields({
      line1: nextValue.addressLine1,
      line2: nextValue.addressLine2,
      city: nextValue.city,
      state: nextValue.state,
      postalCode: nextValue.postalCode,
    })
    setFieldValue("address", formatted)
    return formatted
  }

  const handleAddressFormChange = (nextValue: AddressFormValues) => {
    setAddressValue(nextValue)
    updateFormattedAddress(nextValue)
  }

  const handleAddressBlur = () => {
    const formatted = updateFormattedAddress(addressValue)
    setFieldValue("address", formatted)
  }

  useEffect(() => {
    if (!values.address) {
      const parsed = parseAddressString("")
      setAddressValue({
        addressType: "home",
        addressLine1: parsed.line1,
        addressLine2: parsed.line2,
        city: parsed.city,
        state: parsed.state,
        postalCode: parsed.postalCode,
      })
    }
  }, [values.address])


  // API hooks
  const { data: invitation, loading: loadingInvitation, error: invitationError, execute: fetchInvitation } = useApi(authApi.getInvitation)
  const { loading: signingUp, execute: signup } = useApi(authApi.signup)

  useEffect(() => {
    if (token) {
      fetchInvitation(token)
    }
  }, [token, fetchInvitation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast({
        title: t('signup.error'),
        description: t('signup.invalidToken'),
        variant: "destructive",
      })
      return
    }

    const isValid = validateForm()
    if (!isValid) {
      toast({
        title: t('login.checkFields'),
        description: t('login.resolveErrors'),
        variant: "destructive",
      })
      return
    }

    const normalizedPhone = values.phone ? values.phone.replace(/\D/g, "") : undefined

    try {
      const refFromQuery = searchParams.get("ref")?.trim()
      let refFromSession: string | undefined
      try {
        refFromSession = sessionStorage.getItem("ondo_referral_code")?.trim() || undefined
      } catch {
        refFromSession = undefined
      }
      const referralCode = refFromQuery || refFromSession || undefined
      const response = await signup({
        token,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: normalizedPhone || undefined,
        address: values.address || undefined,
        profilePicture: values.profilePicture || undefined,
        password: values.password,
        referralCode,
      })
      if (referralCode) {
        try {
          sessionStorage.removeItem("ondo_referral_code")
        } catch {
          /* ignore */
        }
      }

      if (!response?.accessToken || !response?.user) {
        throw new Error("Signup succeeded but no session token was returned.")
      }

      authenticateUser(
        {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          role: response.user.role,
          phone: response.user.phone,
          address: response.user.address,
          profilePicture: response.user.profilePicture,
        },
        response.accessToken,
        response.expiresIn ?? 900
      )
      setIsSuccess(true)
      toast({
        title: t('signup.success'),
        description: `Welcome to ${companyInfo.name}. You're now logged in.`,
      })

      // Auto-navigate after successful signup
      const role = response.user.role
      const redirectPath =
        role === "manager" || role === "admin" || role === "super_admin" ? "/dashboard" :
        role === "owner" ? "/owner" :
        role === "maintenance" ? "/maintenance" :
        "/tenant"
      setTimeout(() => navigate(redirectPath), 2000)

    } catch (error) {
      toast({
        title: t('signup.error'),
        description: getErrorMessage(error, t('signup.unexpectedError')),
        variant: "destructive",
      })
    }
  }

  if (loadingInvitation) {
    return <Loading />
  }

  if (invitationError || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-card p-4">
        <div className="w-full max-w-md">
          {/* Ondo Real Estate Logo and Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-6">
              <Logo size="xl" variant="centered" showText={true} linkTo="/" />
            </div>
          </div>

          <Card className="border-none shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-2xl font-medium mb-4 bg-gradient-to-r from-orange-500 to-red-800 text-transparent bg-clip-text">
                {t('signup.error')}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('signup.invalidToken')}
              </p>
              
              <Link to="/login">
                <button className="w-full bg-gradient-to-r from-orange-500 to-red-800 hover:from-orange-600 hover:to-red-900 text-white font-medium py-4 rounded-2xl text-xl transition-all duration-200 flex items-center justify-center gap-2">
                  {t('forgotPassword.backToLogin')}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-card p-4">
        <div className="w-full max-w-md">
          {/* Ondo Real Estate Logo and Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-6">
              <Logo size="xl" variant="centered" showText={true} linkTo="/" />
            </div>
          </div>

          <Card className="border-none shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <h1 className="text-2xl font-medium mb-4 bg-gradient-to-r from-orange-500 to-red-800 text-transparent bg-clip-text">
                Welcome to {companyInfo.name}!
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('signup.successDesc')}
              </p>
              
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const flow = roleFlows[invitation.role] || roleFlows.owner

  return (
    <OnboardingLayout
      title={`Complete your ${invitation.role} workspace`}
      subtitle={flow.subtitle}
      hero={<OnboardingChecklist title={flow.title} items={flow.steps} />}
      sidebar={
        <OnboardingCard
          eyebrow="Next steps"
          title="Need help?"
          description="Our team can resend invites, update emails, or enable integrations before you log in."
        >
          <p className="text-sm text-white/80">
            Reach us at{' '}
            <a
              href={`mailto:${companyInfo.email}`}
              className="text-orange-300 hover:text-orange-200"
            >
              {companyInfo.email}
            </a>
          </p>
        </OnboardingCard>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-card/60 p-4 text-sm text-white/80">
          <p>
            <strong>Email:</strong> {invitation.email}
          </p>
          <p>
            <strong>Role:</strong> {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              id="firstName"
              label="First name *"
              placeholder="Alex"
              value={values.firstName}
              maxLength={50}
              error={touched.firstName ? errors.firstName : undefined}
              onChange={handleChange('firstName')}
              onBlur={handleBlur('firstName')}
              required
            />
            <TextField
              id="lastName"
              label="Last name *"
              placeholder="Rivera"
              value={values.lastName}
              maxLength={50}
              error={touched.lastName ? errors.lastName : undefined}
              onChange={handleChange('lastName')}
              onBlur={handleBlur('lastName')}
              required
            />
          </div>
          <TextField
            id="mobile"
            label="Mobile number"
            type="tel"
            placeholder="Optional"
            value={values.phone}
            maxLength={14}
            error={touched.phone ? errors.phone : undefined}
            onChange={handleChange('phone')}
            onBlur={handleBlur('phone')}
          />
          <div className="space-y-2">
            <Label>Address (optional)</Label>
            <AddressForm
              value={addressValue}
              onChange={handleAddressFormChange}
              onFieldBlur={handleAddressBlur}
              hideTypeToggle
              showRequiredIndicator={false}
              idPrefix="signup"
            />
            {touched.address && errors.address && (
              <p className="text-xs text-red-400">{errors.address}</p>
            )}
          </div>
          <TextField
            id="profilePicture"
            label="Profile picture URL"
            type="url"
            placeholder="https://example.com/avatar.jpg"
            value={values.profilePicture}
            maxLength={2048}
            error={touched.profilePicture ? errors.profilePicture : undefined}
            onChange={handleChange('profilePicture')}
            onBlur={handleBlur('profilePicture')}
          />
          <PasswordField
            id="password"
            label="Password *"
            placeholder="Create a strong password"
            value={values.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            error={touched.password ? errors.password : undefined}
            showPassword={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm password *"
            placeholder="Repeat your password"
            value={values.confirmPassword}
            onChange={handleChange('confirmPassword')}
            onBlur={handleBlur('confirmPassword')}
            error={touched.confirmPassword ? errors.confirmPassword : undefined}
            showPassword={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          />
          <Button
            type="submit"
            disabled={signingUp}
            className="w-full rounded-2xl bg-orange-500 py-4 text-lg font-semibold text-black hover:bg-orange-400"
          >
            {signingUp ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/40 border-t-transparent" />
                {t('signup.creating')}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {t('signup.submit')}
                <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </Button>
          <p className="text-center text-sm text-white/60">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-300 hover:text-orange-200">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </OnboardingLayout>
  )
}

interface TextFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  maxLength?: number;
  required?: boolean;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
}

function TextField({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  maxLength,
  required,
  error,
  onChange,
  onBlur,
}: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        aria-invalid={!!error}
        className="rounded-xl border-white/15 bg-card text-white"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  error?: string;
  showPassword: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
  onToggle: () => void;
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  error,
  showPassword,
  onChange,
  onBlur,
  onToggle,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={!!error}
          className="rounded-xl border-white/15 bg-card pr-11 text-white"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
          onClick={onToggle}
        >
          {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
