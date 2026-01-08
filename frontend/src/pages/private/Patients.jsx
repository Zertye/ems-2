/**
 * Patients - Gestion des dossiers patients
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit2, Trash2, Eye, User, Camera, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../utils/api";
import { PERMISSIONS } from "../../utils/permissions";
import { Layout, PageHeader, InputField, SelectField, TextArea } from "../../components";

export function Patients() {
  const { hasPerm } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    first_name: "",
    last_name: "",
    phone: "",
    gender: "M",
    insurance_number: "",
    chronic_conditions: "",
    date_of_birth: "",
    photo: null,
  };
  const [form, setForm] = useState(initialForm);

  // Charger les patients
  const loadPatients = async () => {
    if (!hasPerm(PERMISSIONS.VIEW_PATIENTS)) return;

    setLoading(true);
    try {
      const response = await apiFetch(`/api/patients?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setPatients(Array.isArray(data?.patients) ? data.patients : []);
      }
    } catch (error) {
      console.error("Erreur chargement patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search]);

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("first_name", form.first_name);
    formData.append("last_name", form.last_name);
    formData.append("date_of_birth", form.date_of_birth);
    formData.append("gender", form.gender);
    formData.append("phone", form.phone);
    formData.append("insurance_number", form.insurance_number);
    formData.append("chronic_conditions", form.chronic_conditions);

    if (form.photo instanceof File) {
      formData.append("photo", form.photo);
    }

    const url = editingId ? `/api/patients/${editingId}` : "/api/patients";
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await apiFetch(url, { method, body: formData });
      if (response.ok) {
        setShowModal(false);
        setEditingId(null);
        setForm(initialForm);
        loadPatients();
      }
    } catch (error) {
      console.error("Erreur sauvegarde patient:", error);
    }
  };

  // Éditer un patient
  const handleEdit = (patient) => {
    setEditingId(patient.id);
    setForm({
      ...patient,
      date_of_birth: patient.date_of_birth?.split("T")[0] || "",
      photo: patient.photo,
    });
    setShowModal(true);
  };

  // Supprimer un patient
  const handleDelete = async (id, force = false) => {
    if (!force && !window.confirm("Supprimer ce dossier patient ?")) return;

    const url = force ? `/api/patients/${id}?force=true` : `/api/patients/${id}`;

    try {
      const response = await apiFetch(url, { method: "DELETE" });

      if (response.ok) {
        loadPatients();
      } else {
        const data = await response.json();
        if (response.status === 409 && data.requireForce) {
          if (
            window.confirm(
              `ATTENTION : Ce patient possède ${data.count} rapports médicaux.\nVoulez-vous supprimer le patient ET tous ses rapports ?\nCette action est irréversible.`
            )
          ) {
            handleDelete(id, true);
          }
        } else {
          alert(data.error || "Erreur lors de la suppression");
        }
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  // Ouvrir le modal pour nouveau patient
  const openNewModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  return (
    <Layout>
      <PageHeader
        title="Dossiers Patients"
        subtitle="Gestion des dossiers médicaux"
        action={
          hasPerm(PERMISSIONS.CREATE_PATIENTS) && (
            <button onClick={openNewModal} className="btn-primary">
              <Plus size={18} className="mr-2" /> Nouveau patient
            </button>
          )
        }
      />

      <div className="card">
        {/* Barre de recherche */}
        <div className="p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="input-field pl-10"
              placeholder="Rechercher un patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Patient</th>
                <th className="table-header">N° Identité</th>
                <th className="table-header">Contact</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-400">
                    Chargement...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-400 font-medium">
                    Aucun patient trouvé
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 ring-2 ring-slate-300">
                          {p.photo ? (
                            <img src={p.photo} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white">
                            {p.last_name} {p.first_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {p.date_of_birth
                              ? new Date(p.date_of_birth).toLocaleDateString("fr-FR")
                              : "Date inconnue"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-sm font-semibold text-red-600 dark:text-red-400">
                      {p.insurance_number || "—"}
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {p.phone || "N/A"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {p.gender === "M" ? "Homme" : p.gender === "F" ? "Femme" : "Autre"}
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/reports?patient_id=${p.id}`)}
                          title="Voir Rapports"
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                        {hasPerm(PERMISSIONS.CREATE_PATIENTS) && (
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {hasPerm(PERMISSIONS.DELETE_PATIENTS) && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl animate-in border dark:border-slate-700">
            <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                {editingId ? "Modifier le patient" : "Nouveau patient"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-white rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Photo */}
              <div className="flex justify-center">
                <div
                  className="w-24 h-24 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {form.photo instanceof File ? (
                    <img
                      src={URL.createObjectURL(form.photo)}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : form.photo ? (
                    <img src={form.photo} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <User size={40} className="text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, photo: e.target.files[0] })}
                />
              </div>

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
                  label="Date de naissance"
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                />
                <SelectField
                  label="Genre"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                  <option value="X">Autre</option>
                </SelectField>
              </div>

              <InputField
                label="N° Identité"
                value={form.insurance_number}
                onChange={(e) => setForm({ ...form, insurance_number: e.target.value })}
                required
              />

              <InputField
                label="Téléphone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <TextArea
                label="Antécédents / Notes"
                value={form.chronic_conditions}
                onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })}
              />

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Patients;
