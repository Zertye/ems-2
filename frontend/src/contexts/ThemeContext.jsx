/**
 * ThemeContext - Contexte de gestion du thème (clair/sombre)
 */
import { createContext, useContext, useState, useEffect } from "react";

// Création du contexte
const ThemeContext = createContext(null);

/**
 * Hook personnalisé pour accéder au contexte de thème
 * @returns {object} Contexte de thème
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme doit être utilisé dans un ThemeProvider");
  }
  return context;
}

/**
 * Détermine le thème initial
 * @returns {string} 'dark' ou 'light'
 */
const getInitialTheme = () => {
  // Vérifier localStorage en premier
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    
    // Sinon, utiliser la préférence système
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }
  
  return "light";
};

/**
 * Provider de thème
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Appliquer le thème au document
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    // Persister le choix
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      console.warn("Impossible de sauvegarder le thème:", e);
    }
  }, [theme]);

  // Écouter les changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e) => {
      // Ne changer que si l'utilisateur n'a pas fait de choix explicite
      const stored = localStorage.getItem("theme");
      if (!stored) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  /**
   * Basculer entre les thèmes
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  /**
   * Définir un thème spécifique
   * @param {string} newTheme - 'dark' ou 'light'
   */
  const setSpecificTheme = (newTheme) => {
    if (newTheme === "dark" || newTheme === "light") {
      setTheme(newTheme);
    }
  };

  /**
   * Vérifie si le thème actuel est sombre
   */
  const isDark = theme === "dark";

  const contextValue = {
    theme,
    isDark,
    toggleTheme,
    setTheme: setSpecificTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
