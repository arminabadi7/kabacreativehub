import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface ThemeToggleProps {
  /** "icon" = icon-only button (default), "full" = icon + label */
  variant?: "icon" | "full";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  if (variant === "full") {
    return (
      <button
        onClick={toggle}
        className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors
          text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`p-2 rounded-lg transition-colors
        text-gray-500 dark:text-gray-400
        hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark
        ? <Sun className="w-4 h-4 text-yellow-400" />
        : <Moon className="w-4 h-4" />}
    </button>
  );
}
