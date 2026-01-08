/**
 * Appointments - Gestion des rendez-vous
 */
import { useState, useEffect } from "react";
import { Phone, MessageSquare, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../utils/api";
import { PERMISSIONS } from "../../utils/permissions";
import { Layout, PageHeader } from "../../components";

export function Appointments() {
  const { user, hasPerm, isAdmin } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Charger les rendez-vous
  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/appointments");
      if (response.ok) {
        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erreur chargement RDV:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Actions sur les RDV
  const handleStatus = async (id, action, note = "") => {
    let url = `/api/appointments/${id}/${action}`;
    const options = { method: action === "delete" ? "DELETE" : "POST" };

    if (action === "complete") {
      options.body = JSON.stringify({ completion_notes: note });
    }
    if (action === "delete") {
      url = `/api/appointments/${id}`;
    }

    try {
      await apiFetch(url, options);
      loadAppointments();
    } catch (error) {
      console.error("Erreur action RDV:", error);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Supprimer définitivement ce rendez-vous ?")) {
      handleStatus(id, "delete");
    }
  };

  // Filtrer les RDV
  const filtered = appointments.filter((a) => {
    if (filter === "pending") return a.status === "pending";
    if (filter === "my") return a.assigned_medic_id === user?.id;
    return true;
  });

  // Badge de statut
  const StatusBadge = ({ status }) => {
    const styles = {
      pending: "badge badge-yellow",
      assigned: "badge badge-blue",
      completed: "badge badge-green",
      cancelled: "badge badge-red",
    };
    const labels = {
      pending: "En attente",
      assigned: "Assigné",
      completed: "Terminé",
      cancelled: "Annulé",
    };
    return <span className={styles[status] || styles.pending}>{labels[status] || status}</span>;
  };

  return (
    <Layout>
      <PageHeader title="Rendez-vous" subtitle="Planning des consultations" />

      {/* Filtres */}
      <div className="flex gap-1 mb-5 card p-1.5 w-fit">
        {[
          { id: "all", label: "Tous" },
          { id: "pending", label: "En attente" },
          { id: "my", label: "Mes RDV" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === f.id
                ? "bg-red-600 text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste des RDV */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Chargement...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div key={a.id} className="card p-5 relative group hover:shadow-lg transition-shadow">
              {/* Bouton supprimer (admin) */}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}

              {/* Info patient */}
              <div className="mb-4">
                <StatusBadge status={a.status} />
                <h3 className="text-slate-800 dark:text-white font-bold text-lg mt-2">
                  {a.patient_name}
                </h3>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Phone size={14} /> {a.patient_phone || "N/A"}
                  </div>
                  {a.patient_discord && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium">
                      <MessageSquare size={14} /> {a.patient_discord}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-300 mb-4 border dark:border-slate-700">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">
                  {a.appointment_type}
                </p>
                {a.description || "Pas de description"}
              </div>

              {/* Médecin assigné */}
              {a.assigned_medic_id && (
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xs">
                    {a.medic_first_name?.[0]}
                  </div>
                  {a.medic_first_name} {a.medic_last_name}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t dark:border-slate-700">
                {a.status === "pending" && hasPerm(PERMISSIONS.MANAGE_APPOINTMENTS) && (
                  <button
                    onClick={() => handleStatus(a.id, "assign")}
                    className="btn-primary flex-1 text-sm"
                  >
                    Prendre en charge
                  </button>
                )}
                {a.status === "assigned" && a.assigned_medic_id === user?.id && (
                  <button
                    onClick={() => handleStatus(a.id, "complete", "Terminé")}
                    className="btn-success flex-1 text-sm"
                  >
                    Terminer
                  </button>
                )}
                {a.status !== "completed" && a.status !== "cancelled" && (
                  <button
                    onClick={() => handleStatus(a.id, "cancel")}
                    className="btn-danger flex-1 text-sm"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-slate-400 col-span-3 text-center py-12 font-medium">
              Aucun rendez-vous
            </p>
          )}
        </div>
      )}
    </Layout>
  );
}

export default Appointments;
