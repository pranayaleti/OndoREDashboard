"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MessageSquare, Paperclip, Send, User, Home, Phone, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock data for a maintenance request
const MOCK_REQUEST = {
  id: "req-001",
  title: "Leaking Kitchen Faucet",
  property: "123 Main St, Apt 4B",
  tenant: {
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "555-123-4567",
    avatar: `${import.meta.env.BASE_URL}placeholder.svg?key=1g942`,
  },
  dateSubmitted: "2023-05-10",
  status: "in-progress",
  priority: "medium",
  category: "plumbing",
  lastUpdated: "2023-05-12",
  scheduledDate: "2023-05-15",
  scheduledTime: "13:00-15:00",
  assignedVendor: "Quick Fix Plumbing",
  description:
    "The kitchen faucet has been leaking steadily for the past two days. I've tried tightening it but the leak continues. Water is pooling under the sink and I'm concerned about water damage.",
  photos: ["/leaking-faucet.png", `${import.meta.env.BASE_URL}placeholder.svg?key=4lraf`],
  updates: [
    {
      id: "upd-001",
      date: "2023-05-10",
      time: "14:30",
      type: "status-change",
      content: "Maintenance request submitted",
      user: "system",
    },
    {
      id: "upd-002",
      date: "2023-05-11",
      time: "09:15",
      type: "message",
      content:
        "Thank you for your maintenance request. We've assigned a plumber to look at your issue. They will visit on May 15th between 1-3pm. Please let us know if this time works for you.",
      user: "Property Manager",
      avatar: "/property-manager-meeting.png",
    },
    {
      id: "upd-003",
      date: "2023-05-11",
      time: "10:30",
      type: "message",
      content: "That time works for me. Thank you for the quick response!",
      user: "Tenant",
      avatar: `${import.meta.env.BASE_URL}placeholder.svg?key=9xqre`,
    },
    {
      id: "upd-004",
      date: "2023-05-12",
      time: "11:45",
      type: "status-change",
      content: "Status updated to 'In Progress'",
      user: "system",
    },
  ],
}

export function OwnerMaintenanceDetail() {
  const { toast } = useToast()
  const [request, setRequest] = useState(MOCK_REQUEST)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [status, setStatus] = useState(request.status)
  const [scheduledDate, setScheduledDate] = useState(request.scheduledDate)
  const [scheduledTime, setScheduledTime] = useState(request.scheduledTime)
  const [assignedVendor, setAssignedVendor] = useState(request.assignedVendor)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending Review
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            In Progress
          </Badge>
        )
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Scheduled
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "emergency":
        return <Badge className="bg-red-500">Emergency</Badge>
      case "high":
        return <Badge className="bg-orange-500">High</Badge>
      case "medium":
        return <Badge className="bg-blue-500">Medium</Badge>
      case "low":
        return <Badge className="bg-muted">Low</Badge>
      default:
        return <Badge className="bg-muted">Unknown</Badge>
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    setIsSending(true)

    // Simulate sending message
    setTimeout(() => {
      setIsSending(false)
      setNewMessage("")
      toast({
        title: "Message sent",
        description: "Your message has been sent to the tenant.",
      })
    }, 1000)
  }

  const handleUpdateRequest = () => {
    setIsUpdating(true)

    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false)
      setRequest((prev) => ({
        ...prev,
        status,
        scheduledDate,
        scheduledTime,
        assignedVendor,
        lastUpdated: new Date().toISOString().split("T")[0],
      }))
      toast({
        title: "Request updated",
        description: "The maintenance request has been updated successfully.",
      })
    }, 1500)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center">
        <Link to="/owner/maintenance" className="mr-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Maintenance Request Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md">
            <CardHeader className="bg-muted/50">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                  <CardTitle>{request.title}</CardTitle>
                  <CardDescription>
                    Request #{request.id} • Submitted on {request.dateSubmitted}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(request.status)}
                  {getPriorityBadge(request.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-700">{request.description}</p>
              </div>

              {request.photos.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Photos</h3>
                  <div className="flex flex-wrap gap-4">
                    {request.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo || `${import.meta.env.BASE_URL}placeholder.svg`}
                        alt={`Issue photo ${index + 1}`}
                        className="w-32 h-32 object-cover rounded-md border hover:opacity-90 transition-opacity cursor-pointer"
                        onClick={() => window.open(photo, "_blank")}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Property Details</h3>
                <div className="flex items-center text-gray-700 mb-2">
                  <Home className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{request.property}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{request.tenant.name}</span>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center mb-4">
                  <MessageSquare className="h-5 w-5 mr-2 text-gray-500" />
                  <h3 className="font-medium">Communication & Updates</h3>
                </div>

                <div className="space-y-4">
                  {request.updates.map((update) => (
                    <div
                      key={update.id}
                      className={`p-3 rounded-lg ${
                        update.type === "status-change"
                          ? "bg-muted text-center text-sm text-gray-600"
                          : update.user === "Tenant"
                            ? "bg-muted ml-0 sm:ml-12"
                            : "bg-blue-50 mr-0 sm:mr-12"
                      }`}
                    >
                      {update.type === "status-change" ? (
                        <div>{update.content}</div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={update.avatar || `${import.meta.env.BASE_URL}placeholder.svg`} alt={update.user} />
                                <AvatarFallback>{update.user.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{update.user}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {update.date} at {update.time}
                            </span>
                          </div>
                          <p>{update.content}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="flex items-center mb-2">
                    <h4 className="text-sm font-medium">Add a message</h4>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-2">
                      <Button size="icon" variant="outline" type="button" title="Attach file">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        type="button"
                        disabled={!newMessage.trim() || isSending}
                        onClick={handleSendMessage}
                        title="Send message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader className="bg-muted/50">
              <CardTitle>Tenant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span>{request.tenant.name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                <span>{request.tenant.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                <span>{request.tenant.phone}</span>
              </div>
              <Button variant="outline" className="w-full">
                Contact Tenant
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-muted/50">
              <CardTitle>Manage Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor">Assigned Vendor</Label>
                <Select value={assignedVendor} onValueChange={setAssignedVendor}>
                  <SelectTrigger id="vendor">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quick Fix Plumbing">Quick Fix Plumbing</SelectItem>
                    <SelectItem value="Elite Electric">Elite Electric</SelectItem>
                    <SelectItem value="Cool Air HVAC">Cool Air HVAC</SelectItem>
                    <SelectItem value="Handy Services">Handy Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Scheduled Date</Label>
                <Input id="date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time Slot</Label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00-10:00">8:00 AM - 10:00 AM</SelectItem>
                    <SelectItem value="10:00-12:00">10:00 AM - 12:00 PM</SelectItem>
                    <SelectItem value="13:00-15:00">1:00 PM - 3:00 PM</SelectItem>
                    <SelectItem value="15:00-17:00">3:00 PM - 5:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-6 pt-2">
              <Button className="w-full" onClick={handleUpdateRequest} disabled={isUpdating}>
                {isUpdating ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating...
                  </div>
                ) : (
                  "Update Request"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
