import { describe, it, expect } from "vitest";
import { ApiError } from "./api";

describe("api", () => {
  describe("ApiError", () => {
    it("has name ApiError and status", () => {
      const err = new ApiError("Bad request", 400);
      expect(err.name).toBe("ApiError");
      expect(err.message).toBe("Bad request");
      expect(err.status).toBe(400);
    });

    it("is instanceof Error", () => {
      const err = new ApiError("Oops", 500);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(ApiError);
    });
  });
});
