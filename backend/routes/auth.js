const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "mrsa-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token valide 7 jours

// Fonction pour générer le token avec les infos user complètes
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      username: user.username,
      is_admin: user.is_admin
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Fonction pour récupérer l'user complet avec permissions (réutilisée)
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

// Connexion - Supporte session ET JWT
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Identifiant et mot de passe requis" });
    }

    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Utilisateur inconnu" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: "Compte désactivé" });
    }

    // Récupérer l'user complet avec permissions
    const fullUser = await getFullUser(user.id);

    // Générer le JWT
    const token = generateToken(user);

    // Aussi faire le login session classique (pour les navigateurs qui supportent les cookies)
    if (req.logIn) {
      req.logIn(user, (err) => {
        if (err) console.error("Session login error:", err);
      });
    }

    // Renvoyer le token ET l'user complet
    res.json({ 
      success: true, 
      token,
      user: fullUser
    });
    
  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Déconnexion
router.post("/logout", (req, res) => {
  if (req.logout) {
    req.logout((err) => {
      if (err) console.error("Logout error:", err);
    });
  }
  res.json({ success: true });
});

// Vérifier session/token et récupérer user complet
router.get("/me", async (req, res) => {
  try {
    let userId = null;

    // 1. Vérifier le token JWT dans le header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (jwtErr) {
        // Token invalide ou expiré
        console.log("JWT invalide:", jwtErr.message);
      }
    }

    // 2. Sinon, vérifier la session Passport (pour navigateurs avec cookies)
    if (!userId && req.isAuthenticated && req.isAuthenticated()) {
      userId = req.user.id;
    }

    // 3. Pas d'auth trouvée
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // Récupérer l'user complet
    const user = await getFullUser(userId);
    
    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    res.json({ user });
    
  } catch (err) {
    console.error("Erreur /me:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Rafraîchir le token (optionnel, pour prolonger la session)
router.post("/refresh", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requis" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Récupérer l'user pour vérifier qu'il existe toujours et est actif
    const result = await pool.query("SELECT * FROM users WHERE id = $1 AND is_active = true", [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Utilisateur invalide" });
    }

    // Générer un nouveau token
    const newToken = generateToken(result.rows[0]);
    const fullUser = await getFullUser(decoded.id);

    res.json({ token: newToken, user: fullUser });
    
  } catch (err) {
    res.status(401).json({ error: "Token invalide" });
  }
});

module.exports = router;
module.exports.getFullUser = getFullUser;
module.exports.JWT_SECRET = JWT_SECRET;
