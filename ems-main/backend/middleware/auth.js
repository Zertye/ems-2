// Vérifie si l'utilisateur est connecté
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Non authentifié" });
};

// Vérifie si l'utilisateur est un Admin global
const isAdmin = (req, res, next) => {
  // Le niveau 99 (Développeur) a toujours accès
  if (req.user && (req.user.grade_level === 99 || req.user.is_admin || req.user.grade_level >= 10)) {
    return next();
  }
  res.status(403).json({ error: "Accès refusé: Admin requis" });
};

// Système de permission Granulaire
const hasPermission = (permKey) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifié" });
  
  // 1. LE GRADE DÉVELOPPEUR (99) A ACCÈS À TOUT, TOUT LE TEMPS.
  if (req.user.grade_level === 99) return next();

  // 2. Le Super Admin (Admin par défaut) a accès
  if (req.user.is_admin) return next();

  // 3. Vérifie l'objet JSON permissions du grade spécifique
  const perms = req.user.grade_permissions || {};
  
  if (perms[permKey] === true) {
    return next();
  }

  res.status(403).json({ error: `Permission manquante: ${permKey}` });
};

module.exports = { isAuthenticated, isAdmin, hasPermission };
