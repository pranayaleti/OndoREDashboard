"use client"

import { Badge } from "@/components/ui/badge"
import { Building, Calendar, Check, Clock, Edit, LogIn, Mail, Phone, Plus, User, UserPlus } from "lucide-react"

// Mock data for user activity
const activities = [
  {
    id: 1,
    type: "login",
    description: "Logged in to the system",
    timestamp: "2023-04-28T09:24:00",
    icon: <LogIn className="h-4 w-4" />,
  },
  {
    id: 2,
    type: "lead",
    description: "Added new lead: Sarah Johnson",
    timestamp: "2023-04-28T10:15:00",
    icon: <UserPlus className="h-4 w-4" />,
  },
  {
    id: 3,
    type: "property",
    description: "Added new property: 456 Park Ave",
    timestamp: "2023-04-28T11:30:00",
    icon: <Building className="h-4 w-4" />,
  },
  {
    id: 4,
    type: "call",
    description: "Made a call to John Smith",
    timestamp: "2023-04-28T13:45:00",
    icon: <Phone className="h-4 w-4" />,
  },
  {
    id: 5,
    type: "email",
    description: "Sent email to Michael Brown",
    timestamp: "2023-04-28T14:20:00",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    id: 6,
    type: "status",
    description: "Updated lead status: Emily Davis to Qualified",
    timestamp: "2023-04-28T15:10:00",
    icon: <Check className="h-4 w-4" />,
  },
  {
    id: 7,
    type: "meeting",
    description: "Scheduled meeting with Robert Wilson",
    timestamp: "2023-04-28T16:05:00",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    id: 8,
    type: "edit",
    description: "Updated property details: 123 Main St",
    timestamp: "2023-04-28T16:45:00",
    icon: <Edit className="h-4 w-4" />,
  },
  {
    id: 9,
    type: "login",
    description: "Logged in to the system",
    timestamp: "2023-04-27T08:30:00",
    icon: <LogIn className="h-4 w-4" />,
  },
  {
    id: 10,
    type: "profile",
    description: "Updated profile information",
    timestamp: "2023-04-27T10:20:00",
    icon: <User className="h-4 w-4" />,
  },
]

const getActivityColor = (type: string) => {
  switch (type) {
    case "login":
      return "bg-blue-500"
    case "lead":
      return "bg-green-500"
    case "property":
      return "bg-purple-500"
    case "call":
      return "bg-yellow-500"
    case "email":
      return "bg-indigo-500"
    case "status":
      return "bg-emerald-500"
    case "meeting":
      return "bg-orange-500"
    case "edit":
      return "bg-pink-500"
    case "profile":
      return "bg-cyan-500"
    default:
      return "bg-muted"
  }
}

export function UserActivity() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Today</h3>
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Last 24 hours
        </Badge>
      </div>

      <div className="space-y-6">
        {activities.slice(0, 8).map((activity) => (
          <div key={activity.id} className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white mt-1`}>{activity.icon}</div>
            <div className="flex-1">
              <p className="font-medium">{activity.description}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(activity.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <h3 className="text-lg font-medium">Yesterday</h3>
      </div>

      <div className="space-y-6">
        {activities.slice(8).map((activity) => (
          <div key={activity.id} className="flex items-start gap-4">
            <div className={`p-2 rounded-full ${getActivityColor(activity.type)} text-white mt-1`}>{activity.icon}</div>
            <div className="flex-1">
              <p className="font-medium">{activity.description}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(activity.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <button className="text-primary hover:underline flex items-center">
          <Plus className="h-4 w-4 mr-1" />
          Load more activity
        </button>
      </div>
    </div>
  )
}
