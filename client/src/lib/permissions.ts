// Permission utility functions for frontend

export function canAccessClipping(role?: string): boolean {
  if (!role) return false;
  const allowedRoles = ["admin", "manager", "editor", "clipper", "employee"];
  return allowedRoles.includes(role.toLowerCase());
}

export function canValidateClips(role?: string): boolean {
  if (!role) return false;
  const allowedRoles = ["admin", "manager"];
  return allowedRoles.includes(role.toLowerCase());
}

export function canAccessSettings(role?: string): boolean {
  if (!role) return false;
  const allowedRoles = ["admin", "manager", "editor", "clipper"];
  return allowedRoles.includes(role.toLowerCase());
}

export function canAccessAdmin(role?: string): boolean {
  if (!role) return false;
  const allowedRoles = ["admin", "manager"];
  return allowedRoles.includes(role.toLowerCase());
}

export function canCreateProjects(role?: string): boolean {
  if (!role) return false;
  const allowedRoles = ["admin", "manager", "editor", "clipper"];
  return allowedRoles.includes(role.toLowerCase());
}

export function canDeleteProjects(role?: string): boolean {
  if (!role) return false;
  const allowedRoles = ["admin", "manager"];
  return allowedRoles.includes(role.toLowerCase());
}

export function canCreateTemplates(role?: string): boolean {
  if (!role) return false;
  const allowedRoles = ["admin", "manager", "editor"];
  return allowedRoles.includes(role.toLowerCase());
}

export function canEditClients(role?: string): boolean {
  if (!role) return false;
  const allowedRoles = ["admin", "manager"];
  return allowedRoles.includes(role.toLowerCase());
}




