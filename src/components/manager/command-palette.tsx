import { useEffect, useState, useCallback } from "react"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Building,
  Users,
  Wrench,
  CalendarDays,
  ShieldAlert,
  FileText,
  CreditCard,
  PieChart,
  Bell,
  HelpCircle,
} from "lucide-react"

interface CommandAction {
  id: string
  label: string
  hint?: string
  icon: typeof Building
  perform: () => void
}

interface CommandPaletteProps {
  /** Mapping from tab value (matches activeTab in manager-dashboard) to a switch fn. */
  switchTab: (tab: string) => void
  /** Optional triggers for global actions (open chat, refresh, etc.). */
  onOpenAssistant?: () => void
}

/**
 * cmdk-based command palette for power users. Cmd/Ctrl+K toggles. Items target
 * the manager dashboard tabs that exist in manager-dashboard.tsx today; expand
 * by adding entries to the actions list.
 */
export function CommandPalette({ switchTab, onOpenAssistant }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = /Mac/i.test(navigator.platform)
      const meta = isMac ? e.metaKey : e.ctrlKey
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const run = useCallback(
    (fn: () => void) => () => {
      setOpen(false)
      fn()
    },
    []
  )

  const navItems: CommandAction[] = [
    { id: "props", label: "Go to properties", hint: "manage", icon: Building, perform: () => switchTab("properties") },
    { id: "tenants", label: "Go to tenants", icon: Users, perform: () => switchTab("tenants") },
    { id: "leads", label: "Go to leads", icon: Users, perform: () => switchTab("leads") },
    { id: "maint", label: "Go to maintenance", icon: Wrench, perform: () => switchTab("maintenance") },
    { id: "leases", label: "Go to lease lifecycle", icon: CalendarDays, perform: () => switchTab("leases") },
    { id: "calendar", label: "Go to calendar", icon: CalendarDays, perform: () => switchTab("calendar") },
    { id: "finances", label: "Go to finances", icon: CreditCard, perform: () => switchTab("finances") },
    { id: "reports", label: "Go to reports", icon: PieChart, perform: () => switchTab("reports") },
    { id: "audit", label: "Open audit log", icon: ShieldAlert, perform: () => switchTab("audit") },
    { id: "tasks", label: "Go to tasks", icon: FileText, perform: () => switchTab("tasks") },
    { id: "notifications", label: "Go to notifications", icon: Bell, perform: () => switchTab("notifications") },
  ]

  const tools: CommandAction[] = onOpenAssistant
    ? [{ id: "assistant", label: "Open AI assistant", hint: "Ask anything", icon: HelpCircle, perform: onOpenAssistant }]
    : []

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <CommandItem key={item.id} onSelect={run(item.perform)} value={`${item.id} ${item.label}`}>
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                {item.hint && <span className="ml-auto text-xs text-muted-foreground">{item.hint}</span>}
              </CommandItem>
            )
          })}
        </CommandGroup>
        {tools.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tools">
              {tools.map((item) => {
                const Icon = item.icon
                return (
                  <CommandItem key={item.id} onSelect={run(item.perform)} value={`${item.id} ${item.label}`}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
