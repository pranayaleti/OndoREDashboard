"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { DollarSign, TrendingUp, Megaphone, ClipboardCheck, AlertTriangle } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface BulkOperationsProps {
  propertyIds: string[]
}

export function BulkOperations({ propertyIds }: BulkOperationsProps) {
  const { toast } = useToast()

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null)
  const [confirmLabel, setConfirmLabel] = useState("")
  const [applying, setApplying] = useState(false)

  // Late Fee Rules
  const [lateFee, setLateFee] = useState({ gracePeriodDays: "5", feeType: "flat", flatAmount: "", percentage: "", dailyAmount: "" })

  // Rent Increase
  const [rentIncrease, setRentIncrease] = useState({ changeType: "percentage", changeValue: "", effectiveDate: "" })

  // Announcement
  const [announcement, setAnnouncement] = useState({ title: "", body: "", priority: "normal" })

  // Screening
  const [screening, setScreening] = useState({ templateId: "standard" })

  const confirm = (label: string, action: () => Promise<void>) => {
    setConfirmLabel(label)
    setConfirmAction(() => action)
  }

  const runConfirmed = async () => {
    if (!confirmAction) return
    try {
      setApplying(true)
      await confirmAction()
      toast({ title: `${confirmLabel} applied to all ${propertyIds.length} properties` })
    } catch {
      toast({ title: `Failed to apply ${confirmLabel}`, variant: "destructive" })
    } finally {
      setApplying(false)
      setConfirmAction(null)
    }
  }

  const applyLateFeeRules = async () => {
    await featureApi.bulkOps.lateFeeRules({
      propertyIds,
      gracePeriodDays: Number(lateFee.gracePeriodDays),
      feeType: lateFee.feeType,
      flatAmount: lateFee.feeType === "flat" ? Number(lateFee.flatAmount) : undefined,
      percentage: lateFee.feeType === "percentage" ? Number(lateFee.percentage) : undefined,
      dailyAmount: lateFee.feeType === "daily" ? Number(lateFee.dailyAmount) : undefined,
    })
  }

  const applyRentIncrease = async () => {
    await featureApi.bulkOps.rentIncreases({
      propertyIds,
      changeType: rentIncrease.changeType,
      changeValue: Number(rentIncrease.changeValue),
      effectiveDate: rentIncrease.effectiveDate,
    })
  }

  const applyAnnouncement = async () => {
    await featureApi.bulkOps.announcements({
      propertyIds,
      title: announcement.title,
      body: announcement.body,
      priority: announcement.priority,
    })
  }

  const applyScreeningConfig = async () => {
    await featureApi.bulkOps.screeningConfig({
      propertyIds,
      templateId: screening.templateId,
    })
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Late Fee Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5" />
              Bulk Late Fee Rules
            </CardTitle>
            <CardDescription>Apply late fee settings across all properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Grace Period (days)</Label>
              <Input
                type="number"
                value={lateFee.gracePeriodDays}
                onChange={(e) => setLateFee((f) => ({ ...f, gracePeriodDays: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Fee Type</Label>
              <Select value={lateFee.feeType} onValueChange={(v) => setLateFee((f) => ({ ...f, feeType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Amount</SelectItem>
                  <SelectItem value="percentage">Percentage of Rent</SelectItem>
                  <SelectItem value="daily">Daily Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {lateFee.feeType === "flat" && (
              <div className="space-y-1">
                <Label>Flat Amount ($)</Label>
                <Input type="number" placeholder="e.g. 50" value={lateFee.flatAmount}
                  onChange={(e) => setLateFee((f) => ({ ...f, flatAmount: e.target.value }))} />
              </div>
            )}
            {lateFee.feeType === "percentage" && (
              <div className="space-y-1">
                <Label>Percentage (%)</Label>
                <Input type="number" placeholder="e.g. 5" value={lateFee.percentage}
                  onChange={(e) => setLateFee((f) => ({ ...f, percentage: e.target.value }))} />
              </div>
            )}
            {lateFee.feeType === "daily" && (
              <div className="space-y-1">
                <Label>Daily Amount ($)</Label>
                <Input type="number" placeholder="e.g. 10" value={lateFee.dailyAmount}
                  onChange={(e) => setLateFee((f) => ({ ...f, dailyAmount: e.target.value }))} />
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => confirm("Late Fee Rules", applyLateFeeRules)}
              disabled={!lateFee.gracePeriodDays}
            >
              Apply to All Properties
            </Button>
          </CardContent>
        </Card>

        {/* Rent Increase */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              Bulk Rent Increase
            </CardTitle>
            <CardDescription>Schedule a rent change across properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Change Type</Label>
              <Select value={rentIncrease.changeType} onValueChange={(v) => setRentIncrease((f) => ({ ...f, changeType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Amount ($)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{rentIncrease.changeType === "flat" ? "Amount ($)" : "Percentage (%)"}</Label>
              <Input
                type="number"
                placeholder={rentIncrease.changeType === "flat" ? "e.g. 100" : "e.g. 3"}
                value={rentIncrease.changeValue}
                onChange={(e) => setRentIncrease((f) => ({ ...f, changeValue: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Effective Date</Label>
              <Input
                type="date"
                value={rentIncrease.effectiveDate}
                onChange={(e) => setRentIncrease((f) => ({ ...f, effectiveDate: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => confirm("Rent Increase", applyRentIncrease)}
              disabled={!rentIncrease.changeValue || !rentIncrease.effectiveDate}
            >
              Apply to All Properties
            </Button>
          </CardContent>
        </Card>

        {/* Announcement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-5 w-5" />
              Bulk Announcement
            </CardTitle>
            <CardDescription>Send a message to all tenants across properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Scheduled Maintenance Notice"
                value={announcement.title}
                onChange={(e) => setAnnouncement((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your announcement here…"
                value={announcement.body}
                onChange={(e) => setAnnouncement((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={announcement.priority} onValueChange={(v) => setAnnouncement((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => confirm("Announcement", applyAnnouncement)}
              disabled={!announcement.title || !announcement.body}
            >
              Apply to All Properties
            </Button>
          </CardContent>
        </Card>

        {/* Screening Config */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-5 w-5" />
              Bulk Screening Config
            </CardTitle>
            <CardDescription>Set the screening template for all properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Screening Template</Label>
              <Select value={screening.templateId} onValueChange={(v) => setScreening({ templateId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="thorough">Thorough</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Basic: ID + credit · Standard: + background · Thorough: + income verification & references
            </p>
            <Button
              className="w-full"
              onClick={() => confirm("Screening Config", applyScreeningConfig)}
            >
              Apply to All Properties
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Bulk Action
            </DialogTitle>
            <DialogDescription>
              This will apply <strong>{confirmLabel}</strong> to all{" "}
              <strong>{propertyIds.length}</strong> propert{propertyIds.length === 1 ? "y" : "ies"}.
              This action cannot be undone automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button variant="destructive" onClick={runConfirmed} disabled={applying}>
              {applying ? "Applying…" : `Apply ${confirmLabel}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
