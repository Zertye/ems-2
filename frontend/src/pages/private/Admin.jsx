/**
 * Admin - Panel d'administration
 */
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  Users,
  ShieldAlert,
  Activity,
  BarChart3,
  ScrollText,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  RefreshCw,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../utils/api";
import { PERMISSIONS, PERMISSIONS_LIST } from "../../utils/permissions";
import { Layout, PageHeader, StatCard, InputField, SelectField } from "../../components";

export function Admin() {
  const { user, isAdmin, hasPerm, canAccessAdmin } = useAuth();

  // États
  const [activeTab, setActiveTab] = useState("users");
  const [usersList, setUsersList] = useState([]);
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsLimit, setLogsLimit] = useState(50);
  const [performance, setPerformance] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Modal utilisateur
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    id: null,
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    badge_number: "",
    grade_id: "",
    visible_grade_id: "",
  });

  // Charger les données admin de base
  const loadAdminData = async () => {
    try {
      // Stats globales (seulement si admin complet)
      if (isAdmin) {
        const statsRes = await apiFetch("/api/admin/stats");
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      }

      // Liste des utilisateurs (si permission)
      if (hasPerm(PERMISSIONS.MANAGE_USERS) || isAdmin) {
        const usersRes = await apiFetch("/api/admin/users");
        if (usersRes.ok) {
          setUsersList(await usersRes.json());
        }
      }

      // Grades (si permission)
      if (hasPerm(PERMISSIONS.MANAGE_GRADES) || isAdmin) {
        const gradesRes = await apiFetch("/api/admin/grades");
        if (gradesRes.ok) {
          setGrades(await gradesRes.json());
        }
      }
    } catch (error) {
      console.error("Erreur chargement données admin:", error);
    }
  };

  // Charger les logs
  const loadLogs = async () => {
    if (!hasPerm(PERMISSIONS.VIEW_LOGS) && !isAdmin) return;

    setLogsLoading(true);
    try {
      const response = await apiFetch(`/api/admin/logs?limit=${logsLimit}`);
      if (response.ok) {
        setLogs(await response.json());
      }
    } catch (error) {
      console.error("Erreur chargement logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  // Charger les performances
  const loadPerformance = async () => {
    if (!hasPerm(PERMISSIONS.VIEW_LOGS) && !isAdmin) return;

    setPerformanceLoading(true);
    try {
      const response = await apiFetch("/api/admin/performance");
      if (response.ok) {
        setPerformance(await response.json());
      }
    } catch (error) {
      console.error("Erreur chargement performance:", error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    if (canAccessAdmin) {
      loadAdminData();
    }
  }, [canAccessAdmin]);

  // Charger logs/performance selon l'onglet
  useEffect(() => {
    if (activeTab === "logs") {
      loadLogs();
    }
  }, [activeTab, logsLimit]);

  useEffect(() => {
    if (activeTab === "performance") {
      loadPerformance();
    }
  }, [activeTab]);

  // Redirection si pas accès
  if (!canAccessAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Toggle permission d'un grade
  const togglePermission = async (grade, perm) => {
    const newPerms = { ...grade.permissions, [perm]: !grade.permissions?.[perm] };
    const updatedGrades = grades.map((g) =>
      g.id === grade.id ? { ...g, permissions: newPerms } : g
    );
    setGrades(updatedGrades);

    try {
      await apiFetch(`/api/admin/grades/${grade.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...grade, permissions: newPerms }),
      });
    } catch (error) {
      console.error("Erreur mise à jour permissions:", error);
    }
  };

  // Soumettre formulaire utilisateur
  const handleUserSubmit = async (e) => {
    e.preventDefault();

    const url = userForm.id ? `/api/admin/users/${userForm.id}` : "/api/admin/users";
    const method = userForm.id ? "PUT" : "POST";

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        setShowUserModal(false);
        loadAdminData();
      } else {
        const data = await response.json();
        alert(data.error || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur sauvegarde utilisateur:", error);
    }
  };

  // Supprimer utilisateur
  const deleteUser = async (id) => {
    if (!window.confirm("Supprimer définitivement cet utilisateur ?")) return;

    try {
      const response = await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (response.ok) {
        loadAdminData();
      } else {
        const data = await response.json();
        alert(data.error || "Erreur");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  // Éditer utilisateur
  const editUser = (u) => {
    setUserForm({
      id: u.id,
      username: u.username,
      password: "",
      first_name: u.first_name,
      last_name: u.last_name,
      badge_number: u.badge_number,
      grade_id: u.grade_id,
      visible_grade_id: u.visible_grade_id || "",
    });
    setShowUserModal(true);
  };

  // Nouveau utilisateur
  const newUser = () => {
    setUserForm({
      id: null,
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      badge_number: "",
      grade_id: "",
      visible_grade_id: "",
    });
    setShowUserModal(true);
  };

  // Formater action en badge
  const getActionBadge = (action) => {
    const actionColors = {
      CREATE_USER: "badge-green",
      UPDATE_USER: "badge-blue",
      DELETE_USER: "badge-red",
      CREATE_REPORT: "badge-green",
      DELETE_REPORT: "badge-red",
      CREATE_GRADE: "badge-green",
      UPDATE_GRADE: "badge-blue",
      DELETE_GRADE: "badge-red",
      CREATE_PATIENT: "badge-green",
      DELETE_PATIENT: "badge-red",
    };
    return actionColors[action] || "badge-yellow";
  };

  // Formater action en texte
  const formatAction = (action) => {
    const actionLabels = {
      CREATE_USER: "Création utilisateur",
      UPDATE_USER: "Modification utilisateur",
      DELETE_USER: "Suppression utilisateur",
      CREATE_REPORT: "Création rapport",
      DELETE_REPORT: "Suppression rapport",
      CREATE_GRADE: "Création grade",
      UPDATE_GRADE: "Modification grade",
      DELETE_GRADE: "Suppression grade",
      CREATE_PATIENT: "Création patient",
      DELETE_PATIENT: "Suppression patient",
    };
    return actionLabels[action] || action;
  };

  // Configuration des onglets (conditionnel selon permissions)
  const tabs = [];

  if (hasPerm(PERMISSIONS.MANAGE_USERS) || isAdmin) {
    tabs.push({ id: "users", label: "Utilisateurs", icon: Users });
  }
  if (hasPerm(PERMISSIONS.MANAGE_GRADES) || isAdmin) {
    tabs.push({ id: "grades", label: "Grades", icon: ShieldAlert });
  }
  if (isAdmin) {
    tabs.push({ id: "stats", label: "Statistiques", icon: Activity });
  }
  if (hasPerm(PERMISSIONS.VIEW_LOGS) || isAdmin) {
    tabs.push({ id: "performance", label: "Performance", icon: BarChart3 });
    tabs.push({ id: "logs", label: "Logs", icon: ScrollText });
  }

  // S'assurer qu'on a un onglet par défaut valide
  if (tabs.length > 0 && !tabs.find((t) => t.id === activeTab)) {
    setActiveTab(tabs[0].id);
  }

  return (
    <Layout>
      <PageHeader title="Administration" subtitle="Gestion du système" />

      {/* Onglets */}
      <div className="card mb-6">
        <div className="flex border-b dark:border-slate-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 text-sm font-bold border-b-2 -mb-px transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-red-600 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === "users" && (hasPerm(PERMISSIONS.MANAGE_USERS) || isAdmin) && (
        <UsersTab
          users={usersList}
          grades={grades}
          currentUser={user}
          onEdit={editUser}
          onDelete={deleteUser}
          onNew={newUser}
          hasPerm={hasPerm}
        />
      )}

      {activeTab === "grades" && (hasPerm(PERMISSIONS.MANAGE_GRADES) || isAdmin) && (
        <GradesTab grades={grades} onTogglePermission={togglePermission} />
      )}

      {activeTab === "stats" && isAdmin && <StatsTab stats={stats} />}

      {activeTab === "performance" && (hasPerm(PERMISSIONS.VIEW_LOGS) || isAdmin) && (
        <PerformanceTab
          performance={performance}
          loading={performanceLoading}
          onRefresh={loadPerformance}
        />
      )}

      {activeTab === "logs" && (hasPerm(PERMISSIONS.VIEW_LOGS) || isAdmin) && (
        <LogsTab
          logs={logs}
          loading={logsLoading}
          limit={logsLimit}
          onLimitChange={setLogsLimit}
          onRefresh={loadLogs}
          getActionBadge={getActionBadge}
          formatAction={formatAction}
        />
      )}

      {/* Modal utilisateur */}
      {showUserModal && (
        <UserModal
          form={userForm}
          setForm={setUserForm}
          grades={grades}
          onSubmit={handleUserSubmit}
          onClose={() => setShowUserModal(false)}
        />
      )}
    </Layout>
  );
}

// Sous-composant: Onglet Utilisateurs
function UsersTab({ users, grades, currentUser, onEdit, onDelete, onNew, hasPerm }) {
  return (
    <div className="card">
      <div className="p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end rounded-t-xl">
        <button onClick={onNew} className="btn-primary">
          <UserPlus size={18} className="mr-2" /> Créer
        </button>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-header">Utilisateur</th>
            <th className="table-header">Badge</th>
            <th className="table-header">Grade (Réel)</th>
            <th className="table-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="table-row">
              <td className="table-cell">
                <div className="font-semibold text-slate-800 dark:text-white">
                  {u.first_name} {u.last_name}
                </div>
                <div className="text-xs text-slate-400 font-mono">@{u.username}</div>
              </td>
              <td className="table-cell text-slate-600 dark:text-slate-300 font-mono text-sm font-semibold">
                {u.badge_number}
              </td>
              <td className="table-cell">
                <span
                  className="badge"
                  style={{
                    backgroundColor: u.grade_color + "25",
                    color: u.grade_color,
                    borderColor: u.grade_color,
                  }}
                >
                  {u.grade_name || "—"}
                </span>
                {u.visible_grade_id && (
                  <span className="ml-2 text-xs text-slate-400 italic">(Masqué)</span>
                )}
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(u)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  {hasPerm(PERMISSIONS.DELETE_USERS) && u.id !== currentUser?.id && (
                    <button
                      onClick={() => onDelete(u.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Sous-composant: Onglet Grades
function GradesTab({ grades, onTogglePermission }) {
  return (
    <div className="space-y-4">
      {grades.map((g) => (
        <div key={g.id} className="card p-5">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b dark:border-slate-700">
            <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: g.color }} />
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{g.name}</h3>
              <p className="text-slate-500 text-sm">
                {g.category} · Niveau {g.level}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PERMISSIONS_LIST.map((p) => (
              <label
                key={p.key}
                className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    g.permissions?.[p.key]
                      ? "bg-red-600 border-red-600"
                      : "border-slate-300 dark:border-slate-600 group-hover:border-slate-400"
                  }`}
                >
                  {g.permissions?.[p.key] && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={!!g.permissions?.[p.key]}
                  onChange={() => onTogglePermission(g, p.key)}
                />
                <span
                  className={`text-sm font-medium ${
                    g.permissions?.[p.key] ? "text-slate-800 dark:text-white" : "text-slate-500"
                  }`}
                >
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Sous-composant: Onglet Stats
function StatsTab({ stats }) {
  if (!stats) {
    return <div className="text-center text-slate-400 py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Patients" value={stats.patients?.total || 0} icon={Users} color="blue" />
        <StatCard label="Rapports" value={stats.reports?.total || 0} icon={Activity} color="green" />
        <StatCard
          label="RDV en attente"
          value={stats.appointments?.pending || 0}
          icon={Activity}
          color="yellow"
        />
        <StatCard label="Effectif" value={stats.users?.total || 0} icon={Activity} color="blue" />
      </div>

      {/* Distribution des grades */}
      {stats.gradeDistribution?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
            Répartition par grade
          </h3>
          <div className="space-y-3">
            {stats.gradeDistribution.map((g, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                  {g.name}
                </div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        (parseInt(g.count) /
                          Math.max(...stats.gradeDistribution.map((x) => parseInt(x.count)), 1)) *
                          100,
                        10
                      )}%`,
                      backgroundColor: g.color || "#dc2626",
                    }}
                  >
                    <span className="text-white text-xs font-bold">{g.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Sous-composant: Onglet Performance
function PerformanceTab({ performance, loading, onRefresh }) {
  return (
    <div className="card">
      <div className="p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-red-600" />
            Performance du personnel
          </h3>
          <p className="text-sm text-slate-500 mt-1">Statistiques d'activité par membre</p>
        </div>
        <button onClick={onRefresh} className="btn-secondary">
          <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3"></div>
          Chargement...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Membre</th>
                <th className="table-header text-center">Rapports</th>
                <th className="table-header text-center">Patients créés</th>
                <th className="table-header text-center">RDV terminés</th>
                <th className="table-header text-center">Actions totales</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((p, i) => (
                <tr key={p.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: p.grade_color || "#64748b" }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-white">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="text-xs" style={{ color: p.grade_color }}>
                          {p.grade_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <span
                      className={`font-mono font-bold text-lg ${
                        parseInt(p.reports_count) > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      {p.reports_count}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <span
                      className={`font-mono font-bold text-lg ${
                        parseInt(p.patients_created) > 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-400"
                      }`}
                    >
                      {p.patients_created}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <span
                      className={`font-mono font-bold text-lg ${
                        parseInt(p.appointments_completed) > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-slate-400"
                      }`}
                    >
                      {p.appointments_completed}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {p.total_actions}
                    </span>
                  </td>
                </tr>
              ))}
              {performance.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-400 font-medium">
                    Aucune donnée de performance
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Sous-composant: Onglet Logs
function LogsTab({ logs, loading, limit, onLimitChange, onRefresh, getActionBadge, formatAction }) {
  return (
    <div className="card">
      <div className="p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ScrollText size={20} className="text-amber-600" />
            Journal d'activité
          </h3>
          <p className="text-sm text-slate-500 mt-1">Historique des actions système</p>
        </div>
        <div className="flex items-center gap-3">
          <SelectField
            value={limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value))}
            className="w-auto"
          >
            <option value="25">25 derniers</option>
            <option value="50">50 derniers</option>
            <option value="100">100 derniers</option>
            <option value="200">200 derniers</option>
          </SelectField>
          <button onClick={onRefresh} className="btn-secondary">
            <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} /> Actualiser
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-3"></div>
          Chargement...
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10">
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Utilisateur</th>
                <th className="table-header">Action</th>
                <th className="table-header">Détails</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id || i} className="table-row">
                  <td className="table-cell whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {new Date(log.created_at).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="table-cell">
                    {log.first_name ? (
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-white">
                          {log.first_name} {log.last_name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{log.badge_number}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Système</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getActionBadge(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div
                      className="text-sm text-slate-600 dark:text-slate-300 max-w-md truncate"
                      title={log.details}
                    >
                      {log.details}
                    </div>
                    {log.target_id && (
                      <div className="text-xs text-slate-400 font-mono">ID: {log.target_id}</div>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-400 font-medium">
                    Aucun log enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Sous-composant: Modal Utilisateur
function UserModal({ form, setForm, grades, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl animate-in border dark:border-slate-700">
        <div className="p-5 border-b dark:border-slate-700">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">
            {form.id ? "Modifier" : "Créer"} utilisateur
          </h2>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Prénom"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
            />
            <InputField
              label="Nom"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Identifiant"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
            <InputField
              label="Matricule"
              value={form.badge_number}
              onChange={(e) => setForm({ ...form, badge_number: e.target.value })}
            />
          </div>
          <InputField
            label="Mot de passe"
            type="password"
            placeholder={form.id ? "Laisser vide si inchangé" : ""}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!form.id}
          />

          <SelectField
            label="Grade (Permissions)"
            value={form.grade_id}
            onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
            required
          >
            <option value="">-- Sélectionner --</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </SelectField>

          <div className="border-t dark:border-slate-700 pt-3 mt-1">
            <p className="label text-red-600 dark:text-red-400 mb-2">Options Avancées (RP)</p>
            <SelectField
              label="Grade Visible (Masquer le vrai grade)"
              value={form.visible_grade_id}
              onChange={(e) => setForm({ ...form, visible_grade_id: e.target.value })}
            >
              <option value="">-- Aucun (Afficher le vrai grade) --</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </SelectField>
            <p className="text-xs text-slate-500 mt-1">
              Si sélectionné, ce grade sera affiché partout à la place du grade réel. Les permissions
              restent celles du grade réel.
            </p>
          </div>

          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" className="btn-primary flex-1">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Admin;
