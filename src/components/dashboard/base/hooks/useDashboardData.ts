import { useState } from "react"
import { useBaseDashboard } from "../BaseDashboardContext"

/**
 * Hook for fetching and managing dashboard data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDashboardData<T = any>(key: string, fetcher?: () => Promise<T>) {
  const { data, updateData, refreshData } = useBaseDashboard()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    if (!fetcher) return

    try {
      setLoading(true)
      setError(null)
      const result = await fetcher()
      updateData(key, result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch data")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    data: data[key] as T | undefined,
    loading,
    error,
    fetchData,
    refreshData,
  }
}

