import { useEffect, useState } from "react"
import { calendarApi } from "@/lib/api"
import { apiCalendarEventToVM, toDateKey, type CalendarEventVM } from "@/lib/calendar-events"

/** Scheduled inspections and other API calendar rows for the visible window. */
export function useApiCalendarEvents(): CalendarEventVM[] {
  const [events, setEvents] = useState<CalendarEventVM[]>([])

  useEffect(() => {
    const start = new Date()
    start.setMonth(start.getMonth() - 1)
    const end = new Date()
    end.setMonth(end.getMonth() + 4)
    let cancelled = false
    void calendarApi
      .getEvents(toDateKey(start), toDateKey(end))
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : []
        if (!cancelled) setEvents(list.map(apiCalendarEventToVM))
      })
      .catch(() => {
        if (!cancelled) setEvents([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return events
}
