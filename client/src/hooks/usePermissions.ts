import { useQuery } from "@tanstack/react-query";
import { PERMISSIONS, isAdminRole, type Permission } from "@shared/permissions";

export interface CurrentUser {
  id: string;
  username: string;
  fullName: string | null;
  email: string | null;
  role: string;
  isFounder: boolean;
  permissions: string[];
}

/**
 * Central hook for the merged dashboard. Resolves the logged-in staff user
 * (member account or founder backup login) and exposes a `can()` checker.
 *
 * Usage:
 *   const { user, can, isAdmin, isLoading } = usePermissions();
 *   if (can(PERMISSIONS.MANAGE_FINANCES)) { ... }
 */
export function usePermissions() {
  const { data: user, isLoading, error } = useQuery<CurrentUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 60_000,
  });

  const isFounder = !!user?.isFounder;
  const isAdmin = isFounder || isAdminRole(user?.role);

  const can = (permission: Permission | string): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return (user.permissions || []).includes(permission as string);
  };

  /** True if the user has at least one of the given permissions. */
  const canAny = (...perms: (Permission | string)[]): boolean => perms.some((p) => can(p));

  return {
    user: user ?? null,
    role: user?.role ?? null,
    isFounder,
    isAdmin,
    can,
    canAny,
    isLoading,
    error,
    PERMISSIONS,
  };
}
