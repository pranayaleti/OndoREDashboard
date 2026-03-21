"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MessageSquare, Send, Paperclip, MoreVertical, Building, Clock } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NewMessageDialog } from "@/components/owner/new-message-dialog"
import { useToast } from "@/hooks/use-toast"
import { featureApi, type MessageThread, type MessageRecord } from "@/lib/api"
import { supabase } from "@/lib/supabase"

export function MessagesView() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null)
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterPriority, setFilterPriority] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load threads on mount and when status/priority filters change
  useEffect(() => {
    setLoading(true)
    featureApi.communication
      .listThreads({
        status: filterStatus || undefined,
        priority: filterPriority || undefined,
      })
      .then(setThreads)
      .catch(() => {
        toast({ title: "Error", description: "Failed to load conversations.", variant: "destructive" })
      })
      .finally(() => setLoading(false))
  }, [filterStatus, filterPriority])

  // Scroll to bottom of messages when a thread is selected or new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [selectedThread, messages])

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
            .then(setThreads)
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
    try {
      const [msgs] = await Promise.all([
        featureApi.communication.listMessages(thread.id),
        featureApi.communication.markRead(thread.id),
      ])
      setMessages(msgs)
      // Update local unread count to 0
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
      )
    } catch {
      toast({ title: "Error", description: "Failed to load messages.", variant: "destructive" })
    }
  }

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedThread) return
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
    } catch {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" })
    }
  }

  const handleCreateConversation = async (data: any) => {
    try {
      const newThread = await featureApi.communication.createThread({
        subject: data.message?.substring(0, 80) ?? "New Message",
        status: "open",
        priority: "normal",
        category: data.recipientType ?? "general",
      })
      // Send the first message into the new thread
      const firstMsg = await featureApi.communication.sendMessage({
        threadId: newThread.id,
        body: data.message,
      })
      setThreads((prev) => [newThread, ...prev])
      setSelectedThread(newThread)
      setMessages([firstMsg])
      toast({
        title: "Message sent",
        description: `Your message has been sent.`,
      })
    } catch {
      toast({ title: "Error", description: "Failed to create conversation.", variant: "destructive" })
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "long" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  // Client-side filter by search term and active tab
  const filteredThreads = threads.filter((thread) => {
    const matchesSearch = thread.subject.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "unread") return matchesSearch && (thread.unreadCount ?? 0) > 0
    if (activeTab === "open") return matchesSearch && thread.status === "open"
    if (activeTab === "closed") return matchesSearch && thread.status === "closed"

    return matchesSearch
  })

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Conversations</CardTitle>
              <NewMessageDialog onCreateConversation={handleCreateConversation} />
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Status and Priority filter bar */}
            <div className="flex gap-2 mt-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-2 mx-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
            </TabsList>
          </Tabs>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                  Loading conversations...
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No conversations found</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    {searchTerm
                      ? "Try adjusting your search"
                      : activeTab === "unread"
                        ? "You have no unread messages"
                        : "Start a new conversation"}
                  </p>
                  <NewMessageDialog onCreateConversation={handleCreateConversation} />
                </div>
              ) : (
                <div>
                  {filteredThreads.map((thread) => (
                    <div
                      key={thread.id}
                      className={`flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer ${
                        selectedThread?.id === thread.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleSelectThread(thread)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{thread.subject.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="font-medium truncate">{thread.subject}</div>
                          <div className="text-xs text-muted-foreground shrink-0 ml-1">
                            {thread.lastMessageAt ? formatTimestamp(thread.lastMessageAt) : ""}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-1 items-center">
                            {thread.status && (
                              <Badge variant="outline" className="text-xs font-normal rounded-sm h-4 px-1 capitalize">
                                {thread.status}
                              </Badge>
                            )}
                            {thread.priority && thread.priority !== "normal" && (
                              <Badge variant="outline" className="text-xs font-normal rounded-sm h-4 px-1 capitalize">
                                {thread.priority}
                              </Badge>
                            )}
                          </div>
                          {(thread.unreadCount ?? 0) > 0 && (
                            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full shrink-0">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1">
        {selectedThread ? (
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-4 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{selectedThread.subject.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedThread.subject}</div>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      {selectedThread.status && (
                        <Badge variant="outline" className="text-xs font-normal rounded-sm h-5 px-1 capitalize">
                          {selectedThread.status}
                        </Badge>
                      )}
                      {selectedThread.category && (
                        <>
                          <Building className="h-3 w-3" />
                          <span className="capitalize">{selectedThread.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Options</DropdownMenuLabel>
                      <DropdownMenuItem>View Thread Info</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-350px)] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.senderId === "me"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <div className="text-sm">{message.body}</div>
                        <div className="text-xs mt-1 opacity-70 flex items-center justify-end gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(message.sentAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="icon" title="Attach File">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  placeholder="Type your message..."
                  className="flex-1 min-h-[40px] resize-none"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button size="icon" disabled={!replyText.trim()} onClick={handleSendMessage} title="Send Message">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center h-full py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-6" />
            <h2 className="text-xl font-medium mb-2">No Conversation Selected</h2>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Select a conversation from the list or start a new one to begin messaging.
            </p>
            <NewMessageDialog onCreateConversation={handleCreateConversation} />
          </Card>
        )}
      </div>
    </div>
  )
}
