import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Building, Mail, MapPin, Phone } from "lucide-react"
import { PageBanner } from "@/components/page-banner"
import { useToast } from "@/hooks/use-toast"
import { useValidatedForm } from "@/hooks/useValidatedForm"
import type { FormValidationSchema } from "@/utils/validation.utils"
import { sanitize } from "@/utils/validation.utils"
import { ERROR_MESSAGES, REGEX_PATTERNS, validationPresets } from "@/constants"
import { companyInfo, getWeekdayHours } from "@/constants/companyInfo"
import { useAuth } from "@/lib/auth-context"
import { useNavigate } from "react-router-dom"
import { getDashboardPath } from "@/lib/auth-utils"
import { TenantScreeningSection } from "@/components/tenant-screening/TenantScreeningSection"

export default function ContactPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const navigate = useNavigate()

  const schema: FormValidationSchema<{
    firstName: string
    lastName: string
    email: string
    phone: string
    subject: string
    message: string
  }> = {
    firstName: validationPresets.firstName,
    lastName: validationPresets.lastName,
    email: validationPresets.email,
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
    subject: validationPresets.requiredText(120),
    message: {
      required: true,
      formatter: sanitize.trim,
      rules: [
        {
          validator: (value) => value.length >= 10,
          message: "Message must be at least 10 characters.",
        },
        {
          validator: (value) => value.length <= 1000,
          message: "Message must be under 1000 characters.",
        },
      ],
      maxLength: 1000,
    },
  }

  const { values, errors, touched, handleChange, handleBlur, validateForm, resetForm } = useValidatedForm({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
    schema,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) {
      toast({
        title: "Please review your entries",
        description: "Some fields require attention.",
        variant: "destructive",
      })
      return
    }

    // In lieu of a backend endpoint, sanitized values are ready for future API integration.

    toast({
      title: "Message sent",
      description: "Our team will reach out within 24 hours.",
    })

    resetForm()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageBanner
        title="Contact our team"
        subtitle="Need help with onboarding, integrations, or inviting owners + tenants? We respond within one business day."
      />

      <main className="flex-1">
        <section className="py-10">
          <div className="container px-4 md:px-6">
            <TenantScreeningSection
              ctaHref="/contact"
              ctaLabel="Book a screening demo"
              description="Share a few details with our team and we’ll configure screening workflows that match your portfolio."
              title="Deploy modern screening across every portfolio"
            />
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => {
                  if (user) {
                    navigate(getDashboardPath(user.role))
                  } else {
                    navigate("/")
                  }
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {user ? "Back to Dashboard" : "Back to Home"}
              </Button>
            </div>
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tighter">Get in Touch</h2>
                  <p className="text-muted-foreground mt-2">
                    Fill out the form and our team will get back to you within 24 hours.
                  </p>
                </div>
                <div className="grid gap-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Our Office</h3>
                      <p className="text-sm text-muted-foreground">
                        {companyInfo.address.streetAddress}
                        <br />
                        {companyInfo.address.addressLocality}, {companyInfo.address.addressRegion} {companyInfo.address.postalCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <p className="text-sm text-muted-foreground">{companyInfo.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Phone</h3>
                      <p className="text-sm text-muted-foreground">{companyInfo.phoneDisplay}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Building className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Business Hours</h3>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const weekday = getWeekdayHours()
                          const saturday = companyInfo.hours.find(h => h.day === "Sat")
                          const sunday = companyInfo.hours.find(h => h.day === "Sun")
                          const formatTime = (time: string) => {
                            const [hour, min] = time.split(":").map(Number)
                            return new Date(2000, 0, 1, hour, min).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit', 
                              hour12: true 
                            })
                          }
                          return (
                            <>
                              {weekday ? `Monday - Friday: ${formatTime(weekday.opens ?? "09:00")} - ${formatTime(weekday.closes ?? "17:00")}` : "Monday - Friday: 9am - 5pm"}
                              <br />
                              {saturday && !saturday.closed ? `Saturday: ${formatTime(saturday.opens ?? "10:00")} - ${formatTime(saturday.closes ?? "14:00")}` : "Saturday: 10am - 2pm"}
                              <br />
                              {sunday?.closed ? "Sunday: Closed" : "Sunday: Closed"}
                            </>
                          )
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>We'll respond to your inquiry as soon as possible.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="contact-form" className="grid gap-4" onSubmit={handleSubmit} noValidate>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First name</Label>
                        <Input
                          id="first-name"
                          name="firstName"
                          placeholder="John"
                          value={values.firstName}
                          maxLength={50}
                          onChange={handleChange("firstName")}
                          onBlur={handleBlur("firstName")}
                          aria-invalid={touched.firstName && !!errors.firstName}
                          className={touched.firstName && errors.firstName ? "border-red-500 focus:ring-red-500" : ""}
                          required
                        />
                        {touched.firstName && errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last name</Label>
                        <Input
                          id="last-name"
                          name="lastName"
                          placeholder="Doe"
                          value={values.lastName}
                          maxLength={50}
                          onChange={handleChange("lastName")}
                          onBlur={handleBlur("lastName")}
                          aria-invalid={touched.lastName && !!errors.lastName}
                          className={touched.lastName && errors.lastName ? "border-red-500 focus:ring-red-500" : ""}
                          required
                        />
                        {touched.lastName && errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        placeholder="john.doe@example.com"
                        type="email"
                        value={values.email}
                        maxLength={120}
                        onChange={handleChange("email")}
                        onBlur={handleBlur("email")}
                        aria-invalid={touched.email && !!errors.email}
                        className={touched.email && errors.email ? "border-red-500 focus:ring-red-500" : ""}
                        required
                      />
                      {touched.email && errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder={companyInfo.phoneDisplay}
                        type="tel"
                        value={values.phone}
                        maxLength={20}
                        onChange={handleChange("phone")}
                        onBlur={handleBlur("phone")}
                        aria-invalid={touched.phone && !!errors.phone}
                        className={touched.phone && errors.phone ? "border-red-500 focus:ring-red-500" : ""}
                      />
                      {touched.phone && errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="How can we help you?"
                        value={values.subject}
                        maxLength={120}
                        onChange={handleChange("subject")}
                        onBlur={handleBlur("subject")}
                        aria-invalid={touched.subject && !!errors.subject}
                        className={touched.subject && errors.subject ? "border-red-500 focus:ring-red-500" : ""}
                        required
                      />
                      {touched.subject && errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        className={`min-h-[120px] ${
                          touched.message && errors.message ? "border-red-500 focus:ring-red-500" : ""
                        }`}
                        id="message"
                        placeholder="Please provide details about your inquiry..."
                        name="message"
                        value={values.message}
                        maxLength={1000}
                        onChange={handleChange("message")}
                        onBlur={handleBlur("message")}
                        aria-invalid={touched.message && !!errors.message}
                      />
                      {touched.message && errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
                    </div>
                  </form>
                </CardContent>
                <CardFooter>
                  <Button type="submit" form="contact-form" className="w-full">
                    Send Message
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
