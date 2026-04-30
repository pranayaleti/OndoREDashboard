/**
 * Compatibility shim that maps the legacy Radix `useToast()` / `toast({...})`
 * surface onto Sonner, which is the only `<Toaster />` wired into App.tsx.
 *
 * Why this exists: ~120 components were calling `toast(...)` from this module,
 * but the Radix viewport was never mounted, so those notifications silently
 * disappeared (most importantly the access-denied warning in ProtectedRoute).
 * Rewriting every call site at once is a large change with no test coverage,
 * so we forward the legacy API to Sonner and keep behavior at every call site.
 *
 * Existing callers (do not change):
 *   import { toast } from "@/hooks/use-toast"
 *   toast({ title: "Saved", description: "...", variant: "destructive" })
 *
 * The returned `{ id, dismiss, update }` object preserves the original API so
 * the rare callers that hold on to the handle keep compiling.
 */

import { useMemo } from "react";
import { toast as sonnerToast } from "sonner";
import type { ToastProps } from "@/components/ui/toast";

type Variant = "default" | "destructive" | "success" | "warning" | "orange";

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: Variant | null;
  /**
   * Auto-dismiss after N ms. Sonner default is 4000ms.
   * Pass Infinity to keep the toast until dismissed.
   */
  duration?: number;
};

function renderToHostString(value: React.ReactNode): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  // Sonner accepts ReactNode for title; fall back to a sensible default for non-string titles.
  if (value === undefined || value === null) return "";
  return "Notification";
}

function toast(input: ToastInput | string) {
  const opts: ToastInput =
    typeof input === "string" ? { title: input } : (input ?? {});

  const titleNode = opts.title;
  const description = opts.description;
  const duration = opts.duration;
  const variant: Variant = opts.variant ?? "default";

  const sonnerOptions = {
    description,
    ...(duration !== undefined ? { duration } : {}),
  };

  let id: string | number;
  switch (variant) {
    case "destructive":
      id = sonnerToast.error(
        typeof titleNode === "string" ? titleNode : renderToHostString(titleNode),
        sonnerOptions
      );
      break;
    case "success":
      id = sonnerToast.success(
        typeof titleNode === "string" ? titleNode : renderToHostString(titleNode),
        sonnerOptions
      );
      break;
    case "warning":
    case "orange":
      id = sonnerToast.warning(
        typeof titleNode === "string" ? titleNode : renderToHostString(titleNode),
        sonnerOptions
      );
      break;
    case "default":
    default:
      // For ReactNode titles, sonner accepts JSX in its `title` prop on the base call.
      id = sonnerToast(
        typeof titleNode === "string" || titleNode === undefined
          ? (titleNode as string | undefined) ?? ""
          : (titleNode as React.ReactNode),
        sonnerOptions
      );
  }

  const idStr = String(id);
  return {
    id: idStr,
    dismiss: () => sonnerToast.dismiss(id),
    update: (props: Partial<ToastInput>) =>
      // Sonner does not have an in-place update by id without recreating; fall back to
      // dismiss + re-emit, preserving call-site compatibility.
      {
        sonnerToast.dismiss(id);
        if (props && (props.title || props.description)) {
          toast({
            title: props.title ?? titleNode,
            description: props.description ?? description,
            variant: props.variant ?? variant,
            duration: props.duration ?? duration,
          });
        }
      },
  };
}

/**
 * Legacy `useToast` hook — kept for back-compat with components that destructure
 * `const { toast } = useToast()`. The `toasts` array is intentionally empty
 * because Sonner manages its own internal queue; consumers that read `toasts`
 * directly should migrate to Sonner's API.
 */
function useToast() {
  return useMemo(
    () => ({
      toast,
      dismiss: (toastId?: string) => {
        if (toastId === undefined) sonnerToast.dismiss();
        else sonnerToast.dismiss(toastId);
      },
      toasts: [] as ToasterToast[],
    }),
    []
  );
}

export { useToast, toast };
