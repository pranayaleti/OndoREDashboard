import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CheckCircle2, Circle, Clock, AlertTriangle, Plus, Loader2, ChevronDown, ChevronRight, CalendarDays,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiGet, apiPost, apiPut } from "@/lib/api/http"

interface ChecklistItem {
  id: string
  label: string
  isDone: boolean
}

interface Task {
  id: string
  title: string
  description: string
  taskType: string
  status: string
  priority: string
  propertyId: string | null
  assignedTo: string | null
  dueDate: string | null
  completedAt: string | null
  checklistItems?: ChecklistItem[]
  createdAt: string
}

interface TaskStats {
  byStatus: Record<string, number>
  byType: Record<string, number>
  overdueCount: number
  total: number
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Circle className="h-4 w-4 text-gray-400" />,
  in_progress: <Clock className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
}

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  urgent: "destructive",
}

export default function ManagerTasks() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", description: "", taskType: "general", priority: "medium" })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const [taskData, statsData] = await Promise.all([
        apiGet<{ tasks: Task[] }>("/tasks"),
        apiGet<TaskStats>("/tasks/stats"),
      ])
      setTasks(taskData.tasks ?? [])
      setStats(statsData)
    } catch {
      toast({ title: "Failed to load tasks", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter)

  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed"
  ).length

  const handleCreate = async () => {
    if (!newTask.title.trim()) return
    setSaving(true)
    try {
      await apiPost("/tasks", newTask)
      toast({ title: "Task created" })
      setShowNewDialog(false)
      setNewTask({ title: "", description: "", taskType: "general", priority: "medium" })
      load()
    } catch {
      toast({ title: "Failed to create task", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const toggleChecklist = async (taskId: string, itemId: string, isDone: boolean) => {
    try {
      await apiPut(`/tasks/${taskId}/checklist/${itemId}`, { isDone: !isDone })
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                checklistItems: t.checklistItems?.map((c) =>
                  c.id === itemId ? { ...c, isDone: !isDone } : c
                ),
              }
            : t
        )
      )
    } catch {
      toast({ title: "Failed to update checklist", variant: "destructive" })
    }
  }

  const checklistProgress = (items?: ChecklistItem[]) => {
    if (!items?.length) return 0
    return Math.round((items.filter((i) => i.isDone).length / items.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={stats?.byStatus?.pending ?? 0} icon={<Circle className="h-5 w-5 text-gray-400" />} />
        <StatCard label="In Progress" value={stats?.byStatus?.in_progress ?? 0} icon={<Clock className="h-5 w-5 text-blue-500" />} />
        <StatCard label="Completed" value={stats?.byStatus?.completed ?? 0} icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} />
        <StatCard label="Overdue" value={overdue} icon={<AlertTriangle className="h-5 w-5 text-red-500" />} />
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Task list */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No tasks match this filter.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const expanded = expandedId === task.id
            const progress = checklistProgress(task.checklistItems)
            return (
              <Card key={task.id} className="transition-shadow hover:shadow-md">
                <button
                  type="button"
                  className="flex w-full items-start gap-3 p-4 text-left"
                  onClick={() => setExpandedId(expanded ? null : task.id)}
                >
                  {expanded ? <ChevronDown className="mt-0.5 h-4 w-4 shrink-0" /> : <ChevronRight className="mt-0.5 h-4 w-4 shrink-0" />}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {STATUS_ICON[task.status] ?? <Circle className="h-4 w-4" />}
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className="text-xs">{task.taskType}</Badge>
                      <Badge variant={PRIORITY_VARIANT[task.priority] ?? "outline"} className="text-xs capitalize">
                        {task.priority}
                      </Badge>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {task.checklistItems && task.checklistItems.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <Progress value={progress} className="h-1.5 w-24" />
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                    )}
                  </div>
                </button>

                {expanded && (
                  <CardContent className="border-t pt-4">
                    {task.description && <p className="mb-3 text-sm text-muted-foreground">{task.description}</p>}
                    {task.checklistItems && task.checklistItems.length > 0 && (
                      <ul className="space-y-2">
                        {task.checklistItems.map((item) => (
                          <li key={item.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={item.isDone}
                              onCheckedChange={() => toggleChecklist(task.id, item.id, item.isDone)}
                            />
                            <span className={item.isDone ? "text-sm line-through text-muted-foreground" : "text-sm"}>
                              {item.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* New Task Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={newTask.description} onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newTask.taskType} onValueChange={(v) => setNewTask((p) => ({ ...p, taskType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="lease">Lease</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !newTask.title.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
