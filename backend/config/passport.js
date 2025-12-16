const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const pool = require("./database");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    // CORRECTION CRITIQUE : 
    // Pour l'affichage (grade_name, grade_color), on privilégie le grade VISIBLE (vg).
    // MAIS pour les permissions (grade_level, grade_permissions), on doit IMPÉRATIVEMENT utiliser le VRAI grade (g).
    // Si on utilisait le niveau du grade visible, un Admin masqué en Médecin perdrait ses droits !
    
    const result = await pool.query(`
      SELECT 
        u.id, u.username, u.first_name, u.last_name, u.badge_number, u.is_admin, u.profile_picture, u.visible_grade_id,
        -- Affichage : On prend le Visible si dispo, sinon le Vrai
        COALESCE(vg.name, g.name) as grade_name,
        COALESCE(vg.color, g.color) as grade_color,
        
        -- Permissions : ON PREND TOUJOURS LE VRAI GRADE (g)
        g.level as grade_level,
        g.permissions as grade_permissions
        
      FROM users u
      LEFT JOIN grades g ON u.grade_id = g.id
      LEFT JOIN grades vg ON u.visible_grade_id = vg.id
      WHERE u.id = $1
    `, [id]);
    
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    
    if (result.rows.length === 0) {
      return done(null, false, { message: "Utilisateur inconnu." });
    }

    const user = result.rows[0];

    // Vérification mot de passe
    const match = await bcrypt.compare(password, user.password);
    
    if (!match) {
      return done(null, false, { message: "Mot de passe incorrect." });
    }

    if (!user.is_active) {
      return done(null, false, { message: "Compte désactivé." });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

module.exports = passport;
