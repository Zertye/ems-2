const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { isAuthenticated, hasPermission } = require("../middleware/auth");
const logAction = require("../utils/logger"); // Ajout de l'import Logger

// Prise de RDV Publique (Avec Notification Discord)
router.post("/public", async (req, res) => {
  try {
    const { patient_name, patient_phone, patient_discord, appointment_type, preferred_date, preferred_time, description } = req.body;
    
    if (!patient_name) return res.status(400).json({ error: "Nom requis" });
    
    const result = await pool.query(
      "INSERT INTO appointments (patient_name, patient_phone, patient_discord, appointment_type, preferred_date, preferred_time, description) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [patient_name, patient_phone, patient_discord, appointment_type, preferred_date || null, preferred_time || null, description]
    );

    // --- NOTIFICATION DISCORD ---
    try {
        const webhookUrl = "https://discord.com/api/webhooks/1450600265211318424/Z76rqOyQkL7QRCM-VUO-F06pwpO1UGGcFiW7EeZo3RNif8Um2zKrU_Qhg2aqc-Ugsna7";
        const targetUrl = "https://ems-2-production.up.railway.app/appointments";
        
        // Node.js 18+ possède fetch nativement
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: [{
                    title: "Nouvelle Demande de Rendez-vous",
                    url: targetUrl,
                    color: 3899894, // Bleu Médical (#3b82f6)
                    description: `Un patient a sollicité un rendez-vous.\n[**Cliquez ici pour gérer les rendez-vous**](${targetUrl})`,
                    fields: [
                        { name: "👤 Patient", value: patient_name, inline: true },
                        { name: "📞 Téléphone", value: patient_phone || "Non renseigné", inline: true },
                        { name: "💬 Discord", value: patient_discord || "Non renseigné", inline: true },
                        { name: "📅 Date souhaitée", value: `${preferred_date} à ${preferred_time}`, inline: false },
                        { name: "📋 Motif", value: description || "Aucun détail fourni", inline: false },
                        { name: "🩺 Type", value: appointment_type, inline: true }
                    ],
                    footer: { text: "MRSA Medical System • Notification Automatique" },
                    timestamp: new Date().toISOString()
                }]
            })
        });
    } catch (discordErr) {
        console.error("❌ Erreur envoi Webhook Discord:", discordErr);
    }
    // ----------------------------

    // Pas de logAction ici car c'est une action publique (pas d'utilisateur connecté)
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Liste des RDV
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

// Assigner un RDV + LOG
router.post("/:id/assign", isAuthenticated, hasPermission('manage_appointments'), async (req, res) => {
  try {
    await pool.query("UPDATE appointments SET assigned_medic_id = $1, status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = $2", [req.user.id, req.params.id]);
    await logAction(req.user.id, "ASSIGN_APPOINTMENT", `Prise en charge RDV ID ${req.params.id}`, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Terminer un RDV + LOG
router.post("/:id/complete", isAuthenticated, hasPermission('manage_appointments'), async (req, res) => {
  try {
    const { completion_notes } = req.body;
    await pool.query("UPDATE appointments SET status = 'completed', completion_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [completion_notes, req.params.id]);
    await logAction(req.user.id, "COMPLETE_APPOINTMENT", `RDV terminé ID ${req.params.id}`, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Annuler un RDV + LOG
router.post("/:id/cancel", isAuthenticated, hasPermission('manage_appointments'), async (req, res) => {
  try {
    await pool.query("UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [req.params.id]);
    await logAction(req.user.id, "CANCEL_APPOINTMENT", `Annulation RDV ID ${req.params.id}`, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE pour Admin + LOG
router.delete("/:id", isAuthenticated, hasPermission('manage_appointments'), async (req, res) => {
  try {
    // Vérification admin simple (ou permission très élevée)
    if (!req.user.is_admin && req.user.grade_level < 8) {
        return res.status(403).json({ error: "Seuls les hauts gradés peuvent supprimer définitivement un RDV." });
    }
    await pool.query("DELETE FROM appointments WHERE id = $1", [req.params.id]);
    await logAction(req.user.id, "DELETE_APPOINTMENT", `Suppression définitive RDV ID ${req.params.id}`, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Stats RDV
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
