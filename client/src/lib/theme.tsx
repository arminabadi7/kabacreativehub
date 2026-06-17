import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("kaba-theme") as Theme | null;
    if (stored === "dark" || stored === "light") return stored;
    // Default to light; dark applies only after the user opts in via the toggle
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("kaba-theme", theme);
  }, [theme]);

  const toggle = () => {
    // Enable a uniform color transition only for the duration of the switch,
    // so the whole UI fades between themes together (no staggered recolor).
    const root = document.documentElement;
    root.classList.add("theme-transition");
    setTheme((t) => (t === "dark" ? "light" : "dark"));
    window.setTimeout(() => root.classList.remove("theme-transition"), 400);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
