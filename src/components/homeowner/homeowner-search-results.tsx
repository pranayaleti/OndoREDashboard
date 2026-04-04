import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { HomeownerPropertyShell } from "./homeowner-property-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { homeownerApi, type HomeownerSearchResult } from "@/lib/api"
import { validateChatInput } from "@/lib/aiGuardrails"
import { useAuth } from "@/lib/auth-context"
import { getDashboardPath } from "@/lib/auth-utils"
import {
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  FileText,
} from "lucide-react"

export function HomeownerSearchResults() {
  return (
    <HomeownerPropertyShell>
      {({ propertyId }) => <SearchResultsInner propertyId={propertyId} />}
    </HomeownerPropertyShell>
  )
}

function SearchResultsInner({ propertyId }: { propertyId: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuestion = searchParams.get("q") ?? ""
  const base = user ? getDashboardPath(user.role) : "/owner"

  const [question, setQuestion] = useState(initialQuestion)
  const [displayedQuestion, setDisplayedQuestion] = useState(initialQuestion)
  const [result, setResult] = useState<HomeownerSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim()
      if (!trimmed || trimmed.length < 3) return

      const guard = validateChatInput([{ role: "user", content: trimmed }])
      if (!guard.ok) {
        setError(guard.error)
        return
      }

      setDisplayedQuestion(trimmed)
      setSearchParams({ q: trimmed }, { replace: true })
      setLoading(true)
      setError(null)
      setResult(null)
      try {
        const data = await homeownerApi.search(propertyId, trimmed)
        setResult(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        )
      } finally {
        setLoading(false)
      }
    },
    [propertyId, setSearchParams]
  )

  useEffect(() => {
    if (initialQuestion.trim().length >= 3) {
      runSearch(initialQuestion)
    }
  }, [])

  const handleFollowUp = (q: string) => {
    setQuestion(q)
    runSearch(q)
  }

  const handleNewSearch = () => {
    setQuestion("")
    setResult(null)
    setError(null)
    setDisplayedQuestion("")
    setSearchParams({}, { replace: true })
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(base)}
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Home Search</h1>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10 pr-4"
            placeholder="Ask about your property..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch(question)
            }}
            aria-label="Search your property"
          />
        </div>
        <Button
          onClick={() => runSearch(question)}
          disabled={loading || question.trim().length < 3}
          className="shrink-0 bg-gradient-to-r from-orange-500 to-red-800"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Search
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm">Searching your property data...</p>
        </div>
      )}

      {error && !loading && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              {displayedQuestion}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {dateStr} at {timeStr}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none text-foreground prose-strong:text-foreground prose-code:text-foreground">
                <ReactMarkdown
                  allowedElements={[
                    "p", "strong", "em", "code", "ul", "ol", "li",
                    "h1", "h2", "h3", "h4", "br", "a", "blockquote",
                  ]}
                >
                  {result.answer}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {result.sources && result.sources.length > 0 && (
            <Card className="border-orange-200/50 bg-orange-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.sources.map((src, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-border/50 bg-background px-3 py-2"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {src.documentName}
                        <span className="ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                          {src.documentType}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {src.excerpt}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.nextSteps.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Next steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-inside list-decimal space-y-2 text-sm text-foreground">
                  {result.nextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Still need help?</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-orange-700" onClick={handleNewSearch}>
              Ask another question
            </Button>
            <span className="text-muted-foreground">or</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-orange-700"
              onClick={() => navigate(`${base}/assistant`)}
            >
              Chat with assistant
            </Button>
          </div>

          {result.followUpQuestions.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Follow up
              </p>
              <div className="flex flex-wrap gap-2">
                {result.followUpQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-full border-orange-200 bg-orange-50/80 text-orange-800 hover:bg-orange-100"
                    onClick={() => handleFollowUp(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !result && !error && (
        <div className="py-16 text-center text-muted-foreground">
          <Search className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">
            Ask a question about your property to get started.
          </p>
        </div>
      )}
    </div>
  )
}
