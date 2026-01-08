/**
 * Module Permissions - Gestion centralisée des permissions utilisateur
 * Ce fichier définit toutes les permissions disponibles et les fonctions de vérification
 */

// Liste complète des permissions disponibles dans le système
export const PERMISSIONS = {
  // Accès de base
  ACCESS_DASHBOARD: "access_dashboard",
  
  // Patients
  VIEW_PATIENTS: "view_patients",
  CREATE_PATIENTS: "create_patients",
  DELETE_PATIENTS: "delete_patients",
  
  // Rapports médicaux
  CREATE_REPORTS: "create_reports",
  DELETE_REPORTS: "delete_reports",
  
  // Rendez-vous
  MANAGE_APPOINTMENTS: "manage_appointments",
  DELETE_APPOINTMENTS: "delete_appointments",
  
  // Effectifs
  VIEW_ROSTER: "view_roster",
  
  // Administration
  MANAGE_USERS: "manage_users",
  DELETE_USERS: "delete_users",
  MANAGE_GRADES: "manage_grades",
  VIEW_LOGS: "view_logs",
};

// Liste des permissions qui donnent accès au panel Admin
export const ADMIN_PANEL_PERMISSIONS = [
  PERMISSIONS.MANAGE_USERS,
  PERMISSIONS.DELETE_USERS,
  PERMISSIONS.MANAGE_GRADES,
  PERMISSIONS.VIEW_LOGS,
];

// Grade niveau développeur (accès total)
export const DEV_GRADE_LEVEL = 99;

// Niveau minimum pour être considéré admin
export const ADMIN_GRADE_LEVEL = 10;

/**
 * Vérifie si un utilisateur possède une permission spécifique
 * @param {object} user - Objet utilisateur
 * @param {string} permission - Clé de permission à vérifier
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // Grade Développeur = Accès total
  if (user.grade_level === DEV_GRADE_LEVEL) return true;
  
  // Admin global a accès à tout
  if (user.is_admin) return true;
  
  // Vérification des permissions granulaires
  const perms = user.grade_permissions || {};
  return perms[permission] === true;
};

/**
 * Vérifie si un utilisateur a au moins une des permissions listées
 * @param {object} user - Objet utilisateur
 * @param {string[]} permissions - Liste des permissions
 * @returns {boolean}
 */
export const hasAnyPermission = (user, permissions) => {
  if (!user) return false;
  
  // Grade Développeur ou Admin = Accès total
  if (user.grade_level === DEV_GRADE_LEVEL || user.is_admin) return true;
  
  return permissions.some(perm => hasPermission(user, perm));
};

/**
 * Vérifie si un utilisateur a toutes les permissions listées
 * @param {object} user - Objet utilisateur
 * @param {string[]} permissions - Liste des permissions
 * @returns {boolean}
 */
export const hasAllPermissions = (user, permissions) => {
  if (!user) return false;
  
  // Grade Développeur ou Admin = Accès total
  if (user.grade_level === DEV_GRADE_LEVEL || user.is_admin) return true;
  
  return permissions.every(perm => hasPermission(user, perm));
};

/**
 * Vérifie si un utilisateur est administrateur (global ou par niveau de grade)
 * @param {object} user - Objet utilisateur
 * @returns {boolean}
 */
export const isUserAdmin = (user) => {
  if (!user) return false;
  
  return (
    user.grade_level === DEV_GRADE_LEVEL ||
    user.is_admin === true ||
    user.grade_level >= ADMIN_GRADE_LEVEL
  );
};

/**
 * Vérifie si un utilisateur peut accéder au panel d'administration
 * @param {object} user - Objet utilisateur
 * @returns {boolean}
 */
export const canAccessAdminPanel = (user) => {
  if (!user) return false;
  
  // Admin global ou développeur
  if (isUserAdmin(user)) return true;
  
  // Ou a au moins une permission d'admin
  return hasAnyPermission(user, ADMIN_PANEL_PERMISSIONS);
};

/**
 * Récupère la liste des permissions qu'un utilisateur possède pour l'admin panel
 * @param {object} user - Objet utilisateur
 * @returns {string[]}
 */
export const getAdminPermissions = (user) => {
  if (!user) return [];
  
  // Admin global a tout
  if (isUserAdmin(user)) {
    return [...ADMIN_PANEL_PERMISSIONS];
  }
  
  // Sinon, filtrer les permissions disponibles
  return ADMIN_PANEL_PERMISSIONS.filter(perm => hasPermission(user, perm));
};

/**
 * Liste des permissions avec leurs labels pour l'affichage
 */
export const PERMISSIONS_LIST = [
  { key: PERMISSIONS.ACCESS_DASHBOARD, label: "Accès MDT", category: "base" },
  { key: PERMISSIONS.VIEW_PATIENTS, label: "Voir Patients", category: "patients" },
  { key: PERMISSIONS.CREATE_PATIENTS, label: "Créer/Modif Patients", category: "patients" },
  { key: PERMISSIONS.DELETE_PATIENTS, label: "Supprimer Patients", category: "patients" },
  { key: PERMISSIONS.CREATE_REPORTS, label: "Créer Rapports", category: "reports" },
  { key: PERMISSIONS.DELETE_REPORTS, label: "Supprimer Rapports", category: "reports" },
  { key: PERMISSIONS.MANAGE_APPOINTMENTS, label: "Gérer RDV", category: "appointments" },
  { key: PERMISSIONS.DELETE_APPOINTMENTS, label: "Supprimer RDV", category: "appointments" },
  { key: PERMISSIONS.VIEW_ROSTER, label: "Voir Effectifs", category: "roster" },
  { key: PERMISSIONS.MANAGE_USERS, label: "Gérer Utilisateurs", category: "admin" },
  { key: PERMISSIONS.DELETE_USERS, label: "Supprimer Utilisateurs", category: "admin" },
  { key: PERMISSIONS.MANAGE_GRADES, label: "Gérer Grades", category: "admin" },
  { key: PERMISSIONS.VIEW_LOGS, label: "Voir Logs/Stats", category: "admin" },
];

export default {
  PERMISSIONS,
  PERMISSIONS_LIST,
  ADMIN_PANEL_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isUserAdmin,
  canAccessAdminPanel,
  getAdminPermissions,
};
