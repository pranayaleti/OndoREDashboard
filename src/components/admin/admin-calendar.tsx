import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Calendar, Plus, Clock } from "lucide-react"
import { format } from "date-fns"
import { ADMIN_CALENDAR_SCHEDULE_TYPES } from "@/lib/calendar-schedule-presets"
import { seedEventToVM, storedToVM, uniqueEventDates, type CalendarEventVM } from "@/lib/calendar-events"
import { usePersistedCalendarEvents } from "@/hooks/use-persisted-calendar-events"
import { ScheduleEventDialog } from "@/components/shared/schedule-event-dialog"

const STORAGE_KEY = "ondo-dashboard:calendar-events:admin"

const seedEvents = [
  {
    id: 1,
    title: "Property Review Meeting",
    date: new Date(2024, 0, 25),
    time: "10:00 AM - 11:00 AM",
    type: "meeting",
    description: "Review pending property approvals",
  },
  {
    id: 2,
    title: "Manager Sync",
    date: new Date(2024, 0, 22),
    time: "2:00 PM - 3:00 PM",
    type: "meeting",
    description: "Weekly sync with property managers",
  },
]

export default function AdminCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const { userEvents, addEvent } = usePersistedCalendarEvents(STORAGE_KEY)

  const allEvents = useMemo((): CalendarEventVM[] => {
    return [...seedEvents.map(seedEventToVM), ...userEvents.map(storedToVM)]
  }, [userEvents])

  const datesWithEvents = useMemo(() => uniqueEventDates(allEvents), [allEvents])

  const getEventsForDate = (date: Date) => {
    return allEvents.filter((event) => event.date.toDateString() === date.toDateString())
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="container mx-auto px-4 py-8">
      <ScheduleEventDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        defaultDate={selectedDate}
        title="New event"
        typeOptions={ADMIN_CALENDAR_SCHEDULE_TYPES}
        showPropertyField={false}
        onScheduled={addEvent}
      />
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Calendar", icon: Calendar }]} />
      </div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-gray-600 dark:text-gray-400">Administrative events and schedules</p>
          </div>
        </div>
        <Button onClick={() => setScheduleOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                {selectedDate && format(selectedDate, "MMMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{ hasEvents: datesWithEvents }}
                modifiersClassNames={{
                  hasEvents:
                    "relative after:absolute after:bottom-1 after:left-1/2 after:z-10 after:-translate-x-1/2 after:rounded-full after:bg-orange-500 after:size-1.5",
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
              </CardTitle>
              <CardDescription>
                {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div key={String(event.id)} className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-2">{event.title}</h4>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.time}
                      </div>
                      {event.description ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No events scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
