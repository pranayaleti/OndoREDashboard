import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { TabsContent } from "@/components/ui/tabs"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Zap,
  Key,
  Mail,
  Wrench,
  FileText,
  Shield,
  Car,
  Calendar,
  Building,
  HelpCircle,
  Lightbulb,
  Download,
  ExternalLink,
  X,
  Save,
  Eye,
  Share2,
  Trash2,
  MoreHorizontal,
  FileIcon,
  Search,
  Upload,
  Grid3x3,
  List,
  Sun,
  Leaf,
  Snowflake,
  Wind,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PropertyHandoff } from "@/types/handoff.types"
import type { Property } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface HandoffPropertyDetailsProps {
  handoffData: PropertyHandoff
  isEditMode: boolean
  isMaintenance: boolean
  canEdit: boolean | null | undefined
  isOwner: boolean
  hasFullAccess: boolean | null | undefined
  originalHandoffData: PropertyHandoff | null
  selectedInfoCard: string | null
  setSelectedInfoCard: (section: string | null) => void
  selectedPropertySection: string | null
  setSelectedPropertySection: (section: string | null) => void
  expandedAccordion: string | undefined
  setExpandedAccordion: (value: string | undefined) => void
  ownerNotes: string
  setOwnerNotes: (notes: string) => void
  documentTab: string
  setDocumentTab: (tab: string) => void
  documentSearch: string
  setDocumentSearch: (search: string) => void
  documentPropertyFilter: string
  setDocumentPropertyFilter: (filter: string) => void
  documentCategoryFilter: string
  setDocumentCategoryFilter: (filter: string) => void
  documentFolderFilter: string
  setDocumentFolderFilter: (filter: string) => void
  documentViewMode: "grid" | "list"
  setDocumentViewMode: (mode: "grid" | "list") => void
  properties: Property[]
  selectedPropertyId: string | null
  setHandoffData: (data: PropertyHandoff) => void
  setOriginalHandoffData: (data: PropertyHandoff | null) => void
  toast: ReturnType<typeof useToast>['toast']
  getDocumentTypeColor: (type: string) => string
  formatFileSize: (size?: string) => string
  formatDocumentDate: (date?: Date | string) => string
  handleViewDocument: (doc: PropertyHandoff["documents"][0]) => void
  handleDownloadDocument: (doc: PropertyHandoff["documents"][0]) => void
  handleShareDocument: (doc: PropertyHandoff["documents"][0]) => void
  handleDeleteDocument: (docId: string) => void
}

