import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Send, Search, Plus, Reply, Archive, Star, Paperclip, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { companyInfo } from "@/constants/companyInfo"

// Email addresses based on company domain
const getEmail = (prefix: string) => `${prefix}@${companyInfo.social.twitterDomain}`

// Mock messages data
const mockMessages = [
  {
    id: 1,
    subject: "Lease Renewal Notice",
    from: "Property Manager",
    fromEmail: getEmail("manager"),
    to: "tenant@email.com",
    date: "2024-01-20",
    time: "10:30 AM",
    content: "Dear Tenant,\n\nWe hope you're enjoying your stay at 123 Oak Street. Your current lease is set to expire on December 31, 2024.\n\nWe would like to offer you a lease renewal with the following terms:\n- New lease term: 12 months\n- Monthly rent: $1,900 (increase of $50)\n- Lease start date: January 1, 2025\n\nPlease let us know your decision by February 15, 2024.\n\nBest regards,\nProperty Management Team",
    isRead: false,
    isStarred: false,
    category: "lease",
    priority: "high",
    attachments: ["lease_renewal_terms.pdf"]
  },
  {
    id: 2,
    subject: "Scheduled Maintenance - HVAC Inspection",
    from: "Maintenance Team",
    fromEmail: getEmail("maintenance"),
    to: "tenant@email.com",
    date: "2024-01-18",
    time: "2:15 PM",
    content: "Hello,\n\nThis is to inform you that we have scheduled a routine HVAC inspection for your unit.\n\nDate: January 25, 2024\nTime: 10:00 AM - 12:00 PM\nTechnician: Mike Johnson\n\nPlease ensure someone is available to provide access to the unit. If this time doesn't work for you, please contact us to reschedule.\n\nThank you for your cooperation.\n\nMaintenance Team",
    isRead: true,
    isStarred: true,
    category: "maintenance",
    priority: "medium",
    attachments: []
  },
  {
    id: 3,
    subject: "Welcome to Your New Home!",
    from: "Property Manager",
    fromEmail: getEmail("manager"),
    to: "tenant@email.com",
    date: "2023-09-15",
    time: "9:00 AM",
    content: "Welcome to 123 Oak Street!\n\nWe're excited to have you as our new tenant. Here are some important details:\n\n- Your move-in date is confirmed for September 16, 2023\n- Keys will be available at the leasing office from 9 AM\n- Please complete the move-in inspection within 48 hours\n- Emergency contact: (555) 123-4567\n\nIf you have any questions, don't hesitate to reach out.\n\nWelcome home!\nProperty Management Team",
    isRead: true,
    isStarred: false,
    category: "general",
    priority: "medium",
    attachments: ["welcome_packet.pdf", "emergency_contacts.pdf"]
  },
  {
    id: 4,
    subject: "Rent Payment Confirmation",
    from: "Billing Department",
    fromEmail: getEmail("billing"),
    to: "tenant@email.com",
    date: "2024-01-01",
    time: "11:45 AM",
    content: "Dear Tenant,\n\nThis confirms that we have received your rent payment for January 2024.\n\nPayment Details:\n- Amount: $1,850.00\n- Payment Method: Credit Card ending in 4242\n- Transaction ID: PAY-2024-001\n- Date Processed: January 1, 2024\n\nThank you for your prompt payment.\n\nBilling Department",
    isRead: true,
    isStarred: false,
    category: "billing",
    priority: "low",
    attachments: ["receipt_jan_2024.pdf"]
  }
]

export default function TenantMessages() {
  const { toast } = useToast()
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showCompose, setShowCompose] = useState(false)
  const [composeForm, setComposeForm] = useState({
    to: getEmail("manager"),
    subject: "",
    category: "general",
    priority: "medium",
    content: ""
  })

  const filteredMessages = mockMessages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.from.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || message.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleSendMessage = () => {
    toast({
      title: "Message Sent",
      description: "Your message has been sent successfully.",
      duration: 3000,
    })
    setShowCompose(false)
    setComposeForm({
      to: getEmail("manager"),
      subject: "",
      category: "general",
      priority: "medium",
      content: ""
    })
  }

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
      case "lease":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "billing":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (showCompose) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Compose Message</CardTitle>
                  <CardDescription>Send a message to your property management team</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowCompose(false)}>
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="to">To</Label>
                  <Select value={composeForm.to} onValueChange={(value) => setComposeForm(prev => ({ ...prev, to: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={getEmail("manager")}>Property Manager</SelectItem>
                      <SelectItem value={getEmail("maintenance")}>Maintenance Team</SelectItem>
                      <SelectItem value={getEmail("billing")}>Billing Department</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={composeForm.category} onValueChange={(value) => setComposeForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="lease">Lease Related</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter message subject"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={composeForm.priority} onValueChange={(value) => setComposeForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  value={composeForm.content}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Type your message here..."
                  rows={8}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach Files
                </Button>
                <Button onClick={handleSendMessage}>
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Messages
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Communicate with your property management team
            </p>
          </div>
          <Button onClick={() => setShowCompose(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </div>
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
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="lease">Lease</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
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
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                } ${!message.isRead ? "border-l-4 border-l-blue-500" : ""}`}
                onClick={() => setSelectedMessage(message.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">{message.from}</span>
                      {message.isStarred && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
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

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {mockMessages.find(m => m.id === selectedMessage)?.subject}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <span>From: {mockMessages.find(m => m.id === selectedMessage)?.from}</span>
                      <span>{mockMessages.find(m => m.id === selectedMessage)?.date} at {mockMessages.find(m => m.id === selectedMessage)?.time}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {mockMessages.find(m => m.id === selectedMessage)?.content}
                  </div>
                </div>
                
                {(mockMessages.find(m => m.id === selectedMessage)?.attachments.length ?? 0) > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {mockMessages.find(m => m.id === selectedMessage)?.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{attachment}</span>
                          </div>
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  Choose a message from the list to view its contents
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
