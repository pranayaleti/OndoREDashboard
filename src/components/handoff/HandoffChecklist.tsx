import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare } from "lucide-react"
import { PropertyHandoff } from "@/types/handoff.types"

interface HandoffChecklistProps {
  handoffData: PropertyHandoff
  checklistItems: Record<string, boolean>
  isEditMode: boolean
  canEdit: boolean | null | undefined
  completedCount: number
  totalCount: number
  onChecklistToggle: (id: string) => void
  setHandoffData: (data: PropertyHandoff) => void
  setChecklistItems: (items: Record<string, boolean>) => void
}

export function HandoffChecklist({
  handoffData,
  checklistItems,
  isEditMode,
  canEdit,
  completedCount,
  totalCount,
  onChecklistToggle,
  setHandoffData,
  setChecklistItems,
}: HandoffChecklistProps) {
  return (
    <TabsContent value="checklist" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Move-In Checklist
              </CardTitle>
              <CardDescription className="mt-2">
                Track your progress: {completedCount} of {totalCount} completed
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round((completedCount / totalCount) * 100)}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(
              handoffData.moveInChecklist.reduce((acc, item) => {
                if (!acc[item.category]) acc[item.category] = []
                acc[item.category].push(item)
                return acc
              }, {} as Record<string, typeof handoffData.moveInChecklist>)
            ).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-semibold mb-3 capitalize">{category}</h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      {isEditMode && canEdit ? (
                        <>
                          <Checkbox
                            id={item.id}
                            checked={checklistItems[item.id] || false}
                            onCheckedChange={() => onChecklistToggle(item.id)}
                            disabled={true}
                          />
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.label}
                              onChange={(e) => {
                                const updatedChecklist = handoffData.moveInChecklist.map(checklistItem =>
                                  checklistItem.id === item.id
                                    ? { ...checklistItem, label: e.target.value }
                                    : checklistItem
                                )
                                setHandoffData({
                                  ...handoffData,
                                  moveInChecklist: updatedChecklist
                                })
                              }}
                              placeholder="Checklist item"
                            />
                            <Select
                              value={item.category}
                              onValueChange={(value) => {
                                const updatedChecklist = handoffData.moveInChecklist.map(checklistItem =>
                                  checklistItem.id === item.id
                                    ? { ...checklistItem, category: value }
                                    : checklistItem
                                )
                                setHandoffData({
                                  ...handoffData,
                                  moveInChecklist: updatedChecklist
                                })
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="before-move-in">Before Move-In</SelectItem>
                                <SelectItem value="move-in-day">Move-In Day</SelectItem>
                                <SelectItem value="first-week">First Week</SelectItem>
                                <SelectItem value="utilities">Utilities</SelectItem>
                                <SelectItem value="safety">Safety</SelectItem>
                                <SelectItem value="documents">Documents</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {handoffData.moveInChecklist.length > 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const updatedChecklist = handoffData.moveInChecklist.filter(i => i.id !== item.id)
                                setHandoffData({
                                  ...handoffData,
                                  moveInChecklist: updatedChecklist
                                })
                                const updatedChecklistItems = { ...checklistItems }
                                delete updatedChecklistItems[item.id]
                                setChecklistItems(updatedChecklistItems)
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Checkbox
                            id={item.id}
                            checked={checklistItems[item.id] || false}
                            onCheckedChange={() => onChecklistToggle(item.id)}
                          />
                          <label
                            htmlFor={item.id}
                            className={`flex-1 cursor-pointer ${checklistItems[item.id] ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {item.label}
                          </label>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {isEditMode && canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      const newId = `checklist-${Date.now()}`
                      setHandoffData({
                        ...handoffData,
                        moveInChecklist: [...handoffData.moveInChecklist, {
                          id: newId,
                          label: "",
                          completed: false,
                          category: category
                        }]
                      })
                    }}
                  >
                    Add Item to {category}
                  </Button>
                )}
                <Separator className="my-4" />
              </div>
            ))}
            {isEditMode && canEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  const newId = `checklist-${Date.now()}`
                  setHandoffData({
                    ...handoffData,
                    moveInChecklist: [...handoffData.moveInChecklist, {
                      id: newId,
                      label: "",
                      completed: false,
                      category: "before-move-in"
                    }]
                  })
                }}
              >
                Add New Category Item
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}
