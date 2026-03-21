import { useCallback, useEffect, useState } from "react"
import type { UserCalendarEventStored } from "@/lib/calendar-events"

function isStoredRow(x: unknown): x is UserCalendarEventStored {
  if (!x || typeof x !== "object") return false
  const r = x as Record<string, unknown>
  return (
    typeof r.id === "string" &&
    typeof r.title === "string" &&
    typeof r.dateKey === "string" &&
    typeof r.startTime === "string" &&
    typeof r.endTime === "string" &&
    typeof r.type === "string"
  )
}

function loadFromStorage(storageKey: string): UserCalendarEventStored[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStoredRow)
  } catch {
    return []
  }
}

export function usePersistedCalendarEvents(storageKey: string) {
  const [userEvents, setUserEvents] = useState<UserCalendarEventStored[]>(() => loadFromStorage(storageKey))

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(userEvents))
    } catch {
      /* ignore quota / private mode */
    }
  }, [storageKey, userEvents])

  const addEvent = useCallback((row: UserCalendarEventStored) => {
    setUserEvents((prev) => [...prev, row])
  }, [])

  return { userEvents, addEvent }
}
