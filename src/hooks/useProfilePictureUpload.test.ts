import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useProfilePictureUpload } from "./useProfilePictureUpload"

const { mockAuthApi, mockToast } = vi.hoisted(() => ({
  mockAuthApi: { getProfilePictureUploadUrl: vi.fn() },
  mockToast: vi.fn(),
}))

vi.mock("../lib/api", () => ({ authApi: mockAuthApi }))
vi.mock("./use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const fetchMock = vi.fn<typeof fetch>()
const SIGNED_PUT = "https://proj.supabase.co/storage/v1/object/upload/sign/avatars/users/u1/a.jpg?token=jwt"
const PUBLIC_URL = "https://proj.supabase.co/storage/v1/object/public/avatars/users/u1/a.jpg"
const DATA_URL = "data:image/jpeg;base64,/9j/"

function putCalls() {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT")
}

beforeEach(() => {
  mockAuthApi.getProfilePictureUploadUrl.mockReset()
  mockToast.mockReset()
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (input, init) => {
    if (String(input).startsWith("data:")) return new Response(new Blob(["jpeg"], { type: "image/jpeg" }))
    if (init?.method === "PUT") return new Response(null, { status: 200 })
    return new Response(null, { status: 404 })
  })
  vi.stubGlobal("fetch", fetchMock)
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function upload() {
  const { result } = renderHook(() => useProfilePictureUpload())
  let outcome!: Awaited<ReturnType<typeof result.current.uploadProfilePicture>>
  await act(async () => {
    outcome = await result.current.uploadProfilePicture(DATA_URL, { userId: "u1" })
  })
  return outcome
}

describe("useProfilePictureUpload", () => {
  it("PUTs the JPEG to the presigned URL and returns the public URL to save", async () => {
    mockAuthApi.getProfilePictureUploadUrl.mockResolvedValue({ presignedUrl: SIGNED_PUT, publicUrl: PUBLIC_URL, key: "users/u1/a.jpg" })

    await expect(upload()).resolves.toEqual({ success: true, url: PUBLIC_URL })
    expect(mockAuthApi.getProfilePictureUploadUrl).toHaveBeenCalledWith({ contentType: "image/jpeg", fileName: "profile-u1.jpg" })
    expect(putCalls()).toHaveLength(1)
    expect(putCalls()[0][0]).toBe(SIGNED_PUT)
    expect(putCalls()[0][1]?.headers).toEqual({ "Content-Type": "image/jpeg" })
  })

  it("reports a rejected upload instead of success", async () => {
    mockAuthApi.getProfilePictureUploadUrl.mockResolvedValue({ presignedUrl: SIGNED_PUT, publicUrl: PUBLIC_URL })
    fetchMock.mockImplementation(async (input) =>
      String(input).startsWith("data:")
        ? new Response(new Blob(["jpeg"], { type: "image/jpeg" }))
        : new Response(null, { status: 403 }),
    )

    await expect(upload()).resolves.toEqual({ success: false, error: "Upload failed (403)" })
  })

  it("never returns the signed upload URL as the picture to save", async () => {
    // A signed PUT URL expires and is not viewable; saving it would break the avatar.
    mockAuthApi.getProfilePictureUploadUrl.mockResolvedValue({ presignedUrl: SIGNED_PUT })

    const outcome = await upload()

    expect(outcome.success).toBe(false)
    expect(outcome.url).toBeUndefined()
    expect(putCalls()).toHaveLength(0)
  })
})
