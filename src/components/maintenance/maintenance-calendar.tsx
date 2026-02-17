import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Calendar, Clock, Wrench, Building } from "lucide-react"
import { format } from "date-fns"

const mockEvents = [
  {
    id: 1,
    title: "HVAC Service - Oak Street",
    date: new Date(2024, 0, 25),
    time: "10:00 AM - 12:00 PM",
    type: "service",
    property: "Oak Street Apartments, Unit 2B",
    priority: "high"
  },
  {
    id: 2,
    title: "Plumbing Repair - Pine View",
    date: new Date(2024, 0, 22),
    time: "2:00 PM - 4:00 PM",
    type: "repair",
    property: "Pine View Complex, Unit 1A",
    priority: "medium"
  }
]

export default function MaintenanceCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Calendar", icon: Calendar }]} />
      </div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-bold">Work Schedule</h1>
            <p className="text-gray-600 dark:text-gray-400">Your assigned maintenance tickets and appointments</p>
          </div>
        </div>
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
                {selectedDateEvents.length} appointment{selectedDateEvents.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-orange-500" />
                          <h4 className="font-medium">{event.title}</h4>
                        </div>
                        <Badge className={getPriorityColor(event.priority)}>
                          {event.priority}
                        </Badge>
                      </div>
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
                  <p className="text-gray-500">No appointments scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

