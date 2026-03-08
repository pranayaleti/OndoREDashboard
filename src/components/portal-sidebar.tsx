import { Link, useLocation } from "react-router-dom"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Building,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  User,
  Users,
  Wrench,
  Shield,
  BarChart3,
  MessageSquare,
  FolderOpen,
  ClipboardList,
  Moon,
  Sun,
  Laptop,
  Bell,
  Calendar,
  UserPlus,
  Settings,
  HelpCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { getDashboardPath, type UserRole } from "@/lib/auth-utils"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Toaster } from "sonner"
import { useNotifications } from "@/hooks/use-notifications"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  roles?: UserRole[] // If specified, only show for these roles
}

// Define navigation items for each role
const getNavItems = (role: UserRole): NavItem[] => {
  const basePath = getDashboardPath(role)
  
  switch (role) {
    case "super_admin":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Assistant", href: `${basePath}/assistant`, icon: <Sparkles className="h-5 w-5" /> },
        { title: "At-risk", href: `${basePath}/at-risk`, icon: <AlertTriangle className="h-5 w-5" /> },
        { title: "Managers", href: `${basePath}/managers`, icon: <Users className="h-5 w-5" /> },
        { title: "Admins", href: `${basePath}/admins`, icon: <Shield className="h-5 w-5" /> },
        { title: "Owners", href: `${basePath}/owners`, icon: <Building className="h-5 w-5" /> },
        { title: "Tenants", href: `${basePath}/tenants`, icon: <Users className="h-5 w-5" /> },
        { title: "Maintenance", href: `${basePath}/maintenance`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Properties", href: `${basePath}/properties`, icon: <Building className="h-5 w-5" /> },
        { title: "Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
        { title: "Reports", href: `${basePath}/reports`, icon: <BarChart3 className="h-5 w-5" /> },
        { title: "Messages", href: `${basePath}/messages`, icon: <MessageSquare className="h-5 w-5" /> },
        { title: "Documents", href: `${basePath}/documents`, icon: <FolderOpen className="h-5 w-5" /> },
        { title: "Calendar", href: `${basePath}/calendar`, icon: <Calendar className="h-5 w-5" /> },
        { title: "Notifications", href: `${basePath}/notifications`, icon: <Bell className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]
    
    case "admin":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Assistant", href: `${basePath}/assistant`, icon: <Sparkles className="h-5 w-5" /> },
        { title: "At-risk", href: `${basePath}/at-risk`, icon: <AlertTriangle className="h-5 w-5" /> },
        { title: "Managers", href: `${basePath}/managers`, icon: <Users className="h-5 w-5" /> },
        { title: "Owners", href: `${basePath}/owners`, icon: <Building className="h-5 w-5" /> },
        { title: "Tenants", href: `${basePath}/tenants`, icon: <Users className="h-5 w-5" /> },
        { title: "Maintenance", href: `${basePath}/maintenance`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Properties", href: `${basePath}/properties`, icon: <Building className="h-5 w-5" /> },
        { title: "Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
        { title: "Reports", href: `${basePath}/reports`, icon: <BarChart3 className="h-5 w-5" /> },
        { title: "Messages", href: `${basePath}/messages`, icon: <MessageSquare className="h-5 w-5" /> },
        { title: "Documents", href: `${basePath}/documents`, icon: <FolderOpen className="h-5 w-5" /> },
        { title: "Settings", href: `${basePath}/settings`, icon: <Settings className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]
    
    case "manager":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Assistant", href: `${basePath}/assistant`, icon: <Sparkles className="h-5 w-5" /> },
        { title: "At-risk", href: `${basePath}/at-risk`, icon: <AlertTriangle className="h-5 w-5" /> },
        { title: "Properties", href: `${basePath}/properties`, icon: <Building className="h-5 w-5" /> },
        { title: "Leads", href: `${basePath}/leads`, icon: <UserPlus className="h-5 w-5" /> },
        { title: "Owners", href: `${basePath}/owners`, icon: <Users className="h-5 w-5" /> },
        { title: "Tenants", href: `${basePath}/tenants`, icon: <Users className="h-5 w-5" /> },
        { title: "Maintenance", href: `${basePath}/maintenance`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
        { title: "Reports", href: `${basePath}/reports`, icon: <BarChart3 className="h-5 w-5" /> },
        { title: "Messages", href: `${basePath}/messages`, icon: <MessageSquare className="h-5 w-5" /> },
        { title: "Documents", href: `${basePath}/documents`, icon: <FolderOpen className="h-5 w-5" /> },
        { title: "Calendar", href: `${basePath}/calendar`, icon: <Calendar className="h-5 w-5" /> },
        { title: "Notifications", href: `${basePath}/notifications`, icon: <Bell className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]
    
    case "owner":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Assistant", href: `${basePath}/assistant`, icon: <Sparkles className="h-5 w-5" /> },
        { title: "Properties", href: `${basePath}/properties`, icon: <Building className="h-5 w-5" /> },
        { title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
        { title: "Reports", href: `${basePath}/reports`, icon: <BarChart3 className="h-5 w-5" /> },
        { title: "Tenants", href: `${basePath}/tenants`, icon: <Users className="h-5 w-5" /> },
        { title: "Maintenance", href: `${basePath}/maintenance`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Messages", href: `${basePath}/messages`, icon: <MessageSquare className="h-5 w-5" /> },
        { title: "Documents", href: `${basePath}/documents`, icon: <FolderOpen className="h-5 w-5" /> },
        { title: "Calendar", href: `${basePath}/calendar`, icon: <Calendar className="h-5 w-5" /> },
        { title: "Notifications", href: `${basePath}/notifications`, icon: <Bell className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]
    
    case "tenant":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Lease Details", href: `${basePath}/lease-details`, icon: <FileText className="h-5 w-5" /> },
        { title: "Property Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Maintenance", href: `${basePath}/maintenance`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Payments", href: `${basePath}/payments`, icon: <DollarSign className="h-5 w-5" /> },
        { title: "Documents", href: `${basePath}/documents`, icon: <FileText className="h-5 w-5" /> },
        { title: "Messages", href: `${basePath}/messages`, icon: <MessageSquare className="h-5 w-5" /> },
        { title: "Calendar", href: `${basePath}/calendar`, icon: <Calendar className="h-5 w-5" /> },
        { title: "Settings", href: `${basePath}/settings`, icon: <Settings className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]
    
    case "maintenance":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Tickets", href: `${basePath}/tickets`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Property Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Calendar", href: `${basePath}/calendar`, icon: <Calendar className="h-5 w-5" /> },
        { title: "Documents", href: `${basePath}/documents`, icon: <FolderOpen className="h-5 w-5" /> },
        { title: "Settings", href: `${basePath}/settings`, icon: <Settings className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]
    
    default:
      return []
  }
}

interface PortalSidebarProps {
  children: React.ReactNode
}

const MANAGER_LIKE_ROLES: UserRole[] = ["manager", "admin", "super_admin"]

function SidebarLayout({
  children,
  navItems,
  basePath,
  logout,
  location,
  user,
}: {
  children: React.ReactNode
  navItems: NavItem[]
  basePath: string
  logout: () => void
  location: ReturnType<typeof useLocation>
  user: NonNullable<ReturnType<typeof useAuth>["user"]>
}) {
  const { expanded } = useSidebar()
  const { theme, setTheme } = useTheme()

  const canAccessNotifications = MANAGER_LIKE_ROLES.includes(user.role)
  const { unreadCount } = useNotifications(canAccessNotifications)

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  const getThemeIcon = () => {
    if (theme === "dark") return <Moon className="h-4 w-4" />
    if (theme === "system") return <Laptop className="h-4 w-4" />
    return <Sun className="h-4 w-4" />
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar className="border-r border-slate-700/50 dark:border-slate-800/50">
        <SidebarHeader className="flex justify-between items-center p-4">
          <Logo 
            size="lg" 
            showText={false}
            linkTo={basePath}
            variant="default"
            textColor="default"
            className="flex-shrink-0 transition-all duration-300"
          />
          <SidebarTrigger />
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== basePath && location.pathname.startsWith(item.href))
              const isNotifications = item.title === "Notifications"
              const badge = isNotifications && unreadCount > 0 ? unreadCount : null
              
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive}
                    tooltip={badge ? `${item.title} (${badge} unread)` : item.title}
                  >
                    <Link
                      to={item.href}
                      className="flex items-center gap-3"
                    >
                      <span className="relative inline-flex">
                        {item.icon}
                        {badge !== null && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white leading-none">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </span>
                      {expanded && <span>{item.title}</span>}
                      {expanded && badge !== null && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white leading-none">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-4 border-t mt-auto flex flex-col gap-3">
          <div className="relative">
            <Link
              to={`${basePath}/profile`}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors group",
                location.pathname === `${basePath}/profile` || location.pathname.startsWith(`${basePath}/profile`)
                  ? "bg-slate-700/50 dark:bg-slate-800/50 text-white font-semibold"
                  : "text-slate-300 dark:text-slate-400 hover:bg-slate-700/30 dark:hover:bg-slate-800/30 hover:text-white",
                expanded ? "justify-start" : "justify-center"
              )}
            >
              <Avatar className="h-10 w-10 border border-slate-700 dark:border-slate-800">
                <AvatarImage 
                  src={user.profilePicture} 
                  alt={`${user.firstName} ${user.lastName}`} 
                />
                <AvatarFallback className="bg-slate-700 dark:bg-slate-800 text-white">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
              {expanded && (
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-sm font-semibold text-white">{user.firstName} {user.lastName}</span>
                  <span className="text-xs text-slate-400 capitalize">{user.role.replace("_", " ")}</span>
                </div>
              )}
            </Link>
            {!expanded && (
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-md bg-slate-800 dark:bg-slate-950 text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <div className="font-semibold">{user.firstName} {user.lastName}</div>
                <div className="text-slate-400 capitalize">{user.role.replace("_", " ")}</div>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/30 dark:hover:bg-slate-800/30",
                  expanded ? "justify-start w-full" : "justify-center w-full"
                )}
              >
                {getThemeIcon()}
                {expanded && <span>Theme</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side={expanded ? "right" : "right"} className="w-40">
              <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                <Sun className="h-4 w-4 mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                <Laptop className="h-4 w-4 mr-2" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative">
            <Link
              to="/contact"
              className={cn(
                "flex items-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/30 dark:hover:bg-slate-800/30 rounded-md px-3 py-2 transition-colors group",
                expanded ? "justify-start w-full" : "justify-center w-full"
              )}
            >
              <HelpCircle className="h-4 w-4" />
              {expanded && <span>Need help? Contact support</span>}
            </Link>
            {!expanded && (
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-md bg-slate-800 dark:bg-slate-950 text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Need help? Contact support
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700/30 dark:hover:bg-slate-800/30",
              expanded ? "justify-start w-full" : "justify-center w-full"
            )}
          >
            <LogOut className="h-4 w-4" />
            {expanded && <span>Log out</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}

export function PortalSidebar({ children }: PortalSidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const sidebarKey = isDesktop ? "desktop" : "mobile"
  
  if (!user) {
    return <>{children}</>
  }

  const navItems = getNavItems(user.role)
  const basePath = getDashboardPath(user.role)

  return (
    <SidebarProvider key={sidebarKey} defaultExpanded={isDesktop}>
      <SidebarLayout
        user={user}
        navItems={navItems}
        basePath={basePath}
        logout={logout}
        location={location}
      >
        {children}
      </SidebarLayout>
    </SidebarProvider>
  )
}

