/** Stable references for schedule dialog — avoids needless form resolver churn */

export interface ScheduleEventTypeOption {
  value: string
  label: string
}

export const MANAGER_CALENDAR_SCHEDULE_TYPES: ScheduleEventTypeOption[] = [
  { value: "viewing", label: "Viewing" },
  { value: "meeting", label: "Meeting" },
  { value: "inspection", label: "Inspection" },
  { value: "maintenance", label: "Maintenance" },
  { value: "general", label: "General" },
]

export const ADMIN_CALENDAR_SCHEDULE_TYPES: ScheduleEventTypeOption[] = [
  { value: "meeting", label: "Meeting" },
  { value: "review", label: "Review" },
  { value: "general", label: "General" },
]

export const OWNER_CALENDAR_SCHEDULE_TYPES: ScheduleEventTypeOption[] = [
  { value: "inspection", label: "Inspection" },
  { value: "maintenance", label: "Maintenance" },
  { value: "meeting", label: "Meeting" },
  { value: "general", label: "General" },
]

export const SUPER_ADMIN_CALENDAR_SCHEDULE_TYPES: ScheduleEventTypeOption[] = [
  { value: "system", label: "System" },
  { value: "meeting", label: "Meeting" },
  { value: "security", label: "Security" },
  { value: "general", label: "General" },
]
