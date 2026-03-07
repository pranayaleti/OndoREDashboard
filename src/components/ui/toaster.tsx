import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "border bg-card text-card-foreground shadow-sm",
          success: "border-green-500/50",
          error: "border-destructive bg-destructive/10 text-destructive",
        },
      }}
    />
  )
}
