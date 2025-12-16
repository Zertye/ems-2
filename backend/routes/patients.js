const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { isAuthenticated, hasPermission } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Liste avec recherche
router.get("/", isAuthenticated, hasPermission('view_patients'), async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;
    let query = "SELECT p.*, (SELECT COUNT(*) FROM medical_reports WHERE patient_id = p.id) as report_count FROM patients p";
    const params = [];
    
    if (search) {
      params.push("%" + search + "%");
      query += " WHERE p.first_name ILIKE $1 OR p.last_name ILIKE $1 OR p.phone ILIKE $1 OR p.insurance_number ILIKE $1";
    }
    
    query += " ORDER BY p.last_name LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json({ patients: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Création (Support Upload Photo)
router.post("/", isAuthenticated, hasPermission('create_patients'), upload.single('photo'), async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, phone, insurance_number, chronic_conditions } = req.body;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO patients 
      (first_name, last_name, date_of_birth, gender, phone, insurance_number, chronic_conditions, photo, blood_type, allergies, address, emergency_contact_name, emergency_contact_phone) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8, '', '', '', '', '') RETURNING *`,
      [first_name, last_name, date_of_birth || null, gender, phone, insurance_number, chronic_conditions, photoPath]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création patient" });
  }
});

// Détail Patient
router.get("/:id", isAuthenticated, hasPermission('view_patients'), async (req, res) => {
  try {
    const patient = await pool.query("SELECT * FROM patients WHERE id = $1", [req.params.id]);
    if (patient.rows.length === 0) return res.status(404).json({ error: "Patient introuvable" });
    
    const reports = await pool.query(`
      SELECT mr.*, u.first_name as medic_first_name, u.last_name as medic_last_name, u.badge_number
      FROM medical_reports mr LEFT JOIN users u ON mr.medic_id = u.id WHERE mr.patient_id = $1 ORDER BY mr.incident_date DESC
    `, [req.params.id]);
    
    res.json({ patient: patient.rows[0], reports: reports.rows });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mise à jour (Support Upload Photo)
router.put("/:id", isAuthenticated, hasPermission('create_patients'), upload.single('photo'), async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, phone, insurance_number, chronic_conditions } = req.body;
    
    let query = `UPDATE patients SET 
      first_name=$1, last_name=$2, date_of_birth=$3, gender=$4, phone=$5, insurance_number=$6, chronic_conditions=$7, updated_at=CURRENT_TIMESTAMP`;
    
    const params = [first_name, last_name, date_of_birth || null, gender, phone, insurance_number, chronic_conditions];
    
    if (req.file) {
      query += `, photo=$${params.length + 1}`;
      params.push(`/uploads/${req.file.filename}`);
    }

    query += ` WHERE id=$${params.length + 1}`;
    params.push(req.params.id);

    await pool.query(query, params);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Suppression avec Cascade Sécurisée
router.delete("/:id", isAuthenticated, hasPermission('delete_patients'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { force } = req.query; // Force la suppression même s'il y a des rapports
    await client.query('BEGIN');

    // Vérifier s'il y a des rapports liés
    const reportsCheck = await client.query("SELECT COUNT(*) FROM medical_reports WHERE patient_id = $1", [req.params.id]);
    const reportCount = parseInt(reportsCheck.rows[0].count);

    if (reportCount > 0) {
        if (force === 'true') {
            // VÉRIFICATION CRITIQUE DES PERMISSIONS
            // L'utilisateur doit avoir 'delete_patients' (déjà vérifié par middleware) 
            // ET 'delete_reports' pour effectuer une suppression en cascade.
            
            // On reconstruit la logique de permission manuellement car middleware déjà passé
            const userPerms = req.user.grade_permissions || {};
            const isSuperAdmin = req.user.grade_level === 99 || req.user.is_admin;
            
            if (!isSuperAdmin && !userPerms['delete_reports']) {
                 await client.query('ROLLBACK');
                 return res.status(403).json({ error: "Permission manquante : Supprimer Rapports (delete_reports) requise pour la suppression en cascade." });
            }
            
            // Suppression des rapports
            await client.query("DELETE FROM medical_reports WHERE patient_id = $1", [req.params.id]);
        } else {
            await client.query('ROLLBACK');
            // Code 409 Conflict pour signaler au frontend de demander confirmation
            return res.status(409).json({ error: "Ce patient possède des rapports médicaux.", requireForce: true, count: reportCount });
        }
    }

    // Suppression du patient
    await client.query("DELETE FROM patients WHERE id = $1", [req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  } finally {
    client.release();
  }
});

module.exports = router;
