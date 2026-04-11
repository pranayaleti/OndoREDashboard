import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Send, Search, Plus, Reply, Archive, Paperclip, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { companyInfo } from "@/constants/companyInfo"
import { featureApi, type MessageThread, type MessageRecord } from "@/lib/api"
import { DEMO_MESSAGE_RECORDS, DEMO_MESSAGE_THREAD, shouldReplacePlaceholderThread } from "@/lib/seed-data"

// Email addresses based on company domain
const getEmail = (prefix: string) => `${prefix}@${companyInfo.social.twitterDomain}`

function normalizeThreads(threads: MessageThread[]): MessageThread[] {
  if (threads.length === 0) return [DEMO_MESSAGE_THREAD]
  return threads.map((thread) => (shouldReplacePlaceholderThread(thread) ? DEMO_MESSAGE_THREAD : thread))
}

export default function TenantMessages() {
  const { toast } = useToast()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showCompose, setShowCompose] = useState(false)
  const [replyBody, setReplyBody] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [composeForm, setComposeForm] = useState({
    to: getEmail("manager"),
    subject: "",
    category: "general",
    priority: "medium",
    content: ""
  })

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

  // Load messages when thread is selected
  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([])
      return
    }
    const threadLooksPlaceholder = threads.some(
      (thread) => thread.id === selectedThreadId && shouldReplacePlaceholderThread(thread)
    )
    setLoadingMessages(true)
    Promise.all([
      featureApi.communication.listMessages(selectedThreadId),
      featureApi.communication.markRead(selectedThreadId).catch(() => {}),
    ])
      .then(([msgs]) => {
        if (threadLooksPlaceholder) {
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
    const matchesCategory = filterCategory === "all" || thread.category === filterCategory
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
        senderId: "tenant-demo",
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

  const handleSendMessage = async () => {
    if (!composeForm.subject.trim() || !composeForm.content.trim()) {
      toast({ title: "Validation", description: "Subject and message are required.", duration: 3000 })
      return
    }
    setSending(true)
    try {
      // Create a new thread then send the first message
      const thread = await featureApi.communication.createThread({
        subject: composeForm.subject,
        category: composeForm.category as MessageThread["category"],
        priority: composeForm.priority as MessageThread["priority"],
      })
      await featureApi.communication.sendMessage({
        threadId: thread.id,
        body: composeForm.content,
      })
      setThreads((prev) => [thread, ...prev])
      toast({ title: "Message Sent", description: "Your message has been sent successfully.", duration: 3000 })
      setShowCompose(false)
      setComposeForm({
        to: getEmail("manager"),
        subject: "",
        category: "general",
        priority: "medium",
        content: "",
      })
    } catch {
      toast({ title: "Error", description: "Failed to send message.", duration: 3000 })
    } finally {
      setSending(false)
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
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatDate = (iso?: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    return d.toLocaleDateString()
  }

  const formatTime = (iso?: string) => {
    if (!iso) return ""
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
                      <SelectItem value="other">Other</SelectItem>
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
                <Button variant="outline" disabled>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach Files
                </Button>
                <Button onClick={handleSendMessage} disabled={sending}>
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Messages
            </h1>
            <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 mt-2">
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
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm lg:text-base font-medium">
                        {thread.participants.length > 0
                          ? thread.participants.map((p) => p.userId).join(", ")
                          : "Property Team"}
                      </span>
                      {thread.unreadCount > 0 && (
                        <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {thread.unreadCount}
                        </Badge>
                      )}
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

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedThread ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedThread.subject}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                      <span>Category: {selectedThread.category}</span>
                      <span>{formatDate(selectedThread.lastMessageAt)} at {formatTime(selectedThread.lastMessageAt)}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setReplyBody("")}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
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

                {/* Reply area */}
                <div className="mt-4 pt-4 border-t space-y-3">
                  <h4 className="font-medium">Reply</h4>
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
