import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Mail,
  Link2,
  Copy,
  Check,
  Send,
  Trash2,
  Clock,
} from "lucide-react"
import { featureApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface ApplicationLink {
  id: string
  linkType: "email" | "public"
  token: string
  tenantEmail: string | null
  expiresAt: string
  maxUses: number
  useCount: number
  isActive: boolean
  applyUrl: string
}

interface InviteTenantDialogProps {
  propertyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteTenantDialog({ propertyId, open, onOpenChange }: InviteTenantDialogProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [links, setLinks] = useState<ApplicationLink[]>([])
  const [, setLoadingLinks] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [creatingLink, setCreatingLink] = useState(false)

  useEffect(() => {
    if (open) {
      loadLinks()
    }
  }, [open, propertyId])

  const loadLinks = async () => {
    try {
      setLoadingLinks(true)
      const data = await featureApi.applications.getLinks(propertyId)
      setLinks(data as ApplicationLink[])
    } catch {
      // ignore
    } finally {
      setLoadingLinks(false)
    }
  }

  const sendInvite = async () => {
    if (!email.trim()) return
    try {
      setSending(true)
      await featureApi.applications.inviteTenant(propertyId, email.trim())
      toast({ title: `Invitation sent to ${email}` })
      setEmail("")
      await loadLinks()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send invite"
      toast({ title: message, variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  const createPublicLink = async () => {
    try {
      setCreatingLink(true)
      await featureApi.applications.createPublicLink(propertyId)
      toast({ title: "Public link created" })
      await loadLinks()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create link"
      toast({ title: message, variant: "destructive" })
    } finally {
      setCreatingLink(false)
    }
  }

  const deactivateLink = async (linkId: string) => {
    try {
      await featureApi.applications.deactivateLink(linkId)
      toast({ title: "Link deactivated" })
      await loadLinks()
    } catch {
      toast({ title: "Failed to deactivate link", variant: "destructive" })
    }
  }

  const copyToClipboard = async (url: string, linkId: string) => {
    await navigator.clipboard.writeText(url)
    setCopied(linkId)
    setTimeout(() => setCopied(null), 2000)
  }

  const emailLinks = links.filter((l) => l.linkType === "email")
  const publicLinks = links.filter((l) => l.linkType === "public")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Tenant to Apply</DialogTitle>
          <DialogDescription>
            Send an email invitation or create a shareable public link
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="mt-2">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-1.5" /> Email Invite
            </TabsTrigger>
            <TabsTrigger value="public">
              <Link2 className="h-4 w-4 mr-1.5" /> Public Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Tenant Email Address</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tenant@example.com"
                  onKeyDown={(e) => e.key === "Enter" && sendInvite()}
                />
                <Button onClick={sendInvite} disabled={sending || !email.trim()}>
                  <Send className="h-4 w-4 mr-1.5" />
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>

            {emailLinks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 uppercase">Sent Invitations</Label>
                {emailLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-muted dark:bg-card rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{link.tenantEmail}</span>
                      {!link.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-400">
                        {link.useCount}/{link.maxUses} used
                      </span>
                      {link.isActive && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate invitation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                The tenant will no longer be able to use this invitation link.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deactivateLink(link.id)}>
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="public" className="space-y-4 mt-4">
            <p className="text-sm text-slate-500">
              Create a shareable link that anyone can use to apply for this property.
            </p>
            <Button onClick={createPublicLink} disabled={creatingLink}>
              <Link2 className="h-4 w-4 mr-1.5" />
              {creatingLink ? "Creating..." : "Generate Public Link"}
            </Button>

            {publicLinks.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 uppercase">Active Links</Label>
                {publicLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-3 bg-muted dark:bg-card rounded-lg space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={link.applyUrl}
                        className="text-xs font-mono bg-card dark:bg-card"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(link.applyUrl, link.id)}
                      >
                        {copied === link.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span>{link.useCount} uses</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Expires {new Date(link.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                      {link.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-red-500 hover:text-red-600"
                          onClick={() => deactivateLink(link.id)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
