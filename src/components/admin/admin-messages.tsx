import { useState, useEffect } from "react"
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
import { featureApi, type MessageThread, type MessageRecord } from "@/lib/api"
import { DEMO_MESSAGE_RECORDS, DEMO_MESSAGE_THREAD, shouldReplacePlaceholderThread } from "@/lib/seed-data"

function normalizeThreads(threads: MessageThread[]): MessageThread[] {
  if (threads.length === 0) return [DEMO_MESSAGE_THREAD]
  return threads.map((thread) => (shouldReplacePlaceholderThread(thread) ? DEMO_MESSAGE_THREAD : thread))
}

function MessagesList() {
  const { toast } = useToast()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [replyBody, setReplyBody] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Load threads on mount
  useEffect(() => {
    setLoadingThreads(true)
    featureApi.communication
      .listThreads()
      .then((data) => setThreads(normalizeThreads(data)))
      .catch(() => {
        toast({ title: "Error", description: "Failed to load messages.", duration: 3000 })
      })
      .finally(() => setLoadingThreads(false))
  }, [])

  // Load messages when thread selected
  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([])
      setReplyBody("")
      return
    }
    setLoadingMessages(true)
    Promise.all([
      featureApi.communication.listMessages(selectedThreadId),
      featureApi.communication.markRead(selectedThreadId).catch(() => {}),
    ])
      .then(([msgs]) => {
        const currentThread = threads.find((thread) => thread.id === selectedThreadId)
        if (shouldReplacePlaceholderThread(currentThread, msgs)) {
          setMessages(DEMO_MESSAGE_RECORDS)
          setThreads((prev) =>
            prev.map((t) => (t.id === selectedThreadId ? { ...DEMO_MESSAGE_THREAD, unreadCount: 0 } : t))
          )
        } else {
          setMessages(msgs)
          setThreads((prev) =>
            prev.map((t) => (t.id === selectedThreadId ? { ...t, unreadCount: 0 } : t))
          )
        }
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to load messages.", duration: 3000 })
      })
      .finally(() => setLoadingMessages(false))
  }, [selectedThreadId])

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null

  const filteredThreads = threads.filter((thread) => {
    const matchesSearch =
      thread.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || thread.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  useEffect(() => {
    if (selectedThreadId || filteredThreads.length === 0) return
    setSelectedThreadId(filteredThreads[0].id)
  }, [filteredThreads, selectedThreadId])

  const handleReply = async () => {
    if (!selectedThreadId || !replyBody.trim()) return
    if (selectedThreadId === DEMO_MESSAGE_THREAD.id) {
      const demoReply: MessageRecord = {
        id: `demo-reply-${Date.now()}`,
        threadId: DEMO_MESSAGE_THREAD.id,
        senderId: "admin-demo",
        body: replyBody,
        mentions: [],
        channel: "portal",
        sentAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, demoReply])
      setReplyBody("")
      toast({ title: "Message Sent", description: "Your reply has been sent.", duration: 3000 })
      return
    }
    setSending(true)
    try {
      const msg = await featureApi.communication.sendMessage({
        threadId: selectedThreadId,
        body: replyBody,
      })
      setMessages((prev) => [...prev, msg])
      setReplyBody("")
      toast({ title: "Message Sent", description: "Your reply has been sent.", duration: 3000 })
    } catch {
      toast({ title: "Error", description: "Failed to send reply.", duration: 3000 })
    } finally {
      setSending(false)
    }
  }

  const handleUpdateStatus = async (status: MessageThread["status"]) => {
    if (!selectedThreadId) return
    try {
      const updated = await featureApi.communication.updateThread(selectedThreadId, { status })
      setThreads((prev) => prev.map((t) => (t.id === selectedThreadId ? updated : t)))
      toast({ title: "Updated", description: `Thread status set to ${status}.`, duration: 3000 })
    } catch {
      toast({ title: "Error", description: "Failed to update status.", duration: 3000 })
    }
  }

  const handleUpdatePriority = async (priority: MessageThread["priority"]) => {
    if (!selectedThreadId) return
    try {
      const updated = await featureApi.communication.updateThread(selectedThreadId, { priority })
      setThreads((prev) => prev.map((t) => (t.id === selectedThreadId ? updated : t)))
      toast({ title: "Updated", description: `Thread priority set to ${priority}.`, duration: 3000 })
    } catch {
      toast({ title: "Error", description: "Failed to update priority.", duration: 3000 })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "normal":
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
      case "general":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatDate = (iso?: string) => {
    if (!iso) return ""
    return new Date(iso).toLocaleDateString()
  }

  const formatTime = (iso?: string) => {
    if (!iso) return ""
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getInitials = (id: string) => id.slice(0, 2).toUpperCase()

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
            <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400">Administrative communications</p>
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
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="lease">Lease</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {loadingThreads && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Loading messages...</p>
            )}
            {!loadingThreads && filteredThreads.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No messages found.</p>
            )}
            {filteredThreads.map((thread) => (
              <Card
                key={thread.id}
                className={`cursor-pointer transition-colors ${
                  selectedThreadId === thread.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                } ${thread.unreadCount > 0 ? "border-l-4 border-l-blue-500" : ""}`}
                onClick={() => setSelectedThreadId(thread.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs lg:text-sm">
                          {getInitials(thread.createdBy)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm lg:text-base font-medium">{thread.createdBy}</span>
                        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 capitalize">{thread.status}</p>
                      </div>
                    </div>
                    <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(thread.lastMessageAt)}
                    </span>
                  </div>
                  <h3 className={`text-base lg:text-lg font-medium mb-1 ${thread.unreadCount > 0 ? "font-bold" : ""}`}>
                    {thread.subject}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Badge className={getCategoryColor(thread.category)} variant="outline">
                        {thread.category}
                      </Badge>
                      <Badge className={getPriorityColor(thread.priority)} variant="outline">
                        {thread.priority}
                      </Badge>
                      {thread.unreadCount > 0 && (
                        <Badge className="bg-blue-500 text-white text-xs">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(thread.lastMessageAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedThread ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedThread.subject}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>From: {selectedThread.createdBy}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(selectedThread.lastMessageAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setReplyBody("")}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>

                {/* Admin controls: status and priority */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500 whitespace-nowrap">Status:</Label>
                    <Select
                      value={selectedThread.status}
                      onValueChange={(v) => handleUpdateStatus(v as MessageThread["status"])}
                    >
                      <SelectTrigger className="h-8 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-gray-500 whitespace-nowrap">Priority:</Label>
                    <Select
                      value={selectedThread.priority}
                      onValueChange={(v) => handleUpdatePriority(v as MessageThread["priority"])}
                    >
                      <SelectTrigger className="h-8 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingMessages ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Loading messages...</p>
                ) : (
                  <div className="space-y-4 mb-6">
                    {messages.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No messages in this thread yet.</p>
                    )}
                    {messages.map((msg) => (
                      <div key={msg.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {msg.senderId}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(msg.sentAt)} at {formatTime(msg.sentAt)}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm">
                          {msg.body}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3">Quick Reply</h4>
                  <div className="space-y-4">
                    <Textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Type your reply..."
                      rows={4}
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleReply} disabled={sending || !replyBody.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        {sending ? "Sending..." : "Send Reply"}
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
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    toRole: "manager",
    subject: "",
    category: "general" as MessageThread["category"],
    priority: "normal" as MessageThread["priority"],
    content: ""
  })

  const handleSend = async () => {
    if (!formData.subject.trim() || !formData.content.trim()) {
      toast({ title: "Validation", description: "Subject and message are required.", duration: 3000 })
      return
    }
    setSending(true)
    try {
      const thread = await featureApi.communication.createThread({
        subject: formData.subject,
        category: formData.category,
        priority: formData.priority,
      })
      await featureApi.communication.sendMessage({
        threadId: thread.id,
        body: formData.content,
      })
      toast({ title: "Message Sent", description: "Your message has been sent successfully.", duration: 3000 })
      setFormData({ toRole: "manager", subject: "", category: "general", priority: "normal", content: "" })
    } catch {
      toast({ title: "Error", description: "Failed to send message.", duration: 3000 })
    } finally {
      setSending(false)
    }
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
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as MessageThread["category"] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as MessageThread["priority"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
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
              <Button onClick={handleSend} disabled={sending}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Sending..." : "Send Message"}
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
