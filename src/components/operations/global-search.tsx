import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building,
  FileText,
  Search,
  User,
  Users,
  Wrench,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { operationsApi, type SearchEntityType, type SearchHit } from "@/lib/api/clients/operations"
import { getDashboardPath, type UserRole } from "@/lib/auth-utils"
import { useAuth } from "@/lib/auth-context"

const TYPE_ICON: Record<SearchEntityType, typeof Building> = {
  property: Building,
  tenant: User,
  owner: Users,
  lease: FileText,
  maintenance: Wrench,
  document: FileText,
}

function hrefForHit(hit: SearchHit, role: UserRole): string {
  const base = getDashboardPath(role)
  switch (hit.type) {
    case "property":
      return `${base}/properties/${hit.id}`
    case "tenant":
      return role === "owner" ? `${base}/tenants/${hit.id}` : `${base}/tenants`
    case "owner":
      return role === "manager" || role === "admin" || role === "super_admin"
        ? `${base}/owners`
        : `${base}/properties`
    case "lease":
      return hit.propertyId ? `${base}/properties/${hit.propertyId}` : `${base}/properties`
    case "maintenance":
      return `${base}/maintenance`
    case "document":
      return `${base}/documents`
    default: {
      const _exhaustive: never = hit.type
      return `${base}${_exhaustive}`
    }
  }
}

export function GlobalSearch() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<number>()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    window.clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    debounceRef.current = window.setTimeout(() => {
      setLoading(true)
      operationsApi
        .search(query.trim())
        .then((res) => setResults(res.results))
        .catch(() => setResults([]))
        .finally(() => setLoading(false))
    }, 250)
    return () => window.clearTimeout(debounceRef.current)
  }, [query, open])

  const run = useCallback(
    (hit: SearchHit) => {
      if (!user) return
      setOpen(false)
      navigate(hrefForHit(hit, user.role))
    },
    [navigate, user],
  )

  if (!user || user.role === "tenant") return null

  const grouped = results.reduce<Record<string, SearchHit[]>>((acc, hit) => {
    acc[hit.type] = acc[hit.type] ?? []
    acc[hit.type].push(hit)
    return acc
  }, {})

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden gap-2 text-muted-foreground sm:inline-flex"
        aria-label="Search portfolio"
      >
        <Search className="h-4 w-4" aria-hidden />
        <span>Search</span>
        <kbd className="pointer-events-none ml-2 hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium md:inline">
          ⌘K
        </kbd>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="sm:hidden"
        aria-label="Search portfolio"
      >
        <Search className="h-4 w-4" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search properties, people, leases, tickets…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{loading ? "Searching…" : "No matching records in your portfolio."}</CommandEmpty>
          {Object.entries(grouped).map(([type, hits]) => (
            <CommandGroup key={type} heading={type}>
              {hits.map((hit) => {
                const Icon = TYPE_ICON[hit.type]
                return (
                  <CommandItem
                    key={`${hit.type}-${hit.id}`}
                    value={`${hit.type} ${hit.title} ${hit.subtitle}`}
                    onSelect={() => run(hit)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="truncate">{hit.title}</span>
                    {hit.subtitle ? (
                      <span className="ml-auto truncate pl-3 text-xs text-muted-foreground">{hit.subtitle}</span>
                    ) : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
