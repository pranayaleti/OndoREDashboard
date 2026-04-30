import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface BulkActionsToolbarProps<T extends { id: string }> {
  selected: T[]
  onClear: () => void
  /** Optional total count of items currently displayed (for "x of y selected"). */
  totalShown?: number
  /** Buttons / actions to render on the right side. */
  children?: ReactNode
}

/**
 * Sticky, low-chrome toolbar that appears when the user has selected one or more
 * rows. Pair this with a Checkbox column on a table; you own the selection state
 * (typically via useState<Set<string>>) and pass the resolved items in as `selected`.
 *
 * Usage:
 *   const [selected, setSelected] = useState<Set<string>>(new Set())
 *   <BulkActionsToolbar selected={...} onClear={() => setSelected(new Set())}>
 *     <Button>Approve</Button>
 *     <Button variant="destructive">Reject</Button>
 *   </BulkActionsToolbar>
 */
export function BulkActionsToolbar<T extends { id: string }>({
  selected,
  onClear,
  totalShown,
  children,
}: BulkActionsToolbarProps<T>) {
  if (selected.length === 0) return null

  return (
    <div className="sticky top-0 z-10 mb-2 flex items-center gap-3 rounded-md border bg-card px-3 py-2 shadow-sm">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClear}
        aria-label="Clear selection"
        className="h-7 w-7"
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="text-sm">
        <span className="font-medium">{selected.length}</span>
        <span className="text-muted-foreground">
          {typeof totalShown === "number" ? ` of ${totalShown} selected` : " selected"}
        </span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

interface SelectionCheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label?: string
}

/**
 * Tri-state-aware checkbox for bulk selection headers. Native input + a small
 * imperative effect to set indeterminate (DOM-only, not a React prop).
 */
export function SelectionCheckbox({ checked, indeterminate, onChange, label }: SelectionCheckboxProps) {
  return (
    <input
      type="checkbox"
      aria-label={label ?? "Select"}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = Boolean(indeterminate)
      }}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-input"
    />
  )
}
