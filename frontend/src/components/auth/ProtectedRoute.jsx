/**
 * ProtectedRoute - Composant de protection des routes authentifiées
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LoadingScreen } from "../ui/FormElements";

/**
 * Route protégée nécessitant une authentification
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Vérification de l'authentification..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Route protégée nécessitant des permissions spécifiques
 */
export function PermissionRoute({ children, permission, fallback = "/dashboard" }) {
  const { user, loading, hasPerm } = useAuth();

  if (loading) {
    return <LoadingScreen message="Vérification des permissions..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPerm(permission)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}

/**
 * Route protégée nécessitant un accès admin ou des permissions admin
 */
export function AdminRoute({ children, fallback = "/dashboard" }) {
  const { user, loading, canAccessAdmin } = useAuth();

  if (loading) {
    return <LoadingScreen message="Vérification des accès..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Utiliser canAccessAdmin qui vérifie isAdmin OU les permissions admin granulaires
  if (!canAccessAdmin) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}

/**
 * Route publique avec redirection si déjà connecté
 */
export function PublicOnlyRoute({ children, redirectTo = "/dashboard" }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default ProtectedRoute;
