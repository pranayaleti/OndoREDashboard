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
import { MessageSquare, Send, Search, Plus, Reply, User, Shield, Users, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { companyInfo } from "@/constants/companyInfo"

// Helper function to generate email addresses based on company domain
const getEmail = (prefix: string) => `${prefix}@${companyInfo.social.twitterDomain}`

// Mock messages data for super admin
const mockSuperAdminMessages = [
  {
    id: 1,
    subject: "System Maintenance Scheduled",
    from: "System Administrator",
    fromEmail: getEmail("system"),
    fromRole: "system",
    date: "2024-01-20",
    time: "2:30 PM",
    content: "A scheduled system maintenance window has been planned for this weekend. All services will be unavailable from Saturday 2 AM to 4 AM EST.",
    isRead: false,
    category: "system",
    priority: "high"
  },
  {
    id: 2,
    subject: "New Admin Account Request",
    from: "John Manager",
    fromEmail: getEmail("john.manager"),
    fromRole: "manager",
    date: "2024-01-18",
    time: "10:15 AM",
    content: "I would like to request admin access for Sarah Johnson to help manage the property portfolio. She has been with the company for 3 years.",
    isRead: false,
    category: "admin",
    priority: "high"
  },
  {
    id: 3,
    subject: "Security Alert - Multiple Failed Login Attempts",
    from: "Security System",
    fromEmail: getEmail("security"),
    fromRole: "system",
    date: "2024-01-15",
    time: "4:45 PM",
    content: "We detected multiple failed login attempts from IP address 192.168.1.100. The account has been temporarily locked for security.",
    isRead: true,
    category: "security",
    priority: "high"
  },
  {
    id: 4,
    subject: "Monthly System Report",
    from: "Analytics Team",
    fromEmail: getEmail("analytics"),
    fromRole: "system",
    date: "2024-01-12",
    time: "11:20 AM",
    content: "Monthly system performance report is ready. All systems are operating normally. User activity has increased by 15% this month.",
    isRead: true,
    category: "report",
    priority: "medium"
  }
]

function MessagesList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("all")

  const filteredMessages = mockSuperAdminMessages.filter(message => {
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
      case "system":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "security":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "report":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "system":
        return <Shield className="h-4 w-4" />
      case "manager":
        return <Users className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[{ label: "Messages", icon: MessageSquare }]} />
      </div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">Messages</h1>
            <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400">System-wide communications and alerts</p>
          </div>
        </div>
        <Link to="/super-admin/messages/compose">
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
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
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
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                } ${!message.isRead ? "border-l-4 border-l-purple-500" : ""}`}
                onClick={() => setSelectedMessage(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs lg:text-sm">
                          {getRoleIcon(message.fromRole)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm lg:text-base font-medium">{message.from}</span>
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 capitalize">{message.fromRole}</p>
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
                      {mockSuperAdminMessages.find(m => m.id === selectedMessage)?.subject}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(mockSuperAdminMessages.find(m => m.id === selectedMessage)?.fromRole || "")}
                        <span>From: {mockSuperAdminMessages.find(m => m.id === selectedMessage)?.from}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{mockSuperAdminMessages.find(m => m.id === selectedMessage)?.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 mb-6">
                    {mockSuperAdminMessages.find(m => m.id === selectedMessage)?.content}
                  </div>
                </div>

                {/* Sender Info Card */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-3">Sender Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium">{mockSuperAdminMessages.find(m => m.id === selectedMessage)?.from}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{mockSuperAdminMessages.find(m => m.id === selectedMessage)?.fromEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Role:</span>
                      <p className="font-medium capitalize">{mockSuperAdminMessages.find(m => m.id === selectedMessage)?.fromRole}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium">{mockSuperAdminMessages.find(m => m.id === selectedMessage)?.date}</p>
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
    toRole: "admin",
    subject: "",
    category: "system",
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
          { label: "Messages", href: "/super-admin/messages", icon: MessageSquare },
          { label: "Compose", icon: Plus }
        ]} />
      </div>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
            <CardDescription>Send a system-wide message or alert</CardDescription>
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
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="manager">Managers</SelectItem>
                    <SelectItem value="owner">Owners</SelectItem>
                    <SelectItem value="all">All Users</SelectItem>
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
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
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
              <Link to="/super-admin/messages">
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

export default function SuperAdminMessages() {
  return (
    <Routes>
      <Route path="/" element={<MessagesList />} />
      <Route path="/compose" element={<ComposeMessage />} />
    </Routes>
  )
}

