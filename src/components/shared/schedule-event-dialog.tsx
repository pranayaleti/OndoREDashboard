import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { isBefore, isSameDay, startOfDay, startOfToday } from "date-fns"
import { formatTimeRangeLabel, toDateKey, type UserCalendarEventStored } from "@/lib/calendar-events"
import { buildCalendlyPrefillBookingUrl } from "@/lib/calendly-prefill-url"
import type { ScheduleEventTypeOption } from "@/lib/calendar-schedule-presets"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

function coerceScheduleDate(d: Date | undefined): Date {
  const today = startOfToday()
  if (!d) return today
  const day = startOfDay(d)
  return isBefore(day, today) ? today : day
}

function toDateInputValue(date: Date): string {
  return toDateKey(date)
}

function fromDateInputValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

interface ScheduleEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate: Date | undefined
  onScheduled: (event: UserCalendarEventStored) => void
  title?: string
  typeOptions: ScheduleEventTypeOption[]
  showPropertyField?: boolean
}

export function ScheduleEventDialog({
  open,
  onOpenChange,
  defaultDate,
  onScheduled,
  title = "Schedule event",
  typeOptions,
  showPropertyField = true,
}: ScheduleEventDialogProps) {
  const [openCalendlyAfterSave, setOpenCalendlyAfterSave] = useState(true)

  const allowedTypeValues = useMemo(() => new Set(typeOptions.map((o) => o.value)), [typeOptions])

  const formSchema = useMemo(
    () =>
      z
        .object({
          title: z.string().min(1, "Title is required"),
          type: z.string().min(1),
          date: z.date(),
          startTime: z.string().regex(timePattern, "Use a valid start time"),
          endTime: z.string().regex(timePattern, "Use a valid end time"),
          property: z.string().optional(),
          description: z.string().optional(),
        })
        .refine((data) => allowedTypeValues.has(data.type), {
          message: "Select a type",
          path: ["type"],
        })
        .refine((data) => data.endTime > data.startTime, {
          message: "End time must be after start time",
          path: ["endTime"],
        })
        .refine((data) => !isBefore(startOfDay(data.date), startOfToday()), {
          message: "Choose today or a future date",
          path: ["date"],
        })
        .refine((data) => {
          if (!isSameDay(data.date, new Date())) return true
          const [h, m] = data.startTime.split(":").map(Number)
          const start = new Date(data.date)
          start.setHours(h, m, 0, 0)
          return start >= new Date()
        }, {
          message: "Start time must be in the future today",
          path: ["startTime"],
        }),
    [allowedTypeValues],
  )

  type FormValues = z.infer<typeof formSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: typeOptions[0]?.value ?? "general",
      date: coerceScheduleDate(defaultDate),
      startTime: "09:00",
      endTime: "10:00",
      property: "",
      description: "",
    },
  })

  useEffect(() => {
    if (!open) return
    const base = coerceScheduleDate(defaultDate)
    const now = new Date()
    let startTime = "09:00"
    let endTime = "10:00"
    if (isSameDay(base, now)) {
      const nextStart = new Date(now.getTime() + 15 * 60 * 1000)
      startTime = `${String(nextStart.getHours()).padStart(2, "0")}:${String(nextStart.getMinutes()).padStart(2, "0")}`
      const nextEnd = new Date(nextStart.getTime() + 60 * 60 * 1000)
      endTime = `${String(nextEnd.getHours()).padStart(2, "0")}:${String(nextEnd.getMinutes()).padStart(2, "0")}`
    }

    form.reset({
      title: "",
      type: typeOptions[0]?.value ?? "general",
      date: base,
      startTime,
      endTime,
      property: "",
      description: "",
    })
  }, [open, defaultDate, typeOptions, form])

  function onSubmit(values: FormValues) {
    const row: UserCalendarEventStored = {
      id: crypto.randomUUID(),
      title: values.title.trim(),
      dateKey: toDateKey(values.date),
      startTime: values.startTime,
      endTime: values.endTime,
      type: values.type,
      description: values.description?.trim() || undefined,
      property: showPropertyField ? values.property?.trim() || undefined : undefined,
    }
    onScheduled(row)
    if (openCalendlyAfterSave) {
      const extra = [showPropertyField ? values.property?.trim() : undefined, values.description?.trim()]
        .filter(Boolean)
        .join(" — ")
      const url = buildCalendlyPrefillBookingUrl({
        title: values.title.trim(),
        date: values.date,
        timeSummary: formatTimeRangeLabel(values.startTime, values.endTime),
        extraNote: extra || undefined,
      })
      window.open(url, "_blank", "noopener,noreferrer")
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Events are saved in this browser. Optionally open Calendly after saving to complete a booking and block that
            time on your Calendly availability.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Property viewing — Oak Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={toDateInputValue(startOfToday())}
                      value={toDateInputValue(field.value)}
                      onChange={(event) => field.onChange(fromDateInputValue(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showPropertyField ? (
              <FormField
                control={form.control}
                name="property"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Building or unit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Attendees, access instructions, etc." className="min-h-[80px] resize-y" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start gap-3 rounded-md border border-border/80 bg-muted/40 p-3">
              <Checkbox
                id="calendly-after-save"
                checked={openCalendlyAfterSave}
                onCheckedChange={(v) => setOpenCalendlyAfterSave(v === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="calendly-after-save" className="text-sm font-medium cursor-pointer">
                  Open Calendly after save
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pre-fills your title, opens the right month, and includes time details for the custom question slot
                  (a1) when your Calendly event type supports it. Finish the booking in Calendly to block the slot.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save event</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
