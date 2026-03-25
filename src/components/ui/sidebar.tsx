import * as React from "react"
import { cn } from "@/lib/utils"
import { PanelLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarContextProps {
  expanded: boolean
  isMobile: boolean
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>
  toggleExpanded: () => void
}

const SidebarContext = React.createContext<SidebarContextProps>({
  expanded: true,
  isMobile: false,
  setExpanded: () => {},
  toggleExpanded: () => {},
})

export function SidebarProvider({
  children,
  defaultExpanded = true,
  isMobile = false,
}: {
  children: React.ReactNode
  defaultExpanded?: boolean
  isMobile?: boolean
}) {
  const [expanded, setExpanded] = React.useState(defaultExpanded)
  const toggleExpanded = () => setExpanded((prev) => !prev)

  return (
    <SidebarContext.Provider value={{ expanded, isMobile, setExpanded, toggleExpanded }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return React.useContext(SidebarContext)
}

export function Sidebar({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { expanded, isMobile, setExpanded } = useSidebar()

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {expanded && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
            aria-hidden
          />
        )}
        {/* Drawer */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform duration-300 ease-in-out",
            "bg-[#1e293b] dark:bg-[#0f172a]",
            expanded ? "translate-x-0" : "-translate-x-full",
            className,
          )}
        >
          {children}
        </aside>
      </>
    )
  }

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 z-30 flex flex-col transition-all duration-300 ease-in-out",
        "bg-[#1e293b] dark:bg-[#0f172a]",
        expanded ? "w-64" : "w-16",
        className,
      )}
    >
      {children}
    </aside>
  )
}

export function SidebarHeader({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("flex h-16 items-center border-b border-slate-700/50 dark:border-slate-800/50 px-4", className)}>{children}</div>
}

export function SidebarContent({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("flex-1 overflow-auto py-4", className)}>{children}</div>
}

export function SidebarFooter({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("flex items-center border-t border-slate-700/50 dark:border-slate-800/50 p-4", className)}>{children}</div>
}

export function SidebarMenu({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <nav className={cn("grid gap-2 px-2", className)}>{children}</nav>
}

export function SidebarMenuItem({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={cn("relative", className)}>{children}</div>
}

export function SidebarTrigger() {
  const { toggleExpanded, expanded } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleExpanded}
      className="absolute top-4 -right-4 h-8 w-8 rounded-full border border-slate-700 dark:border-slate-800 shadow-md bg-slate-800 dark:bg-slate-950 hover:bg-slate-700 dark:hover:bg-slate-900 text-white z-10"
    >
      {expanded ? <PanelLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </Button>
  )
}

export function SidebarMenuButton({
  className,
  children,
  isActive,
  tooltip,
  asChild,
  ...props
}: {
  className?: string
  children: React.ReactNode
  isActive?: boolean
  tooltip?: string
  asChild?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { expanded } = useSidebar()

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement

    return (
      <div className="relative group w-full">
        {React.cloneElement(child, {
          className: cn(
            child.props.className,
            "flex w-full items-center rounded-md px-3 py-3 text-sm lg:text-base font-medium transition-colors gap-3",
            isActive
              ? "bg-slate-700/50 dark:bg-slate-800/50 text-white font-semibold"
              : "text-slate-300 dark:text-slate-400 hover:bg-slate-700/30 dark:hover:bg-slate-800/30 hover:text-white",
            expanded ? "justify-start" : "justify-center",
            className,
          ),
        })}
        {tooltip && !expanded && (
          <div className="absolute left-full top-1/2 ml-4 -translate-y-1/2 rounded bg-slate-800 dark:bg-slate-950 px-2 py-1 text-xs text-white opacity-0 shadow-lg group-hover:opacity-100 z-50 whitespace-nowrap">
            {tooltip}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      {...props}
      className={cn(
        "group relative flex w-full items-center rounded-md px-3 py-3 text-sm lg:text-base font-medium transition-colors gap-3",
        isActive
          ? "bg-slate-700/50 dark:bg-slate-800/50 text-white font-semibold"
          : "text-slate-300 dark:text-slate-400 hover:bg-slate-700/30 dark:hover:bg-slate-800/30 hover:text-white",
        expanded ? "justify-start" : "justify-center",
        className,
      )}
    >
      {children}
      {tooltip && !expanded && (
        <div className="absolute left-full top-1/2 ml-4 -translate-y-1/2 rounded bg-slate-800 dark:bg-slate-950 px-2 py-1 text-xs text-white opacity-0 shadow-lg group-hover:opacity-100 z-50 whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </button>
  )
}
