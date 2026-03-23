import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, Send } from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface BulkInviteDialogProps {
  propertyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkInviteDialog({ propertyId, open, onOpenChange }: BulkInviteDialogProps) {
  const { toast } = useToast()
  const [emailsText, setEmailsText] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: string[]; failed: string[] } | null>(null)

  const parseEmails = (): string[] => {
    return emailsText
      .split(/[,\n;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"))
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      // Extract emails from CSV — look for email-like strings
      const emails = text.match(/[\w.+-]+@[\w.-]+\.\w+/g) || []
      setEmailsText((prev) => (prev ? prev + "\n" : "") + emails.join("\n"))
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const sendBulk = async () => {
    const emails = parseEmails()
    if (emails.length === 0) return
    try {
      setSending(true)
      const res = await featureApi.applicationActions.bulkInvite(propertyId, emails) as any
      const data = res?.data ?? res
      setResult(data)
      toast({
        title: `${data.sent?.length ?? 0} invitations sent, ${data.failed?.length ?? 0} failed`,
      })
    } catch {
      toast({ title: "Failed to send invitations", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  const emails = parseEmails()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Invite Tenants</DialogTitle>
          <DialogDescription>
            Enter emails or upload a CSV file to send application invitations in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Email Addresses</Label>
            <Textarea
              value={emailsText}
              onChange={(e) => {
                setEmailsText(e.target.value)
                setResult(null)
              }}
              placeholder="tenant1@example.com&#10;tenant2@example.com&#10;tenant3@example.com"
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              Separate with commas, semicolons, or new lines. {emails.length} email{emails.length !== 1 ? "s" : ""} detected.
            </p>
          </div>

          <div>
            <Label className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
              <Upload className="h-4 w-4" />
              Upload CSV
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} />
            </Label>
          </div>

          {result && (
            <div className="text-sm space-y-1">
              <p className="text-green-600">{result.sent.length} sent successfully</p>
              {result.failed.length > 0 && (
                <p className="text-red-600">
                  {result.failed.length} failed: {result.failed.join(", ")}
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={sendBulk} disabled={sending || emails.length === 0}>
              <Send className="h-4 w-4 mr-1.5" />
              {sending ? "Sending..." : `Send ${emails.length} Invite${emails.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
