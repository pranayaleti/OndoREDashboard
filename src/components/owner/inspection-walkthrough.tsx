import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  Bath,
  Bed,
  Check,
  ChefHat,
  DoorOpen,
  FileText,
  Home,
  Search,
  Smile,
  Sofa,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { documentsApi, featureApi, vendorsApi } from "@/lib/api"
import type { Vendor } from "@/lib/api/clients/vendors"
import { storageUploadErrorMessage } from "@/lib/storage-upload-error"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/locale-format"
import { cn } from "@/lib/utils"
import {
  captureHint,
  floorPlanRoomsFromNames,
  groupByArea,
  INSPECTION_LEGAL_DISCLAIMER,
  initialWalkthroughPhase,
  inspectionTypeLabel,
  isAllowedLayoutMime,
  LAYOUT_ACCEPT,
  resolveLayoutMime,
  roomKind,
  showApplicationsCta,
  type RoomKind,
  type WalkthroughPhase,
} from "@/lib/inspection-walkthrough-ui"

export interface WalkthroughItem {
  id: string
  area: string
  itemName: string
  condition?: string | null
  notes?: string | null
  photoUrls?: string[]
  maintenanceRequestId?: string | null
}

export interface WalkthroughInspection {
  id: string
  inspectionType: string
  status: string
  scheduledDate: string
  overallCondition?: string | null
  notes?: string | null
  ownerSignatureName?: string | null
  ownerSignedAt?: string | null
  tenantSignatureName?: string | null
  tenantSignedAt?: string | null
  items?: WalkthroughItem[]
}

export interface PropertySnapshot {
  title?: string
  bedrooms?: number | null
  bathrooms?: number | null
  sqft?: number | null
  unitNumber?: string | null
  leaseStart?: string | null
  leaseEnd?: string | null
  leaseHref?: string | null
  applicationsHref?: string | null
  calendarHref?: string | null
}

const WALK_CONDITIONS = [
  { ui: "good", api: "good", label: "Good", Icon: Smile },
  { ui: "repair", api: "poor", label: "Repair", Icon: Wrench },
  { ui: "replace", api: "damaged", label: "Replace", Icon: Trash2 },
  { ui: "missing", api: "missing", label: "Missing", Icon: Search },
] as const

const ISSUE_CONDITIONS = new Set(["poor", "damaged", "missing"])

const ROOM_ICONS: Record<RoomKind, typeof Home> = {
  entry: DoorOpen,
  living: Sofa,
  kitchen: ChefHat,
  bath: Bath,
  bed: Bed,
  other: Home,
}

function apiToUi(condition: string | null | undefined): string {
  if (condition === "poor" || condition === "fair") return "repair"
  if (condition === "damaged") return "replace"
  if (condition === "missing") return "missing"
  return "good"
}

function photosOf(item: WalkthroughItem): string[] {
  return Array.isArray(item.photoUrls) ? item.photoUrls.filter(Boolean) : []
}

function reportPdfUrl(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null
  const obj = raw as { data?: { pdfUrl?: string | null }; pdfUrl?: string | null }
  return obj.data?.pdfUrl ?? obj.pdfUrl ?? null
}

function RoomIcon({ area, className }: { area: string; className?: string }) {
  const Icon = ROOM_ICONS[roomKind(area)]
  return <Icon className={className} aria-hidden />
}

