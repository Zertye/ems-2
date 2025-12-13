const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { isAuthenticated, hasPermission } = require("../middleware/auth");
const upload = require("../middleware/upload"); // Import du middleware

// Liste de tous les utilisateurs (Pour Admin)
router.get("/", isAuthenticated, hasPermission('manage_users'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.*, g.name as grade_name, g.category as grade_category, g.level as grade_level, g.color as grade_color
      FROM users u LEFT JOIN grades g ON u.grade_id = g.id ORDER BY g.level DESC, u.first_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Effectifs (Vue publique interne)
router.get("/roster", isAuthenticated, hasPermission('view_roster'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.first_name, u.last_name, u.badge_number, u.profile_picture, u.phone,
        g.name as grade_name, g.category as grade_category, g.level as grade_level, g.color as grade_color
      FROM users u LEFT JOIN grades g ON u.grade_id = g.id WHERE u.is_active = true ORDER BY g.level DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Modification de SON profil (Avec Upload Photo)
router.put("/me", isAuthenticated, upload.single('profile_picture'), async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    
    if (!first_name || !last_name) return res.status(400).json({error: "Nom et prénom requis"});

    let query = "UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP";
    const params = [first_name, last_name, phone];

    if (req.file) {
        query += `, profile_picture = $4`;
        params.push(`/uploads/${req.file.filename}`);
        query += ` WHERE id = $5`;
        params.push(req.user.id);
    } else {
        query += ` WHERE id = $4`;
        params.push(req.user.id);
    }

    await pool.query(query, params);
    
    const updated = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    res.json({ success: true, user: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
