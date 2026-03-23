import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ClipboardList, Plus, BarChart3, Play } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Survey {
  id: string
  title: string
  description: string | null
  status: string
  closesAt: string | null
  createdAt: string
}

interface SurveyManagerProps {
  propertyId: string
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  active: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
}

export function SurveyManager({ propertyId }: SurveyManagerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [resultsId, setResultsId] = useState<string | null>(null)
  const [results, setResults] = useState<any>(null)

  // Create form
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState([{ questionText: "", questionType: "rating" as string }])
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [propertyId])

  const load = async () => {
    try {
      setLoading(true)
      const data = await featureApi.surveys.list(propertyId)
      setSurveys(data as Survey[])
    } catch {
      toast({ title: "Failed to load surveys", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!title || questions.every((q) => !q.questionText)) return
    try {
      setSaving(true)
      await featureApi.surveys.create(propertyId, {
        title,
        description: description || undefined,
        questions: questions.filter((q) => q.questionText),
      })
      toast({ title: "Survey created" })
      setCreateOpen(false)
      setTitle("")
      setDescription("")
      setQuestions([{ questionText: "", questionType: "rating" }])
      await load()
    } catch {
      toast({ title: "Failed to create survey", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await featureApi.surveys.activate(id)
      toast({ title: "Survey activated — tenants notified" })
      await load()
    } catch {
      toast({ title: "Failed to activate", variant: "destructive" })
    }
  }

  const viewResults = async (id: string) => {
    try {
      const data = await featureApi.surveys.getResults(id)
      setResults((data as any)?.data ?? data)
      setResultsId(id)
    } catch {
      toast({ title: "Failed to load results", variant: "destructive" })
    }
  }

  const addQuestion = () => {
    setQuestions([...questions, { questionText: "", questionType: "rating" }])
  }

  if (loading) return <Skeleton className="h-32 w-full" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-indigo-500" /> Tenant Surveys
        </h3>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create
        </Button>
      </div>

      {surveys.length === 0 ? (
        <p className="text-center text-slate-500 py-6 text-sm">No surveys yet</p>
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[s.status]}>{s.status}</Badge>
                {s.status === "draft" && (
                  <Button variant="ghost" size="icon" onClick={() => handleActivate(s.id)}>
                    <Play className="h-4 w-4 text-green-500" />
                  </Button>
                )}
                {s.status !== "draft" && (
                  <Button variant="ghost" size="icon" onClick={() => viewResults(s.id)}>
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Survey Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Survey</DialogTitle>
            <DialogDescription>Create a satisfaction survey for your tenants.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2 max-h-96 overflow-y-auto">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Survey title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-3">
              <Label>Questions</Label>
              {questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={q.questionText}
                    onChange={(e) => {
                      const updated = [...questions]
                      updated[i].questionText = e.target.value
                      setQuestions(updated)
                    }}
                    placeholder={`Question ${i + 1}`}
                  />
                  <Select
                    value={q.questionType}
                    onValueChange={(v) => {
                      const updated = [...questions]
                      updated[i].questionType = v
                      setQuestions(updated)
                    }}
                  >
                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Rating (1-5)</SelectItem>
                      <SelectItem value="nps">NPS (0-10)</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="yes_no">Yes/No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-3 w-3 mr-1" /> Add Question
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !title}>
              {saving ? "Creating..." : "Create Survey"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={!!resultsId} onOpenChange={() => setResultsId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Survey Results</DialogTitle>
          </DialogHeader>
          {results && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{results.totalResponses} responses</p>
              {(results.questions || []).map((q: any) => (
                <div key={q.questionId} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm font-medium mb-1">{q.questionText}</p>
                  <p className="text-xs text-slate-500">{q.totalAnswers} answers</p>
                  {q.average !== null && q.average !== undefined && (
                    <p className="text-lg font-bold text-blue-600 mt-1">{q.average} avg</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
