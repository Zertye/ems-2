/**
 * Composants UI de base réutilisables
 */
import { forwardRef } from "react";

/**
 * Champ de saisie stylisé
 */
export const InputField = forwardRef(({ label, className = "", onKeyDown, ...props }, ref) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <input
      ref={ref}
      className="input-field"
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
        if (onKeyDown) onKeyDown(e);
      }}
      {...props}
    />
  </div>
));

InputField.displayName = "InputField";

/**
 * Menu déroulant stylisé
 */
export const SelectField = forwardRef(({ label, className = "", children, ...props }, ref) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <select ref={ref} className="input-field appearance-none cursor-pointer" {...props}>
      {children}
    </select>
  </div>
));

SelectField.displayName = "SelectField";

/**
 * Zone de texte stylisée
 */
export const TextArea = forwardRef(({ label, className = "", ...props }, ref) => (
  <div className={className}>
    {label && <label className="label">{label}</label>}
    <textarea ref={ref} className="input-field min-h-[100px] resize-none" {...props} />
  </div>
));

TextArea.displayName = "TextArea";

/**
 * Composant Logo
 */
export const Logo = ({ size = 40, className = "" }) => (
  <img
    src="/logo.png"
    alt="MRSA Logo"
    className={`object-contain ${className}`}
    style={{ width: size, height: size }}
    onError={(e) => {
      e.target.style.display = "none";
    }}
  />
);

/**
 * Filigrane en bas à droite
 */
export const Watermark = () => (
  <div className="watermark">
    <img
      src="/logo.png"
      alt=""
      className="w-full h-full object-contain"
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  </div>
);

/**
 * Carte de statistique
 */
export function StatCard({ label, value, icon: Icon, color = "blue" }) {
  const colors = {
    blue: {
      icon: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
    },
    green: {
      icon: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    yellow: {
      icon: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
    },
    red: {
      icon: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
    },
  };
  
  const c = colors[color] || colors.blue;
  
  return (
    <div className={`card p-5 border-l-4 ${c.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="stat-value text-slate-800 dark:text-slate-100">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${c.bg}`}>
            <Icon size={24} strokeWidth={1.75} className={c.icon} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * En-tête de page
 */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h1>
        {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Écran de chargement
 */
export function LoadingScreen({ message = "Chargement..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <Watermark />
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium">{message}</p>
      </div>
    </div>
  );
}

/**
 * Message d'erreur
 */
export function ErrorMessage({ title = "Erreur", message, onRetry }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg">
      {title && <p className="font-bold mb-1">❌ {title}</p>}
      <p className="break-words">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-semibold hover:underline"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

/**
 * Badge stylisé
 */
export function Badge({ variant = "default", children, className = "", style }) {
  const variants = {
    default: "badge-primary",
    green: "badge-green",
    yellow: "badge-yellow",
    red: "badge-red",
    blue: "badge-blue",
  };
  
  return (
    <span className={`badge ${variants[variant] || variants.default} ${className}`} style={style}>
      {children}
    </span>
  );
}

export default {
  InputField,
  SelectField,
  TextArea,
  Logo,
  Watermark,
  StatCard,
  PageHeader,
  LoadingScreen,
  ErrorMessage,
  Badge,
};
