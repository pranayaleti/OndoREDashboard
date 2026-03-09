import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface WelcomeConfig {
  title?: string
  description?: string
  role?: "owner" | "tenant" | "manager"
}

const getWelcomeMessage = (role?: string, firstName?: string): WelcomeConfig => {
  const name = firstName ? `, ${firstName}` : ""
  
  switch (role) {
    case "owner":
      return {
        title: `Welcome back${name}!`,
        description: "Here's your investment portfolio overview.",
        role: "owner"
      }
    case "tenant":
      return {
        title: `Welcome back${name}!`,
        description: "Here's your property and lease information.",
        role: "tenant"
      }
    case "manager":
      return {
        title: `Welcome back${name}!`,
        description: "Here's your property management dashboard.",
        role: "manager"
      }
    default:
      return {
        title: `Welcome back${name}!`,
        description: "Here's your dashboard overview.",
      }
  }
}

export function useWelcomeToast() {
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return undefined

    // Show welcome toast once per session when visiting dashboard
    const welcomeKey = `welcome_shown_${user.id}_${user.role}`
    const hasShownWelcome = sessionStorage.getItem(welcomeKey)
    
    if (!hasShownWelcome && user.firstName) {
      const welcomeMsg = getWelcomeMessage(user.role, user.firstName)
      
      // Small delay to ensure smooth page load
      const timer = setTimeout(() => {
        toast({
          title: welcomeMsg.title,
          description: welcomeMsg.description,
          duration: 4000,
          variant: "orange",
        })
        sessionStorage.setItem(welcomeKey, "true")
      }, 500)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [user, toast])
}

