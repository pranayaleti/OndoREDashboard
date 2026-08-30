import { useEffect, useState } from "react"
import { operationsApi, type LeasingPipeline } from "@/lib/api/clients/operations"

export function useLeasingPipeline() {
  const [data, setData] = useState<LeasingPipeline | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    operationsApi
      .getLeasingPipeline()
      .then((pipeline) => {
        if (!cancelled) {
          setData(pipeline)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load the leasing track")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { data, error, loading }
}
