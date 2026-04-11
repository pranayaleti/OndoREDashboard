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
import { supabase } from "@/lib/supabase"
import { DEMO_MESSAGE_RECORDS, DEMO_MESSAGE_THREAD, shouldReplacePlaceholderThread } from "@/lib/seed-data"

function normalizeThreads(threads: MessageThread[]): MessageThread[] {
  if (threads.length === 0) return [DEMO_MESSAGE_THREAD]
  return threads.map((thread) => (shouldReplacePlaceholderThread(thread) ? DEMO_MESSAGE_THREAD : thread))
}

function MessagesList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null)
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setLoading(true)
    featureApi.communication
      .listThreads()
      .then((data) => setThreads(normalizeThreads(data)))
      .catch(() => {
        toast({ title: "Error", description: "Failed to load messages.", variant: "destructive" })
      })
      .finally(() => setLoading(false))
  }, [])

  // Realtime: subscribe to new messages in the selected thread
  useEffect(() => {
    const client = supabase;
    if (!selectedThread || !client) return;

    const channel = client
      .channel(`messages:${selectedThread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${selectedThread.id}`,
        },
        (payload) => {
          const newMsg: MessageRecord = {
            id: payload.new.id,
            threadId: payload.new.thread_id,
            senderId: payload.new.sender_id,
            body: payload.new.body,
            mentions: payload.new.mentions || [],
            templateId: payload.new.template_id,
            channel: payload.new.channel,
            sentAt: payload.new.sent_at,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [selectedThread?.id]);

  // Realtime: refresh thread list when any thread is updated (unread counts, last message)
  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel('thread_list_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'message_threads',
        },
        () => {
          featureApi.communication
            .listThreads()
            .then((data) => setThreads(normalizeThreads(data)))
            .catch(() => {});
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  const handleSelectThread = async (thread: MessageThread) => {
    setSelectedThread(thread)
    setMessages([])
    setReplyText("")
    try {
      const [msgs] = await Promise.all([
        featureApi.communication.listMessages(thread.id),
        featureApi.communication.markRead(thread.id),
      ])
      if (shouldReplacePlaceholderThread(thread, msgs)) {
        setSelectedThread(DEMO_MESSAGE_THREAD)
        setMessages(DEMO_MESSAGE_RECORDS)
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...DEMO_MESSAGE_THREAD, unreadCount: 0 } : t))
        )
      } else {
        setMessages(msgs)
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
        )
      }
    } catch {
      toast({ title: "Error", description: "Failed to load thread messages.", variant: "destructive" })
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedThread) return
    if (selectedThread.id === DEMO_MESSAGE_THREAD.id) {
      const demoReply: MessageRecord = {
        id: `demo-reply-${Date.now()}`,
        threadId: DEMO_MESSAGE_THREAD.id,
        senderId: "manager-demo",
        body: replyText,
        mentions: [],
        channel: "portal",
        sentAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, demoReply])
      setReplyText("")
      toast({ title: "Reply sent", description: "Your reply has been sent.", duration: 3000 })
      return
    }
    setSending(true)
    try {
      const newMsg = await featureApi.communication.sendMessage({
        threadId: selectedThread.id,
        body: replyText,
      })
      setMessages((prev) => [...prev, newMsg])
      setThreads((prev) =>
        prev.map((t) =>
          t.id === selectedThread.id ? { ...t, lastMessageAt: newMsg.sentAt } : t
        )
      )
      setReplyText("")
      toast({ title: "Reply sent", description: "Your reply has been sent.", duration: 3000 })
    } catch (err) {
      console.error("[sendMessage] failed:", err)
      toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selectedThread) return
    try {
      const updated = await featureApi.communication.updateThread(selectedThread.id, { status })
      setSelectedThread(updated)
      setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" })
    }
  }

  const handleUpdatePriority = async (priority: string) => {
    if (!selectedThread) return
    try {
      const updated = await featureApi.communication.updateThread(selectedThread.id, { priority })
      setSelectedThread(updated)
      setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch {
      toast({ title: "Error", description: "Failed to update priority.", variant: "destructive" })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "normal":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "billing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "lease":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-muted text-gray-800 dark:bg-card dark:text-gray-200"
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
  }

  const filteredThreads = threads.filter((thread) => {
    const matchesSearch =
      thread.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      categoryFilter === "all" || thread.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  useEffect(() => {
    if (selectedThread || filteredThreads.length === 0) return
    void handleSelectThread(filteredThreads[0])
  }, [filteredThreads, selectedThread])

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
            <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400">Communicate with owners and tenants</p>
          </div>
        </div>
        <Link to="/dashboard/messages/compose">
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
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="lease">Lease</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-gray-500 text-center py-8">Loading messages...</p>
            ) : filteredThreads.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No messages found.</p>
            ) : (
              filteredThreads.map((thread) => (
                <Card
                  key={thread.id}
                  className={`cursor-pointer transition-colors ${
                    selectedThread?.id === thread.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-muted dark:hover:bg-card"
                  } ${thread.unreadCount > 0 ? "border-l-4 border-l-blue-500" : ""}`}
                  onClick={() => handleSelectThread(thread)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs lg:text-sm">
                            {thread.subject.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm lg:text-base font-medium truncate max-w-[140px] block">
                            {thread.subject}
                          </span>
                          <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 capitalize">
                            {thread.category}
                          </p>
                        </div>
                      </div>
                      {thread.unreadCount > 0 && (
                        <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full shrink-0">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <h3 className={`text-sm lg:text-base font-medium mb-1 ${thread.unreadCount > 0 ? "font-bold" : ""}`}>
                      {thread.status}
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
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedThread ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedThread.subject}</CardTitle>
                    <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 mt-2">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span className="capitalize">{selectedThread.category}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(selectedThread.lastMessageAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setReplyText("")}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                </div>
                {/* Manager controls: update status and priority */}
                <div className="flex gap-3 mt-4 pt-4 border-t">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500 mb-1 block">Status</Label>
                    <Select value={selectedThread.status} onValueChange={handleUpdateStatus}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500 mb-1 block">Priority</Label>
                    <Select value={selectedThread.priority} onValueChange={handleUpdatePriority}>
                      <SelectTrigger className="h-8">
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
                {/* Message thread */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No messages in this thread yet.</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="p-3 bg-muted dark:bg-card rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{msg.body}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(msg.sentAt)}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="pt-6 border-t">
                  <h4 className="font-medium mb-3">Quick Reply</h4>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Type your reply..."
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleSendReply} disabled={!replyText.trim() || sending}>
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
  const [formData, setFormData] = useState({
    toRole: "owner",
    subject: "",
    category: "general",
    priority: "normal",
    content: ""
  })
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!formData.subject.trim() || !formData.content.trim()) {
      toast({ title: "Validation", description: "Subject and message are required.", variant: "destructive" })
      return
    }
    setSending(true)
    try {
      const thread = await featureApi.communication.createThread({
        subject: formData.subject,
        status: "open",
        priority: formData.priority,
        category: formData.category as MessageThread["category"],
      })
      await featureApi.communication.sendMessage({ threadId: thread.id, body: formData.content })
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
        duration: 3000,
      })
      setFormData({ toRole: "owner", subject: "", category: "general", priority: "normal", content: "" })
    } catch {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
          { label: "Compose", icon: Plus }
        ]} />
      </div>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
            <CardDescription>Send a message to owners or tenants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="toRole">Recipient Type</Label>
                <Select value={formData.toRole} onValueChange={(value) => setFormData(prev => ({ ...prev, toRole: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="tenant">Tenant</SelectItem>
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
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
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
              <Link to="/dashboard/messages">
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

export default function ManagerMessages() {
  return (
    <Routes>
      <Route path="/" element={<MessagesList />} />
      <Route path="/compose" element={<ComposeMessage />} />
    </Routes>
  )
}
