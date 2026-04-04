import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"
import { useValidatedForm } from "@/hooks/useValidatedForm"
import type { FormValidationSchema } from "@/utils/validation.utils"
import { sanitize, validators } from "@/utils/validation.utils"
import { ERROR_MESSAGES } from "@/constants/regex.constants"
import { getApiBaseUrl } from "@/lib/api/base-url"

const API_BASE_URL = getApiBaseUrl()

export default function ForgotPassword() {
  const { t } = useTranslation('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const schema: FormValidationSchema<{ email: string }> = {
    email: {
      required: true,
      formatter: (value: string) => sanitize.trim(value).toLowerCase(),
      rules: [
        {
          validator: validators.email,
          message: ERROR_MESSAGES.EMAIL,
        },
      ],
      maxLength: 120,
    },
  }

  const { values, errors, touched, handleChange, handleBlur, validateForm } = useValidatedForm({
    initialValues: { email: "" },
    schema,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = validateForm()
    if (!isValid) {
      toast({
        title: t('forgotPassword.error'),
        description: t('validation.emailInvalid'),
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/password/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: values.email }),
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
        data = { message: text || 'Failed to send reset email.' };
      }

      if (response.ok) {
        setIsSubmitted(true)
        toast({
          title: t('forgotPassword.checkEmail'),
          description: data.message,
        })
      } else {
        toast({
          title: t('forgotPassword.error'),
          description: data.message || t('forgotPassword.unexpectedError'),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t('forgotPassword.error'),
        description: error instanceof Error ? error.message : t('forgotPassword.unexpectedError'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
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
                {t('forgotPassword.checkEmail')}
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('forgotPassword.resetSent')}
              </p>
              
              <div className="space-y-3">
                <Link to="/login" className="block">
                  <button className="w-full bg-gradient-to-r from-orange-500 to-red-800 hover:from-orange-600 hover:to-red-900 text-white font-medium py-4 rounded-2xl text-xl transition-all duration-200 flex items-center justify-center gap-2">
                    {t('forgotPassword.backToLogin')}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('forgotPassword.didntReceive')}{" "}
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-orange-600 hover:underline"
                  >
                    {t('forgotPassword.resend')}
                  </button>
                </p>
              </div>
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
            {t('forgotPassword.title')}
          </h1>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {t('forgotPassword.subtitle')}
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">{t('forgotPassword.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={values.email}
                  maxLength={120}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  aria-invalid={touched.email && !!errors.email}
                  className={`rounded-xl border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500 ${
                    touched.email && errors.email ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                {touched.email && errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-800 hover:from-orange-600 hover:to-red-900 text-white font-medium py-4 rounded-2xl text-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('forgotPassword.sending')}
                  </>
                ) : (
                  <>
                    {t('forgotPassword.submit')}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <Link to="/login" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
              {t('forgotPassword.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
