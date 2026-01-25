const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");

router.post("/send-visit", isAuthenticated, async (req, res) => {
  try {
    const { firstName, lastName, status } = req.body;
    
    const lspdWebhook = process.env.WEBHOOK_LSPD;
    const emsWebhook = process.env.WEBHOOK_EMS;

    if (!lspdWebhook || !emsWebhook) {
      return res.status(500).json({ error: "Configuration Webhook manquante" });
    }

    const isApte = status === "APTE";
    const embedColor = isApte ? 3066993 : 15158332; // Vert si Apte, Rouge si Inapte

    const embedData = {
      embeds: [{
        title: "📑 VISITE MÉDICALE : LSPD",
        color: embedColor,
        fields: [
          { name: "Agent", value: `**${firstName} ${lastName}**`, inline: true },
          { name: "Résultat", value: `**${status}**`, inline: true },
          { name: "Médecin", value: `${req.user.first_name} ${req.user.last_name}`, inline: false }
        ],
        footer: { text: "MRSA MDT • Registre Officiel" },
        timestamp: new Date().toISOString()
      }]
    };

    // Envoi simultané aux deux services
    await Promise.all([
      fetch(lspdWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(embedData) }),
      fetch(emsWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(embedData) })
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur d'envoi" });
  }
});

module.exports = router;
