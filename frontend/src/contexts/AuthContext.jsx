/**
 * AuthContext - Contexte d'authentification React
 * Gère l'état de connexion, les permissions et les opérations d'auth
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch, setToken, removeToken, hasValidToken } from "../utils/api";
import { 
  hasPermission as checkPermission, 
  isUserAdmin, 
  canAccessAdminPanel,
  PERMISSIONS 
} from "../utils/permissions";

// Création du contexte
const AuthContext = createContext(null);

/**
 * Hook personnalisé pour accéder au contexte d'authentification
 * @returns {object} Contexte d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}

/**
 * Provider d'authentification
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Récupère l'utilisateur courant depuis l'API
   */
  const fetchUser = useCallback(async () => {
    try {
      // Vérifier d'abord si on a un token valide
      if (!hasValidToken()) {
        setUser(null);
        setLoading(false);
        return null;
      }

      const response = await apiFetch("/api/auth/me");
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAuthError(null);
        setLoading(false);
        return data.user;
      } else {
        // Token invalide ou expiré
        removeToken();
        setUser(null);
        setLoading(false);
        return null;
      }
    } catch (error) {
      console.error("[AUTH] Erreur fetchUser:", error);
      removeToken();
      setUser(null);
      setAuthError(error.message);
      setLoading(false);
      return null;
    }
  }, []);

  // Charger l'utilisateur au montage
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * Connexion utilisateur
   * @param {string} username - Identifiant
   * @param {string} password - Mot de passe
   * @returns {Promise<{success: boolean, error?: string, user?: object}>}
   */
  const login = async (username, password) => {
    setAuthError(null);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Ignorer les erreurs de parsing
        }
        return { success: false, error: errorMessage };
      }

      const data = await response.json();

      if (data.success && data.token) {
        // Stocker le token de manière sécurisée
        try {
          setToken(data.token);
        } catch (tokenError) {
          console.error("[AUTH] Erreur stockage token:", tokenError);
          return { success: false, error: "Impossible de stocker le token d'authentification" };
        }

        // Mettre à jour l'état utilisateur
        if (data.user) {
          setUser(data.user);
        }

        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || "Identifiants incorrects" };
      }
    } catch (error) {
      console.error("[AUTH] Exception login:", error);
      return { success: false, error: `Erreur de connexion: ${error.message}` };
    }
  };

  /**
   * Déconnexion utilisateur
   */
  const logout = async () => {
    // Supprimer le token local
    removeToken();
    
    // Notifier le serveur (optionnel, peut échouer)
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignorer les erreurs de logout côté serveur
    }
    
    // Réinitialiser l'état
    setUser(null);
    setAuthError(null);
    
    // Rediriger vers l'accueil
    window.location.href = "/";
  };

  /**
   * Rafraîchir les données utilisateur
   */
  const refreshUser = useCallback(async () => {
    return await fetchUser();
  }, [fetchUser]);

  /**
   * Vérifie si l'utilisateur possède une permission
   * @param {string} permission - Clé de permission
   * @returns {boolean}
   */
  const hasPerm = useCallback((permission) => {
    return checkPermission(user, permission);
  }, [user]);

  /**
   * Vérifie si l'utilisateur est admin
   */
  const isAdmin = isUserAdmin(user);

  /**
   * Vérifie si l'utilisateur peut accéder au panel admin
   */
  const canAccessAdmin = canAccessAdminPanel(user);

  // Valeur du contexte
  const contextValue = {
    // État
    user,
    loading,
    authError,
    
    // Actions
    login,
    logout,
    refreshUser,
    
    // Helpers permissions
    hasPerm,
    isAdmin,
    canAccessAdmin,
    
    // Export des constantes de permissions
    PERMISSIONS,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
