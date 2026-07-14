"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Home } from "lucide-react"

/**
 * Multi-unit-within-property create is not supported yet (no units table/API).
 * Each property is one dwelling; adding another unit means creating another property.
 */
export function AddUnitDialog() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Unit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add another dwelling</DialogTitle>
          <DialogDescription>
            OnDo manages each property as a single unit today. To add another dwelling, create a new
            property. Multi-unit buildings will be supported when per-property unit records ship.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-3">
          <Home className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Use Add Property for address, beds/baths, rent, and tenant assignment. That becomes the
            unit you manage under Units &amp; Tenants.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button asChild onClick={() => setIsOpen(false)}>
            <Link to="/owner/properties/add">Add Property</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
