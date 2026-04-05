"use client"

import { useState, type FormEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { MAINTENANCE_PRIORITIES, MAINTENANCE_CATEGORIES } from "@/constants/maintenance.constants"
import { type Property } from "@/lib/api"

interface NewMaintenanceRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit?: (data: {
    title: string
    description: string
    category: string
    priority: string
    property?: string
    tenant?: string
    photos: File[]
    photoUrl?: string
  }) => void | Promise<void>
  defaultProperty?: string
  defaultTenant?: string
  showPropertyField?: boolean
  showTenantField?: boolean
  properties?: Property[]
}

export function NewMaintenanceRequestDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultProperty,
  defaultTenant,
  showPropertyField = false,
  showTenantField = false,
  properties = [],
}: NewMaintenanceRequestDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    property: defaultProperty || "",
    tenant: defaultTenant || "",
    photos: [] as File[],
    photoUrl: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update tenant when property is selected
  useEffect(() => {
    if (formData.property && properties.length > 0) {
      const selectedProperty = properties.find(p => p.id === formData.property)
      if (selectedProperty?.tenant) {
        const tenantName = `${selectedProperty.tenant.firstName} ${selectedProperty.tenant.lastName}`
        setFormData(prev => ({ ...prev, tenant: tenantName }))
      } else {
        setFormData(prev => ({ ...prev, tenant: "" }))
      }
    }
  }, [formData.property, properties])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      if (onSubmit) {
        await onSubmit({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          property: showPropertyField ? formData.property : undefined,
          tenant: showTenantField ? formData.tenant : undefined,
          photos: formData.photos,
          photoUrl: formData.photoUrl.trim() || undefined,
        })
      }

      // Reset form
      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        property: defaultProperty || "",
        tenant: defaultTenant || "",
        photos: [],
        photoUrl: "",
      })

      toast({
        title: "Request Submitted",
        description: "Your maintenance request has been submitted successfully.",
      })

      onOpenChange(false)
    } catch (error: unknown) {
      console.error("Error submitting maintenance request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Failed to submit maintenance request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newFiles],
      }))
    }
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Reset form when closing
      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        property: defaultProperty || "",
        tenant: defaultTenant || "",
        photos: [],
        photoUrl: "",
      })
    } else if (newOpen) {
      // Reset property/tenant when dialog opens
      setFormData(prev => ({
        ...prev,
        property: defaultProperty || "",
        tenant: defaultTenant || "",
      }))
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Maintenance Request</DialogTitle>
          <DialogDescription>Submit a new maintenance request with detailed information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          {showPropertyField && (
            <div>
              <Label htmlFor="property">Property *</Label>
              {properties.length > 0 ? (
                <Select
                  value={formData.property}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, property: value }))}
                  required={showPropertyField}
                >
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{property.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {property.addressLine1}, {property.city}
                            {property.state && `, ${property.state}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="property"
                  value={formData.property}
                  onChange={(e) => setFormData((prev) => ({ ...prev, property: e.target.value }))}
                  placeholder="123 Main St, Apt 4B"
                  required={showPropertyField}
                />
              )}
            </div>
          )}

          {showTenantField && (
            <div>
              <Label htmlFor="tenant">Tenant *</Label>
              <Input
                id="tenant"
                value={formData.tenant}
                onChange={(e) => setFormData((prev) => ({ ...prev, tenant: e.target.value }))}
                placeholder="John Smith"
                required={showTenantField}
                disabled={formData.property && properties.find(p => p.id === formData.property)?.tenant ? true : false}
              />
              {formData.property && properties.find(p => p.id === formData.property)?.tenant && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tenant auto-filled from selected property
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger 
                  id="category"
                  className="w-full"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  {MAINTENANCE_CATEGORIES.map((category) => (
                    <SelectItem 
                      key={category.value} 
                      value={category.value}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-center text-center">
                        <span className="font-medium">{category.label}</span>
                        {category.description && (
                          <span className="text-xs text-muted-foreground">{category.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger 
                  id="priority"
                  className="w-full"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  {MAINTENANCE_PRIORITIES.map((priority) => (
                    <SelectItem 
                      key={priority.value} 
                      value={priority.value}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col items-center text-center">
                        <span className="font-medium">{priority.label}</span>
                        <span className="text-xs text-muted-foreground">{priority.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide a detailed description of the issue, including when it started, what you've tried, and any other relevant information..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="photoUrl">Photo URL (optional)</Label>
            <Input
              id="photoUrl"
              type="url"
              value={formData.photoUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, photoUrl: e.target.value }))}
              placeholder="https://… (link to a photo of the issue)"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="font-semibold">Photos</span>
              <span className="text-sm font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <div className="space-y-3">
              <div className="border rounded-md p-4 flex flex-col items-center justify-center bg-muted/30">
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Click to upload photos</p>
                <p className="text-xs text-muted-foreground mb-3">JPG, PNG or GIF up to 10MB each</p>
                <input
                  id="photos"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => document.getElementById('photos')?.click()}
                >
                  Choose Files
                </Button>
              </div>
              {formData.photos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Selected photos ({formData.photos.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]">{photo.name}</span>
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

