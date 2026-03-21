import { format, parse } from "date-fns"

/** User-created rows persisted to localStorage */
export interface UserCalendarEventStored {
  id: string
  title: string
  dateKey: string
  startTime: string
  endTime: string
  type: string
  property?: string
  description?: string
}

/** Unified view model for calendar UI (seed demos + user events) */
export interface CalendarEventVM {
  id: string | number
  title: string
  date: Date
  time: string
  type: string
  property?: string
  description?: string
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function dateKeyToLocalDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function formatTimeRangeLabel(startTime: string, endTime: string): string {
  const base = new Date()
  const s = parse(startTime, "HH:mm", base)
  const e = parse(endTime, "HH:mm", base)
  return `${format(s, "h:mm a")} - ${format(e, "h:mm a")}`
}

export function storedToVM(row: UserCalendarEventStored): CalendarEventVM {
  return {
    id: row.id,
    title: row.title,
    date: dateKeyToLocalDate(row.dateKey),
    time: formatTimeRangeLabel(row.startTime, row.endTime),
    type: row.type,
    property: row.property,
    description: row.description,
  }
}

export function seedEventToVM(seed: {
  id: number
  title: string
  date: Date
  time: string
  type: string
  property?: string
  description?: string
}): CalendarEventVM {
  return {
    id: `seed-${seed.id}`,
    title: seed.title,
    date: seed.date,
    time: seed.time,
    type: seed.type,
    property: seed.property,
    description: seed.description,
  }
}

export function uniqueEventDates(events: CalendarEventVM[]): Date[] {
  const byKey = new Map<string, Date>()
  for (const e of events) {
    byKey.set(e.date.toDateString(), e.date)
  }
  return [...byKey.values()]
}
