import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Video, MapPin, Clapperboard, HelpCircle, MessageCircleQuestion, LineChart, Copy, Loader2, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  contentApi,
  propertyApi,
  ApiError,
  type ContentPayload,
  type ContentType,
  type GenerateContentRequest,
  type GenerateContentResult,
  type MarketAudience,
  type Property,
} from "@/lib/api"

const CONTENT_OPTIONS: Array<{
  id: ContentType
  icon: typeof Video
  titleKey: string
  descKey: string
}> = [
  { id: "listing_video_script", icon: Video, titleKey: "contentStudio.types.listingVideo", descKey: "contentStudio.types.listingVideoDesc" },
  { id: "local_content_ideas", icon: MapPin, titleKey: "contentStudio.types.localIdeas", descKey: "contentStudio.types.localIdeasDesc" },
  { id: "topic_to_script", icon: Clapperboard, titleKey: "contentStudio.types.topicScript", descKey: "contentStudio.types.topicScriptDesc" },
  { id: "buyer_questions", icon: HelpCircle, titleKey: "contentStudio.types.buyerQuestions", descKey: "contentStudio.types.buyerQuestionsDesc" },
  { id: "buyer_question_video", icon: MessageCircleQuestion, titleKey: "contentStudio.types.buyerVideo", descKey: "contentStudio.types.buyerVideoDesc" },
  { id: "market_commentary", icon: LineChart, titleKey: "contentStudio.types.market", descKey: "contentStudio.types.marketDesc" },
]

function isContentType(value: string | null): value is ContentType {
  return CONTENT_OPTIONS.some((opt) => opt.id === value)
}

function scriptFromPayload(payload: ContentPayload | undefined, fallback: string): string {
  if (!payload) return fallback
  switch (payload.type) {
    case "listing_video_script":
    case "topic_to_script":
    case "buyer_question_video":
    case "market_commentary":
      return payload.script
    default:
      return fallback
  }
}

