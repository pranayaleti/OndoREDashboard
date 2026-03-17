import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Home } from "lucide-react"
import { PropertyHandoff } from "@/types/handoff.types"

interface HandoffOverviewProps {
  handoffData: PropertyHandoff
  isEditMode: boolean
  isTenant: boolean
  setHandoffData: (data: PropertyHandoff) => void
}

export function HandoffOverview({ handoffData, isEditMode, isTenant, setHandoffData }: HandoffOverviewProps) {
  return (
    <TabsContent value="overview" className="space-y-6">
      {isTenant && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <AlertCircle className="h-5 w-5" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
              Welcome to your new home! We've prepared this handoff guide to help you settle in smoothly.
              Start by checking out the <strong>Move-In Checklist</strong> tab to track your progress.
            </p>
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
              onClick={() => {
                const checklistTab = document.querySelector('[value="checklist"]') as HTMLElement
                checklistTab?.click()
              }}
            >
              Go to Move-In Checklist
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Property Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Property Basics
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isEditMode ? (
            <>
              <div>
                <Label htmlFor="property-type" className="text-sm text-muted-foreground">Property Type</Label>
                <Input
                  id="property-type"
                  value={handoffData.propertyBasics.propertyType}
                  onChange={(e) => setHandoffData({
                    ...handoffData,
                    propertyBasics: {
                      ...handoffData.propertyBasics,
                      propertyType: e.target.value
                    }
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="square-footage" className="text-sm text-muted-foreground">Square Footage</Label>
                <Input
                  id="square-footage"
                  type="number"
                  value={handoffData.propertyBasics.squareFootage}
                  onChange={(e) => setHandoffData({
                    ...handoffData,
                    propertyBasics: {
                      ...handoffData.propertyBasics,
                      squareFootage: parseInt(e.target.value) || 0
                    }
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bedrooms" className="text-sm text-muted-foreground">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={handoffData.propertyBasics.bedrooms}
                  onChange={(e) => setHandoffData({
                    ...handoffData,
                    propertyBasics: {
                      ...handoffData.propertyBasics,
                      bedrooms: parseInt(e.target.value) || 0
                    }
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bathrooms" className="text-sm text-muted-foreground">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={handoffData.propertyBasics.bathrooms}
                  onChange={(e) => setHandoffData({
                    ...handoffData,
                    propertyBasics: {
                      ...handoffData.propertyBasics,
                      bathrooms: parseInt(e.target.value) || 0
                    }
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="move-in-date" className="text-sm text-muted-foreground">Move-In Date</Label>
                <Input
                  id="move-in-date"
                  type="date"
                  value={handoffData.propertyBasics.moveInDate instanceof Date
                    ? handoffData.propertyBasics.moveInDate.toISOString().split('T')[0]
                    : new Date(handoffData.propertyBasics.moveInDate).toISOString().split('T')[0]}
                  onChange={(e) => setHandoffData({
                    ...handoffData,
                    propertyBasics: {
                      ...handoffData.propertyBasics,
                      moveInDate: new Date(e.target.value)
                    }
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lease-term" className="text-sm text-muted-foreground">Lease Term</Label>
                <Input
                  id="lease-term"
                  value={handoffData.propertyBasics.leaseTerm}
                  onChange={(e) => setHandoffData({
                    ...handoffData,
                    propertyBasics: {
                      ...handoffData.propertyBasics,
                      leaseTerm: e.target.value
                    }
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="security-deposit" className="text-sm text-muted-foreground">Security Deposit</Label>
                <Input
                  id="security-deposit"
                  type="number"
                  value={handoffData.propertyBasics.securityDeposit}
                  onChange={(e) => setHandoffData({
                    ...handoffData,
                    propertyBasics: {
                      ...handoffData.propertyBasics,
                      securityDeposit: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="parking" className="text-sm text-muted-foreground">Parking</Label>
                <Input
                  id="parking"
                  value={handoffData.propertyBasics.parking}
                  onChange={(e) => setHandoffData({
                    ...handoffData,
                    propertyBasics: {
                      ...handoffData.propertyBasics,
                      parking: e.target.value
                    }
                  })}
                  className="mt-1"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Property Type</p>
                <p className="font-medium">{handoffData.propertyBasics.propertyType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Square Footage</p>
                <p className="font-medium">{handoffData.propertyBasics.squareFootage.toLocaleString()} sq ft</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bedrooms / Bathrooms</p>
                <p className="font-medium">{handoffData.propertyBasics.bedrooms} bed / {handoffData.propertyBasics.bathrooms} bath</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Move-In Date</p>
                <p className="font-medium">
                  {handoffData.propertyBasics.moveInDate instanceof Date
                    ? handoffData.propertyBasics.moveInDate.toLocaleDateString()
                    : new Date(handoffData.propertyBasics.moveInDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lease Term</p>
                <p className="font-medium">{handoffData.propertyBasics.leaseTerm}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Security Deposit</p>
                <p className="font-medium">${handoffData.propertyBasics.securityDeposit.toLocaleString()}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Parking</p>
                <p className="font-medium">{handoffData.propertyBasics.parking}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Emergency Contacts
          </CardTitle>
          <CardDescription>Important numbers for emergencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {handoffData.emergencyContacts.map((contact, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                {isEditMode ? (
                  <>
                    <div>
                      <Label htmlFor={`contact-name-${index}`} className="text-sm font-semibold">Name</Label>
                      <Input
                        id={`contact-name-${index}`}
                        value={contact.name}
                        onChange={(e) => {
                          const updatedContacts = [...handoffData.emergencyContacts]
                          updatedContacts[index] = { ...contact, name: e.target.value }
                          setHandoffData({
                            ...handoffData,
                            emergencyContacts: updatedContacts
                          })
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-phone-${index}`} className="text-sm text-muted-foreground">Phone</Label>
                      <Input
                        id={`contact-phone-${index}`}
                        value={contact.phone}
                        onChange={(e) => {
                          const updatedContacts = [...handoffData.emergencyContacts]
                          updatedContacts[index] = { ...contact, phone: e.target.value }
                          setHandoffData({
                            ...handoffData,
                            emergencyContacts: updatedContacts
                          })
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-email-${index}`} className="text-sm text-muted-foreground">Email (optional)</Label>
                      <Input
                        id={`contact-email-${index}`}
                        type="email"
                        value={contact.email || ""}
                        onChange={(e) => {
                          const updatedContacts = [...handoffData.emergencyContacts]
                          updatedContacts[index] = { ...contact, email: e.target.value || undefined }
                          setHandoffData({
                            ...handoffData,
                            emergencyContacts: updatedContacts
                          })
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-emergency-${index}`} className="text-sm text-red-600 font-medium">Emergency Line (optional)</Label>
                      <Input
                        id={`contact-emergency-${index}`}
                        value={contact.emergencyLine || ""}
                        onChange={(e) => {
                          const updatedContacts = [...handoffData.emergencyContacts]
                          updatedContacts[index] = { ...contact, emergencyLine: e.target.value || undefined }
                          setHandoffData({
                            ...handoffData,
                            emergencyContacts: updatedContacts
                          })
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`contact-notes-${index}`} className="text-sm text-muted-foreground">Notes (optional)</Label>
                      <Textarea
                        id={`contact-notes-${index}`}
                        value={contact.notes || ""}
                        onChange={(e) => {
                          const updatedContacts = [...handoffData.emergencyContacts]
                          updatedContacts[index] = { ...contact, notes: e.target.value || undefined }
                          setHandoffData({
                            ...handoffData,
                            emergencyContacts: updatedContacts
                          })
                        }}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                    {contact.emergencyLine && (
                      <p className="text-sm text-red-600 font-medium">Emergency: {contact.emergencyLine}</p>
                    )}
                    {contact.notes && <p className="text-sm text-muted-foreground mt-1">{contact.notes}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}
