// ────────────────────────────────────────────────────────────────────────────
// Authoritative permission system — single source of truth for server + client.
//
// Roles:  founder, admin  → full access ("*", bypass)
//         manager         → runs operations, no money/affiliates/user-mgmt
//         editor          → does the work, own issues only
//         clipper         → narrower editor (no template use, no clients view)
//         member          → base level, mostly read-only
// ────────────────────────────────────────────────────────────────────────────

export type Role = "founder" | "admin" | "manager" | "editor" | "clipper" | "member";

export const ALL_ROLES: Role[] = ["founder", "admin", "manager", "editor", "clipper", "member"];

/** Roles that are assignable in the member-management UI (founder is system-only). */
export const ASSIGNABLE_ROLES: Role[] = ["admin", "manager", "editor", "clipper", "member"];

/** Roles that bypass the permission table entirely (full control). */
export function isAdminRole(role?: string | null): boolean {
  const r = (role || "").toLowerCase();
  return r === "founder" || r === "admin";
}

// ── Permission keys ──────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // Boards / issues
  VIEW_BOARDS: "view_boards",
  CREATE_ISSUES: "create_issues",
  EDIT_ANY_ISSUE: "edit_any_issue",
  DELETE_ISSUES: "delete_issues",
  EDIT_OWN_ISSUE: "edit_own_issue",
  TOGGLE_ASSIGNED_TASK: "toggle_assigned_task",

  // Clipping
  VIEW_CLIPPING: "view_clipping",
  ADD_CLIPS: "add_clips",
  VALIDATE_CLIPS: "validate_clips",

  // Templates
  MANAGE_TEMPLATES: "manage_templates",
  USE_TEMPLATES: "use_templates",

  // Clients
  VIEW_CLIENTS: "view_clients",
  MANAGE_CLIENTS: "manage_clients",

  // Members
  VIEW_MEMBERS: "view_members",
  MANAGE_MEMBERS: "manage_members",

  // Teams
  VIEW_TEAMS: "view_teams",
  MANAGE_TEAMS: "manage_teams",

  // Finance (founder/admin only)
  VIEW_FINANCES: "view_finances",
  MANAGE_FINANCES: "manage_finances",
  PAY_MEMBERS: "pay_members",
  PAY_AFFILIATES: "pay_affiliates",

  // Affiliates (founder/admin only)
  VIEW_AFFILIATES: "view_affiliates",
  MANAGE_AFFILIATES: "manage_affiliates",

  // User management (founder/admin only)
  MANAGE_USERS: "manage_users",

  // Bookings (founder/admin only)
  VIEW_BOOKINGS: "view_bookings",
  MANAGE_BOOKINGS: "manage_bookings",

  // Tutorials
  VIEW_TUTORIALS: "view_tutorials",
  MANAGE_TUTORIALS: "manage_tutorials",

  // Workspace operations
  MANAGE_SCHEDULING: "manage_scheduling",
  MANAGE_WORKSPACE: "manage_workspace",
  MANAGE_POINTS: "manage_points",

  // Self
  VIEW_OWN_POINTS: "view_own_points",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const P = PERMISSIONS;

// ── Legacy permission keys (transitional) ────────────────────────────────────
// Older routes still guard on these strings. They are kept with their ORIGINAL
// role assignments so nothing breaks while routes are migrated to the new keys.
// TODO(merge-dashboard): retire these once all routes use PERMISSIONS.* keys.
export const LEGACY = {
  ACCESS_SETTINGS: "access_settings",
  VIEW_ADMIN: "view_admin",
  CREATE_PROJECTS: "create_projects",
  EDIT_PROJECTS: "edit_projects",
  DELETE_PROJECTS: "delete_projects",
  CREATE_TEMPLATES: "create_templates",
  EDIT_TEMPLATES: "edit_templates",
  DELETE_TEMPLATES: "delete_templates",
  EDIT_CLIENTS: "edit_clients",
  EDIT_CLIPPING: "edit_clipping",
} as const;

