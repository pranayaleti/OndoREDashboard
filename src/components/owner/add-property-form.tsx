"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, Building, Plus, Image as ImageIcon, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { propertyApi } from "@/lib/api"
import { useS3Upload } from "@/hooks/useS3Upload"
import { DEFAULT_US_COUNTRY, DEFAULT_US_COUNTRY_CODE } from "@/constants"
import { normalizeUSPhone, validateUSPhone, validateUSZip } from "@/lib/us-format"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { AddressForm, type AddressFormValues, type AddressUsageType } from "@/components/forms/address-form"
import { cn } from "@/lib/utils"

interface AddPropertyFormState {
  title: string
  type: string
  addressType: AddressUsageType
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipcode: string
  description: string
  price: string
  bedrooms: string
  bathrooms: string
  sqft: string
  phone: string
  website: string
  leaseTerms: string
  fees: string
  availability: string
  specialties: string[]
  services: string[]
  valueRanges: string[]
  amenities: string[]
  specialtiesInput: string
  servicesInput: string
  valueRangesInput: string
  rating: string
  reviewCount: string
}

interface FileWithPreview extends File {
  preview?: string
}

export function AddPropertyForm() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const { uploadMultiplePhotos, isUploading } = useS3Upload()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const uploadedFilesRef = useRef<FileWithPreview[]>([])

  // Predefined amenities list
  const predefinedAmenities = [
    { key: "parking", label: "Parking" },
    { key: "gym", label: "Gym/Fitness Center" },
    { key: "pool", label: "Swimming Pool" },
    { key: "laundry", label: "Laundry Facilities" },
    { key: "elevator", label: "Elevator" },
    { key: "balcony", label: "Balcony/Terrace" },
    { key: "air_conditioning", label: "Air Conditioning" },
    { key: "heating", label: "Heating" },
    { key: "dishwasher", label: "Dishwasher" },
    { key: "microwave", label: "Microwave" },
    { key: "refrigerator", label: "Refrigerator" },
    { key: "washer_dryer", label: "Washer/Dryer" },
    { key: "internet", label: "Internet/WiFi" },
    { key: "cable_tv", label: "Cable TV" },
    { key: "security", label: "Security System" },
    { key: "doorman", label: "Doorman/Concierge" },
    { key: "pet_friendly", label: "Pet Friendly" },
    { key: "garden", label: "Garden/Yard" },
    { key: "fireplace", label: "Fireplace" },
    { key: "storage", label: "Storage Space" },
  ]

  const [formData, setFormData] = useState<AddPropertyFormState>({
    title: "",
    type: "",
    addressType: "home",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipcode: "",
    description: "",
    
    // Property Details
    price: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    
    // Contact & Business Info
    phone: "",
    website: "",
    
    // Property Management Details
    leaseTerms: "",
    fees: "",
    availability: "",
    
    // Arrays
    specialties: [] as string[],
    services: [] as string[],
    valueRanges: [] as string[],
    amenities: [] as string[],
    
    // Raw input values for comma-separated fields
    specialtiesInput: "",
    servicesInput: "",
    valueRangesInput: "",
    
    // Rating fields
    rating: "",
    reviewCount: "",
  })

  const formatPhoneInput = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let nextValue = value

    if (name === "phone") {
      nextValue = formatPhoneInput(value)
    } else if (name === "zipcode") {
      nextValue = value.replace(/[^\d-]/g, "").slice(0, 10)
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddressFormChange = (nextAddress: AddressFormValues) => {
    setFormData((prev) => ({
      ...prev,
      addressType: nextAddress.addressType ?? prev.addressType,
      addressLine1: nextAddress.addressLine1,
      addressLine2: nextAddress.addressLine2,
      city: nextAddress.city,
      state: nextAddress.state,
      zipcode: nextAddress.postalCode,
    }))
  }

  const handleArrayFieldBlur = (fieldName: string, value: string) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item.length > 0)
    setFormData((prev) => ({
      ...prev,
      [fieldName]: arrayValue
    }))
  }

  // File handling with preview
  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return
    
    const validFiles: FileWithPreview[] = []
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit. Please choose a smaller file.`,
          variant: "destructive",
        })
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        })
        return
      }
      
      const fileWithPreview: FileWithPreview = file
      fileWithPreview.preview = URL.createObjectURL(file)
      validFiles.push(fileWithPreview)
    })
    
    setUploadedFiles((prev) => {
      const newFiles = [...prev, ...validFiles]
      uploadedFilesRef.current = newFiles
      return newFiles
    })
  }, [toast])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    processFiles(e.dataTransfer.files)
  }, [processFiles])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only set isDragging to false if we're actually leaving the drop zone container
    // The dragLeave event fires when moving from parent to child, so we need to check
    // if the relatedTarget is still within the drop zone
    const dropZone = dropZoneRef.current
    const relatedTarget = e.relatedTarget
    
    // If relatedTarget is null or not a Node, we're leaving the drop zone
    if (!relatedTarget || !(relatedTarget instanceof Node)) {
      setIsDragging(false)
      return
    }
    
    // If relatedTarget is still within the drop zone (moving to a child element),
    // don't change the dragging state
    if (dropZone && dropZone.contains(relatedTarget)) {
      return
    }
    
    // We're actually leaving the drop zone
    setIsDragging(false)
  }, [])

  const removeFile = (index: number) => {
    const file = uploadedFiles[index]
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index)
      uploadedFilesRef.current = newFiles
      return newFiles
    })
  }

  // Cleanup blob URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Revoke all blob URLs when component unmounts
      uploadedFilesRef.current.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to add a property.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Property title is required.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!formData.type) {
      toast({
        title: "Validation Error",
        description: "Property type is required.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (formData.phone && !validateUSPhone(formData.phone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid US phone number (e.g., (555) 123-4567).",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (formData.zipcode && !validateUSZip(formData.zipcode)) {
      toast({
        title: "Invalid ZIP code",
        description: "ZIP codes must be 5 digits or ZIP+4 (e.g., 12345 or 12345-6789).",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Convert string values to appropriate types for API
      const normalizedPhone = formData.phone ? normalizeUSPhone(formData.phone) : ""
      const propertyData = {
        ...formData,
        state: formData.state || undefined,
        country: DEFAULT_US_COUNTRY,
        // Convert numeric fields
        price: formData.price ? parseFloat(formData.price) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        sqft: formData.sqft ? parseInt(formData.sqft) : undefined,
        rating: formData.rating ? parseFloat(formData.rating) : undefined,
        reviewCount: formData.reviewCount ? parseInt(formData.reviewCount) : undefined,
        // Include array fields
        specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
        services: formData.services.length > 0 ? formData.services : undefined,
        valueRanges: formData.valueRanges.length > 0 ? formData.valueRanges : undefined,
        // Remove empty strings
        website: formData.website || undefined,
        phone: normalizedPhone ? `${DEFAULT_US_COUNTRY_CODE}${normalizedPhone}` : undefined,
        leaseTerms: formData.leaseTerms || undefined,
        fees: formData.fees || undefined,
        availability: formData.availability || undefined,
        zipcode: formData.zipcode || undefined,
      }

      // Create the property
      const newProperty = await propertyApi.createProperty(propertyData)

      // Upload photos if any using S3
      if (uploadedFiles.length > 0) {
        try {
          const uploadResults = await uploadMultiplePhotos(uploadedFiles, {
            propertyId: newProperty.id,
            orderIndex: 0,
          })
          
          uploadResults.filter(result => !result.success)
        } catch (photoError) {
          console.error("Failed to upload photos:", photoError)
        }
      }

      // Clean up preview URLs
      uploadedFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })

      toast({
        title: "Property added",
        description: "The property has been successfully added to your portfolio.",
      })

      navigate("/owner/properties")
    } catch (error) {
      console.error("Error adding property:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was an error adding the property. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <Breadcrumb items={[
          { label: "Properties", href: "/owner/properties", icon: Building },
          { label: "Add Property", icon: Plus }
        ]} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Basic Information</CardTitle>
                <CardDescription>Essential details about your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Property Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Sunset Apartments"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="h-10"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-sm font-medium">
                    Property Type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger id="type" className="h-10">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <AddressForm
                  value={{
                    addressType: formData.addressType,
                    addressLine1: formData.addressLine1,
                    addressLine2: formData.addressLine2,
                    city: formData.city,
                    state: formData.state,
                    postalCode: formData.zipcode,
                  }}
                  onChange={handleAddressFormChange}
                  disabled={isSubmitting || isUploading}
                  idPrefix="property"
                />

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Property Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the property, its features, and what makes it special..."
                    value={formData.description}
                    onChange={handleChange}
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a detailed description to attract potential tenants
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Property Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Property Specifications</CardTitle>
                <CardDescription>Rental details and property features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price" className="text-sm font-medium">Monthly Rent ($)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="e.g. 1850"
                      value={formData.price}
                      onChange={handleChange}
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sqft" className="text-sm font-medium">Square Footage</Label>
                    <Input
                      id="sqft"
                      name="sqft"
                      type="number"
                      placeholder="e.g. 950"
                      value={formData.sqft}
                      onChange={handleChange}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bedrooms" className="text-sm font-medium">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      name="bedrooms"
                      type="number"
                      min="0"
                      placeholder="e.g. 2"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bathrooms" className="text-sm font-medium">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      name="bathrooms"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 2"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="availability" className="text-sm font-medium">Availability</Label>
                  <Input
                    id="availability"
                    name="availability"
                    placeholder="e.g. Immediate, Available Jan 1, 2024"
                    value={formData.availability}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact & Management Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Contact & Management Information</CardTitle>
                <CardDescription>Contact details and management terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Contact Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="e.g. (801) 555-1234"
                      value={formData.phone}
                      onChange={handleChange}
                      inputMode="tel"
                      className="h-10"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      placeholder="e.g. www.property.com"
                      value={formData.website}
                      onChange={handleChange}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="leaseTerms" className="text-sm font-medium">Lease Terms</Label>
                  <Textarea
                    id="leaseTerms"
                    name="leaseTerms"
                    placeholder="e.g. 12-month minimum lease term with option to renew. $50 application fee per adult."
                    value={formData.leaseTerms}
                    onChange={handleChange}
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fees" className="text-sm font-medium">Management Fees</Label>
                  <Textarea
                    id="fees"
                    name="fees"
                    placeholder="e.g. Management fee: 8% of monthly rent. Leasing fee: 50% of first month's rent."
                    value={formData.fees}
                    onChange={handleChange}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Property Categories</CardTitle>
                <CardDescription>Define specialties, services, and value ranges</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="specialties" className="text-sm font-medium">Specialties</Label>
                  <Input
                    id="specialties"
                    name="specialtiesInput"
                    placeholder="e.g. Luxury, Pet-friendly, Student housing"
                    value={formData.specialtiesInput}
                    onChange={handleChange}
                    onBlur={(e) => handleArrayFieldBlur('specialties', e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter specialties separated by commas
                  </p>
                  {formData.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.specialties.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="services" className="text-sm font-medium">Services</Label>
                  <Input
                    id="services"
                    name="servicesInput"
                    placeholder="e.g. 24/7 maintenance, Concierge, Housekeeping"
                    value={formData.servicesInput}
                    onChange={handleChange}
                    onBlur={(e) => handleArrayFieldBlur('services', e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter services separated by commas
                  </p>
                  {formData.services.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.services.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="valueRanges" className="text-sm font-medium">Value Ranges</Label>
                  <Input
                    id="valueRanges"
                    name="valueRangesInput"
                    placeholder="e.g. $1000-2000, $2000-3000, Premium"
                    value={formData.valueRangesInput}
                    onChange={handleChange}
                    onBlur={(e) => handleArrayFieldBlur('valueRanges', e.target.value)}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter value ranges separated by commas
                  </p>
                  {formData.valueRanges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.valueRanges.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Property Photos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Photos</CardTitle>
                <CardDescription>Upload photos of your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  ref={dropZoneRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div className={cn(
                      "rounded-full p-3 transition-colors",
                      isDragging ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Upload className={cn(
                        "h-6 w-6 transition-colors",
                        isDragging ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {isDragging ? "Drop images here" : "Drag and drop images here"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        or click to browse
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF up to 10MB each
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {uploadedFiles.length} {uploadedFiles.length === 1 ? 'photo' : 'photos'} selected
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                            {file.preview ? (
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(index)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1 truncate" title={file.name}>
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Amenities</CardTitle>
                <CardDescription>Select available amenities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {predefinedAmenities.map((amenity) => (
                    <div key={amenity.key} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`amenity-${amenity.key}`}
                        checked={formData.amenities.includes(amenity.key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData((prev) => ({
                              ...prev,
                              amenities: [...prev.amenities, amenity.key],
                            }))
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              amenities: prev.amenities.filter((key) => key !== amenity.key),
                            }))
                          }
                        }}
                      />
                      <Label
                        htmlFor={`amenity-${amenity.key}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {amenity.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.amenities.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      {formData.amenities.length} {formData.amenities.length === 1 ? 'amenity' : 'amenities'} selected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rating & Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rating & Reviews</CardTitle>
                <CardDescription>Property rating information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="rating" className="text-sm font-medium">Property Rating (1-5)</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    placeholder="e.g. 4.5"
                    value={formData.rating}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reviewCount" className="text-sm font-medium">Number of Reviews</Label>
                  <Input
                    id="reviewCount"
                    name="reviewCount"
                    type="number"
                    min="0"
                    placeholder="e.g. 25"
                    value={formData.reviewCount}
                    onChange={handleChange}
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive">*</span> Required fields
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/owner/properties")}
              className="flex-1 sm:flex-none"
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Adding Property...
                </>
              ) : isUploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading Photos...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Add Property
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}




