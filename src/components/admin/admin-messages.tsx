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
import { MessageSquare, Send, Search, Plus, Reply, User, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { companyInfo } from "@/constants/companyInfo"

// Helper function to generate email addresses based on company domain
const getEmail = (prefix: string) => `${prefix}@${companyInfo.social.twitterDomain}`

// Mock messages data for admin
const mockAdminMessages = [
  {
    id: 1,
    subject: "Property Approval Request",
    from: "Manager Team",
    fromEmail: getEmail("manager"),
    fromRole: "manager",
    date: "2024-01-20",
    time: "2:30 PM",
    content: "We have a new property submission that requires admin approval. The property details have been reviewed and meet all requirements.",
    isRead: false,
    category: "property",
    priority: "high"
  },
  {
    id: 2,
    subject: "User Management Update",
    from: "Super Admin",
    fromEmail: getEmail("superadmin"),
    fromRole: "super_admin",
    date: "2024-01-18",
    time: "10:15 AM",
    content: "Please review the new user management policies. There have been updates to the invitation system that affect admin workflows.",
    isRead: false,
    category: "admin",
    priority: "medium"
  },
  {
    id: 3,
    subject: "Monthly Report Ready",
    from: "System",
    fromEmail: getEmail("system"),
    fromRole: "system",
    date: "2024-01-15",
    time: "4:45 PM",
    content: "Your monthly administrative report is ready for review. It includes user activity, property approvals, and system usage statistics.",
    isRead: true,
    category: "report",
    priority: "low"
  }
]

function MessagesList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("all")

  const filteredMessages = mockAdminMessages.filter(message => {
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
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "property":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "report":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
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
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-gray-600 dark:text-gray-400">Administrative communications</p>
          </div>
        </div>
        <Link to="/admin/messages/compose">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
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
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filteredMessages.map((message) => (
              <Card 
                key={message.id} 
                className={`cursor-pointer transition-colors ${
                  selectedMessage === message.id 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                } ${!message.isRead ? "border-l-4 border-l-blue-500" : ""}`}
                onClick={() => setSelectedMessage(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {message.from.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium">{message.from}</span>
                        <p className="text-xs text-gray-500 capitalize">{message.fromRole}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                  <h3 className={`font-medium mb-1 ${!message.isRead ? "font-bold" : ""}`}>
                    {message.subject}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
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
                    <span className="text-xs text-gray-500">{message.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {mockAdminMessages.find(m => m.id === selectedMessage)?.subject}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>From: {mockAdminMessages.find(m => m.id === selectedMessage)?.from}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{mockAdminMessages.find(m => m.id === selectedMessage)?.date}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 mb-6">
                    {mockAdminMessages.find(m => m.id === selectedMessage)?.content}
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3">Quick Reply</h4>
                  <div className="space-y-4">
                    <Textarea placeholder="Type your reply..." rows={4} />
                    <div className="flex justify-end">
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
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a message
                </h3>
                <p className="text-gray-500">
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
    toRole: "manager",
    subject: "",
    category: "property",
    priority: "medium",
    content: ""
  })

  const handleSend = () => {
    toast({
      title: "Message Sent",
      description: "Your message has been sent successfully.",
      duration: 3000,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Messages", href: "/admin/messages", icon: MessageSquare },
          { label: "Compose", icon: Plus }
        ]} />
      </div>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
            <CardDescription>Send a message to managers or other admins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="toRole">Recipient Role</Label>
                <Select value={formData.toRole} onValueChange={(value) => setFormData(prev => ({ ...prev, toRole: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Managers</SelectItem>
                    <SelectItem value="owner">Owners</SelectItem>
                    <SelectItem value="tenant">Tenants</SelectItem>
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
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
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
              <Link to="/admin/messages">
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

export default function AdminMessages() {
  return (
    <Routes>
      <Route path="/" element={<MessagesList />} />
      <Route path="/compose" element={<ComposeMessage />} />
    </Routes>
  )
}

