import { describe, it, expect } from "vitest";
import {
  normalizeRole,
  getDashboardPath,
  canManageRole,
  canAccessRoute,
  canAccessPath,
  hasPermission,
  getErrorMessage,
  getUnauthorizedRedirectPath,
} from "./auth-utils";

describe("auth-utils", () => {
  describe("normalizeRole", () => {
    it("returns tenant for unknown role to prevent privilege escalation", () => {
      expect(normalizeRole("unknown")).toBe("tenant");
      expect(normalizeRole("superuser")).toBe("tenant");
    });

    it("normalizes known roles", () => {
      expect(normalizeRole("manager")).toBe("manager");
      expect(normalizeRole("MANAGER")).toBe("manager");
      expect(normalizeRole("owner")).toBe("owner");
      expect(normalizeRole("tenant")).toBe("tenant");
      expect(normalizeRole("super_admin")).toBe("super_admin");
      expect(normalizeRole("admin")).toBe("admin");
    });

    it("maps legacy admin to admin", () => {
      expect(normalizeRole("admin")).toBe("admin");
    });
  });

  describe("getDashboardPath", () => {
    it("returns role-specific paths", () => {
      expect(getDashboardPath("manager")).toBe("/dashboard");
      expect(getDashboardPath("owner")).toBe("/owner");
      expect(getDashboardPath("tenant")).toBe("/tenant");
      expect(getDashboardPath("super_admin")).toBe("/super-admin");
      expect(getDashboardPath("admin")).toBe("/admin");
      expect(getDashboardPath("maintenance")).toBe("/maintenance");
    });
  });

  describe("canManageRole", () => {
    it("super_admin can manage everyone", () => {
      expect(canManageRole("super_admin", "admin")).toBe(true);
      expect(canManageRole("super_admin", "manager")).toBe(true);
      expect(canManageRole("super_admin", "tenant")).toBe(true);
    });

    it("admin can manage manager, owner, tenant, maintenance but not super_admin or admin", () => {
      expect(canManageRole("admin", "manager")).toBe(true);
      expect(canManageRole("admin", "owner")).toBe(true);
      expect(canManageRole("admin", "tenant")).toBe(true);
      expect(canManageRole("admin", "super_admin")).toBe(false);
      expect(canManageRole("admin", "admin")).toBe(false);
    });

    it("manager can manage owner, tenant, maintenance only", () => {
      expect(canManageRole("manager", "owner")).toBe(true);
      expect(canManageRole("manager", "tenant")).toBe(true);
      expect(canManageRole("manager", "manager")).toBe(false);
      expect(canManageRole("manager", "admin")).toBe(false);
    });

    it("owner and tenant cannot manage any role", () => {
      expect(canManageRole("owner", "tenant")).toBe(false);
      expect(canManageRole("tenant", "owner")).toBe(false);
    });
  });

  describe("canAccessRoute", () => {
    it("returns true when role is in allowed list", () => {
      expect(canAccessRoute("manager", ["manager", "admin"])).toBe(true);
      expect(canAccessRoute("tenant", ["tenant"])).toBe(true);
    });

    it("returns false when role not in list", () => {
      expect(canAccessRoute("tenant", ["manager", "owner"])).toBe(false);
    });
  });

  describe("canAccessPath", () => {
    it("allows exact path match", () => {
      expect(canAccessPath("manager", "/dashboard")).toBe(true);
      expect(canAccessPath("tenant", "/dashboard")).toBe(false);
    });

    it("allows pattern match with /*", () => {
      expect(canAccessPath("manager", "/dashboard/properties")).toBe(true);
      expect(canAccessPath("owner", "/owner/settings")).toBe(true);
    });

    it("denies unknown path", () => {
      expect(canAccessPath("manager", "/unknown")).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("super_admin has canManageAdmins", () => {
      expect(hasPermission("super_admin", "canManageAdmins")).toBe(true);
    });

    it("admin does not have canManageAdmins", () => {
      expect(hasPermission("admin", "canManageAdmins")).toBe(false);
    });

    it("owner cannot view all properties", () => {
      expect(hasPermission("owner", "canViewAllProperties")).toBe(false);
    });
  });

  describe("getUnauthorizedRedirectPath", () => {
    it("returns dashboard path for role", () => {
      expect(getUnauthorizedRedirectPath("manager")).toBe("/dashboard");
      expect(getUnauthorizedRedirectPath("owner")).toBe("/owner");
      expect(getUnauthorizedRedirectPath("tenant")).toBe("/tenant");
    });
  });

  describe("getErrorMessage", () => {
    it("returns message for Error", () => {
      expect(getErrorMessage(new Error("foo"))).toBe("foo");
    });

    it("returns message for object with message property", () => {
      expect(getErrorMessage({ message: "obj message" })).toBe("obj message");
      expect(getErrorMessage({ message: 123 })).toBe("An error occurred");
    });

    it("returns fallback for non-Error", () => {
      expect(getErrorMessage("string")).toBe("string");
      expect(getErrorMessage(null)).toBe("An error occurred");
      expect(getErrorMessage(42)).toBe("An error occurred");
    });

    it("uses custom fallback", () => {
      expect(getErrorMessage(null, "Custom")).toBe("Custom");
    });
  });
});
