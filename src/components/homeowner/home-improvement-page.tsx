import { useState, useEffect } from "react"
import { HomeownerPropertyShell } from "./homeowner-property-shell"
import { ConfirmDeleteDialog } from "./confirm-delete-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { homeownerApi, dashboardApi, type HomeImprovementProject, type ServiceProvider } from "@/lib/api"
import { validateChatInput } from "@/lib/aiGuardrails"
import { Sparkles, Plus, MoreHorizontal, Loader2, Phone, Mail, Trash2, Pencil } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

const STATUS_CLASS: Record<string, string> = {
  planning: "bg-slate-100 text-slate-800",
  scheduled: "bg-violet-100 text-violet-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
}

const CATEGORIES = [
  "repair",
  "outdoor",
  "maintenance",
  "renovation",
  "upgrade",
] as const

export function HomeImprovementPage() {
  return (
    <HomeownerPropertyShell>
      {({ propertyId }) => <HomeImprovementInner propertyId={propertyId} />}
    </HomeownerPropertyShell>
  )
}

function HomeImprovementInner({ propertyId }: { propertyId: string }) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<HomeImprovementProject[]>([])
  const [loading, setLoading] = useState(true)
  const [ideasOpen, setIdeasOpen] = useState(false)
  const [ideasText, setIdeasText] = useState("")
  const [ideasLoading, setIdeasLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HomeImprovementProject | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<HomeImprovementProject | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [providerFormOpen, setProviderFormOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null)
  const [deleteProviderTarget, setDeleteProviderTarget] = useState<ServiceProvider | null>(null)
  const [deletingProvider, setDeletingProvider] = useState(false)

  const load = async () => {
    try {
      const data = await homeownerApi.listProjects(propertyId)
      setProjects(data)
    } catch {
      toast({ title: "Failed to load projects", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const loadProviders = async () => {
    try {
      const data = await homeownerApi.listServiceProviders(propertyId)
      setProviders(data)
    } catch {
      /* best-effort */
    } finally {
      setProvidersLoading(false)
    }
  }

  useEffect(() => {
    void load()
    void loadProviders()
  }, [propertyId])

  const filtered =
    statusFilter === "all"
      ? projects
      : projects.filter((p) => p.status === statusFilter)

  const generateIdeas = async () => {
    setIdeasLoading(true)
    setIdeasText("")
    setIdeasOpen(true)
    try {
      const prompt =
        "Suggest 5 prioritized home improvement projects for a residential property. For each, give a one-line title, category (repair/outdoor/maintenance/renovation/upgrade), rough estimated cost range in USD, and expected ROI or value note. Keep the answer concise with bullet points."
      const guard = validateChatInput([{ role: "user", content: prompt }])
      if (!guard.ok) {
        setIdeasText(guard.error)
        return
      }
      const { reply } = await dashboardApi.assistantChat(guard.messages)
      setIdeasText(reply)
    } catch (e) {
      setIdeasText(
        e instanceof Error ? e.message : "Could not generate ideas. Try again."
      )
    } finally {
      setIdeasLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await homeownerApi.deleteProject(propertyId, deleteTarget.id)
      toast({ title: "Project deleted" })
      void load()
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleDeleteProvider = async () => {
    if (!deleteProviderTarget) return
    setDeletingProvider(true)
    try {
      await homeownerApi.deleteServiceProvider(propertyId, deleteProviderTarget.id)
      toast({ title: "Service provider removed" })
      void loadProviders()
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    } finally {
      setDeletingProvider(false)
      setDeleteProviderTarget(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            Home improvement
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plan, track, and document projects for this property.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void generateIdeas()}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate ideas
          </Button>
          <Button
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add project
          </Button>
        </div>
      </header>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter</span>
            {(["all", "planning", "scheduled", "in_progress", "completed"] as const).map(
              (s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={statusFilter === s ? "default" : "outline"}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? "All" : s.replace("_", " ")}
                </Button>
              )
            )}
          </div>

          <p className="text-sm font-medium">
            {loading ? "…" : `${filtered.length} project${filtered.length !== 1 ? "s" : ""}`}
          </p>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet. Add one or generate ideas.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((p) => (
                <Card key={p.id} className="overflow-hidden border-border/80">
                  <div className="flex">
                    {p.photoUrl ? (
                      <div className="h-32 w-28 shrink-0 bg-muted">
                        <img
                          src={p.photoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-32 w-28 shrink-0 bg-muted" />
                    )}
                    <CardContent className="min-w-0 flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold leading-tight">{p.name}</h3>
                          <p className="text-xs capitalize text-muted-foreground">
                            {p.category.replace("_", " ")} —{" "}
                            {p.scheduledDate
                              ? new Date(p.scheduledDate).toLocaleDateString()
                              : "No date"}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(p)
                                setFormOpen(true)
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteTarget(p)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge className={STATUS_CLASS[p.status] ?? "bg-muted"}>
                          {p.status.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Est.{" "}
                          {p.estimatedCostCents != null
                            ? `$${(p.estimatedCostCents / 100).toLocaleString()}`
                            : "—"}
                          {p.estimatedRoiPercent != null
                            ? ` · ROI ~${p.estimatedRoiPercent}%`
                            : ""}
                        </span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="services" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Your trusted service providers and contractors.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setEditingProvider(null)
                setProviderFormOpen(true)
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add provider
            </Button>
          </div>
          {providersLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : providers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No service providers yet. Add your plumber, electrician, HVAC tech, or other contacts.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {providers.map((p) => (
                <Card key={p.id} className="border-border/80">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-tight">{p.name}</h3>
                        <p className="text-xs capitalize text-muted-foreground">
                          {p.trade.replace("_", " ")}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingProvider(p)
                            setProviderFormOpen(true)
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteProviderTarget(p)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {p.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {p.phone}
                        </span>
                      )}
                      {p.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {p.email}
                        </span>
                      )}
                    </div>
                    {p.notes && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete project?"
        description={`"${deleteTarget?.name ?? ""}" will be permanently removed.`}
        onConfirm={handleDelete}
        loading={deleting}
      />

      <Dialog open={ideasOpen} onOpenChange={setIdeasOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project ideas</DialogTitle>
          </DialogHeader>
          {ideasLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm">{ideasText}</pre>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIdeasOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteProviderTarget}
        onOpenChange={(open) => { if (!open) setDeleteProviderTarget(null) }}
        title="Remove service provider?"
        description={`"${deleteProviderTarget?.name ?? ""}" will be permanently removed.`}
        onConfirm={handleDeleteProvider}
        loading={deletingProvider}
      />

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        propertyId={propertyId}
        existing={editing}
        onSaved={() => {
          void load()
          setFormOpen(false)
          setEditing(null)
        }}
      />

      <ServiceProviderFormDialog
        open={providerFormOpen}
        onOpenChange={setProviderFormOpen}
        propertyId={propertyId}
        existing={editingProvider}
        onSaved={() => {
          void loadProviders()
          setProviderFormOpen(false)
          setEditingProvider(null)
        }}
      />
    </div>
  )
}

function ProjectFormDialog({
  open,
  onOpenChange,
  propertyId,
  existing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  propertyId: string
  existing: HomeImprovementProject | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: "",
    category: "maintenance" as (typeof CATEGORIES)[number],
    scheduledDate: "",
    status: "planning" as HomeImprovementProject["status"],
    estimatedCost: "",
    estimatedRoi: "",
    description: "",
    photoUrl: "",
  })

  useEffect(() => {
    if (!open) return
    if (existing) {
      setForm({
        name: existing.name,
        category: existing.category as (typeof CATEGORIES)[number],
        scheduledDate: existing.scheduledDate?.slice(0, 10) ?? "",
        status: existing.status as HomeImprovementProject["status"],
        estimatedCost:
          existing.estimatedCostCents != null
            ? String(existing.estimatedCostCents / 100)
            : "",
        estimatedRoi:
          existing.estimatedRoiPercent != null
            ? String(existing.estimatedRoiPercent)
            : "",
        description: existing.description ?? "",
        photoUrl: existing.photoUrl ?? "",
      })
    } else {
      setForm({
        name: "",
        category: "maintenance",
        scheduledDate: "",
        status: "planning",
        estimatedCost: "",
        estimatedRoi: "",
        description: "",
        photoUrl: "",
      })
    }
  }, [open, existing])

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" })
      return
    }
    try {
      const body = {
        name: form.name.trim(),
        category: form.category,
        scheduledDate: form.scheduledDate || null,
        status: form.status,
        estimatedCostCents: form.estimatedCost
          ? Math.round(parseFloat(form.estimatedCost) * 100)
          : null,
        estimatedRoiPercent: form.estimatedRoi
          ? parseFloat(form.estimatedRoi)
          : null,
        description: form.description || null,
        photoUrl: form.photoUrl || null,
      }
      if (existing) {
        await homeownerApi.updateProject(propertyId, existing.id, body)
      } else {
        await homeownerApi.createProject(propertyId, body)
      }
      toast({ title: "Project saved" })
      onSaved()
    } catch {
      toast({ title: "Save failed", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit project" : "Add project"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, category: v as (typeof CATEGORIES)[number] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as HomeImprovementProject["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Scheduled date</Label>
            <Input
              type="date"
              value={form.scheduledDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, scheduledDate: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Est. cost ($)</Label>
              <Input
                type="number"
                value={form.estimatedCost}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estimatedCost: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Est. ROI (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.estimatedRoi}
                onChange={(e) =>
                  setForm((f) => ({ ...f, estimatedRoi: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Photo URL</Label>
            <Input
              placeholder="https://…"
              value={form.photoUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, photoUrl: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const TRADE_OPTIONS = [
  "hvac", "plumbing", "electrical", "roofing", "landscaping",
  "painting", "general", "cleaning", "pest_control", "other",
] as const

function ServiceProviderFormDialog({
  open,
  onOpenChange,
  propertyId,
  existing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  propertyId: string
  existing: ServiceProvider | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: "",
    trade: "general" as string,
    phone: "",
    email: "",
    notes: "",
  })

  useEffect(() => {
    if (!open) return
    if (existing) {
      setForm({
        name: existing.name,
        trade: existing.trade,
        phone: existing.phone ?? "",
        email: existing.email ?? "",
        notes: existing.notes ?? "",
      })
    } else {
      setForm({ name: "", trade: "general", phone: "", email: "", notes: "" })
    }
  }, [open, existing])

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" })
      return
    }
    try {
      const body = {
        name: form.name.trim(),
        trade: form.trade,
        phone: form.phone || null,
        email: form.email || null,
        notes: form.notes || null,
      }
      if (existing) {
        await homeownerApi.updateServiceProvider(propertyId, existing.id, body)
      } else {
        await homeownerApi.createServiceProvider(propertyId, body)
      }
      toast({ title: "Service provider saved" })
      onSaved()
    } catch {
      toast({ title: "Save failed", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit provider" : "Add service provider"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. John's Plumbing"
            />
          </div>
          <div>
            <Label>Trade</Label>
            <Select
              value={form.trade}
              onValueChange={(v) => setForm((f) => ({ ...f, trade: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRADE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Recommended by neighbor, available weekends..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
