import { createContext, useContext, useState, useEffect } from "react";

// CreateContext creates a 'shared space' that any component can access
const ThemeContext = createContext(null);

// ThemeProvider wraps the whole app and makes theme available everywhere
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage for saved theme preference
    // This runs ONCE when the app loads
    const saved = localStorage.getItem("kanban_theme");
    return saved === "dark"; // returns true if dark, false if light
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem("kanban_theme", isDark ? "dark" : "light"); // remember preference
  }, [isDark]); // only runs when isDark changes

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  }; // flip between dark and light

  return (
    // Provide isDark and toggleTheme to ALL children components
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
