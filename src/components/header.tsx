import { Link, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import UserMenu from "@/components/user-menu"
import { useAuth } from "@/lib/auth-context"
import { Logo } from "@/components/logo"
import { Menu, LogOut, Users } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { authApi, type InvitedUser } from "@/lib/api"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useTranslation } from "react-i18next"

// Navigation items - only shown for managers
const managerNavItems = [
  { labelKey: "nav.overview", path: "/dashboard", tab: "overview" },
  { labelKey: "nav.properties", path: "/dashboard/properties", tab: "properties" },
  { labelKey: "nav.ownerProperties", path: "/dashboard", tab: "owner-properties" },
  { labelKey: "nav.leads", path: "/dashboard", tab: "leads" },
  { labelKey: "nav.maintenance", path: "/dashboard/maintenance", tab: "maintenance" },
  { labelKey: "nav.myUsers", path: "/dashboard", tab: "my-users" },
  { labelKey: "nav.userManagement", path: "/dashboard", tab: "user-management" },
]

const marketingNavItems = [
  { labelKey: "nav.product", path: "/product" },
  { labelKey: "nav.features", path: "/features" },
  { labelKey: "nav.pricing", path: "/pricing" },
  { labelKey: "nav.about", path: "/about" },
  { labelKey: "nav.contact", path: "/contact" },
  { labelKey: "nav.faq", path: "/faq" },
]

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMarketingMenuOpen, setIsMarketingMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([])
  const [isLoadingInvited, setIsLoadingInvited] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch invited users to compute active owners and tenants counts
  useEffect(() => {
    const fetchInvited = async () => {
      if (!user || (user.role !== "manager" && user.role !== "super_admin" && user.role !== "admin")) return
      try {
        setIsLoadingInvited(true)
        const usersRes = await authApi.getInvitedUsers()
        setInvitedUsers(usersRes.users)
      } catch (error) {
        console.error("Error fetching invited users:", error)
        setInvitedUsers([])
      } finally {
        setIsLoadingInvited(false)
      }
    }
    fetchInvited()
  }, [user])

  const activeOwnersCount = invitedUsers.filter(u => u.role === "owner" && u.isActive).length
  const activeTenantsCount = invitedUsers.filter(u => u.role === "tenant" && u.isActive).length


  const isActive = (item: { path: string; tab?: string; labelKey?: string }) => {
    // Check if we're on the dashboard path
    if (location.pathname.startsWith("/dashboard")) {
      const urlParams = new URLSearchParams(location.search)
      const currentTab = urlParams.get("tab")
      
      // If the location matches the item's path exactly or starts with it (except for root /dashboard)
      if (item.path !== "/dashboard" && (location.pathname === item.path || location.pathname.startsWith(item.path + "/"))) {
        return true
      }
      
      if (item.path === "/dashboard" && location.pathname === "/dashboard") {
         if (!currentTab && item.tab === "overview") return true
         if (currentTab === item.tab) return true
      }
      
      // If item has a tab, check if it matches the current tab parameter
      if (item.tab && currentTab === item.tab) {
        return true
      }
      
      return false
    }
    
    // For non-dashboard paths
    return location.pathname === item.path || location.pathname.startsWith(item.path + "/")
  }

  const isMarketingActive = (path: string) => {
    const [basePath, hash] = path.split("#")
    if (hash) {
      return location.pathname === (basePath || "/") && location.hash === `#${hash}`
    }
    return location.pathname === path
  }

  const marketingLinks = (variant: "desktop" | "mobile") =>
    marketingNavItems.map((item) => (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => variant === "mobile" && setIsMarketingMenuOpen(false)}
        className={cn(
          "text-sm font-medium transition-colors",
          variant === "desktop"
            ? "px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-muted"
            : "px-4 py-3 border-b border-gray-800 text-gray-300 hover:text-white",
          isMarketingActive(item.path) && "bg-orange-500 text-gray-900 font-semibold dark:text-gray-900"
        )}
      >
        {t(item.labelKey)}
      </Link>
    ))

  if (!user) {
    return (
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200 bg-background/90 backdrop-blur dark:bg-background/90",
          isScrolled && "shadow-lg"
        )}
      >
        <div className="hidden md:flex container mx-auto h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center flex-shrink-0 min-w-0">
            <Logo size="md" showText textColor="white" linkTo="/" />
          </div>
          <nav className="flex items-center gap-1">{marketingLinks("desktop")}</nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white hover:bg-muted dark:hover:bg-card">
                {t("auth.login")}
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="sm" className="border-gray-700 bg-transparent text-white hover:bg-muted">
                {t("auth.ownerSignup")}
              </Button>
            </Link>
            <Link to="/free-trial">
              <Button size="sm" className="bg-orange-500 text-black hover:bg-orange-400">
                {t("auth.startFreeTrial")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex md:hidden container mx-auto h-16 items-center justify-between gap-2 px-4">
          <Logo size="sm" showText textColor="white" linkTo="/" />
          <div className="flex items-center gap-1">
            <ModeToggle />
            <Link to="/free-trial">
              <Button size="sm" className="bg-orange-500 text-black hover:bg-orange-400">
                {t("auth.trial")}
              </Button>
            </Link>
            <Sheet open={isMarketingMenuOpen} onOpenChange={setIsMarketingMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-muted p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[260px] bg-card text-white p-0">
                <SheetTitle className="sr-only">{t("common.navigation")}</SheetTitle>
                <SheetDescription className="sr-only">{t("common.marketingNav")}</SheetDescription>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-800">
                    <span className="text-lg font-semibold">{t("nav.menu")}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto">{marketingLinks("mobile")}</div>
                  <div className="p-4 border-t border-gray-800 space-y-2">
                    <Link to="/login" onClick={() => setIsMarketingMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-muted">
                        {t("auth.login")}
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsMarketingMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-gray-700 bg-transparent text-white hover:bg-muted">
                        {t("auth.ownerSignup")}
                      </Button>
                    </Link>
                    <Link to="/free-trial" onClick={() => setIsMarketingMenuOpen(false)}>
                      <Button className="w-full bg-orange-500 text-black hover:bg-orange-400">
                        {t("auth.startFreeTrial")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200 bg-background dark:bg-background",
        isScrolled && "shadow-lg"
      )}
    >
      {/* Desktop/Tablet Navigation */}
      <div className="hidden lg:flex container mx-auto px-2 sm:px-4 md:px-6 h-16 items-center justify-between gap-2 min-w-0">
        {/* Left: Logo */}
        <div className="flex items-center flex-shrink-0 min-w-0">
          <Logo 
            size="md" 
            showText={true}
            textColor="white"
          />
        </div>

        {/* Center: Navigation Links - Fluid with scroll */}
        <nav className="flex items-center gap-1 sm:gap-2 flex-1 justify-center min-w-0 px-2 sm:px-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Only show navigation for managers - other roles have their own portals */}
            {user?.role === "manager" && managerNavItems.map((item) => {
              const href = item.tab ? `${item.path}?tab=${item.tab}` : item.path
              return (
                <Link
                  key={item.tab ? `${item.path}-${item.tab}` : item.path}
                  to={href}
                  className={cn(
                    "px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0",
                    isActive(item)
                      ? "bg-orange-500 text-gray-900 dark:text-gray-900 font-semibold"
                      : "text-gray-300 dark:text-gray-400 hover:text-white hover:bg-muted"
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              )
            })}
            
            {/* Active Owners and Tenants - Only show for managers/super_admins/admins */}
            {(user?.role === "manager" || user?.role === "super_admin" || user?.role === "admin") && (
              <>
                <Link
                  to="/dashboard/owners"
                  className={cn(
                    "flex items-center gap-2 px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0",
                    location.pathname === "/dashboard/owners" || location.pathname.startsWith("/dashboard/owners/")
                      ? "bg-orange-500 text-gray-900 dark:text-gray-900 font-semibold"
                      : "text-gray-300 dark:text-gray-400 hover:text-white hover:bg-muted"
                  )}
                >
                  <Users className={cn(
                    "h-4 w-4",
                    location.pathname === "/dashboard/owners" || location.pathname.startsWith("/dashboard/owners/")
                      ? "text-gray-900 dark:text-gray-900"
                      : "text-gray-400 dark:text-gray-400"
                  )} />
                  <span>{t("nav.owners")}</span>
                  <span className={cn(
                    "font-bold",
                    location.pathname === "/dashboard/owners" || location.pathname.startsWith("/dashboard/owners/")
                      ? "text-gray-900 dark:text-gray-900"
                      : "text-white"
                  )}>{isLoadingInvited ? "..." : activeOwnersCount}</span>
                </Link>
                <Link
                  to="/dashboard/tenants"
                  className={cn(
                    "flex items-center gap-2 px-2 sm:px-3 md:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-shrink-0",
                    location.pathname === "/dashboard/tenants" || location.pathname.startsWith("/dashboard/tenants/")
                      ? "bg-orange-500 text-gray-900 dark:text-gray-900 font-semibold"
                      : "text-gray-300 dark:text-gray-400 hover:text-white hover:bg-muted"
                  )}
                >
                  <Users className={cn(
                    "h-4 w-4",
                    location.pathname === "/dashboard/tenants" || location.pathname.startsWith("/dashboard/tenants/")
                      ? "text-gray-900 dark:text-gray-900"
                      : "text-gray-400 dark:text-gray-400"
                  )} />
                  <span>{t("nav.tenants")}</span>
                  <span className={cn(
                    "font-bold",
                    location.pathname === "/dashboard/tenants" || location.pathname.startsWith("/dashboard/tenants/")
                      ? "text-gray-900 dark:text-gray-900"
                      : "text-white"
                  )}>{isLoadingInvited ? "..." : activeTenantsCount}</span>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Right: Mode Toggle, User Menu */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
          <LanguageSwitcher />
          <ModeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Tablet/Mobile Navigation - Hamburger Menu */}
      <div className="lg:hidden bg-background dark:bg-background">
        <div className="container mx-auto px-2 sm:px-4 h-16">
          <div className="flex items-center justify-between h-full gap-2 min-w-0">
            {/* Left: Logo */}
            <div className="flex items-center flex-shrink-0 min-w-0">
              <Logo 
                size="sm" 
                showText={true}
                textColor="white"
              />
            </div>

            {/* Right: Menu, Mode Toggle, User Menu */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <LanguageSwitcher variant="compact" />
              <ModeToggle />
              <UserMenu />
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-muted dark:hover:bg-card p-2"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[300px] bg-card text-white p-0">
                  <SheetTitle className="sr-only">{t("common.navigation")}</SheetTitle>
                  <SheetDescription className="sr-only">{t("common.mobileNavDesc")}</SheetDescription>
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-gray-800">
                      <span className="text-lg font-semibold">{t("nav.menu")}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <nav className="flex flex-col">
                        {/* Only show navigation for managers - other roles have their own portals */}
                        {user?.role === "manager" && managerNavItems.map((item) => {
                          const href = item.tab ? `${item.path}?tab=${item.tab}` : item.path
                          return (
                            <Link
                              key={item.tab ? `${item.path}-${item.tab}` : item.path}
                              to={href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                "px-4 py-3 text-sm font-medium transition-colors border-b border-gray-800 rounded-md mx-2 my-1",
                                isActive(item)
                                  ? "bg-orange-500 text-gray-900 dark:text-gray-900 font-semibold"
                                  : "text-gray-300 dark:text-gray-400 hover:text-white hover:bg-muted"
                              )}
                            >
                              {t(item.labelKey)}
                            </Link>
                          )
                        })}
                        
                        {/* Active Owners and Tenants - Only show for managers/super_admins/admins */}
                        {(user?.role === "manager" || user?.role === "super_admin" || user?.role === "admin") && (
                          <>
                            <Link
                              to="/dashboard/owners"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                "px-4 py-3 text-sm font-medium transition-colors border-b border-gray-800 rounded-md mx-2 my-1 flex items-center justify-between",
                                location.pathname === "/dashboard/owners" || location.pathname.startsWith("/dashboard/owners/")
                                  ? "bg-orange-500 text-gray-900 dark:text-gray-900 font-semibold"
                                  : "text-gray-300 dark:text-gray-400 hover:text-white hover:bg-muted"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Users className={cn(
                                  "h-4 w-4",
                                  location.pathname === "/dashboard/owners" || location.pathname.startsWith("/dashboard/owners/")
                                    ? "text-gray-900 dark:text-gray-900"
                                    : "text-gray-400 dark:text-gray-400"
                                )} />
                                <span>{t("nav.owners")}</span>
                              </div>
                              <span className={cn(
                                "font-bold",
                                location.pathname === "/dashboard/owners" || location.pathname.startsWith("/dashboard/owners/")
                                  ? "text-gray-900 dark:text-gray-900"
                                  : "text-white"
                              )}>{isLoadingInvited ? "..." : activeOwnersCount}</span>
                            </Link>
                            <Link
                              to="/dashboard/tenants"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                "px-4 py-3 text-sm font-medium transition-colors border-b border-gray-800 rounded-md mx-2 my-1 flex items-center justify-between",
                                location.pathname === "/dashboard/tenants" || location.pathname.startsWith("/dashboard/tenants/")
                                  ? "bg-orange-500 text-gray-900 dark:text-gray-900 font-semibold"
                                  : "text-gray-300 dark:text-gray-400 hover:text-white hover:bg-muted"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Users className={cn(
                                  "h-4 w-4",
                                  location.pathname === "/dashboard/tenants" || location.pathname.startsWith("/dashboard/tenants/")
                                    ? "text-gray-900 dark:text-gray-900"
                                    : "text-gray-400 dark:text-gray-400"
                                )} />
                                <span>{t("nav.tenants")}</span>
                              </div>
                              <span className={cn(
                                "font-bold",
                                location.pathname === "/dashboard/tenants" || location.pathname.startsWith("/dashboard/tenants/")
                                  ? "text-gray-900 dark:text-gray-900"
                                  : "text-white"
                              )}>{isLoadingInvited ? "..." : activeTenantsCount}</span>
                            </Link>
                          </>
                        )}
                      </nav>
                    </div>
                    <div className="p-4 border-t border-gray-800">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          logout()
                          setIsMobileMenuOpen(false)
                        }}
                        className="w-full justify-start text-gray-300 dark:text-gray-400 hover:text-white hover:bg-muted"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t("auth.logout")}</span>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
