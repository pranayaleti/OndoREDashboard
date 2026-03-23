"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, CalendarDays, MapPin, Users, Trash2 } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface RsvpCounts {
  going: number
  maybe: number
  not_going: number
}

interface CommunityEvent {
  id: string
  propertyId: string
  title: string
  description: string | null
  eventDate: string
  startTime: string | null
  endTime: string | null
  location: string | null
  maxAttendees: number | null
  isRsvpRequired: boolean
  rsvpCounts: RsvpCounts | null
  createdAt: string
}

interface CommunityEventsProps {
  propertyId: string
}

export function CommunityEvents({ propertyId }: CommunityEventsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    location: "",
    maxAttendees: "",
    isRsvpRequired: false,
  })

  useEffect(() => { load() }, [propertyId])

  const load = async () => {
    try {
      setLoading(true)
      const data = await featureApi.communityEvents.list(propertyId, true)
      setEvents(data as CommunityEvent[])
    } catch {
      toast({ title: "Failed to load events", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.title || !form.eventDate) return
    try {
      setSaving(true)
      await featureApi.communityEvents.create(propertyId, {
        title: form.title,
        description: form.description || undefined,
        eventDate: form.eventDate,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        location: form.location || undefined,
        maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
        isRsvpRequired: form.isRsvpRequired,
      })
      toast({ title: "Event created" })
      setCreateOpen(false)
      setForm({
        title: "", description: "", eventDate: "", startTime: "",
        endTime: "", location: "", maxAttendees: "", isRsvpRequired: false,
      })
      load()
    } catch {
      toast({ title: "Failed to create event", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await featureApi.communityEvents.delete(id)
      toast({ title: "Event deleted" })
      load()
    } catch {
      toast({ title: "Failed to delete event", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Community Events
        </CardTitle>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Create Event
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-lg" />)}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No upcoming events.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => (
              <Card key={ev.id} className="border shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{ev.title}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-700"
                      disabled={deletingId === ev.id}
                      onClick={() => handleDelete(ev.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {ev.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{ev.description}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(ev.eventDate).toLocaleDateString()}
                    {ev.startTime && ` at ${ev.startTime}`}
                    {ev.endTime && ` – ${ev.endTime}`}
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {ev.location}
                    </div>
                  )}
                  {ev.rsvpCounts && (
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span className="text-green-600">{ev.rsvpCounts.going} going</span>
                      </div>
                      <span className="text-yellow-600">{ev.rsvpCounts.maybe} maybe</span>
                      <span className="text-red-500">{ev.rsvpCounts.not_going} not going</span>
                    </div>
                  )}
                  {ev.isRsvpRequired && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">RSVP Required</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Community Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input
                placeholder="e.g. Summer BBQ"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Event details…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input
                  placeholder="e.g. Courtyard"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Max Attendees (optional)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={form.maxAttendees}
                  onChange={(e) => setForm((f) => ({ ...f, maxAttendees: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="rsvpRequired"
                  checked={form.isRsvpRequired}
                  onChange={(e) => setForm((f) => ({ ...f, isRsvpRequired: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="rsvpRequired">RSVP Required</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Create Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
