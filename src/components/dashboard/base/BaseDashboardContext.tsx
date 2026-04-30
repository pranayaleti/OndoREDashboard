import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { PortalConfig, DashboardData, ActivityItem } from "./types"

interface BaseDashboardContextType {
  config: PortalConfig
  data: DashboardData
  loading: boolean
  error: Error | null
  refreshData: () => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateData: (key: string, value: any) => void
  addActivity: (activity: ActivityItem) => void
  updateConfig: (updates: Partial<PortalConfig>) => void
}

const BaseDashboardContext = createContext<BaseDashboardContextType | undefined>(undefined)

export function useBaseDashboard() {
  const context = useContext(BaseDashboardContext)
  if (!context) {
    throw new Error("useBaseDashboard must be used within BaseDashboardProvider")
  }
  return context
}

interface BaseDashboardProviderProps {
  config: PortalConfig
  children: ReactNode
  initialData?: Partial<DashboardData>
}

export function BaseDashboardProvider({
  config: initialConfig,
  children,
  initialData = {},
}: BaseDashboardProviderProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [config, setConfig] = useState<PortalConfig>(initialConfig)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<DashboardData>({
    loading: true,
    error: null,
    ...initialData,
  })

  const fetchData = useCallback(async () => {
    if (!config.dataFetchers || Object.keys(config.dataFetchers).length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const fetchPromises = Object.entries(config.dataFetchers).map(async ([key, fetcher]) => {
        try {
          const result = await fetcher()
          return [key, result]
        } catch (err) {
          console.error(`Error fetching ${key}:`, err)
          return [key, null]
        }
      })

      const results = await Promise.all(fetchPromises)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fetchedData: Record<string, any> = {}

      results.forEach(([key, value]) => {
        fetchedData[key] = value
      })

      setData((prev) => ({
        ...prev,
        ...fetchedData,
        loading: false,
        error: null,
      }))
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch dashboard data")
      setError(error)
      setData((prev) => ({
        ...prev,
        loading: false,
        error,
      }))
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [config.dataFetchers, toast])

  const refreshData = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData = useCallback((key: string, value: any) => {
    setData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const addActivity = useCallback((activity: ActivityItem) => {
    setData((prev) => {
      const activities = prev.activities || []
      return {
        ...prev,
        activities: [activity, ...activities].slice(0, 50), // Keep last 50 activities
      }
    })
  }, [])

  const updateConfig = useCallback((updates: Partial<PortalConfig>) => {
    setConfig((prev) => ({
      ...prev,
      ...updates,
    }))
  }, [])

  // Update config when initialConfig changes
  useEffect(() => {
    setConfig(initialConfig)
  }, [initialConfig.portalId])

  useEffect(() => {
    if (user && config.dataFetchers) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [user, config.portalId, fetchData])

  const value: BaseDashboardContextType = {
    config,
    data: {
      ...data,
      loading,
      error,
    },
    loading,
    error,
    refreshData,
    updateData,
    addActivity,
    updateConfig,
  }

  return (
    <BaseDashboardContext.Provider value={value}>
      {children}
    </BaseDashboardContext.Provider>
  )
}

