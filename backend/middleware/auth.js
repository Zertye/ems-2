const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "mrsa-secret-key-change-in-production";

// Fonction pour récupérer l'user complet (dupliquée ici pour éviter les imports circulaires)
const getFullUser = async (userId) => {
  const result = await pool.query(`
    SELECT 
      u.id, u.username, u.first_name, u.last_name, u.badge_number, u.is_admin, u.profile_picture, u.phone, u.visible_grade_id,
      COALESCE(vg.name, g.name) as grade_name,
      COALESCE(vg.color, g.color) as grade_color,
      g.level as grade_level,
      g.permissions as grade_permissions
    FROM users u
    LEFT JOIN grades g ON u.grade_id = g.id
    LEFT JOIN grades vg ON u.visible_grade_id = vg.id
    WHERE u.id = $1
  `, [userId]);
  
  return result.rows[0] || null;
};

// Middleware pour extraire l'user depuis JWT ou Session
const extractUser = async (req, res, next) => {
  try {
    // 1. Vérifier le token JWT dans le header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await getFullUser(decoded.id);
        if (user) {
          req.user = user;
          return next();
        }
      } catch (jwtErr) {
        // Token invalide, on continue pour vérifier la session
        console.log("JWT verification failed:", jwtErr.message);
      }
    }

    // 2. Vérifier la session Passport (pour navigateurs avec cookies)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // 3. Pas d'auth
    next();
  } catch (err) {
    console.error("extractUser error:", err);
    next();
  }
};

// Vérifie si l'utilisateur est connecté
const isAuthenticated = (req, res, next) => {
  if (req.user) {
    return next();
  }
  res.status(401).json({ error: "Non authentifié" });
};

// Vérifie si l'utilisateur est un Admin global
const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifié" });
  
  // GRADE DÉVELOPPEUR (99) = ACCÈS TOTAL, TOUJOURS, SANS EXCEPTION
  if (req.user.grade_level === 99) return next();
  
  // Admin classique (is_admin flag ou grade niveau 10+)
  if (req.user.is_admin || req.user.grade_level >= 10) {
    return next();
  }
  
  res.status(403).json({ error: "Accès refusé: Admin requis" });
};

// Système de permission Granulaire
const hasPermission = (permKey) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifié" });
  
  // GRADE DÉVELOPPEUR (99) = ACCÈS TOTAL, TOUJOURS, SANS EXCEPTION
  if (req.user.grade_level === 99) return next();

  // Admin classique a accès à tout
  if (req.user.is_admin) return next();

  // Vérifie l'objet JSON permissions du grade spécifique
  const perms = req.user.grade_permissions || {};
  
  if (perms[permKey] === true) {
    return next();
  }

  res.status(403).json({ error: `Permission manquante: ${permKey}` });
};

module.exports = { extractUser, isAuthenticated, isAdmin, hasPermission };
