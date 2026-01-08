/**
 * Login - Page de connexion
 */
import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { checkBrowserCapabilities } from "../../utils/api";
import { Logo, Watermark, InputField, ThemeToggle, ErrorMessage } from "../../components/ui";

export function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  // Vérifier les capacités du navigateur au chargement
  useEffect(() => {
    const caps = checkBrowserCapabilities();
    const tests = [
      `Cookies: ${caps.cookies ? "✅" : "❌"}`,
      `localStorage: ${caps.localStorage ? "✅" : "❌"}`,
      `fetch: ${caps.fetch ? "✅" : "❌"}`,
    ];
    setDebugInfo(tests.join(" | "));

    // Avertir si localStorage n'est pas disponible
    if (!caps.localStorage) {
      setError("⚠️ LocalStorage non disponible. L'authentification ne fonctionnera pas correctement.");
    }
  }, []);

  // Rediriger si déjà connecté
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setStatus("Connexion au serveur...");

    try {
      const result = await login(form.username, form.password);

      if (result.success) {
        setStatus("✅ Connecté ! Redirection...");
        // Forcer la redirection
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 500);
      } else {
        setError(result.error || "Erreur inconnue");
        setStatus("");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("[LOGIN] Exception:", err);
      setError(`Exception: ${err.message || String(err)}`);
      setStatus("");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Watermark />
      
      <div className="flex absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-5 shadow-xl p-3">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Connexion</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Système de Gestion Médicale MRSA
          </p>
        </div>

        {/* Formulaire */}
        <div className="card p-6">
          {error && (
            <div className="mb-4">
              <ErrorMessage message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Identifiant"
              placeholder="nom.prenom"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={isLoading}
              autoComplete="username"
            />
            
            <InputField
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={isLoading}
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {status || "Chargement..."}
                </>
              ) : (
                "Se connecter"
              )}
            </button>

            {isLoading && (
              <p className="text-center text-xs text-slate-400 mt-2">
                Si ça prend plus de 15s, une erreur s'affichera
              </p>
            )}
          </form>

          {/* Info debug */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-400 text-center font-mono">{debugInfo}</p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6 font-medium">
          <Link to="/" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
