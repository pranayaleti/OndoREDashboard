import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Inbox, AlertCircle, MessageSquare, Sparkles, Loader2, ChevronRight, Clock, Mail,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiGet, apiPost } from "@/lib/api/http"

interface InboxSummary {
  totalThreads: number
  unread: number
  slaBreached: number
}

interface InboxThread {
  id: string
  subject: string
  senderName: string
  senderEmail: string
  classification: string
  lastMessageAt: string
  isRead: boolean
  slaBreached: boolean
  snippet: string
}

interface InternalNote {
  id: string
  author: string
  body: string
  createdAt: string
}

export default function ManagerInboxEnhanced() {
  const { toast } = useToast()
  const [summary, setSummary] = useState<InboxSummary | null>(null)
  const [threads, setThreads] = useState<InboxThread[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<InboxThread | null>(null)
  const [notes, setNotes] = useState<InternalNote[]>([])
  const [newNote, setNewNote] = useState("")
  const [suggestedReply, setSuggestedReply] = useState("")
  const [suggesting, setSuggesting] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const [summaryData, threadData] = await Promise.all([
        apiGet<InboxSummary>("/inbox/summary"),
        apiGet<{ threads: InboxThread[] }>("/inbox/attention"),
      ])
      setSummary(summaryData)
      setThreads(threadData.threads ?? [])
    } catch {
      toast({ title: "Failed to load inbox", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const selectThread = async (thread: InboxThread) => {
    setSelectedThread(thread)
    setSuggestedReply("")
    try {
      const data = await apiGet<{ notes: InternalNote[] }>(`/inbox/threads/${thread.id}/notes`)
      setNotes(data.notes ?? [])
    } catch {
      setNotes([])
    }
  }

  const suggestReply = async () => {
    if (!selectedThread) return
    setSuggesting(true)
    setSuggestedReply("")
    try {
      const data = await apiPost<{ reply: string }>(`/inbox/threads/${selectedThread.id}/suggest-reply`)
      setSuggestedReply(data.reply)
    } catch {
      toast({ title: "Failed to generate reply", variant: "destructive" })
    } finally {
      setSuggesting(false)
    }
  }

  const addNote = async () => {
    if (!selectedThread || !newNote.trim()) return
    setSavingNote(true)
    try {
      await apiPost(`/inbox/threads/${selectedThread.id}/notes`, { body: newNote })
      setNewNote("")
      const data = await apiGet<{ notes: InternalNote[] }>(`/inbox/threads/${selectedThread.id}/notes`)
      setNotes(data.notes ?? [])
      toast({ title: "Note added" })
    } catch {
      toast({ title: "Failed to add note", variant: "destructive" })
    } finally {
      setSavingNote(false)
    }
  }

  const classificationColor: Record<string, string> = {
    urgent: "text-red-600 bg-red-50",
    maintenance: "text-orange-600 bg-orange-50",
    payment: "text-green-600 bg-green-50",
    general: "text-gray-600 bg-muted",
    lease: "text-blue-600 bg-blue-50",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Unified Inbox</h2>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
            <Inbox className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary?.totalThreads ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Mail className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary?.unread ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SLA Breached</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{summary?.slaBreached ?? 0}</div></CardContent>
        </Card>
      </div>

      {/* Thread list + detail split */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Thread list */}
        <div className="space-y-2 lg:col-span-2">
          {threads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No threads need attention</p>
          ) : (
            threads.map((thread) => (
              <button
                type="button"
                key={thread.id}
                onClick={() => selectThread(thread)}
                className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
                  selectedThread?.id === thread.id ? "border-primary bg-accent" : ""
                } ${!thread.isRead ? "border-l-4 border-l-blue-500" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${!thread.isRead ? "font-semibold" : "font-medium"}`}>
                      {thread.subject}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{thread.senderName}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge className={`text-[10px] ${classificationColor[thread.classification] ?? ""}`}>
                      {thread.classification}
                    </Badge>
                    {thread.slaBreached && <AlertCircle className="h-3 w-3 text-red-500" />}
                  </div>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{thread.snippet}</p>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selectedThread ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{selectedThread.subject}</CardTitle>
                    <p className="text-sm text-muted-foreground">{selectedThread.senderName} &lt;{selectedThread.senderEmail}&gt;</p>
                  </div>
                  <Button size="sm" onClick={suggestReply} disabled={suggesting}>
                    {suggesting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    Suggest Reply
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedReply && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                    <p className="mb-1 text-xs font-medium text-blue-700">Suggested Reply</p>
                    <p className="whitespace-pre-wrap text-sm">{suggestedReply}</p>
                  </div>
                )}

                <Separator />

                {/* Internal notes */}
                <div>
                  <h4 className="mb-2 flex items-center gap-1 text-sm font-medium">
                    <MessageSquare className="h-4 w-4" /> Internal Notes
                  </h4>
                  {notes.length === 0 && <p className="text-xs text-muted-foreground">No internal notes yet.</p>}
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div key={note.id} className="rounded bg-muted p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{note.author}</span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{note.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Textarea
                      placeholder="Add internal note…"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <Button size="sm" onClick={addNote} disabled={savingNote || !newNote.trim()}>
                      {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
              <ChevronRight className="mb-2 h-8 w-8" />
              <p className="text-sm">Select a thread to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