function InspectionStartCard({
  inspectionType,
  title,
  unitLine,
  leaseLine,
  leaseHref,
  applicationsHref,
  calendarHref,
  onClose,
}: {
  inspectionType: string
  title?: string
  unitLine: string
  leaseLine: string | null
  leaseHref?: string | null
  applicationsHref?: string | null
  calendarHref?: string | null
  onClose: () => void
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">{title || "This unit"}</p>
        <Badge variant="secondary">{inspectionTypeLabel(inspectionType)}</Badge>
      </div>
      {unitLine ? <p className="text-muted-foreground">Rooms: {unitLine}</p> : null}
      {leaseLine ? <p className="text-muted-foreground">{leaseLine}</p> : null}
      <div className="flex flex-wrap gap-2">
        {leaseHref ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={leaseHref} onClick={onClose}>Open lease</Link>
          </Button>
        ) : null}
        {showApplicationsCta(inspectionType) && applicationsHref ? (
          <Button variant="outline" size="sm" asChild>
            <Link to={applicationsHref} onClick={onClose}>Open applications</Link>
          </Button>
        ) : null}
        {calendarHref ? (
          <Button variant="ghost" size="sm" asChild>
            <Link to={calendarHref} onClick={onClose}>On calendar</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

interface InspectionWalkthroughProps {
  inspection: WalkthroughInspection
  propertyId: string
  property: PropertySnapshot
  maintenanceHref: string
  onReload: () => Promise<void>
  onClose: () => void
}

export function InspectionWalkthrough({
  inspection,
  propertyId,
  property,
  maintenanceHref,
  onReload,
  onClose,
}: InspectionWalkthroughProps) {
  const { toast } = useToast()
  const items = inspection.items ?? []
  const [index, setIndex] = useState(() => {
    const firstOpen = items.findIndex((item) => !item.condition)
    return firstOpen >= 0 ? firstOpen : 0
  })
  const [phase, setPhase] = useState<WalkthroughPhase>(() =>
    initialWalkthroughPhase({
      itemCount: items.length,
      status: inspection.status,
      allHaveCondition: items.length > 0 && items.every((item) => item.condition),
      noneHaveCondition: items.every((item) => !item.condition),
    }),
  )
  const [notes, setNotes] = useState(items[index]?.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [ownerName, setOwnerName] = useState(inspection.ownerSignatureName ?? "")
  const [tenantName, setTenantName] = useState(inspection.tenantSignatureName ?? "")
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [layoutFile, setLayoutFile] = useState<File | null>(null)
  const [layoutRoomNames, setLayoutRoomNames] = useState("")
  const [convertingItemId, setConvertingItemId] = useState<string | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorPick, setVendorPick] = useState<Record<string, string>>({})
  const [assignedName, setAssignedName] = useState<Record<string, string>>({})
  const [assigningTicket, setAssigningTicket] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const layoutRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inspection.status !== "completed") return
    let cancelled = false
    void featureApi.inspections.getReport(inspection.id).then((raw) => {
      if (cancelled) return
      const url = reportPdfUrl(raw)
      if (url) setReportUrl(url)
    }).catch(() => {
      /* PDF is optional until generated */
    })
    return () => { cancelled = true }
  }, [inspection.id, inspection.status])

  const item = items[index]
  const effectivePhase: WalkthroughPhase =
    items.length === 0
      ? "layout"
      : phase === "layout"
        ? inspection.status === "completed"
          ? "report"
          : "checklist"
        : phase
  const unitLine = [
    property.bedrooms != null ? `${property.bedrooms} bed` : null,
    property.bathrooms != null ? `${property.bathrooms} bath` : null,
    property.sqft != null ? `${property.sqft.toLocaleString()} sqft` : null,
  ]
    .filter(Boolean)
    .join(" · ")
  const leaseLine =
    property.leaseStart && property.leaseEnd
      ? `Lease: ${formatDate(property.leaseStart)} – ${formatDate(property.leaseEnd)}`
      : null
  const unitLabel = [property.title, property.unitNumber ? `Unit ${property.unitNumber}` : null]
    .filter(Boolean)
    .join(", ") || "this property"

  const startCardProps = {
    inspectionType: inspection.inspectionType,
    title: property.title,
    unitLine,
    leaseLine,
    leaseHref: property.leaseHref,
    applicationsHref: property.applicationsHref,
    calendarHref: property.calendarHref,
    onClose,
  }

  useEffect(() => {
    if (effectivePhase !== "report") return
    let cancelled = false
    void vendorsApi.list({ status: "active" }).then((res) => {
      if (!cancelled) setVendors(Array.isArray(res.data) ? res.data : [])
    }).catch(() => {
      if (!cancelled) setVendors([])
    })
    return () => { cancelled = true }
  }, [effectivePhase])

  const persistItem = async (patch: { condition?: string; notes?: string; photoUrls?: string[] }) => {
    if (!item) return
    await featureApi.inspections.updateItem(item.id, patch)
  }

  const generateLayout = async (source: "ai_generated" | "uploaded") => {
    try {
      setSaving(true)
      await featureApi.inspections.generateLayout(inspection.id, source)
      toast({ title: "Layout ready — review where to check, then start the walkthrough" })
      await onReload()
    } catch {
      toast({ title: "Could not build the layout", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const importLayoutFile = async () => {
    if (!layoutFile) {
      layoutRef.current?.click()
      return
    }
    const mime = resolveLayoutMime(layoutFile)
    if (!isAllowedLayoutMime(mime)) {
      toast({ title: "Use a PDF, JPEG, PNG, or WebP", variant: "destructive" })
      return
    }
    try {
      setSaving(true)
      const title = layoutFile.name.replace(/\.[^.]+$/, "") || "Inspection layout"
      const upload = await documentsApi.createUploadUrl({
        type: "floor_plan",
        name: title,
        fileName: layoutFile.name,
        contentType: mime,
        propertyId,
      })
      await documentsApi.uploadToSignedUrl(upload.uploadUrl, layoutFile, mime)
      const document = await documentsApi.confirmUpload({
        documentId: upload.documentId,
        type: "floor_plan",
        name: title,
        storagePath: upload.storagePath,
        mimeType: mime,
        sizeBytes: layoutFile.size,
        propertyId,
      })
      const imageUrl = await documentsApi.getDownloadUrl(document.id)
      if (!imageUrl) throw new Error("Missing layout file URL")
      await featureApi.floorPlans.create(propertyId, {
        title,
        imageUrl,
        documentId: document.id,
        representation: "2d_image",
        notes: "Imported as the inspection layout",
        rooms: floorPlanRoomsFromNames(layoutRoomNames),
      })
      await generateLayout("uploaded")
    } catch (err) {
      toast({
        title: storageUploadErrorMessage(err, "Could not import this layout"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveCurrent = async (conditionApi?: string) => {
    if (!item) return
    try {
      setSaving(true)
      await persistItem({
        condition: conditionApi ?? item.condition ?? undefined,
        notes: notes.trim() || undefined,
      })
      await onReload()
    } catch {
      toast({ title: "Could not save this item", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const goNext = async () => {
    await saveCurrent()
    if (index < items.length - 1) {
      const next = index + 1
      setIndex(next)
      setNotes(items[next]?.notes ?? "")
    } else {
      setPhase("summary")
    }
  }

  const openItem = (nextIndex: number) => {
    setIndex(nextIndex)
    setNotes(items[nextIndex]?.notes ?? "")
    setPhase("item")
  }

  const setCondition = async (api: string) => {
    await persistItem({ condition: api, notes: notes.trim() || undefined })
    await onReload()
  }

  const uploadPhoto = async (file: File) => {
    if (!item) return
    try {
      setSaving(true)
      const mime = file.type || "image/jpeg"
      const upload = await documentsApi.createUploadUrl({
        type: "property",
        name: `${item.area} ${item.itemName}`,
        fileName: file.name,
        contentType: mime,
        propertyId,
      })
      await documentsApi.uploadToSignedUrl(upload.uploadUrl, file, mime)
      const document = await documentsApi.confirmUpload({
        documentId: upload.documentId,
        type: "property",
        name: `${item.area} ${item.itemName}`,
        storagePath: upload.storagePath,
        mimeType: mime,
        sizeBytes: file.size,
        propertyId,
      })
      const url = await documentsApi.getDownloadUrl(document.id)
      const nextPhotos = [...photosOf(item), url]
      await persistItem({ photoUrls: nextPhotos, notes: notes.trim() || undefined })
      await onReload()
    } catch (err) {
      toast({
        title: storageUploadErrorMessage(err, "Could not upload photo"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const finishInspection = async () => {
    try {
      setSaving(true)
      await featureApi.inspections.update(inspection.id, {
        status: "completed",
        completedDate: new Date().toISOString().slice(0, 10),
      })
      const url = reportPdfUrl(await featureApi.inspections.createReport(inspection.id))
      setReportUrl(url)
      setPhase("report")
      toast({ title: "Inspection finished" })
      await onReload()
    } catch {
      toast({ title: "Could not finish inspection", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const sign = async (party: "owner" | "tenant") => {
    const name = party === "owner" ? ownerName.trim() : tenantName.trim()
    if (!name) return
    try {
      setSaving(true)
      await featureApi.inspections.sign(inspection.id, party, name)
      toast({ title: `${party === "owner" ? "Owner" : "Tenant"} signature saved` })
      await onReload()
    } catch {
      toast({ title: "Could not save signature", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const openWorkOrders = async () => {
    try {
      setSaving(true)
      await featureApi.inspections.convertIssuesToWorkOrders(inspection.id)
      toast({ title: "Work orders opened from findings" })
      await onReload()
    } catch {
      toast({ title: "Could not open work orders", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const openOneWorkOrder = async (itemId: string) => {
    try {
      setConvertingItemId(itemId)
      await featureApi.inspections.convertItemToMaintenance(inspection.id, itemId)
      toast({ title: "Work order opened" })
      await onReload()
    } catch {
      toast({ title: "Could not open work order", variant: "destructive" })
    } finally {
      setConvertingItemId(null)
    }
  }

  const assignVendorToFinding = async (ticketId: string) => {
    const vendorId = vendorPick[ticketId]
    if (!vendorId) return
    try {
      setAssigningTicket(ticketId)
      await vendorsApi.assign({ vendorId, maintenanceRequestId: ticketId })
      const vendor = vendors.find((row) => row.id === vendorId)
      setAssignedName((prev) => ({ ...prev, [ticketId]: vendor?.name || "Vendor assigned" }))
      toast({ title: "Vendor assigned" })
    } catch {
      toast({ title: "Could not assign vendor", variant: "destructive" })
    } finally {
      setAssigningTicket(null)
    }
  }

  if (effectivePhase === "layout") {
    return (
      <div className="space-y-4">
        <InspectionStartCard {...startCardProps} />
        <div className="rounded-lg bg-muted p-3 text-sm">
          Let’s start the inspection for {unitLabel}.
        </div>
        <div>
          <p className="text-sm font-medium mb-1">How should I set up your layout?</p>
          <p className="text-xs text-muted-foreground mb-1">Inspection layout</p>
          <p className="text-xs text-muted-foreground mb-3">Pick a method below to get started.</p>
          <input
            ref={layoutRef}
            type="file"
            accept={LAYOUT_ACCEPT}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              setLayoutFile(file)
              e.target.value = ""
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-2">
              <button
                type="button"
                aria-label="Upload PDF or image layout"
                className="w-full text-left hover:bg-muted/50 rounded-md p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                onClick={() => layoutRef.current?.click()}
                disabled={saving}
              >
                <p className="font-medium flex items-center gap-2"><Upload className="h-4 w-4" /> Upload PDF/image</p>
                <p className="text-xs text-muted-foreground mt-1">Import your existing inspection layout</p>
              </button>
              {layoutFile ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-muted-foreground truncate">{layoutFile.name}</p>
                  <Input
                    value={layoutRoomNames}
                    onChange={(e) => setLayoutRoomNames(e.target.value)}
                    placeholder="Room names, comma-separated (optional)"
                    aria-label="Room names for this layout"
                  />
                  <Button size="sm" onClick={() => void importLayoutFile()} disabled={saving}>
                    Generate from this layout
                  </Button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Generate recommended checklist from unit records"
              className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-left hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              onClick={() => void generateLayout("ai_generated")}
              disabled={saving}
            >
              <p className="font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI generated
                <Badge className="ml-1 text-[10px]">Recommended</Badge>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Generate a smart layout tailored to this unit.</p>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (effectivePhase === "checklist") {
    const rooms = groupByArea(items)
    return (
      <div className="space-y-4">
        <InspectionStartCard {...startCardProps} />
        <div>
          <p className="font-semibold">Where to check, what to capture</p>
          <p className="text-xs text-muted-foreground">Review the checklist, then walk the unit item by item.</p>
        </div>
        <ul className="space-y-2">
          {rooms.map((room) => {
            const first = room.items[0]
            const startIndex = items.findIndex((row) => row.id === first?.id)
            return (
              <li key={room.area}>
                <button
                  type="button"
                  className="w-full rounded-lg border p-3 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => openItem(startIndex >= 0 ? startIndex : 0)}
                >
                  <span className="flex items-start gap-3">
                    <RoomIcon area={room.area} className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-medium text-sm">{room.area}</span>
                      <span className="block text-xs text-muted-foreground">
                        {room.items.length} item{room.items.length === 1 ? "" : "s"} — {first ? captureHint(room.area, first.itemName) : ""}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-1">
                        {room.items.map((row) => row.itemName).join(" · ")}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <Button onClick={() => openItem(0)} disabled={items.length === 0}>
          Start walkthrough
        </Button>
      </div>
    )
  }

  if (effectivePhase === "item" && !item) {
    return <p className="text-sm text-muted-foreground">Loading checklist…</p>
  }

  if (effectivePhase === "item" && item) {
    const selected = apiToUi(item.condition)
    const hint = captureHint(item.area, item.itemName)
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">
              {item.itemName}{" "}
              <span className="text-muted-foreground font-normal text-sm">{index + 1}/{items.length}</span>
            </p>
            <p className="text-xs text-muted-foreground">Inside {item.area}</p>
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void saveCurrent()
              setPhase("checklist")
            }}
          >
            Save & close
          </Button>
        </div>

        <div>
          <p className="text-sm font-medium">Condition assessment</p>
          <p className="text-xs text-muted-foreground mb-2">Select the current condition of this item</p>
          <div className="grid grid-cols-2 gap-2">
            {WALK_CONDITIONS.map((opt) => {
              const Icon = opt.Icon
              const isSelected = selected === opt.ui
              return (
                <Button
                  key={opt.ui}
                  type="button"
                  aria-pressed={isSelected}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "h-20 flex-col gap-1",
                    isSelected && opt.ui === "good" && "bg-emerald-600 hover:bg-emerald-700",
                  )}
                  onClick={() => void setCondition(opt.api)}
                  disabled={saving}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  {opt.label}
                </Button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">Images</p>
          <p className="text-xs text-muted-foreground mb-2">Add photos to document the current condition</p>
          <input
            ref={photoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void uploadPhoto(file)
              e.target.value = ""
            }}
          />
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            className="w-full rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted/40"
          >
            Click here to upload a JPEG or PNG
          </button>
          {photosOf(item).length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {photosOf(item).map((url) => (
                <img key={url} src={url} alt={`${item.itemName} in ${item.area}`} className="h-16 w-16 rounded object-cover bg-muted" />
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="insp-note">Note</Label>
          <p className="text-xs text-muted-foreground mb-1">Add any additional details or observations</p>
          <Textarea
            id="insp-note"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add any additional details or observations"
          />
        </div>

        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            disabled={index === 0 || saving}
            onClick={() => {
              const prev = Math.max(0, index - 1)
              setIndex(prev)
              setNotes(items[prev]?.notes ?? "")
            }}
          >
            Previous
          </Button>
          <Button onClick={() => void goNext()} disabled={saving}>
            {index === items.length - 1 ? "Review rooms" : "Next item"}
          </Button>
        </div>
      </div>
    )
  }

  if (effectivePhase === "summary") {
    const rooms = groupByArea(items)
    const issues = items.filter((i) => ISSUE_CONDITIONS.has(i.condition ?? ""))
    return (
      <div className="space-y-4">
        <h3 className="font-semibold">All rooms inspected</h3>
        <ul className="divide-y rounded-lg border">
          {rooms.map((room) => {
            const done = room.items.filter((i) => i.condition).length
            return (
              <li key={room.area} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <RoomIcon area={room.area} className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{room.area}</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-700 shrink-0">
                  <Check className="h-4 w-4" /> {done}/{room.items.length} complete
                </span>
              </li>
            )
          })}
        </ul>
        {issues.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {issues.length === 1
              ? "1 item needs repair, replacement, or is missing."
              : `${issues.length} items need repair, replacement, or are missing.`}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPhase("checklist")}>
            Edit inspection
          </Button>
          <Button onClick={() => void finishInspection()} disabled={saving}>
            Finish inspection
          </Button>
        </div>
      </div>
    )
  }

  const issues = items.filter((i) => ISSUE_CONDITIONS.has(i.condition ?? ""))
  const unsignedIssues = issues.filter((i) => !i.maintenanceRequestId)

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Inspection report</h3>
      {reportUrl ? (
        <Button asChild className="w-full sm:w-auto">
          <a href={reportUrl} target="_blank" rel="noreferrer">
            <FileText className="h-4 w-4 mr-2" />
            Download PDF report
          </a>
        </Button>
      ) : (
        <Button variant="outline" onClick={() => void finishInspection()} disabled={saving}>
          <FileText className="h-4 w-4 mr-2" />
          Generate PDF report
        </Button>
      )}

      <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
        <p className="text-sm font-medium">Owner &amp; tenant signature</p>
        <p className="text-xs text-muted-foreground">{INSPECTION_LEGAL_DISCLAIMER}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="owner-sign">Owner signature</Label>
            <Input id="owner-sign" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Full name" />
            <Button size="sm" variant="outline" onClick={() => void sign("owner")} disabled={saving || !ownerName.trim()}>
              {inspection.ownerSignedAt ? "Update owner signature" : "Sign as owner"}
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-sign">Tenant signature</Label>
            <Input id="tenant-sign" value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Full name" />
            <Button size="sm" variant="outline" onClick={() => void sign("tenant")} disabled={saving || !tenantName.trim()}>
              {inspection.tenantSignedAt ? "Update tenant signature" : "Sign as tenant"}
            </Button>
          </div>
        </div>
      </div>

      {issues.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Things to fix</p>
          {issues.map((issue) => (
            <div key={issue.id} className="rounded border p-2 space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{issue.area}: {issue.itemName}</span>
                {issue.maintenanceRequestId ? (
                  <Button size="sm" variant="secondary" asChild>
                    <Link to={maintenanceHref}>Ticket opened</Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={saving || convertingItemId === issue.id}
                    onClick={() => void openOneWorkOrder(issue.id)}
                  >
                    Open work order
                  </Button>
                )}
              </div>
              {issue.maintenanceRequestId ? (
                assignedName[issue.maintenanceRequestId] ? (
                  <p className="text-xs text-muted-foreground">Vendor: {assignedName[issue.maintenanceRequestId]}</p>
                ) : vendors.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={vendorPick[issue.maintenanceRequestId] || undefined}
                      onValueChange={(value) =>
                        setVendorPick((prev) => ({ ...prev, [issue.maintenanceRequestId as string]: value }))
                      }
                    >
                      <SelectTrigger className="h-8 w-[min(100%,16rem)] text-xs" aria-label={`Vendor for ${issue.itemName}`}>
                        <SelectValue placeholder="Assign vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}{vendor.company ? ` · ${vendor.company}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!vendorPick[issue.maintenanceRequestId] || assigningTicket === issue.maintenanceRequestId}
                      onClick={() => void assignVendorToFinding(issue.maintenanceRequestId as string)}
                    >
                      Assign
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Open the ticket to assign a vendor from maintenance.</p>
                )
              ) : null}
            </div>
          ))}
          {unsignedIssues.length > 0 && (
            <Button onClick={() => void openWorkOrders()} disabled={saving}>
              Open {unsignedIssues.length} work order{unsignedIssues.length === 1 ? "" : "s"}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
