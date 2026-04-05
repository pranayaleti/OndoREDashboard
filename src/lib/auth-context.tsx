import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { authApi, type User, ApiError } from "@/lib/api"
import i18n from '@/lib/i18n'
import {
  setAccessToken,
  clearAccessToken,
  refreshAccessToken,
} from "@/lib/api/clients/token-manager"
import { normalizeRole, getDashboardPath, type UserRole } from "@/lib/auth-utils"

export type { UserRole } from "@/lib/auth-utils"

export interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  phone?: string
  address?: string
  profilePicture?: string
  preferredLocale?: string
}

interface AuthContextType {
  user: UserData | null
  login: (email: string, password: string) => Promise<{ success: boolean; redirectPath?: string; message?: string }>
  logout: () => void
  isLoading: boolean
  refreshUser: () => Promise<void>
  /** Call immediately after a successful signup to hydrate auth state without a round-trip. */
  authenticateUser: (user: UserData, accessToken: string, expiresIn?: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Convert API User to UserData — defined outside component to avoid recreation on render. */
function convertUser(apiUser: User): UserData {
  return {
    id: apiUser.id,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    email: apiUser.email,
    role: normalizeRole(apiUser.role),
    phone: apiUser.phone,
    address: apiUser.address,
    profilePicture: apiUser.profilePicture,
    preferredLocale: apiUser.preferredLocale,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  const handleSessionExpired = useCallback(() => {
    setUser(null)
    clearAccessToken()
    navigate("/login?reason=session_expired", { replace: true })
  }, [navigate])

  // On mount: try to restore session via refresh token (HttpOnly cookie)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Try to get a fresh access token using the HttpOnly refresh cookie.
        // If the cookie is absent / expired this returns null.
        const token = await refreshAccessToken()
        if (token) {
          const apiUser = await authApi.getMe()
          setUser(convertUser(apiUser))
          if (apiUser.preferredLocale) {
            i18n.changeLanguage(apiUser.preferredLocale)
          }
        }
      } catch {
        // Session unrecoverable — stay logged out
        clearAccessToken()
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  // Listen for session-expired events dispatched by the HTTP layer after a
  // failed refresh attempt mid-session.
  useEffect(() => {
    window.addEventListener("auth:session-expired", handleSessionExpired)
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired)
  }, [handleSessionExpired])

  // Proactive token refresh: silently refresh the access token every 12 minutes
  // (tokens typically expire in 15 min) to prevent mid-session expiration.
  useEffect(() => {
    if (!user) return // Only refresh when logged in

    const REFRESH_INTERVAL = 12 * 60 * 1000 // 12 minutes
    const interval = setInterval(async () => {
      try {
        const token = await refreshAccessToken()
        if (!token) {
          // Refresh failed — session likely expired
          handleSessionExpired()
        }
      } catch {
        // Silent failure — the next API call will trigger session-expired if needed
      }
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [user, handleSessionExpired])

  const logout = useCallback(() => {
    // Fire-and-forget: call the logout endpoint to revoke the refresh token
    // family on the backend. We don't await — UX should feel instant.
    authApi.logout().catch(() => { /* best-effort */ })
    setUser(null)
    clearAccessToken()
    navigate("/")
  }, [navigate])

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; redirectPath?: string; message?: string }> => {
      setIsLoading(true)
      try {
        const response = await authApi.login({ email, password })
        // Store the short-lived access token in memory only (never localStorage)
        setAccessToken(response.accessToken, response.expiresIn)
        const userData = convertUser(response.user)
        setUser(userData)
        setIsLoading(false)
        return { success: true, redirectPath: getDashboardPath(userData.role) }
      } catch (err: unknown) {
        setIsLoading(false)
        let errorMessage = "An unexpected error occurred. Please try again."
        if (err instanceof ApiError) {
          errorMessage = err.message
        } else if (err instanceof Error) {
          errorMessage = err.message
        }
        return { success: false, message: errorMessage }
      }
    },
    []
  )

  const authenticateUser = useCallback((userData: UserData, accessToken: string, expiresIn = 900) => {
    setAccessToken(accessToken, expiresIn)
    setUser(userData)
  }, [])

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const apiUser = await authApi.getMe()
      setUser(convertUser(apiUser))
    } catch (err: unknown) {
      // Only log out on auth errors (401/403); transient errors should not clear the session
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
      }
    }
  }, [logout])

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser, authenticateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
