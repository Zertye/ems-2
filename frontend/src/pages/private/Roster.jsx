/**
 * Roster - Effectifs du personnel
 */
import { useState, useEffect } from "react";
import { Users, ShieldAlert } from "lucide-react";
import { apiFetch } from "../../utils/api";
import { Layout, PageHeader } from "../../components";

// Ordre des catégories
const CATEGORY_ORDER = [
  "Direction M.R.S.A",
  "Chef de service",
  "Medecine",
  "Paramedical",
  "Système",
  "Autres",
];

export function Roster() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoster = async () => {
      setLoading(true);
      try {
        const response = await apiFetch("/api/users/roster");
        if (response.ok) {
          const data = await response.json();
          setMembers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Erreur chargement effectifs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRoster();
  }, []);

  // Grouper par catégorie
  const grouped = members.reduce((acc, m) => {
    const cat = m.grade_category || "Autres";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  // Trier les catégories
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const idxA = CATEGORY_ORDER.indexOf(a);
    const idxB = CATEGORY_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  if (loading) {
    return (
      <Layout>
        <PageHeader title="Effectifs" subtitle="Hiérarchie du personnel" />
        <div className="text-center text-slate-400 py-12">Chargement...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Effectifs" subtitle="Hiérarchie du personnel" />

      <div className="space-y-8">
        {sortedCategories.map((cat) => {
          const usersInCat = grouped[cat];
          // Trier par niveau décroissant
          usersInCat.sort((a, b) => b.grade_level - a.grade_level);

          return (
            <div key={cat}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b dark:border-slate-700 pb-2 flex items-center gap-2">
                {cat === "Direction M.R.S.A" ? <ShieldAlert size={16} /> : <Users size={16} />}
                {cat}
              </h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usersInCat.map((m) => (
                  <div
                    key={m.id}
                    className="card p-5 flex items-center gap-4 hover:shadow-lg transition-shadow border-l-4"
                    style={{ borderLeftColor: m.grade_color }}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden ring-2 ring-slate-300">
                      {m.profile_picture ? (
                        <img src={m.profile_picture} className="w-full h-full object-cover" alt="" />
                      ) : (
                        m.username?.[0]?.toUpperCase() || "?"
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-slate-800 dark:text-white font-semibold truncate">
                        {m.first_name || m.username} {m.last_name}
                      </h4>
                      <div className="text-sm font-bold" style={{ color: m.grade_color }}>
                        {m.grade_name}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold">
                        {m.badge_number}
                      </div>
                      <div className="text-slate-400 text-xs">{m.phone || "—"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {members.length === 0 && (
          <p className="text-center text-slate-400 py-12 font-medium">Aucun membre trouvé</p>
        )}
      </div>
    </Layout>
  );
}

export default Roster;
