/**
 * PublicBooking - Page de prise de rendez-vous publique
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Send } from "lucide-react";
import { Logo, Watermark, InputField, SelectField, TextArea, ThemeToggle } from "../../components/ui";

export function PublicBooking() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({
    patient_name: "",
    patient_phone: "",
    patient_discord: "",
    appointment_type: "Consultation",
    preferred_date: "",
    preferred_time: "",
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || "Une erreur est survenue");
      }
    } catch (err) {
      console.error("Erreur soumission RDV:", err);
      setError("Erreur de connexion au serveur");
    } finally {
      setSubmitting(false);
    }
  };

  // Écran de confirmation
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative">
        <Watermark />
        <div className="card p-8 max-w-md w-full text-center relative z-10">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
            <CheckCircle size={40} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Demande envoyée
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Votre demande a été transmise. Un membre de l'équipe médicale vous contactera.
          </p>
          <button onClick={() => navigate("/")} className="btn-secondary w-full">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 flex flex-col items-center justify-center relative">
      <Watermark />
      
      <div className="w-full max-w-lg relative z-10">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white text-sm font-medium"
          >
            ← Retour
          </button>
          <ThemeToggle />
        </div>

        <div className="card p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6 pb-5 border-b dark:border-slate-700">
            <div className="w-14 h-14 bg-white rounded-xl border-2 border-slate-200 p-2 flex items-center justify-center shadow">
              <Logo size={44} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                Demande de rendez-vous
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Services Médicaux MRSA
              </p>
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <InputField
                label="Nom & Prénom"
                placeholder="Maurice Latoue"
                value={form.patient_name}
                onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                required
              />
              <InputField
                label="Téléphone"
                placeholder="9387 6735"
                value={form.patient_phone}
                onChange={(e) => setForm({ ...form, patient_phone: e.target.value })}
                required
              />
            </div>

            <InputField
              label="Discord (pour contact)"
              placeholder="zertye._"
              value={form.patient_discord}
              onChange={(e) => setForm({ ...form, patient_discord: e.target.value })}
            />

            <SelectField
              label="Type de rendez-vous"
              value={form.appointment_type}
              onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}
            >
              <option value="Consultation">Consultation Générale</option>
              <option value="Check-up">Check-up Complet</option>
              <option value="Certificat">Certificat Médical / PPA</option>
              <option value="Suivi">Suivi Psychologique</option>
              <option value="Urgence">Urgence Relative</option>
            </SelectField>

            <div className="grid md:grid-cols-2 gap-3">
              <InputField
                label="Date souhaitée"
                type="date"
                value={form.preferred_date}
                onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                required
              />
              <InputField
                label="Heure souhaitée"
                type="time"
                value={form.preferred_time}
                onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                required
              />
            </div>

            <TextArea
              label="Motif"
              placeholder="Décrivez brièvement le motif de votre demande..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
            >
              {submitting ? (
                "Envoi en cours..."
              ) : (
                <>
                  <Send size={18} className="mr-2" /> Envoyer la demande
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PublicBooking;
