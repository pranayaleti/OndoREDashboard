"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { MAINTENANCE_STATUSES } from "@/constants/maintenance.constants"

interface UpdateStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: {
    id: string
    status: string
    title: string
  } | null
  onUpdate?: (requestId: string, data: { status: string; notes?: string }) => Promise<void> | void
}

export function UpdateStatusDialog({
  open,
  onOpenChange,
  request,
  onUpdate,
}: UpdateStatusDialogProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (request) {
      setStatus(request.status || "")
      setNotes("")
    }
  }, [request, open])

  const handleSubmit = async () => {
    if (!request || !status) {
      toast({
        title: "Error",
        description: "Please select a status.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (onUpdate) {
        await onUpdate(request.id, { status, notes })
      }

      toast({
        title: "Status Updated",
        description: "The maintenance request status has been updated successfully.",
        duration: 3000,
      })

      onOpenChange(false)
      setNotes("")
    } catch (error: unknown) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Failed to update status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      setNotes("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>
            Update the status for: {request?.title || "Maintenance Request"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="status">Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_STATUSES.map((statusOption) => (
                  <SelectItem key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Update Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this status update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !status}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

