import { useState } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface PaymentFormInnerProps {
  amount?: number
  onSuccess?: () => void
  onError?: (message: string) => void
  submitLabel?: string
}

function PaymentFormInner({ amount, onSuccess, onError, submitLabel }: PaymentFormInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        const msg = submitError.message || "Please check your payment details."
        setErrorMessage(msg)
        onError?.(msg)
        return
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      })

      if (error) {
        const msg = error.message || "Payment failed. Please try again."
        setErrorMessage(msg)
        onError?.(msg)
        return
      }

      const status = paymentIntent?.status
      if (status === "succeeded" || status === "processing" || status === "requires_capture") {
        onSuccess?.()
        return
      }

      const msg = "Payment did not complete. Please try again."
      setErrorMessage(msg)
      onError?.(msg)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed. Please try again."
      setErrorMessage(msg)
      onError?.(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          submitLabel || (amount ? `Pay $${(amount / 100).toFixed(2)}` : "Pay Now")
        )}
      </Button>
    </form>
  )
}

interface StripePaymentFormProps {
  clientSecret: string
  amount?: number
  onSuccess?: () => void
  onError?: (message: string) => void
  submitLabel?: string
}

export function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
  submitLabel,
}: StripePaymentFormProps) {
  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in your environment.
      </p>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#f97316",
          },
        },
      }}
    >
      <PaymentFormInner
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        submitLabel={submitLabel}
      />
    </Elements>
  )
}
