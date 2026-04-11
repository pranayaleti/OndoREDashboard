import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PropertyLeadFormProps {
  open: boolean
  onClose: () => void
  propertyName: string
}

export function PropertyLeadForm({ open, onClose, propertyName }: PropertyLeadFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    preferredContact: "email",
    moveInDate: "",
    budget: "",
    occupants: "1",
    pets: "No",
    creditScore: "",
    employmentStatus: "",
    income: "",
    comments: "",
    termsAccepted: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, termsAccepted: checked }))
  }

  const handleNext = () => {
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1500)
  }

  const handleClose = () => {
    onClose()
    // Reset form after closing
    setTimeout(() => {
      setStep(1)
      setIsSubmitted(false)
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        preferredContact: "email",
        moveInDate: "",
        budget: "",
        occupants: "1",
        pets: "No",
        creditScore: "",
        employmentStatus: "",
        income: "",
        comments: "",
        termsAccepted: false,
      })
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0" style={{ zIndex: 9999 }}>
        <div className="relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold mb-6">{isSubmitted ? "Thank You!" : `Apply for ${propertyName}`}</DialogTitle>
              <DialogDescription className="sr-only">
                {isSubmitted ? "Your application has been submitted successfully" : `Fill out the form to apply for ${propertyName}`}
              </DialogDescription>
            </DialogHeader>

            {!isSubmitted && (
              <div className="flex justify-between mb-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full",
                      step === i
                        ? "bg-background text-white dark:bg-card dark:text-card-foreground"
                        : "bg-muted text-gray-600 dark:bg-secondary dark:text-gray-300",
                    )}
                  >
                    {i}
                  </div>
                ))}
              </div>
            )}

            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-4 rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Application Submitted</h3>
                <p className="mb-6 text-muted-foreground">
                  Thank you for your interest! A property manager will contact you shortly.
                </p>
                <Button onClick={handleClose}>Close</Button>
              </div>
            ) : (
              <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg mb-4">Personal Information</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Contact Method</Label>
                      <RadioGroup
                        defaultValue={formData.preferredContact}
                        onValueChange={(value) => handleSelectChange("preferredContact", value)}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="email" id="contact-email" />
                          <Label htmlFor="contact-email">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="phone" id="contact-phone" />
                          <Label htmlFor="contact-phone">Phone</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="text" id="contact-text" />
                          <Label htmlFor="contact-text">Text</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="bg-background hover:bg-muted dark:bg-card dark:text-card-foreground dark:hover:bg-muted"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg mb-4">Rental Details</h3>

                    <div className="space-y-2">
                      <Label htmlFor="moveInDate">
                        Desired Move-in Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="moveInDate"
                        name="moveInDate"
                        type="date"
                        value={formData.moveInDate}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget">
                        Monthly Budget <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="budget"
                        name="budget"
                        placeholder="$"
                        value={formData.budget}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="occupants">Number of Occupants</Label>
                      <select
                        id="occupants"
                        name="occupants"
                        value={formData.occupants}
                        onChange={(e) => handleSelectChange("occupants", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5+">5+</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pets">Do you have pets?</Label>
                      <select
                        id="pets"
                        name="pets"
                        value={formData.pets}
                        onChange={(e) => handleSelectChange("pets", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div className="pt-4 flex justify-between">
                      <Button type="button" variant="outline" onClick={handleBack}>
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="bg-background hover:bg-muted dark:bg-card dark:text-card-foreground dark:hover:bg-muted"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg mb-4">Financial Information</h3>

                    <div className="space-y-2">
                      <Label htmlFor="creditScore">
                        Credit Score Range <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="creditScore"
                        name="creditScore"
                        value={formData.creditScore}
                        onChange={(e) => handleSelectChange("creditScore", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Select</option>
                        <option value="Excellent (750+)">Excellent (750+)</option>
                        <option value="Good (700-749)">Good (700-749)</option>
                        <option value="Fair (650-699)">Fair (650-699)</option>
                        <option value="Below 650">Below 650</option>
                        <option value="Don't Know">Don't Know</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employmentStatus">
                        Employment Status <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="employmentStatus"
                        name="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={(e) => handleSelectChange("employmentStatus", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="">Select</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Self-employed">Self-employed</option>
                        <option value="Student">Student</option>
                        <option value="Retired">Retired</option>
                        <option value="Unemployed">Unemployed</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="income">
                        Annual Income <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="income"
                        name="income"
                        placeholder="$"
                        value={formData.income}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comments">Questions or Comments</Label>
                      <Textarea
                        id="comments"
                        name="comments"
                        placeholder="Any specific questions about the property?"
                        value={formData.comments}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="flex items-start space-x-2 pt-2">
                      <Checkbox
                        id="termsAccepted"
                        checked={formData.termsAccepted}
                        onCheckedChange={(checked) => handleCheckboxChange(checked as boolean)}
                      />
                      <Label htmlFor="termsAccepted" className="text-sm">
                        I agree to the terms and conditions and consent to having my information stored for rental
                        application purposes.
                      </Label>
                    </div>

                    <div className="pt-4 flex justify-between">
                      <Button type="button" variant="outline" onClick={handleBack}>
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-background hover:bg-muted dark:bg-card dark:text-card-foreground dark:hover:bg-muted"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
