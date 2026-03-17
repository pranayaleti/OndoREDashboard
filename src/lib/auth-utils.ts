/**
 * Centralized Authorization Utility
 *
 * This module provides a single source of truth for role definitions,
 * permissions, and authorization checks across the application.
 */

export type { UserRole } from "@ondo/types"
import type { UserRole } from "@ondo/types"
import { ROLE_REDIRECT_PATHS } from "@ondo/types"

// Legacy role mapping for backward compatibility
export const LEGACY_ROLE_MAP: Record<string, UserRole> = {
  admin: "admin", // Map legacy "admin" to "admin" role
  manager: "manager",
  owner: "owner",
  tenant: "tenant",
  maintenance: "maintenance",
}

/**
 * Role hierarchy for permission checks
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 6, // Highest authority
  admin: 5, // Same access as super_admin but cannot manage super_admins or admins
  manager: 4,
  owner: 3,
  tenant: 2,
  maintenance: 1,
}

const KNOWN_ROLES = new Set<string>(Object.keys(ROLE_HIERARCHY))

/**
 * Normalize role from API (handles legacy role mappings).
 * Falls back to "tenant" for unknown roles to prevent privilege escalation.
 */
export function normalizeRole(role: string): UserRole {
  const normalized = role.toLowerCase()
  if (LEGACY_ROLE_MAP[normalized]) return LEGACY_ROLE_MAP[normalized]
  if (KNOWN_ROLES.has(normalized)) return normalized as UserRole
  return "tenant"
}

/**
 * Check if a role has permission to access another role's resources
 */
export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  // Super admin can manage everyone (including admins)
  if (actorRole === "super_admin") {
    return true
  }
  
  // Admin can manage managers, owners, tenants, and maintenance (but not super_admin or admin)
  if (actorRole === "admin") {
    return ["manager", "owner", "tenant", "maintenance"].includes(targetRole)
  }
  
  // Manager can manage owners, tenants, and maintenance (but not super_admin, admin, or managers)
  if (actorRole === "manager") {
    return ["owner", "tenant", "maintenance"].includes(targetRole)
  }
  
  // Owners, tenants, and maintenance cannot manage other roles
  return false
}

/**
 * Get dashboard path for a role
 */
export function getDashboardPath(role: UserRole): string {
  return ROLE_REDIRECT_PATHS[role]
}

/**
 * Check if a role can access a route
 */
