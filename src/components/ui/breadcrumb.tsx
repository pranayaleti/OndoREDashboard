import { Link } from "react-router-dom"
import { 
  Home, 
  ChevronRight, 
  FileText, 
  Building, 
  DollarSign, 
  Users, 
  MessageSquare, 
  Wrench, 
  BarChart3, 
  User, 
  Settings,
  Plus,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: LucideIcon
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

// Icon mapping for common pages
const getIconForLabel = (label: string): LucideIcon | undefined => {
  const iconMap: Record<string, LucideIcon> = {
    "Documents": FileText,
    "Properties": Building,
    "Finances": DollarSign,
    "Tenants": Users,
    "Messages": MessageSquare,
    "Maintenance": Wrench,
    "Reports": BarChart3,
    "Profile": User,
    "Settings": Settings,
    "Add Property": Plus,
    "Monthly Summary": BarChart3,
    "Occupancy Report": Users,
    "Tax Report": DollarSign,
    "Compose": MessageSquare,
  }
  return iconMap[label]
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)} aria-label="Breadcrumb">
      <Link 
        to="/owner" 
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>
      
      {items.map((item, index) => {
        const Icon = item.icon || getIconForLabel(item.label)
        const isLast = index === items.length - 1
        
        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            {item.href ? (
              <Link
                to={item.href}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className={cn(
                "flex items-center gap-1.5",
                isLast 
                  ? "text-gray-900 dark:text-gray-100 font-medium" 
                  : "text-gray-500 dark:text-gray-400"
              )}>
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
