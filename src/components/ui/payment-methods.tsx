import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { CreditCard, Building, Loader2 } from "lucide-react"
import { formatExpiration } from "@/utils/payment.utils"
import { StripeAddPaymentMethod } from "@/components/stripe/StripeAddPaymentMethod"
import { featureApi, type StripePaymentMethod } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export interface PaymentMethod {
  id: string
  stripePaymentMethodId?: string
  type?: "card" | "us_bank_account" | "credit_card" | "bank_account" | "ach" | "digital_wallet"
  brand?: string
  last4: string
  expMonth?: number
  expYear?: number
  bankName?: string
  bank?: string
  handle?: string
  nickname?: string
  isDefault: boolean
  cardNumber?: string
  cvv?: string
}

interface PaymentMethodsProps {
  paymentMethods?: PaymentMethod[]
  onAddPaymentMethod?: () => void
  onSetDefault?: (id: string) => void
  onEdit?: (id: string) => void
  onRemove?: (id: string) => void
}

function mapApiMethod(m: StripePaymentMethod): PaymentMethod {
  return {
    id: m.id,
    stripePaymentMethodId: m.stripePaymentMethodId,
    type: m.type,
    brand: m.brand,
    last4: m.last4,
    expMonth: m.expMonth,
    expYear: m.expYear,
    bankName: m.bankName,
    isDefault: m.isDefault,
  }
}

export function PaymentMethods({
  paymentMethods: initialMethods,
  onAddPaymentMethod,
  onSetDefault,
  onRemove,
}: PaymentMethodsProps) {
  const { toast } = useToast()
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods || [])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null)
  const [isLoadingSetup, setIsLoadingSetup] = useState(false)
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  useEffect(() => {
    if (initialMethods) {
      setMethods(initialMethods)
    } else {
      loadMethods()
    }
  }, [initialMethods])

  const loadMethods = async () => {
    try {
      const result = await featureApi.stripe.listPaymentMethods()
      setMethods(result.data.map(mapApiMethod))
    } catch {
      // Methods will show empty
    }
  }

  const normalizedMethods = useMemo(() => {
    if (methods.length === 0) return []
    const hasDefault = methods.some((m) => m.isDefault)
    if (hasDefault) return methods
    const [first, ...rest] = methods
    return [{ ...first, isDefault: true }, ...rest]
  }, [methods])

  const handleOpenAddDialog = async () => {
    setIsLoadingSetup(true)
    setIsAddDialogOpen(true)
    try {
      const result = await featureApi.stripe.createSetupIntent()
      setSetupClientSecret(result.clientSecret)
    } catch {
      toast({ title: "Error", description: "Failed to initialize payment setup.", variant: "destructive" })
      setIsAddDialogOpen(false)
    } finally {
      setIsLoadingSetup(false)
    }
  }

  const handleAddSuccess = async (paymentMethodId: string) => {
    try {
      await featureApi.stripe.attachPaymentMethod(paymentMethodId)
      toast({ title: "Payment Method Saved", description: "Your payment method has been added." })
      await loadMethods()
      onAddPaymentMethod?.()
    } catch {
      toast({ title: "Error", description: "Failed to save payment method.", variant: "destructive" })
    }
    setIsAddDialogOpen(false)
    setSetupClientSecret(null)
  }

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id)
    try {
      await featureApi.stripe.setDefaultPaymentMethod(id)
      setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })))
      toast({ title: "Default updated", description: "This payment method is now your default." })
      onSetDefault?.(id)
    } catch {
      toast({ title: "Error", description: "Failed to update default.", variant: "destructive" })
    } finally {
      setSettingDefaultId(null)
    }
  }

  const handleRemove = async () => {
    if (!pendingRemovalId) return
    setIsRemoving(true)
    try {
      await featureApi.stripe.removePaymentMethod(pendingRemovalId)
      setMethods((prev) => {
        const remaining = prev.filter((m) => m.id !== pendingRemovalId)
        if (remaining.length > 0 && !remaining.some((m) => m.isDefault)) {
          remaining[0].isDefault = true
        }
        return remaining
      })
      toast({ title: "Removed", description: "Payment method has been removed." })
      onRemove?.(pendingRemovalId)
    } catch {
      toast({ title: "Error", description: "Failed to remove payment method.", variant: "destructive" })
    }
    setIsRemoving(false)
    setPendingRemovalId(null)
  }

  const getDisplayText = (method: PaymentMethod) => {
    if (method.type === "card" || method.type === "credit_card") {
      const brand = method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : "Card"
      return `${brand} •••• ${method.last4}`
    }
    if (method.type === "us_bank_account" || method.type === "bank_account" || method.type === "ach") {
      const bank = method.bankName || method.bank || "Bank"
      return `${bank} •••• ${method.last4}`
    }
    return `•••• ${method.last4}`
  }

  const getIcon = (type?: string) => {
    if (type === "card" || type === "credit_card") return <CreditCard className="h-4 w-4" />
    return <Building className="h-4 w-4" />
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods securely via Stripe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {normalizedMethods.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment methods added yet.</p>
          ) : (
            normalizedMethods.map((method) => (
              <div key={method.id} className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    {getIcon(method.type)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold leading-none">{getDisplayText(method)}</p>
                    {(method.type === "card" || method.type === "credit_card") && method.expMonth && method.expYear && (
                      <p className="text-sm text-muted-foreground">
                        Expires {formatExpiration(method.expMonth, method.expYear)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {method.isDefault ? (
                    <Button variant="secondary" size="sm" disabled>Default</Button>
                  ) : (
                    normalizedMethods.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => void handleSetDefault(method.id)}
                        disabled={settingDefaultId !== null}
                      >
                        {settingDefaultId === method.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                            Updating…
                          </>
                        ) : (
                          "Set as Default"
                        )}
                      </Button>
                    )
                  )}
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => setPendingRemovalId(method.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleOpenAddDialog} className="w-full sm:w-auto">
            Add Payment Method
          </Button>
        </CardFooter>
      </Card>

      {/* Add Payment Method Dialog (Stripe Elements) */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) { setIsAddDialogOpen(false); setSetupClientSecret(null) }
      }}>
        <DialogContent className="sm:max-w-lg border-2 border-orange-500">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Securely save a card or bank account via Stripe.
            </DialogDescription>
          </DialogHeader>
          {isLoadingSetup ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : setupClientSecret ? (
            <StripeAddPaymentMethod
              clientSecret={setupClientSecret}
              onSuccess={handleAddSuccess}
              onError={(msg) => toast({ title: "Error", description: msg, variant: "destructive" })}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={!!pendingRemovalId} onOpenChange={(open) => { if (!open) setPendingRemovalId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately remove the payment method from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
