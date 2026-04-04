import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Bot, Loader2, Play, FlaskConical, Zap, ShieldCheck,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiGet, apiPut, apiPost } from "@/lib/api/http"

interface AutoReplyConfig {
  propertyId: string
  enabled: boolean
  confidenceThreshold: number
  replyDelayMinutes: number
  excludeCategories: string[]
}

interface SandboxResult {
  reply: string
  confidence: number
  category: string
  knowledgeUsed: string[]
}

interface Props {
  propertyId: string
}

const CATEGORIES = ["maintenance", "billing", "lease", "amenity", "general"]

export function AutoReplySettings({ propertyId }: Props) {
  const { toast } = useToast()
  const [config, setConfig] = useState<AutoReplyConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [testMessage, setTestMessage] = useState("")
  const [testResult, setTestResult] = useState<SandboxResult | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => { loadConfig() }, [propertyId])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const res = await apiGet<{ data: AutoReplyConfig }>(`/inbox/auto-reply/${propertyId}`)
      setConfig(res.data)
    } catch {
      toast({ title: "Failed to load auto-reply settings", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const save = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await apiPut<{ data: AutoReplyConfig }>(`/inbox/auto-reply/${propertyId}`, config)
      setConfig(res.data)
      toast({ title: "Auto-reply settings saved" })
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const runSandboxTest = async () => {
    if (!testMessage.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await apiPost<{ data: SandboxResult }>("/inbox/sandbox/test", {
        propertyId,
        message: testMessage,
      })
      setTestResult(res.data)
    } catch {
      toast({ title: "Sandbox test failed", variant: "destructive" })
    } finally {
      setTesting(false)
    }
  }

  const toggleCategory = (cat: string) => {
    if (!config) return
    const excluded = config.excludeCategories.includes(cat)
      ? config.excludeCategories.filter((c) => c !== cat)
      : [...config.excludeCategories, cat]
    setConfig({ ...config, excludeCategories: excluded })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>AI Auto-Reply</CardTitle>
              <CardDescription>Configure automated AI responses for incoming tenant messages</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">Auto-Reply Enabled</p>
                <p className="text-sm text-muted-foreground">AI will automatically draft and send replies</p>
              </div>
            </div>
            <Switch checked={config.enabled} onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Confidence Threshold (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={Math.round(config.confidenceThreshold * 100)}
                onChange={(e) => setConfig({ ...config, confidenceThreshold: Math.min(1, Math.max(0, parseInt(e.target.value) / 100 || 0)) })}
              />
              <p className="text-xs text-muted-foreground">Only auto-reply when AI confidence is above this threshold</p>
            </div>
            <div className="space-y-2">
              <Label>Reply Delay (minutes)</Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={config.replyDelayMinutes}
                onChange={(e) => setConfig({ ...config, replyDelayMinutes: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Wait before sending to allow manager override</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Excluded Categories</Label>
            <p className="text-xs text-muted-foreground">Auto-reply will be skipped for these categories (click to toggle)</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={config.excludeCategories.includes(cat) ? "destructive" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(cat)}
                >
                  {cat}
                  {config.excludeCategories.includes(cat) && " (excluded)"}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Sandbox Testing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-violet-500" />
            <div>
              <CardTitle>Test Sandbox</CardTitle>
              <CardDescription>Test how AI would respond to a sample message without sending</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Type a sample tenant message to test the AI response..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="min-h-[80px]"
          />
          <Button onClick={runSandboxTest} disabled={testing || !testMessage.trim()} variant="secondary">
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            Test Reply
          </Button>

          {testResult && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Sandbox Result</span>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="whitespace-pre-wrap text-sm">{testResult.reply}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">Category: {testResult.category}</Badge>
                <Badge variant="outline">Confidence: {Math.round(testResult.confidence * 100)}%</Badge>
                {testResult.confidence >= (config?.confidenceThreshold ?? 0.7) ? (
                  <Badge className="bg-green-100 text-green-700">Would auto-send</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700">Below threshold — would not auto-send</Badge>
                )}
              </div>
              {testResult.knowledgeUsed.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Knowledge base entries used:</p>
                  <div className="flex flex-wrap gap-1">
                    {testResult.knowledgeUsed.map((k) => (
                      <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
