/**
 * Module API - Gestion des appels HTTP avec authentification JWT
 * SÉCURITÉ: Aucune valeur par défaut - Le token doit être correctement configuré
 */

const TOKEN_KEY = "mrsa_auth_token";

/**
 * Récupère le token JWT stocké
 * @returns {string|null} Le token ou null si absent
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error("[API] Impossible d'accéder au localStorage:", e);
    return null;
  }
};

/**
 * Stocke le token JWT
 * @param {string} token - Le token à stocker
 * @throws {Error} Si le token est invalide ou si localStorage est inaccessible
 */
export const setToken = (token) => {
  if (!token || typeof token !== "string" || token.trim() === "") {
    throw new Error("Token JWT invalide - impossible de stocker une valeur vide");
  }
  
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error("[API] Impossible de stocker le token:", e);
    throw new Error("Échec du stockage du token - localStorage inaccessible");
  }
};

/**
 * Supprime le token JWT
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error("[API] Impossible de supprimer le token:", e);
  }
};

/**
 * Vérifie si un token est présent et valide (format basique)
 * @returns {boolean}
 */
export const hasValidToken = () => {
  const token = getToken();
  if (!token) return false;
  
  // Vérification basique du format JWT (3 parties séparées par des points)
  const parts = token.split(".");
  if (parts.length !== 3) {
    console.warn("[API] Token mal formé, suppression...");
    removeToken();
    return false;
  }
  
  return true;
};

/**
 * Fonction principale pour les appels API avec authentification
 * @param {string} url - URL de l'API
 * @param {object} options - Options fetch
 * @returns {Promise<Response>}
 */
export const apiFetch = async (url, options = {}) => {
  const token = getToken();
  
  const headers = {
    ...options.headers,
  };
  
  // Ajouter le token si présent
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // Ajouter Content-Type pour JSON si body présent et pas de FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include"
    });
    
    // Gestion automatique de l'expiration du token
    if (response.status === 401) {
      const currentPath = window.location.pathname;
      // Ne pas rediriger si déjà sur login ou pages publiques
      if (currentPath !== "/login" && currentPath !== "/" && currentPath !== "/book") {
        console.warn("[API] Token expiré ou invalide, redirection vers login...");
        removeToken();
        window.location.href = "/login";
      }
    }
    
    return response;
  } catch (error) {
    console.error("[API] Erreur réseau:", error);
    throw error;
  }
};

/**
 * Vérification des capacités du navigateur
 * @returns {object} Rapport des capacités
 */
export const checkBrowserCapabilities = () => {
  const capabilities = {
    cookies: false,
    localStorage: false,
    fetch: typeof fetch === "function",
  };
  
  // Test cookies
  try {
    document.cookie = "testcookie=1; SameSite=Strict";
    capabilities.cookies = document.cookie.includes("testcookie");
    document.cookie = "testcookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
  } catch (e) {
    capabilities.cookies = false;
  }
  
  // Test localStorage
  try {
    localStorage.setItem("__test__", "1");
    localStorage.removeItem("__test__");
    capabilities.localStorage = true;
  } catch (e) {
    capabilities.localStorage = false;
  }
  
  return capabilities;
};

export default apiFetch;
