import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, EyeIcon, EyeOffIcon, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"
import { useValidatedForm } from "@/hooks/useValidatedForm"
import type { FormValidationSchema } from "@/utils/validation.utils"
import { sanitize } from "@/utils/validation.utils"
import { ERROR_MESSAGES, REGEX_PATTERNS } from "@/constants/regex.constants"
import { getApiBaseUrl } from "@/lib/api/base-url"

const API_BASE_URL = getApiBaseUrl()

export default function ResetPassword() {
  const { t } = useTranslation('auth')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [tokenError, setTokenError] = useState("")
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const schema: FormValidationSchema<{ password: string; confirmPassword: string }> = {
    password: {
      required: true,
      formatter: sanitize.trim,
      rules: [
        {
          regex: REGEX_PATTERNS.PASSWORD_STRONG,
          message: ERROR_MESSAGES.PASSWORD_STRONG,
        },
      ],
      maxLength: 128,
    },
    confirmPassword: {
      required: true,
      formatter: sanitize.trim,
      rules: [
        {
          regex: REGEX_PATTERNS.PASSWORD_STRONG,
          message: ERROR_MESSAGES.PASSWORD_STRONG,
        },
        {
          validator: (value, values) => value === values?.password,
          message: "Passwords must match",
        },
      ],
      maxLength: 128,
    },
  }

  const { values, errors, touched, handleChange, handleBlur, validateForm } = useValidatedForm({
    initialValues: { password: "", confirmPassword: "" },
    schema,
  })

  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      setTokenError("No reset token provided")
      return
    }

    // Verify the token with the backend
    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/password/verify-reset-token/${token}`)
        
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        let data: any;
        if (isJson) {
          try {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
          } catch (parseError) {
            setTokenValid(false)
            setTokenError("Invalid response from server")
            return
          }
        } else {
          const text = await response.text();
          data = { valid: false, message: text || "Invalid or expired reset token" };
        }

        if (response.ok && data.valid) {
          setTokenValid(true)
        } else {
          setTokenValid(false)
          setTokenError(data.message || "Invalid or expired reset token")
        }
      } catch (error) {
        setTokenValid(false)
        setTokenError("Failed to verify reset token")
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isValid = validateForm()
    if (!isValid) {
      toast({
        title: t('resetPassword.error'),
        description: t('login.resolveErrors'),
        variant: "destructive",
      })
      return
    }

    if (!token || tokenValid !== true) {
      toast({
        title: t('resetPassword.error'),
        description: t('signup.invalidToken'),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/password/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password: values.password }),
      })

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let data: any;
      if (isJson) {
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          throw new Error('Invalid response from server');
        }
      } else {
        const text = await response.text();
        data = { message: text || 'Failed to reset password.' };
      }

      if (response.ok) {
        setIsSuccess(true)
        toast({
          title: t('resetPassword.success'),
          description: t('resetPassword.successDesc'),
        })
      } else {
        toast({
          title: t('resetPassword.error'),
          description: data.message || t('resetPassword.unexpectedError'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t('resetPassword.error'),
        description: error instanceof Error ? error.message : t('resetPassword.unexpectedError'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
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
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-2xl font-medium mb-4 bg-gradient-to-r from-orange-500 to-red-800 text-transparent bg-clip-text">
                Invalid Reset Link
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {tokenError || "The password reset link is invalid or has expired."}
              </p>
              
              <button 
                onClick={() => navigate("/forgot-password")}
                className="w-full bg-gradient-to-r from-orange-500 to-red-800 hover:from-orange-600 hover:to-red-900 text-white font-medium py-4 rounded-2xl text-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                Request New Reset Link
                <ArrowRight className="h-5 w-5" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show loading while verifying token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
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
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              
              <h1 className="text-2xl font-medium mb-4 bg-gradient-to-r from-orange-500 to-red-800 text-transparent bg-clip-text">
                Verifying Reset Link
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we verify your reset link...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
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
                {t('resetPassword.success')}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('resetPassword.successDesc')}
              </p>
              
              <button 
                onClick={() => navigate("/login")}
                className="w-full bg-gradient-to-r from-orange-500 to-red-800 hover:from-orange-600 hover:to-red-900 text-white font-medium py-4 rounded-2xl text-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {t('forgotPassword.backToLogin')}
                <ArrowRight className="h-5 w-5" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Ondo Real Estate Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
            <Logo size="xl" variant="centered" showText={true} linkTo="/" />
          </div>
          <h1 className="text-2xl font-medium bg-gradient-to-r from-orange-500 to-red-800 text-transparent bg-clip-text">
            {t('resetPassword.title')}
          </h1>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {t('resetPassword.title')}
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">{t('resetPassword.newPassword')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={values.password}
                    maxLength={128}
                    onChange={handleChange("password")}
                    onBlur={handleBlur("password")}
                    aria-invalid={touched.password && !!errors.password}
                    className={`rounded-xl border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500 pr-10 ${
                      touched.password && errors.password ? "border-red-500 focus:ring-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Must include uppercase, lowercase, number, and special character.</p>
                {touched.password && errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">{t('resetPassword.confirmPassword')}</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={values.confirmPassword}
                    maxLength={128}
                    onChange={handleChange("confirmPassword")}
                    onBlur={handleBlur("confirmPassword")}
                    aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
                    className={`rounded-xl border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500 pr-10 ${
                      touched.confirmPassword && errors.confirmPassword ? "border-red-500 focus:ring-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-800 hover:from-orange-600 hover:to-red-900 text-white font-medium py-4 rounded-2xl text-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('resetPassword.resetting')}
                  </>
                ) : (
                  <>
                    {t('resetPassword.submit')}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <Link to="/login" className="text-orange-600 hover:underline font-medium">
              {t('forgotPassword.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
