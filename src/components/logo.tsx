import { Link } from "react-router-dom"
import { getLogoPath } from "@/lib/logo"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { companyInfo } from "@/constants/companyInfo"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
  linkTo?: string
  variant?: "default" | "centered" | "compact"
  textColor?: "default" | "white" | "dark"
}

export function Logo({ 
  size = "md", 
  showText = true, 
  className,
  linkTo,
  variant = "default",
  textColor = "default"
}: LogoProps) {
  const { user } = useAuth()

  // Determine where the logo should link based on user role
  const getLogoLink = () => {
    if (linkTo) return linkTo
    if (!user) return "/"
    switch (user.role) {
      case "super_admin":
        return "/super-admin"
      case "admin":
        return "/admin"
      case "manager":
        return "/dashboard"
      case "owner":
        return "/owner"
      case "tenant":
        return "/tenant"
      case "maintenance":
        return "/maintenance"
      default:
        return "/dashboard"
    }
  }

  const sizeClasses = {
    sm: { logo: "h-6 w-6", text: "text-sm", gap: "gap-1.5" },
    md: { logo: "h-8 w-8", text: "text-lg md:text-xl", gap: "gap-2 md:gap-3" },
    lg: { logo: "h-12 w-12", text: "text-2xl md:text-3xl", gap: "gap-3 md:gap-4" },
    xl: { logo: "h-16 w-16", text: "text-4xl md:text-5xl", gap: "gap-4 md:gap-5" },
  }

  const variantClasses = {
    default: "flex items-center",
    centered: "flex flex-col items-center",
    compact: "flex items-center",
  }

  const currentSize = sizeClasses[size]
  const currentVariant = variantClasses[variant]

  const logoContent = (
    <div className={cn(currentVariant, currentSize.gap, className)}>
      <img 
        src={getLogoPath()}
        alt={`${companyInfo.name} logo`} 
        width={64}
        height={64}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className={cn(
          currentSize.logo,
          "w-auto transition-all duration-300",
          "drop-shadow-md hover:drop-shadow-lg",
          "hover:scale-105 hover:brightness-110",
          "filter"
        )}
      />
      {showText && (
        <span className={cn(
          currentSize.text,
          "font-bold leading-tight",
          variant === "centered" ? "text-center" : ""
        )}>
          <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-800 text-transparent bg-clip-text drop-shadow-sm">
            Ondo Real
          </span>
          <span className={cn(
            "ml-1.5",
            textColor === "white" ? "text-white" :
            textColor === "dark" ? "text-gray-900 dark:text-white" :
            "text-gray-900 dark:text-white"
          )}>
            Estate
          </span>
        </span>
      )}
    </div>
  )

  if (variant === "centered" || !showText) {
    return (
      <Link to={getLogoLink()} className="inline-block">
        {logoContent}
      </Link>
    )
  }

  return (
    <Link 
      to={getLogoLink()} 
      className="inline-block hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-lg"
    >
      {logoContent}
    </Link>
  )
}
