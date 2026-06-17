import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, CreditCard, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface UserMenuProps {
  name: string;
  email: string;
  roleLabel?: string;
  avatarUrl?: string | null;
  collapsed?: boolean;
  onProfileBilling?: () => void;
  onSignOut?: () => void;
}

export function UserMenu({ name, email, roleLabel, avatarUrl, collapsed = false, onProfileBilling, onSignOut }: UserMenuProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const [open, setOpen] = useState(false);
  const initial = (name?.[0] || "?").toUpperCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center w-full gap-3 rounded-lg p-1.5 -m-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left overflow-hidden [.nav-collapsed_&]:gap-0 [.nav-collapsed_&]:justify-center"
          title={collapsed ? name : undefined}
        >
          <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-white">{initial}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden whitespace-nowrap transition-[width,opacity] duration-200 ease-linear [.nav-collapsed_&]:w-0 [.nav-collapsed_&]:opacity-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</div>
            {roleLabel && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{roleLabel}</div>}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 transition-[width,opacity] duration-200 ease-linear [.nav-collapsed_&]:w-0 [.nav-collapsed_&]:opacity-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-64 p-1.5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      >
        {/* Header */}
        <div className="px-2.5 py-2">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

        {/* Profile & Billing */}
        <button
          onClick={() => { setOpen(false); onProfileBilling?.(); }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          Profile &amp; Billing
        </button>

        {/* Dark / Light mode */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
          {isDark ? "Light mode" : "Dark mode"}
        </button>

        <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />

        {/* Sign out */}
        <button
          onClick={() => { setOpen(false); onSignOut?.(); }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </PopoverContent>
    </Popover>
  );
}
