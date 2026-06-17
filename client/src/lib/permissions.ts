// Client-side permission helpers — backed by the shared single-source-of-truth
// matrix in @shared/permissions. Prefer the usePermissions() hook (usePermissions.ts)
// for component gating; these standalone helpers remain for places that only have a
// role string on hand.

import { hasPermission, PERMISSIONS, isAdminRole, type Permission } from "@shared/permissions";

export { PERMISSIONS, isAdminRole, type Permission };

/** Generic check from a bare role string (no founder bypass context). */
export function roleCan(role: string | undefined, permission: Permission | string): boolean {
  return hasPermission(role, permission, false);
}

// ── Backwards-compatible named helpers (used across existing components) ──────
export function canAccessClipping(role?: string): boolean {
  return hasPermission(role, PERMISSIONS.VIEW_CLIPPING);
}

export function canValidateClips(role?: string): boolean {
  return hasPermission(role, PERMISSIONS.VALIDATE_CLIPS);
}

export function canAccessSettings(role?: string): boolean {
  // "settings" historically meant any staff worker role (not base member)
  return hasPermission(role, "access_settings");
}

export function canAccessAdmin(role?: string): boolean {
  return isAdminRole(role) || hasPermission(role, PERMISSIONS.MANAGE_MEMBERS);
}

export function canCreateProjects(role?: string): boolean {
  return hasPermission(role, "create_projects");
}

export function canDeleteProjects(role?: string): boolean {
  return hasPermission(role, "delete_projects");
}

export function canCreateTemplates(role?: string): boolean {
  return hasPermission(role, PERMISSIONS.MANAGE_TEMPLATES) || hasPermission(role, "create_templates");
}

export function canEditClients(role?: string): boolean {
  return hasPermission(role, PERMISSIONS.MANAGE_CLIENTS);
}
