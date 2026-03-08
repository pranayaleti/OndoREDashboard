import { describe, it, expect, beforeEach } from "vitest";
import {
  saveUserInfo,
  getUserZipCode,
  getUserData,
  hasCompletedForm,
  clearUserSession,
  hasActiveSession,
} from "./session-utils";

describe("session-utils", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("saveUserInfo", () => {
    it("saves zip code and sets formCompleted", () => {
      saveUserInfo("90210");
      expect(sessionStorage.getItem("userZipCode")).toBe("90210");
      expect(sessionStorage.getItem("formCompleted")).toBe("true");
    });

    it("saves userData when provided", () => {
      saveUserInfo("90210", { name: "Test" });
      expect(sessionStorage.getItem("userData")).toBe('{"name":"Test"}');
    });
  });

  describe("getUserZipCode", () => {
    it("returns saved zip code", () => {
      sessionStorage.setItem("userZipCode", "10001");
      expect(getUserZipCode()).toBe("10001");
    });

    it("returns null when not set", () => {
      expect(getUserZipCode()).toBeNull();
    });
  });

  describe("getUserData", () => {
    it("returns parsed user data", () => {
      sessionStorage.setItem("userData", '{"role":"owner"}');
      expect(getUserData()).toEqual({ role: "owner" });
    });

    it("returns null when not set", () => {
      expect(getUserData()).toBeNull();
    });

    it("returns null and clears invalid JSON", () => {
      sessionStorage.setItem("userData", "not json");
      expect(getUserData()).toBeNull();
      expect(sessionStorage.getItem("userData")).toBeNull();
    });
  });

  describe("hasCompletedForm", () => {
    it("returns true when formCompleted is true", () => {
      sessionStorage.setItem("formCompleted", "true");
      expect(hasCompletedForm()).toBe(true);
    });

    it("returns false when not set", () => {
      expect(hasCompletedForm()).toBe(false);
    });
  });

  describe("clearUserSession", () => {
    it("removes all session keys", () => {
      sessionStorage.setItem("userZipCode", "1");
      sessionStorage.setItem("userData", "{}");
      sessionStorage.setItem("formCompleted", "true");
      clearUserSession();
      expect(sessionStorage.getItem("userZipCode")).toBeNull();
      expect(sessionStorage.getItem("userData")).toBeNull();
      expect(sessionStorage.getItem("formCompleted")).toBeNull();
    });
  });

  describe("hasActiveSession", () => {
    it("returns true when formCompleted is set", () => {
      sessionStorage.setItem("formCompleted", "true");
      expect(hasActiveSession()).toBe(true);
    });

    it("returns false when formCompleted not set", () => {
      expect(hasActiveSession()).toBe(false);
    });
  });
});
