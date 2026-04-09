import { describe, it, expect } from "vitest";
import { parseApiErrorBody } from "./http";

/**
 * Mirrors OndoREBackend errorHandler JSON — dashboard client must tolerate
 * partial payloads and non-JSON error bodies (handled upstream as null).
 */
describe("parseApiErrorBody", () => {
  it("maps full backend error object", () => {
    const parsed = parseApiErrorBody(
      {
        message: "Invalid email",
        code: "VALIDATION_ERROR",
        statusCode: 400,
        errors: [{ field: "email", message: "Invalid email" }],
        correlationId: "abc-123",
      },
      400
    );
    expect(parsed).toEqual({
      message: "Invalid email",
      code: "VALIDATION_ERROR",
      statusCode: 400,
      errors: [{ field: "email", message: "Invalid email" }],
      correlationId: "abc-123",
    });
  });

  it("uses HTTP status when body omits fields (e.g. proxy HTML)", () => {
    const parsed = parseApiErrorBody(null, 502);
    expect(parsed.message).toBe("HTTP 502");
    expect(parsed.code).toBe("HTTP_502");
    expect(parsed.statusCode).toBe(502);
  });

  it("treats JSON array bodies as non-object (e.g. misconfigured proxy)", () => {
    const parsed = parseApiErrorBody(["unexpected"], 500);
    expect(parsed.message).toBe("HTTP 500");
    expect(parsed.code).toBe("HTTP_500");
  });

  it("defaults message when object has empty message", () => {
    const parsed = parseApiErrorBody({ message: "" }, 404);
    expect(parsed.message).toBe("Unknown error");
    expect(parsed.statusCode).toBe(404);
  });

  it("drops invalid errors array entries via schema", () => {
    const parsed = parseApiErrorBody(
      { message: "x", errors: [{ notField: true }] },
      422
    );
    expect(parsed.errors).toBeUndefined();
  });

  it("preserves 401/403/409 for caller branching", () => {
    expect(parseApiErrorBody({ message: "Unauthorized" }, 401).statusCode).toBe(401);
    expect(parseApiErrorBody({ message: "Forbidden" }, 403).statusCode).toBe(403);
    expect(parseApiErrorBody({ message: "Conflict" }, 409).statusCode).toBe(409);
  });
});
