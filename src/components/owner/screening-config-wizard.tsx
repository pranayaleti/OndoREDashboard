import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Shield,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Save,
} from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ScreeningTemplate {
  id: string
  name: string
  displayName: string
  description: string
  checks: string[]
  defaultCriteria: Record<string, unknown>
  sortOrder: number
}

interface ScreeningQuestion {
  id: string
  questionText: string
  questionType: "text" | "multiple_choice" | "yes_no" | "number"
  options: string[] | null
  isRequired: boolean
  isPassFail: boolean
  expectedAnswer: unknown
  sortOrder: number
}

interface ScreeningConfig {
  id: string
  templateId: string | null
  criteria: Record<string, unknown>
}

interface ScreeningConfigWizardProps {
  propertyId: string
}

const checkLabels: Record<string, string> = {
  credit: "Credit Check",
  criminal: "Criminal History",
  eviction: "Eviction History",
  income: "Income Verification",
  identity: "Identity Verification",
  references: "Reference Check",
}

export function ScreeningConfigWizard({ propertyId }: ScreeningConfigWizardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<ScreeningTemplate[]>([])
  const [, setConfig] = useState<ScreeningConfig | null>(null)
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [criteria, setCriteria] = useState<Record<string, unknown>>({})

  // New question form
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    questionType: "text" as "text" | "multiple_choice" | "yes_no" | "number",
    isRequired: true,
    isPassFail: false,
    expectedAnswer: "",
    options: "",
  })

  useEffect(() => {
    loadData()
  }, [propertyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tpls, cfg, qs] = await Promise.all([
        featureApi.screeningConfig.getTemplates(),
        featureApi.screeningConfig.getConfig(propertyId).catch(() => null),
        featureApi.screeningConfig.getQuestions(propertyId),
      ])
      setTemplates(tpls as ScreeningTemplate[])
      const configData = cfg as { data?: ScreeningConfig } | ScreeningConfig | null
      const parsed = configData && "data" in configData ? configData.data : configData
      setConfig(parsed as ScreeningConfig | null)
      setSelectedTemplateId((parsed as ScreeningConfig | null)?.templateId ?? null)
      setCriteria((parsed as ScreeningConfig | null)?.criteria ?? {})
      setQuestions(qs as ScreeningQuestion[])
    } catch {
      toast({ title: "Failed to load screening configuration", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      await featureApi.screeningConfig.setConfig(propertyId, selectedTemplateId, criteria)
      toast({ title: "Screening configuration saved" })
      await loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save"
      toast({ title: message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = async () => {
    try {
      const payload: Record<string, unknown> = {
        questionText: newQuestion.questionText,
        questionType: newQuestion.questionType,
        isRequired: newQuestion.isRequired,
        isPassFail: newQuestion.isPassFail,
      }
      if (newQuestion.questionType === "multiple_choice" && newQuestion.options) {
        payload.options = newQuestion.options.split(",").map((o) => o.trim()).filter(Boolean)
      }
      if (newQuestion.isPassFail && newQuestion.expectedAnswer) {
        payload.expectedAnswer = newQuestion.expectedAnswer
      }
      await featureApi.screeningConfig.addQuestion(propertyId, payload)
      toast({ title: "Question added" })
      setShowAddQuestion(false)
      setNewQuestion({
        questionText: "",
        questionType: "text",
        isRequired: true,
        isPassFail: false,
        expectedAnswer: "",
        options: "",
      })
      await loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add question"
      toast({ title: message, variant: "destructive" })
    }
  }

  const deleteQuestion = async (questionId: string) => {
    try {
      await featureApi.screeningConfig.deleteQuestion(questionId)
      toast({ title: "Question removed" })
      await loadData()
    } catch {
      toast({ title: "Failed to delete question", variant: "destructive" })
    }
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Screening Template
          </CardTitle>
          <CardDescription>
            Choose a pre-built screening template based on your subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => {
                  setSelectedTemplateId(tpl.id)
                  setCriteria(tpl.defaultCriteria ?? {})
                }}
                className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                  selectedTemplateId === tpl.id
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{tpl.displayName}</h4>
                  {selectedTemplateId === tpl.id && (
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-3">{tpl.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(tpl.checks ?? []).map((check: string) => (
                    <Badge key={check} variant="secondary" className="text-xs">
                      {checkLabels[check] ?? check}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Criteria */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pass/Fail Criteria</CardTitle>
            <CardDescription>
              Set minimum thresholds for automatic screening evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTemplate.checks?.includes("credit") && (
                <div className="space-y-2">
                  <Label>Minimum Credit Score</Label>
                  <Input
                    type="number"
                    value={String(criteria.minCreditScore ?? "")}
                    onChange={(e) =>
                      setCriteria({ ...criteria, minCreditScore: Number(e.target.value) || null })
                    }
                    placeholder="e.g. 650"
                  />
                </div>
              )}
              {selectedTemplate.checks?.includes("income") && (
                <div className="space-y-2">
                  <Label>Minimum Income-to-Rent Ratio</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={String(criteria.minIncomeRatio ?? "")}
                    onChange={(e) =>
                      setCriteria({ ...criteria, minIncomeRatio: Number(e.target.value) || null })
                    }
                    placeholder="e.g. 3.0"
                  />
                </div>
              )}
              {selectedTemplate.checks?.includes("eviction") && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Label>No Prior Evictions Required</Label>
                  <Switch
                    checked={criteria.noEvictions === true}
                    onCheckedChange={(v) => setCriteria({ ...criteria, noEvictions: v })}
                  />
                </div>
              )}
              {selectedTemplate.checks?.includes("criminal") && (
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Label>No Criminal History Required</Label>
                  <Switch
                    checked={criteria.noCriminal === true}
                    onCheckedChange={(v) => setCriteria({ ...criteria, noCriminal: v })}
                  />
                </div>
              )}
            </div>
            <Button onClick={saveConfig} disabled={saving} className="mt-4">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Custom Screening Questions</CardTitle>
              <CardDescription>
                Add your own questions for applicants to answer
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddQuestion(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No custom questions yet. Add questions to gather additional information from applicants.
            </p>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border"
                >
                  <GripVertical className="h-5 w-5 text-slate-300 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{q.questionText}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {q.questionType.replace("_", " ")}
                      </Badge>
                      {q.isRequired && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                      {q.isPassFail && (
                        <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Pass/Fail
                        </Badge>
                      )}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete question?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the question from all future applications.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteQuestion(q.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}

          {/* Add Question Form */}
          {showAddQuestion && (
            <div className="mt-4 p-4 border rounded-lg bg-white dark:bg-slate-900 space-y-4">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Input
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  placeholder="Enter your question..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={newQuestion.questionType}
                    onValueChange={(v) =>
                      setNewQuestion({ ...newQuestion, questionType: v as typeof newQuestion.questionType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Free Text</SelectItem>
                      <SelectItem value="yes_no">Yes / No</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newQuestion.questionType === "multiple_choice" && (
                  <div className="space-y-2">
                    <Label>Options (comma separated)</Label>
                    <Input
                      value={newQuestion.options}
                      onChange={(e) => setNewQuestion({ ...newQuestion, options: e.target.value })}
                      placeholder="Option A, Option B, Option C"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newQuestion.isRequired}
                    onCheckedChange={(v) => setNewQuestion({ ...newQuestion, isRequired: v })}
                  />
                  <Label>Required</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newQuestion.isPassFail}
                    onCheckedChange={(v) => setNewQuestion({ ...newQuestion, isPassFail: v })}
                  />
                  <Label>Pass/Fail</Label>
                </div>
              </div>
              {newQuestion.isPassFail && (
                <div className="space-y-2">
                  <Label>Expected Answer</Label>
                  <Input
                    value={newQuestion.expectedAnswer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, expectedAnswer: e.target.value })}
                    placeholder={newQuestion.questionType === "yes_no" ? "yes or no" : "Expected value"}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={addQuestion} disabled={!newQuestion.questionText.trim()}>
                  Add Question
                </Button>
                <Button variant="outline" onClick={() => setShowAddQuestion(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
