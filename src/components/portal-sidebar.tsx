import { useEffect, useState } from "react"
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
  ClipboardCheck,
  Home,
  Moon,
  Sun,
  Laptop,
  Bell,
  Calendar,
  Settings,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  Target,
  Briefcase,
  KeyRound,
  CreditCard,
  Landmark,
  Hammer,
  Cpu,
  LayoutGrid,
  Upload,
  Gift,
  ChevronDown,
  Info,
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/hooks/use-notifications"
import { Menu } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PortalOnboardingTour } from "@/components/portal-onboarding-tour"
import { ModeToggle } from "@/components/mode-toggle"
import { Breadcrumb } from "@/components/ui/breadcrumb"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  description?: string
  dataTourId?: string
  roles?: UserRole[] // If specified, only show for these roles
}

interface NavSection {
  id: string
  label?: string
  items: NavItem[]
  defaultOpen?: boolean
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

// Define navigation items for each role
const getNavItems = (role: UserRole, t: TranslateFn): NavItem[] => {
  const basePath = getDashboardPath(role)
  
  switch (role) {
    case "super_admin":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Assistant", href: `${basePath}/assistant`, icon: <Sparkles className="h-5 w-5" /> },
        { title: "At-risk", href: `${basePath}/at-risk`, icon: <AlertTriangle className="h-5 w-5" /> },
        { title: "Managers", href: `${basePath}/managers`, icon: <Users className="h-5 w-5" /> },
        { title: "Admins", href: `${basePath}/admins`, icon: <Shield className="h-5 w-5" /> },
        { title: "Owners", href: `${basePath}/owners`, icon: <Briefcase className="h-5 w-5" /> },
        { title: "Tenants", href: `${basePath}/tenants`, icon: <KeyRound className="h-5 w-5" /> },
        { title: "Maintenance", href: `${basePath}/maintenance`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Screening", href: `${basePath}/screening`, icon: <ClipboardCheck className="h-5 w-5" /> },
        { title: "Properties", href: `${basePath}/properties`, icon: <Building className="h-5 w-5" /> },
        { title: "Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
        { title: "Reports", href: `${basePath}/reports`, icon: <BarChart3 className="h-5 w-5" /> },
        { title: "Messages", href: `${basePath}/messages`, icon: <MessageSquare className="h-5 w-5" /> },
        { title: "Documents", href: `${basePath}/documents`, icon: <FolderOpen className="h-5 w-5" /> },
        { title: "Calendar", href: `${basePath}/calendar`, icon: <Calendar className="h-5 w-5" /> },
        { title: "Notifications", href: `${basePath}/notifications`, icon: <Bell className="h-5 w-5" /> },
        { title: "Referral Program", href: `${basePath}/referrals`, icon: <Gift className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]
    
    case "admin":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Assistant", href: `${basePath}/assistant`, icon: <Sparkles className="h-5 w-5" /> },
        { title: "At-risk", href: `${basePath}/at-risk`, icon: <AlertTriangle className="h-5 w-5" /> },
        { title: "Managers", href: `${basePath}/managers`, icon: <Users className="h-5 w-5" /> },
        { title: "Owners", href: `${basePath}/owners`, icon: <Briefcase className="h-5 w-5" /> },
        { title: "Tenants", href: `${basePath}/tenants`, icon: <KeyRound className="h-5 w-5" /> },
        { title: "Maintenance", href: `${basePath}/maintenance`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Screening", href: `${basePath}/screening`, icon: <ClipboardCheck className="h-5 w-5" /> },
        { title: "Properties", href: `${basePath}/properties`, icon: <Building className="h-5 w-5" /> },
        { title: "Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
        { title: "Reports", href: `${basePath}/reports`, icon: <BarChart3 className="h-5 w-5" /> },
        { title: "Messages", href: `${basePath}/messages`, icon: <MessageSquare className="h-5 w-5" /> },
        { title: "Documents", href: `${basePath}/documents`, icon: <FolderOpen className="h-5 w-5" /> },
        { title: "Settings", href: `${basePath}/settings`, icon: <Settings className="h-5 w-5" /> },
        { title: "Referral Program", href: `${basePath}/referrals`, icon: <Gift className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]
    
    case "manager":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Assistant", href: `${basePath}/assistant`, icon: <Sparkles className="h-5 w-5" /> },
        { title: "At-risk", href: `${basePath}/at-risk`, icon: <AlertTriangle className="h-5 w-5" /> },
        { title: "Properties", href: `${basePath}/properties`, icon: <Building className="h-5 w-5" /> },
        { title: "Leads", href: `${basePath}/leads`, icon: <Target className="h-5 w-5" /> },
        { title: "Owners", href: `${basePath}/owners`, icon: <Briefcase className="h-5 w-5" /> },
        { title: "Tenants", href: `${basePath}/tenants`, icon: <KeyRound className="h-5 w-5" /> },
        { title: "Maintenance", href: `${basePath}/maintenance`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Screening", href: `${basePath}/screening`, icon: <ClipboardCheck className="h-5 w-5" /> },
        { title: "Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
        { title: "Payments", href: `${basePath}/payments`, icon: <CreditCard className="h-5 w-5" /> },
        { title: "Reports", href: `${basePath}/reports`, icon: <BarChart3 className="h-5 w-5" /> },
        { title: "Messages", href: `${basePath}/messages`, icon: <MessageSquare className="h-5 w-5" /> },
        { title: "Documents", href: `${basePath}/documents`, icon: <FolderOpen className="h-5 w-5" /> },
        { title: "Calendar", href: `${basePath}/calendar`, icon: <Calendar className="h-5 w-5" /> },
        { title: "Notifications", href: `${basePath}/notifications`, icon: <Bell className="h-5 w-5" /> },
        { title: "Referral Program", href: `${basePath}/referrals`, icon: <Gift className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]
    
    case "owner":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Portfolio", href: `${basePath}/portfolio`, icon: <LayoutGrid className="h-5 w-5" /> },
        { title: "Assistant", href: `${basePath}/assistant`, icon: <Sparkles className="h-5 w-5" />, dataTourId: "owner-assistant-nav" },
        { title: t("owner:nav.actionItems"), href: `${basePath}/at-risk`, icon: <AlertTriangle className="h-5 w-5" />, description: t("owner:sidebar.actionItemsHint"), dataTourId: "owner-action-items-nav" },
        { title: "Mortgage", href: `${basePath}/mortgage`, icon: <Landmark className="h-5 w-5" /> },
        { title: "Home improvement", href: `${basePath}/improvements`, icon: <Hammer className="h-5 w-5" /> },
        { title: "Equipment", href: `${basePath}/equipment`, icon: <Cpu className="h-5 w-5" /> },
        { title: "Properties", href: `${basePath}/properties`, icon: <Building className="h-5 w-5" /> },
        { title: "Occupancy", href: `${basePath}/occupancy`, icon: <Home className="h-5 w-5" /> },
        { title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
        { title: "Payments", href: `${basePath}/payments`, icon: <CreditCard className="h-5 w-5" /> },
        { title: "Reports", href: `${basePath}/reports`, icon: <BarChart3 className="h-5 w-5" /> },
        { title: "Screening", href: `${basePath}/screening`, icon: <ClipboardCheck className="h-5 w-5" /> },
        { title: "Tenants", href: `${basePath}/tenants`, icon: <Users className="h-5 w-5" /> },
        { title: "Maintenance", href: `${basePath}/maintenance`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Messages", href: `${basePath}/messages`, icon: <MessageSquare className="h-5 w-5" /> },
        { title: t("owner:nav.myUploads"), href: `${basePath}/my-documents`, icon: <Upload className="h-5 w-5" />, dataTourId: "owner-documents-nav" },
        { title: t("owner:nav.sharedDocuments"), href: `${basePath}/documents`, icon: <FolderOpen className="h-5 w-5" /> },
        { title: "Calendar", href: `${basePath}/calendar`, icon: <Calendar className="h-5 w-5" /> },
        { title: "Notifications", href: `${basePath}/notifications`, icon: <Bell className="h-5 w-5" /> },
        { title: "Settings", href: `${basePath}/settings`, icon: <Settings className="h-5 w-5" /> },
        { title: "Referral Program", href: `${basePath}/referrals`, icon: <Gift className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]
    
    case "tenant":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Assistant", href: `${basePath}/assistant`, icon: <Sparkles className="h-5 w-5" />, dataTourId: "tenant-assistant-nav" },
        { title: "Lease Details", href: `${basePath}/lease-details`, icon: <FileText className="h-5 w-5" /> },
        { title: "Property Handoff", href: `/handoff`, icon: <ClipboardList className="h-5 w-5" /> },
        { title: "Maintenance", href: `${basePath}/maintenance`, icon: <Wrench className="h-5 w-5" />, dataTourId: "tenant-maintenance-nav" },
        { title: "Payments", href: `${basePath}/payments`, icon: <CreditCard className="h-5 w-5" />, dataTourId: "tenant-payments-nav" },
        { title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
        { title: t("tenant:nav.myUploads"), href: `${basePath}/my-documents`, icon: <Upload className="h-5 w-5" /> },
        { title: t("tenant:nav.sharedDocuments"), href: `${basePath}/documents`, icon: <FolderOpen className="h-5 w-5" /> },
        { title: "Messages", href: `${basePath}/messages`, icon: <MessageSquare className="h-5 w-5" /> },
        { title: "Calendar", href: `${basePath}/calendar`, icon: <Calendar className="h-5 w-5" /> },
        { title: "Settings", href: `${basePath}/settings`, icon: <Settings className="h-5 w-5" /> },
        { title: "Referral Program", href: `${basePath}/referrals`, icon: <Gift className="h-5 w-5" /> },
        { title: "Profile", href: `${basePath}/profile`, icon: <User className="h-5 w-5" /> },
      ]

    case "maintenance":
      return [
        { title: "Dashboard", href: `${basePath}`, icon: <LayoutDashboard className="h-5 w-5" /> },
        { title: "Tickets", href: `${basePath}/tickets`, icon: <Wrench className="h-5 w-5" /> },
        { title: "Finances", href: `${basePath}/finances`, icon: <DollarSign className="h-5 w-5" /> },
        { title: "Vendor suggestions", href: `${basePath}/vendors`, icon: <Building className="h-5 w-5" /> },
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

const flattenNavSections = (sections: NavSection[]) => sections.flatMap((section) => section.items)

function humanizeSegment(segment: string): string {
  const segmentMap: Record<string, string> = {
    "at-risk": "At Risk",
    "lease-details": "Lease Details",
    "my-documents": "My Documents",
    "referrals": "Referrals",
    "forgot-password": "Forgot Password",
  }

  return segmentMap[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function getPortalTitle(role: UserRole): string {
  switch (role) {
    case "owner":
      return "Owner Portal"
    case "tenant":
      return "Tenant Portal"
    case "maintenance":
      return "Maintenance Portal"
    case "admin":
      return "Admin Portal"
    case "super_admin":
      return "Super Admin Portal"
    default:
      return "Manager Portal"
  }
}

const getNavSections = (role: UserRole, t: TranslateFn): NavSection[] => {
  const navItems = getNavItems(role, t)

  if (role === "owner") {
    return [
      {
        id: "home",
        label: t("common:sidebar.sections.home"),
        items: navItems.filter((item) =>
          [`/owner`, `/owner/portfolio`, `/owner/assistant`, `/owner/at-risk`].includes(item.href)
        ),
      },
      {
        id: "financials",
        label: t("common:sidebar.sections.financials"),
        items: navItems.filter((item) =>
          [`/owner/mortgage`, `/owner/finances`, `/owner/payments`, `/owner/reports`].includes(item.href)
        ),
      },
      {
        id: "management",
        label: t("common:sidebar.sections.management"),
        items: navItems.filter((item) =>
          [
            `/owner/properties`,
            `/owner/occupancy`,
            `/owner/tenants`,
            `/owner/maintenance`,
            `/owner/messages`,
            `/handoff`,
            `/owner/calendar`,
          ].includes(item.href)
        ),
      },
      {
        id: "documents",
        label: t("common:sidebar.sections.documents"),
        items: navItems.filter((item) =>
          [
            `/owner/improvements`,
            `/owner/equipment`,
            `/owner/screening`,
            `/owner/my-documents`,
            `/owner/documents`,
          ].includes(item.href)
        ),
        defaultOpen: false,
      },
      {
        id: "account",
        label: t("common:sidebar.sections.account"),
        items: navItems.filter((item) =>
          [`/owner/notifications`, `/owner/settings`, `/owner/referrals`, `/owner/profile`].includes(item.href)
        ),
        defaultOpen: false,
      },
    ].filter((section) => section.items.length > 0)
  }

  if (role === "tenant") {
    return [
      {
        id: "home",
        label: t("common:sidebar.sections.home"),
        items: navItems.filter((item) =>
          [`/tenant`, `/tenant/assistant`].includes(item.href)
        ),
      },
      {
        id: "resident",
        label: t("common:sidebar.sections.resident"),
        items: navItems.filter((item) =>
          [`/tenant/lease-details`, `/handoff`, `/tenant/calendar`, `/tenant/messages`].includes(item.href)
        ),
      },
      {
        id: "payments",
        label: t("common:sidebar.sections.payments"),
        items: navItems.filter((item) =>
          [`/tenant/payments`, `/tenant/finances`, `/tenant/maintenance`].includes(item.href)
        ),
      },
      {
        id: "documents",
        label: t("common:sidebar.sections.documents"),
        items: navItems.filter((item) =>
          [`/tenant/my-documents`, `/tenant/documents`].includes(item.href)
        ),
        defaultOpen: false,
      },
      {
        id: "account",
        label: t("common:sidebar.sections.account"),
        items: navItems.filter((item) =>
          [`/tenant/settings`, `/tenant/referrals`, `/tenant/profile`].includes(item.href)
        ),
        defaultOpen: false,
      },
    ].filter((section) => section.items.length > 0)
  }

  return [
    {
      id: "primary",
      items: navItems,
    },
  ]
}

interface PortalSidebarProps {
  children: React.ReactNode
}

function SidebarLayout({
  children,
  navItems,
  navSections,
  basePath,
  logout,
  location,
  user,
}: {
  children: React.ReactNode
  navItems: NavItem[]
  navSections: NavSection[]
  basePath: string
  logout: () => void
  location: ReturnType<typeof useLocation>
  user: NonNullable<ReturnType<typeof useAuth>["user"]>
}) {
  const { expanded, isMobile, setExpanded } = useSidebar()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const canAccessNotifications = true
  const { unreadCount } = useNotifications(canAccessNotifications)
  const pathSegments = location.pathname.split("/").filter(Boolean)
  const crumbSegments = pathSegments[0] ? pathSegments.slice(1) : []
  const breadcrumbItems = crumbSegments.map((segment, index) => ({
    label: humanizeSegment(segment),
    href:
      index === crumbSegments.length - 1
        ? undefined
        : `/${[pathSegments[0], ...crumbSegments.slice(0, index + 1)].join("/")}`,
  }))
  const isRootRoute = location.pathname === basePath

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  /** Reflects the actual UI (system → follow OS light/dark). */
  const getThemeIcon = () => {
    const looksDark = theme === "system" ? resolvedTheme === "dark" : theme === "dark"
    return looksDark ? (
      <Moon className="h-4 w-4 shrink-0" />
    ) : (
      <Sun className="h-4 w-4 shrink-0" />
    )
  }

  const isItemActive = (item: NavItem) =>
    location.pathname === item.href ||
    (item.href !== basePath && location.pathname.startsWith(item.href))

  useEffect(() => {
    setOpenSections((previous) => {
      const next = { ...previous }
      let changed = false

      navSections.forEach((section) => {
        if (next[section.id] === undefined) {
          next[section.id] = section.defaultOpen ?? section.items.some(isItemActive)
          changed = true
          return
        }

        if (section.items.some(isItemActive) && !next[section.id]) {
          next[section.id] = true
          changed = true
        }
      })

      return changed ? next : previous
    })
  }, [location.pathname, navSections])

  const renderNavItem = (item: NavItem, nested = false) => {
    const isActive = isItemActive(item)
    const isNotifications = item.href.endsWith("/notifications")
    const badge = isNotifications && unreadCount > 0 ? unreadCount : null
    const tooltipLabel =
      badge !== null ? `${item.title} (${badge} unread)` : item.description ?? item.title

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={tooltipLabel}
          className={nested ? "py-2.5 text-sm" : undefined}
        >
          <Link
            to={item.href}
            className="flex items-center gap-3"
            onClick={() => isMobile && setExpanded(false)}
            data-tour-target={item.dataTourId}
          >
            <span className="relative inline-flex">
              {item.icon}
              {badge !== null && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white leading-none">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
            {expanded && (
              <span className="flex items-center gap-1.5">
                <span>{item.title}</span>
                {item.description ? (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex text-slate-400 transition-colors hover:text-white">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        {item.description}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </span>
            )}
            {expanded && badge !== null && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold text-white leading-none">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
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
          {!isMobile && <SidebarTrigger />}
        </SidebarHeader>
        
        <SidebarContent>
          {expanded && navSections.length > 1 ? (
            <SidebarMenu className="gap-4">
              {navSections.map((section) => (
                <div
                  key={section.id}
                  className="space-y-2 border-t border-slate-800/50 pt-3 first:border-t-0 first:pt-0"
                >
                  {section.label ? (
                    <Collapsible
                      open={openSections[section.id]}
                      onOpenChange={(open) =>
                        setOpenSections((previous) => ({
                          ...previous,
                          [section.id]: open,
                        }))
                      }
                    >
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-between rounded-md px-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 transition-colors hover:text-slate-200">
                          <span>{section.label}</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              openSections[section.id] ? "rotate-0" : "-rotate-90",
                            )}
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 pt-2">
                        {section.items.map((item) => renderNavItem(item, true))}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    section.items.map((item) => renderNavItem(item, true))
                  )}
                </div>
              ))}
            </SidebarMenu>
          ) : (
            <SidebarMenu>
              {navItems.map((item) => renderNavItem(item))}
            </SidebarMenu>
          )}
        </SidebarContent>
        
        <SidebarFooter className="p-4 border-t mt-auto flex flex-col gap-3">
          <div className="relative">
            <Link
              to={`${basePath}/profile`}
              onClick={() => isMobile && setExpanded(false)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm lg:text-base font-medium transition-colors group",
                location.pathname === `${basePath}/profile` || location.pathname.startsWith(`${basePath}/profile`)
                  ? "bg-secondary/50 dark:bg-card/50 text-white font-semibold"
                  : "text-slate-300 dark:text-slate-400 hover:bg-secondary/30 dark:hover:bg-card/30 hover:text-white",
                expanded ? "justify-start" : "justify-center"
              )}
            >
              <Avatar className="h-10 w-10 border border-slate-700 dark:border-slate-800">
                <AvatarImage 
                  src={user.profilePicture} 
                  alt={`${user.firstName} ${user.lastName}`} 
                />
                <AvatarFallback className="bg-secondary dark:bg-card text-white">{getInitials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
              {expanded && (
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-sm lg:text-base font-semibold text-white">{user.firstName} {user.lastName}</span>
                  <span className="text-xs lg:text-sm text-slate-400 capitalize">{user.role.replace("_", " ")}</span>
                </div>
              )}
            </Link>
            {!expanded && (
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-md bg-muted dark:bg-background text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <div className="font-semibold">{user.firstName} {user.lastName}</div>
                <div className="text-slate-400 capitalize">{user.role.replace("_", " ")}</div>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Appearance"
                className={cn(
                  "gap-2 text-sm lg:text-base text-slate-400 hover:text-white hover:bg-secondary/30 dark:hover:bg-card/30",
                  expanded ? "justify-start w-full" : "justify-center w-full"
                )}
              >
                {getThemeIcon()}
                {expanded && <span>Appearance</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side={expanded ? "right" : "right"} className="w-56">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Main workspace
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={theme ?? "system"}
                onValueChange={(value) => setTheme(value)}
              >
                <DropdownMenuRadioItem value="light" className="cursor-pointer gap-2">
                  <Sun className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col gap-0.5 py-0.5">
                    <span>Light</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Warm off-white canvas
                    </span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" className="cursor-pointer gap-2">
                  <Moon className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col gap-0.5 py-0.5">
                    <span>Dark</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Zinc panel with brand glow
                    </span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system" className="cursor-pointer gap-2">
                  <Laptop className="h-4 w-4 shrink-0" />
                  <div className="flex flex-col gap-0.5 py-0.5">
                    <span>System</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      Match this device
                    </span>
                  </div>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative">
            <Link
              to="/contact"
              aria-label="Need help? Contact support"
              className={cn(
                "flex items-center gap-2 text-sm lg:text-base text-slate-400 hover:text-white hover:bg-secondary/30 dark:hover:bg-card/30 rounded-md px-3 py-2 transition-colors group",
                expanded ? "justify-start w-full" : "justify-center w-full"
              )}
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              {expanded && <span>Need help? Contact support</span>}
            </Link>
            {!expanded && (
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-md bg-muted dark:bg-background text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Need help? Contact support
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={logout}
            aria-label="Log out"
            className={cn(
              "gap-2 text-sm lg:text-base text-slate-400 hover:text-white hover:bg-secondary/30 dark:hover:bg-card/30",
              expanded ? "justify-start w-full" : "justify-center w-full"
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {expanded && <span>Log out</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>
      
      <main className="relative flex-1 overflow-auto bg-background dark:bg-background">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-15%,rgba(234,88,12,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_100%_60%_at_50%_-15%,rgba(234,88,12,0.12),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-muted/80 to-muted dark:from-transparent dark:via-background/40 dark:to-background"
          aria-hidden
        />
        <div className="relative z-[1] min-h-full">
          <div className="sticky top-0 z-20 border-b border-stone-200/80 bg-background/90 backdrop-blur dark:border-zinc-800 dark:bg-background/90">
            <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                {isMobile ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpanded(true)}
                    className="text-slate-700 dark:text-slate-300"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                ) : null}
                <div className="min-w-0">
                  {isRootRoute ? (
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        {getPortalTitle(user.role)}
                      </p>
                      <h1 className="truncate text-sm font-semibold text-foreground md:text-base">Dashboard</h1>
                    </div>
                  ) : (
                    <Breadcrumb items={breadcrumbItems} className="overflow-hidden" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
              </div>
            </div>
          </div>
          <div>{children}</div>
        </div>
      </main>
      {(user.role === "owner" || user.role === "tenant") ? (
        <PortalOnboardingTour role={user.role} basePath={basePath} />
      ) : null}
    </div>
  )
}

export function PortalSidebar({ children }: PortalSidebarProps) {
  const { user, logout } = useAuth()
  const { t } = useTranslation(["common", "owner", "tenant"])
  const location = useLocation()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const sidebarKey = isDesktop ? "desktop" : "mobile"
  
  if (!user) {
    return <>{children}</>
  }

  const navSections = getNavSections(user.role, t)
  const navItems = flattenNavSections(navSections)
  const basePath = getDashboardPath(user.role)

  return (
    <SidebarProvider key={sidebarKey} defaultExpanded={isDesktop} isMobile={!isDesktop}>
      <SidebarLayout
        user={user}
        navItems={navItems}
        navSections={navSections}
        basePath={basePath}
        logout={logout}
        location={location}
      >
        {children}
      </SidebarLayout>
    </SidebarProvider>
  )
}
