/**
 * Reports - Gestion des rapports médicaux
 */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FilePlus, Trash2, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../utils/api";
import { PERMISSIONS } from "../../utils/permissions";
import { Layout, PageHeader, SelectField, TextArea } from "../../components";

// Liste des services disponibles
const SERVICES_LIST = [
  {
    cat: "Pharmacie",
    items: [
      { n: "Big Heal", p: 150 },
      { n: "Small Heal", p: 100 },
    ],
  },
  {
    cat: "Officine",
    items: [
      { n: "Acide Tranexamique", p: 50 },
      { n: "Céfotaxime", p: 50 },
      { n: "Dexaméthasone", p: 75 },
      { n: "Ribavirine", p: 100 },
    ],
  },
  {
    cat: "Soins & Équipements",
    items: [
      { n: "Bandage", p: 15 },
      { n: "Bandage à la tête", p: 20 },
      { n: "Bandage au bras", p: 15 },
      { n: "Bandage corporel", p: 25 },
      { n: "Diagnostic (T° / Pouls)", p: 150 },
      { n: "Kit médical", p: 400 },
      { n: "Plâtre à la jambe", p: 50 },
      { n: "Réanimation", p: 400 },
      { n: "Scanner", p: 250 },
    ],
  },
  {
    cat: "Divers",
    items: [{ n: "Chambre VIP", p: 500 }],
  },
];

export function Reports() {
  const { hasPerm } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPatientId = queryParams.get("patient_id");

  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterPatientId, setFilterPatientId] = useState(initialPatientId || "");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    patient_id: "",
    disease: "",
    context_notes: "",
    medications: [],
    total_cost: 0,
  });

  // Charger les données
  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les rapports
      let url = "/api/reports";
      if (filterPatientId) url += `?patient_id=${filterPatientId}`;
      
      const reportsRes = await apiFetch(url);
      if (reportsRes.ok) {
        setReports(await reportsRes.json());
      }

      // Charger les patients
      const patientsRes = await apiFetch("/api/patients");
      if (patientsRes.ok) {
        const data = await patientsRes.json();
        setPatients(Array.isArray(data?.patients) ? data.patients : []);
      }

      // Charger les maladies
      const diseasesRes = await apiFetch("/api/reports/diseases");
      if (diseasesRes.ok) {
        setDiseases(await diseasesRes.json());
      }
    } catch (error) {
      console.error("Erreur chargement données:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterPatientId]);

  // Toggle service
  const toggleService = (item) => {
    const exists = form.medications.includes(item.n);
    const newMeds = exists
      ? form.medications.filter((m) => m !== item.n)
      : [...form.medications, item.n];

    // Calculer le coût
    let cost = 0;
    SERVICES_LIST.forEach((c) =>
      c.items.forEach((i) => {
        if (newMeds.includes(i.n)) cost += i.p;
      })
    );

    setForm({ ...form, medications: newMeds, total_cost: cost });
  };

  // Soumettre le rapport
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setShowModal(false);
        setForm({
          patient_id: "",
          disease: "",
          context_notes: "",
          medications: [],
          total_cost: 0,
        });
        loadData();
      }
    } catch (error) {
      console.error("Erreur création rapport:", error);
    }
  };

  // Supprimer un rapport
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rapport ?")) return;

    try {
      const response = await apiFetch(`/api/reports/${id}`, { method: "DELETE" });
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Rapports Médicaux"
        subtitle="Historique des interventions"
        action={
          <div className="flex gap-2">
            {filterPatientId && (
              <button onClick={() => setFilterPatientId("")} className="btn-secondary">
                Voir tout
              </button>
            )}
            {hasPerm(PERMISSIONS.CREATE_REPORTS) && (
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <FilePlus size={18} className="mr-2" /> Nouveau rapport
              </button>
            )}
          </div>
        }
      />

      {/* Liste des rapports */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Chargement...</div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="card p-5 relative group hover:shadow-lg transition-shadow">
              {hasPerm(PERMISSIONS.DELETE_REPORTS) && (
                <button
                  onClick={() => handleDelete(r.id)}
                  className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-slate-800 dark:text-white font-bold text-lg">
                    {r.patient_last_name} {r.patient_first_name}
                  </h3>
                  <div className="text-slate-500 text-sm">
                    ID: <span className="font-mono font-semibold text-red-600 dark:text-red-400">{r.patient_identity_id}</span>{" "}
                    · Dr. {r.medic_first_name} {r.medic_last_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-red-600 dark:text-red-400 font-bold">{r.diagnosis}</div>
                  <div className="text-slate-400 text-sm">
                    {new Date(r.incident_date).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700">
                <div>
                  <span className="label">Contexte</span>
                  <p className="text-slate-600 dark:text-slate-300">{r.notes || "Non précisé"}</p>
                </div>
                <div>
                  <span className="label">Soins & Facture</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium mb-1">
                    {r.medications_given || "Aucun"}
                  </p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-lg">
                    {r.treatment}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <p className="text-center text-slate-400 py-12 font-medium">Aucun rapport</p>
          )}
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col animate-in border dark:border-slate-700">
            <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center flex-shrink-0">
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Nouveau rapport</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 grid lg:grid-cols-2 gap-6">
                {/* Colonne gauche */}
                <div className="space-y-4">
                  <SelectField
                    label="Patient"
                    value={form.patient_id}
                    onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.last_name} {p.first_name} ({p.insurance_number})
                      </option>
                    ))}
                  </SelectField>

                  <SelectField
                    label="Diagnostic"
                    value={form.disease}
                    onChange={(e) => setForm({ ...form, disease: e.target.value })}
                    required
                  >
                    <option value="">-- Sélectionner --</option>
                    {diseases.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </SelectField>

                  <TextArea
                    label="Contexte / Notes"
                    placeholder="Circonstances, observations..."
                    value={form.context_notes}
                    onChange={(e) => setForm({ ...form, context_notes: e.target.value })}
                  />
                </div>

                {/* Colonne droite - Services */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b dark:border-slate-700">
                    <span className="label mb-0">Soins & Services</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xl">
                      {form.total_cost} €
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {SERVICES_LIST.map((cat) => (
                      <div key={cat.cat}>
                        <h4 className="text-slate-500 text-xs font-bold uppercase mb-2">{cat.cat}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {cat.items.map((item) => (
                            <div
                              key={item.n}
                              onClick={() => toggleService(item)}
                              className={`p-3 rounded-lg cursor-pointer border-2 text-sm flex justify-between items-center transition-all ${
                                form.medications.includes(item.n)
                                  ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300 font-medium"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
                              }`}
                            >
                              <span className="truncate">{item.n}</span>
                              <span className="font-mono text-xs font-bold">{item.p}€</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t dark:border-slate-700 flex gap-3 flex-shrink-0 bg-slate-50 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Enregistrer ({form.total_cost}€)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Reports;
