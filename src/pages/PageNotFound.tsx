import { useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Home, AlertTriangle } from "lucide-react"
import { Logo } from "@/components/logo"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"
import { getDashboardPath } from "@/lib/auth-utils"

export default function PageNotFound() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const hasWarned = useRef(false)
  const homeLink = user ? getDashboardPath(user.role) : "/"

  useEffect(() => {
    if (!hasWarned.current) {
      toast({
        title: "Page not found",
        description: "Redirecting you to your dashboard.",
        variant: "destructive",
      })
      hasWarned.current = true
      navigate(homeLink, { replace: true })
    }
  }, [homeLink, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-card p-4">
      <div className="w-full max-w-md">
        {/* Ondo Real Estate Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6">
            <Logo size="xl" variant="centered" showText={true} linkTo="/" />
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-orange-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-medium mb-4 bg-gradient-to-r from-orange-500 to-red-800 text-transparent bg-clip-text">
              Page Not Found
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
              The page you're looking for doesn't exist or has been moved. Let's get you back on track.
            </p>
            
            <div className="space-y-3">
              <Link to={homeLink}>
                <button className="w-full bg-gradient-to-r from-orange-500 to-red-800 hover:from-orange-600 hover:to-red-900 text-white font-medium py-4 rounded-2xl text-xl transition-all duration-200 flex items-center justify-center gap-2">
                  <Home className="h-5 w-5" />
                  Go Home
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              
              {!user && (
                <Link to="/login">
                  <button className="w-full border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 text-gray-700 hover:text-orange-700 font-medium py-4 rounded-2xl text-xl transition-all duration-200">
                    Sign In
                  </button>
                </Link>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Need assistance?{" "}
                <Link to="/contact" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
                  Contact Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
