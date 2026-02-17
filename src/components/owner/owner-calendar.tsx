import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Calendar, Plus, Clock, Building } from "lucide-react"
import { format } from "date-fns"

const mockEvents = [
  {
    id: 1,
    title: "Property Inspection",
    date: new Date(2024, 0, 25),
    time: "10:00 AM - 12:00 PM",
    type: "inspection",
    property: "Oak Street Apartments"
  },
  {
    id: 2,
    title: "Maintenance Appointment",
    date: new Date(2024, 0, 22),
    time: "2:00 PM - 4:00 PM",
    type: "maintenance",
    property: "Pine View Complex"
  }
]

export default function OwnerCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    )
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Calendar", icon: Calendar }]} />
      </div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-green-400" />
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-gray-600 dark:text-gray-400">Property viewings and maintenance schedules</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Event
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
                    <div key={event.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium mb-2">{event.title}</h4>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Building className="h-3 w-3 mr-1" />
                        {event.property}
                      </div>
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

