"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Calendar, Clock } from "lucide-react"
import { useUserTimezone } from "@/hooks/use-user-timezone"
import { US_TIMEZONES } from "@/constants/us"

interface ScheduleServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: {
    id: string
    title: string
    scheduledDate?: string | null
  } | null
  onSchedule?: (
    requestId: string,
    data: {
      scheduledDate: string
      scheduledTime?: string
      timeWindow?: { start: string; end: string }
      timezone?: string
      notes?: string
    }
  ) => Promise<void> | void
}

export function ScheduleServiceDialog({
  open,
  onOpenChange,
  request,
  onSchedule,
}: ScheduleServiceDialogProps) {
  const { toast } = useToast()
  const { displayTimezone } = useUserTimezone()
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [timeWindow, setTimeWindow] = useState("4") // Default to 4 hours
  const [timezone, setTimezone] = useState(displayTimezone.iana || "America/Denver")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (request) {
      if (request.scheduledDate) {
        const date = new Date(request.scheduledDate)
        setScheduledDate(date.toISOString().split("T")[0])
        // Extract time if available
        const timeStr = date.toTimeString().slice(0, 5)
        setScheduledTime(timeStr || "09:00")
      } else {
        // Default to tomorrow at 9 AM
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setScheduledDate(tomorrow.toISOString().split("T")[0])
        setScheduledTime("09:00")
      }
      setTimezone(displayTimezone.iana || "America/Denver")
      setTimeWindow("4")
      setNotes("")
    }
  }, [request, open, displayTimezone])

  const formatTo12Hour = (time24: string): string => {
    const [hoursStr, minutesStr] = time24.split(":")
    const hours = parseInt(hoursStr, 10)
    const minutes = minutesStr || "00"
    
    if (hours === 0) {
      return `12:${minutes} AM`
    } else if (hours < 12) {
      return `${hours}:${minutes} AM`
    } else if (hours === 12) {
      return `12:${minutes} PM`
    } else {
      return `${hours - 12}:${minutes} PM`
    }
  }

  const calculateTimeWindow = (startTime: string, hours: number): { start: string; end: string; start12: string; end12: string } => {
    const [hoursStr, minutesStr] = startTime.split(":")
    const startHour = parseInt(hoursStr, 10)
    const startMinute = parseInt(minutesStr || "0", 10)
    
    const endHour = (startHour + hours) % 24
    const endMinute = startMinute
    
    const start24 = `${hoursStr.padStart(2, "0")}:${minutesStr || "00"}`
    const end24 = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`
    
    return {
      start: start24,
      end: end24,
      start12: formatTo12Hour(start24),
      end12: formatTo12Hour(end24),
    }
  }

  const handleSubmit = async () => {
    if (!request || !scheduledDate) {
      toast({
        title: "Error",
        description: "Please select a date for the service.",
        variant: "destructive",
      })
      return
    }

    if (scheduledTime && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(scheduledTime)) {
      toast({
        title: "Error",
        description: "Please enter a valid time format (HH:MM).",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const windowHours = parseInt(timeWindow, 10)
      const timeWindowData = scheduledTime
        ? calculateTimeWindow(scheduledTime, windowHours)
        : undefined

      if (onSchedule) {
        await onSchedule(request.id, {
          scheduledDate,
          scheduledTime: scheduledTime || undefined,
          timeWindow: timeWindowData,
          timezone,
          notes,
        })
      }

      const dateStr = new Date(scheduledDate).toLocaleDateString()
      let timeStr = ""
      if (scheduledTime) {
        const window = calculateTimeWindow(scheduledTime, windowHours)
        const tzLabel = US_TIMEZONES.find((tz) => tz.value === timezone)?.label || timezone
        timeStr = ` at ${window.start12} - ${window.end12} (${timeWindow}hr window, ${tzLabel})`
      }
      
      toast({
        title: "Service Scheduled",
        description: `The maintenance service has been scheduled for ${dateStr}${timeStr}.`,
      })

      onOpenChange(false)
      setNotes("")
    } catch (error: unknown) {
      console.error("Error scheduling service:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Failed to schedule service. Please try again.",
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

  const getTimezoneLabel = (tzValue: string) => {
    return US_TIMEZONES.find((tz) => tz.value === tzValue)?.label || tzValue
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Service</DialogTitle>
          <DialogDescription>
            Schedule a service appointment for: {request?.title || "Maintenance Request"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="date">Service Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full cursor-pointer"
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="time">Start Time (Optional)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="timeWindow">Time Window</Label>
              <Select value={timeWindow} onValueChange={setTimeWindow}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {scheduledTime && (
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Service Window:</span>{" "}
                {(() => {
                  const window = calculateTimeWindow(scheduledTime, parseInt(timeWindow, 10))
                  return `${window.start12} - ${window.end12}`
                })()}{" "}
                ({timeWindow} hour window)
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="timezone">Timezone *</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder={getTimezoneLabel(timezone)} />
              </SelectTrigger>
              <SelectContent className="z-[110]">
                {US_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Current timezone: {getTimezoneLabel(timezone)}
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Schedule Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the scheduled service..."
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !scheduledDate}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule Service"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

