import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, Smartphone, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiGet, apiPut } from "@/lib/api/http"

interface PaymentMethodConfig {
  id: string
  propertyId: string
  applePay: boolean
  googlePay: boolean
  stripeLink: boolean
  klarna: boolean
  cards: boolean
}

interface Props {
  propertyId: string
}

const METHOD_META: Array<{ key: keyof Omit<PaymentMethodConfig, "id" | "propertyId">; label: string; description: string; icon: typeof CreditCard }> = [
  { key: "cards", label: "Credit/Debit Cards", description: "Visa, Mastercard, Amex, Discover", icon: CreditCard },
  { key: "applePay", label: "Apple Pay", description: "Pay with Apple devices", icon: Smartphone },
  { key: "googlePay", label: "Google Pay", description: "Pay with Google accounts", icon: Wallet },
  { key: "stripeLink", label: "Stripe Link", description: "One-click checkout with saved info", icon: Wallet },
  { key: "klarna", label: "Klarna", description: "Buy now, pay later option", icon: CreditCard },
]

export function PaymentMethodConfigPanel({ propertyId }: Props) {
  const { toast } = useToast()
  const [config, setConfig] = useState<PaymentMethodConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadConfig() }, [propertyId])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const res = await apiGet<{ data: PaymentMethodConfig }>(`/payment-config/${propertyId}`)
      setConfig(res.data)
    } catch {
      setConfig({ id: "", propertyId, applePay: true, googlePay: true, stripeLink: true, klarna: false, cards: true })
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await apiPut<{ data: PaymentMethodConfig }>(`/payment-config/${propertyId}`, config)
      setConfig(res.data)
      toast({ title: "Payment methods updated" })
    } catch {
      toast({ title: "Failed to save payment config", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key: keyof Omit<PaymentMethodConfig, "id" | "propertyId">) => {
    if (!config) return
    setConfig({ ...config, [key]: !config[key] })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!config) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> Payment Methods
        </CardTitle>
        <CardDescription>Configure which payment methods tenants can use for this property</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {METHOD_META.map(({ key, label, description, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <Switch checked={config[key]} onCheckedChange={() => toggle(key)} />
          </div>
        ))}
        <Button onClick={save} disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Payment Config
        </Button>
      </CardContent>
    </Card>
  )
}
