import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useApi } from "./useApi";

describe("useApi", () => {
  it("starts with data null, loading false, error null", () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const { result } = renderHook(() => useApi(fn));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets loading true then data on success", async () => {
    const fn = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useApi(fn));

    let promise: Promise<unknown>;
    act(() => {
      promise = result.current.execute();
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await promise!;
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ id: 1 });
    expect(result.current.error).toBeNull();
  });

  it("sets error on ApiError and returns null from execute", async () => {
    const { ApiError } = await import("@/lib/api");
    const fn = vi.fn().mockRejectedValue(new ApiError("Session expired", 401));
    const { result } = renderHook(() => useApi(fn));

    let executeResult: unknown;
    await act(async () => {
      executeResult = await result.current.execute();
    });
    expect(executeResult).toBeNull();
    expect(result.current.error).toBe("Session expired. Please log in again.");
    expect(result.current.data).toBeNull();
  });

  it("reset clears data, error, and loading", async () => {
    const fn = vi.fn().mockResolvedValue("done");
    const { result } = renderHook(() => useApi(fn));
    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.data).toBe("done");
    act(() => {
      result.current.reset();
    });
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("maps 403 to permission message", async () => {
    const { ApiError } = await import("@/lib/api");
    const fn = vi.fn().mockRejectedValue(new ApiError("Forbidden", 403));
    const { result } = renderHook(() => useApi(fn));
    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.error).toBe("You don't have permission to perform this action.");
  });

  it("maps 404 to not found message", async () => {
    const { ApiError } = await import("@/lib/api");
    const fn = vi.fn().mockRejectedValue(new ApiError("Not found", 404));
    const { result } = renderHook(() => useApi(fn));
    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.error).toBe("The requested resource was not found.");
  });

  it("maps 422 to validation message", async () => {
    const { ApiError } = await import("@/lib/api");
    const fn = vi.fn().mockRejectedValue(new ApiError("Invalid input", 422));
    const { result } = renderHook(() => useApi(fn));
    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.error).toBe("Invalid input");
  });

  it("maps 429 to rate limit message", async () => {
    const { ApiError } = await import("@/lib/api");
    const fn = vi.fn().mockRejectedValue(new ApiError("Too many requests", 429));
    const { result } = renderHook(() => useApi(fn));
    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.error).toBe("Too many requests. Please try again later.");
  });

  it("maps 503 to service unavailable message", async () => {
    const { ApiError } = await import("@/lib/api");
    const fn = vi.fn().mockRejectedValue(new ApiError("Unavailable", 503));
    const { result } = renderHook(() => useApi(fn));
    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.error).toBe("Service temporarily unavailable. Please try again later.");
  });

  it("maps status 0 to error message", async () => {
    const { ApiError } = await import("@/lib/api");
    const fn = vi.fn().mockRejectedValue(new ApiError("Network failed", 0));
    const { result } = renderHook(() => useApi(fn));
    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.error).toBe("Network failed");
  });

  it("uses generic message for non-ApiError", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Something broke"));
    const { result } = renderHook(() => useApi(fn));
    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.error).toBe("An unexpected error occurred");
  });
});
