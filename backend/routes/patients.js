const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { isAuthenticated, hasPermission } = require("../middleware/auth");
const upload = require("../middleware/upload");
const logAction = require("../utils/logger"); // Ajout de l'import Logger

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

// Création (Support Upload Base64) + LOGS + Created_By
router.post("/", isAuthenticated, hasPermission('create_patients'), upload.single('photo'), async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, phone, insurance_number, chronic_conditions } = req.body;
    
    // Conversion Buffer -> Base64
    let photoData = null;
    if (req.file) {
      const b64 = req.file.buffer.toString('base64');
      const mime = req.file.mimetype;
      photoData = `data:${mime};base64,${b64}`;
    }

    const result = await pool.query(
      `INSERT INTO patients 
      (first_name, last_name, date_of_birth, gender, phone, insurance_number, chronic_conditions, photo, created_by, blood_type, allergies, address, emergency_contact_name, emergency_contact_phone) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, '', '', '', '', '') RETURNING *`,
      [first_name, last_name, date_of_birth || null, gender, phone, insurance_number, chronic_conditions, photoData, req.user.id]
    );

    // LOG DE L'ACTION
    await logAction(req.user.id, "CREATE_PATIENT", `Création patient ${first_name} ${last_name}`, result.rows[0].id);

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

// Mise à jour (Support Upload Base64) + LOGS
router.put("/:id", isAuthenticated, hasPermission('create_patients'), upload.single('photo'), async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, phone, insurance_number, chronic_conditions } = req.body;
    
    let query = `UPDATE patients SET 
      first_name=$1, last_name=$2, date_of_birth=$3, gender=$4, phone=$5, insurance_number=$6, chronic_conditions=$7, updated_at=CURRENT_TIMESTAMP`;
    
    const params = [first_name, last_name, date_of_birth || null, gender, phone, insurance_number, chronic_conditions];
    
    if (req.file) {
      query += `, photo=$${params.length + 1}`;
      const b64 = req.file.buffer.toString('base64');
      const mime = req.file.mimetype;
      const photoData = `data:${mime};base64,${b64}`;
      params.push(photoData);
    }

    query += ` WHERE id=$${params.length + 1}`;
    params.push(req.params.id);

    await pool.query(query, params);

    // LOG DE L'ACTION
    await logAction(req.user.id, "UPDATE_PATIENT", `Mise à jour patient ${first_name} ${last_name}`, req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Suppression avec Cascade Sécurisée + LOGS
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
            const userPerms = req.user.grade_permissions || {};
            const isSuperAdmin = req.user.grade_level === 99 || req.user.is_admin;
            
            if (!isSuperAdmin && !userPerms['delete_reports']) {
                 await client.query('ROLLBACK');
                 return res.status(403).json({ error: "Permission manquante : Supprimer Rapports (delete_reports) requise pour la suppression en cascade." });
            }
            
            await client.query("DELETE FROM medical_reports WHERE patient_id = $1", [req.params.id]);
        } else {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: "Ce patient possède des rapports médicaux.", requireForce: true, count: reportCount });
        }
    }

    await client.query("DELETE FROM patients WHERE id = $1", [req.params.id]);
    await client.query('COMMIT');

    // LOG DE L'ACTION
    await logAction(req.user.id, "DELETE_PATIENT", `Suppression patient ID ${req.params.id}`, req.params.id);

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
