import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { propertyApi, type Property } from "@/lib/api"

export function useResolvedPropertyId() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const paramId = searchParams.get("propertyId")
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      try {
        if (user.role === "tenant") {
          const res = await propertyApi.getTenantProperty()
          const p = res.property
          if (!cancelled) {
            setProperties([p])
            const chosen =
              paramId && paramId === p.id ? paramId : p.id
            setPropertyId(chosen)
          }
        } else {
          const res = await propertyApi.getProperties()
          const list = res.properties
          if (!cancelled) {
            setProperties(list)
            if (paramId && list.some((p) => p.id === paramId)) {
              setPropertyId(paramId)
            } else if (list[0]) {
              setPropertyId(list[0].id)
            } else {
              setPropertyId(null)
            }
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load properties")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.role, paramId])

  return { propertyId, setPropertyId, properties, loading, error }
}
