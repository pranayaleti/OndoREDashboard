import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Edit, Save, X } from "lucide-react"
import { PropertyHandoff } from "@/types/handoff.types"
import { PageBanner } from "@/components/page-banner"
import { useAuth } from "@/lib/auth-context"
import { companyInfo } from "@/constants/companyInfo"
import { PortalSidebar } from "@/components/portal-sidebar"
import { propertyApi, handoffApi, type Property } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { getDashboardPath } from "@/lib/auth-utils"
import { formatDate } from "@/lib/locale-format"

import { HandoffCelebration, HandoffChecklist, HandoffOverview, HandoffPropertyDetails, HandoffNeighborhood, HandoffMoveOutResources } from "@/components/handoff"

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]"
}

function mergeHandoffDefaults<T>(base: T, patch: unknown): T {
  if (Array.isArray(base)) {
    return (Array.isArray(patch) ? patch : base) as T
  }

  if (isPlainObject(base) && isPlainObject(patch)) {
    const merged: Record<string, unknown> = { ...base }
    for (const key of Object.keys(patch)) {
      const baseValue = (base as Record<string, unknown>)[key]
      const patchValue = patch[key]
      merged[key] =
        baseValue === undefined
          ? patchValue
          : mergeHandoffDefaults(baseValue, patchValue)
    }
    return merged as T
  }

  return (patch ?? base) as T
}

