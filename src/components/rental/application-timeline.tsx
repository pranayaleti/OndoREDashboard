export type TimelineEvent = {
  id: string
  action: string
  actionLabel?: string
  createdAt: string
  visibility?: string
  actorName?: string | null
  actorRole?: string | null
}

export function ApplicationTimeline({
  events,
  staff = false,
}: {
  events: TimelineEvent[]
  staff?: boolean
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No history yet.</p>
  }
  return (
    <ol className="space-y-2 text-sm">
      {events.map((event) => (
        <li key={event.id} className="rounded-md border p-2">
          <p className="font-medium">{event.actionLabel || event.action.replace(/_/g, " ")}</p>
          <p className="text-xs text-muted-foreground">
            {event.createdAt.slice(0, 16).replace("T", " ")}
            {event.actorName ? ` · ${event.actorName}` : event.actorRole ? ` · ${event.actorRole}` : ""}
            {staff && event.visibility === "internal" ? " · Internal" : ""}
          </p>
        </li>
      ))}
    </ol>
  )
}
