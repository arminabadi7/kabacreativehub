import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePermissions } from "@/hooks/usePermissions";
import MembersDashboard from "./MembersDashboard";

/**
 * Unified staff dashboard — single merged shell for every role.
 *
 * Resolves the logged-in staff user via /api/auth/me. Everyone (founder, admin,
 * manager, editor, clipper, member) gets the same MembersDashboard shell; its
 * sidebar is permission-gated, so each role only sees the sections they can use.
 * Founder/admin-only sections (Finances, Affiliates, User Management, Bookings,
 * Tutorials, rich Client/Member management) fold in via embedded views.
 */
export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = usePermissions();

  // Not authenticated → send to the unified login
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [isLoading, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading dashboard…</div>
      </div>
    );
  }

  if (!user) return null;

  return <MembersDashboard />;
}