export function canAccessRoute(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

/**
 * Route permissions configuration
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Super Admin routes
  "/super-admin": ["super_admin"],
  "/super-admin/*": ["super_admin"],
  
  // Admin routes (same portal as super_admin)
  "/admin": ["admin"],
  "/admin/*": ["admin"],
  
  // Manager routes
  "/dashboard": ["manager"],
  "/dashboard/*": ["manager"],
  
  // Owner routes
  "/owner": ["owner"],
  "/owner/*": ["owner"],
  
  // Tenant routes
  "/tenant": ["tenant"],
  "/tenant/*": ["tenant"],
  
  // Maintenance routes
  "/maintenance": ["maintenance"],
  "/maintenance/*": ["maintenance"],
  
  // Shared routes (require authentication but any role)
  "/properties": ["super_admin", "admin", "manager", "owner", "tenant", "maintenance"],
  "/properties/*": ["super_admin", "admin", "manager", "owner", "tenant", "maintenance"],
  "/search": ["super_admin", "admin", "manager", "owner", "tenant", "maintenance"],
  "/search/*": ["super_admin", "admin", "manager", "owner", "tenant", "maintenance"],
}

/**
 * Check if user can access a specific route
 */
export function canAccessPath(userRole: UserRole, path: string): boolean {
  // Check exact match first
  if (ROUTE_PERMISSIONS[path]) {
    return canAccessRoute(userRole, ROUTE_PERMISSIONS[path])
  }
  
  // Check pattern matches
  for (const [pattern, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pattern.endsWith("/*")) {
      const basePath = pattern.slice(0, -2)
      if (path.startsWith(basePath)) {
        return canAccessRoute(userRole, allowedRoles)
      }
    }
  }
  
  // Default: deny access
  return false
}

/**
 * Get redirect path when unauthorized access is attempted
 */
export function getUnauthorizedRedirectPath(userRole: UserRole): string {
  return getDashboardPath(userRole)
}

/**
 * Feature permissions - what each role can do
 */
export const FEATURE_PERMISSIONS: Record<UserRole, {
  canManageManagers: boolean
  canManageOwners: boolean
  canManageTenants: boolean
  canManageMaintenance: boolean
  canManageSuperAdmins: boolean
  canManageAdmins: boolean // Super admin exclusive: can manage admins
  canViewAllProperties: boolean
  canViewAllFinances: boolean
  canViewAllReports: boolean
  canAssignMaintenance: boolean
  canViewAssignedTickets: boolean
}> = {
  super_admin: {
    canManageManagers: true,
    canManageOwners: true,
    canManageTenants: true,
    canManageMaintenance: true,
    canManageSuperAdmins: true,
    canManageAdmins: true, // EXCLUSIVE: Only super_admin can manage admins
    canViewAllProperties: true,
    canViewAllFinances: true,
    canViewAllReports: true,
    canAssignMaintenance: true,
    canViewAssignedTickets: true,
  },
  admin: {
    canManageManagers: true,
    canManageOwners: true,
    canManageTenants: true,
    canManageMaintenance: true,
    canManageSuperAdmins: false, // Cannot manage super_admins
    canManageAdmins: false, // Cannot manage other admins
    canViewAllProperties: true,
    canViewAllFinances: true,
    canViewAllReports: true,
    canAssignMaintenance: true,
    canViewAssignedTickets: true,
  },
  manager: {
    canManageManagers: false,
    canManageOwners: true,
    canManageTenants: true,
    canManageMaintenance: true,
    canManageSuperAdmins: false,
    canManageAdmins: false,
    canViewAllProperties: true,
    canViewAllFinances: true,
    canViewAllReports: true,
    canAssignMaintenance: true,
    canViewAssignedTickets: true,
  },
  owner: {
    canManageManagers: false,
    canManageOwners: false,
    canManageTenants: false,
    canManageMaintenance: false,
    canManageSuperAdmins: false,
    canManageAdmins: false,
    canViewAllProperties: false, // Only their own
    canViewAllFinances: false, // Only their own
    canViewAllReports: false, // Only their own
    canAssignMaintenance: false,
    canViewAssignedTickets: false, // Only for their properties
  },
  tenant: {
    canManageManagers: false,
    canManageOwners: false,
    canManageTenants: false,
    canManageMaintenance: false,
    canManageSuperAdmins: false,
    canManageAdmins: false,
    canViewAllProperties: false,
    canViewAllFinances: false,
    canViewAllReports: false,
    canAssignMaintenance: false,
    canViewAssignedTickets: false, // Only their own tickets
  },
  maintenance: {
    canManageManagers: false,
    canManageOwners: false,
    canManageTenants: false,
    canManageMaintenance: false,
    canManageSuperAdmins: false,
    canManageAdmins: false,
    canViewAllProperties: false, // Only properties with assigned tickets
    canViewAllFinances: false,
    canViewAllReports: false,
    canAssignMaintenance: false,
    canViewAssignedTickets: true, // Only assigned tickets
  },
}

/**
 * Check if user has a specific feature permission
 */
export function hasPermission(userRole: UserRole, permission: keyof typeof FEATURE_PERMISSIONS.super_admin): boolean {
  return FEATURE_PERMISSIONS[userRole]?.[permission] ?? false
}

/**
 * Extract a user-friendly error message from unknown error types.
 * Use in catch blocks instead of `error: any` for type safety.
 */
export function getErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const msg = (error as { message: unknown }).message;
    return typeof msg === "string" ? msg : fallback;
  }
  return typeof error === "string" ? error : fallback;
}

