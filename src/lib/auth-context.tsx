import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { authApi, tokenManager, type User, ApiError } from "@/lib/api"
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
}

interface AuthContextType {
  user: UserData | null
  login: (email: string, password: string) => Promise<{ success: boolean; redirectPath?: string; message?: string }>
  logout: () => void
  isLoading: boolean
  refreshUser: () => Promise<void>
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
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      const token = tokenManager.getToken()
      if (token && !tokenManager.isTokenExpired(token)) {
        try {
          const apiUser = await authApi.me()
          setUser(convertUser(apiUser))
        } catch {
          tokenManager.removeToken()
        }
      }
      setIsLoading(false)
    }
    checkSession()
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    tokenManager.removeToken()
    navigate("/")
  }, [navigate])

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; redirectPath?: string; message?: string }> => {
      setIsLoading(true)
      try {
        const response = await authApi.login({ email, password })
        tokenManager.setToken(response.token)
        const userData = convertUser(response.user)
        setUser(userData)
        setIsLoading(false)
        // Return the redirect path so the Login page can handle navigation and toasts itself
        return { success: true, redirectPath: getDashboardPath(userData.role) }
      } catch (error) {
        setIsLoading(false)
        let errorMessage = "An unexpected error occurred. Please try again."
        if (error instanceof ApiError) {
          errorMessage = error.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }
        return { success: false, message: errorMessage }
      }
    },
    []
  )

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const apiUser = await authApi.me()
      setUser(convertUser(apiUser))
    } catch (error) {
      // Only log out on auth errors (401/403); transient errors should not clear the session
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        logout()
      }
    }
  }, [logout])

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser }}>
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
