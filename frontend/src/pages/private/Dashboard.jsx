/**
 * Dashboard - Tableau de bord principal
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Activity,
  Clock,
  ShieldAlert,
  FileText,
  FilePlus,
  UserPlus,
  Stethoscope,
  ClipboardList,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../utils/api";
import { Layout, StatCard, PageHeader } from "../../components";

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [adminStats, setAdminStats] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      
      try {
        // Charger les stats personnelles (pour tout le monde)
        const myStatsRes = await apiFetch("/api/users/me/stats");
        if (myStatsRes.ok) {
          setMyStats(await myStatsRes.json());
        }

        // Charger les stats admin si autorisé
        if (isAdmin) {
          const adminRes = await apiFetch("/api/admin/stats");
          if (adminRes.ok) {
            setAdminStats(await adminRes.json());
          }
        }
      } catch (error) {
        console.error("Erreur chargement stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isAdmin]);

  return (
    <Layout>
      <PageHeader
        title={`Bonjour, ${user?.first_name || user?.username}`}
        subtitle={`${user?.grade_name || "Personnel médical"} · Badge ${user?.badge_number || "N/A"}`}
      />

      {/* Section 1: Statistiques Personnelles */}
      <div className="mb-8">
        <h2 className="section-title text-slate-500 mb-4 uppercase tracking-wider text-xs font-bold pl-1">
          Ma Performance
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Mes Rapports"
            value={loading ? "..." : (myStats?.my_reports ?? 0)}
            icon={FileText}
            color="blue"
          />
          <StatCard
            label="Patients Créés"
            value={loading ? "..." : (myStats?.my_patients ?? 0)}
            icon={UserPlus}
            color="green"
          />
          <StatCard
            label="RDV Terminés"
            value={loading ? "..." : (myStats?.my_appointments ?? 0)}
            icon={CheckCircle}
            color="yellow"
          />
          <div className="card p-5 border-l-4 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center">
            <p className="text-slate-500 text-sm font-medium mb-1">Status Actuel</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-bold text-slate-700 dark:text-slate-200">En Service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Stats Globales (Admin) */}
      {isAdmin && adminStats && (
        <div className="mb-8">
          <h2 className="section-title text-slate-500 mb-4 uppercase tracking-wider text-xs font-bold pl-1">
            Vue Globale (Admin)
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Patients"
              value={adminStats?.patients?.total ?? "—"}
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Total Rapports"
              value={adminStats?.reports?.total ?? "—"}
              icon={Activity}
              color="green"
            />
            <StatCard
              label="RDV Attente"
              value={adminStats?.appointments?.pending ?? "—"}
              icon={Clock}
              color="yellow"
            />
            <StatCard
              label="Effectif Total"
              value={adminStats?.users?.total ?? "—"}
              icon={ShieldAlert}
              color="red"
            />
          </div>
        </div>
      )}

      {/* Section 3: Accès rapide + Activité récente */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Accès rapide */}
        <div className="lg:col-span-2">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Accès rapide</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              to="/reports"
              className="card p-6 hover:shadow-xl transition-all group border-l-4 border-emerald-500 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <FilePlus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-1">Nouveau Rapport</h3>
                <p className="text-slate-500 text-sm">Créer un rapport d'intervention</p>
              </div>
              <ChevronRight
                size={20}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500"
              />
            </Link>

            <Link
              to="/patients"
              className="card p-6 hover:shadow-xl transition-all group border-l-4 border-red-500 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-1">Nouveau Patient</h3>
                <p className="text-slate-500 text-sm">Enregistrer un civil</p>
              </div>
              <ChevronRight
                size={20}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
              />
            </Link>

            <Link
              to="/diagnosis"
              className="card p-6 hover:shadow-xl transition-all group border-l-4 border-amber-500 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Stethoscope size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-1">Diagnostic</h3>
                <p className="text-slate-500 text-sm">Assistant médical IA</p>
              </div>
              <ChevronRight
                size={20}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-amber-500"
              />
            </Link>

            <Link
              to="/appointments"
              className="card p-6 hover:shadow-xl transition-all group border-l-4 border-slate-400 dark:border-slate-500 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform">
                <ClipboardList size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-1">Rendez-vous</h3>
                <p className="text-slate-500 text-sm">Gérer le planning</p>
              </div>
              <ChevronRight
                size={20}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-slate-500"
              />
            </Link>
          </div>
        </div>

        {/* Activité récente */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Derniers Rapports</h2>
            <Link to="/reports" className="text-xs font-bold text-red-600 hover:underline">
              TOUT VOIR
            </Link>
          </div>
          <div className="space-y-3">
            {myStats?.recent_activity?.length > 0 ? (
              myStats.recent_activity.map((r) => (
                <div
                  key={r.id}
                  className="card p-4 flex flex-col gap-1 text-sm border-l-4 border-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-default"
                >
                  <div className="font-bold text-slate-800 dark:text-white text-base">
                    {r.first_name} {r.last_name}
                  </div>
                  <div className="text-slate-500 font-medium">{r.diagnosis}</div>
                  <div className="text-xs text-slate-400 text-right mt-1 border-t dark:border-slate-700 pt-2">
                    {new Date(r.incident_date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-6 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 border-dashed">
                Aucune activité récente.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
