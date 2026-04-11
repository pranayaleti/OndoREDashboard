"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Home, Globe, CheckSquare } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface VacancyListing {
  id: string
  propertyId: string
  listingTitle: string
  listingDescription: string | null
  askingRent: number
  availableDate: string | null
  status: string
  syndicationCount: number
  createdAt: string
}

interface VacancyMarketingProps {
  propertyId: string
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-slate-600",
  active: "bg-green-100 text-green-700",
  filled: "bg-blue-100 text-blue-700",
  expired: "bg-red-100 text-red-700",
}

const PLATFORMS = ["Zillow", "Apartments.com", "Craigslist", "Facebook Marketplace"]

export function VacancyMarketing({ propertyId }: VacancyMarketingProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<VacancyListing[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [publishId, setPublishId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [fillingId, setFillingId] = useState<string | null>(null)

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [form, setForm] = useState({
    listingTitle: "",
    listingDescription: "",
    askingRent: "",
    availableDate: "",
  })

  useEffect(() => { load() }, [propertyId])

  const load = async () => {
    try {
      setLoading(true)
      const data = await featureApi.vacancyMarketing.list(propertyId)
      setListings(data as VacancyListing[])
    } catch {
      toast({ title: "Failed to load listings", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.listingTitle || !form.askingRent) return
    try {
      setSaving(true)
      await featureApi.vacancyMarketing.create(propertyId, {
        listingTitle: form.listingTitle,
        listingDescription: form.listingDescription || undefined,
        askingRent: Number(form.askingRent),
        availableDate: form.availableDate || undefined,
      })
      toast({ title: "Listing created" })
      setCreateOpen(false)
      setForm({ listingTitle: "", listingDescription: "", askingRent: "", availableDate: "" })
      load()
    } catch {
      toast({ title: "Failed to create listing", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!publishId || selectedPlatforms.length === 0) return
    try {
      setPublishing(true)
      await featureApi.vacancyMarketing.publish(publishId, { platforms: selectedPlatforms })
      toast({ title: "Listing published to selected platforms" })
      setPublishId(null)
      setSelectedPlatforms([])
      load()
    } catch {
      toast({ title: "Failed to publish listing", variant: "destructive" })
    } finally {
      setPublishing(false)
    }
  }

  const handleMarkFilled = async (id: string) => {
    try {
      setFillingId(id)
      await featureApi.vacancyMarketing.markFilled(id)
      toast({ title: "Listing marked as filled" })
      load()
    } catch {
      toast({ title: "Failed to mark as filled", variant: "destructive" })
    } finally {
      setFillingId(null)
    }
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Vacancy Marketing
          </CardTitle>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Listing
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
            </div>
          ) : listings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No vacancy listings yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((l) => (
                <Card key={l.id} className="border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm leading-tight">{l.listingTitle}</p>
                      <Badge className={statusColors[l.status] ?? "bg-muted text-slate-600"}>
                        {l.status}
                      </Badge>
                    </div>
                    {l.listingDescription && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{l.listingDescription}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">${(l.askingRent / 100).toLocaleString()}/mo</span>
                      {l.availableDate && (
                        <span className="text-muted-foreground">
                          Available {new Date(l.availableDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {l.syndicationCount} platform{l.syndicationCount !== 1 ? "s" : ""}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {l.status !== "filled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setPublishId(l.id); setSelectedPlatforms([]) }}
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          Publish
                        </Button>
                      )}
                      {l.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={fillingId === l.id}
                          onClick={() => handleMarkFilled(l.id)}
                        >
                          <CheckSquare className="h-3 w-3 mr-1" />
                          {fillingId === l.id ? "Marking…" : "Mark Filled"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Vacancy Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Listing Title</Label>
              <Input
                placeholder="e.g. Spacious 2BR in Downtown"
                value={form.listingTitle}
                onChange={(e) => setForm((f) => ({ ...f, listingTitle: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Describe the unit…"
                value={form.listingDescription}
                onChange={(e) => setForm((f) => ({ ...f, listingDescription: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Asking Rent ($/mo)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 2000"
                  value={form.askingRent}
                  onChange={(e) => setForm((f) => ({ ...f, askingRent: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Available Date</Label>
                <Input
                  type="date"
                  value={form.availableDate}
                  onChange={(e) => setForm((f) => ({ ...f, availableDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Create Listing"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <Dialog open={!!publishId} onOpenChange={(open) => { if (!open) setPublishId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Publish to Platforms</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {PLATFORMS.map((platform) => (
              <div key={platform} className="flex items-center gap-3">
                <Checkbox
                  id={platform}
                  checked={selectedPlatforms.includes(platform)}
                  onCheckedChange={() => togglePlatform(platform)}
                />
                <Label htmlFor={platform} className="cursor-pointer">{platform}</Label>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPublishId(null)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={publishing || selectedPlatforms.length === 0}>
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
