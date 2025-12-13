const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { isAuthenticated, hasPermission } = require("../middleware/auth");

router.post("/public", async (req, res) => {
  try {
    const { patient_name, patient_phone, patient_discord, appointment_type, preferred_date, preferred_time, description } = req.body;
    if (!patient_name) return res.status(400).json({ error: "Nom requis" });
    const result = await pool.query(
      "INSERT INTO appointments (patient_name, patient_phone, patient_discord, appointment_type, preferred_date, preferred_time, description) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [patient_name, patient_phone, patient_discord, appointment_type, preferred_date || null, preferred_time || null, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/", isAuthenticated, async (req, res) => {
  try {
    const { status, assigned_to_me } = req.query;
    let query = `
      SELECT a.*, u.first_name as medic_first_name, u.last_name as medic_last_name, u.badge_number as medic_badge
      FROM appointments a LEFT JOIN users u ON a.assigned_medic_id = u.id
    `;
    const conditions = [];
    const params = [];
    if (status) { params.push(status); conditions.push("a.status = $" + params.length); }
    if (assigned_to_me === "true") { params.push(req.user.id); conditions.push("a.assigned_medic_id = $" + params.length); }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY a.created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/:id/assign", isAuthenticated, hasPermission('manage_appointments'), async (req, res) => {
  try {
    await pool.query("UPDATE appointments SET assigned_medic_id = $1, status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = $2", [req.user.id, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/:id/complete", isAuthenticated, hasPermission('manage_appointments'), async (req, res) => {
  try {
    const { completion_notes } = req.body;
    await pool.query("UPDATE appointments SET status = 'completed', completion_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [completion_notes, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/:id/cancel", isAuthenticated, hasPermission('manage_appointments'), async (req, res) => {
  try {
    await pool.query("UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE pour Admin
router.delete("/:id", isAuthenticated, hasPermission('manage_appointments'), async (req, res) => {
  try {
    // Vérification admin simple (ou permission très élevée)
    if (!req.user.is_admin && req.user.grade_level < 8) {
        return res.status(403).json({ error: "Seuls les hauts gradés peuvent supprimer définitivement un RDV." });
    }
    await pool.query("DELETE FROM appointments WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/stats/overview", isAuthenticated, async (req, res) => {
  try {
    const global = await pool.query("SELECT status, COUNT(*) FROM appointments GROUP BY status");
    const personal = await pool.query("SELECT COUNT(*) as my_completed FROM appointments WHERE assigned_medic_id = $1 AND status = 'completed'", [req.user.id]);
    const stats = { global: {}, personal: personal.rows[0] };
    global.rows.forEach(r => { stats.global[r.status] = parseInt(r.count); });
    stats.global.total = Object.values(stats.global).reduce((a, b) => a + b, 0);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