// ── Role → permission matrix ─────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  founder: ["*"],
  admin: ["*"],

  manager: [
    P.VIEW_BOARDS, P.CREATE_ISSUES, P.EDIT_ANY_ISSUE, P.DELETE_ISSUES,
    P.EDIT_OWN_ISSUE, P.TOGGLE_ASSIGNED_TASK,
    P.VIEW_CLIPPING, P.ADD_CLIPS, P.VALIDATE_CLIPS,
    P.MANAGE_TEMPLATES, P.USE_TEMPLATES,
    P.VIEW_CLIENTS, P.MANAGE_CLIENTS,
    P.VIEW_MEMBERS, P.MANAGE_MEMBERS,
    P.VIEW_TEAMS, P.MANAGE_TEAMS,
    P.VIEW_TUTORIALS, P.MANAGE_TUTORIALS,
    P.MANAGE_SCHEDULING, P.MANAGE_WORKSPACE, P.MANAGE_POINTS,
    P.VIEW_OWN_POINTS,
    // NO finance, NO affiliates, NO user-management, NO bookings
    // legacy
    LEGACY.ACCESS_SETTINGS, LEGACY.VIEW_ADMIN,
    LEGACY.CREATE_PROJECTS, LEGACY.EDIT_PROJECTS, LEGACY.DELETE_PROJECTS,
    LEGACY.CREATE_TEMPLATES, LEGACY.EDIT_TEMPLATES, LEGACY.DELETE_TEMPLATES,
    LEGACY.EDIT_CLIENTS,
  ],

  editor: [
    P.VIEW_BOARDS, P.CREATE_ISSUES, P.EDIT_OWN_ISSUE, P.TOGGLE_ASSIGNED_TASK,
    P.VIEW_CLIPPING, P.ADD_CLIPS,
    P.USE_TEMPLATES,
    P.VIEW_CLIENTS,
    P.VIEW_MEMBERS,
    P.VIEW_TEAMS,
    P.VIEW_TUTORIALS,
    P.VIEW_OWN_POINTS,
    // NO project create/edit, NO team/template management, NO team assignment
  ],

  clipper: [
    P.VIEW_BOARDS, P.CREATE_ISSUES, P.EDIT_OWN_ISSUE, P.TOGGLE_ASSIGNED_TASK,
    P.VIEW_CLIPPING, P.ADD_CLIPS,
    // no template use, no clients view
    P.VIEW_MEMBERS,
    P.VIEW_TEAMS,
    P.VIEW_TUTORIALS,
    P.VIEW_OWN_POINTS,
    // NO project create/edit, NO team management, NO team assignment
  ],

  member: [
    P.VIEW_BOARDS,
    P.TOGGLE_ASSIGNED_TASK,
    P.VIEW_CLIPPING,
    P.VIEW_MEMBERS,
    P.VIEW_TEAMS,
    P.VIEW_TUTORIALS,
    P.VIEW_OWN_POINTS,
  ],
};

// ── Core check ───────────────────────────────────────────────────────────────
/**
 * Returns true if the given role (or founder bypass) has the permission.
 * @param role       the member's role string
 * @param permission the permission key to check
 * @param isFounder  founder session bypass flag (env-password backup login)
 */
export function hasPermission(
  role: string | null | undefined,
  permission: Permission | string,
  isFounder = false,
): boolean {
  if (isFounder) return true;
  if (isAdminRole(role)) return true;
  const key = (role || "").toLowerCase() as Role;
  const perms = ROLE_PERMISSIONS[key];
  if (!perms) return false;
  return perms.includes("*") || perms.includes(permission as string);
}

/** Expand a role into its full concrete permission list (for sending to the client). */
export function permissionsForRole(role: string | null | undefined, isFounder = false): string[] {
  if (isFounder || isAdminRole(role)) {
    // Full access: every concrete (non-legacy) permission key
    return Object.values(PERMISSIONS) as string[];
  }
  const key = (role || "").toLowerCase() as Role;
  const perms = ROLE_PERMISSIONS[key];
  if (!perms) return [];
  if (perms.includes("*")) return Object.values(PERMISSIONS) as string[];
  return perms;
}
