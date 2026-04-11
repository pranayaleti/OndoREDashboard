import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, Send, Trash2 } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Comment {
  id: string
  comment: string
  createdAt: string
  user?: { firstName: string; lastName: string; email: string }
}

interface ApplicationCommentsProps {
  applicationId: string
}

export function ApplicationComments({ applicationId }: ApplicationCommentsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [applicationId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const data = await featureApi.applicationComments.list(applicationId)
      setComments(data as Comment[])
    } catch {
      toast({ title: "Error", description: "Failed to load comments.", duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    try {
      setSubmitting(true)
      await featureApi.applicationComments.add(applicationId, newComment.trim())
      setNewComment("")
      await loadComments()
    } catch {
      toast({ title: "Failed to add comment", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const removeComment = async (commentId: string) => {
    try {
      await featureApi.applicationComments.remove(commentId)
      await loadComments()
    } catch {
      toast({ title: "Failed to delete comment", variant: "destructive" })
    }
  }

  if (loading) {
    return <Skeleton className="h-24 w-full" />
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
        <MessageSquare className="h-4 w-4" />
        Notes & Comments ({comments.length})
      </h4>

      {comments.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="bg-muted dark:bg-card rounded-lg p-3 text-sm group">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-xs text-slate-600 dark:text-slate-400">
                  {c.user ? `${c.user.firstName} ${c.user.lastName}` : "Unknown"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => removeComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-300">{c.comment}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="text-sm"
        />
        <Button
          size="icon"
          onClick={addComment}
          disabled={submitting || !newComment.trim()}
          className="flex-shrink-0 self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
