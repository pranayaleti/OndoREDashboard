import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Send, Loader2, User, Bot } from "lucide-react"
import { dashboardApi, ApiError } from "@/lib/api"
import { validateChatInput } from "@/lib/aiGuardrails"

type MessageRole = "user" | "assistant"

interface Message {
  id: string
  role: MessageRole
  content: string
  createdAt: Date
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const QUICK_PROMPTS: { id: string; label: string; icon: string; prompt: string }[] = [
  { id: "portfolio-stats", label: "Portfolio stats", icon: "📊", prompt: "What are my portfolio stats?" },
  { id: "at-risk-tenants", label: "At-risk tenants", icon: "⚠️", prompt: "Show me at-risk tenants" },
  { id: "pending-maintenance", label: "Pending maintenance", icon: "🔧", prompt: "List pending maintenance requests" },
  { id: "rent-collection", label: "Rent collection status", icon: "💰", prompt: "What's my rent collection rate?" },
  { id: "risk-trends", label: "Risk trends", icon: "📈", prompt: "Show risk trends for my portfolio" },
  { id: "occupancy-rate", label: "Occupancy rate", icon: "🏢", prompt: "What's my current occupancy rate?" },
]

function QuickPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="flex justify-center mb-3">
        <div className="rounded-lg bg-orange-500/10 p-2">
          <Sparkles className="h-6 w-6 text-orange-500" />
        </div>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">Ask me anything</p>
      <p className="text-xs text-muted-foreground mb-4">
        Portfolio insights, maintenance, at-risk tenants, and more.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {QUICK_PROMPTS.map(({ id, label, icon, prompt }) => (
          <button
            key={id}
            onClick={() => onSelect(prompt)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors"
          >
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ManagerAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: text,
      createdAt: new Date(),
    }
    const conversation = [...messages, userMessage].map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    const guardrail = validateChatInput(conversation)
    if (!guardrail.ok) {
      setError(guardrail.error)
      return
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const { reply, session_id } = await dashboardApi.assistantChat(
        guardrail.messages,
        sessionId ?? undefined,
      )
      if (session_id) setSessionId(session_id)
      const assistantMessage: Message = {
        id: createId(),
        role: "assistant",
        content: reply,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 429
            ? "Too many requests. Please wait a few minutes before sending more messages."
            : err.message
          : err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Failed to get reply"
      setError(message)
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-lg bg-orange-500/10 p-3">
          <Sparkles className="h-8 w-8 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">AI Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Portfolio insights, maintenance, and more. Ask in plain language.
          </p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Chat</CardTitle>
          <CardDescription>
            Ask about portfolio stats, revenue, occupancy, at-risk tenants, or list and create maintenance requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-0">
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
            {messages.length === 0 && (
              <QuickPrompts onSelect={(prompt) => sendMessage(prompt)} />
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-orange-500" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="text-sm text-muted-foreground">Thinking…</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {error && (
            <div className="px-6 pb-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="flex-shrink-0 p-4 border-t flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder="Ask about portfolio, maintenance…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11 shrink-0 bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
