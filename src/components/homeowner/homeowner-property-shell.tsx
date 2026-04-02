import type { ReactNode } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Property } from "@/lib/api"
import { useResolvedPropertyId } from "./use-resolved-property-id"
import { Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HomeownerPropertyShellProps {
  children: (ctx: {
    propertyId: string
    properties: Property[]
    setPropertyId: (id: string) => void
  }) => ReactNode
  /** Hide property dropdown for single-property tenant */
  hidePicker?: boolean
}

export function HomeownerPropertyShell({
  children,
  hidePicker = false,
}: HomeownerPropertyShellProps) {
  const { propertyId, setPropertyId, properties, loading, error } =
    useResolvedPropertyId()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        <span>Loading property…</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!propertyId || properties.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No property found. Add a property first, or contact your property manager.
        </AlertDescription>
      </Alert>
    )
  }

  const showPicker =
    !hidePicker && properties.length > 1

  return (
    <div className="space-y-6">
      {showPicker && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Property</span>
          <Select
            value={propertyId}
            onValueChange={(v) => setPropertyId(v)}
          >
            <SelectTrigger className="w-[min(100%,280px)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title || p.addressLine1} — {p.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {children({
        propertyId,
        properties,
        setPropertyId,
      })}
    </div>
  )
}