export function HandoffPropertyDetails({
  handoffData,
  isEditMode,
  isMaintenance,
  canEdit,
  isOwner,
  hasFullAccess,
  originalHandoffData,
  selectedInfoCard,
  setSelectedInfoCard,
  selectedPropertySection,
  setSelectedPropertySection,
  expandedAccordion,
  setExpandedAccordion,
  ownerNotes,
  setOwnerNotes,
  documentTab,
  setDocumentTab,
  documentSearch,
  setDocumentSearch,
  documentPropertyFilter,
  setDocumentPropertyFilter,
  documentCategoryFilter,
  setDocumentCategoryFilter,
  documentFolderFilter,
  setDocumentFolderFilter,
  documentViewMode,
  setDocumentViewMode,
  properties,
  selectedPropertyId,
  setHandoffData,
  setOriginalHandoffData,
  toast,
  getDocumentTypeColor,
  formatFileSize,
  formatDocumentDate,
  handleViewDocument,
  handleDownloadDocument,
  handleShareDocument,
  handleDeleteDocument,
}: HandoffPropertyDetailsProps) {
  return (
    <>
          <TabsContent value="property" className="space-y-6">
            {isMaintenance && (
              <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                    <Wrench className="h-5 w-5" />
                    Maintenance Access Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    This view shows property access information and maintenance details needed for service requests.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Property Information Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Utilities Card */}
              {!isMaintenance && (
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                  onClick={() => setSelectedPropertySection('utilities')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <Zap className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">Utilities & Services</CardTitle>
                      <CardDescription className="text-gray-400">Electric, water, internet, trash</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Access & Security Card */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                onClick={() => setSelectedPropertySection('access')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <Key className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-1">Property Access & Security</CardTitle>
                    <CardDescription className="text-gray-400">Keys, codes, and access info</CardDescription>
                  </div>
                </CardContent>
              </Card>

              {/* Mailbox Card */}
              {!isMaintenance && (
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                  onClick={() => setSelectedPropertySection('mailbox')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <Mail className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">Mailbox & Packages</CardTitle>
                      <CardDescription className="text-gray-400">Mailbox location and delivery info</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Appliances Card */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                onClick={() => setSelectedPropertySection('appliances')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                    <Building className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-1">Appliances & Systems</CardTitle>
                    <CardDescription className="text-gray-400">Appliances and their details</CardDescription>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Card */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                onClick={() => setSelectedPropertySection('maintenance')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <Wrench className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-1">Maintenance & Repairs</CardTitle>
                    <CardDescription className="text-gray-400">Request methods and contractors</CardDescription>
                  </div>
                </CardContent>
              </Card>

              {/* House Rules Card */}
              {!isMaintenance && (
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                  onClick={() => setSelectedPropertySection('policies')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <FileText className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">House Rules & Policies</CardTitle>
                      <CardDescription className="text-gray-400">Property rules and guidelines</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Safety Card */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                onClick={() => setSelectedPropertySection('safety')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <Shield className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg mb-1">Safety & Security</CardTitle>
                    <CardDescription className="text-gray-400">Safety equipment and procedures</CardDescription>
                  </div>
                </CardContent>
              </Card>

              {/* Parking Card */}
              {!isMaintenance && (
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                  onClick={() => setSelectedPropertySection('parking')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
                      <Car className="h-6 w-6 text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">Parking & Storage</CardTitle>
                      <CardDescription className="text-gray-400">Parking spots and storage info</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Documents Card */}
              {!isMaintenance && (
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                  onClick={() => setSelectedPropertySection('documents')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                      <FileText className="h-6 w-6 text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">Important Documents</CardTitle>
                      <CardDescription className="text-gray-400">Lease, insurance, and more</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Seasonal Info Card */}
              {!isMaintenance && (
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                  onClick={() => setSelectedPropertySection('seasonal')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                      <Calendar className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">Seasonal Information</CardTitle>
                      <CardDescription className="text-gray-400">Seasonal tips and reminders</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* FAQs Card */}
              {!isMaintenance && (
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                  onClick={() => setSelectedPropertySection('faqs')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                      <HelpCircle className="h-6 w-6 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">Frequently Asked Questions</CardTitle>
                      <CardDescription className="text-gray-400">Common questions and answers</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Owner Notes Card */}
              {!isMaintenance && (
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-muted hover:bg-secondary"
                  onClick={() => setSelectedPropertySection('notes')}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <Lightbulb className="h-6 w-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">Owner's Personal Tips & Notes</CardTitle>
                      <CardDescription className="text-gray-400">Helpful tips from the owner</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Legacy Accordion - Hidden but kept for reference */}
            <div className="hidden">
            <Accordion 
              type="single" 
              collapsible 
              className="w-full" 
              value={expandedAccordion}
              onValueChange={(value) => setExpandedAccordion(value)}
            >
              {/* Utilities - Hidden for maintenance */}
              {!isMaintenance && (
                <AccordionItem value="utilities" id="utilities-tab">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Utilities & Services
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    {/* Electric */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Electric</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Provider</p>
                            <p className="font-medium">{handoffData.utilities.electric.provider}</p>
                          </div>
                          {handoffData.utilities.electric.accountNumber && (
                            <div>
                              <p className="text-sm text-muted-foreground">Account Number</p>
                              <p className="font-medium">{handoffData.utilities.electric.accountNumber}</p>
                            </div>
                          )}
                          {handoffData.utilities.electric.customerServicePhone && (
                            <div>
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-medium">{handoffData.utilities.electric.customerServicePhone}</p>
                            </div>
                          )}
                          {handoffData.utilities.electric.averageMonthlyCost && (
                            <div>
                              <p className="text-sm text-muted-foreground">Average Monthly Cost</p>
                              <p className="font-medium">${handoffData.utilities.electric.averageMonthlyCost}</p>
                            </div>
                          )}
                        </div>
                        {handoffData.utilities.electric.setupInstructions && (
                          <p className="text-sm"><strong>Setup:</strong> {handoffData.utilities.electric.setupInstructions}</p>
                        )}
                        {handoffData.utilities.electric.includedInRent && (
                          <Badge variant="secondary">Included in Rent</Badge>
                        )}
                      </CardContent>
                    </Card>

                    {/* Gas */}
                    {handoffData.utilities.gas && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Gas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Provider</p>
                              <p className="font-medium">{handoffData.utilities.gas.provider}</p>
                            </div>
                            {handoffData.utilities.gas.accountNumber && (
                              <div>
                                <p className="text-sm text-muted-foreground">Account Number</p>
                                <p className="font-medium">{handoffData.utilities.gas.accountNumber}</p>
                              </div>
                            )}
                            {handoffData.utilities.gas.customerServicePhone && (
                              <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-medium">{handoffData.utilities.gas.customerServicePhone}</p>
                              </div>
                            )}
                          </div>
                          {handoffData.utilities.gas.includedInRent && (
                            <Badge variant="secondary">Included in Rent</Badge>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Water */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Water/Sewer</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Provider</p>
                            <p className="font-medium">{handoffData.utilities.water.provider}</p>
                          </div>
                          {handoffData.utilities.water.accountNumber && (
                            <div>
                              <p className="text-sm text-muted-foreground">Account Number</p>
                              <p className="font-medium">{handoffData.utilities.water.accountNumber}</p>
                            </div>
                          )}
                        </div>
                        {handoffData.utilities.water.includedInRent && (
                          <Badge variant="secondary">Included in Rent</Badge>
                        )}
                      </CardContent>
                    </Card>

                    {/* Internet */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Internet/Cable</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {handoffData.utilities.internet.map((service, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <p className="font-semibold">{service.provider}</p>
                              {service.phone && <p className="text-sm text-muted-foreground">{service.phone}</p>}
                              {service.website && (
                                <a href={service.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                  Visit website <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {service.notes && <p className="text-sm text-muted-foreground mt-1">{service.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Trash */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Trash & Recycling</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Collection Days</p>
                          <p className="font-medium">Trash: {handoffData.utilities.trash.collectionDays.trash.join(", ")}</p>
                          <p className="font-medium">Recycling: {handoffData.utilities.trash.collectionDays.recycling.join(", ")}</p>
                          {handoffData.utilities.trash.collectionDays.bulk.length > 0 && (
                            <p className="font-medium">Bulk: {handoffData.utilities.trash.collectionDays.bulk.join(", ")}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bin Location</p>
                          <p className="font-medium">{handoffData.utilities.trash.binLocation}</p>
                        </div>
                        {handoffData.utilities.trash.specialInstructions && (
                          <p className="text-sm"><strong>Instructions:</strong> {handoffData.utilities.trash.specialInstructions}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
              )}

              {/* Access & Security - Always visible */}
              <AccordionItem value="access" id="access-tab">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Property Access & Security
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    {/* Keys */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Keys</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {handoffData.access.keys.map((key, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{key.label}</p>
                                  {key.location && <p className="text-sm text-muted-foreground">Location: {key.location}</p>}
                                  {key.notes && <p className="text-sm text-muted-foreground">{key.notes}</p>}
                                </div>
                                {key.photoUrl && (
                                  <img src={key.photoUrl} alt={key.label} className="h-12 w-12 rounded object-cover ml-3 cursor-pointer hover:opacity-80" onClick={() => window.open(key.photoUrl, '_blank')} />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Codes */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Access Codes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {handoffData.access.codes.map((code, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <p className="font-medium">{code.type}</p>
                              <p className="text-lg font-mono">{code.code}</p>
                              {code.location && <p className="text-sm text-muted-foreground">Location: {code.location}</p>}
                              {code.instructions && <p className="text-sm text-muted-foreground">{code.instructions}</p>}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Alarm */}
                    {handoffData.access.alarm && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Alarm System</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {handoffData.access.alarm.provider && (
                            <div>
                              <p className="text-sm text-muted-foreground">Provider</p>
                              <p className="font-medium">{handoffData.access.alarm.provider}</p>
                            </div>
                          )}
                          {handoffData.access.alarm.code && (
                            <div>
                              <p className="text-sm text-muted-foreground">Code</p>
                              <p className="font-lg font-mono">{handoffData.access.alarm.code}</p>
                            </div>
                          )}
                          {handoffData.access.alarm.instructions && (
                            <p className="text-sm">{handoffData.access.alarm.instructions}</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Garage Door Openers */}
                    {handoffData.access.garageDoorOpeners && handoffData.access.garageDoorOpeners.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Garage Door Openers</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {handoffData.access.garageDoorOpeners.map((opener, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium">{opener.label}</p>
                                    {opener.code && <p className="text-sm font-mono">Code: {opener.code}</p>}
                                    {opener.remoteLocation && <p className="text-sm text-muted-foreground">Remote location: {opener.remoteLocation}</p>}
                                    {opener.duplicateInfo && <p className="text-sm text-muted-foreground">Duplicate info: {opener.duplicateInfo}</p>}
                                  </div>
                                  {opener.photoUrl && (
                                    <img src={opener.photoUrl} alt={opener.label} className="h-12 w-12 rounded object-cover ml-3 cursor-pointer hover:opacity-80" onClick={() => window.open(opener.photoUrl, '_blank')} />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Key Duplication Info */}
                    {handoffData.access.keyDuplicationInfo && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Key Duplication</CardTitle>
                          <CardDescription>Where to get copies of keys made</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{handoffData.access.keyDuplicationInfo}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Mailbox - Hidden for maintenance */}
              {!isMaintenance && (
                <AccordionItem value="mailbox">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Mailbox & Packages
                    </div>
                  </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Mailbox Number</p>
                        <p className="font-medium">{handoffData.mailbox.number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{handoffData.mailbox.location}</p>
                      </div>
                      {handoffData.mailbox.keyDetails && (
                        <div>
                          <p className="text-sm text-muted-foreground">Key Details</p>
                          <p className="font-medium">{handoffData.mailbox.keyDetails}</p>
                        </div>
                      )}
                      {handoffData.mailbox.packageDeliveryArea && (
                        <div>
                          <p className="text-sm text-muted-foreground">Package Delivery Area</p>
                          <p className="font-medium">{handoffData.mailbox.packageDeliveryArea}</p>
                        </div>
                      )}
                      {handoffData.mailbox.parcelLockerInstructions && (
                        <div>
                          <p className="text-sm text-muted-foreground">Parcel Locker Instructions</p>
                          <p className="font-medium">{handoffData.mailbox.parcelLockerInstructions}</p>
                        </div>
                      )}
                      {handoffData.mailbox.mailHoldProcedure && (
                        <div>
                          <p className="text-sm text-muted-foreground">Mail Hold Procedure</p>
                          <p className="font-medium">{handoffData.mailbox.mailHoldProcedure}</p>
                        </div>
                      )}
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-sm font-medium">Remember to update your address with USPS</p>
                        <a href="https://www.usps.com/manage/change-of-address.htm" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                          Change of Address Form <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
              )}

              {/* Appliances - Show for maintenance, hidden sections for others */}
              <AccordionItem value="appliances">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Appliances & Systems
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {handoffData.appliances.map((appliance, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg">{appliance.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {appliance.model && (
                            <div>
                              <p className="text-sm text-muted-foreground">Model</p>
                              <p className="font-medium">{appliance.model}</p>
                            </div>
                          )}
                          {appliance.location && (
                            <div>
                              <p className="text-sm text-muted-foreground">Location</p>
                              <p className="font-medium">{appliance.location}</p>
                            </div>
                          )}
                          {appliance.manualLink && (
                            <a href={appliance.manualLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                              View Manual <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {appliance.instructions && (
                            <p className="text-sm">{appliance.instructions}</p>
                          )}
                          {appliance.details && Object.entries(appliance.details).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                              <p className="font-medium">{value}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Maintenance */}
              <AccordionItem value="maintenance" id="maintenance-tab">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Maintenance & Repairs
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>How to Submit Requests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{handoffData.maintenance.requestMethod}</p>
                        <div className="mt-4 space-y-2">
                          {handoffData.maintenance.contacts.map((contact, index) => (
                            <div key={index}>
                              <p className="font-medium">{contact.name}</p>
                              {contact.phone && <p className="text-sm text-muted-foreground">{contact.phone}</p>}
                              {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Response Times</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{handoffData.maintenance.responseTimes}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Responsibilities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{handoffData.maintenance.responsibilities}</p>
                      </CardContent>
                    </Card>

                    {handoffData.maintenance.preferredContractors && handoffData.maintenance.preferredContractors.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Preferred Contractors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {handoffData.maintenance.preferredContractors.map((contractor, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <p className="font-medium">{contractor.name}</p>
                                {contractor.phone && <p className="text-sm text-muted-foreground">{contractor.phone}</p>}
                                {contractor.notes && <p className="text-sm text-muted-foreground">{contractor.notes}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* House Rules - Hidden for maintenance */}
              {!isMaintenance && (
                <AccordionItem value="policies">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      House Rules & Policies
                    </div>
                  </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <p className="font-semibold">Smoking</p>
                        <p className="text-sm text-muted-foreground">{handoffData.policies.smoking}</p>
                      </div>
                      {handoffData.policies.pets && (
                        <div>
                          <p className="font-semibold">Pets</p>
                          <p className="text-sm text-muted-foreground">{handoffData.policies.pets}</p>
                        </div>
                      )}
                      {handoffData.policies.quietHours && (
                        <div>
                          <p className="font-semibold">Quiet Hours</p>
                          <p className="text-sm text-muted-foreground">{handoffData.policies.quietHours}</p>
                        </div>
                      )}
                      {handoffData.policies.guests && (
                        <div>
                          <p className="font-semibold">Guests</p>
                          <p className="text-sm text-muted-foreground">{handoffData.policies.guests}</p>
                        </div>
                      )}
                      {handoffData.policies.modifications && (
                        <div>
                          <p className="font-semibold">Modifications</p>
                          <p className="text-sm text-muted-foreground">{handoffData.policies.modifications}</p>
                        </div>
                      )}
                      {handoffData.policies.grilling && (
                        <div>
                          <p className="font-semibold">Grilling</p>
                          <p className="text-sm text-muted-foreground">{handoffData.policies.grilling}</p>
                        </div>
                      )}
                      {handoffData.policies.other && (
                        <div>
                          <p className="font-semibold">Other</p>
                          <p className="text-sm text-muted-foreground">{handoffData.policies.other}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
              )}

              {/* Safety - Always visible */}
              <AccordionItem value="safety">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Safety & Security
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      {handoffData.safety.fireExtinguisherLocations && handoffData.safety.fireExtinguisherLocations.length > 0 && (
                        <div>
                          <p className="font-semibold">Fire Extinguisher Locations</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {handoffData.safety.fireExtinguisherLocations.map((loc, i) => (
                              <li key={i}>{loc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {handoffData.safety.smokeDetectorLocations && handoffData.safety.smokeDetectorLocations.length > 0 && (
                        <div>
                          <p className="font-semibold">Smoke Detector Locations</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {handoffData.safety.smokeDetectorLocations.map((loc, i) => (
                              <li key={i}>{loc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {handoffData.safety.waterMainShutOff && (
                        <div>
                          <p className="font-semibold">Water Main Shut-Off</p>
                          <p className="text-sm text-muted-foreground">{handoffData.safety.waterMainShutOff}</p>
                        </div>
                      )}
                      {handoffData.safety.electricalPanelLocation && (
                        <div>
                          <p className="font-semibold">Electrical Panel</p>
                          <p className="text-sm text-muted-foreground">{handoffData.safety.electricalPanelLocation}</p>
                        </div>
                      )}
                      {handoffData.safety.gasShutOffLocation && (
                        <div>
                          <p className="font-semibold">Gas Shut-Off</p>
                          <p className="text-sm text-muted-foreground">{handoffData.safety.gasShutOffLocation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Parking */}
              <AccordionItem value="parking">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Parking & Storage
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6 space-y-3">
                      {handoffData.parking.assignedSpots && handoffData.parking.assignedSpots.length > 0 && (
                        <div>
                          <p className="font-semibold">Assigned Parking Spots</p>
                          <p className="text-sm text-muted-foreground">{handoffData.parking.assignedSpots.join(", ")}</p>
                        </div>
                      )}
                      {handoffData.parking.guestParking && (
                        <div>
                          <p className="font-semibold">Guest Parking</p>
                          <p className="text-sm text-muted-foreground">{handoffData.parking.guestParking}</p>
                        </div>
                      )}
                      {handoffData.parking.storageUnitDetails && (
                        <div>
                          <p className="font-semibold">Storage Unit</p>
                          <p className="text-sm text-muted-foreground">{handoffData.parking.storageUnitDetails}</p>
                        </div>
                      )}
                      {handoffData.parking.bikeStorageArea && (
                        <div>
                          <p className="font-semibold">Bike Storage</p>
                          <p className="text-sm text-muted-foreground">{handoffData.parking.bikeStorageArea}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Documents - Hidden for maintenance */}
              {!isMaintenance && (
                <AccordionItem value="documents">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Important Documents
                    </div>
                  </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {/* Document Management Header */}
                    <Card className="bg-muted dark:bg-card border-gray-700">
                      <CardContent className="p-4 space-y-4">
                        {/* Tabs and View Toggle */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <Tabs value={documentTab} onValueChange={setDocumentTab} className="flex-1">
                            <TabsList className="bg-card dark:bg-background border border-gray-700 h-9">
                              <TabsTrigger 
                                value="all" 
                                className="data-[state=active]:bg-secondary data-[state=active]:text-white px-4"
                              >
                                All Documents
                              </TabsTrigger>
                              <TabsTrigger 
                                value="recent" 
                                className="data-[state=active]:bg-secondary data-[state=active]:text-white px-4"
                              >
                                Recent
                              </TabsTrigger>
                              <TabsTrigger 
                                value="shared" 
                                className="data-[state=active]:bg-secondary data-[state=active]:text-white px-4"
                              >
                                Shared
                              </TabsTrigger>
                              <TabsTrigger 
                                value="folders" 
                                className="data-[state=active]:bg-secondary data-[state=active]:text-white px-4"
                              >
                                Folders
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={documentViewMode === "grid" ? "default" : "ghost"}
                              size="icon"
                              onClick={() => setDocumentViewMode("grid")}
                              className="h-8 w-8 bg-secondary hover:bg-muted data-[state=active]:bg-muted"
                            >
                              <Grid3x3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={documentViewMode === "list" ? "default" : "ghost"}
                              size="icon"
                              onClick={() => setDocumentViewMode("list")}
                              className="h-8 w-8 bg-secondary hover:bg-muted data-[state=active]:bg-muted"
                            >
                              <List className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col md:flex-row gap-3">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search documents..."
                              value={documentSearch}
                              onChange={(e) => setDocumentSearch(e.target.value)}
                              className="pl-10 bg-card dark:bg-background border-gray-700 text-white placeholder:text-gray-500"
                            />
                          </div>
                          <Select value={documentPropertyFilter} onValueChange={setDocumentPropertyFilter}>
                            <SelectTrigger className="w-full md:w-[160px] bg-card dark:bg-background border-gray-700 text-white">
                              <SelectValue placeholder="All Properties" />
                            </SelectTrigger>
                            <SelectContent className="bg-muted border-gray-700">
                              <SelectItem value="all">All Properties</SelectItem>
                              {properties.map((prop) => (
                                <SelectItem key={prop.id} value={prop.id}>
                                  {prop.title || prop.addressLine1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={documentCategoryFilter} onValueChange={setDocumentCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[160px] bg-card dark:bg-background border-gray-700 text-white">
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="bg-muted border-gray-700">
                              <SelectItem value="all">All Categories</SelectItem>
                              <SelectItem value="insurance">Insurance</SelectItem>
                              <SelectItem value="tax">Tax</SelectItem>
                              <SelectItem value="lease">Lease</SelectItem>
                              <SelectItem value="inspection">Inspection</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={documentFolderFilter} onValueChange={setDocumentFolderFilter}>
                            <SelectTrigger className="w-full md:w-[160px] bg-card dark:bg-background border-gray-700 text-white">
                              <SelectValue placeholder="All Folders" />
                            </SelectTrigger>
                            <SelectContent className="bg-muted border-gray-700">
                              <SelectItem value="all">All Folders</SelectItem>
                              <SelectItem value="legal">Legal</SelectItem>
                              <SelectItem value="financial">Financial</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                          {canEdit && (
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Document
                            </Button>
                          )}
                          <Button variant="outline" className="border-gray-700 bg-muted hover:bg-secondary text-white">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Filtered Documents List */}
                    {(() => {
                      // Handle folders tab
                      if (documentTab === "folders") {
                        return (
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400">Folders feature coming soon</p>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      }

                      const filteredDocs = handoffData.documents.filter((doc) => {
                        const matchesSearch = doc.name.toLowerCase().includes(documentSearch.toLowerCase())
                        const matchesCategory = documentCategoryFilter === "all" || doc.type.toLowerCase() === documentCategoryFilter.toLowerCase()
                        const matchesProperty = documentPropertyFilter === "all" || documentPropertyFilter === selectedPropertyId
                        const matchesFolder = documentFolderFilter === "all" // ROADMAP: Add folder property to documents (Q2 2026).
                        
                        if (documentTab === "recent") {
                          const oneMonthAgo = new Date()
                          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
                          return matchesSearch && matchesCategory && matchesProperty && matchesFolder && doc.uploadDate && doc.uploadDate >= oneMonthAgo
                        }
                        if (documentTab === "shared") {
                          // Mock shared documents - in real app, this would check a shared property
                          return matchesSearch && matchesCategory && matchesProperty && matchesFolder && ["1", "3"].includes(doc.id)
                        }
                        
                        return matchesSearch && matchesCategory && matchesProperty && matchesFolder
                      })

                      if (filteredDocs.length === 0) {
                        return (
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400">No documents found</p>
                                {documentSearch && (
                                  <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      }

                      return (
                        <div className={cn(
                          documentViewMode === "grid" 
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                            : "space-y-4"
                        )}>
                          {filteredDocs.map((doc) => (
                            <Card key={doc.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 flex-shrink-0">
                                      <FileIcon className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-white mb-1 truncate">{doc.name}</h4>
                                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                        <span>{formatFileSize(doc.size)}</span>
                                        <span>•</span>
                                        <span>{formatDocumentDate(doc.uploadDate)}</span>
                                      </div>
                                      <div className="flex items-center gap-3 flex-wrap">
                                        <Badge 
                                          variant="outline" 
                                          className={cn("text-xs", getDocumentTypeColor(doc.type))}
                                        >
                                          {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                          <Building className="h-3 w-3" />
                                          <span className="truncate">{handoffData.propertyAddress}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">More options</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          View
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                                          <Download className="h-4 w-4 mr-2" />
                                          Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleShareDocument(doc)}>
                                          <Share2 className="h-4 w-4 mr-2" />
                                          Share
                                        </DropdownMenuItem>
                                        {canEdit && (
                                          <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                              onClick={() => handleDeleteDocument(doc.id)}
                                              className="text-red-400 focus:text-red-300"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </AccordionContent>
              </AccordionItem>
              )}

              {/* Seasonal Info - Hidden for maintenance */}
              {!isMaintenance && (
                <AccordionItem value="seasonal">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Seasonal Information
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {handoffData.seasonalInfo.map((season, index) => {
                      const icons = {
                        spring: <Leaf className="h-4 w-4" />,
                        summer: <Sun className="h-4 w-4" />,
                        fall: <Wind className="h-4 w-4" />,
                        winter: <Snowflake className="h-4 w-4" />
                      }
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 capitalize">
                              {icons[season.season]}
                              {season.season}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {season.tips.map((tip, tipIndex) => (
                                <li key={tipIndex}>{tip}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
              )}

              {/* FAQs - Hidden for maintenance */}
              {!isMaintenance && (
                <AccordionItem value="faqs">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Frequently Asked Questions
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Card>
                    <CardContent className="pt-6">
                      <Accordion type="single" collapsible>
                        {handoffData.faqs.map((faq, index) => (
                          <AccordionItem key={index} value={`faq-${index}`}>
                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
              )}

              {/* Owner Notes - Hidden for maintenance */}
              {!isMaintenance && (
                <AccordionItem value="notes">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Owner's Personal Tips & Notes
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-6">
                        {isEditMode && (isOwner || hasFullAccess) ? (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="owner-notes" className="text-sm font-medium mb-2 block">
                                Add or update notes for tenants
                              </Label>
                              <Textarea
                                id="owner-notes"
                                value={ownerNotes}
                                onChange={(e) => setOwnerNotes(e.target.value)}
                                placeholder="Add helpful tips, neighborhood secrets, restaurant recommendations, or any other information you'd like to share with tenants..."
                                rows={8}
                                className="min-h-[200px]"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                These notes will be visible to tenants and help them settle into their new home.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {handoffData.ownerNotes ? (
                              <p className="whitespace-pre-line">{handoffData.ownerNotes}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                {isOwner 
                                  ? "No notes added yet. Click 'Edit & Add Notes' to add helpful information for tenants."
                                  : "No owner notes available."}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
            </div>
          </TabsContent>

      {/* Property Information Modal */}
      <Dialog open={selectedInfoCard !== null} onOpenChange={(open) => !open && setSelectedInfoCard(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedInfoCard === 'utilities' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Zap className="h-6 w-6" />
                      Utilities & Services
                    </DialogTitle>
                    <DialogDescription>Complete utility setup and service information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    {/* Electric */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Electric</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Provider</p>
                            <p className="font-medium">{handoffData.utilities.electric.provider}</p>
                          </div>
                          {handoffData.utilities.electric.accountNumber && (
                            <div>
                              <p className="text-sm text-muted-foreground">Account Number</p>
                              <p className="font-medium">{handoffData.utilities.electric.accountNumber}</p>
                            </div>
                          )}
                          {handoffData.utilities.electric.customerServicePhone && (
                            <div>
                              <p className="text-sm text-muted-foreground">Customer Service</p>
                              <p className="font-medium">{handoffData.utilities.electric.customerServicePhone}</p>
                            </div>
                          )}
                          {handoffData.utilities.electric.averageMonthlyCost && (
                            <div>
                              <p className="text-sm text-muted-foreground">Average Monthly Cost</p>
                              <p className="font-medium">${handoffData.utilities.electric.averageMonthlyCost}</p>
                            </div>
                          )}
                        </div>
                        {handoffData.utilities.electric.setupInstructions && (
                          <div>
                            <p className="text-sm text-muted-foreground">Setup Instructions</p>
                            <p className="text-sm">{handoffData.utilities.electric.setupInstructions}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Water */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Water & Sewer</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Provider</p>
                            <p className="font-medium">{handoffData.utilities.water.provider}</p>
                          </div>
                          {handoffData.utilities.water.accountNumber && (
                            <div>
                              <p className="text-sm text-muted-foreground">Account Number</p>
                              <p className="font-medium">{handoffData.utilities.water.accountNumber}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Internet */}
                    {handoffData.utilities.internet && handoffData.utilities.internet.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Internet & Cable</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {handoffData.utilities.internet.map((service, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <p className="font-medium">{service.provider}</p>
                                {service.phone && <p className="text-sm text-muted-foreground">{service.phone}</p>}
                                {service.website && (
                                  <a href={service.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                                    {service.website}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Trash */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Trash & Recycling</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Collection Days</p>
                          <p className="font-medium">
                            Trash: {handoffData.utilities.trash.collectionDays.trash.join(', ')}
                          </p>
                          <p className="font-medium">
                            Recycling: {handoffData.utilities.trash.collectionDays.recycling.join(', ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Bin Location</p>
                          <p className="font-medium">{handoffData.utilities.trash.binLocation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {selectedInfoCard === 'access' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Key className="h-6 w-6" />
                      Access & Security
                    </DialogTitle>
                    <DialogDescription>Keys, codes, and security information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    {/* Keys */}
                    {handoffData.access.keys && handoffData.access.keys.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Keys</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {handoffData.access.keys.map((key, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <p className="font-medium">{key.label}</p>
                                {key.location && <p className="text-sm text-muted-foreground">Location: {key.location}</p>}
                                {key.notes && <p className="text-sm text-muted-foreground">{key.notes}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Access Codes */}
                    {handoffData.access.codes && handoffData.access.codes.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Access Codes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {handoffData.access.codes.map((code, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <p className="font-medium">{code.type}</p>
                                <p className="text-lg font-mono">{code.code}</p>
                                {code.location && <p className="text-sm text-muted-foreground">Location: {code.location}</p>}
                                {code.instructions && <p className="text-sm text-muted-foreground">{code.instructions}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Alarm */}
                    {handoffData.access.alarm && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Alarm System</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {handoffData.access.alarm.provider && (
                            <div>
                              <p className="text-sm text-muted-foreground">Provider</p>
                              <p className="font-medium">{handoffData.access.alarm.provider}</p>
                            </div>
                          )}
                          {handoffData.access.alarm.code && (
                            <div>
                              <p className="text-sm text-muted-foreground">Code</p>
                              <p className="font-medium font-mono">{handoffData.access.alarm.code}</p>
                            </div>
                          )}
                          {handoffData.access.alarm.instructions && (
                            <div>
                              <p className="text-sm text-muted-foreground">Instructions</p>
                              <p className="text-sm">{handoffData.access.alarm.instructions}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
              )}

              {selectedInfoCard === 'maintenance' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Wrench className="h-6 w-6" />
                      Maintenance & Repairs
                    </DialogTitle>
                    <DialogDescription>How to request maintenance and important information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Request Method</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{handoffData.maintenance.requestMethod}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Response Times</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{handoffData.maintenance.responseTimes}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Responsibilities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{handoffData.maintenance.responsibilities}</p>
                      </CardContent>
                    </Card>

                    {handoffData.maintenance.preferredContractors && handoffData.maintenance.preferredContractors.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Preferred Contractors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {handoffData.maintenance.preferredContractors.map((contractor, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <p className="font-medium">{contractor.name}</p>
                                <p className="text-sm text-muted-foreground">{contractor.phone}</p>
                                {contractor.notes && <p className="text-sm text-muted-foreground">{contractor.notes}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {handoffData.maintenance.preventiveMaintenanceSchedule && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Preventive Maintenance Schedule</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>{handoffData.maintenance.preventiveMaintenanceSchedule}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
              )}
        </DialogContent>
      </Dialog>

      {/* Property Section Modal */}
      <Dialog open={selectedPropertySection !== null} onOpenChange={(open) => !open && setSelectedPropertySection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedPropertySection === 'utilities' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Zap className="h-6 w-6" />
                      Utilities & Services
                    </DialogTitle>
                    <DialogDescription>Complete utility setup and service information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    {/* Electric */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Electric</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Provider</Label>
                            {isEditMode ? (
                              <Input
                                value={handoffData.utilities.electric.provider}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  utilities: {
                                    ...handoffData.utilities,
                                    electric: {
                                      ...handoffData.utilities.electric,
                                      provider: e.target.value
                                    }
                                  }
                                })}
                                className="mt-1"
                              />
                            ) : (
                              <p className="font-medium mt-1">{handoffData.utilities.electric.provider}</p>
                            )}
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Account Number</Label>
                            {isEditMode ? (
                              <Input
                                value={handoffData.utilities.electric.accountNumber || ""}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  utilities: {
                                    ...handoffData.utilities,
                                    electric: {
                                      ...handoffData.utilities.electric,
                                      accountNumber: e.target.value || undefined
                                    }
                                  }
                                })}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            ) : (
                              handoffData.utilities.electric.accountNumber && (
                                <p className="font-medium mt-1">{handoffData.utilities.electric.accountNumber}</p>
                              )
                            )}
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Customer Service</Label>
                            {isEditMode ? (
                              <Input
                                value={handoffData.utilities.electric.customerServicePhone || ""}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  utilities: {
                                    ...handoffData.utilities,
                                    electric: {
                                      ...handoffData.utilities.electric,
                                      customerServicePhone: e.target.value || undefined
                                    }
                                  }
                                })}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            ) : (
                              handoffData.utilities.electric.customerServicePhone && (
                                <p className="font-medium mt-1">{handoffData.utilities.electric.customerServicePhone}</p>
                              )
                            )}
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Average Monthly Cost</Label>
                            {isEditMode ? (
                              <Input
                                type="number"
                                value={handoffData.utilities.electric.averageMonthlyCost || ""}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  utilities: {
                                    ...handoffData.utilities,
                                    electric: {
                                      ...handoffData.utilities.electric,
                                      averageMonthlyCost: e.target.value ? parseFloat(e.target.value) : undefined
                                    }
                                  }
                                })}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            ) : (
                              handoffData.utilities.electric.averageMonthlyCost && (
                                <p className="font-medium mt-1">${handoffData.utilities.electric.averageMonthlyCost}</p>
                              )
                            )}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Setup Instructions</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.utilities.electric.setupInstructions || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                utilities: {
                                  ...handoffData.utilities,
                                  electric: {
                                    ...handoffData.utilities.electric,
                                    setupInstructions: e.target.value || undefined
                                  }
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={3}
                            />
                          ) : (
                            handoffData.utilities.electric.setupInstructions && (
                              <p className="text-sm mt-1">{handoffData.utilities.electric.setupInstructions}</p>
                            )
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditMode ? (
                            <>
                              <input
                                type="checkbox"
                                id="electric-included"
                                checked={handoffData.utilities.electric.includedInRent || false}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  utilities: {
                                    ...handoffData.utilities,
                                    electric: {
                                      ...handoffData.utilities.electric,
                                      includedInRent: e.target.checked
                                    }
                                  }
                                })}
                                className="rounded"
                              />
                              <Label htmlFor="electric-included" className="cursor-pointer">Included in Rent</Label>
                            </>
                          ) : (
                            handoffData.utilities.electric.includedInRent && (
                              <Badge variant="secondary">Included in Rent</Badge>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Gas */}
                    {(handoffData.utilities.gas || isEditMode) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Gas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">Provider</Label>
                              {isEditMode ? (
                                <Input
                                  value={handoffData.utilities.gas?.provider || ""}
                                  onChange={(e) => setHandoffData({
                                    ...handoffData,
                                    utilities: {
                                      ...handoffData.utilities,
                                      gas: {
                                        ...(handoffData.utilities.gas || { includedInRent: false }),
                                        provider: e.target.value
                                      }
                                    }
                                  })}
                                  className="mt-1"
                                />
                              ) : (
                                handoffData.utilities.gas && <p className="font-medium mt-1">{handoffData.utilities.gas.provider}</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Account Number</Label>
                              {isEditMode ? (
                                <Input
                                  value={handoffData.utilities.gas?.accountNumber || ""}
                                  onChange={(e) => setHandoffData({
                                    ...handoffData,
                                    utilities: {
                                      ...handoffData.utilities,
                                      gas: {
                                        ...(handoffData.utilities.gas || { provider: "", includedInRent: false }),
                                        accountNumber: e.target.value || undefined
                                      }
                                    }
                                  })}
                                  className="mt-1"
                                  placeholder="Optional"
                                />
                              ) : (
                                handoffData.utilities.gas?.accountNumber && (
                                  <p className="font-medium mt-1">{handoffData.utilities.gas.accountNumber}</p>
                                )
                              )}
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Phone</Label>
                              {isEditMode ? (
                                <Input
                                  value={handoffData.utilities.gas?.customerServicePhone || ""}
                                  onChange={(e) => setHandoffData({
                                    ...handoffData,
                                    utilities: {
                                      ...handoffData.utilities,
                                      gas: {
                                        ...(handoffData.utilities.gas || { provider: "", includedInRent: false }),
                                        customerServicePhone: e.target.value || undefined
                                      }
                                    }
                                  })}
                                  className="mt-1"
                                  placeholder="Optional"
                                />
                              ) : (
                                handoffData.utilities.gas?.customerServicePhone && (
                                  <p className="font-medium mt-1">{handoffData.utilities.gas.customerServicePhone}</p>
                                )
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isEditMode ? (
                              <>
                                <input
                                  type="checkbox"
                                  id="gas-included"
                                  checked={handoffData.utilities.gas?.includedInRent || false}
                                  onChange={(e) => setHandoffData({
                                    ...handoffData,
                                    utilities: {
                                      ...handoffData.utilities,
                                      gas: {
                                        ...(handoffData.utilities.gas || { provider: "" }),
                                        includedInRent: e.target.checked
                                      }
                                    }
                                  })}
                                  className="rounded"
                                />
                                <Label htmlFor="gas-included" className="cursor-pointer">Included in Rent</Label>
                              </>
                            ) : (
                              handoffData.utilities.gas?.includedInRent && (
                                <Badge variant="secondary">Included in Rent</Badge>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Water */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Water & Sewer</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Provider</Label>
                            {isEditMode ? (
                              <Input
                                value={handoffData.utilities.water.provider}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  utilities: {
                                    ...handoffData.utilities,
                                    water: {
                                      ...handoffData.utilities.water,
                                      provider: e.target.value
                                    }
                                  }
                                })}
                                className="mt-1"
                              />
                            ) : (
                              <p className="font-medium mt-1">{handoffData.utilities.water.provider}</p>
                            )}
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Account Number</Label>
                            {isEditMode ? (
                              <Input
                                value={handoffData.utilities.water.accountNumber || ""}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  utilities: {
                                    ...handoffData.utilities,
                                    water: {
                                      ...handoffData.utilities.water,
                                      accountNumber: e.target.value || undefined
                                    }
                                  }
                                })}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            ) : (
                              handoffData.utilities.water.accountNumber && (
                                <p className="font-medium mt-1">{handoffData.utilities.water.accountNumber}</p>
                              )
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditMode ? (
                            <>
                              <input
                                type="checkbox"
                                id="water-included"
                                checked={handoffData.utilities.water.includedInRent || false}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  utilities: {
                                    ...handoffData.utilities,
                                    water: {
                                      ...handoffData.utilities.water,
                                      includedInRent: e.target.checked
                                    }
                                  }
                                })}
                                className="rounded"
                              />
                              <Label htmlFor="water-included" className="cursor-pointer">Included in Rent</Label>
                            </>
                          ) : (
                            handoffData.utilities.water.includedInRent && (
                              <Badge variant="secondary">Included in Rent</Badge>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Internet */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Internet & Cable</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {handoffData.utilities.internet.map((service, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-3">
                              {isEditMode ? (
                                <>
                                  <div>
                                    <Label className="text-sm font-semibold">Provider</Label>
                                    <Input
                                      value={service.provider}
                                      onChange={(e) => {
                                        const updatedInternet = [...handoffData.utilities.internet]
                                        updatedInternet[index] = { ...service, provider: e.target.value }
                                        setHandoffData({
                                          ...handoffData,
                                          utilities: {
                                            ...handoffData.utilities,
                                            internet: updatedInternet
                                          }
                                        })
                                      }}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Phone</Label>
                                    <Input
                                      value={service.phone || ""}
                                      onChange={(e) => {
                                        const updatedInternet = [...handoffData.utilities.internet]
                                        updatedInternet[index] = { ...service, phone: e.target.value || undefined }
                                        setHandoffData({
                                          ...handoffData,
                                          utilities: {
                                            ...handoffData.utilities,
                                            internet: updatedInternet
                                          }
                                        })
                                      }}
                                      className="mt-1"
                                      placeholder="Optional"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Website</Label>
                                    <Input
                                      value={service.website || ""}
                                      onChange={(e) => {
                                        const updatedInternet = [...handoffData.utilities.internet]
                                        updatedInternet[index] = { ...service, website: e.target.value || undefined }
                                        setHandoffData({
                                          ...handoffData,
                                          utilities: {
                                            ...handoffData.utilities,
                                            internet: updatedInternet
                                          }
                                        })
                                      }}
                                      className="mt-1"
                                      placeholder="Optional"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Notes</Label>
                                    <Textarea
                                      value={service.notes || ""}
                                      onChange={(e) => {
                                        const updatedInternet = [...handoffData.utilities.internet]
                                        updatedInternet[index] = { ...service, notes: e.target.value || undefined }
                                        setHandoffData({
                                          ...handoffData,
                                          utilities: {
                                            ...handoffData.utilities,
                                            internet: updatedInternet
                                          }
                                        })
                                      }}
                                      className="mt-1"
                                      placeholder="Optional"
                                      rows={2}
                                    />
                                  </div>
                                  {handoffData.utilities.internet.length > 1 && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const updatedInternet = handoffData.utilities.internet.filter((_, i) => i !== index)
                                        setHandoffData({
                                          ...handoffData,
                                          utilities: {
                                            ...handoffData.utilities,
                                            internet: updatedInternet
                                          }
                                        })
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <p className="font-semibold">{service.provider}</p>
                                  {service.phone && <p className="text-sm text-muted-foreground">{service.phone}</p>}
                                  {service.website && (
                                    <a href={service.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                      Visit website <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                  {service.notes && <p className="text-sm text-muted-foreground mt-1">{service.notes}</p>}
                                </>
                              )}
                            </div>
                          ))}
                          {isEditMode && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setHandoffData({
                                  ...handoffData,
                                  utilities: {
                                    ...handoffData.utilities,
                                    internet: [...handoffData.utilities.internet, { provider: "" }]
                                  }
                                })
                              }}
                            >
                              Add Internet Service
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Trash */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Trash & Recycling</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Collection Days (comma-separated)</Label>
                          {isEditMode ? (
                            <div className="space-y-2 mt-2">
                              <div>
                                <Label className="text-xs">Trash Days</Label>
                                <Input
                                  value={handoffData.utilities.trash.collectionDays.trash.join(", ")}
                                  onChange={(e) => setHandoffData({
                                    ...handoffData,
                                    utilities: {
                                      ...handoffData.utilities,
                                      trash: {
                                        ...handoffData.utilities.trash,
                                        collectionDays: {
                                          ...handoffData.utilities.trash.collectionDays,
                                          trash: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                        }
                                      }
                                    }
                                  })}
                                  className="mt-1"
                                  placeholder="e.g., Monday, Wednesday, Friday"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Recycling Days</Label>
                                <Input
                                  value={handoffData.utilities.trash.collectionDays.recycling.join(", ")}
                                  onChange={(e) => setHandoffData({
                                    ...handoffData,
                                    utilities: {
                                      ...handoffData.utilities,
                                      trash: {
                                        ...handoffData.utilities.trash,
                                        collectionDays: {
                                          ...handoffData.utilities.trash.collectionDays,
                                          recycling: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                        }
                                      }
                                    }
                                  })}
                                  className="mt-1"
                                  placeholder="e.g., Tuesday, Thursday"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Bulk Pickup Days (optional)</Label>
                                <Input
                                  value={handoffData.utilities.trash.collectionDays.bulk.join(", ")}
                                  onChange={(e) => setHandoffData({
                                    ...handoffData,
                                    utilities: {
                                      ...handoffData.utilities,
                                      trash: {
                                        ...handoffData.utilities.trash,
                                        collectionDays: {
                                          ...handoffData.utilities.trash.collectionDays,
                                          bulk: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                        }
                                      }
                                    }
                                  })}
                                  className="mt-1"
                                  placeholder="e.g., First Monday of month"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <p className="font-medium">Trash: {handoffData.utilities.trash.collectionDays.trash.join(", ")}</p>
                              <p className="font-medium">Recycling: {handoffData.utilities.trash.collectionDays.recycling.join(", ")}</p>
                              {handoffData.utilities.trash.collectionDays.bulk.length > 0 && (
                                <p className="font-medium">Bulk: {handoffData.utilities.trash.collectionDays.bulk.join(", ")}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Bin Location</Label>
                          {isEditMode ? (
                            <Input
                              value={handoffData.utilities.trash.binLocation}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                utilities: {
                                  ...handoffData.utilities,
                                  trash: {
                                    ...handoffData.utilities.trash,
                                    binLocation: e.target.value
                                  }
                                }
                              })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="font-medium mt-1">{handoffData.utilities.trash.binLocation}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Special Instructions</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.utilities.trash.specialInstructions || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                utilities: {
                                  ...handoffData.utilities,
                                  trash: {
                                    ...handoffData.utilities.trash,
                                    specialInstructions: e.target.value || undefined
                                  }
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={3}
                            />
                          ) : (
                            handoffData.utilities.trash.specialInstructions && (
                              <p className="text-sm mt-1"><strong>Instructions:</strong> {handoffData.utilities.trash.specialInstructions}</p>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            description: "Utilities & Services information has been updated.",
                            duration: 3000,
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'access' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Key className="h-6 w-6" />
                      Property Access & Security
                    </DialogTitle>
                    <DialogDescription>Keys, codes, and security information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    {/* Keys */}
                    {(handoffData.access.keys && handoffData.access.keys.length > 0 || isEditMode) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Keys</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {(handoffData.access.keys || []).map((key, index) => (
                              <div key={index} className="p-3 border rounded-lg space-y-2">
                                {isEditMode ? (
                                  <>
                                    <div>
                                      <Label className="text-sm font-medium">Label</Label>
                                      <Input
                                        value={key.label}
                                        onChange={(e) => {
                                          const updatedKeys = [...(handoffData.access.keys || [])]
                                          updatedKeys[index] = { ...key, label: e.target.value }
                                          setHandoffData({
                                            ...handoffData,
                                            access: {
                                              ...handoffData.access,
                                              keys: updatedKeys
                                            }
                                          })
                                        }}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm text-muted-foreground">Location</Label>
                                      <Input
                                        value={key.location || ""}
                                        onChange={(e) => {
                                          const updatedKeys = [...(handoffData.access.keys || [])]
                                          updatedKeys[index] = { ...key, location: e.target.value || undefined }
                                          setHandoffData({
                                            ...handoffData,
                                            access: {
                                              ...handoffData.access,
                                              keys: updatedKeys
                                            }
                                          })
                                        }}
                                        className="mt-1"
                                        placeholder="Optional"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm text-muted-foreground">Notes</Label>
                                      <Textarea
                                        value={key.notes || ""}
                                        onChange={(e) => {
                                          const updatedKeys = [...(handoffData.access.keys || [])]
                                          updatedKeys[index] = { ...key, notes: e.target.value || undefined }
                                          setHandoffData({
                                            ...handoffData,
                                            access: {
                                              ...handoffData.access,
                                              keys: updatedKeys
                                            }
                                          })
                                        }}
                                        className="mt-1"
                                        placeholder="Optional"
                                        rows={2}
                                      />
                                    </div>
                                    {(handoffData.access.keys || []).length > 1 && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          const updatedKeys = (handoffData.access.keys || []).filter((_, i) => i !== index)
                                          setHandoffData({
                                            ...handoffData,
                                            access: {
                                              ...handoffData.access,
                                              keys: updatedKeys
                                            }
                                          })
                                        }}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium">{key.label}</p>
                                    {key.location && <p className="text-sm text-muted-foreground">Location: {key.location}</p>}
                                    {key.notes && <p className="text-sm text-muted-foreground">{key.notes}</p>}
                                  </>
                                )}
                              </div>
                            ))}
                            {isEditMode && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setHandoffData({
                                    ...handoffData,
                                    access: {
                                      ...handoffData.access,
                                      keys: [...(handoffData.access.keys || []), { label: "" }]
                                    }
                                  })
                                }}
                              >
                                Add Key
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Access Codes */}
                    {(handoffData.access.codes && handoffData.access.codes.length > 0 || isEditMode) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Access Codes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {(handoffData.access.codes || []).map((code, index) => (
                              <div key={index} className="p-3 border rounded-lg space-y-2">
                                {isEditMode ? (
                                  <>
                                    <div>
                                      <Label className="text-sm font-medium">Type</Label>
                                      <Input
                                        value={code.type}
                                        onChange={(e) => {
                                          const updatedCodes = [...(handoffData.access.codes || [])]
                                          updatedCodes[index] = { ...code, type: e.target.value }
                                          setHandoffData({
                                            ...handoffData,
                                            access: {
                                              ...handoffData.access,
                                              codes: updatedCodes
                                            }
                                          })
                                        }}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Code</Label>
                                      <Input
                                        value={code.code}
                                        onChange={(e) => {
                                          const updatedCodes = [...(handoffData.access.codes || [])]
                                          updatedCodes[index] = { ...code, code: e.target.value }
                                          setHandoffData({
                                            ...handoffData,
                                            access: {
                                              ...handoffData.access,
                                              codes: updatedCodes
                                            }
                                          })
                                        }}
                                        className="mt-1 font-mono"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm text-muted-foreground">Location</Label>
                                      <Input
                                        value={code.location || ""}
                                        onChange={(e) => {
                                          const updatedCodes = [...(handoffData.access.codes || [])]
                                          updatedCodes[index] = { ...code, location: e.target.value || undefined }
                                          setHandoffData({
                                            ...handoffData,
                                            access: {
                                              ...handoffData.access,
                                              codes: updatedCodes
                                            }
                                          })
                                        }}
                                        className="mt-1"
                                        placeholder="Optional"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm text-muted-foreground">Instructions</Label>
                                      <Textarea
                                        value={code.instructions || ""}
                                        onChange={(e) => {
                                          const updatedCodes = [...(handoffData.access.codes || [])]
                                          updatedCodes[index] = { ...code, instructions: e.target.value || undefined }
                                          setHandoffData({
                                            ...handoffData,
                                            access: {
                                              ...handoffData.access,
                                              codes: updatedCodes
                                            }
                                          })
                                        }}
                                        className="mt-1"
                                        placeholder="Optional"
                                        rows={2}
                                      />
                                    </div>
                                    {(handoffData.access.codes || []).length > 1 && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          const updatedCodes = (handoffData.access.codes || []).filter((_, i) => i !== index)
                                          setHandoffData({
                                            ...handoffData,
                                            access: {
                                              ...handoffData.access,
                                              codes: updatedCodes
                                            }
                                          })
                                        }}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium">{code.type}</p>
                                    <p className="text-lg font-mono">{code.code}</p>
                                    {code.location && <p className="text-sm text-muted-foreground">Location: {code.location}</p>}
                                    {code.instructions && <p className="text-sm text-muted-foreground">{code.instructions}</p>}
                                  </>
                                )}
                              </div>
                            ))}
                            {isEditMode && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setHandoffData({
                                    ...handoffData,
                                    access: {
                                      ...handoffData.access,
                                      codes: [...(handoffData.access.codes || []), { type: "", code: "" }]
                                    }
                                  })
                                }}
                              >
                                Add Access Code
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Alarm */}
                    {(handoffData.access.alarm || isEditMode) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Alarm System</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm text-muted-foreground">Provider</Label>
                            {isEditMode ? (
                              <Input
                                value={handoffData.access.alarm?.provider || ""}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  access: {
                                    ...handoffData.access,
                                    alarm: {
                                      ...(handoffData.access.alarm || {}),
                                      provider: e.target.value || undefined
                                    }
                                  }
                                })}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            ) : (
                              handoffData.access.alarm?.provider && (
                                <p className="font-medium mt-1">{handoffData.access.alarm.provider}</p>
                              )
                            )}
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Code</Label>
                            {isEditMode ? (
                              <Input
                                value={handoffData.access.alarm?.code || ""}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  access: {
                                    ...handoffData.access,
                                    alarm: {
                                      ...(handoffData.access.alarm || {}),
                                      code: e.target.value || undefined
                                    }
                                  }
                                })}
                                className="mt-1 font-mono"
                                placeholder="Optional"
                              />
                            ) : (
                              handoffData.access.alarm?.code && (
                                <p className="font-medium font-mono mt-1">{handoffData.access.alarm.code}</p>
                              )
                            )}
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Instructions</Label>
                            {isEditMode ? (
                              <Textarea
                                value={handoffData.access.alarm?.instructions || ""}
                                onChange={(e) => setHandoffData({
                                  ...handoffData,
                                  access: {
                                    ...handoffData.access,
                                    alarm: {
                                      ...(handoffData.access.alarm || {}),
                                      instructions: e.target.value || undefined
                                    }
                                  }
                                })}
                                className="mt-1"
                                placeholder="Optional"
                                rows={3}
                              />
                            ) : (
                              handoffData.access.alarm?.instructions && (
                                <p className="text-sm mt-1">{handoffData.access.alarm.instructions}</p>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "Property Access & Security information has been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'mailbox' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Mail className="h-6 w-6" />
                      Mailbox & Packages
                    </DialogTitle>
                    <DialogDescription>Mailbox location and package delivery information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Mailbox Number</Label>
                          {isEditMode ? (
                            <Input
                              value={handoffData.mailbox.number}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                mailbox: {
                                  ...handoffData.mailbox,
                                  number: e.target.value
                                }
                              })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="font-medium mt-1">{handoffData.mailbox.number}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Location</Label>
                          {isEditMode ? (
                            <Input
                              value={handoffData.mailbox.location}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                mailbox: {
                                  ...handoffData.mailbox,
                                  location: e.target.value
                                }
                              })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="font-medium mt-1">{handoffData.mailbox.location}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Key Details</Label>
                          {isEditMode ? (
                            <Input
                              value={handoffData.mailbox.keyDetails || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                mailbox: {
                                  ...handoffData.mailbox,
                                  keyDetails: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                            />
                          ) : (
                            handoffData.mailbox.keyDetails && (
                              <p className="font-medium mt-1">{handoffData.mailbox.keyDetails}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Package Delivery Area</Label>
                          {isEditMode ? (
                            <Input
                              value={handoffData.mailbox.packageDeliveryArea || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                mailbox: {
                                  ...handoffData.mailbox,
                                  packageDeliveryArea: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                            />
                          ) : (
                            handoffData.mailbox.packageDeliveryArea && (
                              <p className="font-medium mt-1">{handoffData.mailbox.packageDeliveryArea}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Parcel Locker Instructions</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.mailbox.parcelLockerInstructions || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                mailbox: {
                                  ...handoffData.mailbox,
                                  parcelLockerInstructions: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={3}
                            />
                          ) : (
                            handoffData.mailbox.parcelLockerInstructions && (
                              <p className="font-medium mt-1">{handoffData.mailbox.parcelLockerInstructions}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Mail Hold Procedure</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.mailbox.mailHoldProcedure || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                mailbox: {
                                  ...handoffData.mailbox,
                                  mailHoldProcedure: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={3}
                            />
                          ) : (
                            handoffData.mailbox.mailHoldProcedure && (
                              <p className="font-medium mt-1">{handoffData.mailbox.mailHoldProcedure}</p>
                            )
                          )}
                        </div>
                        {!isEditMode && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <p className="text-sm font-medium">Remember to update your address with USPS</p>
                            <a href="https://www.usps.com/manage/change-of-address.htm" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                              Change of Address Form <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "Mailbox & Packages information has been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'appliances' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Building className="h-6 w-6" />
                      Appliances & Systems
                    </DialogTitle>
                    <DialogDescription>Appliances and their details</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {handoffData.appliances.map((appliance, index) => (
                        <Card key={index}>
                          <CardHeader>
                            {isEditMode ? (
                              <Input
                                value={appliance.name}
                                onChange={(e) => {
                                  const updatedAppliances = [...handoffData.appliances]
                                  updatedAppliances[index] = { ...appliance, name: e.target.value }
                                  setHandoffData({
                                    ...handoffData,
                                    appliances: updatedAppliances
                                  })
                                }}
                                className="text-lg font-semibold"
                                placeholder="Appliance Name"
                              />
                            ) : (
                              <CardTitle className="text-lg">{appliance.name}</CardTitle>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label className="text-sm text-muted-foreground">Model</Label>
                              {isEditMode ? (
                                <Input
                                  value={appliance.model || ""}
                                  onChange={(e) => {
                                    const updatedAppliances = [...handoffData.appliances]
                                    updatedAppliances[index] = { ...appliance, model: e.target.value || undefined }
                                    setHandoffData({
                                      ...handoffData,
                                      appliances: updatedAppliances
                                    })
                                  }}
                                  className="mt-1"
                                  placeholder="Optional"
                                />
                              ) : (
                                appliance.model && <p className="font-medium mt-1">{appliance.model}</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Location</Label>
                              {isEditMode ? (
                                <Input
                                  value={appliance.location || ""}
                                  onChange={(e) => {
                                    const updatedAppliances = [...handoffData.appliances]
                                    updatedAppliances[index] = { ...appliance, location: e.target.value || undefined }
                                    setHandoffData({
                                      ...handoffData,
                                      appliances: updatedAppliances
                                    })
                                  }}
                                  className="mt-1"
                                  placeholder="Optional"
                                />
                              ) : (
                                appliance.location && <p className="font-medium mt-1">{appliance.location}</p>
                              )}
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Manual Link</Label>
                              {isEditMode ? (
                                <Input
                                  value={appliance.manualLink || ""}
                                  onChange={(e) => {
                                    const updatedAppliances = [...handoffData.appliances]
                                    updatedAppliances[index] = { ...appliance, manualLink: e.target.value || undefined }
                                    setHandoffData({
                                      ...handoffData,
                                      appliances: updatedAppliances
                                    })
                                  }}
                                  className="mt-1"
                                  placeholder="Optional URL"
                                />
                              ) : (
                                appliance.manualLink && (
                                  <a href={appliance.manualLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                    View Manual <ExternalLink className="h-3 w-3" />
                                  </a>
                                )
                              )}
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Instructions</Label>
                              {isEditMode ? (
                                <Textarea
                                  value={appliance.instructions || ""}
                                  onChange={(e) => {
                                    const updatedAppliances = [...handoffData.appliances]
                                    updatedAppliances[index] = { ...appliance, instructions: e.target.value || undefined }
                                    setHandoffData({
                                      ...handoffData,
                                      appliances: updatedAppliances
                                    })
                                  }}
                                  className="mt-1"
                                  placeholder="Optional"
                                  rows={3}
                                />
                              ) : (
                                appliance.instructions && <p className="text-sm mt-1">{appliance.instructions}</p>
                              )}
                            </div>
                            {isEditMode && handoffData.appliances.length > 1 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updatedAppliances = handoffData.appliances.filter((_, i) => i !== index)
                                  setHandoffData({
                                    ...handoffData,
                                    appliances: updatedAppliances
                                  })
                                }}
                              >
                                Remove Appliance
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {isEditMode && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setHandoffData({
                            ...handoffData,
                            appliances: [...handoffData.appliances, { name: "", type: "other" }]
                          })
                        }}
                      >
                        Add Appliance
                      </Button>
                    )}
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "Appliances & Systems information has been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'maintenance' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Wrench className="h-6 w-6" />
                      Maintenance & Repairs
                    </DialogTitle>
                    <DialogDescription>How to request maintenance and important information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>How to Submit Requests</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Request Method</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.maintenance.requestMethod}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                maintenance: {
                                  ...handoffData.maintenance,
                                  requestMethod: e.target.value
                                }
                              })}
                              className="mt-1"
                              rows={3}
                            />
                          ) : (
                            <p className="font-medium mt-1">{handoffData.maintenance.requestMethod}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Contacts</Label>
                          {isEditMode ? (
                            <div className="space-y-3 mt-2">
                              {handoffData.maintenance.contacts.map((contact, index) => (
                                <div key={index} className="p-3 border rounded-lg space-y-2">
                                  <Input
                                    value={contact.name}
                                    onChange={(e) => {
                                      const updatedContacts = [...handoffData.maintenance.contacts]
                                      updatedContacts[index] = { ...contact, name: e.target.value }
                                      setHandoffData({
                                        ...handoffData,
                                        maintenance: {
                                          ...handoffData.maintenance,
                                          contacts: updatedContacts
                                        }
                                      })
                                    }}
                                    placeholder="Name"
                                  />
                                  <Input
                                    value={contact.phone || ""}
                                    onChange={(e) => {
                                      const updatedContacts = [...handoffData.maintenance.contacts]
                                      updatedContacts[index] = { ...contact, phone: e.target.value }
                                      setHandoffData({
                                        ...handoffData,
                                        maintenance: {
                                          ...handoffData.maintenance,
                                          contacts: updatedContacts
                                        }
                                      })
                                    }}
                                    placeholder="Phone (optional)"
                                  />
                                  <Input
                                    value={contact.email || ""}
                                    onChange={(e) => {
                                      const updatedContacts = [...handoffData.maintenance.contacts]
                                      updatedContacts[index] = { ...contact, email: e.target.value || undefined }
                                      setHandoffData({
                                        ...handoffData,
                                        maintenance: {
                                          ...handoffData.maintenance,
                                          contacts: updatedContacts
                                        }
                                      })
                                    }}
                                    placeholder="Email (optional)"
                                  />
                                  {handoffData.maintenance.contacts.length > 1 && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const updatedContacts = handoffData.maintenance.contacts.filter((_, i) => i !== index)
                                        setHandoffData({
                                          ...handoffData,
                                          maintenance: {
                                            ...handoffData.maintenance,
                                            contacts: updatedContacts
                                          }
                                        })
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setHandoffData({
                                    ...handoffData,
                                    maintenance: {
                                      ...handoffData.maintenance,
                                      contacts: [...handoffData.maintenance.contacts, { name: "", phone: "" }]
                                    }
                                  })
                                }}
                              >
                                Add Contact
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-2 space-y-2">
                              {handoffData.maintenance.contacts.map((contact, index) => (
                                <div key={index}>
                                  <p className="font-medium">{contact.name}</p>
                                  {contact.phone && <p className="text-sm text-muted-foreground">{contact.phone}</p>}
                                  {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Response Times</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isEditMode ? (
                          <Textarea
                            value={handoffData.maintenance.responseTimes}
                            onChange={(e) => setHandoffData({
                              ...handoffData,
                              maintenance: {
                                ...handoffData.maintenance,
                                responseTimes: e.target.value
                              }
                            })}
                            rows={3}
                          />
                        ) : (
                          <p>{handoffData.maintenance.responseTimes}</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Responsibilities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isEditMode ? (
                          <Textarea
                            value={handoffData.maintenance.responsibilities}
                            onChange={(e) => setHandoffData({
                              ...handoffData,
                              maintenance: {
                                ...handoffData.maintenance,
                                responsibilities: e.target.value
                              }
                            })}
                            rows={4}
                          />
                        ) : (
                          <p>{handoffData.maintenance.responsibilities}</p>
                        )}
                      </CardContent>
                    </Card>

                    {(handoffData.maintenance.preferredContractors && handoffData.maintenance.preferredContractors.length > 0 || isEditMode) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Preferred Contractors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isEditMode ? (
                            <div className="space-y-3">
                              {(handoffData.maintenance.preferredContractors || []).map((contractor, index) => (
                                <div key={index} className="p-3 border rounded-lg space-y-2">
                                  <Input
                                    value={contractor.name}
                                    onChange={(e) => {
                                      const updatedContractors = [...(handoffData.maintenance.preferredContractors || [])]
                                      updatedContractors[index] = { ...contractor, name: e.target.value }
                                      setHandoffData({
                                        ...handoffData,
                                        maintenance: {
                                          ...handoffData.maintenance,
                                          preferredContractors: updatedContractors
                                        }
                                      })
                                    }}
                                    placeholder="Contractor Name"
                                  />
                                  <Input
                                    value={contractor.phone || ""}
                                    onChange={(e) => {
                                      const updatedContractors = [...(handoffData.maintenance.preferredContractors || [])]
                                      updatedContractors[index] = { ...contractor, phone: e.target.value }
                                      setHandoffData({
                                        ...handoffData,
                                        maintenance: {
                                          ...handoffData.maintenance,
                                          preferredContractors: updatedContractors
                                        }
                                      })
                                    }}
                                    placeholder="Phone (optional)"
                                  />
                                  <Textarea
                                    value={contractor.notes || ""}
                                    onChange={(e) => {
                                      const updatedContractors = [...(handoffData.maintenance.preferredContractors || [])]
                                      updatedContractors[index] = { ...contractor, notes: e.target.value || undefined }
                                      setHandoffData({
                                        ...handoffData,
                                        maintenance: {
                                          ...handoffData.maintenance,
                                          preferredContractors: updatedContractors
                                        }
                                      })
                                    }}
                                    placeholder="Notes (optional)"
                                    rows={2}
                                  />
                                  {(handoffData.maintenance.preferredContractors || []).length > 1 && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const updatedContractors = (handoffData.maintenance.preferredContractors || []).filter((_, i) => i !== index)
                                        setHandoffData({
                                          ...handoffData,
                                          maintenance: {
                                            ...handoffData.maintenance,
                                            preferredContractors: updatedContractors
                                          }
                                        })
                                      }}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setHandoffData({
                                    ...handoffData,
                                    maintenance: {
                                      ...handoffData.maintenance,
                                      preferredContractors: [...(handoffData.maintenance.preferredContractors || []), { name: "", phone: "" }]
                                    }
                                  })
                                }}
                              >
                                Add Contractor
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {handoffData.maintenance.preferredContractors?.map((contractor, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                  <p className="font-medium">{contractor.name}</p>
                                  <p className="text-sm text-muted-foreground">{contractor.phone}</p>
                                  {contractor.notes && <p className="text-sm text-muted-foreground">{contractor.notes}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {(handoffData.maintenance.preventiveMaintenanceSchedule || isEditMode) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Preventive Maintenance Schedule</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.maintenance.preventiveMaintenanceSchedule || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                maintenance: {
                                  ...handoffData.maintenance,
                                  preventiveMaintenanceSchedule: e.target.value || undefined
                                }
                              })}
                              placeholder="Optional"
                              rows={4}
                            />
                          ) : (
                            handoffData.maintenance.preventiveMaintenanceSchedule && (
                              <p>{handoffData.maintenance.preventiveMaintenanceSchedule}</p>
                            )
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {(handoffData.maintenance.filterChangeInfo || isEditMode) && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Filter Change Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.maintenance.filterChangeInfo || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                maintenance: {
                                  ...handoffData.maintenance,
                                  filterChangeInfo: e.target.value || undefined
                                }
                              })}
                              placeholder="Optional"
                              rows={4}
                            />
                          ) : (
                            handoffData.maintenance.filterChangeInfo && (
                              <p>{handoffData.maintenance.filterChangeInfo}</p>
                            )
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "Maintenance & Repairs information has been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'policies' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <FileText className="h-6 w-6" />
                      House Rules & Policies
                    </DialogTitle>
                    <DialogDescription>Property rules and guidelines</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <Label className="font-semibold">Smoking</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.policies.smoking}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                policies: {
                                  ...handoffData.policies,
                                  smoking: e.target.value
                                }
                              })}
                              className="mt-1"
                              rows={2}
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground mt-1">{handoffData.policies.smoking}</p>
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Pets</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.policies.pets || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                policies: {
                                  ...handoffData.policies,
                                  pets: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          ) : (
                            handoffData.policies.pets && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.policies.pets}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Quiet Hours</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.policies.quietHours || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                policies: {
                                  ...handoffData.policies,
                                  quietHours: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          ) : (
                            handoffData.policies.quietHours && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.policies.quietHours}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Guests</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.policies.guests || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                policies: {
                                  ...handoffData.policies,
                                  guests: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          ) : (
                            handoffData.policies.guests && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.policies.guests}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Modifications</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.policies.modifications || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                policies: {
                                  ...handoffData.policies,
                                  modifications: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          ) : (
                            handoffData.policies.modifications && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.policies.modifications}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Grilling</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.policies.grilling || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                policies: {
                                  ...handoffData.policies,
                                  grilling: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          ) : (
                            handoffData.policies.grilling && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.policies.grilling}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Pool Rules</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.policies.poolRules || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                policies: {
                                  ...handoffData.policies,
                                  poolRules: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          ) : (
                            handoffData.policies.poolRules && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.policies.poolRules}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Other</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.policies.other || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                policies: {
                                  ...handoffData.policies,
                                  other: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          ) : (
                            handoffData.policies.other && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.policies.other}</p>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "House Rules & Policies information has been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'safety' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Shield className="h-6 w-6" />
                      Safety & Security
                    </DialogTitle>
                    <DialogDescription>Safety equipment and procedures</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <Label className="font-semibold">Fire Extinguisher Locations (comma-separated)</Label>
                          {isEditMode ? (
                            <Input
                              value={(handoffData.safety.fireExtinguisherLocations || []).join(", ")}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                safety: {
                                  ...handoffData.safety,
                                  fireExtinguisherLocations: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                }
                              })}
                              className="mt-1"
                              placeholder="e.g., Kitchen, Garage, Basement"
                            />
                          ) : (
                            handoffData.safety.fireExtinguisherLocations && handoffData.safety.fireExtinguisherLocations.length > 0 && (
                              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                {handoffData.safety.fireExtinguisherLocations.map((loc, i) => (
                                  <li key={i}>{loc}</li>
                                ))}
                              </ul>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Smoke Detector Locations (comma-separated)</Label>
                          {isEditMode ? (
                            <Input
                              value={(handoffData.safety.smokeDetectorLocations || []).join(", ")}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                safety: {
                                  ...handoffData.safety,
                                  smokeDetectorLocations: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                }
                              })}
                              className="mt-1"
                              placeholder="e.g., Bedroom, Hallway, Living Room"
                            />
                          ) : (
                            handoffData.safety.smokeDetectorLocations && handoffData.safety.smokeDetectorLocations.length > 0 && (
                              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                {handoffData.safety.smokeDetectorLocations.map((loc, i) => (
                                  <li key={i}>{loc}</li>
                                ))}
                              </ul>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Carbon Monoxide Detector Locations (comma-separated)</Label>
                          {isEditMode ? (
                            <Input
                              value={(handoffData.safety.carbonMonoxideDetectorLocations || []).join(", ")}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                safety: {
                                  ...handoffData.safety,
                                  carbonMonoxideDetectorLocations: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                }
                              })}
                              className="mt-1"
                              placeholder="e.g., Bedroom, Kitchen"
                            />
                          ) : (
                            handoffData.safety.carbonMonoxideDetectorLocations && handoffData.safety.carbonMonoxideDetectorLocations.length > 0 && (
                              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                {handoffData.safety.carbonMonoxideDetectorLocations.map((loc, i) => (
                                  <li key={i}>{loc}</li>
                                ))}
                              </ul>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Water Main Shut-Off</Label>
                          {isEditMode ? (
                            <Input
                              value={handoffData.safety.waterMainShutOff || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                safety: {
                                  ...handoffData.safety,
                                  waterMainShutOff: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                            />
                          ) : (
                            handoffData.safety.waterMainShutOff && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.safety.waterMainShutOff}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Electrical Panel</Label>
                          {isEditMode ? (
                            <Input
                              value={handoffData.safety.electricalPanelLocation || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                safety: {
                                  ...handoffData.safety,
                                  electricalPanelLocation: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                            />
                          ) : (
                            handoffData.safety.electricalPanelLocation && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.safety.electricalPanelLocation}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Gas Shut-Off</Label>
                          {isEditMode ? (
                            <Input
                              value={handoffData.safety.gasShutOffLocation || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                safety: {
                                  ...handoffData.safety,
                                  gasShutOffLocation: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                            />
                          ) : (
                            handoffData.safety.gasShutOffLocation && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.safety.gasShutOffLocation}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Emergency Exits (comma-separated)</Label>
                          {isEditMode ? (
                            <Input
                              value={(handoffData.safety.emergencyExits || []).join(", ")}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                safety: {
                                  ...handoffData.safety,
                                  emergencyExits: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                }
                              })}
                              className="mt-1"
                              placeholder="e.g., Front door, Back door, Fire escape"
                            />
                          ) : (
                            handoffData.safety.emergencyExits && handoffData.safety.emergencyExits.length > 0 && (
                              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                {handoffData.safety.emergencyExits.map((exit, i) => (
                                  <li key={i}>{exit}</li>
                                ))}
                              </ul>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Evacuation Routes (comma-separated)</Label>
                          {isEditMode ? (
                            <Input
                              value={(handoffData.safety.evacuationRoutes || []).join(", ")}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                safety: {
                                  ...handoffData.safety,
                                  evacuationRoutes: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                }
                              })}
                              className="mt-1"
                              placeholder="e.g., Main stairwell, Fire escape"
                            />
                          ) : (
                            handoffData.safety.evacuationRoutes && handoffData.safety.evacuationRoutes.length > 0 && (
                              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                {handoffData.safety.evacuationRoutes.map((route, i) => (
                                  <li key={i}>{route}</li>
                                ))}
                              </ul>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "Safety & Security information has been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'parking' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Car className="h-6 w-6" />
                      Parking & Storage
                    </DialogTitle>
                    <DialogDescription>Parking spots and storage information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <Label className="font-semibold">Assigned Parking Spots (comma-separated)</Label>
                          {isEditMode ? (
                            <Input
                              value={(handoffData.parking.assignedSpots || []).join(", ")}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                parking: {
                                  ...handoffData.parking,
                                  assignedSpots: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                }
                              })}
                              className="mt-1"
                              placeholder="e.g., Spot #12, Spot #13"
                            />
                          ) : (
                            handoffData.parking.assignedSpots && handoffData.parking.assignedSpots.length > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.parking.assignedSpots.join(", ")}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Guest Parking</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.parking.guestParking || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                parking: {
                                  ...handoffData.parking,
                                  guestParking: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          ) : (
                            handoffData.parking.guestParking && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.parking.guestParking}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Parking Permits</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.parking.parkingPermits || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                parking: {
                                  ...handoffData.parking,
                                  parkingPermits: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          ) : (
                            handoffData.parking.parkingPermits && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.parking.parkingPermits}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Street Parking Regulations</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.parking.streetParkingRegulations || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                parking: {
                                  ...handoffData.parking,
                                  streetParkingRegulations: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={3}
                            />
                          ) : (
                            handoffData.parking.streetParkingRegulations && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.parking.streetParkingRegulations}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Storage Unit</Label>
                          {isEditMode ? (
                            <Textarea
                              value={handoffData.parking.storageUnitDetails || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                parking: {
                                  ...handoffData.parking,
                                  storageUnitDetails: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          ) : (
                            handoffData.parking.storageUnitDetails && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.parking.storageUnitDetails}</p>
                            )
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Bike Storage</Label>
                          {isEditMode ? (
                            <Input
                              value={handoffData.parking.bikeStorageArea || ""}
                              onChange={(e) => setHandoffData({
                                ...handoffData,
                                parking: {
                                  ...handoffData.parking,
                                  bikeStorageArea: e.target.value || undefined
                                }
                              })}
                              className="mt-1"
                              placeholder="Optional"
                            />
                          ) : (
                            handoffData.parking.bikeStorageArea && (
                              <p className="text-sm text-muted-foreground mt-1">{handoffData.parking.bikeStorageArea}</p>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "Parking & Storage information has been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'documents' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <FileText className="h-6 w-6" />
                      Important Documents
                    </DialogTitle>
                    <DialogDescription>Lease, insurance, and other important documents</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {/* Document Management Header */}
                    <Card className="bg-muted dark:bg-card border-gray-700">
                      <CardContent className="p-4 space-y-4">
                        {/* Tabs and View Toggle */}
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <Tabs value={documentTab} onValueChange={setDocumentTab} className="flex-1">
                            <TabsList className="bg-card dark:bg-background border border-gray-700 h-9">
                              <TabsTrigger 
                                value="all" 
                                className="data-[state=active]:bg-secondary data-[state=active]:text-white px-4"
                              >
                                All Documents
                              </TabsTrigger>
                              <TabsTrigger 
                                value="recent" 
                                className="data-[state=active]:bg-secondary data-[state=active]:text-white px-4"
                              >
                                Recent
                              </TabsTrigger>
                              <TabsTrigger 
                                value="shared" 
                                className="data-[state=active]:bg-secondary data-[state=active]:text-white px-4"
                              >
                                Shared
                              </TabsTrigger>
                              <TabsTrigger 
                                value="folders" 
                                className="data-[state=active]:bg-secondary data-[state=active]:text-white px-4"
                              >
                                Folders
                              </TabsTrigger>
                            </TabsList>
                          </Tabs>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={documentViewMode === "grid" ? "default" : "ghost"}
                              size="icon"
                              onClick={() => setDocumentViewMode("grid")}
                              className="h-8 w-8 bg-secondary hover:bg-muted"
                            >
                              <Grid3x3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={documentViewMode === "list" ? "default" : "ghost"}
                              size="icon"
                              onClick={() => setDocumentViewMode("list")}
                              className="h-8 w-8 bg-secondary hover:bg-muted"
                            >
                              <List className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col md:flex-row gap-3">
                          <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search documents..."
                              value={documentSearch}
                              onChange={(e) => setDocumentSearch(e.target.value)}
                              className="pl-10 bg-card dark:bg-background border-gray-700 text-white placeholder:text-gray-500"
                            />
                          </div>
                          <Select value={documentPropertyFilter} onValueChange={setDocumentPropertyFilter}>
                            <SelectTrigger className="w-full md:w-[160px] bg-card dark:bg-background border-gray-700 text-white">
                              <SelectValue placeholder="All Properties" />
                            </SelectTrigger>
                            <SelectContent className="bg-muted border-gray-700">
                              <SelectItem value="all">All Properties</SelectItem>
                              {properties.map((prop) => (
                                <SelectItem key={prop.id} value={prop.id}>
                                  {prop.title || prop.addressLine1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={documentCategoryFilter} onValueChange={setDocumentCategoryFilter}>
                            <SelectTrigger className="w-full md:w-[160px] bg-card dark:bg-background border-gray-700 text-white">
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent className="bg-muted border-gray-700">
                              <SelectItem value="all">All Categories</SelectItem>
                              <SelectItem value="insurance">Insurance</SelectItem>
                              <SelectItem value="tax">Tax</SelectItem>
                              <SelectItem value="lease">Lease</SelectItem>
                              <SelectItem value="inspection">Inspection</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={documentFolderFilter} onValueChange={setDocumentFolderFilter}>
                            <SelectTrigger className="w-full md:w-[160px] bg-card dark:bg-background border-gray-700 text-white">
                              <SelectValue placeholder="All Folders" />
                            </SelectTrigger>
                            <SelectContent className="bg-muted border-gray-700">
                              <SelectItem value="all">All Folders</SelectItem>
                              <SelectItem value="legal">Legal</SelectItem>
                              <SelectItem value="financial">Financial</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                          {canEdit && (
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Document
                            </Button>
                          )}
                          <Button variant="outline" className="border-gray-700 bg-muted hover:bg-secondary text-white">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Filtered Documents List */}
                    {(() => {
                      // Handle folders tab
                      if (documentTab === "folders") {
                        return (
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400">Folders feature coming soon</p>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      }

                      const filteredDocs = handoffData.documents.filter((doc) => {
                        const matchesSearch = doc.name.toLowerCase().includes(documentSearch.toLowerCase())
                        const matchesCategory = documentCategoryFilter === "all" || doc.type.toLowerCase() === documentCategoryFilter.toLowerCase()
                        const matchesProperty = documentPropertyFilter === "all" || documentPropertyFilter === selectedPropertyId
                        const matchesFolder = documentFolderFilter === "all"
                        
                        if (documentTab === "recent") {
                          const oneMonthAgo = new Date()
                          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
                          return matchesSearch && matchesCategory && matchesProperty && matchesFolder && doc.uploadDate && doc.uploadDate >= oneMonthAgo
                        }
                        if (documentTab === "shared") {
                          return matchesSearch && matchesCategory && matchesProperty && matchesFolder && ["1", "3"].includes(doc.id)
                        }
                        
                        return matchesSearch && matchesCategory && matchesProperty && matchesFolder
                      })

                      if (filteredDocs.length === 0) {
                        return (
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400">No documents found</p>
                                {documentSearch && (
                                  <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      }

                      return (
                        <div className={cn(
                          documentViewMode === "grid" 
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                            : "space-y-4"
                        )}>
                          {filteredDocs.map((doc) => {
                            const docIndex = handoffData.documents.findIndex(d => d.id === doc.id)
                            return (
                              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 flex-shrink-0">
                                        <FileIcon className="h-5 w-5 text-red-400" />
                                      </div>
                                      <div className="flex-1 min-w-0 space-y-2">
                                        {isEditMode ? (
                                          <>
                                            <Input
                                              value={doc.name}
                                              onChange={(e) => {
                                                const updatedDocs = [...handoffData.documents]
                                                updatedDocs[docIndex] = { ...doc, name: e.target.value }
                                                setHandoffData({
                                                  ...handoffData,
                                                  documents: updatedDocs
                                                })
                                              }}
                                              className="text-white bg-muted border-gray-700"
                                              placeholder="Document name"
                                            />
                                            <Select
                                              value={doc.type}
                                              onValueChange={(value) => {
                                                const updatedDocs = [...handoffData.documents]
                                                updatedDocs[docIndex] = { ...doc, type: value }
                                                setHandoffData({
                                                  ...handoffData,
                                                  documents: updatedDocs
                                                })
                                              }}
                                            >
                                              <SelectTrigger className="w-full bg-muted border-gray-700 text-white">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="bg-muted border-gray-700">
                                                <SelectItem value="insurance">Insurance</SelectItem>
                                                <SelectItem value="tax">Tax</SelectItem>
                                                <SelectItem value="lease">Lease</SelectItem>
                                                <SelectItem value="inspection">Inspection</SelectItem>
                                                <SelectItem value="manual">Manual</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <Textarea
                                              value={doc.notes || ""}
                                              onChange={(e) => {
                                                const updatedDocs = [...handoffData.documents]
                                                updatedDocs[docIndex] = { ...doc, notes: e.target.value || undefined }
                                                setHandoffData({
                                                  ...handoffData,
                                                  documents: updatedDocs
                                                })
                                              }}
                                              className="bg-muted border-gray-700 text-white"
                                              placeholder="Notes (optional)"
                                              rows={2}
                                            />
                                          </>
                                        ) : (
                                          <>
                                            <h4 className="font-medium text-white mb-1 truncate">{doc.name}</h4>
                                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                              <span>{formatFileSize(doc.size)}</span>
                                              <span>•</span>
                                              <span>{formatDocumentDate(doc.uploadDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                              <Badge 
                                                variant="outline" 
                                                className={cn("text-xs", getDocumentTypeColor(doc.type))}
                                              >
                                                {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                                              </Badge>
                                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Building className="h-3 w-3" />
                                                <span className="truncate">{handoffData.propertyAddress}</span>
                                              </div>
                                            </div>
                                            {doc.notes && (
                                              <p className="text-sm text-gray-400 mt-2">{doc.notes}</p>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                      {isEditMode ? (
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            const updatedDocs = handoffData.documents.filter(d => d.id !== doc.id)
                                            setHandoffData({
                                              ...handoffData,
                                              documents: updatedDocs
                                            })
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      ) : (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <MoreHorizontal className="h-4 w-4" />
                                              <span className="sr-only">More options</span>
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                                              <Eye className="h-4 w-4 mr-2" />
                                              View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                                              <Download className="h-4 w-4 mr-2" />
                                              Download
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleShareDocument(doc)}>
                                              <Share2 className="h-4 w-4 mr-2" />
                                              Share
                                            </DropdownMenuItem>
                                            {canEdit && (
                                              <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                  onClick={() => handleDeleteDocument(doc.id)}
                                                  className="text-red-400 focus:text-red-300"
                                                >
                                                  <Trash2 className="h-4 w-4 mr-2" />
                                                  Delete
                                                </DropdownMenuItem>
                                              </>
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "Important Documents information has been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'seasonal' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Calendar className="h-6 w-6" />
                      Seasonal Information
                    </DialogTitle>
                    <DialogDescription>Seasonal tips and reminders</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {handoffData.seasonalInfo.map((season, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="capitalize flex items-center gap-2">
                            {season.season === 'spring' && <Sun className="h-5 w-5 text-yellow-500" />}
                            {season.season === 'summer' && <Sun className="h-5 w-5 text-orange-500" />}
                            {season.season === 'fall' && <Leaf className="h-5 w-5 text-orange-600" />}
                            {season.season === 'winter' && <Snowflake className="h-5 w-5 text-blue-400" />}
                            {season.season.charAt(0).toUpperCase() + season.season.slice(1)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isEditMode ? (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Tips (one per line)</Label>
                              <Textarea
                                value={season.tips.join("\n")}
                                onChange={(e) => {
                                  const updatedSeasonal = [...handoffData.seasonalInfo]
                                  updatedSeasonal[index] = {
                                    ...season,
                                    tips: e.target.value.split("\n").filter(Boolean)
                                  }
                                  setHandoffData({
                                    ...handoffData,
                                    seasonalInfo: updatedSeasonal
                                  })
                                }}
                                rows={6}
                                placeholder="Enter tips, one per line"
                              />
                            </div>
                          ) : (
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {season.tips.map((tip, tipIndex) => (
                                <li key={tipIndex}>{tip}</li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "Seasonal Information has been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'faqs' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <HelpCircle className="h-6 w-6" />
                      Frequently Asked Questions
                    </DialogTitle>
                    <DialogDescription>Common questions and answers</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {isEditMode ? (
                      <div className="space-y-4">
                        {handoffData.faqs.map((faq, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6 space-y-3">
                              <div>
                                <Label className="text-sm font-medium">Question</Label>
                                <Input
                                  value={faq.question}
                                  onChange={(e) => {
                                    const updatedFaqs = [...handoffData.faqs]
                                    updatedFaqs[index] = { ...faq, question: e.target.value }
                                    setHandoffData({
                                      ...handoffData,
                                      faqs: updatedFaqs
                                    })
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Answer</Label>
                                <Textarea
                                  value={faq.answer}
                                  onChange={(e) => {
                                    const updatedFaqs = [...handoffData.faqs]
                                    updatedFaqs[index] = { ...faq, answer: e.target.value }
                                    setHandoffData({
                                      ...handoffData,
                                      faqs: updatedFaqs
                                    })
                                  }}
                                  className="mt-1"
                                  rows={4}
                                />
                              </div>
                              {handoffData.faqs.length > 1 && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    const updatedFaqs = handoffData.faqs.filter((_, i) => i !== index)
                                    setHandoffData({
                                      ...handoffData,
                                      faqs: updatedFaqs
                                    })
                                  }}
                                >
                                  Remove FAQ
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setHandoffData({
                              ...handoffData,
                              faqs: [...handoffData.faqs, { question: "", answer: "" }]
                            })
                          }}
                        >
                          Add FAQ
                        </Button>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible>
                        {handoffData.faqs.map((faq, index) => (
                          <AccordionItem key={index} value={`faq-${index}`}>
                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "Frequently Asked Questions have been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}

              {selectedPropertySection === 'notes' && handoffData && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Lightbulb className="h-6 w-6" />
                      Owner's Personal Tips & Notes
                    </DialogTitle>
                    <DialogDescription>Helpful tips from the owner</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        {isEditMode && (isOwner || hasFullAccess) ? (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="owner-notes-modal" className="text-sm font-medium mb-2 block">
                                Add or update notes for tenants
                              </Label>
                              <Textarea
                                id="owner-notes-modal"
                                value={ownerNotes}
                                onChange={(e) => setOwnerNotes(e.target.value)}
                                placeholder="Add helpful tips, neighborhood secrets, restaurant recommendations, or any other information you'd like to share with tenants..."
                                rows={8}
                                className="min-h-[200px]"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                These notes will be visible to tenants and help them settle into their new home.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {handoffData.ownerNotes ? (
                              <p className="whitespace-pre-line">{handoffData.ownerNotes}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                {isOwner
                                  ? "No notes added yet. Click 'Edit & Add Notes' to add helpful information for tenants."
                                  : "No owner notes available."}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  {isEditMode && canEdit && (
                    <DialogFooter className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (originalHandoffData) {
                            setHandoffData(originalHandoffData)
                            setOwnerNotes(originalHandoffData.ownerNotes || "")
                          }
                          setSelectedPropertySection(null)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (handoffData) {
                            setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                            setHandoffData({
                              ...handoffData,
                              ownerNotes: ownerNotes,
                              lastUpdated: new Date()
                            })
                          }
                          toast({
                            title: "Changes saved",
                            duration: 3000,
                            description: "Owner Notes have been updated.",
                          })
                          setSelectedPropertySection(null)
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </DialogFooter>
                  )}
                </>
              )}
        </DialogContent>
      </Dialog>

    </>
  )
}
