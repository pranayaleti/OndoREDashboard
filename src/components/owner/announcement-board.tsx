import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Megaphone, Plus, Trash2 } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Announcement {
  id: string
  title: string
  body: string
  priority: string
  publishAt: string
  expiresAt: string | null
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
}

interface AnnouncementBoardProps {
  propertyId: string
}

export function AnnouncementBoard({ propertyId }: AnnouncementBoardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [priority, setPriority] = useState("normal")
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [propertyId])

  const load = async () => {
    try {
      setLoading(true)
      const data = await featureApi.announcements.list(propertyId)
      setAnnouncements(data as Announcement[])
    } catch {
      toast({ title: "Failed to load announcements", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!title || !body) return
    try {
      setSaving(true)
      await featureApi.announcements.create(propertyId, { title, body, priority })
      toast({ title: "Announcement posted" })
      setCreateOpen(false)
      setTitle("")
      setBody("")
      setPriority("normal")
      await load()
    } catch {
      toast({ title: "Failed to post", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await featureApi.announcements.remove(id)
    toast({ title: "Announcement removed" })
    load()
  }

  if (loading) return <Skeleton className="h-32 w-full" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-orange-500" /> Announcements
        </h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      {announcements.length === 0 ? (
        <p className="text-center text-slate-500 py-6 text-sm">No announcements</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{a.title}</p>
                      <Badge className={priorityColors[a.priority] || priorityColors.normal}>
                        {a.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{a.body}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(a.publishAt).toLocaleDateString()}
                      {a.expiresAt && ` — Expires ${new Date(a.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
            <DialogDescription>Post an announcement to all tenants of this property.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Announcement details..." />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving || !title || !body}>
                {saving ? "Posting..." : "Post Announcement"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
