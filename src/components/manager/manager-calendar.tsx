import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Calendar, Plus, Clock, Building } from "lucide-react"
import { format } from "date-fns"

const mockEvents = [
  {
    id: 1,
    title: "Property Viewing - Oak Street",
    date: new Date(2024, 0, 25),
    time: "2:00 PM - 3:00 PM",
    type: "viewing",
    property: "Oak Street Apartments"
  },
  {
    id: 2,
    title: "Owner Meeting",
    date: new Date(2024, 0, 22),
    time: "10:00 AM - 11:00 AM",
    type: "meeting",
    property: "Portfolio Review"
  },
  {
    id: 3,
    title: "Maintenance Inspection",
    date: new Date(2024, 0, 28),
    time: "9:00 AM - 12:00 PM",
    type: "inspection",
    property: "Pine View Complex"
  }
]

export default function ManagerCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const getEventsForDate = (date: Date) => {
    return mockEvents.filter(event => 
      event.date.toDateString() === date.toDateString()
    )
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "viewing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "meeting":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inspection":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
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
          <Calendar className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-gray-600 dark:text-gray-400">Property viewings and meetings</p>
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
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{event.title}</h4>
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type}
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

