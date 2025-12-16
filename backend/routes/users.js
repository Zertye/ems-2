const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const bcrypt = require("bcrypt");
const { isAuthenticated, hasPermission } = require("../middleware/auth");
const upload = require("../middleware/upload"); 

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
      SELECT 
        u.id, u.first_name, u.last_name, u.badge_number, u.profile_picture, u.phone,
        COALESCE(vg.name, g.name) as grade_name,
        COALESCE(vg.category, g.category) as grade_category,
        COALESCE(vg.level, g.level) as grade_level,
        COALESCE(vg.color, g.color) as grade_color
      FROM users u 
      LEFT JOIN grades g ON u.grade_id = g.id 
      LEFT JOIN grades vg ON u.visible_grade_id = vg.id
      WHERE u.is_active = true 
      ORDER BY COALESCE(vg.level, g.level) DESC, u.last_name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// --- NOUVELLE ROUTE : Statistiques Personnelles (Dashboard) ---
router.get("/me/stats", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // On exécute plusieurs requêtes en parallèle pour la performance
    const [reports, patients, appointments, recentReports] = await Promise.all([
      // Compte des rapports créés par l'utilisateur (en tant que médecin traitant)
      pool.query("SELECT COUNT(*) FROM medical_reports WHERE medic_id = $1", [userId]),
      // Compte des patients créés par l'utilisateur
      pool.query("SELECT COUNT(*) FROM patients WHERE created_by = $1", [userId]),
      // Compte des rendez-vous assignés à l'utilisateur et terminés
      pool.query("SELECT COUNT(*) FROM appointments WHERE assigned_medic_id = $1 AND status = 'completed'", [userId]),
      // Les 5 derniers rapports pour l'activité récente
      pool.query(`
        SELECT mr.id, mr.diagnosis, mr.incident_date, p.first_name, p.last_name 
        FROM medical_reports mr 
        JOIN patients p ON mr.patient_id = p.id 
        WHERE mr.medic_id = $1 
        ORDER BY mr.incident_date DESC 
        LIMIT 5
      `, [userId])
    ]);

    res.json({
      my_reports: parseInt(reports.rows[0]?.count || 0),
      my_patients: parseInt(patients.rows[0]?.count || 0),
      my_appointments: parseInt(appointments.rows[0]?.count || 0),
      recent_activity: recentReports.rows
    });
  } catch (err) {
    console.error("Erreur Stats Perso:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Modification de SON profil (Avec Upload Photo Base64 et Password)
router.put("/me", isAuthenticated, upload.single('profile_picture'), async (req, res) => {
  try {
    const { first_name, last_name, phone, password } = req.body;
    
    if (!first_name || !last_name) return res.status(400).json({error: "Nom et prénom requis"});

    // Construction dynamique de la requête
    let fields = ["first_name=$1", "last_name=$2", "phone=$3", "updated_at=CURRENT_TIMESTAMP"];
    let params = [first_name, last_name, phone];
    let paramIndex = 4;

    // Gestion du mot de passe
    if (password && password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(password, 10);
        fields.push(`password=$${paramIndex}`);
        params.push(hashedPassword);
        paramIndex++;
    }

    // Gestion de la photo (Base64)
    if (req.file) {
        fields.push(`profile_picture=$${paramIndex}`);
        const b64 = req.file.buffer.toString('base64');
        const mime = req.file.mimetype;
        const photoData = `data:${mime};base64,${b64}`;
        params.push(photoData);
        paramIndex++;
    }

    // Ajout de l'ID à la fin
    params.push(req.user.id);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id=$${paramIndex}`;

    await pool.query(query, params);
    
    // Récupérer l'utilisateur mis à jour pour rafraîchir la session (Passport)
    const updated = await pool.query(`
      SELECT 
        u.id, u.username, u.first_name, u.last_name, u.badge_number, u.is_admin, u.profile_picture, u.phone,
        COALESCE(vg.name, g.name) as grade_name,
        COALESCE(vg.color, g.color) as grade_color,
        g.level as grade_level,
        g.permissions as grade_permissions
      FROM users u
      LEFT JOIN grades g ON u.grade_id = g.id
      LEFT JOIN grades vg ON u.visible_grade_id = vg.id
      WHERE u.id = $1
    `, [req.user.id]);

    res.json({ success: true, user: updated.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
