import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api"
import { storageUploadErrorMessage } from "./storage-upload-error"

describe("storageUploadErrorMessage", () => {
  it("uses the API error message so storage 503s are not generic", () => {
    const err = new ApiError(
      "File storage is unavailable. Configure Cloudflare R2, or ensure Supabase Storage is configured.",
      503,
      "SERVICE_UNAVAILABLE",
    )
    expect(storageUploadErrorMessage(err, "Failed to add floor plan")).toBe(
      "File storage is unavailable. Configure Cloudflare R2, or ensure Supabase Storage is configured.",
    )
  })

  it("falls back when the error has no message", () => {
    expect(storageUploadErrorMessage({}, "Failed to add floor plan")).toBe("Failed to add floor plan")
  })
})
