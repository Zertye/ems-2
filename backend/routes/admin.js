const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const bcrypt = require("bcrypt");
const { isAuthenticated, isAdmin, hasPermission } = require("../middleware/auth");

// --- STATS ---
router.get("/stats", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM users");
    const patients = await pool.query("SELECT COUNT(*) as total FROM patients");
    const appointments = await pool.query("SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='pending') as pending FROM appointments");
    const reports = await pool.query("SELECT COUNT(*) as total FROM medical_reports");
    // Stats distribution: On utilise le VRAI grade pour les stats internes
    const gradeDistribution = await pool.query("SELECT g.name, g.color, COUNT(u.id) as count FROM grades g LEFT JOIN users u ON u.grade_id = g.id GROUP BY g.id, g.name, g.color ORDER BY count DESC");
    
    res.json({
      users: users.rows[0],
      patients: patients.rows[0],
      appointments: appointments.rows[0],
      reports: reports.rows[0],
      gradeDistribution: gradeDistribution.rows
    });
  } catch (err) {
    console.error("Erreur Stats Admin:", err);
    res.status(500).json({ error: "Erreur serveur récupération stats" });
  }
});

// --- GRADES ---

router.get("/grades", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM grades ORDER BY level DESC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.put("/grades/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, category, level, color, permissions } = req.body;
    
    if (req.user.grade_level !== 99) {
        if (level >= req.user.grade_level) return res.status(403).json({ error: "Vous ne pouvez pas gérer un grade supérieur ou égal au vôtre." });
    }

    await pool.query(
      "UPDATE grades SET name=$1, category=$2, level=$3, color=$4, permissions=$5 WHERE id=$6",
      [name, category, level, color, permissions || {}, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/grades", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { name, category, level, color, permissions } = req.body;
    if (req.user.grade_level !== 99 && level >= req.user.grade_level) {
        return res.status(403).json({ error: "Impossible de créer un grade supérieur au vôtre." });
    }
    const result = await pool.query(
      "INSERT INTO grades (name, category, level, color, permissions) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [name, category, level || 1, color || "#4a90a4", permissions || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.delete("/grades/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await pool.query("SELECT COUNT(*) FROM users WHERE grade_id = $1", [req.params.id]);
    if (parseInt(users.rows[0].count) > 0) return res.status(400).json({ error: "Impossible: Grade assigné à des utilisateurs" });
    await pool.query("DELETE FROM grades WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// --- UTILISATEURS ---

router.get("/users", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // MODIF: On récupère aussi visible_grade_id
    const result = await pool.query(`
      SELECT u.id, u.username, u.first_name, u.last_name, u.badge_number, u.grade_id, u.visible_grade_id, u.is_active, 
      g.name as grade_name, g.color as grade_color, g.level as grade_level 
      FROM users u 
      LEFT JOIN grades g ON u.grade_id = g.id 
      ORDER BY g.level DESC, u.first_name
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

router.post("/users", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Ajout visible_grade_id
    const { username, password, first_name, last_name, badge_number, grade_id, visible_grade_id } = req.body;
    
    if (req.user.grade_level !== 99) {
        const targetGrade = await pool.query("SELECT level FROM grades WHERE id = $1", [grade_id]);
        if (targetGrade.rows.length > 0 && targetGrade.rows[0].level >= req.user.grade_level) {
            return res.status(403).json({ error: "Impossible d'assigner un grade supérieur ou égal au vôtre." });
        }
    }

    const check = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    if (check.rows.length > 0) return res.status(400).json({ error: "Cet identifiant existe déjà" });

    const hashedPassword = await bcrypt.hash(password, 10);
    // On convertit chaine vide en NULL
    const visGrade = (visible_grade_id && visible_grade_id !== "") ? visible_grade_id : null;

    await pool.query(
      `INSERT INTO users (username, password, first_name, last_name, badge_number, grade_id, visible_grade_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
      [username, hashedPassword, first_name, last_name, badge_number, grade_id, visGrade]
    );
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: "Erreur lors de la création" }); }
});

router.put("/users/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Ajout visible_grade_id
    const { username, password, first_name, last_name, badge_number, grade_id, visible_grade_id } = req.body;
    const targetUserId = req.params.id;

    // Check perms...
    if (req.user.grade_level !== 99) { 
        const currentTarget = await pool.query("SELECT g.level FROM users u LEFT JOIN grades g ON u.grade_id = g.id WHERE u.id = $1", [targetUserId]);
        const currentLevel = currentTarget.rows[0]?.level || 0;
        
        if (currentLevel >= req.user.grade_level) {
            return res.status(403).json({ error: "Vous ne pouvez pas modifier un supérieur." });
        }

        const newGrade = await pool.query("SELECT level FROM grades WHERE id = $1", [grade_id]);
        const newLevel = newGrade.rows[0]?.level || 0;
        
        if (newLevel >= req.user.grade_level) {
            return res.status(403).json({ error: "Vous ne pouvez pas promouvoir quelqu'un au dessus de vous." });
        }
    }

    const visGrade = (visible_grade_id && visible_grade_id !== "") ? visible_grade_id : null;

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET username=$1, password=$2, first_name=$3, last_name=$4, badge_number=$5, grade_id=$6, visible_grade_id=$7, updated_at=CURRENT_TIMESTAMP WHERE id=$8`,
        [username, hashedPassword, first_name, last_name, badge_number, grade_id, visGrade, targetUserId]
      );
    } else {
      await pool.query(
        `UPDATE users SET username=$1, first_name=$2, last_name=$3, badge_number=$4, grade_id=$5, visible_grade_id=$6, updated_at=CURRENT_TIMESTAMP WHERE id=$7`,
        [username, first_name, last_name, badge_number, grade_id, visGrade, targetUserId]
      );
    }
    res.json({ success: true });
  } catch (err) { 
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la mise à jour" }); 
  }
});

router.delete("/users/:id", isAuthenticated, hasPermission('delete_users'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte." });

    if (req.user.grade_level !== 99) {
        const target = await pool.query("SELECT g.level FROM users u LEFT JOIN grades g ON u.grade_id = g.id WHERE u.id = $1", [userId]);
        const targetLevel = target.rows[0]?.level || 0;

        if (targetLevel >= req.user.grade_level) {
            return res.status(403).json({ error: "Vous ne pouvez pas supprimer un supérieur." });
        }
    }

    await pool.query("UPDATE medical_reports SET medic_id = NULL WHERE medic_id = $1", [userId]);
    await pool.query("UPDATE appointments SET assigned_medic_id = NULL WHERE assigned_medic_id = $1", [userId]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    
    res.json({ success: true });
  } catch (err) { 
    console.error("Erreur suppression:", err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression (Voir logs)" }); 
  }
});

module.exports = router;
