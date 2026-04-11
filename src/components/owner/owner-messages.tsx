import { useState } from "react"
import { Routes, Route, Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { MessageSquare, Send, Search, Plus, Reply, User, Building, Calendar, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock messages data for owner
const mockOwnerMessages = [
  {
    id: 1,
    subject: "Rent Payment Question",
    from: "John Smith",
    fromEmail: "john.smith@email.com",
    property: "Oak Street Apartments",
    unit: "2B",
    date: "2024-01-20",
    time: "2:30 PM",
    content: "Hi Mr. Doe, I wanted to ask about setting up automatic rent payments. Could you help me understand the process?",
    isRead: false,
    category: "payment",
    priority: "medium"
  },
  {
    id: 2,
    subject: "Lease Renewal Discussion",
    from: "Sarah Johnson",
    fromEmail: "sarah.j@email.com",
    property: "Pine View Complex",
    unit: "1A",
    date: "2024-01-18",
    time: "10:15 AM",
    content: "Dear Property Owner, I'm very happy living here and would like to discuss renewing my lease for another year. Are you open to negotiations on the terms?",
    isRead: true,
    category: "lease",
    priority: "high"
  },
  {
    id: 3,
    subject: "Thank You for Quick Response",
    from: "Mike Davis",
    fromEmail: "mike.davis@email.com",
    property: "Maple Heights",
    unit: "3C",
    date: "2024-01-15",
    time: "4:45 PM",
    content: "Thank you for addressing the heating issue so quickly. The property management team was very responsive and professional.",
    isRead: true,
    category: "maintenance",
    priority: "low"
  },
  {
    id: 4,
    subject: "Property Appreciation Inquiry",
    from: "Lisa Brown",
    fromEmail: "lisa.brown@email.com",
    property: "Oak Street Apartments",
    unit: "1C",
    date: "2024-01-12",
    time: "11:20 AM",
    content: "Hi, I've been a great tenant for 2 years. With property values rising, I wanted to discuss if there are any upgrade plans for the building that might affect rent.",
    isRead: true,
    category: "general",
    priority: "medium"
  }
]

function MessagesList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("all")

  const filteredMessages = mockOwnerMessages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || message.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "lease":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "payment":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Messages", icon: MessageSquare }]} />
      </div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-400" />
        <div>
            <h1 className="text-3xl lg:text-4xl font-bold">Messages</h1>
          <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400">Direct communication with your tenants</p>
          </div>
        </div>
        <Link to="/owner/messages/compose">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="lease">Lease</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages */}
          <div className="space-y-2">
            {filteredMessages.map((message) => (
              <Card 
                key={message.id} 
                className={`cursor-pointer transition-colors ${
                  selectedMessage === message.id 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "hover:bg-muted dark:hover:bg-card"
                } ${!message.isRead ? "border-l-4 border-l-blue-500" : ""}`}
                onClick={() => setSelectedMessage(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs lg:text-sm">
                          {message.from.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm lg:text-base font-medium">{message.from}</span>
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{message.property} - {message.unit}</p>
                      </div>
                    </div>
                    <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{message.time}</span>
                  </div>
                  <h3 className={`text-base lg:text-lg font-medium mb-1 ${!message.isRead ? "font-bold" : ""}`}>
                    {message.subject}
                  </h3>
                  <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                    {message.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Badge className={getCategoryColor(message.category)} variant="outline">
                        {message.category}
                      </Badge>
                      <Badge className={getPriorityColor(message.priority)} variant="outline">
                        {message.priority}
                      </Badge>
                    </div>
                    <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">{message.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {mockOwnerMessages.find(m => m.id === selectedMessage)?.subject}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>From: {mockOwnerMessages.find(m => m.id === selectedMessage)?.from}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>{mockOwnerMessages.find(m => m.id === selectedMessage)?.property}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{mockOwnerMessages.find(m => m.id === selectedMessage)?.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 mb-6">
                    {mockOwnerMessages.find(m => m.id === selectedMessage)?.content}
                  </div>
                </div>

                {/* Tenant Info Card */}
                <div className="mt-6 p-4 bg-muted dark:bg-card rounded-lg">
                  <h4 className="font-medium mb-3">Tenant Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium">{mockOwnerMessages.find(m => m.id === selectedMessage)?.from}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{mockOwnerMessages.find(m => m.id === selectedMessage)?.fromEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Property:</span>
                      <p className="font-medium">{mockOwnerMessages.find(m => m.id === selectedMessage)?.property}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Unit:</span>
                      <p className="font-medium">{mockOwnerMessages.find(m => m.id === selectedMessage)?.unit}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Reply */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3">Quick Reply</h4>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Type your reply..."
                      rows={4}
                    />
                    <div className="flex justify-between">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Template</Button>
                        <Button variant="outline" size="sm">Forward to Admin</Button>
                      </div>
                      <Button>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg lg:text-xl font-medium text-gray-900 dark:text-white mb-2">
                  Select a message
                </h3>
                <p className="text-base lg:text-lg text-gray-500 dark:text-gray-400">
                  Choose a message from the list to view and respond
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ComposeMessage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    to: "",
    subject: "",
    category: "general",
    priority: "medium",
    content: ""
  })

  const handleSend = () => {
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the tenant.",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Messages", href: "/owner/messages", icon: MessageSquare },
          { label: "Compose", icon: Plus }
        ]} />
      </div>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Compose Message to Tenant</CardTitle>
            <CardDescription>Send a direct message to one of your tenants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="to">To (Tenant)</Label>
                <Select value={formData.to} onValueChange={(value) => setFormData(prev => ({ ...prev, to: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john.smith@email.com">John Smith - Oak Street Apt 2B</SelectItem>
                    <SelectItem value="sarah.j@email.com">Sarah Johnson - Pine View 1A</SelectItem>
                    <SelectItem value="mike.davis@email.com">Mike Davis - Maple Heights 3C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Communication</SelectItem>
                    <SelectItem value="lease">Lease Related</SelectItem>
                    <SelectItem value="payment">Payment/Rent</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Property Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter message subject"
              />
            </div>

            <div>
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Type your message here..."
                rows={8}
              />
            </div>

            <div className="flex justify-between">
              <Link to="/owner/messages">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OwnerMessages() {
  return (
    <Routes>
      <Route path="/" element={<MessagesList />} />
      <Route path="/compose" element={<ComposeMessage />} />
    </Routes>
  )
}
