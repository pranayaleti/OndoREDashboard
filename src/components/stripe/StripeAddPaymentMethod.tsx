import { useState } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface AddMethodInnerProps {
  onSuccess?: (paymentMethodId: string) => void
  onError?: (message: string) => void
}

function AddMethodInner({ onSuccess, onError }: AddMethodInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsProcessing(true)
    setErrorMessage(null)

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    })

    if (error) {
      const msg = error.message || "Failed to save payment method."
      setErrorMessage(msg)
      onError?.(msg)
      setIsProcessing(false)
    } else if (setupIntent?.payment_method) {
      const pmId = typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method.id
      onSuccess?.(pmId)
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
            Saving...
          </>
        ) : (
          "Save Payment Method"
        )}
      </Button>
    </form>
  )
}

interface StripeAddPaymentMethodProps {
  clientSecret: string
  onSuccess?: (paymentMethodId: string) => void
  onError?: (message: string) => void
}

export function StripeAddPaymentMethod({
  clientSecret,
  onSuccess,
  onError,
}: StripeAddPaymentMethodProps) {
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
      <AddMethodInner onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}