export default function ManagerContentStudio() {
  const { t } = useTranslation("dashboard")
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const typeFromUrl = searchParams.get("type")
  const listingFromUrl = searchParams.get("listingId")

  const [contentType, setContentType] = useState<ContentType>(
    isContentType(typeFromUrl) ? typeFromUrl : "listing_video_script",
  )
  const [listingId, setListingId] = useState(listingFromUrl ?? "")
  const [city, setCity] = useState("")
  const [topic, setTopic] = useState("")
  const [question, setQuestion] = useState("")
  const [extraNotes, setExtraNotes] = useState("")
  const [audience, setAudience] = useState<MarketAudience>("buyer")
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GenerateContentResult | null>(null)
  const [editedScript, setEditedScript] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoadingProperties(true)
    propertyApi
      .getProperties(1, 100)
      .then((res) => {
        if (!cancelled) setProperties(res.properties)
      })
      .catch(() => {
        if (!cancelled) {
          toast({ title: t("contentStudio.loadListingsFailed"), variant: "destructive" })
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProperties(false)
      })
    return () => {
      cancelled = true
    }
  }, [t, toast])

  useEffect(() => {
    if (!listingId || city.trim()) return
    const match = properties.find((p) => p.id === listingId)
    if (match?.city) setCity(match.city)
  }, [listingId, properties, city])

  const needsTopic = contentType === "topic_to_script"
  const needsQuestion = contentType === "buyer_question_video"
  const canGenerate = needsTopic
    ? topic.trim().length > 0 && Boolean(listingId || city.trim())
    : needsQuestion
      ? question.trim().length > 0
      : Boolean(listingId || city.trim())
  const selectedOption = CONTENT_OPTIONS.find((opt) => opt.id === contentType) ?? CONTENT_OPTIONS[0]
  if (!selectedOption) {
    throw new Error("Content studio is missing type definitions")
  }

  const listingLabel = useMemo(() => {
    const match = properties.find((p) => p.id === listingId)
    if (!match) return ""
    return [match.title, match.city].filter(Boolean).join(" · ")
  }, [listingId, properties])

  const payload = result?.payload
  const duration =
    payload && "estimatedDurationSeconds" in payload
      ? t("contentStudio.duration", {
          seconds: payload.estimatedDurationSeconds,
          words: "wordCount" in payload ? payload.wordCount : "",
        })
      : null

  function selectType(next: ContentType) {
    setContentType(next)
    setResult(null)
    setEditedScript("")
    const params = new URLSearchParams(searchParams)
    params.set("type", next)
    setSearchParams(params, { replace: true })
  }

  async function generate(overrides: Partial<GenerateContentRequest> = {}) {
    const nextType = overrides.contentType ?? contentType
    setGenerating(true)
    try {
      const data = await contentApi.generate({
        contentType: nextType,
        listingId: listingId || null,
        city: city.trim() || null,
        topic: (overrides.topic ?? topic).trim() || null,
        question: (overrides.question ?? question).trim() || null,
        extraNotes: extraNotes.trim() || null,
        audience: nextType === "market_commentary" ? audience : null,
      })
      setResult(data)
      setEditedScript(scriptFromPayload(data.payload, data.body))
      if (overrides.contentType) {
        setContentType(overrides.contentType)
        const params = new URLSearchParams(searchParams)
        params.set("type", overrides.contentType)
        setSearchParams(params, { replace: true })
      }
      if (data.listing?.city && !city.trim()) setCity(data.listing.city)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("contentStudio.generateFailed")
      toast({ title: message, variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  function copyText(): string {
    if (!result) return ""
    const payloadType = result.payload?.type
    const isScript =
      payloadType === "listing_video_script" ||
      payloadType === "topic_to_script" ||
      payloadType === "buyer_question_video" ||
      payloadType === "market_commentary"
    if (isScript && editedScript.trim()) return editedScript.trim()
    return result.body
  }

  async function copyDraft(includeDisclosures: boolean) {
    if (!result) return
    const text = includeDisclosures
      ? `${copyText()}\n\n---\n${result.disclosures}`
      : copyText()
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: t("contentStudio.copied") })
    } catch {
      toast({ title: t("contentStudio.copyFailed"), variant: "destructive" })
    }
  }

  async function applyIdea(idea: string) {
    setTopic(idea)
    await generate({ contentType: "topic_to_script", topic: idea })
  }

  async function applyQuestion(nextQuestion: string) {
    setQuestion(nextQuestion)
    await generate({ contentType: "buyer_question_video", question: nextQuestion })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-orange-500" />
          {t("contentStudio.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("contentStudio.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {CONTENT_OPTIONS.map((opt) => {
          const Icon = opt.icon
          const selected = contentType === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectType(opt.id)}
              className={`text-left rounded-lg border p-4 transition-colors ${
                selected
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                  : "border-border hover:border-orange-300"
              }`}
            >
              <Icon className={`h-5 w-5 mb-2 ${selected ? "text-orange-500" : "text-muted-foreground"}`} />
              <p className="font-medium text-sm">{t(opt.titleKey)}</p>
              <p className="text-xs text-muted-foreground mt-1">{t(opt.descKey)}</p>
            </button>
          )
        })}
      </div>

      {(contentType === "local_content_ideas" || contentType === "topic_to_script") && (
        <p className="text-sm text-muted-foreground">{t("contentStudio.flowLocal")}</p>
      )}
      {(contentType === "buyer_questions" || contentType === "buyer_question_video") && (
        <p className="text-sm text-muted-foreground">{t("contentStudio.flowQuestions")}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t(selectedOption.titleKey)}</CardTitle>
          <CardDescription>{t("contentStudio.formHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="content-listing">{t("contentStudio.listing")}</Label>
              <Select
                value={listingId || "none"}
                onValueChange={(value) => setListingId(value === "none" ? "" : value)}
                disabled={loadingProperties}
              >
                <SelectTrigger id="content-listing">
                  <SelectValue placeholder={t("contentStudio.listingPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("contentStudio.noListing")}</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} · {p.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-city">{t("contentStudio.city")}</Label>
              <Input
                id="content-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("contentStudio.cityPlaceholder")}
              />
            </div>
          </div>

          {contentType === "market_commentary" && (
            <div className="space-y-2">
              <Label>{t("contentStudio.audience")}</Label>
              <RadioGroup
                value={audience}
                onValueChange={(value) => setAudience(value === "seller" ? "seller" : "buyer")}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="buyer" id="audience-buyer" />
                  <Label htmlFor="audience-buyer">{t("contentStudio.audienceBuyer")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="seller" id="audience-seller" />
                  <Label htmlFor="audience-seller">{t("contentStudio.audienceSeller")}</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {needsTopic && (
            <div className="space-y-2">
              <Label htmlFor="content-topic">{t("contentStudio.topic")}</Label>
              <Input
                id="content-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t("contentStudio.topicPlaceholder")}
              />
            </div>
          )}

          {needsQuestion && (
            <div className="space-y-2">
              <Label htmlFor="content-question">{t("contentStudio.question")}</Label>
              <Textarea
                id="content-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("contentStudio.questionPlaceholder")}
                className="min-h-[88px]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content-notes">{t("contentStudio.notes")}</Label>
            <Textarea
              id="content-notes"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder={t("contentStudio.notesPlaceholder")}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void generate()} disabled={generating || !canGenerate}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("contentStudio.generating")}
                </>
              ) : result ? (
                t("contentStudio.regenerate")
              ) : (
                t("contentStudio.generate")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {payload?.type === "local_content_ideas" && (
        <Card>
          <CardHeader>
            <CardTitle>{payload.location}</CardTitle>
            <CardDescription>{t("contentStudio.flowLocal")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {payload.categories.map((category) => (
              <div key={category.name} className="space-y-2">
                <p className="text-sm font-medium">{category.name}</p>
                <div className="flex flex-wrap gap-2">
                  {category.ideas.map((idea) => (
                    <Button
                      key={idea}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={generating}
                      onClick={() => void applyIdea(idea)}
                    >
                      {idea}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {payload?.type === "buyer_questions" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("contentStudio.types.buyerQuestions")}</CardTitle>
            <CardDescription>{t("contentStudio.flowQuestions")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {payload.questions.map((q) => (
              <div key={q} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <p className="text-sm">{q}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={generating}
                  onClick={() => void applyQuestion(q)}
                >
                  {t("contentStudio.useQuestion")}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result && payload?.type !== "local_content_ideas" && payload?.type !== "buyer_questions" && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>
                {payload && "title" in payload ? payload.title : t("contentStudio.draftTitle")}
              </CardTitle>
              <CardDescription>
                {listingLabel || result.listing?.city || city || t("contentStudio.noListing")}
              </CardDescription>
              {duration ? <Badge variant="outline">{duration}</Badge> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void copyDraft(false)}>
                <Copy className="h-4 w-4 mr-1" />
                {t("contentStudio.copyScript")}
              </Button>
              <Button size="sm" onClick={() => void copyDraft(true)}>
                <Copy className="h-4 w-4 mr-1" />
                {t("contentStudio.copyWithDisclosures")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.complianceWarnings.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <p className="font-medium text-destructive">{t("contentStudio.complianceTitle")}</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {result.complianceWarnings.map((w) => (
                    <li key={`${w.term}-${w.reason}`}>
                      “{w.term}” — {w.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {payload?.type === "market_commentary" && (
              <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
                <p>
                  {t("contentStudio.audience")}: {payload.audience === "seller" ? t("contentStudio.audienceSeller") : t("contentStudio.audienceBuyer")}
                  {" · "}
                  {payload.market}
                </p>
                {payload.dataAvailability === "unavailable" ? (
                  <p className="text-muted-foreground">{t("contentStudio.marketDataUnavailable")}</p>
                ) : (
                  <p className="text-muted-foreground">
                    {[
                      payload.dataDate ? `${t("contentStudio.dataDate")}: ${payload.dataDate}` : null,
                      payload.source ? `${t("contentStudio.source")}: ${payload.source}` : null,
                      payload.asOf ? `${t("contentStudio.asOf")}: ${payload.asOf}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {payload.educationalContext.length > 0 && (
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {payload.educationalContext.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="content-edit">{t("contentStudio.editScript")}</Label>
              <Textarea
                id="content-edit"
                value={editedScript}
                onChange={(e) => setEditedScript(e.target.value)}
                className="min-h-[220px] font-sans text-sm leading-relaxed"
              />
            </div>
            {result.disclosures && (
              <div className="text-xs text-muted-foreground whitespace-pre-wrap border-t pt-4">
                <p className="font-medium mb-2">{t("contentStudio.disclosuresHeading")}</p>
                {result.disclosures}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