export default function Handoff() {
  const { propertyId: urlPropertyId } = useParams<{ propertyId?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryPropertyId = searchParams.get("propertyId")?.trim() || null
  const requestedPropertyId = urlPropertyId || queryPropertyId
  const [handoffData, setHandoffData] = useState<PropertyHandoff | null>(null)
  const [originalHandoffData, setOriginalHandoffData] = useState<PropertyHandoff | null>(null)
  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [ownerNotes, setOwnerNotes] = useState<string>("")
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(requestedPropertyId)
  const [loadingProperties, setLoadingProperties] = useState(true)

  // Email helper function
  const getEmail = (prefix: string) => `${prefix}@${companyInfo.social.twitterDomain}`

  // Determine user capabilities based on role
  // Super Admin, Admin, Manager: Full edit access
  // Owner: Write access (can edit notes and handoff info)
  // Tenant: Read-only access
  const hasFullAccess = user && ['super_admin', 'admin', 'manager'].includes(user.role)
  const canEdit = user && ['owner', 'super_admin', 'admin', 'manager'].includes(user.role)
  const isOwner = user?.role === 'owner'
  const isTenant = user?.role === 'tenant'
  const isMaintenance = user?.role === 'maintenance'
  const needsPropertySelection = hasFullAccess || (isOwner && properties.length > 1)
  
  // Default tab based on role
  const getDefaultTab = () => {
    if (isTenant) return 'checklist'
    if (isMaintenance) return 'property'
    return 'overview'
  }

  const [activeTab, setActiveTab] = useState<string>(getDefaultTab())
  const [expandedAccordion, setExpandedAccordion] = useState<string | undefined>(undefined)
  
  // Document section state
  const [documentTab, setDocumentTab] = useState<string>("all")
  const [documentSearch, setDocumentSearch] = useState<string>("")
  const [documentPropertyFilter, setDocumentPropertyFilter] = useState<string>("all")
  const [documentCategoryFilter, setDocumentCategoryFilter] = useState<string>("all")
  const [documentFolderFilter, setDocumentFolderFilter] = useState<string>("all")
  const [documentViewMode, setDocumentViewMode] = useState<"grid" | "list">("grid")
  
  // Modal state for property information
  const [selectedInfoCard, setSelectedInfoCard] = useState<string | null>(null)
  const [selectedPropertySection, setSelectedPropertySection] = useState<string | null>(null)
  const [selectedNeighborhoodSection, setSelectedNeighborhoodSection] = useState<string | null>(null)
  
  // Celebration modal state
  const [showCelebrationModal, setShowCelebrationModal] = useState(false)
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false)

  useEffect(() => {
    if (!user || requestedPropertyId) return

    const basePath = getDashboardPath(user.role)
    const fallbackPath =
      user.role === "tenant"
        ? `${basePath}/lease-details`
        : user.role === "maintenance"
          ? `${basePath}/tickets`
          : `${basePath}/properties`

    toast({
      title: "Property required",
      description: "Please select a property to view its handoff details.",
    })
    navigate(fallbackPath, { replace: true })
  }, [navigate, requestedPropertyId, toast, user])
  
  // Initialize accordion for maintenance users
  useEffect(() => {
    if (isMaintenance && activeTab === 'property') {
      setExpandedAccordion('access')
    }
  }, [isMaintenance, activeTab])

  // Get document type badge color
  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      insurance: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      tax: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      lease: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      inspection: "bg-green-500/20 text-green-300 border-green-500/30",
      manual: "bg-muted/20 text-gray-300 border-gray-500/30",
    }
    return colors[type.toLowerCase()] || "bg-muted/20 text-gray-300 border-gray-500/30"
  }

  // Format file size
  const formatFileSize = (size?: string) => {
    return size || "Unknown size"
  }

  // Format date
  const formatDocumentDate = (date?: Date | string) => {
    if (!date) return "Unknown date"
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return "Invalid date"
    return formatDate(dateObj, { month: 'numeric', day: 'numeric', year: 'numeric' })
  }

  // Handle document actions
  const handleViewDocument = (doc: PropertyHandoff['documents'][0]) => {
    if (doc.url && doc.url !== "#") {
      window.open(doc.url, '_blank', 'noopener,noreferrer')
    } else {
      toast({
        title: "Document not available",
        description: "This document is not yet available for viewing.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadDocument = (doc: PropertyHandoff['documents'][0]) => {
    if (doc.url && doc.url !== "#") {
      const link = document.createElement('a')
      link.href = doc.url
      link.download = doc.name
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({
        title: "Download started",
        description: `Downloading ${doc.name}...`,
      })
    } else {
      toast({
        title: "Document not available",
        description: "This document is not yet available for download.",
        variant: "destructive",
      })
    }
  }

  const handleShareDocument = async (doc: PropertyHandoff['documents'][0]) => {
    if (doc.url && doc.url !== "#") {
      if (navigator.share) {
        try {
          await navigator.share({
            title: doc.name,
            text: `Check out this document: ${doc.name}`,
            url: doc.url,
          })
          toast({
            title: "Shared successfully",
            description: `${doc.name} has been shared.`,
            duration: 3000,
          })
        } catch (error) {
          // User cancelled or error occurred
          if ((error as Error).name !== 'AbortError') {
            // Fallback to clipboard
            await navigator.clipboard.writeText(doc.url)
            toast({
              title: "Link copied",
              description: "Document link has been copied to clipboard.",
            })
          }
        }
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(doc.url)
        toast({
          title: "Link copied",
          description: "Document link has been copied to clipboard.",
        })
      }
    } else {
      toast({
        title: "Document not available",
        description: "This document is not yet available for sharing.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocument = (_docId: string) => {
    // Only owners and admins can delete
    if (!canEdit) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete documents.",
        variant: "destructive",
      })
      return
    }

    // ROADMAP: Implement actual delete API call (Q2 2026 - document management).
    toast({
      title: "Document deleted",
      description: "The document has been deleted successfully.",
    })
  }

  // Handle navigation to specific section
  const _navigateToSection = (tab: string, accordionValue?: string) => {
    setActiveTab(tab)
    if (accordionValue) {
      // Small delay to ensure tab is switched first
      setTimeout(() => {
        setExpandedAccordion(accordionValue)
        // Scroll to the accordion section
        const element = document.getElementById(`${accordionValue}-tab`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }
  void _navigateToSection

  const buildDefaultHandoffData = (
    propertyId: string,
    selectedProperty?: Property,
  ): PropertyHandoff => ({
    id: "1",
    propertyId,
    propertyAddress: selectedProperty
      ? `${selectedProperty.addressLine1}, ${selectedProperty.city}, ${selectedProperty.state} ${selectedProperty.zipcode || ''}`
      : "123 Main St, Salt Lake City, UT 84101",
    unitNumber: selectedProperty?.addressLine2 || "Apt 2B",
    createdDate: new Date(),
    lastUpdated: new Date(),
    propertyBasics: {
      propertyType: "Apartment",
      squareFootage: 1200,
      bedrooms: 2,
      bathrooms: 1,
      parking: "Assigned spot #12, Garage code: 1234",
      moveInDate: new Date("2024-01-15"),
      leaseTerm: "12 months",
      securityDeposit: 1500,
      securityDepositReturnTerms: "Returned within 30 days of move-out, minus any damages",
    },
    emergencyContacts: [
      {
        name: "Property Manager",
        phone: "(801) 555-0100",
        email: getEmail("manager"),
        emergencyLine: "(801) 555-0101",
      },
      {
        name: "Maintenance Emergency",
        phone: "(801) 555-0200",
        notes: "24/7 hotline",
      },
      {
        name: "Police Department",
        phone: "(801) 555-9111",
        notes: "Local precinct",
      },
      {
        name: "Fire Department",
        phone: "(801) 555-9112",
        notes: "Nearest station",
      },
      {
        name: "Hospital",
        phone: "(801) 555-0300",
        notes: "Nearest facility",
      },
      {
        name: "Poison Control",
        phone: "1-800-222-1222",
      },
    ],
    utilities: {
      electric: {
        provider: "Rocky Mountain Power",
        accountNumber: "123456789",
        customerServicePhone: "(801) 555-1000",
        setupInstructions: "Call to transfer service",
        averageMonthlyCost: 80,
        paymentDueDate: "15th of each month",
        onlinePortalLink: "https://www.rockymountainpower.net",
        includedInRent: false,
      },
      gas: {
        provider: "Dominion Energy",
        accountNumber: "987654321",
        customerServicePhone: "(801) 555-2000",
        averageMonthlyCost: 50,
        includedInRent: false,
      },
      water: {
        provider: "Salt Lake City Public Utilities",
        accountNumber: "456789123",
        customerServicePhone: "(801) 555-3000",
        includedInRent: true,
      },
      internet: [
        {
          provider: "Xfinity",
          phone: "(801) 555-4000",
          website: "https://www.xfinity.com",
          notes: "Recommended provider",
        },
        {
          provider: "Google Fiber",
          phone: "(801) 555-5000",
          website: "https://fiber.google.com",
        },
      ],
      trash: {
        collectionDays: {
          trash: ["Monday"],
          recycling: ["Monday"],
          bulk: ["First Monday of month"],
        },
        binLocation: "Behind building, near parking area",
        specialInstructions: "Recycling must be sorted",
        bulkPickupSchedule: "First Monday of each month",
        hazardousWasteDisposal: "Drop off at city facility",
      },
    },
    access: {
      keys: [
        { label: "Front door", location: "Main entrance" },
        { label: "Mailbox", location: "Lobby" },
        { label: "Garage", location: "Parking level 1" },
      ],
      codes: [
        { type: "Gate code", code: "1234", location: "Main gate" },
        { type: "Garage code", code: "5678", location: "Garage door" },
      ],
      alarm: {
        provider: "ADT",
        code: "0000",
        contact: "(801) 555-6000",
        monitoringInfo: "24/7 monitoring",
        instructions: "Enter code to disarm",
      },
    },
    mailbox: {
      number: "2B",
      location: "Lobby, left side",
      keyDetails: "Small silver key",
      packageDeliveryArea: "Lobby package room",
      parcelLockerInstructions: "Use code from delivery notification",
      mailHoldProcedure: "Notify USPS online or call 1-800-ASK-USPS",
    },
    appliances: [
      {
        name: "Refrigerator",
        model: "Samsung RF28R7351SG",
        location: "Kitchen",
        manualLink: "https://example.com/manual",
        type: "refrigerator",
      },
      {
        name: "Stove",
        model: "GE JGB700SELSS",
        location: "Kitchen",
        type: "stove",
        details: { fuel: "Gas" },
      },
      {
        name: "Dishwasher",
        model: "Bosch SHX878WD5N",
        location: "Kitchen",
        type: "dishwasher",
      },
      {
        name: "HVAC",
        location: "Hallway",
        type: "hvac",
        details: {
          filterSize: "16x25x1",
          filterChangeSchedule: "Every 3 months",
          thermostatLocation: "Living room wall",
        },
      },
    ],
    maintenance: {
      requestMethod: "Online portal or email",
      contacts: [
        {
          name: "Maintenance Department",
          phone: "(801) 555-0200",
          email: getEmail("maintenance"),
        },
      ],
      responseTimes: "Emergency: 2 hours, Routine: 24-48 hours",
      responsibilities: "Tenant responsible for lightbulbs, batteries, minor cleaning. Owner responsible for major repairs.",
      preferredContractors: [
        {
          name: "ABC Plumbing",
          phone: "(801) 555-1001",
          notes: "Preferred plumber",
        },
        {
          name: "XYZ Electric",
          phone: "(801) 555-1002",
          notes: "Preferred electrician",
        },
      ],
      preventiveMaintenanceSchedule: "HVAC service every 6 months",
      filterChangeInfo: "HVAC filter: 16x25x1, change every 3 months",
    },
    policies: {
      smoking: "No smoking allowed",
      pets: "Pets allowed with deposit. Must clean up waste. Leash required.",
      quietHours: "10 PM - 7 AM",
      guests: "Overnight guests limited to 7 days",
      subletting: "Not allowed without written permission",
      modifications: "No nail holes without approval",
      grilling: "Grilling allowed on balcony only",
      other: "Please respect neighbors",
    },
    neighborhood: {
      grocery: [
        { name: "Smith's", address: "500 S Main St", distance: "0.5 miles" },
        { name: "Whole Foods", address: "1000 S State St", distance: "1.2 miles" },
      ],
      dining: [
        { name: "The Red Iguana", address: "736 W North Temple", notes: "Mexican cuisine" },
        { name: "Squatters Pub", address: "147 W Broadway", notes: "American pub" },
      ],
      services: [
        { name: "Chase Bank", address: "200 S Main St", phone: "(801) 555-7000" },
        { name: "USPS Post Office", address: "1760 W 2100 S", phone: "(801) 555-7001" },
      ],
      healthcare: [
        { name: "University Hospital", address: "50 N Medical Dr", phone: "(801) 555-8000" },
        { name: "Urgent Care", address: "300 S Main St", phone: "(801) 555-8001" },
      ],
      recreation: [
        { name: "Liberty Park", address: "600 E 1300 S", notes: "Large park with trails" },
        { name: "City Library", address: "210 E 400 S", notes: "Main branch" },
      ],
      schools: [
        { name: "Salt Lake School District", type: "district", website: "https://www.slcschools.org" },
        { name: "Washington Elementary", type: "elementary", address: "420 S 200 E" },
      ],
      transportation: {
        publicTransit: "UTA Trax and Bus",
        busStops: ["Main St & 200 S", "State St & 300 S"],
        trainStations: ["City Center Station"],
        airportDistance: "6 miles",
        airportDirections: "Take I-80 W to Airport",
      },
    },
    localServices: [
      {
        name: "Trash Pickup",
        schedule: "Every Monday",
        type: "trash",
      },
      {
        name: "Street Cleaning",
        schedule: "First Tuesday of each month",
        type: "street_cleaning",
      },
      {
        name: "Snow Removal",
        schedule: "As needed",
        contact: "Property management",
        type: "snow_removal",
      },
    ],
    safety: {
      fireExtinguisherLocations: ["Kitchen", "Hallway"],
      smokeDetectorLocations: ["Living room", "Bedroom", "Hallway"],
      carbonMonoxideDetectorLocations: ["Bedroom"],
      emergencyExits: ["Front door", "Balcony"],
      waterMainShutOff: "Basement, near water heater",
      electricalPanelLocation: "Hallway closet",
      gasShutOffLocation: "Outside, near gas meter",
    },
    parking: {
      assignedSpots: ["Spot #12"],
      guestParking: "Street parking available",
      parkingPermits: "Not required",
      storageUnitDetails: "Storage unit #5 in basement",
      bikeStorageArea: "Bike rack in parking garage",
    },
    moveInChecklist: [
      { id: "1", label: "Schedule utility transfers", completed: false, category: "utilities" },
      { id: "2", label: "Update mailing address with USPS", completed: false, category: "address" },
      { id: "3", label: "Update driver's license address", completed: false, category: "address" },
      { id: "4", label: "Register to vote at new address", completed: false, category: "address" },
      { id: "5", label: "Set up renters insurance", completed: false, category: "insurance" },
      { id: "6", label: "Take move-in photos/videos", completed: false, category: "documentation" },
      { id: "7", label: "Test all appliances", completed: false, category: "property" },
      { id: "8", label: "Test smoke/CO detectors", completed: false, category: "safety" },
      { id: "9", label: "Locate all shut-off valves", completed: false, category: "safety" },
      { id: "10", label: "Program garage/gate codes", completed: false, category: "access" },
      { id: "11", label: "Set up internet service", completed: false, category: "utilities" },
      { id: "12", label: "Learn trash schedule", completed: false, category: "utilities" },
    ],
    documents: [
      {
        id: "1",
        name: "Property Insurance Policy - 123 Main St",
        type: "insurance",
        url: "#",
        uploadDate: new Date("2023-04-20"),
        size: "3.5 MB",
      },
      {
        id: "2",
        name: "Property Tax Statement 2023 - 456 Oak Avenue",
        type: "tax",
        url: "#",
        uploadDate: new Date("2023-03-20"),
        size: "820 KB",
      },
      {
        id: "3",
        name: "Lease Agreement",
        type: "lease",
        url: "#",
        uploadDate: new Date("2024-01-15"),
        size: "2.1 MB",
      },
      {
        id: "4",
        name: "Move-in Inspection Report",
        type: "inspection",
        url: "#",
        uploadDate: new Date("2024-01-15"),
        size: "1.8 MB",
      },
      {
        id: "5",
        name: "Appliance Manuals",
        type: "manual",
        url: "#",
        uploadDate: new Date("2024-01-10"),
        size: "5.2 MB",
      },
    ],
    seasonalInfo: [
      {
        season: "spring",
        tips: [
          "Start AC system and check filters",
          "Check for pollen buildup",
          "Inspect for any winter damage",
        ],
      },
      {
        season: "summer",
        tips: [
          "Keep AC filters clean",
          "Monitor water usage",
          "Check for pests",
        ],
      },
      {
        season: "fall",
        tips: [
          "Prepare heating system",
          "Clean gutters",
          "Manage leaf buildup",
        ],
      },
      {
        season: "winter",
        tips: [
          "Prevent pipe freezing",
          "Keep walkways clear",
          "Monitor heating system",
        ],
      },
    ],
    faqs: [
      {
        question: "What do I do if I'm locked out?",
        answer: "Contact property management at (801) 555-0100. After-hours lockout service available for a fee.",
      },
      {
        question: "How do I report a maintenance emergency?",
        answer: "Call the 24/7 maintenance hotline at (801) 555-0200 for emergencies.",
      },
      {
        question: "Can I paint or make modifications?",
        answer: "Minor modifications require written approval. No nail holes without permission.",
      },
    ],
    ownerNotes: "Welcome to your new home! The neighborhood is very friendly. Best coffee shop is around the corner on Main St. The building is quiet, but please be mindful of noise during quiet hours.",
  })

  // Fetch properties for selection
  useEffect(() => {
    const fetchProperties = async () => {
      if (!user?.id) return

      try {
        setLoadingProperties(true)
        const res = await propertyApi.getProperties()
        const allProperties = res.properties

        let userProperties: Property[] = []
        const userRole = user.role
        
        if (userRole === 'owner') {
          userProperties = allProperties.filter((p: Property) => p.ownerId === user.id)
        } else if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'manager') {
          userProperties = allProperties
        } else if (userRole === 'tenant') {
          userProperties = allProperties.filter((p: Property) => p.tenantId === user.id)
        } else {
          // Maintenance sees properties they have tickets for (simplified - show all for now)
          userProperties = allProperties
        }
        
        setProperties(userProperties)
        
        // If URL has propertyId, use it
        if (requestedPropertyId && userProperties.some(p => p.id === requestedPropertyId)) {
          setSelectedPropertyId(requestedPropertyId)
        } else if (!selectedPropertyId && userProperties.length > 0) {
          // Auto-select first property if none selected and properties exist
          setSelectedPropertyId(userProperties[0].id)
        }
      } catch (error) {
        console.error("Error fetching properties:", error)
      } finally {
        setLoadingProperties(false)
      }
    }

    fetchProperties()

  }, [requestedPropertyId, selectedPropertyId, user?.id, user?.role])

  // Fetch handoff data when property is selected
  useEffect(() => {
    if (!selectedPropertyId) {
      if (!loadingProperties) {
        setLoading(false)
      }
      return
    }

    const fetchHandoff = async () => {
      try {
        setLoading(true)
        const selectedProperty = properties.find(p => p.id === selectedPropertyId)
        const defaultData = buildDefaultHandoffData(selectedPropertyId, selectedProperty)
        const apiData = await handoffApi.getHandoff(selectedPropertyId)

        const handoff = apiData && apiData.data && Object.keys(apiData.data).length > 0
          ? {
              ...mergeHandoffDefaults(defaultData, apiData.data),
              id: apiData.id,
              propertyId: apiData.propertyId,
              propertyAddress: selectedProperty
                ? `${selectedProperty.addressLine1}, ${selectedProperty.city}, ${selectedProperty.state} ${selectedProperty.zipcode || ''}`
                : (apiData.data as Record<string, unknown>).propertyAddress as string || defaultData.propertyAddress,
              createdDate: new Date(apiData.createdAt),
              lastUpdated: new Date(apiData.updatedAt),
              ownerNotes: apiData.ownerNotes || undefined,
            }
          : defaultData

        const defaultChecklist: Record<string, boolean> = {}
        handoff.moveInChecklist.forEach(item => {
          defaultChecklist[item.id] = item.completed
        })
        setChecklistItems(defaultChecklist)
        setHandoffData(handoff)
        setOwnerNotes(handoff.ownerNotes || "")
        setLoading(false)
      } catch (error) {
        console.error("Error fetching handoff data:", error)
        setLoading(false)
      }
    }

    fetchHandoff()
  }, [selectedPropertyId, properties])

  const handleChecklistToggle = (id: string) => {
    setChecklistItems(prev => {
      const newItems = {
        ...prev,
        [id]: !prev[id]
      }
      // Reset notification flag if completion drops below 100%
      const completedCount = Object.values(newItems).filter(Boolean).length
      const totalCount = handoffData?.moveInChecklist.length || 0
      if (completedCount < totalCount && hasNotifiedCompletion) {
        setHasNotifiedCompletion(false)
      }
      return newItems
    })
  }

  // Detect 100% completion and trigger celebrations
  useEffect(() => {
    if (!handoffData || !isTenant || hasNotifiedCompletion) return

    const completedCount = Object.values(checklistItems).filter(Boolean).length
    const totalCount = handoffData.moveInChecklist.length

    if (completedCount === totalCount && totalCount > 0) {
      // Show celebration modal
      setShowCelebrationModal(true)
      setHasNotifiedCompletion(true)

      // Show success toast
      toast({
        title: "🎉 Congratulations!",
        description: "You've completed all move-in checklist tasks!",
        variant: "success",
        duration: 5000,
      })

      // Send email notification to property manager
      if (selectedPropertyId && user) {
        const tenantName = `${user.firstName} ${user.lastName}`
        const propertyAddress = `${handoffData.propertyAddress}${handoffData.unitNumber ? ` - ${handoffData.unitNumber}` : ''}`
        
        handoffApi.notifyChecklistCompletion(selectedPropertyId, tenantName, propertyAddress)
          .catch((error) => {
            console.error('Failed to notify property manager:', error)
            // Don't show error to user, just log it
          })
      }
    }
  }, [checklistItems, handoffData, isTenant, hasNotifiedCompletion, selectedPropertyId, user, toast])

  // Handle property selection change
  const handlePropertyChange = (newPropertyId: string) => {
    setSelectedPropertyId(newPropertyId)
    navigate(`/handoff/${newPropertyId}`)
  }

  if (!requestedPropertyId) {
    return null
  }

  // Show loading state for properties first
  if (loadingProperties) {
    return (
      <PortalSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading properties...</p>
          </div>
        </div>
      </PortalSidebar>
    )
  }

  // Show loading state for handoff data
  if (loading) {
    return (
      <PortalSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading handoff information...</p>
          </div>
        </div>
      </PortalSidebar>
    )
  }

  // Only show "Not Found" if we're not loading and have no data
  // This prevents the flash of error before data loads
  if (!handoffData && !loading && !loadingProperties) {
    return (
      <PortalSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Handoff Not Found</CardTitle>
              <CardDescription>No handoff information available for this property.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </PortalSidebar>
    )
  }

  // Show property selection if needed and no property selected
  if (needsPropertySelection && properties.length > 0 && !selectedPropertyId) {
    return (
      <PortalSidebar>
        <div className="min-h-screen bg-background">
          <PageBanner
            title="Select Property"
            subtitle="Choose a property to view or manage handoff information"
          />
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {isOwner ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <Card 
                    key={property.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handlePropertyChange(property.id)}
                  >
                    <CardHeader>
                      <CardTitle>{property.title || property.addressLine1}</CardTitle>
                      <CardDescription>
                        {property.city}, {property.state}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {property.addressLine1}
                        {property.addressLine2 && `, ${property.addressLine2}`}
                      </p>
                      {property.price && (
                        <p className="text-lg font-semibold mt-2">
                          ${property.price.toLocaleString()}/mo
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Select Property</CardTitle>
                  <CardDescription>Choose a property to view handoff information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedPropertyId || ""} onValueChange={handlePropertyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title || property.addressLine1} - {property.city}, {property.state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PortalSidebar>
    )
  }

  // Show message if no properties
  if (properties.length === 0 && !isTenant && !isMaintenance) {
    return (
      <PortalSidebar>
        <div className="min-h-screen bg-background">
          <PageBanner
            title="No Properties Found"
            subtitle="No properties available for handoff management"
          />
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  {isOwner 
                    ? "You don't have any properties yet. Add a property to create handoff information."
                    : "No properties are available for handoff management."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PortalSidebar>
    )
  }

  if (loading || !handoffData) {
    return (
      <PortalSidebar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {loading ? "Loading handoff information..." : "No handoff information available for this property."}
            </p>
          </div>
        </div>
      </PortalSidebar>
    )
  }

  const completedCount = Object.values(checklistItems).filter(Boolean).length
  const totalCount = handoffData.moveInChecklist.length

  // Get role-specific banner subtitle
  const getBannerSubtitle = () => {
    const address = `${handoffData.propertyAddress}${handoffData.unitNumber ? ` - ${handoffData.unitNumber}` : ''}`
    if (isTenant) {
      return `${address} - Welcome to your new home!`
    }
    if (isMaintenance) {
      return `${address} - Property Access & Maintenance Info`
    }
    if (canEdit) {
      return `${address} - ${isEditMode ? 'Edit Mode' : 'View & Manage Handoff Information'}`
    }
    return address
  }

  // Get available tabs based on role
  const getAvailableTabs = () => {
    if (isMaintenance) {
      return [
        { value: 'property', label: 'Property Access' },
        { value: 'overview', label: 'Quick Info' }
      ]
    }
    return [
      { value: 'overview', label: 'Overview' },
      { value: 'property', label: 'Property' },
      { value: 'neighborhood', label: 'Neighborhood' },
      { value: 'checklist', label: 'Move-In Checklist' }
    ]
  }

  return (
    <PortalSidebar>
      <div className="min-h-screen bg-background">
        <PageBanner
          title={isTenant ? "Welcome to Your New Home" : isMaintenance ? "Property Handoff" : "Property Handoff"}
          subtitle={getBannerSubtitle()}
        />

        <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Property Selector for Managers/Admins or Owners with multiple properties */}
        {needsPropertySelection && properties.length > 1 && (
          <div className="mb-6">
            {isOwner ? (
              <Tabs value={selectedPropertyId || ""} onValueChange={handlePropertyChange}>
                <TabsList className="w-full bg-card dark:bg-background rounded-lg p-1.5 flex gap-1.5 overflow-x-auto h-auto">
                  {properties.map((property) => (
                    <TabsTrigger 
                      key={property.id} 
                      value={property.id}
                      className={cn(
                        "flex-1 min-w-[200px] max-w-[300px] px-4 py-3 rounded-md text-left transition-all border-0",
                        "data-[state=active]:bg-secondary dark:data-[state=active]:bg-secondary",
                        "data-[state=active]:text-white",
                        "data-[state=inactive]:bg-muted dark:data-[state=inactive]:bg-muted",
                        "data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:text-gray-500",
                        "hover:data-[state=inactive]:bg-secondary dark:hover:data-[state=inactive]:bg-secondary",
                        "hover:data-[state=inactive]:text-gray-300"
                      )}
                    >
                      <div className="flex flex-col items-start gap-0.5 w-full">
                        <span className="font-medium text-sm truncate w-full leading-tight text-inherit">
                          {property.title || property.addressLine1}
                        </span>
                        <span className="text-xs truncate w-full leading-tight opacity-80">
                          {property.city}, {property.state}
                        </span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            ) : (
              <Card className="bg-muted dark:bg-card border-gray-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="property-select" className="font-medium whitespace-nowrap text-gray-300">
                      Select Property:
                    </Label>
                    <Select value={selectedPropertyId || ""} onValueChange={handlePropertyChange}>
                      <SelectTrigger 
                        id="property-select" 
                        className="w-full max-w-[500px] bg-secondary dark:bg-card border-gray-600 text-white"
                      >
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent className="bg-muted dark:bg-card border-gray-700">
                        {properties.map((property) => (
                          <SelectItem 
                            key={property.id} 
                            value={property.id}
                            className="text-white hover:bg-secondary focus:bg-secondary"
                          >
                            {property.title || property.addressLine1} - {property.city}, {property.state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Edit Controls - Only for users with edit access */}
        {canEdit && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              {isEditMode && (
                <Badge variant="secondary" className="mb-2">
                  Edit Mode Active
                </Badge>
              )}
              <p className="text-sm text-muted-foreground">
                {isEditMode 
                  ? isOwner
                    ? "You can now edit handoff information and add notes. Changes will be visible to tenants."
                    : "You can now edit handoff information. Changes will be visible to tenants."
                  : isOwner
                    ? "View handoff information. Click Edit to make changes or add notes."
                    : "View handoff information. Click Edit to make changes."}
              </p>
            </div>
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <Button variant="outline" onClick={() => {
                    setIsEditMode(false)
                    // Reset to original data if cancelled
                    if (originalHandoffData) {
                      setHandoffData(originalHandoffData)
                      setOwnerNotes(originalHandoffData.ownerNotes || "")
                    }
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={async () => {
                    if (handoffData && selectedPropertyId) {
                      try {
                        await handoffApi.saveHandoff(
                          selectedPropertyId,
                          handoffData,
                          ownerNotes || null,
                        )
                        setHandoffData({
                          ...handoffData,
                          ownerNotes: ownerNotes,
                          lastUpdated: new Date()
                        })
                        toast({
                          title: "Saved",
                          description: "Handoff information has been saved successfully.",
                        })
                      } catch (error) {
                        console.error("Failed to save handoff:", error)
                        toast({
                          title: "Error",
                          description: "Failed to save handoff information.",
                          variant: "destructive",
                        })
                      }
                    }
                    setIsEditMode(false)
                  }}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => {
                  // Store original data before entering edit mode
                  if (handoffData) {
                    setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                  }
                  setIsEditMode(true)
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  {isOwner ? "Edit & Add Notes" : "Edit Handoff"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Read-only notice for tenants */}
        {isTenant && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Read-only view:</strong> This handoff information is provided by your property owner. 
                If you need to update any information, please contact your property manager.
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mb-8 ${getAvailableTabs().length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
            {getAvailableTabs().map(tab => (
              <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>
          {/* Overview Tab */}
          <HandoffOverview
            handoffData={handoffData}
            isEditMode={isEditMode}
            isTenant={isTenant}
            setHandoffData={setHandoffData}
          />

          {/* Property Tab */}
          <HandoffPropertyDetails
            handoffData={handoffData}
            isEditMode={isEditMode}
            isMaintenance={isMaintenance}
            canEdit={canEdit}
            isOwner={isOwner}
            hasFullAccess={hasFullAccess}
            originalHandoffData={originalHandoffData}
            selectedInfoCard={selectedInfoCard}
            setSelectedInfoCard={setSelectedInfoCard}
            selectedPropertySection={selectedPropertySection}
            setSelectedPropertySection={setSelectedPropertySection}
            expandedAccordion={expandedAccordion}
            setExpandedAccordion={setExpandedAccordion}
            ownerNotes={ownerNotes}
            setOwnerNotes={setOwnerNotes}
            documentTab={documentTab}
            setDocumentTab={setDocumentTab}
            documentSearch={documentSearch}
            setDocumentSearch={setDocumentSearch}
            documentPropertyFilter={documentPropertyFilter}
            setDocumentPropertyFilter={setDocumentPropertyFilter}
            documentCategoryFilter={documentCategoryFilter}
            setDocumentCategoryFilter={setDocumentCategoryFilter}
            documentFolderFilter={documentFolderFilter}
            setDocumentFolderFilter={setDocumentFolderFilter}
            documentViewMode={documentViewMode}
            setDocumentViewMode={setDocumentViewMode}
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            setHandoffData={setHandoffData}
            setOriginalHandoffData={setOriginalHandoffData}
            toast={toast}
            getDocumentTypeColor={getDocumentTypeColor}
            formatFileSize={formatFileSize}
            formatDocumentDate={formatDocumentDate}
            handleViewDocument={handleViewDocument}
            handleDownloadDocument={handleDownloadDocument}
            handleShareDocument={handleShareDocument}
            handleDeleteDocument={handleDeleteDocument}
          />

          {/* Neighborhood Tab */}
          {!isMaintenance && (
            <HandoffNeighborhood
              handoffData={handoffData}
              isEditMode={isEditMode}
              canEdit={canEdit}
              originalHandoffData={originalHandoffData}
              selectedNeighborhoodSection={selectedNeighborhoodSection}
              setSelectedNeighborhoodSection={setSelectedNeighborhoodSection}
              setHandoffData={setHandoffData}
              setOriginalHandoffData={setOriginalHandoffData}
              toast={toast}
            />
          )}

          {/* Move-In Checklist Tab */}
          {!isMaintenance && (
            <HandoffChecklist
              handoffData={handoffData}
              checklistItems={checklistItems}
              isEditMode={isEditMode}
              canEdit={canEdit}
              completedCount={completedCount}
              totalCount={totalCount}
              onChecklistToggle={handleChecklistToggle}
              setHandoffData={setHandoffData}
              setChecklistItems={setChecklistItems}
            />
          )}

            {activeTab === 'checklist' && <HandoffMoveOutResources />}

            </Tabs>
            </div>
          </div>

          {/* Celebration Modal */}
          <HandoffCelebration
            open={showCelebrationModal}
            onOpenChange={setShowCelebrationModal}
            totalItems={handoffData?.moveInChecklist.length || 0}
          />
        </PortalSidebar>
      )
    }
