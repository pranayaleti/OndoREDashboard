import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
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
  ShoppingCart,
  UtensilsCrossed,
  Building,
  Heart,
  Dumbbell,
  GraduationCap,
  Bus,
  Calendar,
  X,
  Save,
  ExternalLink,
} from "lucide-react"
import { PropertyHandoff } from "@/types/handoff.types"
import { useToast } from "@/hooks/use-toast"

interface HandoffNeighborhoodProps {
  handoffData: PropertyHandoff
  isEditMode: boolean
  canEdit: boolean | null | undefined
  originalHandoffData: PropertyHandoff | null
  selectedNeighborhoodSection: string | null
  setSelectedNeighborhoodSection: (section: string | null) => void
  setHandoffData: (data: PropertyHandoff) => void
  setOriginalHandoffData: (data: PropertyHandoff | null) => void
  toast: ReturnType<typeof useToast>['toast']
}

export function HandoffNeighborhood({
  handoffData,
  isEditMode,
  canEdit,
  originalHandoffData,
  selectedNeighborhoodSection,
  setSelectedNeighborhoodSection,
  setHandoffData,
  setOriginalHandoffData,
  toast,
}: HandoffNeighborhoodProps) {
  return (
    <>
      <TabsContent value="neighborhood" className="space-y-6">
        {/* Neighborhood Information Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Grocery Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-gray-800 hover:bg-gray-750"
            onClick={() => setSelectedNeighborhoodSection('grocery')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <ShoppingCart className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-white text-lg mb-1">Grocery & Shopping</CardTitle>
                <CardDescription className="text-gray-400">Nearby stores and markets</CardDescription>
              </div>
            </CardContent>
          </Card>

          {/* Dining Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-gray-800 hover:bg-gray-750"
            onClick={() => setSelectedNeighborhoodSection('dining')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <UtensilsCrossed className="h-6 w-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-white text-lg mb-1">Dining</CardTitle>
                <CardDescription className="text-gray-400">Restaurants and cafes</CardDescription>
              </div>
            </CardContent>
          </Card>

          {/* Services Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-gray-800 hover:bg-gray-750"
            onClick={() => setSelectedNeighborhoodSection('services')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Building className="h-6 w-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-white text-lg mb-1">Services</CardTitle>
                <CardDescription className="text-gray-400">Local service providers</CardDescription>
              </div>
            </CardContent>
          </Card>

          {/* Healthcare Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-gray-800 hover:bg-gray-750"
            onClick={() => setSelectedNeighborhoodSection('healthcare')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <Heart className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-white text-lg mb-1">Healthcare</CardTitle>
                <CardDescription className="text-gray-400">Hospitals and clinics</CardDescription>
              </div>
            </CardContent>
          </Card>

          {/* Recreation Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-gray-800 hover:bg-gray-750"
            onClick={() => setSelectedNeighborhoodSection('recreation')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <Dumbbell className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-white text-lg mb-1">Recreation</CardTitle>
                <CardDescription className="text-gray-400">Parks and activities</CardDescription>
              </div>
            </CardContent>
          </Card>

          {/* Schools Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-gray-800 hover:bg-gray-750"
            onClick={() => setSelectedNeighborhoodSection('schools')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <GraduationCap className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-white text-lg mb-1">Schools</CardTitle>
                <CardDescription className="text-gray-400">Nearby schools and education</CardDescription>
              </div>
            </CardContent>
          </Card>

          {/* Transportation Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-gray-800 hover:bg-gray-750"
            onClick={() => setSelectedNeighborhoodSection('transportation')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <Bus className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-white text-lg mb-1">Transportation</CardTitle>
                <CardDescription className="text-gray-400">Public transit and routes</CardDescription>
              </div>
            </CardContent>
          </Card>

          {/* Local Services Card */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border border-gray-700 bg-gray-800 hover:bg-gray-750"
            onClick={() => setSelectedNeighborhoodSection('local-services')}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
                <Calendar className="h-6 w-6 text-teal-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-white text-lg mb-1">Local Services & Important Info</CardTitle>
                <CardDescription className="text-gray-400">Community services and schedules</CardDescription>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Neighborhood Section Modal */}
      <Dialog open={selectedNeighborhoodSection !== null} onOpenChange={(open) => !open && setSelectedNeighborhoodSection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedNeighborhoodSection === 'grocery' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <ShoppingCart className="h-6 w-6" />
                  Grocery & Shopping
                </DialogTitle>
                <DialogDescription>Nearby stores and markets</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {handoffData.neighborhood.grocery.map((place, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6 space-y-3">
                        {isEditMode ? (
                          <>
                            <div>
                              <Label className="text-sm font-semibold">Name</Label>
                              <Input
                                value={place.name}
                                onChange={(e) => {
                                  const updatedGrocery = [...handoffData.neighborhood.grocery]
                                  updatedGrocery[index] = { ...place, name: e.target.value }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: {
                                      ...handoffData.neighborhood,
                                      grocery: updatedGrocery
                                    }
                                  })
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Address</Label>
                              <Input
                                value={place.address || ""}
                                onChange={(e) => {
                                  const updatedGrocery = [...handoffData.neighborhood.grocery]
                                  updatedGrocery[index] = { ...place, address: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: {
                                      ...handoffData.neighborhood,
                                      grocery: updatedGrocery
                                    }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Distance</Label>
                              <Input
                                value={place.distance || ""}
                                onChange={(e) => {
                                  const updatedGrocery = [...handoffData.neighborhood.grocery]
                                  updatedGrocery[index] = { ...place, distance: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: {
                                      ...handoffData.neighborhood,
                                      grocery: updatedGrocery
                                    }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Phone</Label>
                              <Input
                                value={place.phone || ""}
                                onChange={(e) => {
                                  const updatedGrocery = [...handoffData.neighborhood.grocery]
                                  updatedGrocery[index] = { ...place, phone: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: {
                                      ...handoffData.neighborhood,
                                      grocery: updatedGrocery
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
                                value={place.notes || ""}
                                onChange={(e) => {
                                  const updatedGrocery = [...handoffData.neighborhood.grocery]
                                  updatedGrocery[index] = { ...place, notes: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: {
                                      ...handoffData.neighborhood,
                                      grocery: updatedGrocery
                                    }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                                rows={2}
                              />
                            </div>
                            {handoffData.neighborhood.grocery.length > 1 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updatedGrocery = handoffData.neighborhood.grocery.filter((_, i) => i !== index)
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: {
                                      ...handoffData.neighborhood,
                                      grocery: updatedGrocery
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
                            <p className="font-semibold">{place.name}</p>
                            {place.address && <p className="text-sm text-muted-foreground">{place.address}</p>}
                            {place.distance && <p className="text-sm text-muted-foreground">{place.distance} away</p>}
                            {place.phone && <p className="text-sm text-muted-foreground">{place.phone}</p>}
                            {place.notes && <p className="text-sm text-muted-foreground mt-2">{place.notes}</p>}
                          </>
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
                        neighborhood: {
                          ...handoffData.neighborhood,
                          grocery: [...handoffData.neighborhood.grocery, { name: "" }]
                        }
                      })
                    }}
                  >
                    Add Grocery Store
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
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                      setHandoffData({
                        ...handoffData,
                        lastUpdated: new Date()
                      })
                      toast({
                        title: "Changes saved",
                        duration: 3000,
                        description: "Grocery & Shopping information has been updated.",
                      })
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              )}
            </>
          )}

          {selectedNeighborhoodSection === 'dining' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <UtensilsCrossed className="h-6 w-6" />
                  Dining
                </DialogTitle>
                <DialogDescription>Restaurants and cafes</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {handoffData.neighborhood.dining.map((place, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6 space-y-3">
                        {isEditMode ? (
                          <>
                            <div>
                              <Label className="text-sm font-semibold">Name</Label>
                              <Input
                                value={place.name}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.dining]
                                  updated[index] = { ...place, name: e.target.value }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, dining: updated }
                                  })
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Address</Label>
                              <Input
                                value={place.address || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.dining]
                                  updated[index] = { ...place, address: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, dining: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Distance</Label>
                              <Input
                                value={place.distance || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.dining]
                                  updated[index] = { ...place, distance: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, dining: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Phone</Label>
                              <Input
                                value={place.phone || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.dining]
                                  updated[index] = { ...place, phone: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, dining: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Notes</Label>
                              <Textarea
                                value={place.notes || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.dining]
                                  updated[index] = { ...place, notes: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, dining: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                                rows={2}
                              />
                            </div>
                            {handoffData.neighborhood.dining.length > 1 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updated = handoffData.neighborhood.dining.filter((_, i) => i !== index)
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, dining: updated }
                                  })
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">{place.name}</p>
                            {place.address && <p className="text-sm text-muted-foreground">{place.address}</p>}
                            {place.phone && <p className="text-sm text-muted-foreground">{place.phone}</p>}
                            {place.distance && <p className="text-sm text-muted-foreground">{place.distance} away</p>}
                            {place.notes && <p className="text-sm text-muted-foreground mt-2">{place.notes}</p>}
                          </>
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
                        neighborhood: {
                          ...handoffData.neighborhood,
                          dining: [...handoffData.neighborhood.dining, { name: "" }]
                        }
                      })
                    }}
                  >
                    Add Restaurant
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
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                      setHandoffData({
                        ...handoffData,
                        lastUpdated: new Date()
                      })
                      toast({
                        title: "Changes saved",
                        duration: 3000,
                        description: "Dining information has been updated.",
                      })
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              )}
            </>
          )}

          {selectedNeighborhoodSection === 'services' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Building className="h-6 w-6" />
                  Services
                </DialogTitle>
                <DialogDescription>Local service providers</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {handoffData.neighborhood.services.map((place, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6 space-y-3">
                        {isEditMode ? (
                          <>
                            <div>
                              <Label className="text-sm font-semibold">Name</Label>
                              <Input
                                value={place.name}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.services]
                                  updated[index] = { ...place, name: e.target.value }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, services: updated }
                                  })
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Address</Label>
                              <Input
                                value={place.address || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.services]
                                  updated[index] = { ...place, address: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, services: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Distance</Label>
                              <Input
                                value={place.distance || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.services]
                                  updated[index] = { ...place, distance: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, services: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Phone</Label>
                              <Input
                                value={place.phone || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.services]
                                  updated[index] = { ...place, phone: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, services: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Notes</Label>
                              <Textarea
                                value={place.notes || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.services]
                                  updated[index] = { ...place, notes: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, services: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                                rows={2}
                              />
                            </div>
                            {handoffData.neighborhood.services.length > 1 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updated = handoffData.neighborhood.services.filter((_, i) => i !== index)
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, services: updated }
                                  })
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">{place.name}</p>
                            {place.address && <p className="text-sm text-muted-foreground">{place.address}</p>}
                            {place.phone && <p className="text-sm text-muted-foreground">{place.phone}</p>}
                            {place.distance && <p className="text-sm text-muted-foreground">{place.distance} away</p>}
                            {place.notes && <p className="text-sm text-muted-foreground mt-2">{place.notes}</p>}
                          </>
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
                        neighborhood: {
                          ...handoffData.neighborhood,
                          services: [...handoffData.neighborhood.services, { name: "" }]
                        }
                      })
                    }}
                  >
                    Add Service
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
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                      setHandoffData({
                        ...handoffData,
                        lastUpdated: new Date()
                      })
                      toast({
                        title: "Changes saved",
                        duration: 3000,
                        description: "Services information has been updated.",
                      })
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              )}
            </>
          )}

          {selectedNeighborhoodSection === 'healthcare' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Heart className="h-6 w-6" />
                  Healthcare
                </DialogTitle>
                <DialogDescription>Hospitals and clinics</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {handoffData.neighborhood.healthcare.map((place, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6 space-y-3">
                        {isEditMode ? (
                          <>
                            <div>
                              <Label className="text-sm font-semibold">Name</Label>
                              <Input
                                value={place.name}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.healthcare]
                                  updated[index] = { ...place, name: e.target.value }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, healthcare: updated }
                                  })
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Address</Label>
                              <Input
                                value={place.address || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.healthcare]
                                  updated[index] = { ...place, address: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, healthcare: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Distance</Label>
                              <Input
                                value={place.distance || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.healthcare]
                                  updated[index] = { ...place, distance: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, healthcare: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Phone</Label>
                              <Input
                                value={place.phone || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.healthcare]
                                  updated[index] = { ...place, phone: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, healthcare: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Notes</Label>
                              <Textarea
                                value={place.notes || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.healthcare]
                                  updated[index] = { ...place, notes: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, healthcare: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                                rows={2}
                              />
                            </div>
                            {handoffData.neighborhood.healthcare.length > 1 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updated = handoffData.neighborhood.healthcare.filter((_, i) => i !== index)
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, healthcare: updated }
                                  })
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">{place.name}</p>
                            {place.address && <p className="text-sm text-muted-foreground">{place.address}</p>}
                            {place.phone && <p className="text-sm text-muted-foreground">{place.phone}</p>}
                            {place.distance && <p className="text-sm text-muted-foreground">{place.distance} away</p>}
                            {place.notes && <p className="text-sm text-muted-foreground mt-2">{place.notes}</p>}
                          </>
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
                        neighborhood: {
                          ...handoffData.neighborhood,
                          healthcare: [...handoffData.neighborhood.healthcare, { name: "" }]
                        }
                      })
                    }}
                  >
                    Add Healthcare Provider
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
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                      setHandoffData({
                        ...handoffData,
                        lastUpdated: new Date()
                      })
                      toast({
                        title: "Changes saved",
                        duration: 3000,
                        description: "Healthcare information has been updated.",
                      })
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              )}
            </>
          )}

          {selectedNeighborhoodSection === 'recreation' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Dumbbell className="h-6 w-6" />
                  Recreation
                </DialogTitle>
                <DialogDescription>Parks and activities</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {handoffData.neighborhood.recreation.map((place, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6 space-y-3">
                        {isEditMode ? (
                          <>
                            <div>
                              <Label className="text-sm font-semibold">Name</Label>
                              <Input
                                value={place.name}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.recreation]
                                  updated[index] = { ...place, name: e.target.value }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, recreation: updated }
                                  })
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Address</Label>
                              <Input
                                value={place.address || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.recreation]
                                  updated[index] = { ...place, address: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, recreation: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Distance</Label>
                              <Input
                                value={place.distance || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.recreation]
                                  updated[index] = { ...place, distance: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, recreation: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Phone</Label>
                              <Input
                                value={place.phone || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.recreation]
                                  updated[index] = { ...place, phone: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, recreation: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Notes</Label>
                              <Textarea
                                value={place.notes || ""}
                                onChange={(e) => {
                                  const updated = [...handoffData.neighborhood.recreation]
                                  updated[index] = { ...place, notes: e.target.value || undefined }
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, recreation: updated }
                                  })
                                }}
                                className="mt-1"
                                placeholder="Optional"
                                rows={2}
                              />
                            </div>
                            {handoffData.neighborhood.recreation.length > 1 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const updated = handoffData.neighborhood.recreation.filter((_, i) => i !== index)
                                  setHandoffData({
                                    ...handoffData,
                                    neighborhood: { ...handoffData.neighborhood, recreation: updated }
                                  })
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">{place.name}</p>
                            {place.address && <p className="text-sm text-muted-foreground">{place.address}</p>}
                            {place.distance && <p className="text-sm text-muted-foreground">{place.distance} away</p>}
                            {place.phone && <p className="text-sm text-muted-foreground">{place.phone}</p>}
                            {place.notes && <p className="text-sm text-muted-foreground mt-2">{place.notes}</p>}
                          </>
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
                        neighborhood: {
                          ...handoffData.neighborhood,
                          recreation: [...handoffData.neighborhood.recreation, { name: "" }]
                        }
                      })
                    }}
                  >
                    Add Recreation Location
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
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                      setHandoffData({
                        ...handoffData,
                        lastUpdated: new Date()
                      })
                      toast({
                        title: "Changes saved",
                        duration: 3000,
                        description: "Recreation information has been updated.",
                      })
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              )}
            </>
          )}

          {selectedNeighborhoodSection === 'schools' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <GraduationCap className="h-6 w-6" />
                  Schools
                </DialogTitle>
                <DialogDescription>Nearby schools and education</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {handoffData.neighborhood.schools.map((school, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      {isEditMode ? (
                        <>
                          <div>
                            <Label className="text-sm font-semibold">Name</Label>
                            <Input
                              value={school.name}
                              onChange={(e) => {
                                const updated = [...handoffData.neighborhood.schools]
                                updated[index] = { ...school, name: e.target.value }
                                setHandoffData({
                                  ...handoffData,
                                  neighborhood: { ...handoffData.neighborhood, schools: updated }
                                })
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-semibold">Type</Label>
                            <Select
                              value={school.type}
                              onValueChange={(value) => {
                                const updated = [...handoffData.neighborhood.schools]
                                updated[index] = { ...school, type: value as 'elementary' | 'middle' | 'high' | 'district' }
                                setHandoffData({
                                  ...handoffData,
                                  neighborhood: { ...handoffData.neighborhood, schools: updated }
                                })
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="elementary">Elementary</SelectItem>
                                <SelectItem value="middle">Middle</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="district">District</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Address</Label>
                            <Input
                              value={school.address || ""}
                              onChange={(e) => {
                                const updated = [...handoffData.neighborhood.schools]
                                updated[index] = { ...school, address: e.target.value || undefined }
                                setHandoffData({
                                  ...handoffData,
                                  neighborhood: { ...handoffData.neighborhood, schools: updated }
                                })
                              }}
                              className="mt-1"
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Phone</Label>
                            <Input
                              value={school.phone || ""}
                              onChange={(e) => {
                                const updated = [...handoffData.neighborhood.schools]
                                updated[index] = { ...school, phone: e.target.value || undefined }
                                setHandoffData({
                                  ...handoffData,
                                  neighborhood: { ...handoffData.neighborhood, schools: updated }
                                })
                              }}
                              className="mt-1"
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Website</Label>
                            <Input
                              value={school.website || ""}
                              onChange={(e) => {
                                const updated = [...handoffData.neighborhood.schools]
                                updated[index] = { ...school, website: e.target.value || undefined }
                                setHandoffData({
                                  ...handoffData,
                                  neighborhood: { ...handoffData.neighborhood, schools: updated }
                                })
                              }}
                              className="mt-1"
                              placeholder="Optional URL"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Bus Stop</Label>
                            <Input
                              value={school.busStop || ""}
                              onChange={(e) => {
                                const updated = [...handoffData.neighborhood.schools]
                                updated[index] = { ...school, busStop: e.target.value || undefined }
                                setHandoffData({
                                  ...handoffData,
                                  neighborhood: { ...handoffData.neighborhood, schools: updated }
                                })
                              }}
                              className="mt-1"
                              placeholder="Optional"
                            />
                          </div>
                          {handoffData.neighborhood.schools.length > 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const updated = handoffData.neighborhood.schools.filter((_, i) => i !== index)
                                setHandoffData({
                                  ...handoffData,
                                  neighborhood: { ...handoffData.neighborhood, schools: updated }
                                })
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{school.name}</p>
                              <Badge variant="outline" className="mt-1 capitalize">{school.type}</Badge>
                            </div>
                          </div>
                          {school.address && <p className="text-sm text-muted-foreground mt-2">{school.address}</p>}
                          {school.phone && <p className="text-sm text-muted-foreground">{school.phone}</p>}
                          {school.website && (
                            <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2">
                              Visit website <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {school.busStop && <p className="text-sm text-muted-foreground mt-2">Bus stop: {school.busStop}</p>}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {isEditMode && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setHandoffData({
                        ...handoffData,
                        neighborhood: {
                          ...handoffData.neighborhood,
                          schools: [...handoffData.neighborhood.schools, { name: "", type: "elementary" }]
                        }
                      })
                    }}
                  >
                    Add School
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
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                      setHandoffData({
                        ...handoffData,
                        lastUpdated: new Date()
                      })
                      toast({
                        title: "Changes saved",
                        duration: 3000,
                        description: "Schools information has been updated.",
                      })
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              )}
            </>
          )}

          {selectedNeighborhoodSection === 'transportation' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Bus className="h-6 w-6" />
                  Transportation
                </DialogTitle>
                <DialogDescription>Public transit and routes</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label className="font-semibold">Public Transit</Label>
                      {isEditMode ? (
                        <Textarea
                          value={handoffData.neighborhood.transportation.publicTransit || ""}
                          onChange={(e) => setHandoffData({
                            ...handoffData,
                            neighborhood: {
                              ...handoffData.neighborhood,
                              transportation: {
                                ...handoffData.neighborhood.transportation,
                                publicTransit: e.target.value || undefined
                              }
                            }
                          })}
                          className="mt-1"
                          placeholder="Optional"
                          rows={3}
                        />
                      ) : (
                        handoffData.neighborhood.transportation.publicTransit && (
                          <p className="text-sm text-muted-foreground mt-1">{handoffData.neighborhood.transportation.publicTransit}</p>
                        )
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold">Bus Stops (comma-separated)</Label>
                      {isEditMode ? (
                        <Input
                          value={(handoffData.neighborhood.transportation.busStops || []).join(", ")}
                          onChange={(e) => setHandoffData({
                            ...handoffData,
                            neighborhood: {
                              ...handoffData.neighborhood,
                              transportation: {
                                ...handoffData.neighborhood.transportation,
                                busStops: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                              }
                            }
                          })}
                          className="mt-1"
                          placeholder="e.g., Main St & 1st Ave, Oak St & 2nd Ave"
                        />
                      ) : (
                        handoffData.neighborhood.transportation.busStops && handoffData.neighborhood.transportation.busStops.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                            {handoffData.neighborhood.transportation.busStops.map((stop, i) => (
                              <li key={i}>{stop}</li>
                            ))}
                          </ul>
                        )
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold">Train Stations (comma-separated)</Label>
                      {isEditMode ? (
                        <Input
                          value={(handoffData.neighborhood.transportation.trainStations || []).join(", ")}
                          onChange={(e) => setHandoffData({
                            ...handoffData,
                            neighborhood: {
                              ...handoffData.neighborhood,
                              transportation: {
                                ...handoffData.neighborhood.transportation,
                                trainStations: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                              }
                            }
                          })}
                          className="mt-1"
                          placeholder="e.g., Central Station, North Station"
                        />
                      ) : (
                        handoffData.neighborhood.transportation.trainStations && handoffData.neighborhood.transportation.trainStations.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                            {handoffData.neighborhood.transportation.trainStations.map((station, i) => (
                              <li key={i}>{station}</li>
                            ))}
                          </ul>
                        )
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold">Ride Share Spots (comma-separated)</Label>
                      {isEditMode ? (
                        <Input
                          value={(handoffData.neighborhood.transportation.rideShareSpots || []).join(", ")}
                          onChange={(e) => setHandoffData({
                            ...handoffData,
                            neighborhood: {
                              ...handoffData.neighborhood,
                              transportation: {
                                ...handoffData.neighborhood.transportation,
                                rideShareSpots: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                              }
                            }
                          })}
                          className="mt-1"
                          placeholder="e.g., Main entrance, Back parking lot"
                        />
                      ) : (
                        handoffData.neighborhood.transportation.rideShareSpots && handoffData.neighborhood.transportation.rideShareSpots.length > 0 && (
                          <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                            {handoffData.neighborhood.transportation.rideShareSpots.map((spot, i) => (
                              <li key={i}>{spot}</li>
                            ))}
                          </ul>
                        )
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold">Bike Lanes</Label>
                      {isEditMode ? (
                        <Input
                          value={handoffData.neighborhood.transportation.bikeLanes || ""}
                          onChange={(e) => setHandoffData({
                            ...handoffData,
                            neighborhood: {
                              ...handoffData.neighborhood,
                              transportation: {
                                ...handoffData.neighborhood.transportation,
                                bikeLanes: e.target.value || undefined
                              }
                            }
                          })}
                          className="mt-1"
                          placeholder="Optional"
                        />
                      ) : (
                        handoffData.neighborhood.transportation.bikeLanes && (
                          <p className="text-sm text-muted-foreground mt-1">{handoffData.neighborhood.transportation.bikeLanes}</p>
                        )
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold">Airport Distance</Label>
                      {isEditMode ? (
                        <Input
                          value={handoffData.neighborhood.transportation.airportDistance || ""}
                          onChange={(e) => setHandoffData({
                            ...handoffData,
                            neighborhood: {
                              ...handoffData.neighborhood,
                              transportation: {
                                ...handoffData.neighborhood.transportation,
                                airportDistance: e.target.value || undefined
                              }
                            }
                          })}
                          className="mt-1"
                          placeholder="Optional"
                        />
                      ) : (
                        handoffData.neighborhood.transportation.airportDistance && (
                          <p className="text-sm text-muted-foreground mt-1">{handoffData.neighborhood.transportation.airportDistance} away</p>
                        )
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold">Airport Directions</Label>
                      {isEditMode ? (
                        <Textarea
                          value={handoffData.neighborhood.transportation.airportDirections || ""}
                          onChange={(e) => setHandoffData({
                            ...handoffData,
                            neighborhood: {
                              ...handoffData.neighborhood,
                              transportation: {
                                ...handoffData.neighborhood.transportation,
                                airportDirections: e.target.value || undefined
                              }
                            }
                          })}
                          className="mt-1"
                          placeholder="Optional"
                          rows={3}
                        />
                      ) : (
                        handoffData.neighborhood.transportation.airportDirections && (
                          <p className="text-sm text-muted-foreground mt-1">{handoffData.neighborhood.transportation.airportDirections}</p>
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
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                      setHandoffData({
                        ...handoffData,
                        lastUpdated: new Date()
                      })
                      toast({
                        title: "Changes saved",
                        duration: 3000,
                        description: "Transportation information has been updated.",
                      })
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </DialogFooter>
              )}
            </>
          )}

          {selectedNeighborhoodSection === 'local-services' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Calendar className="h-6 w-6" />
                  Local Services & Important Info
                </DialogTitle>
                <DialogDescription>Community services and schedules</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {handoffData.localServices.map((service, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      {isEditMode ? (
                        <>
                          <div>
                            <Label className="text-sm font-semibold">Name</Label>
                            <Input
                              value={service.name}
                              onChange={(e) => {
                                const updated = [...handoffData.localServices]
                                updated[index] = { ...service, name: e.target.value }
                                setHandoffData({
                                  ...handoffData,
                                  localServices: updated
                                })
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-semibold">Type</Label>
                            <Select
                              value={service.type}
                              onValueChange={(value) => {
                                const updated = [...handoffData.localServices]
                                updated[index] = { ...service, type: value as 'trash' | 'street_cleaning' | 'snow_removal' | 'lawn_care' | 'pest_control' | 'hoa' | 'other' }
                                setHandoffData({
                                  ...handoffData,
                                  localServices: updated
                                })
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="trash">Trash</SelectItem>
                                <SelectItem value="street_cleaning">Street Cleaning</SelectItem>
                                <SelectItem value="snow_removal">Snow Removal</SelectItem>
                                <SelectItem value="lawn_care">Lawn Care</SelectItem>
                                <SelectItem value="pest_control">Pest Control</SelectItem>
                                <SelectItem value="hoa">HOA</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Schedule</Label>
                            <Input
                              value={service.schedule || ""}
                              onChange={(e) => {
                                const updated = [...handoffData.localServices]
                                updated[index] = { ...service, schedule: e.target.value || undefined }
                                setHandoffData({
                                  ...handoffData,
                                  localServices: updated
                                })
                              }}
                              className="mt-1"
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground">Contact</Label>
                            <Input
                              value={service.contact || ""}
                              onChange={(e) => {
                                const updated = [...handoffData.localServices]
                                updated[index] = { ...service, contact: e.target.value || undefined }
                                setHandoffData({
                                  ...handoffData,
                                  localServices: updated
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
                                const updated = [...handoffData.localServices]
                                updated[index] = { ...service, notes: e.target.value || undefined }
                                setHandoffData({
                                  ...handoffData,
                                  localServices: updated
                                })
                              }}
                              className="mt-1"
                              placeholder="Optional"
                              rows={2}
                            />
                          </div>
                          {handoffData.localServices.length > 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const updated = handoffData.localServices.filter((_, i) => i !== index)
                                setHandoffData({
                                  ...handoffData,
                                  localServices: updated
                                })
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-semibold">{service.name}</p>
                          {service.schedule && <p className="text-sm text-muted-foreground">Schedule: {service.schedule}</p>}
                          {service.contact && <p className="text-sm text-muted-foreground">Contact: {service.contact}</p>}
                          {service.notes && <p className="text-sm text-muted-foreground mt-2">{service.notes}</p>}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {isEditMode && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setHandoffData({
                        ...handoffData,
                        localServices: [...handoffData.localServices, { name: "", type: "other" }]
                      })
                    }}
                  >
                    Add Local Service
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
                      setSelectedNeighborhoodSection(null)
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setOriginalHandoffData(JSON.parse(JSON.stringify(handoffData)))
                      setHandoffData({
                        ...handoffData,
                        lastUpdated: new Date()
                      })
                      toast({
                        title: "Changes saved",
                        duration: 3000,
                        description: "Local Services information has been updated.",
                      })
                      setSelectedNeighborhoodSection(null)
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
