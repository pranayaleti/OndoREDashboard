"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Calendar } from "lucide-react"
import { getTechnicianOptions } from "@/constants/technicians.constants"

interface AssignTechnicianDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: {
    id: string
    title: string
    assignedTo?: string
  } | null
  onAssign?: (
    requestId: string,
    data: {
      technicianId: string
      technicianName: string
      dueDate?: string
      costRange?: { min: number; max: number }
      notes?: string
    }
  ) => Promise<void> | void
  availableTechnicians?: string[]
}

export function AssignTechnicianDialog({
  open,
  onOpenChange,
  request,
  onAssign,
  availableTechnicians: _availableTechnicians,
}: AssignTechnicianDialogProps) {
  const { toast } = useToast()
  const technicianOptions = getTechnicianOptions()
  const [technicianId, setTechnicianId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [costMin, setCostMin] = useState("")
  const [costMax, setCostMax] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (request) {
      // Find technician by name if assigned
      if (request.assignedTo) {
        const tech = technicianOptions.find((t) => t.name === request.assignedTo)
        setTechnicianId(tech?.value || "")
      } else {
        setTechnicianId("")
      }
      setDueDate("")
      setCostMin("")
      setCostMax("")
      setNotes("")
    }
  }, [request, open, technicianOptions])

  const handleSubmit = async () => {
    if (!request || !technicianId) {
      toast({
        title: "Error",
        description: "Please select a technician.",
        variant: "destructive",
      })
      return
    }

    // Validate cost range if provided
    if (costMin && costMax && parseFloat(costMin) > parseFloat(costMax)) {
      toast({
        title: "Error",
        description: "Minimum cost cannot be greater than maximum cost.",
        variant: "destructive",
      })
      return
    }

    const selectedTechnician = technicianOptions.find((t) => t.value === technicianId)
    if (!selectedTechnician) {
      toast({
        title: "Error",
        description: "Please select a valid technician.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const costRange =
        costMin && costMax
          ? { min: parseFloat(costMin), max: parseFloat(costMax) }
          : undefined

      if (onAssign) {
        await onAssign(request.id, {
          technicianId,
          technicianName: selectedTechnician.name,
          dueDate: dueDate || undefined,
          costRange,
          notes,
        })
      }

      toast({
        title: "Technician Assigned",
        description: `The maintenance request has been assigned to ${selectedTechnician.name}.`,
      })

      onOpenChange(false)
      setDueDate("")
      setCostMin("")
      setCostMax("")
      setNotes("")
    } catch (error: any) {
      console.error("Error assigning technician:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to assign technician. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      setDueDate("")
      setCostMin("")
      setCostMax("")
      setNotes("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>
            Assign a technician to: {request?.title || "Maintenance Request"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="technician">Technician *</Label>
            <Select value={technicianId} onValueChange={setTechnicianId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a technician" />
              </SelectTrigger>
              <SelectContent>
                {technicianOptions.map((tech) => (
                  <SelectItem key={tech.value} value={tech.value}>
                    {tech.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Set a target completion date for this assignment
            </p>
          </div>

          <div>
            <Label htmlFor="costRange">Approximate Cost Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  id="costMin"
                  type="number"
                  placeholder="Min ($)"
                  value={costMin}
                  onChange={(e) => setCostMin(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <Input
                  id="costMax"
                  type="number"
                  placeholder="Max ($)"
                  value={costMax}
                  onChange={(e) => setCostMax(e.target.value)}
                  min={costMin || "0"}
                  step="0.01"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated cost range for this maintenance work
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Assignment Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this assignment..."
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !technicianId}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Technician"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

