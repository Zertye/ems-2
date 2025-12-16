const pool = require("../config/database");

/**
 * Enregistre une action dans les logs système
 * @param {number} userId - ID de l'utilisateur qui fait l'action
 * @param {string} action - Type d'action (ex: 'CREATE_REPORT', 'DELETE_USER')
 * @param {string} details - Description lisible
 * @param {number} targetId - ID de l'objet concerné (optionnel)
 */
const logAction = async (userId, action, details, targetId = null) => {
  try {
    await pool.query(
      "INSERT INTO logs (user_id, action, details, target_id) VALUES ($1, $2, $3, $4)",
      [userId, action, details, targetId]
    );
  } catch (err) {
    console.error("❌ Erreur Logger:", err);
  }
};

module.exports = logAction;
