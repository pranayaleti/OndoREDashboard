import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
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
  id: string | null
  propertyId: string
  templateId: string | null
  criteria: Record<string, unknown>
  requiredChecks: VerificationCheckType[]
  applicantDisclosureNotes: string | null
  availableOptionalChecks: VerificationCheckType[]
}

interface ScreeningConfigWizardProps {
  propertyId: string
}

type VerificationCheckType =
  | "credit"
  | "criminal"
  | "eviction"
  | "income"
  | "identity"
  | "references"

const VERIFICATION_CHECK_TYPES: VerificationCheckType[] = [
  "credit",
  "criminal",
  "eviction",
  "income",
  "identity",
  "references",
]

function isVerificationCheckType(value: unknown): value is VerificationCheckType {
  return typeof value === "string" && VERIFICATION_CHECK_TYPES.includes(value as VerificationCheckType)
}

function normalizeChecks(value: unknown): VerificationCheckType[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(new Set(value.filter(isVerificationCheckType)))
}

export function ScreeningConfigWizard({ propertyId }: ScreeningConfigWizardProps) {
  const { t } = useTranslation("owner")
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<ScreeningTemplate[]>([])
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [criteria, setCriteria] = useState<Record<string, unknown>>({})
  const [requiredChecks, setRequiredChecks] = useState<VerificationCheckType[]>([])
  const [availableOptionalChecks, setAvailableOptionalChecks] = useState<VerificationCheckType[]>([])
  const [applicantDisclosureNotes, setApplicantDisclosureNotes] = useState("")

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
      setSelectedTemplateId((parsed as ScreeningConfig | null)?.templateId ?? null)
      setCriteria((parsed as ScreeningConfig | null)?.criteria ?? {})
      setRequiredChecks(normalizeChecks((parsed as ScreeningConfig | null)?.requiredChecks))
      setAvailableOptionalChecks(
        normalizeChecks((parsed as ScreeningConfig | null)?.availableOptionalChecks),
      )
      setApplicantDisclosureNotes((parsed as ScreeningConfig | null)?.applicantDisclosureNotes ?? "")
      setQuestions(qs as ScreeningQuestion[])
    } catch (err: unknown) {
      toast({
        title: t("screeningConfig.loadError"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      await featureApi.screeningConfig.setConfig(
        propertyId,
        selectedTemplateId,
        criteria,
        requiredChecks,
        applicantDisclosureNotes.trim() || null,
      )
      toast({ title: t("screeningConfig.saveSuccess") })
      await loadData()
    } catch (err: unknown) {
      toast({
        title: t("screeningConfig.saveError"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
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
      toast({ title: t("screeningConfig.addQuestionSuccess") })
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
      toast({
        title: t("screeningConfig.addQuestionError"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    }
  }

  const deleteQuestion = async (questionId: string) => {
    try {
      await featureApi.screeningConfig.deleteQuestion(questionId)
      toast({ title: t("screeningConfig.deleteQuestionSuccess") })
      await loadData()
    } catch (err: unknown) {
      toast({
        title: t("screeningConfig.deleteQuestionError"),
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      })
    }
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
  const selectedTemplateChecks = normalizeChecks(selectedTemplate?.checks ?? [])

  const getCheckLabel = (check: VerificationCheckType) => t(`screeningConfig.checkLabels.${check}`)

  const getQuestionTypeLabel = (questionType: ScreeningQuestion["questionType"]) =>
    t(`screeningConfig.questionTypes.${questionType}`)

  const updateTemplateSelection = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    const optionalSelections = requiredChecks.filter((check) =>
      availableOptionalChecks.includes(check),
    )

    setSelectedTemplateId(templateId)
    setCriteria(template?.defaultCriteria ?? {})
    setRequiredChecks(Array.from(new Set([...normalizeChecks(template?.checks ?? []), ...optionalSelections])))
  }

  const toggleOptionalCheck = (check: VerificationCheckType, enabled: boolean) => {
    if (enabled) {
      setRequiredChecks((currentChecks) => Array.from(new Set([...currentChecks, ...selectedTemplateChecks, check])))
      return
    }

    setRequiredChecks((currentChecks) =>
      Array.from(
        new Set(
          currentChecks.filter(
            (existingCheck) => existingCheck !== check || selectedTemplateChecks.includes(existingCheck),
          ),
        ),
      ),
    )
  }

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
            {t("screeningConfig.templateTitle")}
          </CardTitle>
          <CardDescription>
            {t("screeningConfig.templateDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => updateTemplateSelection(tpl.id)}
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
                  {normalizeChecks(tpl.checks ?? []).map((check) => (
                    <Badge key={check} variant="secondary" className="text-xs">
                      {getCheckLabel(check)}
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
            <CardTitle className="text-base">{t("screeningConfig.criteriaTitle")}</CardTitle>
            <CardDescription>
              {t("screeningConfig.criteriaDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTemplate.checks?.includes("credit") && (
                <div className="space-y-2">
                  <Label>{t("screeningConfig.criteria.minCreditScore")}</Label>
                  <Input
                    type="number"
                    value={String(criteria.minCreditScore ?? "")}
                    onChange={(e) =>
                      setCriteria({ ...criteria, minCreditScore: Number(e.target.value) || null })
                    }
                    placeholder={t("screeningConfig.criteria.minCreditScorePlaceholder")}
                  />
                </div>
              )}
              {selectedTemplate.checks?.includes("income") && (
                <div className="space-y-2">
                  <Label>{t("screeningConfig.criteria.minIncomeRatio")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={String(criteria.minIncomeRatio ?? "")}
                    onChange={(e) =>
                      setCriteria({ ...criteria, minIncomeRatio: Number(e.target.value) || null })
                    }
                    placeholder={t("screeningConfig.criteria.minIncomeRatioPlaceholder")}
                  />
                </div>
              )}
              {selectedTemplate.checks?.includes("eviction") && (
                <div className="flex items-center justify-between p-3 bg-muted dark:bg-card rounded-lg">
                  <Label>{t("screeningConfig.criteria.noEvictions")}</Label>
                  <Switch
                    checked={criteria.noEvictions === true}
                    onCheckedChange={(v) => setCriteria({ ...criteria, noEvictions: v })}
                  />
                </div>
              )}
              {selectedTemplate.checks?.includes("criminal") && (
                <div className="flex items-center justify-between p-3 bg-muted dark:bg-card rounded-lg">
                  <Label>{t("screeningConfig.criteria.noCriminal")}</Label>
                  <Switch
                    checked={criteria.noCriminal === true}
                    onCheckedChange={(v) => setCriteria({ ...criteria, noCriminal: v })}
                  />
                </div>
              )}
            </div>
            {availableOptionalChecks.length > 0 && (
              <div className="mt-6 space-y-4 rounded-lg border bg-muted/60 p-4 dark:bg-card/40">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t("screeningConfig.optionalChecksTitle")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("screeningConfig.optionalChecksDescription")}
                  </p>
                </div>
                {availableOptionalChecks.includes("identity") && (
                  <div className="flex items-center justify-between gap-4 rounded-lg border bg-background p-3">
                    <div className="space-y-1">
                      <Label>{t("screeningConfig.optionalChecks.identityLabel")}</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t("screeningConfig.optionalChecks.identityDescription")}
                      </p>
                    </div>
                    <Switch
                      checked={requiredChecks.includes("identity")}
                      onCheckedChange={(checked) => toggleOptionalCheck("identity", checked)}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="mt-6 space-y-2">
              <Label>{t("screeningConfig.applicantNotesTitle")}</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("screeningConfig.applicantNotesDescription")}
              </p>
              <Textarea
                value={applicantDisclosureNotes}
                onChange={(event) => setApplicantDisclosureNotes(event.target.value)}
                placeholder={t("screeningConfig.applicantNotesPlaceholder")}
                maxLength={4000}
                rows={5}
              />
            </div>
            <div className="mt-6 space-y-2">
              <Label>{t("screeningConfig.selectedChecks")}</Label>
              <div className="flex flex-wrap gap-2">
                {requiredChecks.map((check) => (
                  <Badge key={check} variant="secondary">
                    {getCheckLabel(check)}
                  </Badge>
                ))}
              </div>
            </div>
            <Button onClick={saveConfig} disabled={saving} className="mt-4">
              <Save className="h-4 w-4 mr-2" />
              {saving ? t("screeningConfig.saving") : t("screeningConfig.save")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Custom Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("screeningConfig.questionsTitle")}</CardTitle>
              <CardDescription>
                {t("screeningConfig.questionsDescription")}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAddQuestion(true)}>
              <Plus className="h-4 w-4 mr-1" /> {t("screeningConfig.addQuestion")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              {t("screeningConfig.emptyQuestions")}
            </p>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-start gap-3 p-3 bg-muted dark:bg-card rounded-lg border"
                >
                  <GripVertical className="h-5 w-5 text-slate-300 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{q.questionText}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getQuestionTypeLabel(q.questionType)}
                      </Badge>
                      {q.isRequired && (
                        <Badge variant="secondary" className="text-xs">
                          {t("screeningConfig.questionRequired")}
                        </Badge>
                      )}
                      {q.isPassFail && (
                        <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          {t("screeningConfig.questionPassFail")}
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
                        <AlertDialogTitle>{t("screeningConfig.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("screeningConfig.deleteDescription")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("screeningConfig.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteQuestion(q.id)}>
                          {t("screeningConfig.deleteConfirm")}
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
            <div className="mt-4 p-4 border rounded-lg bg-card dark:bg-card space-y-4">
              <div className="space-y-2">
                <Label>{t("screeningConfig.questionText")}</Label>
                <Input
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  placeholder={t("screeningConfig.questionTextPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("screeningConfig.questionTypeLabel")}</Label>
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
                      <SelectItem value="text">{t("screeningConfig.questionTypes.text")}</SelectItem>
                      <SelectItem value="yes_no">{t("screeningConfig.questionTypes.yes_no")}</SelectItem>
                      <SelectItem value="multiple_choice">{t("screeningConfig.questionTypes.multiple_choice")}</SelectItem>
                      <SelectItem value="number">{t("screeningConfig.questionTypes.number")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newQuestion.questionType === "multiple_choice" && (
                  <div className="space-y-2">
                    <Label>{t("screeningConfig.optionsLabel")}</Label>
                    <Input
                      value={newQuestion.options}
                      onChange={(e) => setNewQuestion({ ...newQuestion, options: e.target.value })}
                      placeholder={t("screeningConfig.optionsPlaceholder")}
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
                  <Label>{t("screeningConfig.questionRequired")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newQuestion.isPassFail}
                    onCheckedChange={(v) => setNewQuestion({ ...newQuestion, isPassFail: v })}
                  />
                  <Label>{t("screeningConfig.questionPassFail")}</Label>
                </div>
              </div>
              {newQuestion.isPassFail && (
                <div className="space-y-2">
                  <Label>{t("screeningConfig.expectedAnswerLabel")}</Label>
                  <Input
                    value={newQuestion.expectedAnswer}
                    onChange={(e) => setNewQuestion({ ...newQuestion, expectedAnswer: e.target.value })}
                    placeholder={
                      newQuestion.questionType === "yes_no"
                        ? t("screeningConfig.expectedAnswerYesNoPlaceholder")
                        : t("screeningConfig.expectedAnswerPlaceholder")
                    }
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={addQuestion} disabled={!newQuestion.questionText.trim()}>
                  {t("screeningConfig.addQuestionConfirm")}
                </Button>
                <Button variant="outline" onClick={() => setShowAddQuestion(false)}>
                  {t("screeningConfig.cancel")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
