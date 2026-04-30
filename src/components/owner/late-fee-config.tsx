import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, Save, Zap } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface LateFeeConfigProps {
  propertyId: string
}

export function LateFeeConfig({ propertyId }: LateFeeConfigProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feeType, setFeeType] = useState("flat")
  const [gracePeriod, setGracePeriod] = useState("5")
  const [flatAmount, setFlatAmount] = useState("")
  const [percentage, setPercentage] = useState("")
  const [dailyAmount, setDailyAmount] = useState("")
  const [maxFee, setMaxFee] = useState("")

  useEffect(() => { loadRule() }, [propertyId])

  const loadRule = async () => {
    try {
      setLoading(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await featureApi.lateFees.getRule(propertyId) as any
      const rule = res?.data ?? res
      if (rule) {
        setFeeType(rule.feeType || "flat")
        setGracePeriod(String(rule.gracePeriodDays || 5))
        if (rule.feeAmountCents) setFlatAmount(String(rule.feeAmountCents / 100))
        if (rule.feePercentage) setPercentage(String(rule.feePercentage))
        if (rule.dailyAmountCents) setDailyAmount(String(rule.dailyAmountCents / 100))
        if (rule.maxFeeCents) setMaxFee(String(rule.maxFeeCents / 100))
      }
    } catch { /* no rule yet */ } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await featureApi.lateFees.setRule(propertyId, {
        feeType,
        gracePeriodDays: parseInt(gracePeriod),
        feeAmountCents: feeType === "flat" ? Math.round(parseFloat(flatAmount || "0") * 100) : undefined,
        feePercentage: feeType === "percentage" ? parseFloat(percentage || "0") : undefined,
        dailyAmountCents: feeType === "daily" ? Math.round(parseFloat(dailyAmount || "0") * 100) : undefined,
        maxFeeCents: maxFee ? Math.round(parseFloat(maxFee) * 100) : undefined,
      })
      toast({ title: "Late fee rules saved" })
    } catch {
      toast({ title: "Failed to save", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleApply = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await featureApi.lateFees.apply(propertyId) as any
      toast({ title: (res?.data ?? res)?.message || "Late fees applied" })
    } catch {
      toast({ title: "Failed to apply fees", variant: "destructive" })
    }
  }

  if (loading) return <Skeleton className="h-32 w-full" />

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-red-500" /> Late Fee Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Grace Period (days)</Label>
            <Input type="number" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} />
          </div>
          <div>
            <Label>Fee Type</Label>
            <Select value={feeType} onValueChange={setFeeType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat Amount</SelectItem>
                <SelectItem value="percentage">Percentage of Rent</SelectItem>
                <SelectItem value="daily">Daily Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {feeType === "flat" && (
          <div>
            <Label>Late Fee ($)</Label>
            <Input type="number" step="0.01" value={flatAmount} onChange={(e) => setFlatAmount(e.target.value)} placeholder="50.00" />
          </div>
        )}
        {feeType === "percentage" && (
          <div>
            <Label>Percentage (%)</Label>
            <Input type="number" step="0.1" value={percentage} onChange={(e) => setPercentage(e.target.value)} placeholder="5.0" />
          </div>
        )}
        {feeType === "daily" && (
          <div>
            <Label>Daily Amount ($)</Label>
            <Input type="number" step="0.01" value={dailyAmount} onChange={(e) => setDailyAmount(e.target.value)} placeholder="10.00" />
          </div>
        )}

        <div>
          <Label>Max Fee Cap ($)</Label>
          <Input type="number" step="0.01" value={maxFee} onChange={(e) => setMaxFee(e.target.value)} placeholder="Optional max" />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Rules"}
          </Button>
          <Button variant="outline" onClick={handleApply}>
            <Zap className="h-4 w-4 mr-1" /> Apply Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
