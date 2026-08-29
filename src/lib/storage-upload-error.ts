import { ApiError } from "@/lib/api"

export function storageUploadErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message.trim()) {
    return err.message
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message
  }
  return fallback
}
