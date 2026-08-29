import { describe, it, expect } from "vitest";
import { cn, isUuidPathSegment, pathHasResourceId } from "./utils";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("handles conditional falsy values", () => {
    expect(cn("base", false && "hidden", undefined, null, "end")).toBe("base end");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("path resource ids", () => {
  it("detects UUID path segments", () => {
    expect(isUuidPathSegment("027bed7a-8aee-4c3d-9f1a-1234567890ab")).toBe(true);
    expect(isUuidPathSegment("properties")).toBe(false);
  });

  it("hides auto-crumbs on property detail routes", () => {
    expect(pathHasResourceId("/dashboard/properties/027bed7a-8aee-4c3d-9f1a-1234567890ab")).toBe(true);
    expect(pathHasResourceId("/dashboard/properties")).toBe(false);
  });
});
