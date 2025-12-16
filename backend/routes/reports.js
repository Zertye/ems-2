const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { isAuthenticated, hasPermission } = require("../middleware/auth");
const logAction = require("../utils/logger");

// Récupérer les rapports
router.get("/", isAuthenticated, hasPermission('create_reports'), async (req, res) => {
  try {
    const { patient_id, limit = 50 } = req.query;
    let query = `
      SELECT mr.*, 
        p.first_name as patient_first_name, p.last_name as patient_last_name, p.insurance_number as patient_identity_id,
        u.first_name as medic_first_name, u.last_name as medic_last_name, u.badge_number
      FROM medical_reports mr
      LEFT JOIN patients p ON mr.patient_id = p.id
      LEFT JOIN users u ON mr.medic_id = u.id
    `;
    
    const params = [];
    if (patient_id) {
      params.push(patient_id);
      query += " WHERE mr.patient_id = $1";
    }
    
    query += " ORDER BY mr.incident_date DESC LIMIT $" + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer + LOG
router.post("/", isAuthenticated, hasPermission('create_reports'), async (req, res) => {
  try {
    const { patient_id, disease, context_notes, medications, total_cost } = req.body;
    
    if (!patient_id || !disease) {
      return res.status(400).json({ error: "Patient et Maladie requis" });
    }

    const medsString = Array.isArray(medications) ? medications.join(", ") : medications;
    const finalTreatment = total_cost ? `Coût Total: ${total_cost}$` : "Non facturé";

    const result = await pool.query(
      `INSERT INTO medical_reports 
      (patient_id, medic_id, report_type, diagnosis, notes, medications_given, treatment) 
      VALUES ($1, $2, 'intervention', $3, $4, $5, $6) 
      RETURNING *`,
      [patient_id, req.user.id, disease, context_notes, medsString, finalTreatment]
    );
    
    await logAction(req.user.id, "CREATE_REPORT", `Rapport créé pour patient ID ${patient_id}`, result.rows[0].id);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création rapport" });
  }
});

// Supprimer + LOG
router.delete("/:id", isAuthenticated, hasPermission('delete_reports'), async (req, res) => {
  try {
    await pool.query("DELETE FROM medical_reports WHERE id = $1", [req.params.id]);
    await logAction(req.user.id, "DELETE_REPORT", `Suppression rapport ID ${req.params.id}`, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur suppression rapport" });
  }
});

const diseasesList = [
  "Virus Respiratoire", "Pneumonie Bactérienne", "Hémorragie Interne", "Jambe Cassée",
  "Pneumonie Virale", "Méningite Virale", "Hépatite Virale", "Gastro-entérite Virale",
  "Septicémie", "Méningite Bactérienne", "Gastro-entérite Bactérienne", "Arthrite",
  "Péritonite", "Gastrite", "Blessure par Balle", "Blessure par Arme Blanche"
];

router.get("/diseases", isAuthenticated, (req, res) => {
  res.json(diseasesList);
});

module.exports = router;
