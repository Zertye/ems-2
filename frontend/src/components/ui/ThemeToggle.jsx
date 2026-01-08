/**
 * Bouton de bascule du thème (clair/sombre)
 */
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-yellow-400 hover:scale-105 transition-all shadow-sm border border-slate-300 dark:border-slate-600 ${className}`}
      title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export default ThemeToggle;
