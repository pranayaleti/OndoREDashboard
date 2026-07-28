import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CalendarDays, Plus, Pencil, Trash2 } from "lucide-react"
import { eventsApi, type EventItem } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface EventFormState {
  slug: string
  title: string
  startsAt: string
  endsAt: string
  location: string
  rsvpUrl: string
  description: string
  isPublished: boolean
}

const EMPTY_FORM: EventFormState = {
  slug: "",
  title: "",
  startsAt: "",
  endsAt: "",
  location: "",
  rsvpUrl: "",
  description: "",
  isPublished: false,
}

/** ISO string -> value for <input type="datetime-local"> (local time, no seconds). */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** datetime-local value -> ISO string (UTC). Empty -> null. */
function localInputToIso(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export default function AdminEvents() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function loadEvents() {
    setLoading(true)
    try {
      const data = await eventsApi.listEvents(true)
      setEvents(data)
    } catch (err) {
      console.error("Failed to load events:", err)
      toast({
        title: "Could not load events",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  function openEdit(ev: EventItem) {
    setEditingId(ev.id)
    setForm({
      slug: ev.slug,
      title: ev.title,
      startsAt: isoToLocalInput(ev.startsAt),
      endsAt: isoToLocalInput(ev.endsAt),
      location: ev.location ?? "",
      rsvpUrl: ev.rsvpUrl ?? "",
      description: ev.description ?? "",
      isPublished: ev.isPublished,
    })
    setDialogOpen(true)
  }

  function updateField<K extends keyof EventFormState>(key: K, value: EventFormState[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Auto-fill slug from title on create until the user edits it.
      if (key === "title" && !editingId && (prev.slug === "" || prev.slug === slugify(prev.title))) {
        next.slug = slugify(value as string)
      }
      return next
    })
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim() || !form.startsAt) {
      toast({
        title: "Missing required fields",
        description: "Title, slug, and start date are required.",
        variant: "destructive",
      })
      return
    }
    const startsIso = localInputToIso(form.startsAt)
    if (!startsIso) {
      toast({ title: "Invalid start date", variant: "destructive" })
      return
    }
    const endsIso = localInputToIso(form.endsAt)
    if (endsIso && endsIso < startsIso) {
      toast({
        title: "End is before start",
        description: "The end time must be on or after the start time.",
        variant: "destructive",
      })
      return
    }

    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      startsAt: startsIso,
      endsAt: endsIso,
      location: form.location.trim() || null,
      rsvpUrl: form.rsvpUrl.trim() || null,
      description: form.description.trim() || null,
      isPublished: form.isPublished,
    }

    setSaving(true)
    try {
      if (editingId) {
        await eventsApi.updateEvent(editingId, payload)
        toast({ title: "Event updated" })
      } else {
        await eventsApi.createEvent(payload)
        toast({ title: "Event created" })
      }
      setDialogOpen(false)
      await loadEvents()
    } catch (err) {
      console.error("Failed to save event:", err)
      toast({
        title: "Could not save event",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(ev: EventItem) {
    try {
      await eventsApi.updateEvent(ev.id, { isPublished: !ev.isPublished })
      await loadEvents()
    } catch (err) {
      console.error("Failed to toggle publish:", err)
      toast({ title: "Could not update publish state", variant: "destructive" })
    }
  }

  async function handleDelete(ev: EventItem) {
    if (!window.confirm(`Delete "${ev.title}"? This cannot be undone.`)) return
    try {
      await eventsApi.deleteEvent(ev.id)
      toast({ title: "Event deleted" })
      await loadEvents()
    } catch (err) {
      console.error("Failed to delete event:", err)
      toast({ title: "Could not delete event", variant: "destructive" })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Events</h1>
            <p className="text-sm text-muted-foreground">
              Create and publish public-facing ONDO events.
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit event" : "New event"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ev-title">Title *</Label>
                <Input
                  id="ev-title"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="First-Time Homebuyer Workshop"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-slug">Slug *</Label>
                <Input
                  id="ev-slug"
                  value={form.slug}
                  onChange={(e) => updateField("slug", slugify(e.target.value))}
                  placeholder="first-time-homebuyer-workshop"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ev-starts">Starts *</Label>
                  <Input
                    id="ev-starts"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => updateField("startsAt", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ev-ends">Ends</Label>
                  <Input
                    id="ev-ends"
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => updateField("endsAt", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-location">Location</Label>
                <Input
                  id="ev-location"
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="Online (Zoom) or address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-rsvp">RSVP URL</Label>
                <Input
                  id="ev-rsvp"
                  type="url"
                  value={form.rsvpUrl}
                  onChange={(e) => updateField("rsvpUrl", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ev-desc">Description</Label>
                <Textarea
                  id="ev-desc"
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  placeholder="What attendees can expect."
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ev-published">Published</Label>
                <Switch
                  id="ev-published"
                  checked={form.isPublished}
                  onCheckedChange={(checked) => updateField("isPublished", checked)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Create event"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading events…</p>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No events yet. Create your first one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {ev.title}
                      <Badge variant={ev.isPublished ? "default" : "secondary"}>
                        {ev.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {formatWhen(ev.startsAt)}
                      {ev.location ? ` · ${ev.location}` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => togglePublish(ev)}>
                      {ev.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(ev)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(ev)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {ev.description ? (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ev.description}</p>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
