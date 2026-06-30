import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("cryptoneko_theme") || "midnight";
    } catch (e) {
      return "midnight";
    }
  });

  const [accent, setAccent] = useState(() => {
    try {
      return localStorage.getItem("cryptoneko_accent") || "purple";
    } catch (e) {
      return "purple";
    }
  });

  useEffect(() => {
    const html = document.documentElement;
    
    // Fallback for generic light/dark class used by some components
    if (theme === "light") {
      html.classList.add("light");
    } else {
      html.classList.remove("light");
    }

    // Set data attributes for precise CSS variable targeting
    html.setAttribute("data-theme", theme);
    html.setAttribute("data-accent", accent);

    try {
      localStorage.setItem("cryptoneko_theme", theme);
      localStorage.setItem("cryptoneko_accent", accent);
    } catch (e) {}
  }, [theme, accent]);

  // Backwards compatibility for toggle
  const toggleTheme = () => setTheme((t) => (t === "midnight" || t === "dark" ? "light" : "midnight"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
