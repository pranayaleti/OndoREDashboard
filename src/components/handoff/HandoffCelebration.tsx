import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PartyPopper, CheckCircle2, Sparkles } from "lucide-react"

interface HandoffCelebrationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalItems: number
}

export function HandoffCelebration({ open, onOpenChange, totalItems }: HandoffCelebrationProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-16 w-16 text-yellow-400 animate-pulse" />
              </div>
              <PartyPopper className="h-20 w-20 text-orange-500 relative z-10 animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-800 text-transparent bg-clip-text">
            Congratulations! 🎉
          </DialogTitle>
          <DialogDescription className="text-lg mt-4">
            You've completed all {totalItems} move-in checklist tasks!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6" />
            <span className="font-semibold">100% Complete</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your property manager has been notified of your completion. Great job getting everything set up!
          </p>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-4"
          >
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
