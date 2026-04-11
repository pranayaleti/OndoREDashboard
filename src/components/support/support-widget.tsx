import { useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { HelpCircle, LifeBuoy, Mail, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const VISIBLE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/dashboard",
  "/owner",
  "/tenant",
  "/maintenance",
  "/handoff",
]

export function SupportWidget() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const shouldShow = useMemo(
    () => VISIBLE_PREFIXES.some((prefix) => location.pathname.startsWith(prefix)),
    [location.pathname],
  )

  if (!shouldShow) {
    return null
  }

  const handleSend = () => {
    if (!email.trim()) {
      toast.error("Add your email to contact support.")
      return
    }

    toast.success("Support message queued.", {
      description: "Our team will follow up shortly.",
    })
    setMessage("")
    setOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[120] flex flex-col items-end gap-3">
      {open ? (
        <Card className="w-[min(92vw,22rem)] border-orange-200/70 shadow-2xl">
          <CardHeader className="space-y-2 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-orange-100 p-2 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                  <LifeBuoy className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Need help?</CardTitle>
                  <CardDescription>Support is one click away.</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
                aria-label="Close support panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link to="/contact">Contact Support</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link to="/contact#help-articles">Browse Help Articles</Link>
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-email">Email</Label>
              <Input
                id="support-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-label="Support email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-message">Message</Label>
              <Textarea
                id="support-message"
                placeholder="Tell us what you need help with."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                aria-label="Support message"
              />
            </div>

            <Button className="w-full" onClick={handleSend} aria-label="Send support message">
              <Mail className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Button
        className="h-12 rounded-full bg-orange-600 px-4 text-white shadow-xl hover:bg-orange-700"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open support widget"
      >
        <HelpCircle className="mr-2 h-4 w-4" />
        Help
      </Button>
    </div>
  )
}
